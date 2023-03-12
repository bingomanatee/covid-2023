import { parse } from 'csv-parse';
import { once } from 'lodash';
import axios from 'axios';

const IDENTITY = (input?: any) => input;
const NOOP = () => {
};

type hook = (event: any) => void;

type Props = {
  onError: hook,
  cast: boolean,
  onData: hook,
  onEnd: hook,
  onRecord: hook
}

export class CsvService {
  static async readCsvFile(
    fileUrl: string,
    {
      onError = IDENTITY,
      cast = true,
      onData,
      onEnd = NOOP,
      onRecord = IDENTITY,
    }: Props,
  ) {
    const csvParser = parse({
      cast,
      cast_date: true,
      columns: true,
      delimiter: ',',
      on_record: onRecord,
    });

    const error = once(onError);

    const { data: stream } = await axios({
      method: 'get',
      url: fileUrl,
      responseType: 'stream',
    });

    csvParser.on('data', onData).on('error', error).on('end', onEnd);
    stream.on('data', (chunk: Buffer) => csvParser.write(chunk.toString()));
    stream.once('end', () => {
      csvParser.end();
    });
    stream.once('error', error);
  }
}
