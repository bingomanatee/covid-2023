import getRedis from '~/pages/api/redis'

import Redis from 'ioredis'
import { NextApiResponse } from 'next'

const COUNTRY_KEY = "geojson/country";
const STATE_KEY = "geojson/state";
const FEATURE_STANDIN = 'feature-standin';
import { chunk } from 'lodash';
import { getSupabase } from '~/lib/supabase'

export class GeoJsonService {

  static async country(host: string) {
    const redis = getRedis();
    const hasGeoJson = await redis.exists(COUNTRY_KEY);
    if (!hasGeoJson) {
      await GeoJsonService.genCountry(host, redis);
    }
    const countries = await redis.get(COUNTRY_KEY);
    return countries ? JSON.parse(countries) : null;
  }

  static async state(host: string) {
    const redis = getRedis();
    const hasGeoJson = await redis.exists(STATE_KEY);

    if (!hasGeoJson) {
      await GeoJsonService.genState(host, redis);
    }
    const states = await redis.get(STATE_KEY);
    return states ? JSON.parse(states) : null;
  }

  static async genState(host: string, redis?: Redis) {
    const url = host + '/data/ne_10m_admin_1_states_provinces.geojson.json';
    const response = await fetch(url);
    const json = await response.json();

    console.log('state data:, ', JSON.stringify(json).substring(0, 1000))
    await GeoJsonService.parseStateFeatures(json, redis);
  }

  static async genCountry(host: string, redisConn?: Redis) {
    const url = host + '/data/ne_10m_admin_0_countries.geojson.json';
    console.log('-- getting', url);
    const response = await fetch(url);
    const json = await response.json();
    console.log('--- data gotten', JSON.stringify(json).substring(0, 1000));
    await GeoJsonService.parseCountryFeatures(json, redisConn);
  }

  private static async parseStateFeatures(json: Record<string, any>, redisConn?: Redis) {
    const redis = redisConn || getRedis();
    const supabase = getSupabase();
    const { data: shapeStates } = await supabase.from('shape_states').select();

    const iso3map = new Map();

    const { data: locations } = await supabase.from('locations').select();

    const locMap = locations?.reduce((memo: Map<string, any>, loc: Record<string, any>) => {
      const key = `${loc.iso3} ${loc.admin2}`;
      memo.set(key, loc);
      return memo;
    }, new Map()) || new Map();

    if (shapeStates) {
      for (const shapeState of shapeStates) {
        const key = `${shapeState.iso3} ${shapeState.admin2}`;
        if (!locMap.has(key)) {
          continue;
        }
        const location = locMap.get(key);
        iso3map.set(`${shapeState.iso3} ${shapeState.name}`, location);
      }
    }

    console.log('parsing features');

    json.features.forEach((feature: Record<string, any>) => {

      const { adm0_a3, name } = feature.properties;
      const key = `${adm0_a3} ${name}`
      feature.properties = iso3map.get(key) || GeoJsonService.reduceProps(feature.properties);
      if (feature.geometry?.coordinates) {
        feature.geometry = GeoJsonService.slimCoords(feature.geometry);
      }
      GeoJsonService.enqueueRedis(feature, key, redis);
    });

    console.log('---- features enqueued');

    json.features = [FEATURE_STANDIN];

    await redis.set(STATE_KEY, JSON.stringify(json));
    await redis.expire(STATE_KEY, 60 * 60 * 4);
  }

  private static slimCoords(listOrItem: unknown): any {
    if (Array.isArray(listOrItem)) {
      return listOrItem.map((inner) => GeoJsonService.slimCoords(inner))
    } else if (typeof listOrItem === 'number') {
      return Number(Number(listOrItem).toFixed(2));
    } else if (listOrItem && typeof listOrItem === 'object') {
      Object.keys(listOrItem).forEach((key: string) => {
        // @ts-ignore
        listOrItem[key] = GeoJsonService.slimCoords(listOrItem[key]);
      })
    }
    return listOrItem;
  }

