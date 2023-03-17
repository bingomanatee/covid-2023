// This function gets called at build time
import table from '~/styles/table.module.scss';
import { CountryInfo, CountryService } from '~/lib/CountryService'
import dayjs, { Dayjs } from 'dayjs'
import { sortBy } from 'lodash';

export async function getServerSideProps({ query }: { query: Record<string, string> }) {
  const { iso3 } = query

  let info = {};
  try {
    info = await CountryService.countryInfo({ iso3 });
  } catch (err) {
    console.log('error', err);
  }

  return {
    props: {
      iso3,
      result: info
    },
  }
}

export default function Countries({ iso3, result }: { iso3: string, result: CountryInfo }) {
  const dateMap = new Map();

  function mergeIntoMap(field: string, value: number, timeString: string, day: Dayjs) {
    if (dateMap.has(timeString)) {
      dateMap.get(timeString)[field] = value;
    } else {
      dateMap.set(timeString, {
        day,
        time: timeString,
        [field]: value
      });
    }
  }

  if (result.deaths) {
    const deathsStart = dayjs(result.deaths?.start);
    result.deaths.deaths?.forEach((deaths, index) => {
      if (!deaths) {
        return;
      }
      const day = deathsStart.add(index, 'day');
      const time = day.format('MMM DD YYYY');
      mergeIntoMap('deaths', deaths, time, day);
    });
  }

  if (result.hosp) {
    const hospStart = dayjs(result.hosp.start);
    result.hosp.hosp?.forEach((hosp, index) => {
      if (!hosp) {
        return;
      }
      const day = hospStart.add(index, 'day');
      const time = day.format('MMM DD YYYY');
      mergeIntoMap('hosp', hosp, time, day);
    });
  }


  const data = sortBy(Array.from(dateMap.values()));
  data.forEach((data) => console.log(data.time, data.hosp, data.deaths));

  return (
    <div>
      <h1>ISO3: {iso3}</h1>

      <table>
        <thead>
        <tr>
          <th>Date</th>
          <th>Deaths</th>
          <th>Hospitalization</th>
        </tr>
        </thead>
        <tbody>
        <tr>
          <th>Start Date</th>
          <td>{result.deaths ? dayjs(result.deaths.start).format('DD MMM YYYY') : '----'}</td>
          <td>{result.hosp ? dayjs(result.hosp.start).format('DD MMM YYYY') : '----'}</td>
        </tr>
        {data.map(({ time, deaths, hosp }, index) => (
          <tr key={index}>
            <td>
              {time}
            </td>
            <td>
              {typeof deaths === 'number' ? deaths : <span>&nbsp;</span>}
            </td>
            <td>
              {typeof hosp === 'number' ? hosp : <span>&nbsp;</span>}
            </td>
          </tr>
        ))}
        </tbody>
      </table>
    </div>

  )
}
