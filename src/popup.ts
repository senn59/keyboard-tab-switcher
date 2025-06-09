import { PageAction, TabService } from "./lib/tab-service";

const tabsContainer = document.querySelector("#tabs-cnt");
const searchBar = document.querySelector("#search-bar");
browser.runtime.sendMessage({ action: "query-tabs" }).then((data) => {
    if (tabsContainer) {
        const tabService = new TabService(tabsContainer as HTMLElement, data, 3);
        tabService.render(PageAction.FIRST);
    }
})
