import { NextApiRequest, NextApiResponse } from 'next'
import { COUNTRY_DATA_URL } from '~/lib/const'
import { isError } from '~/utils'
import parseCovidData from '~/lib/parseCovidData'
import { getSupabase } from '~/lib/supabase'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const supabase = getSupabase();
  const result = await supabase.from('location_deaths')
    .delete().eq('admin_level', 1);
  console.log('cleared deaths:', result);

  const locResult = await supabase.from('locations')
    .delete()
    .eq('admin_level', 1);
  console.log('cleared locations', locResult);

  try {
    await parseCovidData(COUNTRY_DATA_URL, 1);
    res.status(200).json({ parsed: true });
  } catch (err) {
    const error = isError(err) ? err.message : 'cannot read data'
    res.status(500).json({ error });
  }
}
