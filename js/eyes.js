/* ==========================
   DEFAULT EYE VALUES
========================== */

const defaultEyeSettings = {

    /* POSITION */

    eyeY: 235,
    eyeSpacing: 134,

    /* SHAPE */

    eyeWidth: 78,
    eyeHeight: 42,
    eyeRotation: 0,

    eyeUpperArch: 1.2,
    eyeLowerArch: 0.75,

    eyeInnerCorner: -2,
    eyeOuterCorner: 2,

    /* IRIS */

    irisSize: 27,

    /* PUPIL */

    pupilSize: 10,
    pupilX: 0,
    pupilY: 0

};


/* ==========================
   CURRENT EYE SETTINGS
========================== */

window.eyeSettings = {
    ...defaultEyeSettings
};


/* ==========================
   EYE ANIMATION STATE
========================== */

window.eyeAnimationState = {

    lookX: 0,
    lookY: 0,

    blink: 0

};


/* ==========================
   EYE CONTROL NAMES
========================== */

const eyeControls = [

    "eyeY",
    "eyeSpacing",

    "eyeWidth",
    "eyeHeight",
    "eyeRotation",

    "eyeUpperArch",
    "eyeLowerArch",

    "eyeInnerCorner",
    "eyeOuterCorner",

    "irisSize",

    "pupilSize",
    "pupilX",
    "pupilY"

];


/* ==========================
   DISPLAY CONTROL VALUE
========================== */

function displayEyeValue(settingName) {

    const valueDisplay =
        document.getElementById(
            `${settingName}Value`
        );

    if (!valueDisplay) {
        return;
    }

    valueDisplay.textContent =
        window.eyeSettings[settingName];

}


/* ==========================
   LIMIT NUMBER
========================== */

function clamp(
    value,
    minimum,
    maximum
) {

    return Math.max(
        minimum,
        Math.min(
            maximum,
            value
        )
    );

}


/* ==========================
   GET EYE CORNERS
========================== */

function getEyeCornerPositions(
    side,
    centerY
) {

    const settings =
        window.eyeSettings;

    /*
       eyeInnerCorner and eyeOuterCorner
       represent vertical offsets.

       Negative values move a corner upward.
       Positive values move a corner downward.
    */

    if (side === "left") {

        return {

            leftCornerY:
                centerY +
                settings.eyeInnerCorner,

            rightCornerY:
                centerY +
                settings.eyeOuterCorner

        };

    }

    return {

        leftCornerY:
            centerY +
            settings.eyeOuterCorner,

        rightCornerY:
            centerY +
            settings.eyeInnerCorner

    };

}


/* ==========================
   CREATE EYE PATH
========================== */

function createEyePath(
    side,
    centerX,
    centerY,
    width,
    height
) {

    const settings =
        window.eyeSettings;

    const halfWidth =
        width / 2;

    const halfHeight =
        height / 2;

    const left =
        centerX - halfWidth;

    const right =
        centerX + halfWidth;

    const corners =
        getEyeCornerPositions(
            side,
            centerY
        );

    const leftCornerY =
        corners.leftCornerY;

    const rightCornerY =
        corners.rightCornerY;

    /*
       The top and bottom curves use separate
       control points so they are no longer
       vertically symmetrical.
    */

    const upperControlY =
        centerY -
        halfHeight *
        settings.eyeUpperArch;

    const lowerControlY =
        centerY +
        halfHeight *
        settings.eyeLowerArch;

    /*
       Cubic curves allow the inner and outer
       halves to have slightly different shapes.
    */

    const upperLeftControlX =
        centerX -
        width * 0.20;

    const upperRightControlX =
        centerX +
        width * 0.28;

    const lowerRightControlX =
        centerX +
        width * 0.24;

    const lowerLeftControlX =
        centerX -
        width * 0.30;

    return [

        `M ${left} ${leftCornerY}`,

        `C ${upperLeftControlX} ${upperControlY}`,
        `${upperRightControlX} ${upperControlY}`,
        `${right} ${rightCornerY}`,

        `C ${lowerRightControlX} ${lowerControlY}`,
        `${lowerLeftControlX} ${lowerControlY}`,
        `${left} ${leftCornerY}`,

        "Z"

    ].join(" ");

}


