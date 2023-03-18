import Inspector from "./Inspector";
import { Canvas } from '@react-three/fiber';
import { useEffect, useMemo } from "react";
import babbas from '~/lib/bebes.json'

let ThreeGlobe: unknown = null;

if (typeof window !== 'undefined') {
  ThreeGlobe = require('three-globe').default;
}

const moscow = { lat: 55, lon: 33 }

function longFn(country: { properties: { longitude: number } }) {
  return country.properties.longitude;
  // if (country.properties.iso3 == 'RUS') return moscow.lon;
  // const [lon, lat, lon2, lat2] = country.bbox;

  // return (lon + lon2)/ 2;
}

function latFn(country: { properties: { latitude: number } }) {
  return country.properties.latitude;
  //if (country.properties.iso3 == 'RUS') return moscow.lat;
  // const [lon, lat, lon2, lat2] = country.bbox;

  // return (lat + lat2)/ 2;
}

const CovidGlobe = ({
                      features,
                      labelTextFn,
                      resolution = 4,
                      colorOf,
                      labelSize,
                      currentTime = 0,
                    }: {
  features: Record<string, unknown>[],
  labelTextFn(arg: unknown) : string,
  labelSize(arg: unknown): number,
  resolution?: number,
  colorOf(arg: unknown) : string,
  currentTime?: number
}) => {
  /*
    const {
      $features,
      $resolution,
      colorOf,
      currentTime,
      $valueSeries,
      loading,
      stopLoading,
      loadIndex,
      toggleScope,
      scope,
      toggling,
    } = useContext(GlobeContext);
  */
  const globe = useMemo(() => {
    if (!ThreeGlobe) {
      return false;
    }
    // @ts-ignore
    return new ThreeGlobe({ animateIn: false })
      .hexPolygonResolution(resolution)
      .hexPolygonMargin(0)
      // .labelColor('black')
      //  .labelsData(features)
      // .labelLat(latFn)
      // .labelRotation(0)
      //.labelLng(longFn)
      // .labelIncludeDot(false)
      // .labelTypeFace(babbas)
      //  .labelAltitude(0.02)
      // .labelSize(labelSize)
      // .labelText(labelTextFn)
      .globeImageUrl('/img/earth-dark.jpg')
      .hexPolygonColor(colorOf);
  }, [features, resolution, ThreeGlobe]);

  useEffect(() => {
    if (globe && features.length) {
      globe.hexPolygonsData([...features])
    }
  }, [globe, currentTime, features]);

  return (
    <>

      <Canvas camera={{ fov: 60, position: [-20, -5, 180] }}>
        <ambientLight color="#cddbfe"/>
        <directionalLight color="#cddbfe"/>
        <pointLight position={[10, 10, 10]}/>
        {(
          <mesh>
            <Inspector>
              <primitive object={globe}/>
            </Inspector>
          </mesh>
        )}
      </Canvas>

    </>
  )
}

/**
 *
 *
 *       <div style={{ position: 'absolute', right: 0, top: 0 }}>
 *         <ValueSeries values={valueSeries}/>
 *       </div>
 *
 *       <TimeScale />
 *       <header className={styles.header}>
 *         <div className={styles.title}>
 *           <h1>Deaths from COVID-19 over time</h1>
 *           <p>Click play button at bottom of screen</p>
 *         </div>
 *         <section className={styles.scope}>
 *           <ScopeToggle scope={scope} toggle={toggleScope}></ScopeToggle>
 *         </section>
 *       </header>
 */
export default CovidGlobe;
