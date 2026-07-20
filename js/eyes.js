/* ==========================
   DEFAULT EYE VALUES
========================== */

const defaultEyeSettings = {

    /* POSITION */

    eyeY: 235,
    eyeSpacing: 118,

    /* SHAPE */

    eyeWidth: 82,
    eyeHeight: 42,
    eyeRotation: 2,

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
   CREATE EYE PATH
========================== */

function createEyePath(
    centerX,
    centerY,
    width,
    height
) {

    const halfWidth =
        width / 2;

    const halfHeight =
        height / 2;

    const left =
        centerX - halfWidth;

    const right =
        centerX + halfWidth;

    const upperControlY =
        centerY - halfHeight;

    const lowerControlY =
        centerY + halfHeight;


    return [
        `M ${left} ${centerY}`,

        `Q ${centerX} ${upperControlY}`,
        `${right} ${centerY}`,

        `Q ${centerX} ${lowerControlY}`,
        `${left} ${centerY}`,

        "Z"
    ].join(" ");

}


/* ==========================
   CREATE UPPER LID PATH
========================== */

function createUpperLidPath(
    centerX,
    centerY,
    width,
    height
) {

    const left =
        centerX - width / 2;

    const right =
        centerX + width / 2;

    const controlY =
        centerY - height / 2 - 2;


    return [
        `M ${left} ${centerY}`,

        `Q ${centerX} ${controlY}`,

        `${right} ${centerY}`
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
    =========================== */

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
       EYE SHAPE
    =========================== */

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


     const eyePath =
         createEyePath(
             centerX,
             centerY,
             settings.eyeWidth,
             animatedEyeHeight
         );


    eyeWhite.setAttribute(
        "d",
        eyePath
    );

    eyeClipPath.setAttribute(
        "d",
        eyePath
    );


    /* ==========================
       EYE ROTATION
    =========================== */

    const eyeTransform =
        `rotate(
            ${rotation}
            ${centerX}
            ${centerY}
        )`;


    eyeWhite.setAttribute(
        "transform",
        eyeTransform
    );

    eyeClipPath.setAttribute(
        "transform",
        eyeTransform
    );


    /* ==========================
       SAFE IRIS MOVEMENT
    =========================== */

    const eyeHalfWidth =
        settings.eyeWidth / 2;

    const eyeHalfHeight =
        settings.eyeHeight / 2;

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
        centerX + irisOffsetX;

    const irisY =
        centerY + irisOffsetY;


    /* ==========================
       IRIS
    =========================== */

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
    =========================== */

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
    =========================== */

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
    =========================== */

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
    =========================== */

    upperLid.setAttribute(
        "d",
        createUpperLidPath(
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


        Object.assign(
            window.eyeSettings,
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
