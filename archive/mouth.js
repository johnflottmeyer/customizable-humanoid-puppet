/* ==========================
   DEFAULT MOUTH ANATOMY
========================== */

const defaultMouthSettings = {

    /* POSITION */

    mouthX: 250,
    mouthY: 381,

    /* RESTING PROPORTIONS */

    mouthWidth: 150,

    upperLipHeight: 12,
    lowerLipHeight: 17,

    cupidBowWidth: 30,
    cupidBowDepth: 4.5,

    cornerInset: 10,

    /* LIGHTING */

    lowerHighlightWidth: 28,
    lowerHighlightHeight: 2.2,

    underLipShadowWidth: 60,
    underLipShadowHeight: 3,

    /* NATURAL ASYMMETRY */

    leftCornerOffsetY: 0,
    rightCornerOffsetY: 0.6,

    leftPeakOffsetY: 0,
    rightPeakOffsetY: 0.4
};


/* ==========================
   ACTIVE ANATOMY SETTINGS
========================== */

window.mouthSettings = {
    ...defaultMouthSettings
};


/* ==========================
   MOUTH STATE LAYERS
========================== */

/*
    All animation values are offsets from
    the neutral mouth.

    open
        Separates upper and lower lips.

    spread
        Widens the mouth, useful for EE.

    pucker
        Narrows and rounds the mouth,
        useful for OO.

    smile
        Raises or lowers the corners.

    upperRaise
        Raises the upper lip.

    lowerDrop
        Moves the lower lip downward.

    jaw
        Moves the lower mouth structure
        downward during speech.
*/

window.mouthState = {

    expression: {

        open: 0,
        spread: 0,
        pucker: 0,
        smile: 0,

        upperRaise: 0,
        lowerDrop: 0,
        jaw: 0
    },

    speech: {

        open: 0,
        spread: 0,
        pucker: 0,
        smile: 0,

        upperRaise: 0,
        lowerDrop: 0,
        jaw: 0
    },

    idle: {

        open: 0,
        spread: 0,
        pucker: 0,
        smile: 0,

        upperRaise: 0,
        lowerDrop: 0,
        jaw: 0
    }
};


/* ==========================
   STATE PROPERTY NAMES
========================== */

const mouthStateProperties = [

    "open",
    "spread",
    "pucker",
    "smile",

    "upperRaise",
    "lowerDrop",
    "jaw"

];


/* ==========================
   COMBINE MOUTH STATE
========================== */

function getCombinedMouthState() {

    const combined = {

        open: 0,
        spread: 0,
        pucker: 0,
        smile: 0,

        upperRaise: 0,
        lowerDrop: 0,
        jaw: 0
    };


    Object.values(
        window.mouthState
    ).forEach((layer) => {

        mouthStateProperties.forEach(
            (propertyName) => {

                const value =
                    Number(
                        layer[propertyName]
                    );

                if (
                    !Number.isNaN(value)
                ) {

                    combined[propertyName] +=
                        value;
                }

            }
        );

    });


    return combined;

}


/* ==========================
   GET DEFORMED MOUTH VALUES
========================== */

function getMouthGeometry() {

    const settings =
        window.mouthSettings;

    const state =
        getCombinedMouthState();


    /*
        Pucker narrows the mouth more strongly
        than spread widens it.
    */

    const width = Math.max(

        35,

        settings.mouthWidth +
        state.spread -
        state.pucker * 1.6

    );


    const centerX =
        settings.mouthX;


    const centerY =
        settings.mouthY;


    const halfWidth =
        width / 2;


    /*
        Positive smile raises the corners.

        SVG Y values increase downward,
        so smile is subtracted.
    */

    const leftCornerY =

        centerY +
        settings.leftCornerOffsetY -
        state.smile;


    const rightCornerY =

        centerY +
        settings.rightCornerOffsetY -
        state.smile;


    /*
        Upper lip moves only slightly.

        Lower lip and jaw carry most
        of the opening motion.
    */

    const upperLipY =

        centerY -
        state.open * 0.18 -
        state.upperRaise;


    const jawOffset =

        state.jaw +
        state.lowerDrop +
        state.open * 0.72;


    const lowerLipY =

        centerY +
        jawOffset;


    const openingHeight = Math.max(

        0,

        state.open +
        state.jaw * 0.35

    );


    const cupidBowWidth = Math.max(

        8,

        settings.cupidBowWidth -
        state.pucker * 0.45 +
        state.spread * 0.1

    );


    return {

        settings,
        state,

        centerX,
        centerY,

        width,
        halfWidth,

        leftCornerX:
            centerX - halfWidth,

        rightCornerX:
            centerX + halfWidth,

        leftCornerY,
        rightCornerY,

        upperLipY,
        lowerLipY,

        jawOffset,
        openingHeight,

        cupidBowWidth

    };

}


