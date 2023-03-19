import Inspector from "./Inspector";
import { Canvas } from '@react-three/fiber';
import { useContext, useEffect, useMemo, useRef } from "react";
import babbas from '~/lib/bebes.json'
import { GlobalStateContext } from '~/components/GlobalState'

let ThreeGlobe: unknown = null;

if (typeof window !== 'undefined') {
  ThreeGlobe = require('three-globe').default;
}

function longFn(country: { properties: { longitude: number } }) {
  return country.properties.longitude;
}

function latFn(country: { properties: { latitude: number } }) {
  return country.properties.latitude;
}

const CovidGlobe = ({
                      features,
                      labelTextFn,
                      resolution = 3,
                      colorOf,
                      labelSize,
                      currentTime = 0,
                    }: {
  features: Record<string, unknown>[],
  labelTextFn(arg: unknown): string,
  labelSize(arg: unknown): number,
  resolution?: number,
  colorOf(arg: unknown): string,
  currentTime?: number
}) => {
  const {
    value: { zoom, height }
  } = useContext(GlobalStateContext);

  const globe = useMemo(() => {
    if (!ThreeGlobe) {
      return false;
    }
    // @ts-ignore
    return new ThreeGlobe({ animateIn: false })
      .hexPolygonResolution(resolution)
      .hexPolygonMargin(0)
      .labelColor('black')
      .labelsData(features)
      .labelLat(latFn)
      .labelRotation(0)
      .labelLng(longFn)
      .labelIncludeDot(false)
      .labelTypeFace(babbas)
      .labelAltitude(0.02)
      .labelSize(labelSize)
      .labelText(labelTextFn)
      .globeImageUrl('/img/earth-dark-grey.png')
      .hexPolygonColor(colorOf);
  }, [features, resolution, ThreeGlobe]);

  useEffect(() => {
    if (globe && features.length) {
      globe.hexPolygonsData([...features])
    }
  }, [globe, currentTime, features]);

  const position = useMemo(() => ([-20, height, -zoom]), [zoom, height]);

  return (
    <>
      <Canvas camera={{fov: 40}}>
        <ambientLight color="#cddbfe"/>
        <directionalLight color="#cddbfe"/>
        <pointLight position={[-200, 10, 10]}/>
        {(
          <mesh position={position}>
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
