import { NextApiRequest, NextApiResponse } from 'next'
import { isError } from '~/utils'
import { CountryService } from '~/lib/CountryService'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    await CountryService.streamCountry(res);
  } catch (err) {
    const error = isError(err) ? err.message : 'cannot read data'
    res.status(500).json({ error });
  }
}
