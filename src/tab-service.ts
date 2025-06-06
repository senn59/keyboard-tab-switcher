import { IFuzzyFinder } from "./fuzzy-finder";

export enum PageAction {
    NEXT = "NEXT",
    PREVIOUS = "PREVIOUS",
    FIRST = "FIRST"
}

export interface Tab {
    id: number;
    title: string;
    host: string;
    path?: string;
    favicon: string | undefined;
}

export class TabService {
    selectedTab: HTMLElement | undefined;
    #pageCount: number;
    #page: number = 1;
    #pageLength: number;
    #container: HTMLElement;
    #originalTabs: Tab[];
    #tabs: Tab[];
    #fuzzyFinder: IFuzzyFinder;
    #query: string = "";

    constructor(fzf: IFuzzyFinder, container: HTMLElement, tabs: Tab[], pageLength: number) {
        this.#tabs = tabs;
        this.#originalTabs = tabs;
        this.#container = container;
        this.#pageLength = pageLength;
        this.#pageCount = Math.ceil(tabs.length / pageLength);
        this.#fuzzyFinder = fzf;
        this.#fuzzyFinder.addData(this.#tabs);
    }

    search(query: string) {
        this.#query = query;
        if (!this.#query) {
            this.#tabs = this.#originalTabs;
        } else {
            this.#tabs = this.#fuzzyFinder.search(this.#query);
        }
        this.render(PageAction.FIRST);
    }

    #setPage(action: PageAction) {
        this.#pageCount = Math.ceil(this.#tabs.length / this.#pageLength);
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

    #getPageSlice(): Tab[] {
        const startIndex = this.#pageLength * this.#page - this.#pageLength;
        const endIndex = Math.min(startIndex + this.#pageLength, this.#tabs.length);
        return this.#tabs.slice(startIndex, endIndex);
    }

    render(action?: PageAction, reverse = false) {
        if (this.#tabs.length === 0) {
            return;
        }
        if (action) {
            this.#setPage(action);
        }
        this.#container.innerHTML = "";
        this.#getPageSlice().forEach((t) => {
            const item = document.createElement("li");
            const favicon = document.createElement("img");
            const title = document.createElement("span");

            item.classList.add("tab");
            item.dataset.id = t.id.toString();
            item.onclick = () => {
                browser.runtime.sendMessage({ action: "switch-tab", tabId: t.id });
            };

            favicon.src = t.favicon ?? "";
            favicon.alt = t.title + " fav icon";

            title.innerText = t.title;
            title.classList.add("tab-title");

            item.append(favicon);
            item.append(title);
            this.#container.append(item);
        });
        const target = reverse ? this.#container.lastChild : this.#container.firstChild;
        this.setSelectedTab(target as HTMLElement);
    }

    setSelectedTab(tab: HTMLElement) {
        if (this.selectedTab) {
            this.selectedTab.ariaSelected = "false";
        }
        this.selectedTab = tab;
        tab.ariaSelected = "true";
    }

    cycleForward() {
        if (!this.selectedTab) {
            this.setSelectedTab(this.#container.firstChild as HTMLElement);
            return;
        }
        if (this.selectedTab.nextSibling) {
            this.setSelectedTab(this.selectedTab.nextSibling as HTMLElement);
            return;
        }
        if (this.#pageCount > 1) {
            this.render(PageAction.NEXT);
            return;
        }
        this.setSelectedTab(this.#container.firstChild as HTMLElement);
    }

    cycleBackward() {
        if (!this.selectedTab) {
            this.setSelectedTab(this.#container.lastChild as HTMLElement);
            return;
        }
        if (this.selectedTab.previousSibling) {
            this.setSelectedTab(this.selectedTab.previousSibling as HTMLElement);
            return;
        }
        if (this.#pageCount > 1) {
            this.render(PageAction.PREVIOUS, true);
            return;
        }
        this.setSelectedTab(this.#container.lastChild as HTMLElement);
    }
}
