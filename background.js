browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === "queryTabs") {
        return browser.tabs.query({})
            .then(tabs => tabs);
    }
});
