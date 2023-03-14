import dayjs, { Dayjs } from 'dayjs';
import { getSupabase } from '~/lib/supabase'
import getRedis from '~/pages/api/redis'
import { SupabaseClient } from '@supabase/supabase-js'
import Redis from 'ioredis'
import { HOURS_IN_MS } from '~/lib/const'

export class CountryService {

  static async summary(field = 'deaths') {
    const supabase = getSupabase();
    const redis = getRedis();
    const { data: countries } = await supabase.from('locations')
      .select()
      .eq('admin_level', 1);

    if (countries) {
      for (const country of countries) {
        console.log('summarizing', country.id, country.iso3);
        await CountryService.summarize(country, field, supabase, redis);
      }
    } else {
      console.log('---- summary: no countries');
    }

    return countries;
  }

  private static async summarize(country: Record<string, any>, field: string,
                                 supabase: SupabaseClient<any, 'public', any>,
                                 redis: Redis) {
    const REDIS_KEY = `SUMMARY/${country.id}/${field}`;
    const cached = await redis.get(REDIS_KEY);
    /*    if (cached) {
          return JSON.parse(cached);
        }*/
    console.log('CountryService: summarize for ', country.iso3);

    type row = { location: string, date: string } & Record<string, any>;
    // @ts-ignore
    const { data }: { data: row[] | null } = await supabase.from('location_deaths')
      .select(`${field},location,date`)
      .eq('location', country.id)
      .gt(field, 0)
      .limit(2000)
      .order('date');

    if (Array.isArray(data) && data.length) {
      let items: row[] = data;
      let lastDate = data[data.length - 1]?.date;
      do {
        const { data: newData } = await supabase.from('location_deaths')
          .select(`${field},location,date`)
          .eq('location', country.id)
          .gt(field, 0)
          .range(items.length, items.length + 2000)
          .order('date').limit(2000);
        if (Array.isArray(newData) && newData.length) {
          // @ts-ignore
          items = [...items, ...newData];
        } else {
          console.log('ending loop - no dates > ', lastDate);
          break;
        }
        lastDate = items[items.length - 1]?.date;
      } while (lastDate);

      console.log('summarizing ', country.id, country.name, 'count:', items.length);
      let firstDay: Dayjs | undefined;
      const summary = items.reduce((list: number[], item: Record<string, any>) => {
        if (!firstDay) {
          firstDay = dayjs(item.date);
        }
        const offset = dayjs(item.date).diff(firstDay, 'd');
        const value = item[field];
        while (list.length < offset) {
          list.push(value);
        }
        return list;
      }, []);
      const start = firstDay && firstDay.unix();
      const out = { ...country, [field]: summary, start };
      await redis.set(REDIS_KEY, JSON.stringify(out), 'PX', HOURS_IN_MS * 8);
    } else {
      console.log('no data for ', field, 'for', country.iso3);
    }
  }
}

