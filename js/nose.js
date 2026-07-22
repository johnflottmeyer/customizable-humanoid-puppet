/* ==========================
   DEFAULT NOSE VALUES
========================== */

const defaultNoseSettings = {

    /* Entire nose group */

    noseX: 0,
    noseY: -75,

    /* Main nose */

    noseWidth: 29,
    noseHeight: 33,

    /* Nostril wings */

    nostrilSpacing: 22,
    nostrilY: 396,
    nostrilWidth: 22,
    nostrilHeight: 14,

    /* Nostril holes */

    nostrilHoleSpacing: 19,
    nostrilHoleY: 399,
    nostrilHoleWidth: 9,
    nostrilHoleHeight: 2

};


/* ==========================
   NOSE CONTROL NAMES
========================== */

const noseControls = [

    "noseX",
    "noseY",

    "noseWidth",
    "noseHeight",

    "nostrilSpacing",
    "nostrilY",
    "nostrilWidth",
    "nostrilHeight",

    "nostrilHoleSpacing",
    "nostrilHoleY",
    "nostrilHoleWidth",
    "nostrilHoleHeight"

];


/* ==========================
   CURRENT NOSE SETTINGS
========================== */

window.noseSettings = {
    ...defaultNoseSettings
};


/* ==========================
   DISPLAY NOSE VALUE
========================== */

function displayNoseValue(settingName) {

    const valueDisplay =
        document.getElementById(
            `${settingName}Value`
        );

    if (!valueDisplay) {
        return;
    }

    valueDisplay.textContent =
        window.noseSettings[settingName];

}


/* ==========================
   APPLY NOSE SETTINGS
========================== */

