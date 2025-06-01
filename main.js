console.log("Loaded keyboard-tab-switcher");

let tabsContainer;
let searchBar;
let menu;
let tabs;
let selectedTab;
let page;
const maxPageItems = 6

const loadMenu = async (url) => {
    try {
        const url = browser.runtime.getURL("menu.html")
        const response = await fetch(url);
        const html = await response.text();
        const container = document.createElement("div");
        const shadow = container.attachShadow({ mode: "open" })
        shadow.innerHTML = html;
        document.body.appendChild(container);
        return container
    } catch (err) {
        console.error("Error loading keyboard-tab-switcher menu", err)
        throw err
    }
}

const loadTabs = async (container, options) => {
    container.innerHTML = "";
    tabs = await browser.runtime.sendMessage({ action: "query-tabs" });
    page = options.page
    if (tabs.length <= maxPageItems) {
        page = 1;
    }

    const loopInit = (maxPageItems * page) - maxPageItems;
    const loopCondition = (maxPageItems * page) - 1;
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

    if (options.reverse) {
        setSelectedTab(container.lastChild);
    } else {
        setSelectedTab(container.firstChild);
    }
}

const setSelectedTab = (element) => {
    if (selectedTab) {
        selectedTab.ariaSelected = false;
    }
    selectedTab = element;
    element.ariaSelected = true;
}


const commandHandler = async (cmd) => {
    switch (cmd.action) {
        case "open-switcher":
            if (!menu) {
                menu = await loadMenu();
                tabsContainer = menu.shadowRoot.querySelector("#tabs-cnt");
                searchBar = menu.shadowRoot.querySelector("#search-bar");
                console.log(searchBar)
                searchBar.focus();
                searchBar.addEventListener("input", handleSearch);
                window.addEventListener("click", handleClick);
                document.addEventListener("keydown", handleKeydown)
            }
            await loadTabs(tabsContainer, { page: 1 });
            break;
        case "close-switcher":
            if (!menu) {
                return;
            }
            menu.remove();
            menu = undefined;

            document.removeEventListener("keydown", handleKeydown);
            window.removeEventListener("click", handleClick);
            searchBar.removeEventListener("change", handleSearch);
            break;
        case "cycle-tab":
            if (selectedTab.nextSibling) {
                setSelectedTab(selectedTab.nextSibling);
            } else if (tabs.length > page * maxPageItems) {
                loadTabs(tabsContainer, { page: page + 1 });
            } else {
                const maxPages = Math.ceil(tabs.length / maxPageItems);
                if (maxPages > 1 && page === maxPages) {
                    loadTabs(tabsContainer, { page: 1 });
                } else {
                    setSelectedTab(tabsContainer.firstChild);
                }
            }
            break;
        case "cycle-tab-reverse":
            if (selectedTab.previousSibling) {
                setSelectedTab(selectedTab.previousSibling);
            } else if (page > 1) {
                loadTabs(tabsContainer, { page: page - 1, reverse: true });
            } else {
                const maxPages = Math.ceil(tabs.length / maxPageItems);
                if (maxPages > 1) {
                    loadTabs(tabsContainer, { page: maxPages, reverse: true });
                } else {
                    setSelectedTab(tabsContainer.lastChild);
                }
            }
            break;
        case "switch-tab":
            commandHandler({ action: "close-switcher" })
            browser.runtime.sendMessage({
                action: "switch-tab",
                tabId: Number(selectedTab.dataset.id)
            });
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
            const command = event.shiftKey ? "cycle-tab-reverse" : "cycle-tab";
            commandHandler({ action: command });
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

