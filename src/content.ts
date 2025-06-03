import { MenuUI, EventHandlers } from "./menu";
import { TabService } from "./tabs";
console.log("Loaded keyboard-tab-switcher");

let menu: MenuUI | undefined;
let tabs: TabService | undefined;
const pageLength = 6;


const commandHandler = async (cmd: string) => {
    switch (cmd) {
        case "open-switcher":
            if (menu) {
                return;
            }
            const url = browser.runtime.getURL("menu.html")
            menu = new MenuUI(url, eventHandlers);
            if (!menu.open() || !menu.tabsContainer) {
                return;
            }

            const tabData = await browser.runtime.sendMessage({ action: "query-tabs" });
            tabs = new TabService(menu.tabsContainer, tabData, pageLength);
            tabs.render();
            break;
        case "close-switcher":
            if (!menu) {
                return;
            }

            menu.close()
            menu = undefined
            tabs = undefined;
            break;
        case "cycle-tab":
            tabs?.cycle();
            break;
        case "cycle-tab-reverse":
            tabs?.cycleReverse();
            break;
        case "switch-tab":
            // const tabId = tabs.selectedTab.dataset.id;
            browser.runtime.sendMessage({
                action: "switch-tab",
                tabId: Number(tabs?.selectedTab.dataset.id)
            });
            commandHandler("close-switcher");
            break;
    }
}

/*
 * Keys like 'Escape', 'Tab', 'Enter' aren't allowed as browser commands.
 * We add an event listener to work around this.
*/
const eventHandlers: EventHandlers = {
    keyDown: (event: KeyboardEvent) => {
        switch (event.key) {
            case "Escape":
                event.preventDefault()
                commandHandler("close-switcher");
                break;
            case "Tab":
                event.preventDefault();
                const cmd = event.shiftKey ? "cycle-tab-reverse" : "cycle-tab";
                commandHandler(cmd);
                break;
            case "Enter":
                event.preventDefault();
                commandHandler("switch-tab");
                break;
        }
    },
    click: (event: MouseEvent) => {
        if (menu?.menu && !menu.menu.contains((event.target as Node))) {
            commandHandler("close-switcher");
        }
    },
    search: (event: Event) => {
        console.log((event.target as HTMLInputElement).value);
    }
}

browser.runtime.onMessage.addListener((cmd) => commandHandler(cmd.action));

