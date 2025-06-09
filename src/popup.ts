import { PageAction, TabService } from "./lib/tab-service";

const tabsContainer = document.querySelector("#tabs-cnt") as HTMLElement;
const searchBar = document.querySelector("#search-bar") as HTMLInputElement;
let tabService: TabService | null = null;
browser.runtime.sendMessage({ action: "query-tabs" }).then((data) => {
    if (tabsContainer) {
        tabService = new TabService(tabsContainer, data, 3);
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
