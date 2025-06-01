console.log("Loaded keyboard-tab-switcher");

let menu;
let tabs;
const pageLength = 6;

const commandHandler = async (cmd) => {
    switch (cmd.action) {
        case "open-switcher":
            if (menu) {
                return;
            }
            const url = browser.runtime.getURL("menu.html")
            menu = new Menu(url);
            menu.open();

            const tabData = await browser.runtime.sendMessage({ action: "query-tabs" });
            tabs = new Tabs(menu.tabsContainer, tabData, pageLength);
            tabs.render();

            menu.searchBar.addEventListener("input", handleSearch);
            window.addEventListener("click", handleClick);
            document.addEventListener("keydown", handleKeydown)
            break;
        case "close-switcher":
            if (!menu) {
                return;
            }

            document.removeEventListener("keydown", handleKeydown);
            window.removeEventListener("click", handleClick);
            menu.searchBar.removeEventListener("change", handleSearch);

            menu.close()
            menu = undefined
            tabs = undefined;
            break;
        case "cycle-tab":
            tabs.cycle(cmd.reverse);
            break;
        case "switch-tab":
            // const tabId = tabs.selectedTab.dataset.id;
            browser.runtime.sendMessage({
                action: "switch-tab",
                tabId: Number(tabs.selectedTab.dataset.id)
            });
            commandHandler({ action: "close-switcher" })
            break;
    }
}

/*
 * Keys like 'Escape', 'Tab', 'Enter' aren't allowed as browser commands.
 * We add an event listener to work around this.
*/

const handleKeydown = (event) => {
    switch (event.key) {
        case "Escape":
            event.preventDefault()
            commandHandler({ action: "close-switcher" })
            break;
        case "Tab":
            event.preventDefault();
            commandHandler({ action: "cycle-tab", reverse: event.shiftKey });
            break;
        case "Enter":
            event.preventDefault();
            commandHandler({ action: "switch-tab" });
            break;
    }
}

const handleClick = (event) => {
    if (menu && !menu.contains(event.target)) {
        commandHandler({ action: "close-switcher" });
    }
}

const handleSearch = (e) => {
    console.log(e.target.value);
}

browser.runtime.onMessage.addListener(commandHandler);

class Menu {
    menu;
    tabsContainer;
    searchBar;

    constructor(url) {
        this.url = url;
    }

    async open() {
        if (this.menu) {
            return;
        }
        try {
            const response = await fetch(this.url);
            const html = await response.text();
            const container = document.createElement("div");
            const shadow = container.attachShadow({ mode: "open" })
            shadow.innerHTML = html;
            document.body.appendChild(container);


            this.menu = container
            this.tabsContainer = container.shadowRoot.querySelector("#tabs-cnt");
            this.searchBar = container.shadowRoot.querySelector("#search-bar");
            // this.#toggleEventlistener();
        } catch (err) {
            console.error("Error loading keyboard-tab-switcher menu", err)
            throw err
        }
    }
    //will need to pass the handlers for this to work here
    // #toggleEventlistener() {
    //     if (this.menu) {
    //         document.removeEventListener("keydown", handleKeydown);
    //         window.removeEventListener("click", handleClick);
    //         this.searchBar.removeEventListener("change", handleSearch);
    //     } else {
    //         this.searchBar.addEventListener("input", handleSearch);
    //         window.addEventListener("click", handleClick);
    //         document.addEventListener("keydown", handleKeydown)
    //     }
    // }

    close() {
        if (!this.menu) {
            return;
        }
        this.menu.remove();
        this.menu = undefined;
        // this.#toggleEventlistener();
    }
}

class Tabs {
    selectedTab;
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
        for (let i = loopInit; i <= loopCondition; i++) {
            const t = this.tabs[i];
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
            this.container.append(item);
        }

        if (reverse) {
            this.setSelectedTab(this.container.lastChild);
        } else {
            this.setSelectedTab(this.container.firstChild);
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
        if (this.selectedTab.nextSibling) {
            this.setSelectedTab(this.selectedTab.nextSibling);
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
        this.setSelectedTab(this.container.firstChild);
    }

    #cycleReverse() {
        // if there is a previous item select it
        if (this.selectedTab.previousSibling) {
            this.setSelectedTab(this.selectedTab.previousSibling);
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
        this.setSelectedTab(this.container.lastChild);
    }
}
