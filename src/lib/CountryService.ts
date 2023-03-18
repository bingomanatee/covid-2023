import dayjs, { Dayjs } from 'dayjs';
import { getSupabase } from '~/lib/supabase'
import getRedis from '~/pages/api/redis'
import { SupabaseClient } from '@supabase/supabase-js'
import Redis from 'ioredis'
import { HOURS_IN_MS } from '~/lib/const'
import { chunk, sortBy } from 'lodash'
import { Country } from '~/types'
import { NextApiResponse } from 'next'

type summaryField = 'deaths' | 'hosp'

export type CountrySummary = {
  start: string,
  deaths?: number[]
  hosp?: number[]
} & Country;

export type CountryInfo = {
  country: Country | null,
  deaths: CountrySummary | null,
  hosp: CountrySummary | null
}

export class CountryService {

  static async summary(field: summaryField = 'deaths') {
    const supabase = getSupabase();
    const redis = getRedis();
    const { data: countries } = await supabase.from('locations')
      .select()
      .eq('admin_level', 1);

    if (countries) {
      for (const country of countries) {
        console.log('summarizing', country.id, country.iso3);
        await CountryService.summarize(country as Country, field, supabase, redis);
      }
    } else {
      console.log('---- summary: no countries');
    }

    return countries;
  }

  private static async summarize(country: Country, field: summaryField,
                                 supabase: SupabaseClient<any, 'public', any>,
                                 redis: Redis): Promise<CountrySummary> {
    const REDIS_KEY = `SUMMARY/${country.id}/${field}`;
    const cached = await redis.get(REDIS_KEY);
    if (cached) {
      return JSON.parse(cached);
    }
    console.log('summarize: generating ', REDIS_KEY);

    type row = { location: string, date: string } & Record<string, any>;
    // @ts-ignore
    const { data, error }: { data: row[] | null, error: unknown } = await supabase.from('location_deaths')
      .select()
      .eq('location', country.id)
      .gt(field, 0)
      .limit(1000)
      .order('date');

    if (!error && Array.isArray(data) && data.length) {
      let items: row[] = data;

      let more: row[] = [];
      do {
        const { data, error } = await supabase.from('location_deaths')
          .select()
          .eq('location', country.id)
          .gt(field, 0)
          .gt('date', items[items.length - 1].date)
          .limit(1000)
          .order('date');
        if (error) {
          break;
        }
        if (data && Array.isArray(data)) {
          more = data as row[];
          items = items.concat(more);
        } else {
          break;
        }
      } while (more.length);

      const firstDay = dayjs(items[0].date);
      const summary = items.reduce((list: number[], item: Record<string, any>) => {
        const offset = dayjs(item.date).diff(firstDay, 'd');
        const value = item[field];
        while (list.length < offset) {
          list.push(value);
        }
        return list;
      }, []);

      const start = firstDay.toISOString();
      const out = { ...country, [field]: summary, start };
      await redis.set(REDIS_KEY, JSON.stringify(out), 'PX', HOURS_IN_MS * 8);
      return out;
    } else {
      const out = { ...country, [field]: [], start: '' };
      await redis.set(REDIS_KEY, JSON.stringify(out), 'PX', HOURS_IN_MS * 8);
      return out;
    }
  }

  static async countries() {
    const { data, error } = await getSupabase()
      .from('locations').select()
      .eq('admin_level', 1);
    if (error) {
      throw error;
    }
    return Array.isArray(data) ? sortBy(data, 'iso3') : []
  }

  static async countryInfo({
                             iso3,
                             id
                           }: { iso3?: string, id?: string },
                           supabase?: SupabaseClient | undefined,
                           redis?: Redis | undefined
  ):
    Promise<CountryInfo> {
    if (!supabase) {
      supabase = getSupabase();
    }
    if (!redis) {
      redis = getRedis();
    }
    if (id) {
      const REDIS_KEY = `SUMMARY/${id}/summation`;
      const cached = await redis.get(REDIS_KEY);
      if (cached) {
        return JSON.parse(cached);
      }
    }

    let country: Country | undefined;
    if (!id && iso3) {
      const { data, error } = await supabase.from('locations')
        .select()
        .eq('iso3', iso3)
        .eq('admin_level', 1)
        .range(0, 0);
      if (error) {
        throw error;
      }
      country = data?.[0] as Country;
      id = country?.id;
    } else if (id) {
      const { data, error } = await supabase.from('locations')
        .select()
        .eq('id', id);
      if (error) {
        throw error;
      }
      if (!data?.length) {
        throw new Error('no country with id = ' + id);
      }
      country = data?.[0] as Country;
    }

    if (!country) {
      throw new Error(`cannot find country ${id}/${iso3}`);
    }

    const result = await Promise.all(
      [
        CountryService.summarize(country, 'deaths', supabase, redis),
        CountryService.summarize(country, 'hosp', supabase, redis),
      ]);
    const [deaths, hosp] = result;

    const summaryData = { country, deaths: deaths || null, hosp: hosp || null };
    const REDIS_KEY = `SUMMARY/${id}/summation`;
    await redis.set(REDIS_KEY, JSON.stringify(summaryData));

    return summaryData;
  }


  public static async streamCountry(res: NextApiResponse) {

    const supabase = getSupabase();
    const redis = getRedis();
    res.writeHead(200, {
      'Content-Type': 'application/json'
    });

    const { data: countries, error } = await supabase.from('locations')
      .select()
      .eq('admin_level', 1);
    if (!countries || error) {
      throw error || Error('no countries');
    }

    res.write('[');
    let written = false;

    const chunks: Country[][] = chunk(countries as Country[], 25);

    for (const chunk of chunks) {
      const pipe = redis.pipeline();
      chunk.forEach((country: Country) => {
        pipe.get(`SUMMARY/${country.id}/summation`);
      });

      const result = await pipe.exec();
      console.log('result of ', chunk.slice(0, 2), 'is', result?.slice(0, 2));
      let index = 0;
      if (result) {
        for (const [_err, data] of result) {
          if (!data) {
            console.log('no data for', index, 'error is ', _err);
            const country = chunk[index];
            const countryData: CountryInfo = await CountryService.countryInfo(country, supabase, redis);
            if (written) {
              res.write(',' + JSON.stringify(countryData));
            } else {
              res.write(JSON.stringify(countryData));
            }

            written = true;
          } else {
            if (written) {
              res.write(',' + data);
            } else {
              res.write(data);
            }

            written = true;
          }
          ++index;
        }
      } else {
        for (const country of chunk) {
          const countryData: CountryInfo = await CountryService.countryInfo(country, supabase, redis);
          if (written) {
            res.write(',' + JSON.stringify(countryData));
          } else {
            res.write(JSON.stringify(countryData));
          }

          written = true;
        }
      }

    }
    res.write(']');

    res.end();
  }
}
