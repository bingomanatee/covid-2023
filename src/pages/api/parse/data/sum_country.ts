import { NextApiRequest, NextApiResponse } from 'next'
import { isError } from '~/utils'
import { CountryService } from '~/lib/CountryService'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
    console.log('SUM_COUNTRY');
  try {
    await CountryService.summary('deaths');
     await CountryService.summary('hosp');
    res.status(200).json({ summarized: true });
  } catch (err) {
    const error = isError(err) ? err.message : 'cannot read data'
    res.status(500).json({ error });
  }
}
