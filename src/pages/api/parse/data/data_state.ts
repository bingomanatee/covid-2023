import { NextApiRequest, NextApiResponse } from 'next'
import { STATE_DATA_URL } from '~/pages/lib/const'
import { isError } from '~/utils'
import parseCovidData from '~/lib/parseCovidData'
import { getSupabase } from '~/lib/supabase'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  await getSupabase().from('location_deaths')
    .delete()
    .eq('admin_level', 2);

  try {
    await parseCovidData(STATE_DATA_URL);
    res.status(200).json({ parsed: true });
  } catch (err) {
    const error = isError(err) ? err.message : 'cannot read data'
    res.status(500).json({ error });
  }
}
