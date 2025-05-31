browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === "queryTabs") {
        return browser.tabs.query({ /*active: false*/ })
            .then(tabs => tabs.map(t => {
                return {
                    id: t.id,
                    title: t.title,
                    url: t.url,
                }
            }));
    } else if (message.action === "switchTab") {
        browser.tabs.update(message.tab.id, { active: true });
    }
});

const sendToCurrentTab = (cmd) => {
    browser.tabs.query({ active: true }).then(tabs => {
        browser.tabs.sendMessage(tabs[0].id, { action: cmd });
    }).catch(err => {
        console.error(`Failed to send cmd '${cmd}'`, err);
    })
}

browser.commands.onCommand.addListener(cmd => {
    switch (cmd) {
        case "open-switcher":
            sendToCurrentTab(cmd);
            break;
        case "close-switcher":
            sendToCurrentTab(cmd);
            break;
    }
});
