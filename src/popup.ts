import { MiniSearchFzf } from "./lib/search-provider";
import { PageAction, TabService } from "./lib/tab-service";

const tabsContainer = document.querySelector("#tabs-cnt") as HTMLElement;
let searchBar = document.querySelector("#search-bar") as HTMLInputElement;
setTimeout(() => searchBar.focus(), 50); // Delayed due to firefox extension popup behaviour

let tabService: TabService | null = null;
browser.runtime.sendMessage({ action: "query-tabs" }).then((data) => {
    if (tabsContainer) {
        const fzf = new MiniSearchFzf(["title", "domain", "path"]);
        tabService = new TabService(tabsContainer, data, fzf, 3);
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
            //switch tab
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