/* ==========================
   CREATE UPPER LIP PATH
========================== */

function createUpperLipPath() {

    const geometry =
        getMouthGeometry();


    const {

        settings,

        centerX,
        width,

        leftCornerX,
        rightCornerX,

        leftCornerY,
        rightCornerY,

        upperLipY,
        cupidBowWidth

    } = geometry;


    const halfCupidWidth =
        cupidBowWidth / 2;


    const leftPeakX =
        centerX -
        halfCupidWidth;


    const rightPeakX =
        centerX +
        halfCupidWidth;


    const leftPeakY =

        upperLipY -
        settings.upperLipHeight +
        settings.leftPeakOffsetY;


    const rightPeakY =

        upperLipY -
        settings.upperLipHeight +
        settings.rightPeakOffsetY;


    const cupidNotchY =

        upperLipY -
        settings.upperLipHeight +
        settings.cupidBowDepth;


    const leftVisibleCornerX =

        leftCornerX +
        settings.cornerInset;


    const rightVisibleCornerX =

        rightCornerX -
        settings.cornerInset;


    return [

        `M
            ${leftVisibleCornerX}
            ${leftCornerY}
        `,


        /*
            Left outer lip.
        */

        `C
            ${leftCornerX + width * 0.15}
            ${leftCornerY - 1}

            ${leftPeakX - width * 0.13}
            ${leftPeakY + 1}

            ${leftPeakX}
            ${leftPeakY}
        `,


        /*
            Left Cupid's-bow roll.
        */

        `C
            ${leftPeakX + width * 0.065}
            ${leftPeakY + 0.2}

            ${centerX - width * 0.045}
            ${cupidNotchY}

            ${centerX}
            ${cupidNotchY}
        `,


        /*
            Right Cupid's-bow roll.
        */

        `C
            ${centerX + width * 0.045}
            ${cupidNotchY}

            ${rightPeakX - width * 0.065}
            ${rightPeakY + 0.2}

            ${rightPeakX}
            ${rightPeakY}
        `,


        /*
            Right outer lip.
        */

        `C
            ${rightPeakX + width * 0.13}
            ${rightPeakY + 1}

            ${rightCornerX - width * 0.15}
            ${rightCornerY - 1}

            ${rightVisibleCornerX}
            ${rightCornerY}
        `,


        /*
            Inner upper-lip edge.
        */

        `C
            ${rightCornerX - width * 0.20}
            ${upperLipY + 0.2}

            ${centerX + width * 0.16}
            ${upperLipY + 0.45}

            ${centerX}
            ${upperLipY + 0.3}
        `,


        `C
            ${centerX - width * 0.16}
            ${upperLipY + 0.45}

            ${leftCornerX + width * 0.20}
            ${upperLipY + 0.2}

            ${leftVisibleCornerX}
            ${leftCornerY}
        `,

        "Z"

    ].join(" ");

}


/* ==========================
   CREATE LOWER LIP PATH
========================== */

