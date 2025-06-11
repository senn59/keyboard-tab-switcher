import { MiniSearchFzf } from "./lib/search-provider";
import { PageAction, TabService } from "./lib/tab-service";

let tabService: TabService | null = null;
const tabsContainer = document.querySelector("#tabs-cnt") as HTMLElement;
let searchBar = document.querySelector("#search-bar") as HTMLInputElement;
setTimeout(() => searchBar.focus(), 50); // Delayed due to firefox extension popup behaviour

browser.runtime.sendMessage({ action: "query-tabs" }).then((data) => {
    if (tabsContainer) {
        const searcher = new MiniSearchFzf(["title", "domain", "path"]);
        tabService = new TabService(tabsContainer, data, searcher, 6);
        tabService.render(PageAction.FIRST);
    }
});

document.addEventListener("keydown", (event) => {
    switch (event.key) {
        case "Tab":
            event.preventDefault();
            event.shiftKey ? tabService?.cycleBackward() : tabService?.cycleForward();
            break;
        case "ArrowDown":
        case "ArrowRight":
            event.preventDefault();
            tabService?.cycleForward();
            break;
        case "ArrowUp":
        case "ArrowLeft":
            event.preventDefault();
            tabService?.cycleBackward();
            break;
        case "Enter":
            event.preventDefault();
            if (!tabService || !tabService.selectedTab) {
                console.warn("No tab selected.");
                return;
            }
            browser.runtime.sendMessage({
                action: "switch-tab",
                tabId: Number(tabService.selectedTab.dataset.id)
            });
            window.close();
            break;
    }
});

searchBar.addEventListener("input", () => {
    tabService?.search(searchBar.value);
});
