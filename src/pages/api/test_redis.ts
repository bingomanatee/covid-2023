import Redis from 'ioredis'
import { NextApiRequest, NextApiResponse } from 'next'
import { bucketKeyExists, bucketWrite } from '~/lib/supabase'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const redis = new Redis({
    host: process.env.REDIS_ENDPOINT,
    username: "default",
    password: process.env.REDIS_PASSWORD,
    port: 10074
  });

  await redis.set('foo', 'bar');

  res.json({ done: true });
}
