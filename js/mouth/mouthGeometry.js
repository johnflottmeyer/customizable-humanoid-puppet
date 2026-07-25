/* ==========================
   MOUTH GEOMETRY — VERSION 1.1

   Responsibilities:

   - Obtain editable mouth landmarks
   - Convert seam landmarks into spline points
   - Build the mouth seam spline
   - Sample the seam
   - Apply mouth profiles
   - Apply mouth tissue pads
   - Calculate upper and lower borders
   - Return completed mouth geometry

   This file performs no SVG or DOM work.
========================== */

(function () {
    "use strict";

    /* ==========================
       DEFAULT GEOMETRY SETTINGS
    ========================== */

    const defaultGeometrySettings = {
        centerX: 250,
        centerY: 381,

        width: 150,

        cornerY: 0,
        peakY: -1.5,
        cupidY: -0.5,

        tension: 0.25,

        upperLipThickness: 6.5,
        lowerLipThickness: 8.5,

        cupidBowHeight: 3.2,
        cupidBowWidth: 0.16,

        philtrumDip: 2.4,

        upperCenterFullness: 0.5,
        lowerCenterFullness: 2.5,
        lowerLobeWidth: 0.34,

        upperAsymmetry: 0,
        lowerAsymmetry: 0,

        cornerTaper: 1.9,
        cornerThickness: 0.02,

        cornerInset: 0.04,
        cornerRoundness: 0.7,

        upperVerticalBias: 0.88,
        lowerVerticalBias: 0.94,

        upperCornerFlare: 0.34,
        lowerCornerFlare: 0.18,

        cornerFlareWidth: 0.28,

        smile: 0,

        upperExpressionStrength: 0.28,
        lowerExpressionStrength: 0.18,

        directionAsymmetry: 0,

        sampleCount: 40
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

        if (!window.MouthLandmarks) {
            missing.push("MouthLandmarks");
        }

        if (!window.MouthProfiles) {
            missing.push("MouthProfiles");
        }

        if (!window.MouthDirections) {
            missing.push("MouthDirections");
        }

        if (!window.MouthPads) {
            missing.push("MouthPads");
        }

        if (missing.length > 0) {

            console.error(
                "mouthGeometry.js is missing dependencies:",
                missing.join(", ")
            );

            return false;
        }

        return true;
    }


    /* ==========================
       NUMBER HELPERS
    ========================== */

    function safeNumber(value, fallback) {

        const number = Number(value);

        return Number.isFinite(number)
            ? number
            : fallback;
    }


    function clamp(value, minimum, maximum) {

        return Math.max(
            minimum,
            Math.min(maximum, value)
        );
    }


    function clamp01(value) {

        return clamp(value, 0, 1);
    }


    function mix(start, end, amount) {

        return start + ((end - start) * amount);
    }


    /* ==========================
       POINT HELPERS
    ========================== */

    function createPoint(x, y) {

        return new window.Point(
            safeNumber(x, 0),
            safeNumber(y, 0)
        );
    }


    function movePoint(point, direction, distance) {

        return createPoint(
            point.x + (direction.x * distance),
            point.y + (direction.y * distance)
        );
    }


    function mixPoints(first, second, amount) {

        const blend = clamp01(amount);

        return createPoint(
            mix(first.x, second.x, blend),
            mix(first.y, second.y, blend)
        );
    }


    /* ==========================
       EMPTY GEOMETRY
    ========================== */

    function buildEmptyGeometry() {

        return {
            settings: {},
            namedLandmarks: {},
            landmarks: [],

            seamSpline: null,

            seamSamples: [],
            anatomySamples: [],
            surfaceSamples: [],

            upperPoints: [],
            lowerPoints: [],
            seamPoints: []
        };
    }


    /* ==========================
       SETTINGS
    ========================== */

    function resolveSettings(overrides) {

        return {
            ...defaultGeometrySettings,
            ...(window.mouthEngineSettings || {}),
            ...(overrides || {})
        };
    }


    function getProfileSettings(settings) {

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


    function getDirectionSettings(settings) {

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
       LANDMARK COLLECTION
    ========================== */

    function buildNamedLandmarks(settings) {

        if (
            !window.MouthLandmarks ||
            typeof window.MouthLandmarks.build !== "function"
        ) {

            console.error(
                "MouthGeometry requires MouthLandmarks.build()."
            );

            return {};
        }

        return window.MouthLandmarks.build(settings) || {};
    }


    function collectionToArray(collection) {

        if (!collection) {
            return [];
        }

        if (Array.isArray(collection)) {
            return collection.filter(Boolean);
        }

        if (collection instanceof Map) {

            return Array.from(
                collection.values()
            ).filter(Boolean);
        }

        return Object.keys(collection)
            .map(function (key) {
                return collection[key];
            })
            .filter(Boolean);
    }


    function getLandmarkId(landmark) {

        if (!landmark) {
            return "";
        }

        return (
            landmark.id ||
            landmark.name ||
            landmark.key ||
            landmark.label ||
            ""
        );
    }


    function findLandmark(collection, possibleIds) {

        if (!collection) {
            return null;
        }

        for (
            let index = 0;
            index < possibleIds.length;
            index += 1
        ) {

            const id = possibleIds[index];

            if (
                collection instanceof Map &&
                collection.has(id)
            ) {

                return collection.get(id);
            }

            if (
                !Array.isArray(collection) &&
                collection[id]
            ) {

                return collection[id];
            }
        }

        const landmarks =
            collectionToArray(collection);

        return (
            landmarks.find(function (landmark) {

                const landmarkId =
                    getLandmarkId(landmark);

                return possibleIds.includes(
                    landmarkId
                );

            }) || null
        );
    }


    function landmarkToPoint(landmark) {

        if (!landmark) {
            return null;
        }

        if (
            typeof landmark.toPoint === "function"
        ) {

            const point = landmark.toPoint();

            if (point) {

                return createPoint(
                    point.x,
                    point.y
                );
            }
        }

        return createPoint(
            landmark.x,
            landmark.y
        );
    }


    /* ==========================
       SEAM CONTROL POINTS

       The seam uses only dedicated
       seam landmarks.

       Upper lip peaks are not used
       as seam control points.
    ========================== */

    function buildSeamPoints(namedLandmarks) {

        const leftCorner =
            findLandmark(
                namedLandmarks,
                [
                    "leftCorner",
                    "mouthLeftCorner"
                ]
            );


        const seamLeftCenter =
            findLandmark(
                namedLandmarks,
                [
                    "seamLeftCenter"
                ]
            );


        const seamCenter =
            findLandmark(
                namedLandmarks,
                [
                    "seamCenter"
                ]
            );


        const seamRightCenter =
            findLandmark(
                namedLandmarks,
                [
                    "seamRightCenter"
                ]
            );


        const rightCorner =
            findLandmark(
                namedLandmarks,
                [
                    "rightCorner",
                    "mouthRightCorner"
                ]
            );


        const seamLandmarks = [
            leftCorner,
            seamLeftCenter,
            seamCenter,
            seamRightCenter,
            rightCorner
        ];


        const missingLandmarks =
            seamLandmarks.filter(function (landmark) {
                return !landmark;
            });


        if (missingLandmarks.length > 0) {

            console.error(
                "MouthGeometry could not resolve all five seam landmarks.",
                {
                    leftCorner:
                        leftCorner,

                    seamLeftCenter:
                        seamLeftCenter,

                    seamCenter:
                        seamCenter,

                    seamRightCenter:
                        seamRightCenter,

                    rightCorner:
                        rightCorner,

                    namedLandmarks:
                        namedLandmarks
                }
            );

            return [];
        }


        return seamLandmarks
            .map(landmarkToPoint)
            .filter(Boolean);
    }


    /* ==========================
       SEAM SPLINE
    ========================== */

    function buildSeamSpline(
        seamControlPoints,
        settings
    ) {

        if (
            !Array.isArray(seamControlPoints) ||
            seamControlPoints.length < 2
        ) {

            return null;
        }

        return window.Spline.fromPoints(
            seamControlPoints,

            safeNumber(
                settings.tension,
                defaultGeometrySettings.tension
            )
        );
    }


    /* ==========================
       SAMPLE SEAM
    ========================== */

    function sampleSeam(
        seamSpline,
        settings
    ) {

        if (!seamSpline) {
            return [];
        }

        const sampleCount =
            Math.max(
                8,

                Math.floor(
                    safeNumber(
                        settings.sampleCount,
                        defaultGeometrySettings.sampleCount
                    )
                )
            );


        const samples = [];


        for (
            let index = 0;
            index <= sampleCount;
            index += 1
        ) {

            const t =
                index / sampleCount;


            samples.push({
                t: t,

                seamPoint:
                    seamSpline.getPoint(t),

                seamTangent:
                    seamSpline.getTangent(t),

                seamNormal:
                    seamSpline.getNormal(t)
            });
        }


        return samples;
    }


    /* ==========================
       LIP ANATOMY
    ========================== */

    function buildAnatomy(
        seamSamples,
        settings
    ) {

        if (!Array.isArray(seamSamples)) {
            return [];
        }


        const profileSettings =
            getProfileSettings(settings);


        const directionSettings =
            getDirectionSettings(settings);


        const defaultUpperThickness = 6.5;
        const defaultLowerThickness = 7.2;


        const upperThickness =
            safeNumber(
                settings.upperLipThickness,
                defaultUpperThickness
            );


        const lowerThickness =
            safeNumber(
                settings.lowerLipThickness,
                defaultLowerThickness
            );


        const upperThicknessScale =
            clamp(
                upperThickness /
                    defaultUpperThickness,
                0,
                4
            );


        const lowerThicknessScale =
            clamp(
                lowerThickness /
                    defaultLowerThickness,
                0,
                4
            );


        const cupidBowHeight =
            safeNumber(
                settings.cupidBowHeight,
                2.5
            );


        const philtrumDip =
            safeNumber(
                settings.philtrumDip,
                1.5
            );


        const upperCenterFullness =
            safeNumber(
                settings.upperCenterFullness,
                0
            );


        const lowerCenterFullness =
            safeNumber(
                settings.lowerCenterFullness,
                1.8
            );


        return seamSamples.map(
            function (seamSample) {

                const profile =
                    window.MouthProfiles.sample(
                        seamSample.t,
                        profileSettings
                    );


                const pads =
                    window.MouthPads.sample(
                        seamSample.t
                    );


                const directions =
                    window.MouthDirections.sample(
                        seamSample.t,
                        seamSample.seamTangent,
                        seamSample.seamNormal,
                        directionSettings
                    );


                let upperHeight =
                    pads.upperHeight *
                    upperThicknessScale;


                let lowerHeight =
                    pads.lowerHeight *
                    lowerThicknessScale;


                upperHeight +=
                    profile.cupidWeight *
                    cupidBowHeight *
                    0.45;


                upperHeight -=
                    profile.philtrumWeight *
                    philtrumDip *
                    0.4;


                upperHeight +=
                    directions.centerWeight *
                    upperCenterFullness *
                    0.25;


                lowerHeight +=
                    profile.lowerLobeWeight *
                    lowerCenterFullness *
                    0.4;


                upperHeight =
                    clamp(
                        upperHeight,
                        0,
                        30
                    );


                lowerHeight =
                    clamp(
                        lowerHeight,
                        0,
                        35
                    );


                const upperBorder =
                    movePoint(
                        seamSample.seamPoint,
                        directions.upper,
                        upperHeight
                    );


                const lowerBorder =
                    movePoint(
                        seamSample.seamPoint,
                        directions.lower,
                        lowerHeight
                    );


                return {
                    t:
                        seamSample.t,

                    seamPoint:
                        seamSample.seamPoint,

                    seamTangent:
                        seamSample.seamTangent,

                    seamNormal:
                        seamSample.seamNormal,

                    upperDirection:
                        directions.upper,

                    lowerDirection:
                        directions.lower,

                    upperHeight:
                        upperHeight,

                    lowerHeight:
                        lowerHeight,

                    upperPads:
                        pads.upper,

                    lowerPads:
                        pads.lower,

                    upperBorder:
                        upperBorder,

                    lowerBorder:
                        lowerBorder,

                    cornerWeight:
                        profile.cornerWeight,

                    cupidWeight:
                        profile.cupidWeight,

                    philtrumWeight:
                        profile.philtrumWeight,

                    lowerLobeWeight:
                        profile.lowerLobeWeight,

                    directionCornerWeight:
                        directions.cornerWeight,

                    directionCenterWeight:
                        directions.centerWeight
                };
            }
        );
    }


    /* ==========================
       POINT COLLECTION
    ========================== */

    function collectPoints(
        samples,
        propertyName
    ) {

        if (!Array.isArray(samples)) {
            return [];
        }

        return samples
            .map(function (sample) {
                return sample[propertyName];
            })
            .filter(Boolean);
    }


    function getSeamPoints(samples) {

        return collectPoints(
            samples,
            "seamPoint"
        );
    }


    function getUpperPoints(samples) {

        return collectPoints(
            samples,
            "upperBorder"
        );
    }


    function getLowerPoints(samples) {

        return collectPoints(
            samples,
            "lowerBorder"
        );
    }


    /* ==========================
       SURFACE CORNER INSET
    ========================== */

    function getSurfaceSamples(
        anatomySamples,
        settings
    ) {

        if (!Array.isArray(anatomySamples)) {
            return [];
        }


        if (anatomySamples.length <= 4) {
            return anatomySamples.slice();
        }


        const inset =
            clamp(
                safeNumber(
                    settings.cornerInset,
                    defaultGeometrySettings.cornerInset
                ),
                0,
                0.22
            );


        const maximumTrim =
            Math.max(
                0,

                Math.floor(
                    (anatomySamples.length - 3) /
                    2
                )
            );


        const trimCount =
            clamp(
                Math.round(
                    (anatomySamples.length - 1) *
                    inset
                ),
                0,
                maximumTrim
            );


        if (trimCount === 0) {
            return anatomySamples.slice();
        }


        return anatomySamples.slice(
            trimCount,
            anatomySamples.length - trimCount
        );
    }


    /* ==========================
       COMPLETE GEOMETRY BUILD
    ========================== */

    function build(overrides) {

        if (!dependenciesAvailable()) {
            return buildEmptyGeometry();
        }


        const settings =
            resolveSettings(overrides);


        const namedLandmarks =
            buildNamedLandmarks(settings);


        const landmarks =
            buildSeamPoints(
                namedLandmarks
            );


        if (landmarks.length !== 5) {

            const emptyGeometry =
                buildEmptyGeometry();

            emptyGeometry.settings =
                settings;

            emptyGeometry.namedLandmarks =
                namedLandmarks;

            return emptyGeometry;
        }


        const seamSpline =
            buildSeamSpline(
                landmarks,
                settings
            );


        if (!seamSpline) {

            const emptyGeometry =
                buildEmptyGeometry();

            emptyGeometry.settings =
                settings;

            emptyGeometry.namedLandmarks =
                namedLandmarks;

            emptyGeometry.landmarks =
                landmarks;

            return emptyGeometry;
        }


        const seamSamples =
            sampleSeam(
                seamSpline,
                settings
            );


        const anatomySamples =
            buildAnatomy(
                seamSamples,
                settings
            );


        const surfaceSamples =
            getSurfaceSamples(
                anatomySamples,
                settings
            );


        return {
            settings:
                settings,

            /*
                Actual editable Landmark
                objects from mouthLandmarks.js
            */

            namedLandmarks:
                namedLandmarks,

            /*
                Five Point instances used
                to construct the seam spline.
            */

            landmarks:
                landmarks,

            seamSpline:
                seamSpline,

            seamSamples:
                seamSamples,

            anatomySamples:
                anatomySamples,

            surfaceSamples:
                surfaceSamples,

            upperPoints:
                getUpperPoints(
                    anatomySamples
                ),

            lowerPoints:
                getLowerPoints(
                    anatomySamples
                ),

            seamPoints:
                getSeamPoints(
                    anatomySamples
                )
        };
    }


    /* ==========================
       PUBLIC API
    ========================== */

    window.MouthGeometry = {

        defaults:
            Object.freeze({
                ...defaultGeometrySettings
            }),

        build:
            build,

        resolveSettings:
            resolveSettings,

        buildNamedLandmarks:
            buildNamedLandmarks,

        buildSeamPoints:
            buildSeamPoints,

        buildSeamSpline:
            buildSeamSpline,

        sampleSeam:
            sampleSeam,

        buildAnatomy:
            buildAnatomy,

        getSurfaceSamples:
            getSurfaceSamples,

        getSeamPoints:
            getSeamPoints,

        getUpperPoints:
            getUpperPoints,

        getLowerPoints:
            getLowerPoints,

        mixPoints:
            mixPoints
    };


    console.log(
        "mouthGeometry.js V1.1 loaded"
    );

})();
