import { NextApiRequest, NextApiResponse } from 'next'
import { bucketKeyExists, bucketWrite } from '~/lib/supabase'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const exists = await bucketKeyExists('test', 'other', 'vey');
  const { data } = await bucketWrite('test', 'other', 'vey', 100);
  console.log('data:', data);

  res.json({ done: true, data, exists });
}