function createLowerLipPath() {

    const geometry =
        getMouthGeometry();


    const {

        settings,

        centerX,
        width,

        leftCornerX,
        rightCornerX,

        leftCornerY,
        rightCornerY,

        lowerLipY,
        openingHeight

    } = geometry;


    const leftVisibleCornerX =

        leftCornerX +
        settings.cornerInset;


    const rightVisibleCornerX =

        rightCornerX -
        settings.cornerInset;


    /*
        When the mouth opens, the upper boundary
        of the lower lip moves downward.
    */

    const innerEdgeY =

        lowerLipY +
        1 +
        openingHeight * 0.12;


    const lowerCenterY =

        lowerLipY +
        settings.lowerLipHeight;


    const leftLobeX =

        centerX -
        width * 0.12;


    const rightLobeX =

        centerX +
        width * 0.12;


    return [

        `M
            ${leftVisibleCornerX}
            ${leftCornerY}
        `,


        /*
            Inner boundary of lower lip.
        */

        `C
            ${leftCornerX + width * 0.20}
            ${innerEdgeY}

            ${centerX - width * 0.18}
            ${innerEdgeY + 0.7}

            ${centerX}
            ${innerEdgeY + 0.4}
        `,


        `C
            ${centerX + width * 0.18}
            ${innerEdgeY + 0.7}

            ${rightCornerX - width * 0.20}
            ${innerEdgeY}

            ${rightVisibleCornerX}
            ${rightCornerY}
        `,


        /*
            Right lower-lip volume.
        */

        `C
            ${rightCornerX - width * 0.10}
            ${rightCornerY + 4}

            ${rightLobeX + width * 0.12}
            ${lowerCenterY - 1}

            ${rightLobeX}
            ${lowerCenterY}
        `,


        /*
            Right lobe into center.
        */

        `C
            ${centerX + width * 0.065}
            ${lowerCenterY + 0.4}

            ${centerX + width * 0.025}
            ${lowerCenterY + 0.2}

            ${centerX}
            ${lowerCenterY + 0.2}
        `,


        /*
            Center into left lobe.
        */

        `C
            ${centerX - width * 0.025}
            ${lowerCenterY + 0.2}

            ${centerX - width * 0.065}
            ${lowerCenterY + 0.4}

            ${leftLobeX}
            ${lowerCenterY}
        `,


        /*
            Left lower-lip volume.
        */

        `C
            ${leftLobeX - width * 0.12}
            ${lowerCenterY - 1}

            ${leftCornerX + width * 0.10}
            ${leftCornerY + 4}

            ${leftVisibleCornerX}
            ${leftCornerY}
        `,

        "Z"

    ].join(" ");

}


/* ==========================
   CREATE MOUTH OPENING PATH
========================== */

function createMouthOpeningPath() {

    const geometry =
        getMouthGeometry();


    const {

        settings,

        centerX,
        width,

        leftCornerX,
        rightCornerX,

        leftCornerY,
        rightCornerY,

        upperLipY,
        lowerLipY,

        openingHeight

    } = geometry;


    /*
        The opening now shares the same
        corner system as the lips.
    */

    const animatedInset =
        Math.max(
            4,
            settings.cornerInset -
            openingHeight * 0.25
        );


    const leftX =
        leftCornerX +
        animatedInset;


    const rightX =
        rightCornerX -
        animatedInset;


    const openingWidth =
        rightX -
        leftX;


    /*
        Closed mouth remains a crease.
    */

    if (
        openingHeight < 0.8
    ) {

        const creaseY =
            upperLipY + 0.55;


        return [

            `M
                ${leftX}
                ${leftCornerY + 0.2}
            `,


            `C
                ${leftX + openingWidth * 0.22}
                ${creaseY - 0.35}

                ${centerX - openingWidth * 0.16}
                ${creaseY + 0.3}

                ${centerX}
                ${creaseY + 0.12}
            `,


            `C
                ${centerX + openingWidth * 0.16}
                ${creaseY + 0.3}

                ${rightX - openingWidth * 0.22}
                ${creaseY - 0.35}

                ${rightX}
                ${rightCornerY + 0.2}
            `

        ].join(" ");

    }


    /*
        Upper and lower opening edges are
        derived from the same lip geometry.
    */

    const upperCenterY =
        upperLipY +
        openingHeight * 0.08;


    const lowerCenterY =
        lowerLipY +
        openingHeight * 0.55;


    const upperSideY =
        upperCenterY +
        openingHeight * 0.20;


    const lowerSideY =
        lowerCenterY -
        openingHeight * 0.18;


    return [

        /*
            Start at left shared corner.
        */

        `M
            ${leftX}
            ${leftCornerY + openingHeight * 0.08}
        `,


        /*
            Upper interior edge.
        */

        `C
            ${leftX + openingWidth * 0.18}
            ${upperSideY}

            ${centerX - openingWidth * 0.18}
            ${upperCenterY}

            ${centerX}
            ${upperCenterY}
        `,


        `C
            ${centerX + openingWidth * 0.18}
            ${upperCenterY}

            ${rightX - openingWidth * 0.18}
            ${upperSideY}

            ${rightX}
            ${rightCornerY + openingHeight * 0.08}
        `,


        /*
            Lower interior edge.
        */

        `C
            ${rightX - openingWidth * 0.16}
            ${lowerSideY}

            ${centerX + openingWidth * 0.20}
            ${lowerCenterY}

            ${centerX}
            ${lowerCenterY}
        `,


        `C
            ${centerX - openingWidth * 0.20}
            ${lowerCenterY}

            ${leftX + openingWidth * 0.16}
            ${lowerSideY}

            ${leftX}
            ${leftCornerY + openingHeight * 0.08}
        `,

        "Z"

    ].join(" ");

}