function applyNoseSettings() {

    const settings =
        window.noseSettings;


    /* ==========================
       GET SVG ELEMENTS
    ========================== */

    const noseGroup =
        document.getElementById(
            "nose"
        );

    const noseShadow =
        document.getElementById(
            "noseShadow"
        );

    const noseBottomShadow =
        document.getElementById(
            "noseBottomShadow"
        );

    const noseFront =
        document.getElementById(
            "noseFront"
        );

    const leftNostril =
        document.getElementById(
            "leftNostril"
        );

    const rightNostril =
        document.getElementById(
            "rightNostril"
        );

    const leftHole =
        document.getElementById(
            "leftNostrilHole"
        );

    const rightHole =
        document.getElementById(
            "rightNostrilHole"
        );


    if (
        !noseGroup ||
        !noseShadow ||
        !noseBottomShadow ||
        !noseFront ||
        !leftNostril ||
        !rightNostril ||
        !leftHole ||
        !rightHole
    ) {

        console.warn(
            "One or more nose SVG elements could not be found."
        );

        return;

    }


    /* ==========================
       MOVE ENTIRE NOSE GROUP
    ========================== */

    noseGroup.setAttribute(
        "transform",
        `translate(
            ${settings.noseX}
            ${settings.noseY}
        )`
    );


    /* ==========================
       SHARED VALUES
    ========================== */

    const noseCenterX =
        250;

    const noseCenterY =
        374;

    const nostrilCenterY =
        settings.nostrilY;

    const noseWidth =
        Math.max(
            settings.noseWidth,
            4
        );

    const noseHeight =
        Math.max(
            settings.noseHeight,
            6
        );

    const nostrilWidth =
        Math.max(
            settings.nostrilWidth,
            3
        );

    const nostrilHeight =
        Math.max(
            settings.nostrilHeight,
            2
        );


    /* ==========================
       NOSE BRIDGE SHADOW
    ========================== */

    const bridgeCenterY =
        noseCenterY;

    noseShadow.setAttribute(
        "cx",
        noseCenterX
    );

    noseShadow.setAttribute(
        "cy",
        bridgeCenterY
    );

    noseShadow.setAttribute(
        "rx",
        Math.max(
            noseWidth * 0.72,
            4
        )
    );

    noseShadow.setAttribute(
        "ry",
        Math.max(
            noseHeight * 1.08,
            8
        )
    );


    /* ==========================
       CENTER TIP DIMENSIONS
    ========================== */

    /*
        These values are calculated before
        the wings so the wing positions can
        respect the width of the center tip.
    */

    const tipCenterY =
        noseCenterY +
        noseHeight * 0.48;

    const tipHalfWidth =
        Math.max(
            noseWidth * 0.76,
            6
        );

    const tipHeight =
        Math.max(
            noseHeight * 0.68,
            8
        );

    const tipTopY =
        tipCenterY -
        tipHeight * 0.48;

    const tipShoulderY =
        tipCenterY -
        tipHeight * 0.14;

    const tipLowerY =
        tipCenterY +
        tipHeight * 0.25;

    const tipBottomY =
        tipCenterY +
        tipHeight * 0.48;

    const topHalfWidth =
        tipHalfWidth * 0.38;

    const shoulderHalfWidth =
        tipHalfWidth * 0.88;

    const lowerHalfWidth =
        tipHalfWidth * 0.72;


    /* ==========================
       NOSTRIL WING VALUES
    ========================== */

    /*
        wingGap keeps the wings from moving
        underneath the center tip.

        nostrilSpacing can still move the
        wings outward, but cannot force them
        into the tip.
    */

    const wingGap =
        2.5;

    const minimumWingSpacing =
        tipHalfWidth +
        wingGap;

    const actualWingSpacing =
        Math.max(
            settings.nostrilSpacing,
            minimumWingSpacing
        );

    const leftInnerX =
        noseCenterX -
        actualWingSpacing;

    const rightInnerX =
        noseCenterX +
        actualWingSpacing;

    const leftOuterX =
        leftInnerX -
        nostrilWidth;

    const rightOuterX =
        rightInnerX +
        nostrilWidth;

    const nostrilTopY =
        nostrilCenterY -
        nostrilHeight * 0.72;

    const nostrilBottomY =
        nostrilCenterY +
        nostrilHeight * 0.72;


    /* ==========================
       LEFT NOSTRIL WING
    ========================== */

    leftNostril.setAttribute(
        "d",
        `
            M
            ${leftInnerX}
            ${nostrilTopY}

            L
            ${leftInnerX}
            ${nostrilBottomY}

            C
            ${leftInnerX - nostrilWidth * 0.20}
            ${nostrilBottomY + nostrilHeight * 0.08}

            ${leftOuterX + nostrilWidth * 0.28}
            ${nostrilBottomY}

            ${leftOuterX}
            ${nostrilCenterY + nostrilHeight * 0.30}

            C
            ${leftOuterX - nostrilWidth * 0.02}
            ${nostrilCenterY - nostrilHeight * 0.22}

            ${leftOuterX + nostrilWidth * 0.28}
            ${nostrilTopY}

            ${leftInnerX}
            ${nostrilTopY}

            Z
        `
    );


    /* ==========================
       RIGHT NOSTRIL WING
    ========================== */

    rightNostril.setAttribute(
        "d",
        `
            M
            ${rightInnerX}
            ${nostrilTopY}

            L
            ${rightInnerX}
            ${nostrilBottomY}

            C
            ${rightInnerX + nostrilWidth * 0.20}
            ${nostrilBottomY + nostrilHeight * 0.08}

            ${rightOuterX - nostrilWidth * 0.28}
            ${nostrilBottomY}

            ${rightOuterX}
            ${nostrilCenterY + nostrilHeight * 0.30}

            C
            ${rightOuterX + nostrilWidth * 0.02}
            ${nostrilCenterY - nostrilHeight * 0.22}

            ${rightOuterX - nostrilWidth * 0.28}
            ${nostrilTopY}

            ${rightInnerX}
            ${nostrilTopY}

            Z
        `
    );


    /* ==========================
       ROTATE NOSTRIL WINGS
    ========================== */

    const wingRotation =
        15;

    leftNostril.setAttribute(
        "transform",
        `rotate(
            ${wingRotation}
            ${leftInnerX}
            ${nostrilCenterY}
        )`
    );

    rightNostril.setAttribute(
        "transform",
        `rotate(
            ${-wingRotation}
            ${rightInnerX}
            ${nostrilCenterY}
        )`
    );


    /* ==========================
       BOTTOM-OF-NOSE SHADOW
    ========================== */

    noseBottomShadow.setAttribute(
        "cx",
        noseCenterX
    );

    noseBottomShadow.setAttribute(
        "cy",
        noseCenterY +
        noseHeight * 0.92
    );

    noseBottomShadow.setAttribute(
        "rx",
        Math.max(
            noseWidth * 1.15,
            6
        )
    );

    noseBottomShadow.setAttribute(
        "ry",
        Math.max(
            noseHeight * 0.12,
            2
        )
    );


    /* ==========================
       CENTER NOSE TIP PATH
    ========================== */

    noseFront.setAttribute(
        "d",
        `
            M
            ${noseCenterX - topHalfWidth}
            ${tipTopY}

            C
            ${noseCenterX - topHalfWidth * 0.55}
            ${tipTopY - tipHeight * 0.04}

            ${noseCenterX + topHalfWidth * 0.55}
            ${tipTopY - tipHeight * 0.04}

            ${noseCenterX + topHalfWidth}
            ${tipTopY}

            C
            ${noseCenterX + shoulderHalfWidth * 0.72}
            ${tipTopY + tipHeight * 0.10}

            ${noseCenterX + tipHalfWidth}
            ${tipShoulderY}

            ${noseCenterX + tipHalfWidth}
            ${tipCenterY}

            C
            ${noseCenterX + tipHalfWidth}
            ${tipLowerY}

            ${noseCenterX + lowerHalfWidth}
            ${tipBottomY}

            ${noseCenterX}
            ${tipBottomY}

            C
            ${noseCenterX - lowerHalfWidth}
            ${tipBottomY}

            ${noseCenterX - tipHalfWidth}
            ${tipLowerY}

            ${noseCenterX - tipHalfWidth}
            ${tipCenterY}

            C
            ${noseCenterX - tipHalfWidth}
            ${tipShoulderY}

            ${noseCenterX - shoulderHalfWidth * 0.72}
            ${tipTopY + tipHeight * 0.10}

            ${noseCenterX - topHalfWidth}
            ${tipTopY}

            Z
        `
    );


    /* ==========================
       NOSTRIL HOLES
    ========================== */

    const leftHoleX =
        noseCenterX -
        settings.nostrilHoleSpacing;

    const rightHoleX =
        noseCenterX +
        settings.nostrilHoleSpacing;

    leftHole.setAttribute(
        "cx",
        leftHoleX
    );

    rightHole.setAttribute(
        "cx",
        rightHoleX
    );

    leftHole.setAttribute(
        "cy",
        settings.nostrilHoleY
    );

    rightHole.setAttribute(
        "cy",
        settings.nostrilHoleY
    );

    leftHole.setAttribute(
        "rx",
        Math.max(
            settings.nostrilHoleWidth,
            1
        )
    );

    rightHole.setAttribute(
        "rx",
        Math.max(
            settings.nostrilHoleWidth,
            1
        )
    );

    leftHole.setAttribute(
        "ry",
        Math.max(
            settings.nostrilHoleHeight,
            1
        )
    );

    rightHole.setAttribute(
        "ry",
        Math.max(
            settings.nostrilHoleHeight,
            1
        )
    );


    /* ==========================
       ROTATE NOSTRIL HOLES
    ========================== */

    const holeRotation =
        wingRotation * 0.55;

    leftHole.setAttribute(
        "transform",
        `rotate(
            ${holeRotation}
            ${leftHoleX}
            ${settings.nostrilHoleY}
        )`
    );

    rightHole.setAttribute(
        "transform",
        `rotate(
            ${-holeRotation}
            ${rightHoleX}
            ${settings.nostrilHoleY}
        )`
    );

}


