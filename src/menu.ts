export interface EventHandlers {
    keyDown: (event: KeyboardEvent) => void;
    click: (event: MouseEvent) => void;
    search: (event: Event) => void;
}

export class MenuUI {
    menu: HTMLElement | undefined;
    tabsContainer: HTMLElement | undefined;
    searchBar: HTMLInputElement | undefined;
    url: string;

    eventHandlers: EventHandlers;

    constructor(url: string, eventHandlers: EventHandlers) {
        this.url = url;
        this.eventHandlers = eventHandlers;
    }

    async open(): Promise<boolean> {
        if (this.menu) {
            return false;
        }
        try {
            const response = await fetch(this.url);
            const html = await response.text();
            const container = document.createElement("div");
            const shadow = container.attachShadow({ mode: "open" })
            shadow.innerHTML = html;
            document.body.appendChild(container);


            const tabsContainer = shadow.querySelector("#tabs-cnt") as HTMLElement;
            const searchBar = shadow.querySelector("#search-bar") as HTMLInputElement;
            if (!(this.tabsContainer instanceof HTMLElement)) {
                throw new Error("Missing tabs container")
            }
            if (!(this.searchBar instanceof HTMLInputElement)) {
                throw new Error("Missing tabs container")
            }

            this.menu = container;
            this.tabsContainer = tabsContainer
            this.searchBar = searchBar;
            this.searchBar.focus();
            this.#addListeners();
        } catch (err) {
            console.error("Error loading keyboard-tab-switcher menu", err)
            return false;
        }
        return true;
    }

    //will need to pass the handlers for this to work here
    #addListeners() {
        document.addEventListener("keydown", this.eventHandlers.keyDown);
        window.addEventListener("click", this.eventHandlers.click);
        this.searchBar?.addEventListener("change", this.eventHandlers.search);
    }

    #removeListeners() {
        document.removeEventListener("keydown", this.eventHandlers.keyDown);
        window.removeEventListener("click", this.eventHandlers.click);
        this.searchBar?.removeEventListener("change", this.eventHandlers.search);
    }

    close() {
        if (!this.menu) {
            return;
        }
        this.#removeListeners();
        this.menu.remove();
        this.menu = undefined;
        this.searchBar = undefined;
        this.tabsContainer = undefined;
        this.url = "";
        this.eventHandlers = {
            keyDown: () => { },
            click: () => { },
            search: () => { }
        }
    }
}
