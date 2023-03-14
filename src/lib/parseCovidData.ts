import { getSupabase, locationId, t } from '~/lib/supabase'
import { KEY_NAMESPACE } from '~/lib/const'
import { CsvService } from '~/lib/CsvService'
// @ts-ignore
import { v5 as uuidV5 } from 'uuid';
import { isError } from '~/utils'

type genObj = Record<string, any>;

const running = false;

const MAX_ROWS = 5000;
const SAVE_ROWS = 400;
export default async function parse(
  dataUrl: string, level: number
) {
  const startTime = Date.now();
  const supabase = getSupabase();

  const supabasePools = [getSupabase(), getSupabase(), getSupabase(), getSupabase(), getSupabase(), getSupabase(), getSupabase(), getSupabase(), getSupabase(), getSupabase(), getSupabase(), getSupabase()];

  let lineCount = 0;
  return new Promise((done, fail) => {
    const buffer: genObj[] = [];
    const locations = new Map<string, genObj>();

    async function saveLocations() {
      try {
        const result = await supabase.from('locations')
          .upsert(Array.from(locations.values()));
        console.log('saved ', locations.size, 'locations', result);
      } catch (err) {
        isError(err) && console.error('cannot save locations: ', err.message);
      }
    }

    function addRecordToLocations(row: genObj) {
      buffer.push(row);
      if (!(buffer.length % MAX_ROWS)) {
        console.log(buffer.length, 'rows parsed');
      }

      const key = locationId(row.iso_alpha_3, row.administrative_area_level_2);
      if (!locations.has(key)) {
        const data = {
          id: key,
          iso3: t(row.iso_alpha_3),
          admin1: t(row.administrative_area_level_1),
          admin2: t( row.administrative_area_level_2),
          admin3: t(row.administrative_area_level_3),
          population: row.population || 0,
          latitude: row.latitude || 0,
          longitude: row.longitude || 0,
          admin_level: row.administrative_area_level || 1,
        }

        console.log('setting location for ',
          row.iso_alpha_3,
          row.administrative_area_level_2,
          'as',
          key,
          data,
        );

        locations.set(key, data);
      }
    }

    let data: genObj = [];

    async function saveDeathData() {
      if (!supabasePools.length) {
        return;
      }
      // iterate to maximize pool saveDeathData();
      const start = Date.now();
      const supabase = supabasePools.pop();
      if (!supabase) {
        return;
      }
      const rows = data.splice(0, SAVE_ROWS);
      try {
        const result = await supabase.from('location_deaths')
          .upsert(rows);

        console.log('saved ', rows.length, 'death data', result);

        if (result.error) {
          if (/Bad Gateway/.test(result.error.message)) {
            data = data.concat(rows);
            console.log('resetting supabase');
            setTimeout(() => {
              supabasePools.push(getSupabase());
              saveDeathData();
            }, 500);
          } else {
            console.log('---- bad save attempt ----', result.error.message);
            throw result.error;
          }
        }

        const duration = (Date.now() - start) / 1000;
        console.log('saved', rows.length, 'rows in ', duration, 'seconds', rows.length / duration, 'records/second', data.length, 'rows remaining');

      } catch (err) {
        isError(err) && console.error('cannot save data: ', err.message);
        throw err;
      }
      supabasePools.unshift(supabase);
      if (data.length) {
        saveDeathData();
      } else {
        const totalDur = (Date.now() - startTime) / 1000;
        console.log('total time: ', totalDur, 'seconds ', lineCount / totalDur, 'overall records/second');
      }
    }

    async function addRecordToData({
                                     id,
                                     date,
                                     deaths,
                                     hosp,
                                     iso_alpha_3,
                                     administrative_area_level_2,
                                     administrative_area_level
                                   }: genObj) {
      if (!(deaths || hosp) || !iso_alpha_3) {
        return;
      }

      let key;
      try {
        key = uuidV5(`${id}-${date}-${iso_alpha_3}`, KEY_NAMESPACE);
      } catch (err) {
        if (err instanceof Error) {
          console.log('uuid error for id:', id, err.message);
        }
        return
      }

      const location = locationId(iso_alpha_3, administrative_area_level_2);

      const row_data = {
        id: key,
        date,
        location,
        deaths: deaths || 0,
        hosp: hosp || 0,
        admin_level: administrative_area_level || 1,

      }
      data.push(row_data);
    }

    CsvService.readCsvFile(dataUrl, {
      cast: true,
      onData: (row: unknown) => {
        return row;
      },
      onRecord: (record: genObj) => {
        ++lineCount;
        addRecordToLocations(record);
        addRecordToData(record);
      },
      onError: fail,
      onEnd: async () => {

        try {
          await saveLocations();
        } catch (err) {
          console.log('location data error', err);
        }
        try {
          saveDeathData();
        } catch (err) {
          console.log('death data error', err);
        }
        done(null);
      }
    })
  });
}


