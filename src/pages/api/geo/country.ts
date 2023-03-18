import { NextApiRequest, NextApiResponse } from 'next'
import { GeoJsonService } from '~/lib/GeoDataService'
import { isError } from '~/utils'
import { GeoJsonGeometry } from 'three-geojson-geometry'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
  //  await GeoJsonService.country('http://' + req.headers.host);
    await GeoJsonService.streamCountry(res);
    // res.status(200).json(data);

  } catch (err) {
    console.log('----  country error: ', err);
    const error = isError(err) ? err.message : 'cannot read data'
    res.status(500).json({ error });
  }
}
