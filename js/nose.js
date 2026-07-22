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

    nostrilHoleSpacing: 18,
    nostrilHoleY: 399,
    nostrilHoleWidth: 7,
    nostrilHoleHeight: 2.8

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

    noseShadow.setAttribute(
        "cx",
        noseCenterX
    );

    noseShadow.setAttribute(
        "cy",
        noseCenterY
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

    const tipCenterY =
        noseCenterY +
        noseHeight * 0.48;

    const tipHalfWidth =
        Math.max(
            noseWidth * 0.82,
            6
        );

    const tipHeight =
        Math.max(
            noseHeight * 0.60,
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
        tipHeight * 0.36;

    const topHalfWidth =
        tipHalfWidth * 0.38;

    const shoulderHalfWidth =
        tipHalfWidth * 0.88;

    const lowerHalfWidth =
        tipHalfWidth * 0.82;


    /* ==========================
       NOSTRIL WING VALUES
    ========================== */

    /*
        Negative gap lets the wings tuck
        slightly beneath the center tip.
    */

    const wingGap =
        -1.5;

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
        nostrilHeight * 0.58;

    const nostrilBottomY =
        nostrilCenterY +
        nostrilHeight * 0.58;


    /* ==========================
       LEFT NOSTRIL WING
    ========================== */

    leftNostril.setAttribute(
        "d",
        `
            M
            ${leftInnerX}
            ${nostrilTopY}

            C
            ${leftInnerX + nostrilWidth * 0.16}
            ${nostrilTopY + nostrilHeight * 0.18}

            ${leftInnerX + nostrilWidth * 0.10}
            ${nostrilBottomY - nostrilHeight * 0.18}

            ${leftInnerX}
            ${nostrilBottomY}

            C
            ${leftInnerX - nostrilWidth * 0.20}
            ${nostrilBottomY + nostrilHeight * 0.06}

            ${leftOuterX + nostrilWidth * 0.30}
            ${nostrilBottomY}

            ${leftOuterX}
            ${nostrilCenterY + nostrilHeight * 0.20}

            C
            ${leftOuterX - nostrilWidth * 0.02}
            ${nostrilCenterY - nostrilHeight * 0.12}

            ${leftOuterX + nostrilWidth * 0.30}
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

            C
            ${rightInnerX - nostrilWidth * 0.16}
            ${nostrilTopY + nostrilHeight * 0.18}

            ${rightInnerX - nostrilWidth * 0.10}
            ${nostrilBottomY - nostrilHeight * 0.18}

            ${rightInnerX}
            ${nostrilBottomY}

            C
            ${rightInnerX + nostrilWidth * 0.20}
            ${nostrilBottomY + nostrilHeight * 0.06}

            ${rightOuterX - nostrilWidth * 0.30}
            ${nostrilBottomY}

            ${rightOuterX}
            ${nostrilCenterY + nostrilHeight * 0.20}

            C
            ${rightOuterX + nostrilWidth * 0.02}
            ${nostrilCenterY - nostrilHeight * 0.12}

            ${rightOuterX - nostrilWidth * 0.30}
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
        noseHeight * 0.88
    );

    noseBottomShadow.setAttribute(
        "rx",
        Math.max(
            noseWidth * 0.72,
            6
        )
    );

    noseBottomShadow.setAttribute(
        "ry",
        Math.max(
            noseHeight * 0.08,
            1.5
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

    const nostrilHoleSpacing =
        Math.max(
            settings.nostrilHoleSpacing,
            2
        );

    const nostrilHoleWidth =
        Math.max(
            settings.nostrilHoleWidth,
            1
        );

    const nostrilHoleHeight =
        Math.max(
            settings.nostrilHoleHeight,
            1
        );

    const leftHoleX =
        noseCenterX -
        nostrilHoleSpacing;

    const rightHoleX =
        noseCenterX +
        nostrilHoleSpacing;

    const holeY =
        settings.nostrilHoleY;


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
        holeY
    );

    rightHole.setAttribute(
        "cy",
        holeY
    );

    leftHole.setAttribute(
        "rx",
        nostrilHoleWidth
    );

    rightHole.setAttribute(
        "rx",
        nostrilHoleWidth
    );

    leftHole.setAttribute(
        "ry",
        nostrilHoleHeight
    );

    rightHole.setAttribute(
        "ry",
        nostrilHoleHeight
    );


    /* ==========================
       ROTATE NOSTRIL HOLES
    ========================== */

    const holeRotation =
        wingRotation * 0.80;

    leftHole.setAttribute(
        "transform",
        `rotate(
            ${holeRotation}
            ${leftHoleX}
            ${holeY}
        )`
    );

    rightHole.setAttribute(
        "transform",
        `rotate(
            ${-holeRotation}
            ${rightHoleX}
            ${holeY}
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
