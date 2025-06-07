import { Logger } from "./logger";

export interface EventHandlers {
    keyDown: (event: KeyboardEvent) => void;
    click: (event: MouseEvent) => void;
    search: () => void;
}

export class MenuUI {
    menu!: HTMLElement;
    tabsContainer!: HTMLElement;
    searchBar!: HTMLInputElement;
    #url: string;

    #eventHandlers: EventHandlers;

    constructor(url: string, eventHandlers: EventHandlers) {
        this.#url = url;
        this.#eventHandlers = eventHandlers;
    }

    async open(): Promise<boolean> {
        if (this.menu) {
            return false;
        }
        try {
            const response = await fetch(this.#url);
            const html = await response.text();
            const container = document.createElement("div");
            const shadow = container.attachShadow({ mode: "open" });
            shadow.innerHTML = html;
            document.body.appendChild(container);

            const tabsContainer = shadow.querySelector("#tabs-cnt");
            const searchBar = shadow.querySelector("#search-bar");

            if (!tabsContainer) {
                throw new Error("Missing tabs container");
            }
            if (!searchBar) {
                throw new Error("Missing search bar");
            }

            this.menu = container;
            this.tabsContainer = tabsContainer as HTMLElement;
            this.searchBar = searchBar as HTMLInputElement;
            this.searchBar.focus();
            this.#addListeners();
        } catch (err) {
            Logger.error("Error loading menu", err);
            return false;
        }
        return true;
    }

    #addListeners() {
        if (!this.menu) {
            return;
        }
        document.addEventListener("keydown", this.#eventHandlers.keyDown);
        window.addEventListener("click", this.#eventHandlers.click);
        this.searchBar.addEventListener("input", this.#eventHandlers.search);
    }

    #removeListeners() {
        if (!this.menu) {
            return;
        }
        document.removeEventListener("keydown", this.#eventHandlers.keyDown);
        window.removeEventListener("click", this.#eventHandlers.click);
        this.searchBar.removeEventListener("input", this.#eventHandlers.search);
    }

    close() {
        if (!this.menu) {
            return;
        }
        this.#removeListeners();
        this.menu.remove();
    }
}