/* ==========================
   DRAW MOUTH LIGHTING
========================== */

function drawMouthLighting() {

    const settings =
        window.mouthSettings;


    const geometry =
        getMouthGeometry();


    const highlight =
        document.getElementById(
            "lowerLipHighlight"
        );


    const shadow =
        document.getElementById(
            "underLipShadow"
        );


    if (highlight) {

        highlight.setAttribute(
            "cx",
            geometry.centerX
        );


        highlight.setAttribute(

            "cy",

            geometry.lowerLipY +
            settings.lowerLipHeight * 0.58

        );


        highlight.setAttribute(

            "rx",

            settings.lowerHighlightWidth / 2

        );


        highlight.setAttribute(

            "ry",

            settings.lowerHighlightHeight / 2

        );


        highlight.setAttribute(

            "fill",

            "url(#lowerLipHighlightGradient)"

        );

    }


    if (shadow) {

        shadow.setAttribute(
            "cx",
            geometry.centerX
        );


        shadow.setAttribute(

            "cy",

            geometry.lowerLipY +
            settings.lowerLipHeight +
            5

        );


        shadow.setAttribute(

            "rx",

            settings.underLipShadowWidth / 2

        );


        shadow.setAttribute(

            "ry",

            settings.underLipShadowHeight / 2

        );


        shadow.setAttribute(

            "fill",

            "url(#underLipShadowGradient)"

        );

    }

}


/* ==========================
   DRAW MOUTH
========================== */

function drawMouth() {

    const upperLip =
        document.getElementById(
            "upperLip"
        );


    const lowerLip =
        document.getElementById(
            "lowerLip"
        );


    const mouthOpening =
        document.getElementById(
            "mouthOpening"
        );


    if (
        !upperLip ||
        !lowerLip ||
        !mouthOpening
    ) {

        console.warn(
            "Could not find the required mouth SVG paths."
        );

        return;

    }


    const geometry =
        getMouthGeometry();


    upperLip.setAttribute(
        "d",
        createUpperLipPath()
    );


    lowerLip.setAttribute(
        "d",
        createLowerLipPath()
    );


    mouthOpening.setAttribute(
        "d",
        createMouthOpeningPath()
    );


    upperLip.setAttribute(
        "fill",
        "url(#upperLipGradient)"
    );


    upperLip.setAttribute(
        "stroke",
        "none"
    );


    lowerLip.setAttribute(
        "fill",
        "url(#lowerLipGradient)"
    );


    lowerLip.setAttribute(
        "stroke",
        "none"
    );


    /*
        Closed mouth uses a stroked crease.

        Open mouth uses a filled interior.
    */

    if (
        geometry.openingHeight < 0.8
    ) {

        mouthOpening.setAttribute(
            "fill",
            "none"
        );


        mouthOpening.setAttribute(
            "stroke",
            "#754348"
        );


        mouthOpening.setAttribute(
            "stroke-width",
            "0.8"
        );


        mouthOpening.setAttribute(
            "stroke-opacity",
            "0.7"
        );


        mouthOpening.setAttribute(
            "stroke-linecap",
            "round"
        );

    } else {

        mouthOpening.setAttribute(
            "fill",
            "url(#mouthOpeningGradient)"
        );


        mouthOpening.setAttribute(
            "stroke",
            "none"
        );

    }


    drawMouthLighting();

}


/* ==========================
   SET ONE STATE LAYER
========================== */

