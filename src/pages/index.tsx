import { useState, useEffect, useMemo } from 'react';
import d3, { interpolateYlOrRd, scaleSequentialSqrt } from 'd3';
import dynamic from 'next/dynamic'

let Globe =  () => null;
if (typeof window !== 'undefined') Globe = require('react-globe.gl').default;

export default function Home() {
  const [countries, setCountries] = useState({ features: [] });
  const [hoverD, setHoverD] = useState();

  useEffect(() => {
    // load data
    fetch('/data/ne_10m_admin_0_countries.geojson.json').then(res => res.json()).then(setCountries);
  }, []);

  console.log('countries:', countries);
  const colorScale = scaleSequentialSqrt(interpolateYlOrRd);

  // GDP per capita (avoiding countries with small pop)
  const getVal = (feat) => feat.properties.GDP_MD_EST / Math.max(1e5, feat.properties.POP_EST);

  const maxVal = useMemo(
    () => Math.max(...countries.features.map(getVal)),
    [countries]
  );
  colorScale.domain([0, maxVal]);

  console.log('globe: ', Globe);

  return <Globe
    globeImageUrl="//unpkg.com/three-globe/example/img/earth-night.jpg"
    backgroundImageUrl="//unpkg.com/three-globe/example/img/night-sky.png"
    lineHoverPrecision={0}

    polygonsData={countries.features.filter(d => d.properties.ISO_A2 !== 'AQ')}
    polygonAltitude={d => d === hoverD ? 0.12 : 0.06}
    polygonCapColor={d => d === hoverD ? 'steelblue' : colorScale(getVal(d))}
    polygonSideColor={() => 'rgba(0, 100, 0, 0.15)'}
    polygonStrokeColor={() => '#111'}
    polygonLabel={({ properties: d }) => `
        <b>${d.ADMIN} (${d.ISO_A2}):</b> <br />
        GDP: <i>${d.GDP_MD_EST}</i> M$<br/>
        Population: <i>${d.POP_EST}</i>
      `}
    onPolygonHover={setHoverD}
    polygonsTransitionDuration={300}
  />;


}
