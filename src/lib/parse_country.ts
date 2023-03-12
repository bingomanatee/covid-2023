import { supabase } from '~/lib/supabase'
import { NextApiRequest, NextApiResponse } from 'next'
import { COUNTRY_DATA_URL, STATE_DATA_URL, KEY_NAMESPACE } from '~/pages/lib/const'
import { CsvService } from '~/lib/CsvService'
// @ts-ignore
import { v5 as uuidV5 } from 'uuid';

function isError(a: unknown): a is Error {
  return a instanceof Error;
}

type genObj = Record<string, any>;

let running = false;

const MAX_ROWS = 10000;
export default async function parse(
  dataUrl: string
) {

  let lineCount = 0;
  return new Promise((done, fail) => {
    const buffer: genObj[] = [];
    let locations = new Map<string, genObj>();

    async function saveLocations() {
      try {
        const result = await supabase.from('locations')
          .upsert(Array.from(locations.values()));
        console.log('saved ', locations.size, 'locations', result);
      } catch (err) {
        isError(err) && console.error('cannot save locations: ', err.message);
      }
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
    function writeRows(finish = false) {
      if (running && !finish) {
        return;
      }
      running = true;
      const data = finish ? buffer : (buffer.splice(0, MAX_ROWS));
      console.log('parsing ', data.length, 'rows of data');
      locations = data.reduce((memo: Map<string, genObj>, row) => {
        if (row.iso_alpha_3 && !memo.has(row.iso_alpha_3)) {
          let key;
          try {
            key = uuidV5(row.iso_alpha_3 + '-location', KEY_NAMESPACE);
          } catch (err) {
            if (err instanceof Error) {
              console.log('uuid error for location:', row.iso_alpha_3, err.message);
            }
            return memo;
          }

          memo.set(row.iso_alpha_3, {
            id: key,
            iso3: row.iso_alpha_3,
            admin1: row.administrative_area_level_1,
            admin2: row.administrative_area_level_2,
            admin3: row.administrative_area_level_3,
            population: row.population || 0,
            latitude: row.latitude || 0,
            longitude: row.longitude || 0,
            admin_level: row.administrative_area_level || 1,
          });
        }
        return memo;
      }, locations);
      running = false;
      if (finish) {
        return saveLocations();
      }
    }

    function addRecordToLocations(record: genObj) {
      buffer.push(record);
      if (buffer.length > MAX_ROWS && !running) {
        writeRows();
      }
    }


    const data: genObj = [];

    async function saveData(rows: any) {
      try {
        const result = await supabase.from('location_deaths')
          .upsert(rows);
        console.log('saved ', rows.length, 'data', result);
      } catch (err) {
        isError(err) && console.error('cannot save data: ', err.message);
      }
    }

    async function addRecordToData({ id, date, deaths, hosp, iso_alpha_3 }: genObj) {
      let key;
      try {
        key = uuidV5(`${id}-${date}-${iso_alpha_3}`, KEY_NAMESPACE);
      } catch (err) {
        if (err instanceof Error) {
          console.log('uuid error for id:', id, err.message);
        }
        return
      }

      const location = uuidV5(iso_alpha_3 + '-location', KEY_NAMESPACE);

      const row_data = {
        id: key,
        date,
        location,
        deaths: deaths || 0,
        hosp: hosp || 0
      }
      data.push(row_data);
      if (data.length > MAX_ROWS) {
        await saveData(data.splice(0, MAX_ROWS));
      }
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
        await Promise.all([
          writeRows(true),
          saveData(data)
        ]);
        done(null);
      }
    })
  });
}