/* ==========================
   INITIALIZE NOSE CONTROLS
========================== */

function initializeNoseControls() {

    noseControls.forEach(
        function (settingName) {

            const slider =
                document.getElementById(
                    settingName
                );

            if (!slider) {

                console.warn(
                    `Could not find nose slider: ${settingName}`
                );

                return;

            }

            slider.value =
                window.noseSettings[
                    settingName
                ];

            displayNoseValue(
                settingName
            );


            slider.addEventListener(
                "input",
                function () {

                    window.noseSettings[
                        settingName
                    ] = Number(
                        slider.value
                    );

                    displayNoseValue(
                        settingName
                    );

                    applyNoseSettings();

                }
            );

        }
    );

}


/* ==========================
   UPDATE NOSE CONTROLS
========================== */

function updateNoseControls() {

    noseControls.forEach(
        function (settingName) {

            const slider =
                document.getElementById(
                    settingName
                );

            if (!slider) {
                return;
            }

            slider.value =
                window.noseSettings[
                    settingName
                ];

            displayNoseValue(
                settingName
            );

        }
    );

}


/* ==========================
   NOSE STATUS MESSAGE
========================== */

function displayNoseStatus(message) {

    const status =
        document.getElementById(
            "noseSaveStatus"
        );

    if (!status) {
        return;
    }

    status.textContent =
        message;

}


