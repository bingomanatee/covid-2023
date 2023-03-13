import Redis from 'ioredis'


export default function getRedis() {
  return new Redis({
    host: process.env.REDIS_ENDPOINT,
    username: "default",
    password: process.env.REDIS_PASSWORD,
    port: 10074
  });
}
