import { NextApiRequest, NextApiResponse } from 'next'
import { isError } from '~/utils'
import { CountryService } from '~/lib/CountryService'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
    console.log('SUM_COUNTRY');
  try {
    const response = await CountryService.summary('deaths');
    res.status(200).json({ summarized: response });
  } catch (err) {
    const error = isError(err) ? err.message : 'cannot read data'
    res.status(500).json({ error });
  }
}
