// This function gets called at build time
import table from '~/styles/table.module.scss';
import { CountryService } from '~/lib/CountryService'
import { Country } from '~/types'

export async function getServerSideProps() {
  // Call an external API endpoint to get posts
  const countries = await CountryService.countries();

  // By returning { props: { posts } }, the Blog component
  // will receive `posts` as a prop at build time
  return {
    props: {
      countries
    },
  }
}

export default function Countries({ countries }: {countries: Country[]}) {

  return (<div>
<h1>Countries</h1>

    <table className={table.dataTable}>
      <thead>
      <tr>
        <th>ID</th>
        <th>iso3</th>
        <th>Latitude</th>
        <th className={table.right}>Longitude</th>
        <th className={table.right}>Population</th>
      </tr>
      </thead>

      <tbody>
      {countries.map((country: Country) => (
        <tr key={country.id}>
          <td><a href={`/charts/countries/${country.iso3}`}>{country.iso3}</a></td>
          <td>{Number(country.latitude, ).toFixed(3)}</td>
          <td className={table.right}>{Number(country.longitude).toFixed(3)}</td>
          <td className={table.right}>{country.population}</td>
          <td>{country.id}</td>
        </tr>
        ))}
      </tbody>

    </table>

    </div>)

}
