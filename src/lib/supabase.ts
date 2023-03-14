import { createClient } from '@supabase/supabase-js'
import { KEY_NAMESPACE } from '~/lib/const'
import { v5 as uuidV5 } from 'uuid';

export function getSupabase() {
  const key: string = process.env.SUPABASE_KEY || '';
  const url: string = process.env.SUPABASE_URL || '';

  return createClient(url, key);
}

export async function bucketWrite(bucketName: string, folder: string, pathName: string, value: any) {
  return await getSupabase()
    .storage
    .from(bucketName)
    .upload(`${folder}/${pathName}`, value, {
      upsert: true
    })
}

export async function bucketKeyExists(bucketName: string, folder: string, pathName: string) {
  const { data, error } = await getSupabase()
    .storage
    .from(bucketName)
    .list(folder, {
      search: pathName
    });
  console.log('bucket data:', data);
  return data ? data.length > 0 : false;
}

export async function bucketRead(bucketName: string, folder: string, pathName: string) {
  const { data, error } = await getSupabase()
    .storage
    .from(bucketName)
    .download(pathName);

  return data;
}

export function t(arg: unknown) {
  if (typeof arg !== 'string') {
    return '';
  }
  return arg.trim();
}
export function locationId(iso3: string, adminLevel2 = '') {
  return uuidV5(`${t(iso3)}-${t(adminLevel2)}location`, KEY_NAMESPACE);
}
