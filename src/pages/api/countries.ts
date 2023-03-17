import { NextApiRequest, NextApiResponse } from 'next'
import { isError } from '~/utils'
import { CountryService } from '~/lib/CountryService'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    const countries = await CountryService.countries();
    res.status(200).json({countries});
  } catch (err) {
    const error = isError(err) ? err.message : 'cannot read data'
    res.status(500).json({ error });
  }
}
