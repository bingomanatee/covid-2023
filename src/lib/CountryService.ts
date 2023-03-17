import dayjs, { Dayjs } from 'dayjs';
import { getSupabase } from '~/lib/supabase'
import getRedis from '~/pages/api/redis'
import { SupabaseClient } from '@supabase/supabase-js'
import Redis from 'ioredis'
import { HOURS_IN_MS } from '~/lib/const'
import { sortBy } from 'lodash'
import { Country } from '~/types'

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

      console.log('------- first item:', country.iso3, field, items[0]);
      console.log('------- last item:', country.iso3, field, items[items.length - 1]);

      const start = firstDay.toISOString();
      const out = { ...country, [field]: summary, start };
      await redis.set(REDIS_KEY, JSON.stringify(out), 'PX', HOURS_IN_MS * 8);
      return out;
    } else {
      return { ...country, [field]: [], start: '' }
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

  static async countryInfo({ iso3, id }: { iso3?: string, id?: string }): Promise<CountryInfo> {
    const supabase = getSupabase();
    const redis = getRedis();
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

    return { country, deaths: deaths || null, hosp: hosp || null };
  }

}

