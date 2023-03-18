import color from "color";
import { clamp } from 'lodash'
import { stateOrCountry } from '~/types'

const toRGB = (list: number[]) => list.map((n) => clamp(Math.round(n * 255), 0, 255));
export const BLACK = color.rgb(...toRGB([0.005, 0, 0.01]));
const colorOne = color.rgb(...toRGB([0, 0.25, 0.25]));
const colorTwo = color.rgb(...toRGB([0.25, 0.4, 0]));
const colorThree = color.rgb(...toRGB([0.8, 0.5, 0]));
const colorFour = color.rgb(...toRGB([1, 0.125, 0.25]));
const colorFive = color.rgb(...toRGB([0.4, 0, 0.3]));
const colorSix = color.rgb(...toRGB([0.25, 0, 0.125]));
const WHITE = color.rgb(...toRGB([1, 1, 1]));

const rangeOne = (n: number) => BLACK.mix(colorOne, n);
const rangeTwo = (n: number) => colorOne.mix(colorTwo, n);
const rangeThree = (n: number) => colorTwo.mix(colorThree, n);
const rangeFour = (n: number) => colorThree.mix(colorFour, n);
const rangeFive = (n: number) => colorFour.mix(colorFive, n);
const rangeSix = (n: number) => colorFive.mix(colorSix, n);

type colorRange = { max: number, range: (n: number) => any };
const ranges: colorRange[] = [
  { max: 10 ** 3, range: rangeOne },
  { max: 10 ** 4, range: rangeTwo },
  { max: 10 ** 4.5, range: rangeThree },
  { max: 10 ** 5, range: rangeFour },
  { max: 10 ** 6, range: rangeFive },
  { max: 2 * 10 ** 6, range: rangeSix },
]


export function colorOf(scope: stateOrCountry, n: number) {
  if (scope === 'state') {
    n *= 2;
  }
  for (let index = 0; index < ranges.length; ++index) {
    const { max, range } = ranges[index]
    if (n <= max) {
      const min = index ? ranges[index - 1].max : 0;
      const f = (n - min) / (max - min);
      const color = range(f);
      return `${color.hex()}`;
    }
  }
  return `${WHITE.hex()}`;
}