/* ==========================
   CREATE UPPER LID PATH
========================== */

function createUpperLidPath(
    side,
    centerX,
    centerY,
    width,
    height
) {

    const settings =
        window.eyeSettings;

    const left =
        centerX - width / 2;

    const right =
        centerX + width / 2;

    const corners =
        getEyeCornerPositions(
            side,
            centerY
        );

    const leftCornerY =
        corners.leftCornerY;

    const rightCornerY =
        corners.rightCornerY;

    const controlY =
        centerY -
        height / 2 *
        settings.eyeUpperArch -
        2;

    const leftControlX =
        centerX -
        width * 0.20;

    const rightControlX =
        centerX +
        width * 0.28;

    return [

        `M ${left} ${leftCornerY}`,

        `C ${leftControlX} ${controlY}`,
        `${rightControlX} ${controlY}`,
        `${right} ${rightCornerY}`

    ].join(" ");

}


/* ==========================
   CREATE EYE SOCKET PATH
========================== */

function createEyeSocketPath(
    side,
    centerX,
    centerY,
    width,
    height
) {

    const left =
        centerX -
        width / 2;

    const right =
        centerX +
        width / 2;

    const top =
        centerY -
        height / 2;

    const bottom =
        centerY +
        height / 2;

    /*
       Controls how quickly each rounded end
       transitions into the top and bottom.
    */

    const horizontalRound =
        width * 0.20;

    const verticalRound =
        height * 0.34;

    return [

        /*
           Begin at the full left edge.
           This prevents the side from pinching inward.
        */

        `M ${left} ${centerY}`,

        /* Left upper rounded end */

        `C ${left} ${centerY - verticalRound}`,
        `${left + horizontalRound} ${top}`,
        `${centerX} ${top}`,

        /* Right upper rounded end */

        `C ${right - horizontalRound} ${top}`,
        `${right} ${centerY - verticalRound}`,
        `${right} ${centerY}`,

        /* Right lower rounded end */

        `C ${right} ${centerY + verticalRound}`,
        `${right - horizontalRound} ${bottom}`,
        `${centerX} ${bottom}`,

        /* Left lower rounded end */

        `C ${left + horizontalRound} ${bottom}`,
        `${left} ${centerY + verticalRound}`,
        `${left} ${centerY}`,

        "Z"

    ].join(" ");

}

/* ==========================
   DRAW ONE EYE
========================== */

