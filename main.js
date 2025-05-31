console.log("Loaded keyboard-tab-switcher");

let tabsContainer;
let searchBar;
let menu;

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
    const tabs = await browser.runtime.sendMessage({ action: "queryTabs" });
    tabs.forEach(t => {
        const el = document.createElement("div");
        el.innerText = t.title;
        el.onclick = () => {
            browser.runtime.sendMessage({ action: "switchTab", tab: t });
        }
        tabsContainer.append(el);
    });
}


const commandHandler = async (cmd) => {
    switch (cmd.action) {
        case "open-switcher":
            if (!menu) {
                menu = await loadMenu();
                console.log(menu);
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
    }
}

/*
 * Keys like 'Escape', 'Tab', 'Enter' aren't allowed as browser commands.
 * We add an event listener to work around this.
*/
document.addEventListener("keydown", (event) => {
    switch (event.key) {
        case "Escape":
            event.preventDefault()
            commandHandler({ action: "close-switcher" })
            break;
        case "Tab":
            event.preventDefault();
            commandHandler({ action: "cycle", reverse: event.shiftKey })
            break;
        case "Enter":
            event.preventDefault();
            break;
    }
})

window.addEventListener('click', function(event) {
    if (menu && !menu.contains(event.target)) {
        commandHandler({ action: "close-switcher" });
    }
});

browser.runtime.onMessage.addListener(commandHandler);


