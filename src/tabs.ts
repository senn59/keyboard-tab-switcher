export interface Tab {
    id: number;
    title: string;
    url: string;
    favicon: string | undefined;
}
export class TabService {
    selectedTab: HTMLElement;
    lastPage: number;
    page: number;
    pageLength: number;
    container: HTMLElement;
    tabs: Tab[];

    constructor(container: HTMLElement, tabs: Tab[], pageLength: number) {
        this.tabs = tabs;
        this.container = container;
        this.pageLength = pageLength;
        this.page = 1;
        this.lastPage = Math.ceil(tabs.length / pageLength);
    }

    render(reverse = false) {
        this.container.innerHTML = "";
        if (this.tabs.length <= this.pageLength) {
            this.page = 1;
        }

        const loopInit = this.pageLength * this.page - this.pageLength;
        let loopCondition = this.pageLength * this.page;
        if (this.tabs.length > loopInit) {
            loopCondition = this.tabs.length;
        }
        for (let i = loopInit; i <= loopCondition - 1; i++) {
            const t = this.tabs[i];
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
            this.container.append(item);
        }

        if (reverse) {
            this.setSelectedTab(this.container.lastChild as HTMLElement);
        } else {
            this.setSelectedTab(this.container.firstChild as HTMLElement);
        }
    }

    setSelectedTab(tab: HTMLElement) {
        if (this.selectedTab) {
            this.selectedTab.ariaSelected = "false";
        }
        this.selectedTab = tab;
        tab.ariaSelected = "true";
    }

    cycleForward() {
        // if there is another item select it
        if (this.selectedTab.nextSibling) {
            this.setSelectedTab(this.selectedTab.nextSibling as HTMLElement);
            return;
        }
        // if there are more items, go to the next page
        if (this.tabs.length > this.page * this.pageLength) {
            this.page++;
            this.render();
            return;
        }
        // if we are on the last page and there are multiple pages, wrap around to the first page
        if (this.lastPage > 1 && this.page === this.lastPage) {
            this.page = 1;
            this.render();
            return;
        }
        // select the first item if we are on the last item
        this.setSelectedTab(this.container.firstChild as HTMLElement);
    }

    cycleBackward() {
        // if there is a previous item select it
        if (this.selectedTab.previousSibling) {
            this.setSelectedTab(this.selectedTab.previousSibling as HTMLElement);
            return;
        }
        // if we aren't on the first page, go back a page
        if (this.page > 1) {
            this.page -= 1;
            this.render(true);
            return;
        }
        // if we are on the first page and there are more pages, wrap around to the first page
        if (this.lastPage > 1) {
            this.page = this.lastPage;
            this.render(true);
            return;
        }
        // select the last item if we are on the first item
        this.setSelectedTab(this.container.lastChild as HTMLElement);
    }
}
