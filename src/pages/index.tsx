import { useState, useEffect, useMemo, useCallback, useContext, useRef } from 'react';
import styles from './index.module.scss';
import { Camera } from 'three'
import CovidGlobe from '~/components/CovidGlobe'


let Globe = () => null;
if (typeof window !== 'undefined') {
  Globe = require('react-globe.gl').default;
}

export default function Home() {
  const [countries, setCountries] = useState({ features: [] });
  const [size, setSize] = useState({ width: 0, height: 0 });

  const containerRef = useRef<HTMLDivElement | null>(null);


  const computeSize = useCallback(() => {
    if (containerRef.current) {
      console.log('client top:', containerRef.current?.offsetTop);
      setSize({ width: window.innerWidth, height: window.innerHeight - containerRef.current.offsetTop });
    } else {
      setSize({ width: window.innerWidth, height: window.innerHeight });
      setTimeout(computeSize, 1000);
    }

  }, []);
  useEffect(() => {
    window.addEventListener('resize', computeSize)
    setTimeout(computeSize, 1000);
  }, [computeSize]);

  useEffect(() => {
    // load data
    fetch('/data/ne_10m_admin_0_countries.simple.geojson.json').then(res => res.json()).then(setCountries);
  }, []);

  // GDP per capita (avoiding countries with small pop)
  const getVal = useCallback(
    ({ properties } : {properties: Record<string, any>}) => {
      return properties.GDP_MD_EST / Math.max(1e5, properties.POP_EST)
    }, []);

  const labelText = useCallback((country: Record<string, any>) => {
    const { properties: { ADM0_A3, iso3: code } } = country;
    const iso3 = code || ADM0_A3;
    return iso3
  }, [])

  const colorOf = useCallback((country: Record<string, any>) => {
    const { properties: { ADM0_A3, iso3: code } } = country;
    const iso3 = code || ADM0_A3;

    if (iso3 === 'MEX') {
      console.log('country:', country);
    }
    const numbers = iso3.split('').map(toNum);
    const color = `rgb(${numbers[0]},${numbers[1]},${numbers[2]})`;
    return color;
  }, []);

  const labelSize = useCallback((country: Record<string, any>) : number => {
    const { properties: { CONTINENT, REGION_WB } } = country;
    if (REGION_WB === "Middle East & North Africa" && CONTINENT === 'Asia') {
      return Number(conSize.get(REGION_WB));
    }
    if (REGION_WB === "Latin America & Caribbean") {
      return Number(conSize.get(REGION_WB));
    }
    return conSize.get(CONTINENT) || 2;
  }, []);

  return <div ref={containerRef}
              style={{ height: `calc(100vh - ${containerRef.current?.offsetTop || 0}px`, overflow: 'hidden' }}
              className={styles.globe}>{
    (!countries.features.length) || (typeof window === 'undefined') ? '' :
      <CovidGlobe features={countries.features} colorOf={colorOf} labelTextFn={labelText} labelSize={labelSize}/>
  }
  </div>


}

function toNum(str: string) {
  const lc = str.toLowerCase()
  const n = lc.charCodeAt(0);
  const offset = n - 'a'.charCodeAt(0);
  return Math.floor(255 * offset / 26);
}

const conSize = new Map([
  ['Europe', 1],
  ["Middle East & North Africa", 1.5],
  ['Asia', 1.8],
  ["Latin America & Caribbean", 1.25],
  ['Africa', 1.6],
  ['North America', 2.25],
  ['South America', 1.8]
]);
