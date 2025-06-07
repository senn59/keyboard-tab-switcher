import { MenuUI, EventHandlers } from "./menu-ui";
import { TabService } from "./tab-service";
import { Command } from "./commands";
import { Logger } from "./logger";
import { IFuzzyFinder, MiniSearchFzf } from "./fuzzy-finder";

Logger.log("Loaded!");

let menu: MenuUI | undefined;
let tabs: TabService | undefined;
let fzf: IFuzzyFinder | undefined;
const pageLength = 6;

const commandHandlers: Record<Command, () => void> = {
    [Command.OPEN_MENU]: () => {
        if (menu) {
            return;
        }
        const url = browser.runtime.getURL("menu.html");
        menu = new MenuUI(url, eventHandlers);
        if (!menu.open()) {
            return;
        }
        browser.runtime.sendMessage({ action: "query-tabs" }).then((data) => {
            if (!menu) {
                Logger.warn("Not able to load tabs due to the menu not being found.");
                return;
            }
            if (!fzf) {
                fzf = new MiniSearchFzf(["host", "title", "path"]);
            }
            tabs = new TabService(fzf, menu.tabsContainer, data, pageLength);
            tabs.render();
        });
    },
    [Command.CLOSE_MENU]: () => {
        if (!menu) {
            return;
        }
        menu.close();
        menu = undefined;
        tabs = undefined;
        fzf = undefined;
    },
    [Command.CYCLE_TAB_FORWARD]: () => {
        if (!tabs) {
            Logger.warn("Cannot cycle tabs because TabService is undefined");
            return;
        }
        tabs.cycleForward();
    },
    [Command.CYCLE_TAB_BACKWARD]: () => {
        if (!tabs) {
            Logger.warn("Cannot cycle tabs because TabService is undefined");
            return;
        }
        tabs.cycleBackward();
    },
    [Command.SWITCH_TAB]: () => {
        if (!tabs || !tabs.selectedTab) {
            Logger.warn("No tab selected.");
            return;
        }
        browser.runtime.sendMessage({
            action: "switch-tab",
            tabId: Number(tabs.selectedTab.dataset.id)
        });
        commandHandlers[Command.CLOSE_MENU]();
    }
};

const eventHandlers: EventHandlers = {
    /*
     * Keys like 'Escape', 'Tab', 'Enter' aren't allowed as browser commands.
     * So instead we handle this in a keyDown event listener
     */
    keyDown: (event: KeyboardEvent) => {
        switch (event.key) {
            case "Escape":
                event.preventDefault();
                commandHandlers[Command.CLOSE_MENU]();
                break;
            case "Tab":
                event.preventDefault();
                const cmd = event.shiftKey ? Command.CYCLE_TAB_BACKWARD : Command.CYCLE_TAB_FORWARD;
                commandHandlers[cmd]();
                break;
            case "ArrowDown":
            case "ArrowRight":
                commandHandlers[Command.CYCLE_TAB_FORWARD]();
                break;
            case "ArrowUp":
            case "ArrowLeft":
                commandHandlers[Command.CYCLE_TAB_BACKWARD]();
                break;
            case "Enter":
                event.preventDefault();
                commandHandlers[Command.SWITCH_TAB]();
                break;
        }
    },
    click: (event: MouseEvent) => {
        if (!menu?.menu.contains(event.target as Node)) {
            commandHandlers[Command.CLOSE_MENU]();
        }
    },
    search: () => {
        tabs?.search(menu?.searchBar.value ?? "");
    }
};

browser.runtime.onMessage.addListener((cmd) => {
    if (Object.values(Command).includes(cmd as Command)) {
        commandHandlers[cmd as Command]();
    } else {
        Logger.warn("Invalid command", cmd);
    }
});
