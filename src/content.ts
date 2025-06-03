import { MenuUI, EventHandlers } from "./menu";
import { TabService } from "./tabs";
import { Command } from "./commands";

console.log("Loaded keyboard-tab-switcher");

let menu: MenuUI | undefined;
let tabs: TabService | undefined;
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
                console.warn("Not able to load tabs due to the menu not being found.");
                return;
            }
            tabs = new TabService(menu.tabsContainer, data, pageLength);
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
    },
    [Command.CycleTabForward]: () => {
        if (!tabs) {
            console.warn("Cannot cycle tabs because TabService is undefined");
            return;
        }
        tabs.cycleForward();
    },
    [Command.CycleTabBackward]: () => {
        if (!tabs) {
            console.warn("Cannot cycle tabs because TabService is undefined");
            return;
        }
        tabs.cycleBackward();
    },
    [Command.SwitchTab]: () => {
        if (!tabs || !tabs.selectedTab) {
            console.warn("No tab selected.");
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
    search: (event: Event) => {
        console.log((event.target as HTMLInputElement).value);
    }
};

browser.runtime.onMessage.addListener((cmd) => {
    if (Object.values(Command).includes(cmd as Command)) {
        commandHandlers[cmd as Command]();
    } else {
        console.warn("Invalid command", cmd);
    }
});
