import Redis from "ioredis";

const redis = new Redis({ path: process.env.REDIS_ENDPOINT }); // Default port is 6379

import fs from "fs";
import path from "path";
import _ from "lodash";
import { supabase } from '~/lib/supabase'

const COUNTRY_KEY = "geojson/country";
const STATE_KEY = "geojson/state";

export class GeojsonService {

  async country() {
    const hasGeoJson = await redis.exists(COUNTRY_KEY);
    if (!hasGeoJson) {
      await this.genCountry();
    }
    const countries = await redis.get(COUNTRY_KEY);
    return countries ? JSON.parse(countries) : null;
  }

  async state() {
    const hasGeoJson = await redis.exists(STATE_KEY);
    if (!hasGeoJson) {
      await this.genState();
    }
    const states = await redis.get(STATE_KEY);
    return states ? JSON.parse(states) : null;
  }

  private async genState() {
    return new Promise((done, fail) => {
      fs.readFile(path.join(__dirname, "../data/ne_10m_admin_1_states_provinces.geojson.json"), async (err, buffer) => {
        if (err) {
          return fail(err);
        }
        const txt = buffer.toString();
        try {
          const json = JSON.parse(txt);
          await this.parseStateFeatures(json);
          done(true);
        } catch (err) {
          return fail(err);
        }
      });
    });
  }

  private async genCountry() {
    return new Promise((done, fail) => {
      fs.readFile(path.join(__dirname, "../data/ne_10m_admin_0_countries.geojson.json"), async (err, buffer) => {
        if (err) {
          return fail(err);
        }
        const txt = buffer.toString();
        try {
          const json = JSON.parse(txt);
          await this.parseCountryFeatures(json);
          done(true);
        } catch (err) {
          return fail(err);
        }
      });
    });
  }

  private async parseStateFeatures(json: Record<string, any>) {
    const stateAdmin2names = await this.prismaService.prisma.location.findMany({
      where: {
        level: 2
      },
      orderBy: [
        {
          iso3: "asc"
        },
        {
          admin2: "asc"
        }
      ],
      include: {
        shape_states: true
      }
    });

    const iso3map = stateAdmin2names.reduce((map, data) => {
      map.set(`${data.iso3} ${data.admin2}`, data);
      data.shape_states.forEach(shapeState => {
        map.set(`${shapeState.iso3} ${shapeState.name}`, data);
      })
      return map;
    }, new Map());

    json.features = _.sortBy(json.features, "properties.adm0_a3", "properties.name");

    json.features.forEach((feature: Record<string, any>) => {
      const { adm0_a3, name } = feature.properties;
      feature.properties = iso3map.get(`${adm0_a3} ${name}`) || feature.properties;
    });
    await redis.set(STATE_KEY, JSON.stringify(json));
    await redis.expire(STATE_KEY, 60 * 60 * 4);
  }

  private async parseCountryFeatures(json: Record<string, any>) {
    const { data: countryISO3codes } = await supabase.from('locations')
      .select()
      .eq('level', 1);

    if (!countryISO3codes) return;

    const iso3map = countryISO3codes.reduce((map: Map<string, any>, data: Record<string, any>) => {
      map.set(data.iso3, data);
      return map;
    }, new Map());

    json.features = json.features.filter((feature: Record<string, any>) => iso3map.has(feature.properties.ISO_A3));
    json.features.forEach((feature: Record<string, any>) => {
      feature.properties = iso3map.get(feature.properties.ISO_A3) || {};
    });
    await redis.set(COUNTRY_KEY, JSON.stringify(json));
    await redis.expire(COUNTRY_KEY, 60 * 60 * 4);
  }
}