/**
 * sample:
 * got record: {
 *   id: 'f1559d46',
 *   date: 2021-09-17T00:00:00.000Z,
 *   confirmed: 1448792,
 *   deaths: 15124,
 *   recovered: '',
 *   tests: 13221709,
 *   vaccines: 43342103,
 *   people_vaccinated: 28436015,
 *   people_fully_vaccinated: 14285995,
 *   hosp: '',
 *   icu: '',
 *   vent: '',
 *   school_closing: -3,
 *   workplace_closing: -2,
 *   cancel_events: -2,
 *   gatherings_restrictions: -3,
 *   transport_closing: 0,
 *   stay_home_restrictions: -2,
 *   internal_movement_restrictions: -2,
 *   international_movement_restrictions: 2,
 *   information_campaigns: 1,
 *   testing_policy: 2,
 *   contact_tracing: 2,
 *   facial_coverings: 3,
 *   vaccination_policy: 4,
 *   elderly_people_protection: 1,
 *   government_response_index: 62.55,
 *   stringency_index: 55.09,
 *   containment_health_index: 60.77,
 *   economic_support_index: 75,
 *   administrative_area_level: 1,
 *   administrative_area_level_1: 'Thailand',
 *   administrative_area_level_2: '',
 *   administrative_area_level_3: '',
 *   latitude: 15,
 *   longitude: 101,
 *   population: 69428524,
 *   iso_alpha_3: 'THA',
 *   iso_alpha_2: 'TH',
 *   iso_numeric: 764,
 *   iso_currency: 'THB',
 *   key_local: '',
 *   key_google_mobility: 'ChIJsU1CR_eNTTARAuhXB4gs154',
 *   key_apple_mobility: 'Thailand',
 *   key_jhu_csse: 'TH',
 *   key_nuts: '',
 *   key_gadm: 'THA'
 * }
 * got record: {
 *   id: '0cee3803',
 *   date: 2022-01-08T00:00:00.000Z,
 *   confirmed: 306755,
 *   deaths: 4117,
 *   recovered: '',
 *   tests: '',
 *   vaccines: '',
 *   people_vaccinated: '',
 *   people_fully_vaccinated: '',
 *   hosp: '',
 *   icu: '',
 *   vent: '',
 *   school_closing: 1,
 *   workplace_closing: 1,
 *   cancel_events: 2,
 *   gatherings_restrictions: 4,
 *   transport_closing: 0,
 *   stay_home_restrictions: 0,
 *   internal_movement_restrictions: 0,
 *   international_movement_restrictions: 4,
 *   information_campaigns: 2,
 *   testing_policy: 3,
 *   contact_tracing: 2,
 *   facial_coverings: 1,
 *   vaccination_policy: 5,
 *   elderly_people_protection: 0,
 *   government_response_index: 49.48,
 *   stringency_index: 51.85,
 *   containment_health_index: 56.55,
 *   economic_support_index: 0,
 *   administrative_area_level: 1,
 *   administrative_area_level_1: 'Oman',
 *   administrative_area_level_2: '',
 *   administrative_area_level_3: '',
 *   latitude: 21,
 *   longitude: 57,
 *   population: 4829483,
 *   iso_alpha_3: 'OMN',
 *   iso_alpha_2: 'OM',
 *   iso_numeric: 512,
 *   iso_currency: 'OMR',
 *   key_local: '',
 *   key_google_mobility: 'ChIJv5vVqWaf1j0RF6ixZXZMBjo',
 *   key_apple_mobility: '',
 *   key_jhu_csse: 'OM',
 *   key_nuts: '',
 *   key_gadm: 'OMN'
 * }
 */