/* ==========================
   SAVE NOSE
========================== */

function saveNose() {

    try {

        localStorage.setItem(
            "humanoidNoseSettings",
            JSON.stringify(
                window.noseSettings
            )
        );

        displayNoseStatus(
            "Nose settings saved."
        );

    } catch (error) {

        displayNoseStatus(
            "Nose settings could not be saved."
        );

        console.error(
            "Nose settings could not be saved:",
            error
        );

    }

}


/* ==========================
   LOAD NOSE
========================== */

function loadNose() {

    const savedSettings =
        localStorage.getItem(
            "humanoidNoseSettings"
        );

    if (!savedSettings) {
        return false;
    }

    try {

        const parsedSettings =
            JSON.parse(
                savedSettings
            );

        Object.assign(
            window.noseSettings,
            parsedSettings
        );

        updateNoseControls();

        applyNoseSettings();

        displayNoseStatus(
            "Saved nose settings loaded."
        );

        return true;

    } catch (error) {

        console.error(
            "Saved nose settings could not be loaded:",
            error
        );

        return false;

    }

}


/* ==========================
   RESET NOSE
========================== */

function resetNose() {

    Object.assign(
        window.noseSettings,
        defaultNoseSettings
    );

    updateNoseControls();

    applyNoseSettings();

    displayNoseStatus(
        "Nose settings reset."
    );

}


/* ==========================
   INITIALIZE NOSE BUTTONS
========================== */

function initializeNoseButtons() {

    const saveButton =
        document.getElementById(
            "saveNose"
        );

    const loadButton =
        document.getElementById(
            "loadNose"
        );

    const resetButton =
        document.getElementById(
            "resetNose"
        );


    if (saveButton) {

        saveButton.addEventListener(
            "click",
            saveNose
        );

    }


    if (loadButton) {

        loadButton.addEventListener(
            "click",
            function () {

                const loaded =
                    loadNose();

                if (!loaded) {

                    displayNoseStatus(
                        "No saved nose was found."
                    );

                }

            }
        );

    }


    if (resetButton) {

        resetButton.addEventListener(
            "click",
            resetNose
        );

    }

}


/* ==========================
   INITIALIZE NOSE
========================== */

function initializeNose() {

    initializeNoseControls();

    initializeNoseButtons();

    const savedNoseLoaded =
        loadNose();

    if (!savedNoseLoaded) {

        updateNoseControls();

        applyNoseSettings();

    }

}


/* ==========================
   EXPOSE NOSE FUNCTIONS
========================== */

window.initializeNose =
    initializeNose;

window.applyNoseSettings =
    applyNoseSettings;

window.updateNoseControls =
    updateNoseControls;

window.saveNose =
    saveNose;

window.loadNose =
    loadNose;

window.resetNose =
    resetNose;
