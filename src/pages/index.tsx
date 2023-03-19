import { useState, useEffect, useMemo, useRef } from 'react';
import styles from './index.module.scss';
import CovidGlobe from '~/components/CovidGlobe'
import CountryItem from '~/lib/CountryItem'
import { valueToColor } from '~/lib/color'
import { Forest } from '@wonderlandlabs/forest'
import { Leaf } from '@wonderlandlabs/forest/lib/Leaf'
import {castDraft} from 'immer';
import { cloneDeep } from 'lodash'

let Globe = () => null;
if (typeof window !== 'undefined') {
  Globe = require('react-globe.gl').default;
}

export default function Home() {

  const dataManager = useMemo(() => new Forest({
    $value: {
      data: [],
      geodata: {},
    },
    actions: {
      async loadCountries(leaf: Leaf) {
        const response = await fetch('/data/ne_10m_admin_0_countries.simple.geojson.json');
        const json = await response.json();
        leaf.do.set_geodata(json);
        leaf.setMeta('geodata', cloneDeep(json.features));
      },

      countryColor(leaf: Leaf, country: Record<string, any>) {
        const { properties: { ADM0_A3, iso3: code } } = country;
        const iso3 = code || ADM0_A3;

        const manager = leaf.getMeta('countryManagers').get(iso3);
        if (!manager) {
          console.log('cannot get manager for ', iso3);
          return 'black';
        }
        const deaths = manager.deaths.valueAtDate(colorDate);
        return valueToColor(deaths, 'country');
      },
     labelText(leaf: Leaf, country: Record<string, any>) {
        const { properties: { ADM0_A3, iso3: code } } = country;
        const iso3 = code || ADM0_A3;
        const manager = leaf.getMeta('countryManagers').get(iso3);
        if (!manager) {
          console.log('cannot get manager for ', iso3);
          return iso3
        }
        const deaths = manager.deaths.valueAtDate(colorDate);
        return `${iso3} - ${nf.format(deaths)} deaths`
        return iso3
      },
      async loadData(leaf: Leaf) {
        const response = await fetch('/api/country_data');
        const json = await response.json();
        json.forEach((item) => {
          const ci = new CountryItem(item);
          leaf.getMeta('countryManagers').set(ci.country.iso3, ci);
        });
        leaf.do.set_data(json);
      }
    },
    meta: {
      countryManagers: new Map(),
    }
  }), []);

  const [value, setValue] = useState({});
  useEffect(() => {
    const sub = dataManager.subscribe(setValue);
    dataManager.do.loadData();
    dataManager.do.loadCountries();

    return () => sub.unsubscribe();
  }, [dataManager]);

  const containerRef = useRef<HTMLDivElement | null>(null);
  /*
    console.log('data manager meta: ', dataManager.getMeta('countryManagers'));

    const [countries, setCountries] = useState({ features: [] });

    const [data, setData] = useState<CountrySummary[]>([]);
    const [countryManagers, setCountryManagers] = useState<Map<string, CountryItem>>(new Map());


    useEffect(() => {
      // load data
      fetch('/data/ne_10m_admin_0_countries.simple.geojson.json')
        .then((res: Response) => res.json())
        .then(setCountries);
      fetch('/api/country_data')
        .then((res: Response) => res.json())
        .then(setData);
    }, []);

    useEffect(() => {
      const map = new Map();
      console.log('data is', data);
      data.forEach((item) => {
        const ci = new CountryItem(item);
       // console.log('ci is', ci);
        map.set(ci.country.iso3, ci);
      });

      setCountryManagers(map);
    }, [data])
    */

  const colorDate = new Date(2022, 0, 1).toISOString();

  const countryColor = (country: Record<string, any>) => {
    const { properties: { ADM0_A3, iso3: code } } = country;
    const iso3 = code || ADM0_A3;

    const manager = countryManagers.get(iso3);
    if (!manager) {
      console.log('cannot get manager for ', iso3);
      return 'black';
    }
    const deaths = manager.deaths.valueAtDate(colorDate);
    return valueToColor(deaths, 'country');
  }

  return <div ref={containerRef}
              style={{ height: `calc(100vh - ${containerRef.current?.offsetTop || 0}px`, overflow: 'hidden' }}
              className={styles.globe}>{
    (!value.geodata?.features?.length) || (!value.data?.length) || (typeof window === 'undefined') ? '' :
      <CovidGlobe features={dataManager.getMeta('geodata') || []} colorOf={dataManager.do.countryColor} labelTextFn={dataManager.do.labelText} labelSize={labelSize}/>
  }
  </div>
}

const nf = new Intl.NumberFormat();


/*  if (iso3 === 'MEX') {
    console.log('country:', country);
  }
  const numbers = iso3.split('').map(toNum);
  const color = `rgb(${numbers[0]},${numbers[1]},${numbers[2]})`;
  return color;*/

const labelSize = (country: Record<string, any>): number => {
  const { properties: { CONTINENT, REGION_WB } } = country;
  if (REGION_WB === "Middle East & North Africa" && CONTINENT === 'Asia') {
    return Number(conSize.get(REGION_WB));
  }
  if (REGION_WB === "Latin America & Caribbean") {
    return Number(conSize.get(REGION_WB));
  }
  return conSize.get(CONTINENT) || 1;
}

function toNum(str: string) {
  const lc = str.toLowerCase()
  const n = lc.charCodeAt(0);
  const offset = n - 'a'.charCodeAt(0);
  return Math.floor(255 * offset / 26);
}

const conSize = new Map([
  ['Europe', 0.5],
  ["Middle East & North Africa", 0.75],
  ['Asia', 0.9],
  ["Latin America & Caribbean", 0.7],
  ['Africa', 0.75],
  ['North America', 1],
  ['South America', 0.75]
]);
