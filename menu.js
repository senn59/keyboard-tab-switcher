export class Menu {
    menu;
    tabsContainer;
    searchBar;

    constructor(url) {
        this.url = url;
    }

    async open() {
        if (menu) {
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
            this.#toggleEventlistener();
        } catch (err) {
            console.error("Error loading keyboard-tab-switcher menu", err)
            throw err
        }
    }

    #toggleEventlistener() {
        if (this.menu) {
            document.removeEventListener("keydown", handleKeydown);
            window.removeEventListener("click", handleClick);
            this.searchBar.removeEventListener("change", handleSearch);
        } else {
            this.searchBar.addEventListener("input", handleSearch);
            window.addEventListener("click", handleClick);
            document.addEventListener("keydown", handleKeydown)
        }
    }

    close() {
        if (!menu) {
            return;
        }
        menu.remove();
        menu = undefined;
        this.#toggleEventlistener();
    }
}
