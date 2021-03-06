import { listOfEntries } from '../models/models';
import { ENTRY_POINT, HOST } from '../urls';
import { parseTimestamps } from './parseTimestamps';

export const entryReadAll = async (name: string): Promise<listOfEntries | string | undefined> => {
    const res = await fetch(`${HOST + ENTRY_POINT.ENTRY_READ_ALL}/${name}`);

    const { data } = parseTimestamps(await res.json());

    if (data && 'data' in data) {
        return data;
    } else if (data && 'msg' in data) {
        return data.msg;
    }
};
