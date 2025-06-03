import { Command } from "./commands";
import { Tab } from "./tabs";
// Commands received from content script
browser.runtime.onMessage.addListener((message) => {
    switch (message.action) {
        case "query-tabs":
            return browser.tabs.query({}).then((tabs) =>
                tabs.map(
                    (t) =>
                        ({
                            id: t.id,
                            title: t.title,
                            url: t.url,
                            favicon: t.favIconUrl
                        }) as Tab
                )
            );
        case "switch-tab":
            browser.tabs.update(message.tabId, { active: true });
            break;
    }
});

// Send command to the content script
const sendCommand = (cmd: string) => {
    browser.tabs.query({ active: true }).then((tabs) => {
        if (!tabs[0].id) return;
        browser.tabs.sendMessage(tabs[0].id, cmd);
    });
};

// Commands received as defined in manifest.json
browser.commands.onCommand.addListener((cmd) => {
    if (Object.values(Command).includes(cmd as Command)) {
        sendCommand(cmd);
    }
});

// Event that triggers when user switches tabs
browser.tabs.onActivated.addListener(() => {
    sendCommand(Command.CloseMenu);
});
