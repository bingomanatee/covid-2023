import { Country } from '~/types'
import dayjs, { Dayjs } from 'dayjs'

type Stat = {
  start: string,
  deaths?: number[],
  hosp?: number[],
}

type hospOrDeath = 'hosp' | 'deaths'

type CountryMgr = {
  country: Country
}

class CIStatMgr {
  private start: dayjs.Dayjs
  private list: number[]

  constructor(private ci: CountryMgr, stat: Stat, field: hospOrDeath) {
    this.list = stat[field] || []
    this.start = dayjs(stat.start);
  }

  valueAtDate(date: string | Dayjs): number {
    if (typeof date == 'string') {
      return this.valueAtDate(dayjs(date));
    }

    if (this.start.isAfter(date)) {
      console.log(this.ci.country.iso3, 'date', date.toString(), 'is before', this.start.toString());
      return 0;
    }

    const offset = date.diff(this.start, 'days');

    if (offset >= this.list.length) {
      console.log(this.ci.country.iso3, 'offset', offset, 'is larger than data set of ', this.list.length);
      return this.list[this.list.length - 1];
    }
    return this.list[offset];
  }
}

export type CountrySummary = { country: Country, deaths: Stat, hosp: Stat }

export default class CountryItem implements CountryMgr {
  constructor({ country, deaths, hosp }: CountrySummary) {

    this.country = country;
    this.deaths = new CIStatMgr(this, deaths, 'deaths');
    this.hosp = new CIStatMgr(this, hosp, 'hosp');

  }
  country: Country
  deaths: CIStatMgr
  hosp: CIStatMgr
}
