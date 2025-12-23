import {SuperMap} from "$lib/types";

interface pathListEntry {
    name: string;
    path: string;
}

export function createPathMap(...connections: [string, string][]) {
    const r = new SuperMap<string, string>();
    for (const [key, value] of connections) {
        r.set(key, value);
    }

    return r;
}
