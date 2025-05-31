
const loadMenu = async (url) => {
    try {
        const response = await fetch(url);
        const html = await response.text();
        const container = document.createElement("div");
        container.innerHTML = html;
        document.body.appendChild(container);
        return container
    } catch (err) {
        console.error("Error loading keyboard-tab-switcher menu", err)
        throw err
    }
}

(async () => {
    console.log("Loaded keyboard-tab-switcher");
    const menu = await loadMenu(browser.runtime.getURL("menu.html"));

    const tabsContainer = menu.querySelector("#tabs-cnt")
    const tabs = await browser.runtime.sendMessage({ action: "queryTabs" })
    tabs.forEach(t => {
        const el = document.createElement("div");
        el.innerText = t.title;
        el.onclick = () => {
            browser.runtime.sendMessage({ action: "switchTab", tab: t })
        }
        tabsContainer.append(el);
    });

})();

