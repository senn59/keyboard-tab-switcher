export class Tabs {
    selectedtab;
    lastPage;
    constructor(container, tabs, pagelength) {
        this.tabs = tabs;
        this.container = container;
        this.pageLength = pageLength;
        this.page = 1;
        this.lastPage = Math.ceil(tabs.length / pagelength);
    }

    render(reverse = false) {
        this.container.innerHTML = "";
        if (this.tabs.length <= this.pageLength) {
            this.page = 1;
        }

        const loopInit = (this.pageLength * this.page) - this.pageLength;
        const loopCondition = (this.pageLength * this.page) - 1;
        for (i = loopInit; i <= loopCondition; i++) {
            const t = tabs[i];
            if (!t) {
                continue;
            }

            const item = document.createElement("li");
            const favicon = document.createElement("img");
            const title = document.createElement("span");

            item.classList.add("tab");
            item.dataset.id = t.id
            item.onclick = () => {
                browser.runtime.sendMessage({ action: "switch-tab", tabId: t.id });
            }

            favicon.src = t.favicon;
            favicon.alt = t.title + " fav icon";

            title.innerText = t.title;
            title.classList.add("tab-title");

            item.append(favicon);
            item.append(title);
            container.append(item);
        }

        if (reverse) {
            setSelectedTab(container.lastChild);
        } else {
            setSelectedTab(container.firstChild);
        }
    }

    setSelectedTab(tab) {
        if (this.selectedTab) {
            this.selectedTab.ariaSelected = false;
        }
        this.selectedTab = tab;
        tab.ariaSelected = true;
    }

    cycle(reverse = false) {
        reverse ? this.#cycleReverse() : this.#cycle();
    }

    #cycle() {
        // if there is another item select it
        if (selectedtab.nextsibling) {
            this.setSelectedTab(selectedtab.nextsibling);
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
        this.setSelectedTab(tabsContainer.firstChild);
    }

    #cycleReverse() {
        // if there is a previous item select it
        if (selectedTab.previousSibling) {
            this.setSelectedTab(selectedTab.previousSibling);
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
        this.setSelectedTab(tabsContainer.lastChild);
    }
}
