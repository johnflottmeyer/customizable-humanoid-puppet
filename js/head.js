/* ==========================
   HEAD — VERSION 1.1

   Adds lower-jaw / chin articulation
   driven by mouthEngineSettings.mouthOpen.
========================== */

/* ==========================
   HEAD SETTINGS
========================== */

window.headSettings = {

    centerX: 250,

    topY: 45,
    headHeight: 421,

    /*
       Vertical landmark positions.

       These are percentages of headHeight.
    */

    foreheadPosition: 0.13,
    templePosition: 0.31,
    cheekPosition: 0.58,
    jawPosition: 0.83,
    chinPosition: 0.97,

    /*
       Width from the center line.
    */

    foreheadWidth: 112,
    templeWidth: 134,
    cheekWidth: 140,
    jawWidth: 110,
    chinWidth: 68,

    /*
       Regional roundness controls.

       These names remain the same so your
       existing sliders can continue working.
    */

    foreheadRoundness: 35,
    templeRoundness: 28,
    cheekRoundness: 30,
    jawRoundness: 24,

    chinBottomWidth: 34,
    chinDepth: 6,
    chinRoundness: 24,

    /* ==========================
       JAW ARTICULATION
       ========================== */

    jawOpenDrop: 9,
    jawOpenNarrowing: 0.04,

    jawOpenJawShare: 0.28,
    jawOpenChinShare: 0.78

};


/* ==========================
   LIMIT NUMBER
========================== */