function drawEye(
    side,
    centerX,
    centerY,
    rotation
) {

    const settings =
        window.eyeSettings;

    const animation =
        window.eyeAnimationState || {

            lookX: 0,
            lookY: 0,

            blink: 0

        };


    /* ==========================
       FIND SVG ELEMENTS
    ========================== */

    const eyeSocket =
        document.getElementById(
            `${side}EyeSocket`
        );

    const eyeWhite =
        document.getElementById(
            `${side}EyeWhite`
        );

    const eyeClipPath =
        document.getElementById(
            `${side}EyeClipPath`
        );

    const iris =
        document.getElementById(
            `${side}Iris`
        );

    const irisInner =
        document.getElementById(
            `${side}IrisInner`
        );

    const pupil =
        document.getElementById(
            `${side}Pupil`
        );

    const highlight =
        document.getElementById(
            `${side}EyeHighlight`
        );

    const upperLid =
        document.getElementById(
            `${side}UpperLid`
        );


    if (
        !eyeWhite ||
        !eyeClipPath ||
        !iris ||
        !irisInner ||
        !pupil ||
        !highlight ||
        !upperLid
    ) {

        console.warn(
            `Could not find all SVG elements for the ${side} eye.`
        );

        return;

    }


    /* ==========================
       ANIMATED EYE HEIGHT
    ========================== */

    const minimumEyeHeight = 2;

    const animatedEyeHeight =
        Math.max(
            minimumEyeHeight,
            settings.eyeHeight *
            (1 - animation.blink)
        );


    /*
       Corner shaping gradually flattens during
       a blink so the eye closes cleanly.
    */

    const originalInnerCorner =
        settings.eyeInnerCorner;

    const originalOuterCorner =
        settings.eyeOuterCorner;

    const blinkCornerAmount =
        1 - animation.blink;

    settings.eyeInnerCorner =
        originalInnerCorner *
        blinkCornerAmount;

    settings.eyeOuterCorner =
        originalOuterCorner *
        blinkCornerAmount;


    /* ==========================
       EYE SHAPE
    ========================== */

    const eyePath =
        createEyePath(
            side,
            centerX,
            centerY,
            settings.eyeWidth,
            animatedEyeHeight
        );


    /*
       Restore the user settings immediately
       after creating the animated path.
    */

    settings.eyeInnerCorner =
        originalInnerCorner;

    settings.eyeOuterCorner =
        originalOuterCorner;


    /* ==========================
       EYE SOCKET
    ========================== */

    const socketPaddingY = 18;
    const socketOffsetY = 2;

    const socketWidth =
        settings.eyeWidth * 1.38;

    const socketHeight =
        settings.eyeHeight +
        socketPaddingY;

    const socketPath =
        createEyeSocketPath(
            side,
            centerX,
            centerY + socketOffsetY,
            socketWidth,
            socketHeight
        );


    /* ==========================
       EYE ROTATION
    ========================== */

    const eyeTransform =
        `rotate(
            ${rotation}
            ${centerX}
            ${centerY}
        )`;


    /* ==========================
       DRAW SOCKET
    ========================== */

    if (eyeSocket) {

        eyeSocket.setAttribute(
            "d",
            socketPath
        );

        eyeSocket.setAttribute(
            "transform",
            `rotate(
                ${rotation * 1.5}
                ${centerX}
                ${centerY}
            )`
        );

    }


    /* ==========================
       DRAW EYE WHITE
    ========================== */

    eyeWhite.setAttribute(
        "d",
        eyePath
    );

    eyeWhite.setAttribute(
        "transform",
        eyeTransform
    );


    /* ==========================
       UPDATE CLIP PATH
    ========================== */

    eyeClipPath.setAttribute(
        "d",
        eyePath
    );

    eyeClipPath.setAttribute(
        "transform",
        eyeTransform
    );


    /* ==========================
       SAFE IRIS MOVEMENT
    ========================== */

    const eyeHalfWidth =
        settings.eyeWidth / 2;

    const eyeHalfHeight =
        animatedEyeHeight / 2;

    const irisRadius =
        settings.irisSize / 2;

    const pupilRadius =
        settings.pupilSize / 2;

    const maximumIrisX =
        Math.max(
            0,
            eyeHalfWidth -
            irisRadius -
            6
        );

    const maximumIrisY =
        Math.max(
            0,
            eyeHalfHeight -
            irisRadius -
            4
        );

    const irisOffsetX =
        clamp(
            settings.pupilX +
            animation.lookX,
            -maximumIrisX,
            maximumIrisX
        );

    const irisOffsetY =
        clamp(
            settings.pupilY +
            animation.lookY,
            -maximumIrisY,
            maximumIrisY
        );

    const irisX =
        centerX +
        irisOffsetX;

    const irisY =
        centerY +
        irisOffsetY;


    /* ==========================
       IRIS
    ========================== */

    iris.setAttribute(
        "cx",
        irisX
    );

    iris.setAttribute(
        "cy",
        irisY
    );

    iris.setAttribute(
        "r",
        irisRadius
    );


    /* ==========================
       INNER IRIS RING
    ========================== */

    irisInner.setAttribute(
        "cx",
        irisX
    );

    irisInner.setAttribute(
        "cy",
        irisY
    );

    irisInner.setAttribute(
        "r",
        irisRadius * 0.68
    );


    /* ==========================
       PUPIL
    ========================== */

    pupil.setAttribute(
        "cx",
        irisX
    );

    pupil.setAttribute(
        "cy",
        irisY
    );

    pupil.setAttribute(
        "r",
        pupilRadius
    );


    /* ==========================
       EYE HIGHLIGHT
    ========================== */

    const highlightRadius =
        Math.max(
            2,
            settings.irisSize * 0.11
        );

    const highlightOffset =
        settings.irisSize * 0.18;

    highlight.setAttribute(
        "cx",
        irisX - highlightOffset
    );

    highlight.setAttribute(
        "cy",
        irisY - highlightOffset
    );

    highlight.setAttribute(
        "r",
        highlightRadius
    );


    /* ==========================
       UPPER EYELID
    ========================== */

    upperLid.setAttribute(
        "d",
        createUpperLidPath(
            side,
            centerX,
            centerY,
            settings.eyeWidth,
            settings.eyeHeight
        )
    );

    upperLid.setAttribute(
        "transform",
        eyeTransform
    );

}


