import { NextApiRequest, NextApiResponse } from 'next'

import { isError } from '~/utils'
import { GeoJsonService } from '~/lib/GeoDataService'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    console.log('req query:', req.headers);
    const data = await GeoJsonService.country('http://' + req.headers.host);
    res.status(200).json(data);
  } catch (err) {
    const error = isError(err) ? err.message : 'cannot read data'
    res.status(500).json({ error });
  }
}
