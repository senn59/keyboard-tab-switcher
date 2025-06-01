import { Menu } from "./menu";
import { Tabs } from "./tabs";

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

            tabData = await browser.runtime.sendMessage({ action: "query-tabs" });
            tabs = new Tabs(menu.tabsContainer, tabData, pageLength);

            menu.searchBar.addEventListener("input", handleSearch);
            window.addEventListener("click", handleClick);
            document.addEventListener("keydown", handleKeydown)
            break;
        case "close-switcher":
            if (!menu) {
                return;
            }

            menu.close()
            menu = undefined
            tabs = undefined;

            document.removeEventListener("keydown", handleKeydown);
            window.removeEventListener("click", handleClick);
            searchBar.removeEventListener("change", handleSearch);
            break;
        case "cycle-tab":
            tabs.cycle(cmd.reverse);
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

