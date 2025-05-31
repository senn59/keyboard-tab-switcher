console.log("Loaded keyboard-tab-switcher");

let tabsContainer;
let searchBar;
let menu;
let tabs;
let selectedTab;

const loadMenu = async (url) => {
    try {
        const url = browser.runtime.getURL("menu.html")
        const response = await fetch(url);
        const html = await response.text();
        const container = document.createElement("div");
        container.innerHTML = html;
        document.body.appendChild(container);
        return container
    } catch (err) {
        console.error("Error loading keyboard-tab-switcher menu", err)
        throw err
    }
}

const loadTabs = async (tabsContainer) => {
    tabsContainer.innerHTML = "";
    tabs = await browser.runtime.sendMessage({ action: "query-tabs" });
    tabs.forEach(t => {
        const el = document.createElement("li");
        el.classList.add("tab");
        el.dataset.id = t.id
        el.innerText = t.title;
        el.onclick = () => {
            browser.runtime.sendMessage({ action: "switch-tab", tabId: t.id });
        }
        tabsContainer.append(el);
    });
    tabsContainer.firstChild.ariaSelected = true;
    selectedTab = tabsContainer.firstChild;
}

const setSelectedTab = (element) => {
    selectedTab.ariaSelected = false;
    selectedTab = element;
    element.ariaSelected = true;
}


const commandHandler = async (cmd) => {
    switch (cmd.action) {
        case "open-switcher":
            if (!menu) {
                menu = await loadMenu();
                tabsContainer = menu.querySelector("#tabs-cnt");
                searchBar = menu.querySelector("#tab-search-bar");
                searchBar.focus();
            }
            await loadTabs(tabsContainer);
            break;
        case "close-switcher":
            if (!menu) {
                return;
            }
            menu.remove();
            menu = undefined;
            break;
        case "cycle-tab":
            if (selectedTab.nextSibling) {
                setSelectedTab(selectedTab.nextSibling);
            } else {
                setSelectedTab(tabsContainer.firstChild);
            }
            break;
        case "cycle-tab-reverse":
            if (selectedTab.previousSibling) {
                setSelectedTab(selectedTab.previousSibling);
            } else {
                setSelectedTab(tabsContainer.lastChild);
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
document.addEventListener("keydown", (event) => {
    if (menu) {
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
})

window.addEventListener('click', function(event) {
    if (menu && !menu.contains(event.target)) {
        commandHandler({ action: "close-switcher" });
    }
});

browser.runtime.onMessage.addListener(commandHandler);


