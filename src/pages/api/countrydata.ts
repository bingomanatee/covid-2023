import { supabase } from '~/lib/supabase'
import { NextApiRequest, NextApiResponse } from 'next'
import { COUNTRY_DATA_URL } from '~/pages/lib/const'

async function uploadFileToBucket() {

  const response = await fetch(COUNTRY_DATA_URL);
  const countryData = await response.text();
  const { data, error } = await supabase
    .storage
    .from('covid-snapshots')
    .upload('country-data', countryData, {
      upsert: true
    })

  console.log('upload data:', data, 'error:', error);
  return data;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const data = await uploadFileToBucket()
  return res.status(200).json({ data });
}
