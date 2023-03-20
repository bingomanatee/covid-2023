import { withSize } from 'react-sizeme';
import { useResizeDetector } from 'react-resize-detector';
import TimeMarker from './TimeMarker'
import * as React from "react"
import { useMemo, useState } from "react";
import style from './TimeLine.module.css';
import { useContext } from "react";
import { GlobalStateContext } from '~/components/GlobalState'

const EDGE_FORMAT = 'MMM YY';

const SvgComponent = () => {
  const {
   value: {
     currentTime,
     endDate,
     playing
   },
    state
  } = useContext(GlobalStateContext);
  const { width: resizeWidth, ref } = useResizeDetector();
  const width: number = resizeWidth || 100;
  const rightEdge = useMemo(() => width || 0 - (17 * 2), [width]);
  const leftEdge = 17;
  const BAR_WIDTH = useMemo(() => rightEdge - leftEdge, [width, rightEdge]);
  const [playClicked, setPlayClicked] = useState(false);
  return (
    <div ref={ref} style={{
      position: "absolute",
      overflow: 'hidden',
      display: 'flex',
      alignContent: 'stretch',
      left: 0,
      bottom: 0,
      right: 0,
      height: '72px'
    }}>
      <svg
        width={width + 'px'}
        height="72px"
        viewBox={`0 0 ${width} 72.0`}
        xmlns="http://www.w3.org/2000/svg"
        xmlnsXlink="http://www.w3.org/1999/xlink"
      >
        <defs>
          <clipPath id="i0">
            <path d="M652,0 L652,72 L0,72 L0,0 L652,0 Z"/>
          </clipPath>
          <clipPath id="i1">
            <path d="M90,0 L90,16 L0,16 L0,0 L90,0 Z"/>
          </clipPath>
          <clipPath id="i2">
            <path
              d="M4.5,0 C6.98528137,0 9,1.790861 9,4 C9,6.209139 6.98528137,8 4.5,8 C2.01471863,8 0,6.209139 0,4 C0,1.790861 2.01471863,0 4.5,0 Z"/>
          </clipPath>
          <clipPath id="i3">
            <path d="M146,0 L146,19 L0,19 L0,0 L146,0 Z"/>
          </clipPath>
          <clipPath id="stop">
            <path
              d="M12,0 C14.209139,-4.05812251e-16 16,1.790861 16,4 L16,44 C16,46.209139 14.209139,48 12,48 L4,48 C1.790861,48 2.705415e-16,46.209139 0,44 L0,4 C-2.705415e-16,1.790861 1.790861,-9.26455379e-16 4,0 L12,0 Z"/>
          </clipPath>
          <clipPath id="play">
            <path
              d="M27.2888544,5.36656315 C28.062964,5.75361795 28.690654,6.38130792 29.0777088,7.15541753 L48.1055728,45.2111456 C49.0935298,47.1870596 48.2926324,49.5897518 46.3167184,50.5777088 C45.7612967,50.8554196 45.1488444,51 44.527864,51 L6.47213595,51 C4.26299696,51 2.47213595,49.209139 2.47213595,47 C2.47213595,46.3790196 2.61671632,45.7665674 2.89442719,45.2111456 L21.9222912,7.15541753 C22.9102482,5.17950354 25.3129404,4.37860615 27.2888544,5.36656315 Z"/>
          </clipPath>
          <clipPath id="rewind">
            <path d="M24.096755,0 L10.1148934,24 L24.096755,48 L13.9818615,48 L0,24 L13.9818615,0 L24.096755,0 Z"/>
          </clipPath>
        </defs>

        <g id="bar" transform="translate(17.0 31.0)">
          <path
            d={`M0,0 L0,12 L${rightEdge - 17},12 L${rightEdge - 17},0`}
            stroke="#969696"
            strokeWidth={1}
            fill="none"
            strokeMiterlimit={10}
          />
        </g>
        <g transform="translate(17.0 15.0)" id="start-time-label">
          <g>
            <text className="value-label"
              transform="translate(0.0 11.0)"
              fill="#000000"
            >
              January 1 2020
            </text>
          </g>
        </g>`

        <g id="right-date" transform={`translate(${rightEdge - 100} 15.0)`}>
            <g clipPath="url(#i3)">
              <text
                transform="translate(25.964 11.0)"
                className="value-label"
                fill="#000000"
                textAnchor="right"
              >
                {endDate.format(EDGE_FORMAT)}
              </text>
            </g>
          </g>
        <g transform={`translate(${BAR_WIDTH * state.do.progress()-45} 22)`}>
          <TimeMarker currentTime={currentTime.format(EDGE_FORMAT)} /></g>

        <g transform={`translate(${(width) / 2} 18) `} id="rewind" onClick={state.do.rewind}>
          <g transform="translate(-100 0)">
            <g clipPath="url(#rewind)">
              <polygon
                className={ style['rewind-fill']}
                  points="0,0 24.096755,0 24.096755,48 0,48 0,0"/>
            </g>
            <polygon points="13.9818615,0 24.096755,0 10.1148934,24 24.096755,48 13.9818615,48 0,24 13.9818615,0 13.9818615,0"
                     className={ style['rewind-stroke']}/>

          </g>
        </g>
        {!playing ? (
            <g id="play-button" transform={`translate(${width / 2} 18) rotate(90)`}
               onClick={() => {setPlayClicked(true); state.do.play();}}>
              <path
                d="M29.0777088,7.15541753 L48.1055728,45.2111456 C49.0935298,47.1870596 48.2926324,49.5897518 46.3167184,50.5777088 C45.7612967,50.8554196 45.1488444,51 44.527864,51 L6.47213595,51 C4.26299696,51 2.47213595,49.209139 2.47213595,47 C2.47213595,46.3790196 2.61671632,45.7665674 2.89442719,45.2111456 L21.9222912,7.15541753 C22.9102482,5.17950354 25.3129404,4.37860615 27.2888544,5.36656315 C28.062964,5.75361795 28.690654,6.38130792 29.0777088,7.15541753 Z"
                fill="none"
                id="play-path"
                strokeMiterlimit={5}
                className={playClicked ? style['play-stroke-clicked'] :  style['play-stroke']}
              />
              <g clipPath="url(#play)">
                <polygon
                  points="2.47213595,4.94339568 48.5287403,4.94339568 48.5287403,51 2.47213595,51 2.47213595,4.94339568"
                  stroke="none"
                  fill="#99FF00"
                  id="play-fill"
                  className={playClicked ? style['play-fill-clicked'] : style['play-fill']  }
                />
              </g>
            </g>
          ) :
          (
            <g id="pause-button" opacity={0.25} transform={`translate(${width / 2 - 50}  20)`}>
              <g clipPath="url(#stop)" onClick={state.do.stop}>
                <polygon
                  points="0,0 16,0 16,48 0,48 0,0"
                  stroke="none"
                  fill="#FFE0E0"
                />
              </g>
              <path
                d="M4,0 L12,0 C14.209139,-4.05812251e-16 16,1.790861 16,4 L16,44 C16,46.209139 14.209139,48 12,48 L4,48 C1.790861,48 2.705415e-16,46.209139 0,44 L0,4 C-2.705415e-16,1.790861 1.790861,-9.26455379e-16 4,0 Z"
                stroke="#FF8080"
                strokeWidth={1}
                fill="none"
                strokeMiterlimit={10} onClick={state.do.stop}
              />
              <g transform="translate(20.0 0)" onClick={state.do.stop}>
                <g clipPath="url(#stop)">
                  <polygon
                    points="0,0 16,0 16,48 0,48 0,0"
                    stroke="none"
                    fill="#FFE0E0"
                  />
                </g>
                <path
                  d="M4,0 L12,0 C14.209139,-4.05812251e-16 16,1.790861 16,4 L16,44 C16,46.209139 14.209139,48 12,48 L4,48 C1.790861,48 2.705415e-16,46.209139 0,44 L0,4 C-2.705415e-16,1.790861 1.790861,-9.26455379e-16 4,0 Z"
                  stroke="#FF8080"
                  strokeWidth={1}
                  fill="none"
                  strokeMiterlimit={10}
                />
              </g>
            </g>
          ) }
      </svg>
    </div>
  );
}


export default SvgComponent;
