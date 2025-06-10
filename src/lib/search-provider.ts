import { Tab } from "./tab-service";
import MiniSearch, { SearchOptions } from "minisearch";

export interface SearchResult {
    tab: Tab;
    matches: string[];
}

export interface ISearchProvider {
    search: (query: string) => SearchResult[];
    addData: (data: Tab[]) => void;
}

export class MiniSearchFzf implements ISearchProvider {
    #ms: MiniSearch<any>;
    #tabMap: Map<number, Tab> | undefined;
    #options: SearchOptions;

    constructor(fields: string[]) {
        this.#ms = new MiniSearch({
            fields: fields,
            storeFields: fields
        });
        this.#options = {
            fuzzy: 0.2,
            prefix: true,
            fields: fields
        };
    }

    search(query: string): SearchResult[] {
        let res: SearchResult[] = [];
        this.#ms.search(query, this.#options).forEach((r) => {
            const tab = this.#tabMap?.get(r.id);
            if (tab) {
                res.push({
                    tab: tab,
                    matches: r.queryTerms
                });
            }
        });
        return res;
    }

    addData(data: Tab[]) {
        this.#tabMap = new Map(data.map((t) => [t.id, t]));
        this.#ms.addAll(data);
    }
}
