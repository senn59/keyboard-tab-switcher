console.log("Loaded keyboard-tab-switcher");

function logTabs(tabs) {
  console.log(tabs);
}

browser.runtime.sendMessage({ action: "queryTabs" }).then(tabs => {
    console.log(tabs)
})

const menu = browser.runtime.getURL("menu.html");
fetch(menu)
    .then(response => response.text())
    .then(html => {
        const container = document.createElement("div");
        container.innerHTML = html;
        document.body.appendChild(container); 
    })
    .catch(err => console.error("Error loading keyboard-tab-switcher menu", err));
