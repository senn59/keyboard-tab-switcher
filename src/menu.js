export default class Menu {
    menu;
    tabsContainer;
    searchBar;

    constructor(url) {
        this.url = url;
    }

    async open() {
        if (this.menu) {
            return;
        }
        try {
            const response = await fetch(this.url);
            const html = await response.text();
            const container = document.createElement("div");
            const shadow = container.attachShadow({ mode: "open" })
            shadow.innerHTML = html;
            document.body.appendChild(container);


            this.menu = container
            this.tabsContainer = container.shadowRoot.querySelector("#tabs-cnt");
            this.searchBar = container.shadowRoot.querySelector("#search-bar");
            this.searchBar.focus();
            // this.#toggleEventlistener();
        } catch (err) {
            console.error("Error loading keyboard-tab-switcher menu", err)
            throw err
        }
    }
    //will need to pass the handlers for this to work here
    // #toggleEventlistener() {
    //     if (this.menu) {
    //         document.removeEventListener("keydown", handleKeydown);
    //         window.removeEventListener("click", handleClick);
    //         this.searchBar.removeEventListener("change", handleSearch);
    //     } else {
    //         this.searchBar.addEventListener("input", handleSearch);
    //         window.addEventListener("click", handleClick);
    //         document.addEventListener("keydown", handleKeydown)
    //     }
    // }

    close() {
        if (!this.menu) {
            return;
        }
        this.menu.remove();
        this.menu = undefined;
        // this.#toggleEventlistener();
    }
}