function setMouthState(
    layerName,
    newValues
) {

    const layer =
        window.mouthState[layerName];


    if (!layer) {

        console.warn(
            `Unknown mouth state layer: ${layerName}`
        );

        return;

    }


    mouthStateProperties.forEach(
        (propertyName) => {

            if (
                Object.prototype.hasOwnProperty.call(
                    newValues,
                    propertyName
                )
            ) {

                const numericValue =
                    Number(
                        newValues[propertyName]
                    );


                if (
                    !Number.isNaN(
                        numericValue
                    )
                ) {

                    layer[propertyName] =
                        numericValue;

                }

            }

        }
    );


    drawMouth();

}


/* ==========================
   CLEAR ONE STATE LAYER
========================== */

function clearMouthState(
    layerName
) {

    const layer =
        window.mouthState[layerName];


    if (!layer) {

        return;

    }


    mouthStateProperties.forEach(
        (propertyName) => {

            layer[propertyName] = 0;

        }
    );


    drawMouth();

}


/* ==========================
   SIMPLE STATE TWEEN
========================== */

function animateMouthState(
    layerName,
    targetValues,
    duration = 180
) {

    const layer =
        window.mouthState[layerName];


    if (!layer) {

        return;

    }


    const startValues = {};


    mouthStateProperties.forEach(
        (propertyName) => {

            startValues[propertyName] =
                layer[propertyName];

        }
    );


    const startTime =
        performance.now();


    function animationFrame(
        currentTime
    ) {

        const elapsed =
            currentTime -
            startTime;


        const progress =
            Math.min(
                elapsed / duration,
                1
            );


        /*
            Smooth ease-in-out curve.
        */

        const easedProgress =

            progress < 0.5

                ? 2 * progress * progress

                : 1 -
                  Math.pow(
                      -2 * progress + 2,
                      2
                  ) / 2;


        mouthStateProperties.forEach(
            (propertyName) => {

                if (
                    !Object.prototype.hasOwnProperty.call(
                        targetValues,
                        propertyName
                    )
                ) {

                    return;

                }


                const targetValue =
                    Number(
                        targetValues[
                            propertyName
                        ]
                    );


                if (
                    Number.isNaN(
                        targetValue
                    )
                ) {

                    return;

                }


                const startValue =
                    startValues[propertyName];


                layer[propertyName] =

                    startValue +

                    (
                        targetValue -
                        startValue
                    ) *

                    easedProgress;

            }
        );


        drawMouth();


        if (
            progress < 1
        ) {

            requestAnimationFrame(
                animationFrame
            );

        }

    }


    requestAnimationFrame(
        animationFrame
    );

}


/* ==========================
   SPEECH SHAPES
========================== */

const MOUTH_SHAPES = {

    neutral: {

        open: 0,
        spread: 0,
        pucker: 0,
        upperRaise: 0,
        lowerDrop: 0,
        jaw: 0
    },


    MBP: {

        open: 0,
        spread: -2,
        pucker: 1,
        upperRaise: 0,
        lowerDrop: 0,
        jaw: 0
    },


    AH: {
    open: 70,
    spread: -2,
    pucker: 1,
    upperRaise: 0.4,
    lowerDrop: 1.2,
    jaw: 2.5
},


    EE: {

        open: 5,
        spread: 14,
        pucker: 0,
        upperRaise: 1,
        lowerDrop: 1,
        jaw: 2
    },


    OO: {

        open: 8,
        spread: -4,
        pucker: 12,
        upperRaise: 0,
        lowerDrop: 2,
        jaw: 4
    },


    FV: {

        open: 3,
        spread: 4,
        pucker: 0,
        upperRaise: 1,
        lowerDrop: 2,
        jaw: 1
    }

};


/* ==========================
   APPLY SPEECH SHAPE
========================== */

function setMouthShape(
    shapeName,
    duration = 120
) {

    const shape =
        MOUTH_SHAPES[shapeName];


    if (!shape) {

        console.warn(
            `Unknown mouth shape: ${shapeName}`
        );

        return;

    }


    animateMouthState(

        "speech",

        shape,

        duration

    );

}


/* ==========================
   EXPOSE FUNCTIONS
========================== */

window.drawMouth =
    drawMouth;


window.getMouthGeometry =
    getMouthGeometry;


window.getCombinedMouthState =
    getCombinedMouthState;


window.setMouthState =
    setMouthState;


window.clearMouthState =
    clearMouthState;


window.animateMouthState =
    animateMouthState;


window.setMouthShape =
    setMouthShape;


window.MOUTH_SHAPES =
    MOUTH_SHAPES;
