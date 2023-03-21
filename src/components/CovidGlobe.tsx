import Inspector from "./Inspector";
import { Canvas } from '@react-three/fiber';
import { useContext, useEffect, useMemo, useRef } from "react";
import babbas from '~/lib/bebes.json'
import { GlobalStateContext } from '~/components/GlobalState'
import TimeLine from '~/components/TimeLine/TimeLine'
import { Text } from 'grommet';
import { Dayjs } from 'dayjs'
import { Feature } from "~/types";

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

const basicClone = (feature: Feature) => {
  const properties = { ...feature.properties };
  const coordinates: any[] = [];
  return { properties, coordinates }
}

const CovidGlobe = ({
                      features,
                      resolution = 3,
                      colorOf,
                      labelSize,
                      labelTextFn,
                    }: {
  features: Record<string, unknown>[],
  labelTextFn(arg: unknown, time: Dayjs): string,
  labelSize(arg: unknown): number,
  resolution?: number,
  colorOf(feature: unknown, time: Dayjs): string,
}) => {
  const {
    value: { zoom, height, currentTime }, state
  } = useContext(GlobalStateContext);

  console.log('covid globe: current time is ', currentTime);

  const labelData = useMemo(() => features.map(basicClone), [features]);
  const globe = useMemo(() => {
    if (!ThreeGlobe) {
      return false;
    }
    // @ts-ignore
    return new ThreeGlobe({ animateIn: false })
      .labelColor('black')
      .labelsData(labelData)
      .labelLat(latFn)
      .labelRotation(0)
      .labelLng(longFn)
      .labelIncludeDot(false)
      .labelTypeFace(babbas)
      .labelAltitude(0.02)
      .labelSize(labelSize)
      .labelText(labelTextFn)
      .labelRotation(0)
      .labelsTransitionDuration(0)
      .hexPolygonResolution(resolution)
      .hexPolygonsData(features)
      .hexPolygonMargin(0)
      .globeImageUrl('/img/earth-dark-grey.png')
      .hexPolygonColor(colorOf);
  }, [resolution, ThreeGlobe]);

  useEffect(() => {
    if (globe && features.length) {

      globe.hexPolygonColor((feature: unknown) => colorOf(feature, currentTime))
        .labelsData([...labelData])
        .hexPolygonsData(features)
    }
  }, [globe, currentTime, features]);

  const position: [x: number, y: number, z: number] = useMemo(() => ([-20, height, -zoom]), [zoom, height]);

  return (
    <>
      <Canvas camera={{ fov: 40 }}>
        <ambientLight color={"#d0baba"}/>
        <directionalLight color={"#cddbfe"}/>
        {(
          <mesh position={position}>
            <pointLight position={[-200, 10, 10]}/>
            <Inspector>
              <primitive object={globe}/>
            </Inspector>
          </mesh>
        )}
      </Canvas>

      <Text>
        <TimeLine/>
      </Text>
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
