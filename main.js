console.log("Loaded keyboard-tab-switcher");
const menu = browser.runtime.getURL("menu.html");
fetch(menu)
    .then(response => response.text())
    .then(html => {
        const container = document.createElement("div");
        container.innerHTML = html;
        document.body.appendChild(container); 
    })
    .catch(err => console.error("Error loading keyboard-tab-switcher menu", err));
