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

    /*
        The bridge sits above the tip.

        It is narrower than the tip but tall
        enough to create a visible nose form.
    */

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
       NOSTRIL WING VALUES
    ========================== */

    const leftInnerX =
        noseCenterX -
        settings.nostrilSpacing;

    const rightInnerX =
        noseCenterX +
        settings.nostrilSpacing;

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

    /*
        The inside edge remains nearly flat.

        The outer portion curves around and
        slightly beneath the nose tip.
    */

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

    /*
        A small rotation helps the wings tuck
        beneath the tip without forming hooks.
    */

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
   ROUNDED NOSE TIP
========================== */

/*
    The noseFront is only the center bulb.

    It should not flare sideways into the
    nostril-wing area.
*/

const tipCenterY =
    noseCenterY +
    noseHeight * 0.42;

const tipHalfWidth =
    Math.max(
        noseWidth * 0.72,
        5
    );

const tipHeight =
    Math.max(
        noseHeight * 0.92,
        8
    );

const tipTopY =
    tipCenterY -
    tipHeight * 0.56;

const tipBottomY =
    tipCenterY +
    tipHeight * 0.48;

const upperHalfWidth =
    tipHalfWidth * 0.48;

const middleHalfWidth =
    tipHalfWidth * 0.78;


/* ==========================
   CENTER NOSE BULB PATH
========================== */

noseFront.setAttribute(
    "d",
    `
        M
        ${noseCenterX - upperHalfWidth}
        ${tipTopY}

        C
        ${noseCenterX - middleHalfWidth}
        ${tipTopY + tipHeight * 0.18}

        ${noseCenterX - tipHalfWidth}
        ${tipCenterY + tipHeight * 0.02}

        ${noseCenterX - tipHalfWidth}
        ${tipCenterY + tipHeight * 0.22}

        C
        ${noseCenterX - tipHalfWidth}
        ${tipCenterY + tipHeight * 0.38}

        ${noseCenterX - tipHalfWidth * 0.52}
        ${tipBottomY}

        ${noseCenterX}
        ${tipBottomY}

        C
        ${noseCenterX + tipHalfWidth * 0.52}
        ${tipBottomY}

        ${noseCenterX + tipHalfWidth}
        ${tipCenterY + tipHeight * 0.38}

        ${noseCenterX + tipHalfWidth}
        ${tipCenterY + tipHeight * 0.22}

        C
        ${noseCenterX + tipHalfWidth}
        ${tipCenterY + tipHeight * 0.02}

        ${noseCenterX + middleHalfWidth}
        ${tipTopY + tipHeight * 0.18}

        ${noseCenterX + upperHalfWidth}
        ${tipTopY}

        C
        ${noseCenterX + upperHalfWidth * 0.45}
        ${tipTopY - tipHeight * 0.04}

        ${noseCenterX - upperHalfWidth * 0.45}
        ${tipTopY - tipHeight * 0.04}

        ${noseCenterX - upperHalfWidth}
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
        settings.nostrilHoleWidth
    );

    rightHole.setAttribute(
        "rx",
        settings.nostrilHoleWidth
    );

    leftHole.setAttribute(
        "ry",
        settings.nostrilHoleHeight
    );

    rightHole.setAttribute(
        "ry",
        settings.nostrilHoleHeight
    );


    /* ==========================
       ROTATE NOSTRIL HOLES
    ========================== */

    /*
        The hole rotation is even subtler
        than the rotation of the wings.
    */

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
