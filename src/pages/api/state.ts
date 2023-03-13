import { NextApiRequest, NextApiResponse } from 'next'
import { GeoJsonService } from '~/lib/GeoDataService'
import { isError } from '~/utils'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    console.log('req query:', req.headers);

   await GeoJsonService.streamState(res);
  } catch (err) {
    const error = isError(err) ? err.message : 'cannot read data'
    res.status(500).json({ error });
  }
}
