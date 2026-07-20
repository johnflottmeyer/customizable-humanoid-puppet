/* ==========================
   DRAWER ELEMENTS
========================== */

const drawer =
    document.getElementById("customizeDrawer");

const customizeButton =
    document.getElementById("customizeButton");

const closeDrawerButton =
    document.getElementById("closeDrawerButton");

const drawerOverlay =
    document.getElementById("drawerOverlay");

const panelContainer =
    document.getElementById("customizePanels");


/* ==========================
   DRAWER STATE
========================== */

let drawerOpen = false;


/* ==========================
   UPDATE DRAWER
========================== */

function updateCustomizeDrawer() {

    if (!drawer) {
        return;
    }

    drawer.classList.toggle(
        "open",
        drawerOpen
    );

    if (drawerOverlay) {

        drawerOverlay.classList.toggle(
            "visible",
            drawerOpen
        );

        drawerOverlay.setAttribute(
            "aria-hidden",
            String(!drawerOpen)
        );

    }

    drawer.setAttribute(
        "aria-hidden",
        String(!drawerOpen)
    );

    if (customizeButton) {

        customizeButton.setAttribute(
            "aria-expanded",
            String(drawerOpen)
        );

    }

}


/* ==========================
   OPEN DRAWER
========================== */

function openCustomizeDrawer() {

    drawerOpen = true;

    updateCustomizeDrawer();

}


/* ==========================
   CLOSE DRAWER
========================== */

function closeCustomizeDrawer() {

    drawerOpen = false;

    updateCustomizeDrawer();

}


/* ==========================
   TOGGLE DRAWER
========================== */

function toggleCustomizeDrawer() {

    drawerOpen = !drawerOpen;

    updateCustomizeDrawer();

}


/* ==========================
   DRAWER EVENTS
========================== */

if (customizeButton) {

    customizeButton.addEventListener(
        "click",
        toggleCustomizeDrawer
    );

}

if (closeDrawerButton) {

    closeDrawerButton.addEventListener(
        "click",
        closeCustomizeDrawer
    );

}

if (drawerOverlay) {

    drawerOverlay.addEventListener(
        "click",
        closeCustomizeDrawer
    );

}


/* ==========================
   ESCAPE KEY
========================== */

document.addEventListener(
    "keydown",
    function (event) {

        if (
            event.key === "Escape" &&
            drawerOpen
        ) {
            closeCustomizeDrawer();
        }

    }
);


/* ==========================
   OPTIONAL DYNAMIC PANEL
========================== */

function addCustomizePanel(
    title,
    html,
    openByDefault = false
) {

    if (!panelContainer) {
        return null;
    }

    const details =
        document.createElement("details");

    details.open = openByDefault;


    const summary =
        document.createElement("summary");

    summary.textContent = title;


    const body =
        document.createElement("div");

    body.className = "panelBody";
    body.innerHTML = html;


    details.appendChild(summary);
    details.appendChild(body);

    panelContainer.appendChild(details);

    return body;

}


/* ==========================
   MAKE FUNCTIONS AVAILABLE
========================== */

window.openCustomizeDrawer =
    openCustomizeDrawer;

window.closeCustomizeDrawer =
    closeCustomizeDrawer;

window.toggleCustomizeDrawer =
    toggleCustomizeDrawer;

window.addCustomizePanel =
    addCustomizePanel;