/* ==========================
   DRAW BOTH EYES
========================== */

function drawEyes() {

    const settings =
        window.eyeSettings;

    const faceCenterX = 250;

    const leftEyeX =
        faceCenterX -
        settings.eyeSpacing / 2;

    const rightEyeX =
        faceCenterX +
        settings.eyeSpacing / 2;

    drawEye(
        "left",
        leftEyeX,
        settings.eyeY,
        settings.eyeRotation
    );

    drawEye(
        "right",
        rightEyeX,
        settings.eyeY,
        -settings.eyeRotation
    );

}


/* ==========================
   INITIALIZE EYE CONTROLS
========================== */

function initializeEyeControls() {

    eyeControls.forEach(
        function (settingName) {

            const slider =
                document.getElementById(
                    settingName
                );

            if (!slider) {

                console.warn(
                    `Could not find eye slider: ${settingName}`
                );

                return;

            }

            slider.value =
                window.eyeSettings[
                    settingName
                ];

            displayEyeValue(
                settingName
            );

            slider.addEventListener(
                "input",
                function () {

                    window.eyeSettings[
                        settingName
                    ] = Number(
                        slider.value
                    );

                    displayEyeValue(
                        settingName
                    );

                    drawEyes();

                }
            );

        }
    );

}


/* ==========================
   UPDATE EYE CONTROLS
========================== */

function updateEyeControls() {

    eyeControls.forEach(
        function (settingName) {

            const slider =
                document.getElementById(
                    settingName
                );

            if (!slider) {
                return;
            }

            slider.value =
                window.eyeSettings[
                    settingName
                ];

            displayEyeValue(
                settingName
            );

        }
    );

}


/* ==========================
   STATUS MESSAGE
========================== */

function displayEyeStatus(message) {

    const status =
        document.getElementById(
            "eyeSaveStatus"
        );

    if (!status) {
        return;
    }

    status.textContent =
        message;

}


/* ==========================
   SAVE EYES
========================== */

function saveEyes() {

    try {

        localStorage.setItem(
            "humanoidEyeSettings",
            JSON.stringify(
                window.eyeSettings
            )
        );

        displayEyeStatus(
            "Eye settings saved."
        );

    } catch (error) {

        displayEyeStatus(
            "Eye settings could not be saved."
        );

        console.error(
            "Eye settings could not be saved:",
            error
        );

    }

}


/* ==========================
   LOAD EYES
========================== */

function loadEyes() {

    const savedSettings =
        localStorage.getItem(
            "humanoidEyeSettings"
        );

    if (!savedSettings) {
        return false;
    }

    try {

        const parsedSettings =
            JSON.parse(
                savedSettings
            );

        /*
           Begin with the newest defaults so
           older saved eye settings receive
           the new shape properties.
        */

        Object.assign(
            window.eyeSettings,
            defaultEyeSettings,
            parsedSettings
        );

        updateEyeControls();

        drawEyes();

        displayEyeStatus(
            "Saved eye settings loaded."
        );

        return true;

    } catch (error) {

        displayEyeStatus(
            "Saved eye settings could not be loaded."
        );

        console.error(
            "Saved eye settings could not be loaded:",
            error
        );

        return false;

    }

}


/* ==========================
   RESET EYES
========================== */

function resetEyes() {

    Object.assign(
        window.eyeSettings,
        defaultEyeSettings
    );

    updateEyeControls();

    drawEyes();

    displayEyeStatus(
        "Eye settings reset."
    );

}


/* ==========================
   MAKE FUNCTIONS AVAILABLE
========================== */

window.drawEye =
    drawEye;

window.drawEyes =
    drawEyes;

window.initializeEyeControls =
    initializeEyeControls;

window.updateEyeControls =
    updateEyeControls;

window.saveEyes =
    saveEyes;

window.loadEyes =
    loadEyes;

window.resetEyes =
    resetEyes;
