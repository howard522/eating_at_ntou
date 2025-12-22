// server/interfaces/address.interfece.ts

import type { WithTimestamps } from "./common.interface";

export interface IGeoCache extends WithTimestamps {
    address: string;
    lat: number;
    lon: number;
}

export interface IKeelongAddressMap extends WithTimestamps {
    originalAddress: string;
    normalizedAddress: string;
    lat: number;
    lon: number;
}
