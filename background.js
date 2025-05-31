browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === "queryTabs") {
        return browser.tabs.query({})
            .then(tabs => tabs.map(t => { //.filter(t => !t.active)
                return {
                    id: t.id,
                    title: t.title,
                    url: t.url,
                }
            }));
    } else if (message.action === "switchTab") {
        browser.tabs.update(message.tab.id, {active: true});
    }
});
