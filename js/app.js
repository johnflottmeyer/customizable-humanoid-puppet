/* ==========================
   DEFAULT HEAD VALUES
========================== */

const defaultHeadSettings = {

    headHeight: 475,
    foreheadWidth: 105,
    templeWidth: 138,
    cheekWidth: 142,
    jawWidth: 108,
    chinWidth: 82,
    chinBottomWidth: 48,
    chinDepth: 10,
    chinRoundness: 34

};


/* ==========================
   HEAD CONTROL NAMES
========================== */

const headControls = [

    "headHeight",
    "foreheadWidth",
    "templeWidth",
    "cheekWidth",
    "jawWidth",
    "chinWidth",
    "chinBottomWidth",
    "chinDepth",
    "chinRoundness"

];


/* ==========================
   DISPLAY HEAD VALUE
========================== */

function displayHeadValue(settingName) {

    const valueDisplay =
        document.getElementById(
            `${settingName}Value`
        );

    if (!valueDisplay) {
        return;
    }

    valueDisplay.textContent =
        window.headSettings[settingName];

}


/* ==========================
   INITIALIZE HEAD CONTROLS
========================== */

function initializeHeadControls() {

    headControls.forEach(
        function (settingName) {

            const slider =
                document.getElementById(
                    settingName
                );

            if (!slider) {

                console.warn(
                    `Could not find head slider: ${settingName}`
                );

                return;

            }

            slider.value =
                window.headSettings[settingName];

            displayHeadValue(settingName);


            slider.addEventListener(
                "input",
                function () {

                    window.headSettings[
                        settingName
                    ] = Number(slider.value);

                    displayHeadValue(
                        settingName
                    );

                    window.drawHead();

                    /*
                     Eyes are positioned inside the SVG,
                     so redraw them after the head changes.
                    */

                    if (
                        typeof window.drawEyes ===
                        "function"
                    ) {

                        window.drawEyes();

                    }

                }
            );

        }
    );

}


/* ==========================
   UPDATE HEAD CONTROLS
========================== */

function updateHeadControls() {

    headControls.forEach(
        function (settingName) {

            const slider =
                document.getElementById(
                    settingName
                );

            if (!slider) {
                return;
            }

            slider.value =
                window.headSettings[settingName];

            displayHeadValue(settingName);

        }
    );

}


/* ==========================
   HEAD STATUS MESSAGE
========================== */

function displayHeadStatus(message) {

    const saveStatus =
        document.getElementById(
            "saveStatus"
        );

    if (!saveStatus) {
        return;
    }

    saveStatus.textContent = message;

}


/* ==========================
   SAVE HEAD
========================== */

function saveHead() {

    try {

        localStorage.setItem(
            "humanoidHeadSettings",
            JSON.stringify(
                window.headSettings
            )
        );

        displayHeadStatus(
            "Head settings saved."
        );

    } catch (error) {

        displayHeadStatus(
            "Head settings could not be saved."
        );

        console.error(
            "Head settings could not be saved:",
            error
        );

    }

}


/* ==========================
   LOAD HEAD
========================== */

function loadHead() {

    const savedSettings =
        localStorage.getItem(
            "humanoidHeadSettings"
        );

    if (!savedSettings) {
        return false;
    }

    try {

        const parsedSettings =
            JSON.parse(savedSettings);

        Object.assign(
            window.headSettings,
            parsedSettings
        );

        updateHeadControls();

        window.drawHead();

        if (
            typeof window.drawEyes ===
            "function"
        ) {

            window.drawEyes();

        }

        displayHeadStatus(
            "Saved head settings loaded."
        );

        return true;

    } catch (error) {

        console.error(
            "Saved head settings could not be loaded:",
            error
        );

        return false;

    }

}


/* ==========================
   RESET HEAD
========================== */

