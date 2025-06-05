import { MenuUI, EventHandlers } from "./menu";
import { PageAction, TabService } from "./tabs";
import { Command } from "./commands";
import { Logger } from "./logger";
import { IFuzzyFinder, MiniSearchFzf } from "./fuzzyfinder";

Logger.log("Loaded!")

let menu: MenuUI | undefined;
let tabs: TabService | undefined;
let fzf: IFuzzyFinder | undefined;
const pageLength = 6;

const commandHandlers: Record<Command, () => void> = {
    [Command.OpenMenu]: () => {
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
                fzf = new MiniSearchFzf(["title", "url"]);
            }
            tabs = new TabService(fzf, menu.tabsContainer, data, pageLength);
            tabs.render();
        });
    },
    [Command.CloseMenu]: () => {
        if (!menu) {
            return;
        }

        menu.close();
        menu = undefined;
        tabs = undefined;
        fzf = undefined;
    },
    [Command.CycleTabForward]: () => {
        if (!tabs) {
            Logger.warn("Cannot cycle tabs because TabService is undefined");
            return;
        }
        tabs.cycleForward();
    },
    [Command.CycleTabBackward]: () => {
        if (!tabs) {
            Logger.warn("Cannot cycle tabs because TabService is undefined");
            return;
        }
        tabs.cycleBackward();
    },
    [Command.SwitchTab]: () => {
        if (!tabs || !tabs.selectedTab) {
            Logger.warn("No tab selected.");
            return;
        }
        browser.runtime.sendMessage({
            action: "switch-tab",
            tabId: Number(tabs.selectedTab.dataset.id)
        });
        commandHandlers[Command.CloseMenu]();
    }
};

/*
 * Keys like 'Escape', 'Tab', 'Enter' aren't allowed as browser commands.
 * We add an event listener to work around this.
 */
const eventHandlers: EventHandlers = {
    keyDown: (event: KeyboardEvent) => {
        switch (event.key) {
            case "Escape":
                event.preventDefault();
                commandHandlers[Command.CloseMenu]();
                break;
            case "Tab":
                event.preventDefault();
                const cmd = event.shiftKey ? Command.CycleTabBackward : Command.CycleTabForward;
                commandHandlers[cmd]();
                break;
            case "Enter":
                event.preventDefault();
                commandHandlers[Command.SwitchTab]();
                break;
        }
    },
    click: (event: MouseEvent) => {
        if (!menu?.menu.contains(event.target as Node)) {
            commandHandlers[Command.CloseMenu]();
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
