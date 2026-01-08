import {AsyncBox, type GanttTask, SuperMap, Timing} from "$lib/types";
import {dataSource} from "$lib/services/dataProvider.svelte";

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

interface DisplayData {
    id: number;
    name: string;
    start: Date;
    end: Date;
    time: Timing
}

export function parsedDataCreator() {
    return dataSource.uniqueNames().mapLeft(all => {
        const boxes = all.map((name, id) => {
            const f: AsyncBox<GanttTask<number>[], any> = dataSource.longestTasks.filter(d => {
                console.log("during longestTasks.filter");
                return d.processName === name
            });

            console.log("- f", name, f);

            const m: AsyncBox<Timing[], any> = f.process(d => Timing.from_valueOf(d.from, d.to));

            console.log("- m", name, m);

            const begin: AsyncBox<number, any> = f.mapLeft(arr => Math.min(...arr.map(x => x.from)));
            const end: AsyncBox<number, any> = f.mapLeft(arr => Math.max(...arr.map(x => x.to)));
            const sum: AsyncBox<Timing, any> = m
                .reduce((acc, item) => {
                    acc.add(item);
                    return acc;
                }, new Timing())
                .tapRight(e => console.warn(e));

            return AsyncBox.join(begin, end, sum).mapLeft<DisplayData>(([begin, end, sum]) => {
                console.log("- check sum: ", sum);

                return {
                    id,
                    name,
                    start: new Date(begin),
                    end: new Date(end),
                    time: sum.resync()
                }
            }).tap(
                v => console.warn(v.time),
                e => console.warn(e)
            );
        });

        return AsyncBox.join(...boxes)
    }).flatten();
}