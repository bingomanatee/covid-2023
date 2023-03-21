import { useState, useEffect, useMemo, useRef, useContext } from 'react';
import styles from './index.module.scss';
import CovidGlobe from '~/components/CovidGlobe'
import CountryItem, { CountrySummary } from '~/lib/CountryItem'
import { valueToColor } from '~/lib/color'
import { Forest } from '@wonderlandlabs/forest'
import { Leaf } from '@wonderlandlabs/forest/lib/Leaf'
import { cloneDeep } from 'lodash'
import { GlobalStateContext } from '~/components/GlobalState'
import { Feature } from '~/types'
import  { Dayjs } from 'dayjs'

let Globe = () => null;
if (typeof window !== 'undefined') {
  Globe = require('react-globe.gl').default;
}

type HomeStateValue = {
  data: CountrySummary[],
  geodata: { features: Feature[] }
  unix: number
}

export default function Home() {
  const {value: globalValue, state: globalState } = useContext(GlobalStateContext);
  const state = useMemo(() => {
    const initial: HomeStateValue = {
      unix: 0,
      data: [],
      geodata: { features: [] }
    };

    return new Forest({
      $value: initial,
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
          const deaths = manager.deaths.valueAtDate(globalState.value.currentTime);
          const color = valueToColor(deaths, 'country');

          if (iso3 === 'USA') {
            console.log('deaths: ', deaths, 'currentTime:', globalValue.currentTime.toISOString(), 'color: ', color);
          }

          return color;
        },
        labelText(leaf: Leaf, country: Record<string, any>) {
          const { properties: { ADM0_A3, iso3: code } } = country;
          const iso3 = code || ADM0_A3;
          const manager = leaf.getMeta('countryManagers').get(iso3);
          if (!manager) {
            console.log('cannot get manager for ', iso3);
            return iso3
          }
          const deaths = manager.deaths.valueAtDate(globalState.value.currentTime);
          const label = `${iso3} - ${nf.format(deaths)} deaths`
          if (iso3 === 'USA') {
            // console.log('label for deaths: ', deaths, 'currentTime:', globalValue.currentTime.toString(), 'label: ', label);
          }
          return label
        },
        async loadData(leaf: Leaf) {
          const response = await fetch('/api/country_data');
          const json = await response.json();
          json.forEach((item: CountrySummary) => {
            const ci = new CountryItem(item);
            leaf.getMeta('countryManagers').set(ci.country.iso3, ci);
          });
          leaf.do.set_data(json);
        }
      },
      meta: {
        countryManagers: new Map(),
      }
    })
  }, []);

  const [value, setValue] = useState<HomeStateValue>(state.value);
  useEffect(() => {
    const sub = state.subscribe(setValue);
    state.do.loadData();
    state.do.loadCountries();

    return () => sub.unsubscribe();
  }, [state]);

  const containerRef = useRef<HTMLDivElement | null>(null);

  const unix = useMemo(() =>globalValue.currentTime?.unix() || 0, [globalValue.currentTime]);

  useEffect(() => {
    if (unix !== value.unix) {
      state.do.set_unix(unix);
    }
  }, [unix]);

  return <div ref={containerRef}
              style={{ height: `calc(100vh - ${containerRef.current?.offsetTop || 0}px`, overflow: 'hidden' }}
              className={styles.globe}>{
    (!value.geodata?.features?.length) || (!value.data?.length) || (typeof window === 'undefined') ? '' :
      <CovidGlobe
        features={state.getMeta('geodata') || []}
        colorOf={state.do.countryColor}
        labelTextFn={state.do.labelText}
        labelSize={labelSize} unix={unix}/>
  }
  </div>
}

const nf = new Intl.NumberFormat();

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

const conSize = new Map([
  ['Europe', 0.5],
  ["Middle East & North Africa", 0.75],
  ['Asia', 0.9],
  ["Latin America & Caribbean", 0.7],
  ['Africa', 0.75],
  ['North America', 1],
  ['South America', 0.75]
]);
