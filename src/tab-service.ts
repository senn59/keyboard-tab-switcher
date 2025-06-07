import { IFuzzyFinder } from "./fuzzy-finder";
import { Logger } from "./logger";

export enum PageAction {
    NEXT = "NEXT",
    PREVIOUS = "PREVIOUS",
    FIRST = "FIRST"
}

export interface Tab {
    id: number;
    title: string;
    domain: string;
    path?: string;
    active: boolean
    favicon: string | undefined;
}

interface DisplayTab {
    id: number;
    title: string;
    domain: string;
    active: boolean
    favicon?: string;
    searchMatches: string[];
}

const escapeRegex = (str: string): string => {
    return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
};

export class TabService {
    selectedTab: HTMLElement | undefined;
    #pageCount: number;
    #page: number = 1;
    #pageLength: number;
    #container: HTMLElement;
    #originalTabs: Tab[];
    #tabsToRender: DisplayTab[];
    #fuzzyFinder: IFuzzyFinder;
    #query: string = "";

    constructor(fzf: IFuzzyFinder, container: HTMLElement, tabs: Tab[], pageLength: number) {
        this.#originalTabs = tabs;
        this.#tabsToRender = tabs.map((t) => ({ ...t, searchMatches: [] }));
        this.#container = container;
        this.#pageLength = pageLength;
        this.#pageCount = Math.ceil(tabs.length / pageLength);
        this.#fuzzyFinder = fzf;
        this.#fuzzyFinder.addData(this.#originalTabs);
    }

    search(query: string) {
        this.#query = query;
        let tabs: DisplayTab[] = [];
        if (query) {
            tabs = this.#fuzzyFinder.search(query).map((r) => ({ ...r.tab, searchMatches: r.matches }));
        }
        if (tabs.length === 0) {
            tabs = this.#originalTabs.map(t => ({...t, searchMatches: []}));
        }
        
        this.#tabsToRender = tabs;
        this.render(PageAction.FIRST);
    }

    #setPage(action: PageAction) {
        this.#pageCount = Math.ceil(this.#tabsToRender.length / this.#pageLength);
        switch (action) {
            case PageAction.NEXT:
                if (this.#page === this.#pageCount) {
                    this.#page = 1;
                } else {
                    this.#page += 1;
                }
                break;
            case PageAction.PREVIOUS:
                if (this.#page === 1) {
                    this.#page = this.#pageCount;
                } else {
                    this.#page -= 1;
                }
                break;
            case PageAction.FIRST:
                this.#page = 1;
                break;
        }
    }

    #getPageData(): DisplayTab[] {
        const startIndex = this.#pageLength * this.#page - this.#pageLength;
        const endIndex = Math.min(startIndex + this.#pageLength, this.#tabsToRender.length);
        return this.#tabsToRender.slice(startIndex, endIndex);
    }

    render(action?: PageAction, reverse = false) {
        if (this.#tabsToRender.length === 0) {
            return;
        }
        if (action) {
            this.#setPage(action);
        }
        this.#container.innerHTML = "";
        this.#getPageData().forEach((tab) => {
            const item = document.createElement("li");
            const favicon = document.createElement("img");
            const title = document.createElement("span");
            const domain = document.createElement("span");

            item.classList.add("tab");
            tab.active ? item.classList.add("active") : null;
            item.dataset.id = tab.id.toString();
            item.onclick = () => {
                browser.runtime.sendMessage({ action: "switch-tab", tabId: tab.id });
            };

            favicon.src = tab.favicon ?? "";
            favicon.alt = tab.title + " fav icon";

            const titleHTML = this.#highlightSearchMatches(tab.title, tab.searchMatches);
            title.innerHTML = titleHTML;
            title.classList.add("tab-title");

            let domainHTML = this.#highlightSearchMatches(tab.domain, tab.searchMatches);
            domainHTML = `(${domainHTML})`;
            domain.innerHTML = domainHTML;
            domain.classList.add("tab-domain");

            item.append(favicon);
            item.append(title);
            item.append(domain);
            this.#container.append(item);
        });
        const target = reverse ? this.#container.lastChild : this.#container.firstChild;
        this.#setSelectedTab(target as HTMLElement);
    }

    #highlightSearchMatches(str: string, matches: string[]): string {
        if (!matches) {
            return str;
        }
        const pattern = matches.map(escapeRegex).join("|");
        const regex = new RegExp(pattern, "gi");
        return str.replace(regex, (match) => `<mark>${match}</mark>`);
    }

    #setSelectedTab(tab: HTMLElement) {
        if (this.selectedTab) {
            this.selectedTab.ariaSelected = "false";
        }
        this.selectedTab = tab;
        tab.ariaSelected = "true";
    }

    cycleForward() {
        if (!this.selectedTab) {
            this.#setSelectedTab(this.#container.firstChild as HTMLElement);
            return;
        }
        if (this.selectedTab.nextSibling) {
            this.#setSelectedTab(this.selectedTab.nextSibling as HTMLElement);
            return;
        }
        if (this.#pageCount > 1) {
            this.render(PageAction.NEXT);
            return;
        }
        this.#setSelectedTab(this.#container.firstChild as HTMLElement);
    }

    cycleBackward() {
        if (!this.selectedTab) {
            this.#setSelectedTab(this.#container.lastChild as HTMLElement);
            return;
        }
        if (this.selectedTab.previousSibling) {
            this.#setSelectedTab(this.selectedTab.previousSibling as HTMLElement);
            return;
        }
        if (this.#pageCount > 1) {
            this.render(PageAction.PREVIOUS, true);
            return;
        }
        this.#setSelectedTab(this.#container.lastChild as HTMLElement);
    }
}
