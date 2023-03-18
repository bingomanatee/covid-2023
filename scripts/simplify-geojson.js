const dotenv = require('dotenv')
dotenv.config({ path: './../.env.local' })
const countries = require('./../public/data/ne_10m_admin_0_countries.base.geojson.json')
const fs = require('fs')
const { createClient } = require('@supabase/supabase-js')

function getSupabase() {
  const key = process.env.SUPABASE_KEY || ''
  const url = process.env.SUPABASE_URL || ''
  return createClient(url, key)
}

const supabase = getSupabase()

supabase.from('locations').select().eq('admin_level', 1)
  .then(({ data: countryData }) => {
    const iso3Map = new Map()
    countryData.forEach((c) => iso3Map.set(c.iso3, c))

    countries.features =
      countries.features.filter(({ properties: { ADM0_A3 } }) => iso3Map.has(ADM0_A3))
        .map((feature) => {
          const {CONTINENT, REGION_WB} = feature.properties;
          feature.properties = {...iso3Map.get(feature.properties.ADM0_A3), CONTINENT, REGION_WB};
          return feature
        })

    fs.writeFileSync('./../public/data/ne_10m_admin_0_countries.simple.geojson.json', JSON.stringify(countries))
  })
