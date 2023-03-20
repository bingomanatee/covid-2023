import * as React from "react"
import { Dayjs } from 'dayjs'

const TimeMarker = ({ currentTime }: {currentTime: string}) => (
  <svg
    width="132px"
    height="24px"
    viewBox="0 0 132.0 24.0"
    xmlns="http://www.w3.org/2000/svg"
    xmlnsXlink="http://www.w3.org/1999/xlink"
  >
    <defs>
      <clipPath id="time-marker-outer">
        <path d="M132,0 L132,24 L0,24 L0,0 L132,0 Z" />
      </clipPath>
      <clipPath id="time-marker-text">
        <path d="M90,0 L90,16 L0,16 L0,0 L90,0 Z" />
      </clipPath>
      <clipPath id="time-marker-circle">
        <path d="M4.5,0 C6.98528137,0 9,1.790861 9,4 C9,6.209139 6.98528137,8 4.5,8 C2.01471863,8 0,6.209139 0,4 C0,1.790861 2.01471863,0 4.5,0 Z" />
      </clipPath>
    </defs>
    <g clipPath="url(#i0)">
      <g transform="translate(15.0 -2.0)">
        <g>
          <text
            transform="translate(26 14)"
            fill="#000000"
            className="value-label"
            textAnchor="center"
          >
            {currentTime}
          </text>
        </g>
        <g transform="translate(43.0 18.0)">
          <g clipPath="url(#i2)">
            <polygon
              points="0,0 9,0 9,8 0,8 0,0"
              stroke="none"
              fill="#FFFFFF"
            />
            <path
              d="M4.5,8 C6.98528137,8 9,6.209139 9,4 C9,1.790861 6.98528137,0 4.5,0 C2.01471863,0 0,1.790861 0,4 C0,6.209139 2.01471863,8 4.5,8 Z"
              stroke="#969696"
              strokeWidth={2}
              fill="none"
              strokeMiterlimit={5}
            />
          </g>
        </g>
      </g>
    </g>
  </svg>
)

export default TimeMarker