function resetHead() {

    Object.assign(
        window.headSettings,
        defaultHeadSettings
    );

    updateHeadControls();

    window.drawHead();

    if (
        typeof window.drawEyes ===
        "function"
    ) {

        window.drawEyes();

    }

    displayHeadStatus(
        "Head settings reset."
    );

}


/* ==========================
   HEAD BUTTON EVENTS
========================== */

function initializeHeadButtons() {

    const saveButton =
        document.getElementById(
            "saveHead"
        );

    const loadButton =
        document.getElementById(
            "loadHead"
        );

    const resetButton =
        document.getElementById(
            "resetHead"
        );


    if (saveButton) {

        saveButton.addEventListener(
            "click",
            saveHead
        );

    }

    if (loadButton) {

        loadButton.addEventListener(
            "click",
            function () {

                const loaded =
                    loadHead();

                if (!loaded) {

                    displayHeadStatus(
                        "No saved head was found."
                    );

                }

            }
        );

    }

    if (resetButton) {

        resetButton.addEventListener(
            "click",
            resetHead
        );

    }

}


/* ==========================
   EYE BUTTON EVENTS
========================== */

function initializeEyeButtons() {

    const saveButton =
        document.getElementById(
            "saveEyes"
        );

    const loadButton =
        document.getElementById(
            "loadEyes"
        );

    const resetButton =
        document.getElementById(
            "resetEyes"
        );


    if (
        saveButton &&
        typeof window.saveEyes ===
        "function"
    ) {

        saveButton.addEventListener(
            "click",
            window.saveEyes
        );

    }

    if (
        loadButton &&
        typeof window.loadEyes ===
        "function"
    ) {

        loadButton.addEventListener(
            "click",
            function () {

                const loaded =
                    window.loadEyes();

                if (!loaded) {

                    const status =
                        document.getElementById(
                            "eyeSaveStatus"
                        );

                    if (status) {

                        status.textContent =
                            "No saved eyes were found.";

                    }

                }

            }
        );

    }

    if (
        resetButton &&
        typeof window.resetEyes ===
        "function"
    ) {

        resetButton.addEventListener(
            "click",
            window.resetEyes
        );

    }

}


/* ==========================
   START APPLICATION
========================== */

window.addEventListener(
    "DOMContentLoaded",
    function () {

        /* ==========================
           HEAD
        ========================== */

        if (
            typeof window.drawHead !==
            "function"
        ) {

            console.error(
                "drawHead() was not loaded."
            );

            return;

        }

        if (!window.headSettings) {

            console.error(
                "window.headSettings was not loaded."
            );

            return;

        }

        initializeHeadControls();

        initializeHeadButtons();

        const savedHeadLoaded =
            loadHead();

        if (!savedHeadLoaded) {

            updateHeadControls();

            window.drawHead();

        }


        /* ==========================
           EYES
        ========================== */

        if (
            typeof window.initializeEyeControls ===
            "function"
        ) {

            window.initializeEyeControls();

            initializeEyeButtons();

            const savedEyesLoaded =
                typeof window.loadEyes ===
                "function"
                    ? window.loadEyes()
                    : false;

            if (!savedEyesLoaded) {

                if (
                    typeof window.updateEyeControls ===
                    "function"
                ) {

                    window.updateEyeControls();

                }

                if (
                    typeof window.drawEyes ===
                    "function"
                ) {

                    window.drawEyes();

                }

            }

        } else {

            console.error(
                "Eye functions were not loaded."
            );

        }


        /* ==========================
           NOSE
        ========================== */

        if (
            typeof window.initializeNose ===
            "function"
        ) {

            window.initializeNose();

        } else if (
            typeof initializeNose ===
            "function"
        ) {

            initializeNose();

        } else {

            console.error(
                "initializeNose() was not loaded."
            );

        }


        /* ==========================
           IDLE ANIMATION
        ========================== */

        if (
            typeof window.startIdleAnimation ===
            "function"
        ) {

            window.startIdleAnimation();

        } else {

            console.warn(
                "startIdleAnimation() was not loaded."
            );

        }

    }
);
