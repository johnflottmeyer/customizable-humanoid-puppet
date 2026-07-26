/* ==========================
   MOUTH ENGINE — VERSION 5.1

   Responsibilities:

   - Own mouth settings
   - Request geometry from MouthGeometry
   - Send geometry to MouthRenderer
   - Store the current mouth geometry
   - Expose geometry to MouthDebug
   - Refresh FaceInspector
   - Maintain compatibility functions

   Geometry is built by:
   mouthGeometry.js

   SVG is rendered by:
   mouthRenderer.js

   Bézier seam handles are built by:
   mouthBezierSpline.js
========================== */

(function () {
    "use strict";


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

        /*
            Retained for compatibility with
            the previous Spline system.
        */

        tension: 0.25,


        /* ==========================
           AUTOMATIC BÉZIER HANDLES
        ========================== */

        /*
            Overall length of the automatically
            generated seam handles.
        */

        seamHandleStrength: 0.27,


        /*
            Reduces handle length near the
            left and right mouth corners.
        */

        seamCornerHandleScale: 0.72,


        /*
            Controls handle length around the
            center seam landmark.
        */

        seamCenterHandleScale: 0.82,


        /*
            Prevents generated handles from
            becoming longer than their segment.
        */

        seamMaximumHandleRatio: 0.42,


        /* ==========================
           UPPER LIP
        ========================== */

        upperLipThickness: 6.5,

        cupidBowHeight: 3.2,
        cupidBowWidth: 0.16,

        philtrumDip: 2.4,
        upperCenterFullness: 0.5,

        upperAsymmetry: 0,


        /* ==========================
           LOWER LIP
        ========================== */

        lowerLipThickness: 8.5,

        lowerCenterFullness: 2.5,
        lowerLobeWidth: 0.34,

        lowerAsymmetry: 0,


        /* ==========================
           CORNERS
        ========================== */

        cornerTaper: 1.9,
        cornerThickness: 0.02,

        cornerInset: 0.04,
        cornerRoundness: 0.7,


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
        showSeam: true,


        /* ==========================
           SAMPLING
        ========================== */

        sampleCount: 40
    };


    /* ==========================
       GLOBAL SETTINGS
    ========================== */

    window.mouthEngineSettings = {

        ...defaultMouthEngineSettings,

        ...(window.mouthEngineSettings || {})
    };


    /* ==========================
       EMPTY GEOMETRY
    ========================== */

    function buildEmptyGeometry() {

        return {

            settings: {},

            /*
                Complete editable landmark
                collection returned by
                MouthLandmarks.
            */

            namedLandmarks: {},


            /*
                Five Point objects used as
                seam anchors.
            */

            landmarks: [],


            /*
                Bézier seam spline and its
                generated control handles.
            */

            seamSpline: null,
            seamHandles: [],


            /*
                Sampled geometry.
            */

            seamSamples: [],
            anatomySamples: [],
            surfaceSamples: [],


            /*
                Extracted border points.
            */

            upperPoints: [],
            lowerPoints: [],
            seamPoints: [],


            /*
                Completed SVG path data.
            */

            upperPath: "",
            lowerPath: "",
            seamPath: ""
        };
    }


    /* ==========================
       CURRENT GEOMETRY
    ========================== */

    let currentMouthGeometry =
        buildEmptyGeometry();


    /* ==========================
       DEPENDENCIES
    ========================== */

    function dependenciesAvailable() {

        const missing = [];


        if (
            !window.MouthGeometry ||
            typeof window.MouthGeometry.build !==
                "function"
        ) {

            missing.push("MouthGeometry");
        }


        if (
            !window.MouthRenderer ||
            typeof window.MouthRenderer.draw !==
                "function"
        ) {

            missing.push("MouthRenderer");
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
       COPY HELPERS
    ========================== */

    function cloneArray(value) {

        return Array.isArray(value)
            ? value.slice()
            : [];
    }


    /*
        Keep the actual Landmark objects.

        This deliberately copies only the
        collection container, not the landmarks
        inside it. FaceInspector must retain
        access to the editable Landmark objects.
    */

    function cloneLandmarkCollection(collection) {

        if (!collection) {
            return {};
        }


        if (collection instanceof Map) {

            return new Map(collection);
        }


        if (Array.isArray(collection)) {

            return collection.slice();
        }


        return {
            ...collection
        };
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
       BUILD COMPLETE GEOMETRY
    ========================== */

    function buildMouthGeometry(overrides) {

        if (
            !window.MouthGeometry ||
            typeof window.MouthGeometry.build !==
                "function"
        ) {

            console.error(
                "MouthEngine cannot build geometry because MouthGeometry is unavailable."
            );

            return buildEmptyGeometry();
        }


        return window.MouthGeometry.build(
            overrides || window.mouthEngineSettings
        );
    }


    /* ==========================
       BUILD LANDMARKS
    ========================== */

    function buildMouthLandmarks() {

        if (
            !window.MouthGeometry ||
            typeof window.MouthGeometry
                .buildNamedLandmarks !==
                "function"
        ) {

            return {};
        }


        return window.MouthGeometry
            .buildNamedLandmarks(
                window.mouthEngineSettings
            );
    }


    /* ==========================
       BUILD SEAM
    ========================== */

    function buildMouthSeam(
        seamControlPoints
    ) {

        if (
            !window.MouthGeometry ||
            typeof window.MouthGeometry
                .buildSeamSpline !==
                "function"
        ) {

            return null;
        }


        let points =
            seamControlPoints;


        if (
            !Array.isArray(points) ||
            points.length < 2
        ) {

            const namedLandmarks =
                buildMouthLandmarks();


            points =
                window.MouthGeometry
                    .buildSeamPoints(
                        namedLandmarks
                    );
        }


        return window.MouthGeometry
            .buildSeamSpline(
                points,
                window.mouthEngineSettings
            );
    }


    /* ==========================
       SAMPLE SEAM
    ========================== */

    function sampleMouthSeam(seamSpline) {

        if (
            !window.MouthGeometry ||
            typeof window.MouthGeometry
                .sampleSeam !==
                "function"
        ) {

            return [];
        }


        const spline =
            seamSpline ||
            buildMouthSeam();


        return window.MouthGeometry
            .sampleSeam(
                spline,
                window.mouthEngineSettings
            );
    }


    /* ==========================
       BUILD LIP ANATOMY
    ========================== */

    function buildLipAnatomy(seamSamples) {

        if (
            !window.MouthGeometry ||
            typeof window.MouthGeometry
                .buildAnatomy !==
                "function"
        ) {

            return [];
        }


        return window.MouthGeometry
            .buildAnatomy(
                seamSamples || [],
                window.mouthEngineSettings
            );
    }


    /* ==========================
       COMPATIBILITY SAMPLE BUILDER
    ========================== */

    function buildMouthSamples(seamSpline) {

        const seamSamples =
            sampleMouthSeam(
                seamSpline
            );


        return buildLipAnatomy(
            seamSamples
        );
    }


    /* ==========================
       DRAW MOUTH
    ========================== */

    function drawMouthEngine() {

        /*
            Confirm that both the geometry and
            renderer modules are available.
        */

        if (!dependenciesAvailable()) {

            currentMouthGeometry =
                buildEmptyGeometry();

            return currentMouthGeometry;
        }


        /*
            Build the newest geometry from the
            current global settings.
        */

        const geometry =
            buildMouthGeometry(
                window.mouthEngineSettings
            );


        /*
            Store geometry before rendering or
            refreshing external tools.

            MouthDebug and FaceInspector may
            request it during their refresh.
        */

        currentMouthGeometry =
            geometry ||
            buildEmptyGeometry();


        /*
            Draw the completed SVG path data.
        */

        window.MouthRenderer.draw(
            currentMouthGeometry,
            window.mouthEngineSettings
        );


        /*
            MouthDebug owns all diagnostic
            drawing.

            mouthDebug.js decides whether its
            display is enabled.
        */

        if (
            window.MouthDebug &&
            typeof window.MouthDebug.draw ===
                "function"
        ) {

            window.MouthDebug.draw();
        }


        /*
            FaceInspector.initialize() should
            run only once from app.js.

            Subsequent geometry changes use
            refresh().
        */

        if (
            window.FaceInspector &&
            typeof window.FaceInspector.refresh ===
                "function"
        ) {

            window.FaceInspector.refresh();
        }


        return currentMouthGeometry;
    }


    /* ==========================
       CURRENT COMPLETE GEOMETRY
    ========================== */

    function getCurrentGeometry() {

        return {

            settings:
                currentMouthGeometry.settings ||
                {},

            namedLandmarks:
                cloneLandmarkCollection(
                    currentMouthGeometry
                        .namedLandmarks
                ),

            landmarks:
                cloneArray(
                    currentMouthGeometry
                        .landmarks
                ),

            seamSpline:
                currentMouthGeometry
                    .seamSpline ||
                null,

            seamHandles:
                cloneArray(
                    currentMouthGeometry
                        .seamHandles
                ),

            seamSamples:
                cloneArray(
                    currentMouthGeometry
                        .seamSamples
                ),

            anatomySamples:
                cloneArray(
                    currentMouthGeometry
                        .anatomySamples
                ),

            surfaceSamples:
                cloneArray(
                    currentMouthGeometry
                        .surfaceSamples
                ),

            upperPoints:
                cloneArray(
                    currentMouthGeometry
                        .upperPoints
                ),

            lowerPoints:
                cloneArray(
                    currentMouthGeometry
                        .lowerPoints
                ),

            seamPoints:
                cloneArray(
                    currentMouthGeometry
                        .seamPoints
                ),

            upperPath:
                currentMouthGeometry
                    .upperPath ||
                "",

            lowerPath:
                currentMouthGeometry
                    .lowerPath ||
                "",

            seamPath:
                currentMouthGeometry
                    .seamPath ||
                ""
        };
    }


    /* ==========================
       INDIVIDUAL GETTERS
    ========================== */

    function getCurrentNamedLandmarks() {

        return cloneLandmarkCollection(
            currentMouthGeometry
                .namedLandmarks
        );
    }


    function getCurrentMouthLandmarks() {

        return cloneArray(
            currentMouthGeometry
                .landmarks
        );
    }


    function getCurrentMouthSeamSpline() {

        return (
            currentMouthGeometry
                .seamSpline ||
            null
        );
    }


    function getCurrentMouthSeamHandles() {

        return cloneArray(
            currentMouthGeometry
                .seamHandles
        );
    }


    function getCurrentMouthSeamSamples() {

        return cloneArray(
            currentMouthGeometry
                .seamSamples
        );
    }


    function getCurrentMouthSurfaceSamples() {

        /*
            Returns the complete anatomy samples.

            MouthDebug and FaceInspector should
            generally use this collection.
        */

        return cloneArray(
            currentMouthGeometry
                .anatomySamples
        );
    }


    function getCurrentTrimmedSurfaceSamples() {

        /*
            Returns only the samples used by the
            visible upper and lower lip surfaces.
        */

        return cloneArray(
            currentMouthGeometry
                .surfaceSamples
        );
    }


    function getCurrentUpperPoints() {

        return cloneArray(
            currentMouthGeometry
                .upperPoints
        );
    }


    function getCurrentLowerPoints() {

        return cloneArray(
            currentMouthGeometry
                .lowerPoints
        );
    }


    function getCurrentSeamPoints() {

        return cloneArray(
            currentMouthGeometry
                .seamPoints
        );
    }


    function getCurrentUpperPath() {

        return (
            currentMouthGeometry
                .upperPath ||
            ""
        );
    }


    function getCurrentLowerPath() {

        return (
            currentMouthGeometry
                .lowerPath ||
            ""
        );
    }


    function getCurrentSeamPath() {

        return (
            currentMouthGeometry
                .seamPath ||
            ""
        );
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


        return drawMouthEngine();
    }


    /* ==========================
       REPLACE SETTINGS
    ========================== */

    function setMouthEngineSettings(
        settings
    ) {

        window.mouthEngineSettings = {

            ...defaultMouthEngineSettings,

            ...(settings || {})
        };


        return drawMouthEngine();
    }


    /* ==========================
       RESET SETTINGS
    ========================== */

    function resetMouthEngine() {

        window.mouthEngineSettings = {

            ...defaultMouthEngineSettings
        };


        return drawMouthEngine();
    }


    /* ==========================
       REDRAW ALIAS
    ========================== */

    function refreshMouthEngine() {

        return drawMouthEngine();
    }


    /* ==========================
       GLOBAL COMPATIBILITY API
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


    window.buildMouthGeometry =
        buildMouthGeometry;


    window.getCurrentMouthGeometry =
        getCurrentGeometry;


    window.getCurrentNamedMouthLandmarks =
        getCurrentNamedLandmarks;


    window.getCurrentMouthLandmarks =
        getCurrentMouthLandmarks;


    window.getCurrentMouthSeamSpline =
        getCurrentMouthSeamSpline;


    window.getCurrentMouthSeamHandles =
        getCurrentMouthSeamHandles;


    window.getCurrentMouthSeamSamples =
        getCurrentMouthSeamSamples;


    window.getCurrentMouthSurfaceSamples =
        getCurrentMouthSurfaceSamples;


    window.getCurrentTrimmedMouthSurfaceSamples =
        getCurrentTrimmedSurfaceSamples;


    window.getCurrentUpperPoints =
        getCurrentUpperPoints;


    window.getCurrentLowerPoints =
        getCurrentLowerPoints;


    window.getCurrentSeamPoints =
        getCurrentSeamPoints;


    window.getCurrentUpperLipPath =
        getCurrentUpperPath;


    window.getCurrentLowerLipPath =
        getCurrentLowerPath;


    window.getCurrentMouthSeamPath =
        getCurrentSeamPath;


    /*
        Geometry helpers retained for existing
        MouthDebug and FaceInspector code.
    */

    window.getSeamPoints =
        function (samples) {

            return window.MouthGeometry
                .getSeamPoints(
                    samples
                );
        };


    window.getUpperPoints =
        function (samples) {

            return window.MouthGeometry
                .getUpperPoints(
                    samples
                );
        };


    window.getLowerPoints =
        function (samples) {

            return window.MouthGeometry
                .getLowerPoints(
                    samples
                );
        };


    window.getLipSurfaceSamples =
        function (samples) {

            return window.MouthGeometry
                .getSurfaceSamples(
                    samples,
                    window.mouthEngineSettings
                );
        };


    window.buildUpperLipPath =
        function (samples) {

            return window.MouthGeometry
                .buildUpperLipPath(
                    samples,
                    window.mouthEngineSettings
                );
        };


    window.buildLowerLipPath =
        function (samples) {

            return window.MouthGeometry
                .buildLowerLipPath(
                    samples,
                    window.mouthEngineSettings
                );
        };


    window.drawMouthEngine =
        drawMouthEngine;


    window.refreshMouthEngine =
        refreshMouthEngine;


    window.updateMouthEngineSettings =
        updateMouthEngineSettings;


    window.setMouthEngineSettings =
        setMouthEngineSettings;


    window.resetMouthEngine =
        resetMouthEngine;


    /* ==========================
       MOUTH ENGINE API
    ========================== */

    window.MouthEngine = {

        defaults:
            Object.freeze({
                ...defaultMouthEngineSettings
            }),


        /* Settings */

        getSettings:
            function () {

                return {
                    ...window.mouthEngineSettings
                };
            },

        getProfileSettings:
            getMouthProfileSettings,

        getDirectionSettings:
            getMouthDirectionSettings,

        update:
            updateMouthEngineSettings,

        set:
            setMouthEngineSettings,

        reset:
            resetMouthEngine,


        /* Geometry construction */

        buildLandmarks:
            buildMouthLandmarks,

        buildSeam:
            buildMouthSeam,

        sampleSeam:
            sampleMouthSeam,

        buildAnatomy:
            buildLipAnatomy,

        buildSamples:
            buildMouthSamples,

        build:
            buildMouthGeometry,


        /* Rendering */

        draw:
            drawMouthEngine,

        refresh:
            refreshMouthEngine,


        /* Complete geometry */

        getGeometry:
            getCurrentGeometry,


        /* Landmarks */

        getNamedLandmarks:
            getCurrentNamedLandmarks,

        getLandmarks:
            getCurrentMouthLandmarks,


        /* Seam */

        getSeamSpline:
            getCurrentMouthSeamSpline,

        getSeamHandles:
            getCurrentMouthSeamHandles,

        getSeamSamples:
            getCurrentMouthSeamSamples,

        getSeamPoints:
            getCurrentSeamPoints,

        getSeamPath:
            getCurrentSeamPath,


        /* Lip surfaces */

        getSurfaceSamples:
            getCurrentMouthSurfaceSamples,

        getTrimmedSurfaceSamples:
            getCurrentTrimmedSurfaceSamples,

        getUpperPoints:
            getCurrentUpperPoints,

        getLowerPoints:
            getCurrentLowerPoints,

        getUpperPath:
            getCurrentUpperPath,

        getLowerPath:
            getCurrentLowerPath
    };


    console.log(
        "mouthEngine.js V5.1 loaded"
    );

})();
