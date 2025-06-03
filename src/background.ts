import { Tab } from "./tabs";
browser.runtime.onMessage.addListener((message) => {
    switch (message.action) {
        case "query-tabs":
            return browser.tabs.query({ /*active: false*/ })
                .then(tabs => tabs.map(t => ({
                    id: t.id,
                    title: t.title,
                    url: t.url,
                    favicon: t.favIconUrl
                } as Tab
                )));
        case "switch-tab":
            browser.tabs.update(message.tabId, { active: true });
            break;
    }
});

const sendCommand = (cmd) => {
    browser.tabs.query({ active: true }).then(tabs => {
        if (!tabs[0].id) return;
        browser.tabs.sendMessage(tabs[0].id, { action: cmd });
    });
}

browser.commands.onCommand.addListener(cmd => {
    switch (cmd) {
        case "open-switcher":
            sendCommand(cmd);
            break;
        case "close-switcher":
            sendCommand(cmd);
            break;
    }
});
browser.tabs.onActivated.addListener(() => {
    sendCommand("close-switcher");
})
