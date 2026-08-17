/* ==========================
   MOUTH GEOMETRY — VERSION 2.6

   Responsibilities:

   - Resolve mouth settings
   - Build editable landmarks
   - Build and sample the mouth seam
   - Calculate lip anatomy
   - Build upper and lower lip borders
   - Build SVG path data
   - Return a complete geometry object

   This file does not access the DOM.
   This file does not create SVG elements.
========================== */

(function () {
    "use strict";


    /* ==========================
       DEFAULT GEOMETRY SETTINGS
    ========================== */

    const defaultGeometrySettings = {

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
            the previous spline system.
        */

        tension: 0.25,


        /* ==========================
           BÉZIER SEAM HANDLES
        ========================== */

        seamHandleStrength: 0.27,
        seamCornerHandleScale: 0.72,
        seamCenterHandleScale: 0.82,
        seamMaximumHandleRatio: 0.42,


        /* ==========================
           UPPER LIP
        ========================== */

        upperLipThickness: 13,

        cupidBowHeight: 3.5,
        cupidBowWidth: 0.16,

        philtrumDip: 2.8,
        upperCenterFullness: 1.0,

        upperAsymmetry: 0,


        /* ==========================
           LOWER LIP
        ========================== */

        lowerLipThickness: 15,

        lowerCenterFullness: 3.1,
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
           SAMPLING
        ========================== */

        sampleCount: 40
    };


    /* ==========================
       DEPENDENCIES
    ========================== */

    function dependenciesAvailable() {

        const missing = [];


        if (!window.Point) {

            missing.push("Point");
        }


        /*
            The old window.Spline dependency
            has been replaced by the new cubic
            Bézier seam implementation.
        */

        if (
            !window.MouthBezierSpline ||
            typeof window.MouthBezierSpline.create !==
                "function"
        ) {

            missing.push("MouthBezierSpline");
        }


        if (!window.PathBuilder) {

            missing.push("PathBuilder");
        }


        if (
            !window.MouthLandmarks ||
            typeof window.MouthLandmarks.build !==
                "function"
        ) {

            missing.push("MouthLandmarks");
        }


        if (
            !window.MouthProfiles ||
            typeof window.MouthProfiles.sample !==
                "function"
        ) {

            missing.push("MouthProfiles");
        }


        if (
            !window.MouthDirections ||
            typeof window.MouthDirections.sample !==
                "function"
        ) {

            missing.push("MouthDirections");
        }


        if (
            !window.MouthPads ||
            typeof window.MouthPads.sample !==
                "function"
        ) {

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


    function clamp(
        value,
        minimum,
        maximum
    ) {

        return Math.max(
            minimum,
            Math.min(maximum, value)
        );
    }


    function clamp01(value) {

        return clamp(value, 0, 1);
    }


    function mix(
        start,
        end,
        amount
    ) {

        return start +
            (end - start) * amount;
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


    function movePoint(
        point,
        direction,
        distance
    ) {

        return createPoint(

            point.x +
                direction.x * distance,

            point.y +
                direction.y * distance
        );
    }


    function mixPoints(
        first,
        second,
        amount
    ) {

        const blend =
            clamp01(amount);


        return createPoint(

            mix(
                first.x,
                second.x,
                blend
            ),

            mix(
                first.y,
                second.y,
                blend
            )
        );
    }


    function formatPoint(point) {

        return [

            safeNumber(point.x, 0),

            safeNumber(point.y, 0)

        ].join(" ");
    }


    /* ==========================
       EMPTY GEOMETRY
    ========================== */

    function buildEmptyGeometry(settings) {

        return {

            settings:
                settings || {},

            namedLandmarks: {},
            landmarks: [],

            seamSpline: null,
            seamHandles: [],

            seamSamples: [],
            anatomySamples: [],
            surfaceSamples: [],

            upperPoints: [],
            lowerPoints: [],
            seamPoints: [],

            upperPath: "",
            lowerPath: "",
            seamPath: ""
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
            typeof window.MouthLandmarks.build !==
                "function"
        ) {

            console.error(
                "MouthGeometry requires MouthLandmarks.build()."
            );

            return {};
        }


        return (
            window.MouthLandmarks.build(
                settings
            ) ||
            {}
        );
    }


    function collectionToArray(collection) {

        if (!collection) {

            return [];
        }


        if (Array.isArray(collection)) {

            return collection.filter(Boolean);
        }


        if (collection instanceof Map) {

            return Array
                .from(collection.values())
                .filter(Boolean);
        }


        return Object
            .keys(collection)

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


    function findLandmark(
        collection,
        possibleIds
    ) {

        if (!collection) {

            return null;
        }


        for (
            let index = 0;
            index < possibleIds.length;
            index += 1
        ) {

            const id =
                possibleIds[index];


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
            landmarks.find(
                function (landmark) {

                    const id =
                        getLandmarkId(landmark);


                    return possibleIds.includes(id);
                }
            ) ||
            null
        );
    }


    function landmarkToPoint(landmark) {

        if (!landmark) {

            return null;
        }


        if (
            typeof landmark.toPoint ===
            "function"
        ) {

            const point =
                landmark.toPoint();


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
    ========================== */

    function buildSeamPoints(
        namedLandmarks
    ) {

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


        if (
            seamLandmarks.some(
                function (landmark) {

                    return !landmark;
                }
            )
        ) {

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
                        rightCorner
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


        if (
            !window.MouthBezierSpline ||
            typeof window.MouthBezierSpline.create !==
                "function"
        ) {

            console.error(
                "MouthGeometry requires MouthBezierSpline.create()."
            );

            return null;
        }


        return window.MouthBezierSpline.create(

            seamControlPoints,

            {
                handleStrength:
                    safeNumber(
                        settings.seamHandleStrength,
                        defaultGeometrySettings
                            .seamHandleStrength
                    ),

                cornerHandleScale:
                    safeNumber(
                        settings.seamCornerHandleScale,
                        defaultGeometrySettings
                            .seamCornerHandleScale
                    ),

                centerHandleScale:
                    safeNumber(
                        settings.seamCenterHandleScale,
                        defaultGeometrySettings
                            .seamCenterHandleScale
                    ),

                maximumHandleRatio:
                    safeNumber(
                        settings.seamMaximumHandleRatio,
                        defaultGeometrySettings
                            .seamMaximumHandleRatio
                    )
            }
        );
    }


    /* ==========================
       SEAM HANDLES
    ========================== */

    function getSeamHandles(seamSpline) {

        if (!seamSpline) {

            return [];
        }


        /*
            Preferred public API from
            mouthBezierSpline.js.
        */

        if (
            typeof seamSpline.getHandles ===
            "function"
        ) {

            const handles =
                seamSpline.getHandles();


            return Array.isArray(handles)
                ? handles
                : [];
        }


        /*
            Compatibility fallback.

            If a spline exposes its segments but
            not getHandles(), extract the two
            control points from each segment.
        */

        let segments = [];


        if (
            typeof seamSpline.getSegments ===
            "function"
        ) {

            segments =
                seamSpline.getSegments();
        } else if (
            Array.isArray(seamSpline.segments)
        ) {

            segments =
                seamSpline.segments;
        }


        if (!Array.isArray(segments)) {

            return [];
        }


        const handles = [];


        segments.forEach(
            function (segment, segmentIndex) {

                if (!segment) {

                    return;
                }


                if (segment.control1) {

                    handles.push({
                        segmentIndex:
                            segmentIndex,

                        type:
                            "outgoing",

                        point:
                            segment.control1,

                        x:
                            segment.control1.x,

                        y:
                            segment.control1.y
                    });
                }


                if (segment.control2) {

                    handles.push({
                        segmentIndex:
                            segmentIndex,

                        type:
                            "incoming",

                        point:
                            segment.control2,

                        x:
                            segment.control2.x,

                        y:
                            segment.control2.y
                    });
                }
            }
        );


        return handles;
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


        if (
            typeof seamSpline.getPoint !==
                "function" ||
            typeof seamSpline.getTangent !==
                "function" ||
            typeof seamSpline.getNormal !==
                "function"
        ) {

            console.error(
                "MouthGeometry received an invalid seam spline."
            );

            return [];
        }


        const sampleCount =
            Math.max(

                8,

                Math.floor(
                    safeNumber(
                        settings.sampleCount,
                        defaultGeometrySettings
                            .sampleCount
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


                /*
                    V2.5 — DIRECT THICKNESS MODEL

                    MouthProfiles now owns the primary visible
                    upper/lower lip height.

                    This means:

                        upperLipThickness
                        lowerLipThickness

                    directly affect the visible lip depth instead
                    of first being converted into a secondary scale.

                    MouthPads remain present, but only as a small
                    soft-tissue contour layer.

                    The previous V2.4 hard-coded Gaussian lobe
                    shaping has been removed from MouthGeometry.
                    Upper/lower silhouette anatomy now belongs in
                    mouthProfiles.js, where it can be tuned cleanly
                    without fighting the geometry engine.
                */


                const upperPadContour =
                    pads.upperHeight *
                    0.08;


                const lowerPadContour =
                    pads.lowerHeight *
                    0.06;


                let upperHeight =
                    profile.upperHeight +
                    upperPadContour;


                let lowerHeight =
                    profile.lowerHeight +
                    lowerPadContour;


                /*
                    Preserve a little breathing room at the
                    absolute corners.

                    profile.cornerWeight already provides the
                    main anatomical taper; these limits simply
                    prevent accidental negative or extreme values.
                */


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
                    defaultGeometrySettings
                        .cornerInset
                ),

                0,

                0.22
            );


        const maximumTrim =
            Math.max(

                0,

                Math.floor(
                    (
                        anatomySamples.length -
                        3
                    ) /
                    2
                )
            );


        const trimCount =
            clamp(

                Math.round(
                    (
                        anatomySamples.length -
                        1
                    ) *
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

            anatomySamples.length -
                trimCount
        );
    }


    /* ==========================
       OPEN POINT PATH
    ========================== */

    function buildOpenPointPath(points) {

        if (
            !Array.isArray(points) ||
            points.length === 0
        ) {

            return "";
        }


        const builder =
            new window.PathBuilder();


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
       ROUNDED LIP SURFACE PATH
    ========================== */

    function buildRoundedLipSurfacePath(
        samples,
        borderProperty,
        borderFirst,
        settings
    ) {

        if (
            !Array.isArray(samples) ||
            samples.length < 2
        ) {

            return "";
        }


        const surfaceSamples =
            getSurfaceSamples(
                samples,
                settings
            );


        if (surfaceSamples.length < 2) {

            return "";
        }


        const roundness =
            clamp01(
                safeNumber(
                    settings.cornerRoundness,
                    defaultGeometrySettings
                        .cornerRoundness
                )
            );


        const fullLeftCorner =
            samples[0].seamPoint;


        const fullRightCorner =
            samples[
                samples.length - 1
            ].seamPoint;


        const leftSample =
            surfaceSamples[0];


        const rightSample =
            surfaceSamples[
                surfaceSamples.length - 1
            ];


        const leftBorder =
            leftSample[
                borderProperty
            ];


        const rightBorder =
            rightSample[
                borderProperty
            ];


        const leftSeam =
            leftSample.seamPoint;


        const rightSeam =
            rightSample.seamPoint;


        const rightControl =
            mixPoints(
                rightSeam,
                fullRightCorner,
                roundness
            );


        const leftControl =
            mixPoints(
                leftSeam,
                fullLeftCorner,
                roundness
            );


        const commands = [];


        if (borderFirst) {

            commands.push(
                "M " +
                formatPoint(leftBorder)
            );


            for (
                let index = 1;
                index < surfaceSamples.length;
                index += 1
            ) {

                commands.push(

                    "L " +

                    formatPoint(
                        surfaceSamples[index][
                            borderProperty
                        ]
                    )
                );
            }


            commands.push(

                "Q " +

                formatPoint(
                    rightControl
                ) +

                " " +

                formatPoint(
                    rightSeam
                )
            );


            for (
                let index =
                    surfaceSamples.length - 2;

                index >= 0;

                index -= 1
            ) {

                commands.push(

                    "L " +

                    formatPoint(
                        surfaceSamples[index]
                            .seamPoint
                    )
                );
            }


            commands.push(

                "Q " +

                formatPoint(
                    leftControl
                ) +

                " " +

                formatPoint(
                    leftBorder
                )
            );

        } else {

            commands.push(
                "M " +
                formatPoint(leftSeam)
            );


            for (
                let index = 1;
                index < surfaceSamples.length;
                index += 1
            ) {

                commands.push(

                    "L " +

                    formatPoint(
                        surfaceSamples[index]
                            .seamPoint
                    )
                );
            }


            commands.push(

                "Q " +

                formatPoint(
                    rightControl
                ) +

                " " +

                formatPoint(
                    rightBorder
                )
            );


            for (
                let index =
                    surfaceSamples.length - 2;

                index >= 0;

                index -= 1
            ) {

                commands.push(

                    "L " +

                    formatPoint(
                        surfaceSamples[index][
                            borderProperty
                        ]
                    )
                );
            }


            commands.push(

                "Q " +

                formatPoint(
                    leftControl
                ) +

                " " +

                formatPoint(
                    leftSeam
                )
            );
        }


        commands.push("Z");


        return commands.join(" ");
    }


    function buildUpperLipPath(
        samples,
        settings
    ) {

        return buildRoundedLipSurfacePath(

            samples,

            "upperBorder",

            true,

            settings
        );
    }


    function buildLowerLipPath(
        samples,
        settings
    ) {

        return buildRoundedLipSurfacePath(

            samples,

            "lowerBorder",

            false,

            settings
        );
    }


    function buildSeamPath(seamPoints) {

        return buildOpenPointPath(
            seamPoints
        );
    }


    /* ==========================
       COMPLETE BUILD
    ========================== */

    function build(overrides) {

        const settings =
            resolveSettings(overrides);


        if (!dependenciesAvailable()) {

            return buildEmptyGeometry(
                settings
            );
        }


        const namedLandmarks =
            buildNamedLandmarks(
                settings
            );


        const landmarks =
            buildSeamPoints(
                namedLandmarks
            );


        if (landmarks.length !== 5) {

            const emptyGeometry =
                buildEmptyGeometry(
                    settings
                );


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
                buildEmptyGeometry(
                    settings
                );


            emptyGeometry.namedLandmarks =
                namedLandmarks;


            emptyGeometry.landmarks =
                landmarks;


            return emptyGeometry;
        }


        /*
            Extract and store the eight hidden
            cubic Bézier control handles.

            Four segments × two controls.
        */

        const seamHandles =
            getSeamHandles(
                seamSpline
            );


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


        const upperPoints =
            getUpperPoints(
                anatomySamples
            );


        const lowerPoints =
            getLowerPoints(
                anatomySamples
            );


        const seamPoints =
            getSeamPoints(
                anatomySamples
            );


        const upperPath =
            buildUpperLipPath(
                anatomySamples,
                settings
            );


        const lowerPath =
            buildLowerLipPath(
                anatomySamples,
                settings
            );


        /*
            Keep the visible seam inside the same
            corner inset used by the lip surfaces.
            This removes the exposed horizontal line
            that previously extended beyond the lips.
        */

        const visibleSeamPoints =
            getSeamPoints(
                surfaceSamples
            );


        const seamPath =
            buildSeamPath(
                visibleSeamPoints
            );


        return {

            settings:
                settings,

            namedLandmarks:
                namedLandmarks,

            landmarks:
                landmarks,

            seamSpline:
                seamSpline,

            seamHandles:
                seamHandles,

            seamSamples:
                seamSamples,

            anatomySamples:
                anatomySamples,

            surfaceSamples:
                surfaceSamples,

            upperPoints:
                upperPoints,

            lowerPoints:
                lowerPoints,

            seamPoints:
                seamPoints,

            upperPath:
                upperPath,

            lowerPath:
                lowerPath,

            seamPath:
                seamPath
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


        getSeamHandles:
            getSeamHandles,


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


        buildOpenPointPath:
            buildOpenPointPath,


        buildUpperLipPath:
            buildUpperLipPath,


        buildLowerLipPath:
            buildLowerLipPath,


        buildSeamPath:
            buildSeamPath,


        mixPoints:
            mixPoints
    };


    console.log(
        "mouthGeometry.js V2.6 loaded"
    );

})();
