// import { Command } from "./commands";
import { Tab } from "./lib/tab-service";

// Commands received from content script
browser.runtime.onMessage.addListener((message) => {
    switch (message.action) {
        case "query-tabs":
            return browser.tabs.query({}).then((tabs) => tabs.map(filterTab));
        case "switch-tab":
            browser.tabs.update(message.tabId, { active: true });
            break;
    }
});

const filterTab = (tab: browser.tabs.Tab): Tab => {
    if (!tab.id) {
        throw Error("Tab is missing an Id");
    }
    const url = new URL(tab.url ?? "");
    const hostname = url.hostname.replace(/^www\./, "");
    let path;
    if (isGenericTitle(tab.title ?? "", hostname)) {
        path = parseUrlPath(url.pathname, url.search);
    }
    return {
        id: tab.id,
        title: tab.title ?? "",
        domain: hostname,
        path: path,
        favicon: tab.favIconUrl,
        active: tab.active
    };
};

const isGenericTitle = (title: string, hostname: string): boolean =>
    title === hostname || title === hostname.split(".")[0];

const parseUrlPath = (path: string, params: string) => {
    path = path
        .replace(/^\/+|\/+$/g, "") // remove leading/trailing slashesh
        .replace(/[\/_\-\+]/g, " ") // replace seperators / _ - + with spaces
        .replace(/\s+/g, " ") // collapse spaces
        .trim();
    params = params
        .replace(/[?&]\w+=/g, " ") // remove params (like ?query= &id=)
        .replace(/\s+/g, " ") // collapse spaces
        .trim();
    return path + " " + params;
};