  private static reduceProps({ adm0_a3, name }: Record<string, any>) {
    return { adm0_a3, name };
  }

  private static queuedFeatures: wrProps[] = [];
  private static running?: Record<string, any> = { time: 0, running: true };

  private static enqueueRedis(feature: Record<string, any>, key: string, redis: Redis) {
    if (/Mont/.test(key)) {
      console.log('writing feature', key, JSON.stringify(feature));
    }
    GeoJsonService.queuedFeatures.push({ feature, key, redis });
    GeoJsonService.tryToDequeue();
  }

  private static async tryToDequeue() {
    if (GeoJsonService.queuedFeatures.length && (GeoJsonService.running?.time || 0) + 5000 < Date.now()) {
      const next: wrProps[] = GeoJsonService.queuedFeatures.splice(0, 50);
      if (next.length) {
        return GeoJsonService.writeRedisItems(next);
      }
    }
  }

  public static async streamState(res: NextApiResponse) {
    const redis = getRedis();
    res.writeHead(200, {
      'Content-Type': 'application/json'
    });

    const stateRoot = await redis.get(STATE_KEY)
    if (!stateRoot) {
      throw new Error('no state');
    }
    const parts = stateRoot.split(`"${FEATURE_STANDIN}"`);

    res.write(parts.shift());

    const keys = await redis.keys(STATE_KEY + '/features/*');

    let written = false;
    const chunkedKeys = chunk(keys, 20);

    for (const chunked of chunkedKeys) {
      const process = redis.pipeline();
      chunked.forEach((key) => {
        process.get(key);
      });
      const exec = await process.exec();
      if (!written) {
        console.log('exec:', exec);
      }
      if (Array.isArray(exec)) {
        const data = exec.map(([_err, item]) => item).filter(a => !!a);
        if (!(Array.isArray(data) && data.length)) {
          continue;
        }
        if (written) {
          res.write(',' + data.join(','));
        } else {
          res.write(data.join(','));
        }

        written = true;
      }
    }

    while (parts.length) {
      res.write(parts.shift());
    }
    console.log('finished');
    res.end();
  }

  private static async writeRedisItems(items: wrProps[]): Promise<any> {
    const running = { time: Date.now(), running: true }
    GeoJsonService.running = running

    const pipeline = items[0].redis.pipeline();
    items.forEach((item) => {
      pipeline.set((STATE_KEY + '/features/' + item.key), JSON.stringify(item.feature));
    });

    await pipeline.exec();

    console.log('wrote features starting with ', items[0].key);
    if (GeoJsonService.running === running) {
      GeoJsonService.running = undefined;
    }
    return GeoJsonService.tryToDequeue();
  }

  private static async parseCountryFeatures(json: Record<string, any>, redisConn?: Redis) {
    const redis = redisConn || getRedis();
    const supabase = getSupabase();
    const { data: countryISO3codes } = await supabase.from('locations')
      .select()
      .eq('admin_level', 1);

    if (!countryISO3codes) {
      console.log('no iso3 codes');
      return;
    }

    const iso3map = countryISO3codes.reduce((map: Map<string, any>, data: Record<string, any>) => {
      map.set(data.iso3, data);
      return map;
    }, new Map());

    console.log('countries:', Array.from(iso3map.keys()).slice(0, 10));

    json.features = json.features.filter((feature: Record<string, any>) => iso3map.has(feature.properties.ISO_A3));
    json.features.forEach((feature: Record<string, any>) => {
      feature.properties = iso3map.get(feature.properties.ISO_A3) || {};
    });
    await redis.set(COUNTRY_KEY, JSON.stringify(json));
    await redis.expire(COUNTRY_KEY, 60 * 60 * 4);
  }
}

type wrProps = {
  feature: Record<string, any>,
  key: string,
  redis: Redis
}
