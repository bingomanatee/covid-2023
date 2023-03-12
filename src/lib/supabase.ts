import { createClient } from '@supabase/supabase-js'

const key: string = process.env.SUPABASE_KEY || '';
const url: string = process.env.SUPABASE_URL || '';

export const supabase = createClient(url, key);

export async function bucketWrite(bucketName: string, folder: string, pathName: string, value: any) {
  return await supabase
    .storage
    .from(bucketName)
    .upload(`${folder}/${pathName}`, value, {
      upsert: true
    })
}

export async function bucketKeyExists(bucketName: string, folder: string, pathName: string) {
  const { data, error } = await supabase
    .storage
    .from(bucketName)
    .list(folder, {
      search: pathName
    });
  console.log('bucket data:', data);
  return data ? data.length > 0 : false;
}

export async function bucketRead(bucketName: string, folder: string, pathName: string)  {
  const { data, error } = await supabase
    .storage
    .from(bucketName)
    .download(pathName);

  return data;
}