function clampHeadValue(
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
   GET SAFE SETTING
========================== */

function getHeadSetting(
    settings,
    name,
    fallback
) {

    const value =
        Number(
            settings[name]
        );

    if (!Number.isFinite(value)) {
        return fallback;
    }

    return value;

}


/* ==========================
   CREATE SMOOTH CURVE
========================== */

/*
   Converts profile points into smooth
   cubic Bézier segments.
*/

function createSmoothHeadCurve(
    points,
    tension
) {

    if (
        !Array.isArray(points) ||
        points.length < 2
    ) {

        return "";

    }

    const curveTension =
        Number.isFinite(tension)
            ? tension
            : 0.68;

    const path = [

        `M ${points[0].x} ${points[0].y}`

    ];


    for (
        let index = 0;
        index < points.length - 1;
        index++
    ) {

        const point0 =
            points[
                Math.max(
                    0,
                    index - 1
                )
            ];

        const point1 =
            points[index];

        const point2 =
            points[index + 1];

        const point3 =
            points[
                Math.min(
                    points.length - 1,
                    index + 2
                )
            ];


        const control1X =
            point1.x +
            (
                point2.x -
                point0.x
            ) *
            curveTension /
            6;

        const control1Y =
            point1.y +
            (
                point2.y -
                point0.y
            ) *
            curveTension /
            6;


        const control2X =
            point2.x -
            (
                point3.x -
                point1.x
            ) *
            curveTension /
            6;

        const control2Y =
            point2.y -
            (
                point3.y -
                point1.y
            ) *
            curveTension /
            6;


        path.push(

            `C ${control1X} ${control1Y}`,

            `${control2X} ${control2Y}`,

            `${point2.x} ${point2.y}`

        );

    }


    return path.join(" ");

}


/* ==========================
   REMOVE INITIAL MOVE
========================== */

function removeInitialMoveCommand(path) {

    return path.replace(

        /^M\s*-?[\d.]+\s*-?[\d.]+\s*/,

        ""

    );

}


/* ==========================
   GET MOUTH OPEN AMOUNT
========================== */

function getHeadMouthOpenAmount() {

    const mouthSettings =
        window.mouthEngineSettings || {};


    return clampHeadValue(

        Number(
            mouthSettings.mouthOpen
        ) || 0,

        0,
        1

    );

}


/* ==========================
   JAW ARTICULATION
========================== */

function getHeadJawArticulation(
    settings
) {

    const mouthOpen =
        getHeadMouthOpenAmount();


    const smoothOpen =
        mouthOpen *
        mouthOpen *
        (
            3 -
            2 *
            mouthOpen
        );


    const jawOpenDrop =
        clampHeadValue(
            getHeadSetting(
                settings,
                "jawOpenDrop",
                9
            ),
            0,
            30
        );


    const jawOpenNarrowing =
        clampHeadValue(
            getHeadSetting(
                settings,
                "jawOpenNarrowing",
                0.04
            ),
            0,
            0.20
        );


    const jawShare =
        clampHeadValue(
            getHeadSetting(
                settings,
                "jawOpenJawShare",
                0.28
            ),
            0,
            1
        );


    const chinShare =
        clampHeadValue(
            getHeadSetting(
                settings,
                "jawOpenChinShare",
                0.78
            ),
            0,
            1
        );


    return {

        mouthOpen:
            mouthOpen,

        smoothOpen:
            smoothOpen,

        jawDrop:
            jawOpenDrop *
            smoothOpen *
            jawShare,

        upperChinDrop:
            jawOpenDrop *
            smoothOpen *
            (
                jawShare +
                (
                    chinShare -
                    jawShare
                ) *
                0.58
            ),

        chinDrop:
            jawOpenDrop *
            smoothOpen *
            chinShare,

        chinBottomDrop:
            jawOpenDrop *
            smoothOpen,

        widthScale:
            1 -
            jawOpenNarrowing *
            smoothOpen

    };

}


/* ==========================
   CREATE SIDE PROFILE
========================== */

function createHeadSidePoints(
    side,
    settings
) {

    const direction =
        side === "left"
            ? -1
            : 1;


    /* ==========================
       MAIN SETTINGS
    ========================== */

    const centerX =
        getHeadSetting(
            settings,
            "centerX",
            250
        );

    const topY =
        getHeadSetting(
            settings,
            "topY",
            45
        );

    const headHeight =
        Math.max(
            100,
            getHeadSetting(
                settings,
                "headHeight",
                421
            )
        );


    /* ==========================
       VERTICAL POSITIONS
    ========================== */

    const foreheadPosition =
        clampHeadValue(
            getHeadSetting(
                settings,
                "foreheadPosition",
                0.13
            ),
            0.05,
            0.25
        );

    const templePosition =
        clampHeadValue(
            getHeadSetting(
                settings,
                "templePosition",
                0.31
            ),
            foreheadPosition + 0.05,
            0.45
        );

    const cheekPosition =
        clampHeadValue(
            getHeadSetting(
                settings,
                "cheekPosition",
                0.58
            ),
            templePosition + 0.08,
            0.72
        );

    const jawPosition =
        clampHeadValue(
            getHeadSetting(
                settings,
                "jawPosition",
                0.83
            ),
            cheekPosition + 0.08,
            0.92
        );

    const chinPosition =
        clampHeadValue(
            getHeadSetting(
                settings,
                "chinPosition",
                0.97
            ),
            jawPosition + 0.03,
            1
        );


    const foreheadY =
        topY +
        headHeight *
        foreheadPosition;

    const templeY =
        topY +
        headHeight *
        templePosition;

    const cheekY =
        topY +
        headHeight *
        cheekPosition;

    const jawY =
        topY +
        headHeight *
        jawPosition;

    const chinY =
        topY +
        headHeight *
        chinPosition;


    const chinDepth =
        getHeadSetting(
            settings,
            "chinDepth",
            6
        );

    const chinBottomY =
        topY +
        headHeight +
        chinDepth;


    /* ==========================
       WIDTH SETTINGS
    ========================== */

    const foreheadWidth =
        Math.max(
            20,
            getHeadSetting(
                settings,
                "foreheadWidth",
                112
            )
        );

    const templeWidth =
        Math.max(
            20,
            getHeadSetting(
                settings,
                "templeWidth",
                134
            )
        );

    const cheekWidth =
        Math.max(
            20,
            getHeadSetting(
                settings,
                "cheekWidth",
                140
            )
        );

    const jawWidth =
        Math.max(
            20,
            getHeadSetting(
                settings,
                "jawWidth",
                110
            )
        );

    const chinWidth =
        Math.max(
            15,
            getHeadSetting(
                settings,
                "chinWidth",
                68
            )
        );

    const chinBottomWidth =
        Math.max(
            8,
            getHeadSetting(
                settings,
                "chinBottomWidth",
                34
            )
        );


    /* ==========================
       JAW ARTICULATION
    ========================== */

    const jawArticulation =
        getHeadJawArticulation(
            settings
        );


    const articulatedJawWidth =
        jawWidth *
        (
            1 -
            (
                1 -
                jawArticulation.widthScale
            ) *
            0.45
        );


    const articulatedChinWidth =
        chinWidth *
        jawArticulation.widthScale;


    const articulatedChinBottomWidth =
        chinBottomWidth *
        jawArticulation.widthScale;


    /* ==========================
       ROUNDNESS SETTINGS
    ========================== */

    const foreheadRoundness =
        clampHeadValue(
            getHeadSetting(
                settings,
                "foreheadRoundness",
                35
            ),
            0,
            100
        ) /
        100;

    const templeRoundness =
        clampHeadValue(
            getHeadSetting(
                settings,
                "templeRoundness",
                28
            ),
            0,
            100
        ) /
        100;

    const cheekRoundness =
        clampHeadValue(
            getHeadSetting(
                settings,
                "cheekRoundness",
                30
            ),
            0,
            100
        ) /
        100;

    const jawRoundness =
        clampHeadValue(
            getHeadSetting(
                settings,
                "jawRoundness",
                24
            ),
            0,
            100
        ) /
        100;

    const chinRoundness =
        clampHeadValue(
            getHeadSetting(
                settings,
                "chinRoundness",
                24
            ),
            0,
            100
        ) /
        100;


    /* ==========================
       CROWN WIDTHS
    ========================== */

    const crownCenterWidth =
        foreheadWidth *
        (
            0.18 +
            foreheadRoundness *
            0.08
        );

    const crownUpperWidth =
        foreheadWidth *
        (
            0.48 +
            foreheadRoundness *
            0.06
        );

    const crownSideWidth =
        foreheadWidth *
        (
            0.72 +
            foreheadRoundness *
            0.05
        );

    const upperForeheadWidth =
        foreheadWidth *
        (
            0.90 +
            foreheadRoundness *
            0.05
        );


    /* ==========================
       INTERMEDIATE WIDTHS
    ========================== */

    const foreheadTempleBlend =
        0.46 +
        templeRoundness *
        0.10;

    const upperTempleWidth =
        foreheadWidth +
        (
            templeWidth -
            foreheadWidth
        ) *
        foreheadTempleBlend;


    const templeCheekBlend =
        0.48 +
        cheekRoundness *
        0.10;

    const upperCheekWidth =
        templeWidth +
        (
            cheekWidth -
            templeWidth
        ) *
        templeCheekBlend;


    const cheekJawBlend =
        0.42 +
        jawRoundness *
        0.12;

    const lowerCheekWidth =
        cheekWidth +
        (
            jawWidth -
            cheekWidth
        ) *
        cheekJawBlend;


    const jawChinBlend =
        0.50 +
        chinRoundness *
        0.12;

    const upperChinWidth =
        articulatedJawWidth +
        (
            articulatedChinWidth -
            articulatedJawWidth
        ) *
        jawChinBlend;


    /* ==========================
       POINT HELPER
    ========================== */

    function point(
        width,
        y
    ) {

        return {

            x:
                centerX +
                direction *
                width,

            y: y

        };

    }


    /* ==========================
       PROFILE POINTS
    ========================== */

    return [

        /* Crown */

        point(
            crownCenterWidth,
            topY
        ),

        point(
            crownUpperWidth,
            topY +
            headHeight *
            0.012
        ),

        point(
            crownSideWidth,
            topY +
            headHeight *
            0.035
        ),

        point(
            upperForeheadWidth,
            topY +
            headHeight *
            0.075
        ),

        /* Forehead */

        point(
            foreheadWidth,
            foreheadY
        ),

        /* Forehead to temple */

        point(
            upperTempleWidth,
            foreheadY +
            (
                templeY -
                foreheadY
            ) *
            0.46
        ),

        /* Temple */

        point(
            templeWidth,
            templeY
        ),

        /* Temple to cheek */

        point(
            upperCheekWidth,
            templeY +
            (
                cheekY -
                templeY
            ) *
            0.48
        ),

        /* Cheek */

        point(
            cheekWidth,
            cheekY
        ),

        /* Cheek to jaw */

        point(
            lowerCheekWidth,
            cheekY +
            (
                jawY -
                cheekY
            ) *
            0.54
        ),

        /* Jaw */

        point(
            articulatedJawWidth,
            jawY +
            jawArticulation.jawDrop
        ),

        /* Jaw to chin */

        point(
            upperChinWidth,
            jawY +
            (
                chinY -
                jawY
            ) *
            0.52 +
            jawArticulation.upperChinDrop
        ),

        /* Chin side */

        point(
            articulatedChinWidth,
            chinY +
            jawArticulation.chinDrop
        ),

        /* Chin bottom corner */

        point(
            articulatedChinBottomWidth,
            chinBottomY +
            jawArticulation.chinBottomDrop
        )

    ];

}


/* ==========================
   DRAW HEAD
========================== */

window.drawHead = function () {

    const head =
        document.getElementById(
            "head"
        );

    if (!head) {

        console.error(
            "Could not find #head"
        );

        return;

    }


    const settings =
        window.headSettings;


    /* ==========================
       CREATE SIDE POINTS
    ========================== */

    const leftPoints =
        createHeadSidePoints(
            "left",
            settings
        );

    const rightPoints =
        createHeadSidePoints(
            "right",
            settings
        );


    if (
        leftPoints.length < 2 ||
        rightPoints.length < 2
    ) {

        console.error(
            "Could not create head profile points."
        );

        return;

    }


    /* ==========================
       SIDE CURVES
    ========================== */

    const sideTension = 0.68;

    const leftCurve =
        createSmoothHeadCurve(
            leftPoints,
            sideTension
        );


    const reversedRightPoints =
        [...rightPoints].reverse();

    const rightCurve =
        createSmoothHeadCurve(
            reversedRightPoints,
            sideTension
        );

    const rightCurveWithoutMove =
        removeInitialMoveCommand(
            rightCurve
        );


    /* ==========================
       CHIN BOTTOM
    ========================== */

    const leftChinBottom =
        leftPoints[
            leftPoints.length - 1
        ];

    const rightChinBottom =
        rightPoints[
            rightPoints.length - 1
        ];


    const chinRoundness =
        clampHeadValue(
            getHeadSetting(
                settings,
                "chinRoundness",
                24
            ),
            0,
            100
        );


    const chinCenterY =
        Math.max(
            leftChinBottom.y,
            rightChinBottom.y
        ) +
        clampHeadValue(
            chinRoundness * 0.05,
            2,
            7
        );


    const chinCurve = `

        Q
        ${settings.centerX}
        ${chinCenterY},

        ${rightChinBottom.x}
        ${rightChinBottom.y}

    `;


    /* ==========================
       CROWN
    ========================== */

    const leftCrown =
        leftPoints[0];

    const rightCrown =
        rightPoints[0];


    const crownRise =
        clampHeadValue(
            settings.headHeight *
            0.008,
            2,
            5
        );


    /*
       A single quadratic curve creates one
       smooth crown without a center dimple.
    */

    const crownCurve = `

        Q
        ${settings.centerX}
        ${settings.topY - crownRise},

        ${leftCrown.x}
        ${leftCrown.y}

    `;


    /* ==========================
       FINAL HEAD PATH
    ========================== */

    const path = `

        ${leftCurve}

        ${chinCurve}

        ${rightCurveWithoutMove}

        ${crownCurve}

        Z

    `;


    head.setAttribute(
        "d",
        path
    );

};


/* ==========================
   MAKE HELPERS AVAILABLE
========================== */

window.createHeadSidePoints =
    createHeadSidePoints;

window.createSmoothHeadCurve =
    createSmoothHeadCurve;

window.getHeadJawArticulation =
    getHeadJawArticulation;


console.log(
    "head.js V1.1 loaded"
);
