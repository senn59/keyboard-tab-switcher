import { Logger } from "./logger";
import { Tab } from "./tabs";
import MiniSearch, { SearchOptions } from "minisearch";

export interface IFuzzyFinder {
    search: (query: string) => Tab[];
    addData: (data: Tab[]) => void;
}

export class MiniSearchFzf implements IFuzzyFinder {
    ms: MiniSearch<any>;
    tabMap: Map<number, Tab> | undefined;
    options: SearchOptions;

    constructor(fields: string[]) {
        this.ms = new MiniSearch({
            fields: fields,
            storeFields: fields
        });
        this.options = {
            fuzzy: 0.2,
            prefix: true,
            fields: fields,
            combineWith: "OR"
        };
    }

    search(query: string): Tab[] {
        Logger.log(query);
        Logger.log(this.ms.documentCount);
        let res: Tab[] = [];
        this.ms.search(query, this.options).forEach((r) => {
            const tab = this.tabMap?.get(r.id);
            if (tab) {
                res.push(tab);
            }
        });
        return res;
    }

    addData(data: Tab[]) {
        this.tabMap = new Map(data.map((t) => [t.id, t]));
        this.ms.addAll(data);
    }
}
