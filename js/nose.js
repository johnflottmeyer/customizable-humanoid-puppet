/* =========================================================
   FACELAB NOSE
   Version 1.2.1

   1.2.1
   - Keeps the new 1.2 anatomical construction.
   - Removes the flat bottle-neck transition at the top of the tip.
   - Broadens and rounds the tip.
   - Restores fuller alar wings around the nostrils without long tails.
   - Strengthens the small columella/underside cue.
   - Keeps nostril openings tucked beneath the wings.
========================================================= */

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

    nostrilSpacing: 20,
    nostrilY: 395,
    nostrilWidth: 23,
    nostrilHeight: 14,

    /* Nostril holes */

    nostrilHoleSpacing: 17.5,
    nostrilHoleY: 398,
    nostrilHoleWidth: 6,
    nostrilHoleHeight: 2.4

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

    const bridgeCenterY =
        369;

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

    const nostrilCenterY =
        settings.nostrilY;

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
       BRIDGE / SIDE PLANES

       The sketch reads as two descending side curves,
       not a central vertical blob.

       We keep noseShadow as a soft ellipse, but flatten it
       and reduce opacity so it behaves as a blended light/shadow
       field rather than a visible construction piece.
    ========================== */

    noseShadow.setAttribute(
        "cx",
        noseCenterX
    );

    noseShadow.setAttribute(
        "cy",
        bridgeCenterY - noseHeight * 0.12
    );

    noseShadow.setAttribute(
        "rx",
        Math.max(
            noseWidth * 0.62,
            5
        )
    );

    noseShadow.setAttribute(
        "ry",
        Math.max(
            noseHeight * 1.24,
            10
        )
    );

    noseShadow.style.opacity =
        "0.24";

    noseShadow.style.pointerEvents =
        "none";


    /* ==========================
       TIP / LOWER BRIDGE GEOMETRY

       1.2.1:
       The bridge flows directly into a broad rounded tip.
       There is no flat top edge and no narrow bottle-neck.
    ========================== */

    const tipCenterY =
        bridgeCenterY +
        noseHeight * 0.62;

    const bridgeJoinY =
        bridgeCenterY -
        noseHeight * 0.18;

    const shoulderY =
        tipCenterY -
        noseHeight * 0.18;

    const undersideY =
        tipCenterY +
        noseHeight * 0.22;

    const columellaY =
        tipCenterY +
        noseHeight * 0.38;

    const bridgeHalfWidth =
        Math.max(
            noseWidth * 0.42,
            6
        );

    const shoulderHalfWidth =
        Math.max(
            noseWidth * 0.98,
            10
        );

    const undersideHalfWidth =
        Math.max(
            noseWidth * 0.66,
            8
        );


    noseFront.setAttribute(
        "d",
        `
            M
            ${noseCenterX - bridgeHalfWidth}
            ${bridgeJoinY}

            C
            ${noseCenterX - bridgeHalfWidth * 1.10}
            ${bridgeJoinY + noseHeight * 0.18}

            ${noseCenterX - shoulderHalfWidth * 0.76}
            ${shoulderY - noseHeight * 0.10}

            ${noseCenterX - shoulderHalfWidth}
            ${tipCenterY}

            C
            ${noseCenterX - shoulderHalfWidth * 0.98}
            ${undersideY}

            ${noseCenterX - undersideHalfWidth * 0.66}
            ${columellaY}

            ${noseCenterX}
            ${columellaY}

            C
            ${noseCenterX + undersideHalfWidth * 0.66}
            ${columellaY}

            ${noseCenterX + shoulderHalfWidth * 0.98}
            ${undersideY}

            ${noseCenterX + shoulderHalfWidth}
            ${tipCenterY}

            C
            ${noseCenterX + shoulderHalfWidth * 0.76}
            ${shoulderY - noseHeight * 0.10}

            ${noseCenterX + bridgeHalfWidth * 1.10}
            ${bridgeJoinY + noseHeight * 0.18}

            ${noseCenterX + bridgeHalfWidth}
            ${bridgeJoinY}

            C
            ${noseCenterX + bridgeHalfWidth * 0.42}
            ${bridgeJoinY - noseHeight * 0.04}

            ${noseCenterX - bridgeHalfWidth * 0.42}
            ${bridgeJoinY - noseHeight * 0.04}

            ${noseCenterX - bridgeHalfWidth}
            ${bridgeJoinY}

            Z
        `
    );

    noseFront.style.opacity =
        "0.54";

    noseFront.style.stroke =
        "none";

    noseFront.style.pointerEvents =
        "none";


    /* ==========================
       ALAR WINGS

       Fuller around the nostrils, but they fold inward
       beneath the tip instead of trailing sideways.
    ========================== */

    const wingInset =
        Math.max(
            settings.nostrilSpacing,
            shoulderHalfWidth * 0.70
        );

    const leftInnerX =
        noseCenterX -
        wingInset;

    const rightInnerX =
        noseCenterX +
        wingInset;

    const leftOuterX =
        leftInnerX -
        nostrilWidth * 0.82;

    const rightOuterX =
        rightInnerX +
        nostrilWidth * 0.82;

    const wingTopY =
        nostrilCenterY -
        nostrilHeight * 0.62;

    const wingBottomY =
        nostrilCenterY +
        nostrilHeight * 0.48;


    leftNostril.setAttribute(
        "d",
        `
            M
            ${leftInnerX + nostrilWidth * 0.18}
            ${wingTopY}

            C
            ${leftInnerX - nostrilWidth * 0.10}
            ${wingTopY - nostrilHeight * 0.04}

            ${leftOuterX + nostrilWidth * 0.26}
            ${wingTopY + nostrilHeight * 0.16}

            ${leftOuterX}
            ${nostrilCenterY + nostrilHeight * 0.02}

            C
            ${leftOuterX + nostrilWidth * 0.18}
            ${nostrilCenterY + nostrilHeight * 0.34}

            ${leftOuterX + nostrilWidth * 0.52}
            ${wingBottomY}

            ${leftInnerX + nostrilWidth * 0.02}
            ${wingBottomY}

            C
            ${leftInnerX + nostrilWidth * 0.20}
            ${wingBottomY - nostrilHeight * 0.22}

            ${leftInnerX + nostrilWidth * 0.24}
            ${wingTopY + nostrilHeight * 0.20}

            ${leftInnerX + nostrilWidth * 0.18}
            ${wingTopY}

            Z
        `
    );


    rightNostril.setAttribute(
        "d",
        `
            M
            ${rightInnerX - nostrilWidth * 0.18}
            ${wingTopY}

            C
            ${rightInnerX + nostrilWidth * 0.10}
            ${wingTopY - nostrilHeight * 0.04}

            ${rightOuterX - nostrilWidth * 0.26}
            ${wingTopY + nostrilHeight * 0.16}

            ${rightOuterX}
            ${nostrilCenterY + nostrilHeight * 0.02}

            C
            ${rightOuterX - nostrilWidth * 0.18}
            ${nostrilCenterY + nostrilHeight * 0.34}

            ${rightOuterX - nostrilWidth * 0.52}
            ${wingBottomY}

            ${rightInnerX - nostrilWidth * 0.02}
            ${wingBottomY}

            C
            ${rightInnerX - nostrilWidth * 0.20}
            ${wingBottomY - nostrilHeight * 0.22}

            ${rightInnerX - nostrilWidth * 0.24}
            ${wingTopY + nostrilHeight * 0.20}

            ${rightInnerX - nostrilWidth * 0.18}
            ${wingTopY}

            Z
        `
    );


    leftNostril.style.opacity =
        "0.66";

    rightNostril.style.opacity =
        "0.66";

    leftNostril.style.stroke =
        "none";

    rightNostril.style.stroke =
        "none";


    /* ==========================
       SUBTLE WING ROTATION
    ========================== */

    const wingRotation =
        6;

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
       COLUMELLA / UNDERSIDE SHADOW

       Narrow central underside cue, not a broad oval.
    ========================== */

    noseBottomShadow.setAttribute(
        "cx",
        noseCenterX
    );

    noseBottomShadow.setAttribute(
        "cy",
        columellaY - noseHeight * 0.02
    );

    noseBottomShadow.setAttribute(
        "rx",
        Math.max(
            noseWidth * 0.34,
            4
        )
    );

    noseBottomShadow.setAttribute(
        "ry",
        Math.max(
            noseHeight * 0.050,
            1.2
        )
    );

    noseBottomShadow.style.opacity =
        "0.26";

    noseBottomShadow.style.pointerEvents =
        "none";


    /* ==========================
       NOSTRIL HOLES

       Compact openings tucked beneath the alar wings.
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


    const holeRotation =
        wingRotation * 0.50;

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

    leftHole.style.opacity =
        "0.88";

    rightHole.style.opacity =
        "0.88";

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
