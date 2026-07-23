/* ==========================
   MOUTH ENGINE — VERSION 3

   Requires:

   Point
   Spline
   PathBuilder
   MouthProfiles
   MouthDirections
========================== */

(function () {

    "use strict";


    const SVG_NAMESPACE =
        "http://www.w3.org/2000/svg";


    /* ==========================
       DEFAULT SETTINGS
    ========================== */

    const defaultMouthEngineSettings = {

        /* ==========================
           POSITION
        ========================== */

        centerX: 250,
        centerY: 381,


        /* ==========================
           MOUTH SEAM
        ========================== */

        width: 150,

        cornerY: 0,
        peakY: -1.5,
        cupidY: -0.5,

        tension: 0.25,


        /* ==========================
           UPPER LIP PROFILE
        ========================== */

        upperLipThickness: 6.5,

        cupidBowHeight: 3.2,
        cupidBowWidth: 0.16,

        philtrumDip: 2.4,
        upperCenterFullness: 0.5,

        upperAsymmetry: 0,


        /* ==========================
           LOWER LIP PROFILE
        ========================== */

        lowerLipThickness: 8.5,

        lowerCenterFullness: 2.5,
        lowerLobeWidth: 0.34,

        lowerAsymmetry: 0,


        /* ==========================
           PROFILE CORNERS
        ========================== */

        cornerTaper: 1.9,
        cornerThickness: 0.02,


        /* ==========================
           DIRECTION FIELD
        ========================== */

        upperVerticalBias: 0.88,
        lowerVerticalBias: 0.94,

        upperCornerFlare: 0.34,
        lowerCornerFlare: 0.18,

        cornerFlareWidth: 0.28,

        smile: 0,

        upperExpressionStrength: 0.28,
        lowerExpressionStrength: 0.18,

        directionAsymmetry: 0,


        /* ==========================
           APPEARANCE
        ========================== */

        upperLipColor: "#b85f68",
        lowerLipColor: "#ca7880",

        seamColor: "#8f2740",
        seamWidth: 2,


        /* ==========================
           VISIBILITY
        ========================== */

        showLipShapes: true,

        showLandmarks: false,
        showSamples: false,

        showNormals: false,
        showTangents: false,

        showUpperDirections: false,
        showLowerDirections: false,

        showUpperCurve: true,
        showLowerCurve: true,

        showUpperProfilePoints: false,
        showLowerProfilePoints: false,


        /* ==========================
           SAMPLING
        ========================== */

        sampleCount: 40,

        normalLength: 12,
        tangentLength: 12,
        directionLength: 14

    };


    window.mouthEngineSettings = {

        ...defaultMouthEngineSettings

    };


    /* ==========================
       DEPENDENCY CHECK
    ========================== */

    function dependenciesAvailable() {

        const missing = [];


        if (!window.Point) {
            missing.push("Point");
        }

        if (!window.Spline) {
            missing.push("Spline");
        }

        if (!window.PathBuilder) {
            missing.push("PathBuilder");
        }

        if (!window.MouthProfiles) {
            missing.push("MouthProfiles");
        }

        if (!window.MouthDirections) {
            missing.push("MouthDirections");
        }


        if (missing.length > 0) {

            console.error(
                "mouthEngine.js is missing dependencies:",
                missing.join(", ")
            );

            return false;

        }


        return true;

    }


    /* ==========================
       NUMBER HELPERS
    ========================== */

    function safeNumber(
        value,
        fallback
    ) {

        const number =
            Number(value);


        return Number.isFinite(number)
            ? number
            : fallback;

    }


    /* ==========================
       CREATE POINT
    ========================== */

    function createPoint(
        x,
        y
    ) {

        return new Point(
            x,
            y
        );

    }


    /* ==========================
       MOVE POINT BY VECTOR
    ========================== */

    function movePoint(
        point,
        direction,
        distance
    ) {

        return createPoint(

            point.x +
            direction.x *
            distance,

            point.y +
            direction.y *
            distance

        );

    }


    /* ==========================
       GET SVG
    ========================== */

    function getFaceSvg() {

        return (
            document.getElementById("faceSvg") ||
            document.querySelector("svg")
        );

    }


    /* ==========================
       GET OR CREATE GROUP
    ========================== */

    function getMouthEngineGroup() {

        const svg =
            getFaceSvg();


        if (!svg) {

            console.warn(
                "Mouth engine could not find the face SVG."
            );

            return null;

        }


        let group =
            document.getElementById(
                "mouthEngineGroup"
            );


        if (!group) {

            group =
                document.createElementNS(
                    SVG_NAMESPACE,
                    "g"
                );

            group.setAttribute(
                "id",
                "mouthEngineGroup"
            );

        }


        svg.appendChild(group);

        return group;

    }


    /* ==========================
       CLEAR GROUP
    ========================== */

    function clearMouthEngineGroup(group) {

        while (group.firstChild) {

            group.removeChild(
                group.firstChild
            );

        }

    }


    /* ==========================
       SAMPLE COUNT
    ========================== */

    function getSampleCount() {

        return Math.max(

            8,

            Math.floor(

                safeNumber(
                    window
                        .mouthEngineSettings
                        .sampleCount,
                    40
                )

            )

        );

    }


    /* ==========================
       PROFILE SETTINGS
    ========================== */

    function getMouthProfileSettings() {

        const settings =
            window.mouthEngineSettings;


        return {

            upperLipThickness:
                settings.upperLipThickness,

            lowerLipThickness:
                settings.lowerLipThickness,

            cupidBowHeight:
                settings.cupidBowHeight,

            cupidBowWidth:
                settings.cupidBowWidth,

            philtrumDip:
                settings.philtrumDip,

            upperCenterFullness:
                settings.upperCenterFullness,

            lowerCenterFullness:
                settings.lowerCenterFullness,

            lowerLobeWidth:
                settings.lowerLobeWidth,

            cornerTaper:
                settings.cornerTaper,

            cornerThickness:
                settings.cornerThickness,

            upperAsymmetry:
                settings.upperAsymmetry,

            lowerAsymmetry:
                settings.lowerAsymmetry

        };

    }


    /* ==========================
       DIRECTION SETTINGS
    ========================== */

    function getMouthDirectionSettings() {

        const settings =
            window.mouthEngineSettings;


        return {

            upperVerticalBias:
                settings.upperVerticalBias,

            lowerVerticalBias:
                settings.lowerVerticalBias,

            upperCornerFlare:
                settings.upperCornerFlare,

            lowerCornerFlare:
                settings.lowerCornerFlare,

            cornerFlareWidth:
                settings.cornerFlareWidth,

            smile:
                settings.smile,

            upperExpressionStrength:
                settings.upperExpressionStrength,

            lowerExpressionStrength:
                settings.lowerExpressionStrength,

            asymmetry:
                settings.directionAsymmetry

        };

    }


    /* ==========================
       BUILD LANDMARKS
    ========================== */

    function buildMouthLandmarks() {

        const settings =
            window.mouthEngineSettings;

        const halfWidth =
            settings.width / 2;


        return [

            createPoint(

                settings.centerX -
                halfWidth,

                settings.centerY +
                settings.cornerY

            ),

            createPoint(

                settings.centerX -
                settings.width *
                0.2,

                settings.centerY +
                settings.peakY

            ),

            createPoint(

                settings.centerX,

                settings.centerY +
                settings.cupidY

            ),

            createPoint(

                settings.centerX +
                settings.width *
                0.2,

                settings.centerY +
                settings.peakY

            ),

            createPoint(

                settings.centerX +
                halfWidth,

                settings.centerY +
                settings.cornerY

            )

        ];

    }


    /* ==========================
       BUILD SEAM
    ========================== */

    function buildMouthSeam() {

        return Spline.fromPoints(

            buildMouthLandmarks(),

            window
                .mouthEngineSettings
                .tension

        );

    }


    /* ==========================
       SAMPLE SEAM

       This stage contains only
       seam geometry.

       No lip thickness or border
       construction happens here.
    ========================== */

    function sampleMouthSeam(
        seamSpline
    ) {

        const sampleCount =
            getSampleCount();

        const seamSamples = [];


        for (
            let index = 0;
            index <= sampleCount;
            index += 1
        ) {

            const t =
                index / sampleCount;


            seamSamples.push({

                t:
                    t,

                seamPoint:
                    seamSpline.getPoint(t),

                seamTangent:
                    seamSpline.getTangent(t),

                seamNormal:
                    seamSpline.getNormal(t)

            });

        }


        return seamSamples;

    }


    /* ==========================
       BUILD LIP ANATOMY

       Combines:

       seam geometry
       profile heights
       direction fields

       to create the final lip borders.
    ========================== */

    function buildLipAnatomy(
        seamSamples
    ) {

        const profileSettings =
            getMouthProfileSettings();

        const directionSettings =
            getMouthDirectionSettings();


        return seamSamples.map(

            function (seamSample) {

                const profile =
                    MouthProfiles.sample(

                        seamSample.t,

                        profileSettings

                    );


                const directions =
                    MouthDirections.sample(

                        seamSample.t,

                        seamSample.seamTangent,

                        seamSample.seamNormal,

                        directionSettings

                    );


                const upperBorder =
                    movePoint(

                        seamSample.seamPoint,

                        directions.upper,

                        profile.upperHeight

                    );


                const lowerBorder =
                    movePoint(

                        seamSample.seamPoint,

                        directions.lower,

                        profile.lowerHeight

                    );


                return {

                    /* Parameter */

                    t:
                        seamSample.t,


                    /* Seam anatomy */

                    seamPoint:
                        seamSample.seamPoint,

                    seamTangent:
                        seamSample.seamTangent,

                    seamNormal:
                        seamSample.seamNormal,


                    /* Direction field */

                    upperDirection:
                        directions.upper,

                    lowerDirection:
                        directions.lower,


                    /* Profile measurements */

                    upperHeight:
                        profile.upperHeight,

                    lowerHeight:
                        profile.lowerHeight,


                    /* Generated anatomy */

                    upperBorder:
                        upperBorder,

                    lowerBorder:
                        lowerBorder,


                    /* Profile weights */

                    cornerWeight:
                        profile.cornerWeight,

                    cupidWeight:
                        profile.cupidWeight,

                    philtrumWeight:
                        profile.philtrumWeight,

                    lowerLobeWeight:
                        profile.lowerLobeWeight,


                    /* Direction weights */

                    directionCornerWeight:
                        directions.cornerWeight,

                    directionCenterWeight:
                        directions.centerWeight

                };

            }

        );

    }


    /* ==========================
       BUILD MOUTH SAMPLES

       Compatibility helper.

       Existing code can continue calling
       buildMouthSamples(seamSpline).
    ========================== */

    function buildMouthSamples(
        seamSpline
    ) {

        const seamSamples =
            sampleMouthSeam(
                seamSpline
            );


        return buildLipAnatomy(
            seamSamples
        );

    }


    /* ==========================
       SAMPLE ARRAYS
    ========================== */

    function getSeamPoints(samples) {

        return samples.map(

            function (sample) {

                return sample.seamPoint;

            }

        );

    }


    function getUpperPoints(samples) {

        return samples.map(

            function (sample) {

                return sample.upperBorder;

            }

        );

    }


    function getLowerPoints(samples) {

        return samples.map(

            function (sample) {

                return sample.lowerBorder;

            }

        );

    }


    /* ==========================
       BUILD OPEN POINT PATH
    ========================== */

    function buildOpenPointPath(
        points
    ) {

        if (!points.length) {
            return "";
        }


        const builder =
            new PathBuilder();


        builder.moveTo(
            points[0]
        );


        for (
            let index = 1;
            index < points.length;
            index += 1
        ) {

            builder.lineTo(
                points[index]
            );

        }


        return builder.build();

    }


    /* ==========================
       BUILD CLOSED POINT PATH
    ========================== */

    function buildClosedPointPath(
        firstPoints,
        secondPoints
    ) {

        if (
            !firstPoints.length ||
            !secondPoints.length
        ) {

            return "";

        }


        const builder =
            new PathBuilder();


        builder.moveTo(
            firstPoints[0]
        );


        for (
            let index = 1;
            index < firstPoints.length;
            index += 1
        ) {

            builder.lineTo(
                firstPoints[index]
            );

        }


        for (
            let index = secondPoints.length - 1;
            index >= 0;
            index -= 1
        ) {

            builder.lineTo(
                secondPoints[index]
            );

        }


        builder.close();

        return builder.build();

    }


    /* ==========================
       BUILD UPPER LIP PATH
    ========================== */

    function buildUpperLipPath(
        samples
    ) {

        return buildClosedPointPath(

            getUpperPoints(samples),

            getSeamPoints(samples)

        );

    }


    /* ==========================
       BUILD LOWER LIP PATH
    ========================== */

    function buildLowerLipPath(
        samples
    ) {

        return buildClosedPointPath(

            getSeamPoints(samples),

            getLowerPoints(samples)

        );

    }


    /* ==========================
       CREATE SVG PATH
    ========================== */

    function createPath(
        pathData,
        options
    ) {

        const values =
            options || {};


        const path =
            document.createElementNS(
                SVG_NAMESPACE,
                "path"
            );


        path.setAttribute(
            "d",
            pathData
        );

        path.setAttribute(
            "fill",
            values.fill || "none"
        );

        path.setAttribute(
            "stroke",
            values.stroke || "none"
        );

        path.setAttribute(
            "stroke-width",
            values.strokeWidth || "1"
        );

        path.setAttribute(
            "stroke-linecap",
            values.lineCap || "round"
        );

        path.setAttribute(
            "stroke-linejoin",
            values.lineJoin || "round"
        );


        if (values.id) {

            path.setAttribute(
                "id",
                values.id
            );

        }


        if (values.className) {

            path.setAttribute(
                "class",
                values.className
            );

        }


        return path;

    }


    /* ==========================
       DRAW LIP SHAPES
    ========================== */

    function drawLipShapes(
        group,
        samples
    ) {

        const settings =
            window.mouthEngineSettings;


        const upperLip =
            createPath(

                buildUpperLipPath(samples),

                {

                    id:
                        "upperLipShape",

                    className:
                        "upperLipShape",

                    fill:
                        settings.upperLipColor,

                    stroke:
                        "none"

                }

            );


        const lowerLip =
            createPath(

                buildLowerLipPath(samples),

                {

                    id:
                        "lowerLipShape",

                    className:
                        "lowerLipShape",

                    fill:
                        settings.lowerLipColor,

                    stroke:
                        "none"

                }

            );


        group.appendChild(
            upperLip
        );

        group.appendChild(
            lowerLip
        );

    }


    /* ==========================
       DRAW SEAM
    ========================== */

    function drawSeam(
        group,
        seamPoints
    ) {

        const settings =
            window.mouthEngineSettings;


        const seamPath =
            createPath(

                buildOpenPointPath(
                    seamPoints
                ),

                {

                    id:
                        "mouthSeam",

                    className:
                        "mouthSeam",

                    fill:
                        "none",

                    stroke:
                        settings.seamColor,

                    strokeWidth:
                        settings.seamWidth

                }

            );


        group.appendChild(
            seamPath
        );

    }


    /* ==========================
       DRAW GUIDE CURVE
    ========================== */

    function drawGuideCurve(
        group,
        points,
        options
    ) {

        const path =
            createPath(

                buildOpenPointPath(
                    points
                ),

                {

                    id:
                        options.id,

                    className:
                        options.className,

                    fill:
                        "none",

                    stroke:
                        options.stroke,

                    strokeWidth:
                        options.strokeWidth || 2

                }

            );


        group.appendChild(
            path
        );

    }


    /* ==========================
       DRAW POINT COLLECTION
    ========================== */

    function drawPointCollection(
        group,
        points,
        options
    ) {

        points.forEach(

            function (point) {

                const circle =
                    document.createElementNS(
                        SVG_NAMESPACE,
                        "circle"
                    );


                circle.setAttribute(
                    "cx",
                    point.x
                );

                circle.setAttribute(
                    "cy",
                    point.y
                );

                circle.setAttribute(
                    "r",
                    options.radius || 2
                );

                circle.setAttribute(
                    "fill",
                    options.fill || "#ffffff"
                );

                circle.setAttribute(
                    "class",
                    options.className || ""
                );


                group.appendChild(
                    circle
                );

            }

        );

    }


    /* ==========================
       DRAW LANDMARKS
    ========================== */

    function drawLandmarks(
        group,
        landmarks
    ) {

        landmarks.forEach(

            function (
                point,
                index
            ) {

                const circle =
                    document.createElementNS(
                        SVG_NAMESPACE,
                        "circle"
                    );


                circle.setAttribute(
                    "cx",
                    point.x
                );

                circle.setAttribute(
                    "cy",
                    point.y
                );

                circle.setAttribute(
                    "r",
                    index === 2
                        ? 3.5
                        : 3
                );

                circle.setAttribute(
                    "fill",
                    index === 2
                        ? "#ffcc00"
                        : "#00b7ff"
                );

                circle.setAttribute(
                    "stroke",
                    "#111"
                );

                circle.setAttribute(
                    "stroke-width",
                    "1"
                );

                circle.setAttribute(
                    "class",
                    "mouthLandmark"
                );


                group.appendChild(
                    circle
                );

            }

        );

    }


    /* ==========================
       DRAW VECTOR LINE
    ========================== */

    function drawVectorLine(
        group,
        point,
        vector,
        length,
        color,
        strokeWidth,
        className
    ) {

        const line =
            document.createElementNS(
                SVG_NAMESPACE,
                "line"
            );


        line.setAttribute(
            "x1",
            point.x
        );

        line.setAttribute(
            "y1",
            point.y
        );

        line.setAttribute(
            "x2",
            point.x +
            vector.x *
            length
        );

        line.setAttribute(
            "y2",
            point.y +
            vector.y *
            length
        );

        line.setAttribute(
            "stroke",
            color
        );

        line.setAttribute(
            "stroke-width",
            strokeWidth
        );

        line.setAttribute(
            "stroke-linecap",
            "round"
        );


        if (className) {

            line.setAttribute(
                "class",
                className
            );

        }


        group.appendChild(
            line
        );

    }


    /* ==========================
       DRAW SAMPLE POINT
    ========================== */

    function drawSamplePoint(
        group,
        point
    ) {

        const circle =
            document.createElementNS(
                SVG_NAMESPACE,
                "circle"
            );


        circle.setAttribute(
            "cx",
            point.x
        );

        circle.setAttribute(
            "cy",
            point.y
        );

        circle.setAttribute(
            "r",
            "2.5"
        );

        circle.setAttribute(
            "fill",
            "#00a8ff"
        );

        circle.setAttribute(
            "class",
            "mouthSamplePoint"
        );


        group.appendChild(
            circle
        );

    }


    /* ==========================
       DRAW DEBUG GEOMETRY
    ========================== */

    function drawDebugGeometry(
        group,
        samples
    ) {

        const settings =
            window.mouthEngineSettings;


        samples.forEach(

            function (sample) {

                if (settings.showNormals) {

                    drawVectorLine(

                        group,

                        sample.seamPoint,

                        sample.seamNormal,

                        settings.normalLength,

                        "#00ff66",

                        1.5,

                        "mouthNormal"

                    );

                }


                if (settings.showTangents) {

                    drawVectorLine(

                        group,

                        sample.seamPoint,

                        sample.seamTangent,

                        settings.tangentLength,

                        "#ff4040",

                        1,

                        "mouthTangent"

                    );

                }


                if (
                    settings.showUpperDirections
                ) {

                    drawVectorLine(

                        group,

                        sample.seamPoint,

                        sample.upperDirection,

                        settings.directionLength,

                        "#ff9b30",

                        1.5,

                        "upperLipDirection"

                    );

                }


                if (
                    settings.showLowerDirections
                ) {

                    drawVectorLine(

                        group,

                        sample.seamPoint,

                        sample.lowerDirection,

                        settings.directionLength,

                        "#30baff",

                        1.5,

                        "lowerLipDirection"

                    );

                }


                if (settings.showSamples) {

                    drawSamplePoint(

                        group,

                        sample.seamPoint

                    );

                }

            }

        );

    }


    /* ==========================
       DRAW MOUTH
    ========================== */

    function drawMouthEngine() {

        if (!dependenciesAvailable()) {
            return;
        }


        const group =
            getMouthEngineGroup();


        if (!group) {
            return;
        }


        clearMouthEngineGroup(
            group
        );


        const settings =
            window.mouthEngineSettings;


        const landmarks =
            buildMouthLandmarks();


        const seamSpline =
            Spline.fromPoints(

                landmarks,

                settings.tension

            );


        const seamSamples =
            sampleMouthSeam(
                seamSpline
            );


        const anatomySamples =
            buildLipAnatomy(
                seamSamples
            );


        const seamPoints =
            getSeamPoints(
                anatomySamples
            );


        const upperPoints =
            getUpperPoints(
                anatomySamples
            );


        const lowerPoints =
            getLowerPoints(
                anatomySamples
            );


        if (settings.showLipShapes) {

            drawLipShapes(

                group,

                anatomySamples

            );

        }


        if (settings.showUpperCurve) {

            drawGuideCurve(

                group,

                upperPoints,

                {

                    id:
                        "upperLipCurve",

                    className:
                        "upperLipCurve",

                    stroke:
                        "#ff3030",

                    strokeWidth:
                        2

                }

            );

        }


        if (settings.showLowerCurve) {

            drawGuideCurve(

                group,

                lowerPoints,

                {

                    id:
                        "lowerLipCurve",

                    className:
                        "lowerLipCurve",

                    stroke:
                        "#30ff70",

                    strokeWidth:
                        2

                }

            );

        }


        if (
            settings.showUpperProfilePoints
        ) {

            drawPointCollection(

                group,

                upperPoints,

                {

                    radius:
                        2,

                    fill:
                        "#ff3030",

                    className:
                        "upperLipProfilePoint"

                }

            );

        }


        if (
            settings.showLowerProfilePoints
        ) {

            drawPointCollection(

                group,

                lowerPoints,

                {

                    radius:
                        2,

                    fill:
                        "#30ff70",

                    className:
                        "lowerLipProfilePoint"

                }

            );

        }


        drawSeam(

            group,

            seamPoints

        );


        drawDebugGeometry(

            group,

            anatomySamples

        );


        if (settings.showLandmarks) {

            drawLandmarks(

                group,

                landmarks

            );

        }

    }


    /* ==========================
       UPDATE SETTINGS
    ========================== */

    function updateMouthEngineSettings(
        updates
    ) {

        window.mouthEngineSettings = {

            ...window.mouthEngineSettings,

            ...(updates || {})

        };


        drawMouthEngine();

    }


    /* ==========================
       RESET
    ========================== */

    function resetMouthEngine() {

        window.mouthEngineSettings = {

            ...defaultMouthEngineSettings

        };


        drawMouthEngine();

    }


    /* ==========================
       PUBLIC API
    ========================== */

    window.getMouthProfileSettings =
        getMouthProfileSettings;

    window.getMouthDirectionSettings =
        getMouthDirectionSettings;


    window.buildMouthLandmarks =
        buildMouthLandmarks;

    window.buildMouthSeam =
        buildMouthSeam;


    window.sampleMouthSeam =
        sampleMouthSeam;

    window.buildLipAnatomy =
        buildLipAnatomy;

    window.buildMouthSamples =
        buildMouthSamples;


    window.getSeamPoints =
        getSeamPoints;

    window.getUpperPoints =
        getUpperPoints;

    window.getLowerPoints =
        getLowerPoints;


    window.buildUpperLipPath =
        buildUpperLipPath;

    window.buildLowerLipPath =
        buildLowerLipPath;


    window.drawDebugGeometry =
        drawDebugGeometry;

    window.drawMouthEngine =
        drawMouthEngine;


    window.updateMouthEngineSettings =
        updateMouthEngineSettings;

    window.resetMouthEngine =
        resetMouthEngine;


    window.MouthEngine = {

        defaults:

            Object.freeze({

                ...defaultMouthEngineSettings

            }),

        getProfileSettings:
            getMouthProfileSettings,

        getDirectionSettings:
            getMouthDirectionSettings,

        buildLandmarks:
            buildMouthLandmarks,

        buildSeam:
            buildMouthSeam,

        sampleSeam:
            sampleMouthSeam,

        buildAnatomy:
            buildLipAnatomy,

        draw:
            drawMouthEngine,

        update:
            updateMouthEngineSettings,

        reset:
            resetMouthEngine

    };

})();


console.log(
    "mouthEngine.js V3 loaded"
);
