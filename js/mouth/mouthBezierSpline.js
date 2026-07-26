/* ==========================
   MOUTH BÉZIER SPLINE — VERSION 1.0

   Responsibilities:

   - Convert seam landmarks into cubic
     Bézier segments
   - Generate hidden automatic handles
   - Sample points, tangents and normals
   - Preserve the existing spline-style API

   The visible landmarks remain unchanged.
   Handles are derived automatically.
========================== */

(function () {
    "use strict";


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


    /* ==========================
       POINT HELPERS
    ========================== */

    function createPoint(x, y) {

        return new window.Point(
            safeNumber(x, 0),
            safeNumber(y, 0)
        );
    }


    function clonePoint(point) {

        return createPoint(
            point ? point.x : 0,
            point ? point.y : 0
        );
    }


    function addPoints(first, second) {

        return createPoint(
            first.x + second.x,
            first.y + second.y
        );
    }


    function subtractPoints(first, second) {

        return createPoint(
            first.x - second.x,
            first.y - second.y
        );
    }


    function scalePoint(point, amount) {

        return createPoint(
            point.x * amount,
            point.y * amount
        );
    }


    function pointLength(point) {

        return Math.sqrt(
            (point.x * point.x) +
            (point.y * point.y)
        );
    }


    function normalizePoint(point) {

        const length =
            pointLength(point);


        if (length <= 0.000001) {

            return createPoint(1, 0);
        }


        return createPoint(
            point.x / length,
            point.y / length
        );
    }


    /* ==========================
       CUBIC BÉZIER
    ========================== */

    function cubicPoint(
        start,
        control1,
        control2,
        end,
        t
    ) {

        const inverse =
            1 - t;


        const inverseSquared =
            inverse * inverse;


        const tSquared =
            t * t;


        return createPoint(

            (inverseSquared * inverse * start.x) +

            (3 * inverseSquared * t * control1.x) +

            (3 * inverse * tSquared * control2.x) +

            (tSquared * t * end.x),

            (inverseSquared * inverse * start.y) +

            (3 * inverseSquared * t * control1.y) +

            (3 * inverse * tSquared * control2.y) +

            (tSquared * t * end.y)
        );
    }


    function cubicDerivative(
        start,
        control1,
        control2,
        end,
        t
    ) {

        const inverse =
            1 - t;


        return createPoint(

            (3 * inverse * inverse *
                (control1.x - start.x)) +

            (6 * inverse * t *
                (control2.x - control1.x)) +

            (3 * t * t *
                (end.x - control2.x)),

            (3 * inverse * inverse *
                (control1.y - start.y)) +

            (6 * inverse * t *
                (control2.y - control1.y)) +

            (3 * t * t *
                (end.y - control2.y))
        );
    }


    /* ==========================
       AUTOMATIC HANDLE SETTINGS
    ========================== */

    const defaultSettings = {

        /*
            Overall handle length.

            Lower values create a tighter seam.
            Higher values create a softer,
            more flowing seam.
        */

        handleStrength: 0.27,


        /*
            Allows the outer sections to flatten
            as they approach the mouth corners.
        */

        cornerHandleScale: 0.72,


        /*
            Strength applied around the center
            of the cupid seam.
        */

        centerHandleScale: 0.82,


        /*
            Limits handle length relative to
            the neighboring point distances.
        */

        maximumHandleRatio: 0.42
    };


    function resolveSettings(overrides) {

        return {
            ...defaultSettings,
            ...(overrides || {})
        };
    }


    /* ==========================
       HANDLE GENERATION
    ========================== */

    function getPointScale(
        index,
        pointCount,
        settings
    ) {

        if (
            index === 0 ||
            index === pointCount - 1
        ) {

            return settings.cornerHandleScale;
        }


        const centerIndex =
            (pointCount - 1) / 2;


        if (
            Math.abs(index - centerIndex) <
            0.01
        ) {

            return settings.centerHandleScale;
        }


        return 1;
    }


    function buildTangents(
        points,
        settings
    ) {

        return points.map(
            function (point, index) {

                let direction;


                if (index === 0) {

                    direction =
                        subtractPoints(
                            points[1],
                            points[0]
                        );

                } else if (
                    index === points.length - 1
                ) {

                    direction =
                        subtractPoints(
                            points[index],
                            points[index - 1]
                        );

                } else {

                    direction =
                        subtractPoints(
                            points[index + 1],
                            points[index - 1]
                        );
                }


                const normalized =
                    normalizePoint(direction);


                let neighborDistance;


                if (index === 0) {

                    neighborDistance =
                        pointLength(
                            subtractPoints(
                                points[1],
                                points[0]
                            )
                        );

                } else if (
                    index === points.length - 1
                ) {

                    neighborDistance =
                        pointLength(
                            subtractPoints(
                                points[index],
                                points[index - 1]
                            )
                        );

                } else {

                    const leftDistance =
                        pointLength(
                            subtractPoints(
                                points[index],
                                points[index - 1]
                            )
                        );


                    const rightDistance =
                        pointLength(
                            subtractPoints(
                                points[index + 1],
                                points[index]
                            )
                        );


                    neighborDistance =
                        Math.min(
                            leftDistance,
                            rightDistance
                        );
                }


                const pointScale =
                    getPointScale(
                        index,
                        points.length,
                        settings
                    );


                const magnitude =
                    neighborDistance *
                    settings.handleStrength *
                    pointScale;


                return scalePoint(
                    normalized,
                    magnitude
                );
            }
        );
    }


    function buildSegments(
        points,
        settings
    ) {

        if (
            !Array.isArray(points) ||
            points.length < 2
        ) {

            return [];
        }


        const tangents =
            buildTangents(
                points,
                settings
            );


        const segments = [];


        for (
            let index = 0;
            index < points.length - 1;
            index += 1
        ) {

            const start =
                points[index];


            const end =
                points[index + 1];


            const segmentDistance =
                pointLength(
                    subtractPoints(
                        end,
                        start
                    )
                );


            const maximumHandleLength =
                segmentDistance *
                settings.maximumHandleRatio;


            const startTangent =
                tangents[index];


            const endTangent =
                tangents[index + 1];


            const startLength =
                Math.min(
                    pointLength(startTangent),
                    maximumHandleLength
                );


            const endLength =
                Math.min(
                    pointLength(endTangent),
                    maximumHandleLength
                );


            const startDirection =
                normalizePoint(startTangent);


            const endDirection =
                normalizePoint(endTangent);


            const control1 =
                addPoints(
                    start,
                    scalePoint(
                        startDirection,
                        startLength
                    )
                );


            const control2 =
                subtractPoints(
                    end,
                    scalePoint(
                        endDirection,
                        endLength
                    )
                );


            segments.push({
                index: index,

                start:
                    clonePoint(start),

                control1:
                    control1,

                control2:
                    control2,

                end:
                    clonePoint(end)
            });
        }


        return segments;
    }


    /* ==========================
       PARAMETER MAPPING
    ========================== */

    function resolveSegment(
        segments,
        t
    ) {

        if (!segments.length) {
            return null;
        }


        const clampedT =
            clamp(t, 0, 1);


        if (clampedT >= 1) {

            return {
                segment:
                    segments[
                        segments.length - 1
                    ],

                localT:
                    1
            };
        }


        const scaled =
            clampedT *
            segments.length;


        const segmentIndex =
            Math.min(
                segments.length - 1,
                Math.floor(scaled)
            );


        return {
            segment:
                segments[segmentIndex],

            localT:
                scaled - segmentIndex
        };
    }


    /* ==========================
       SPLINE OBJECT
    ========================== */

    function createSpline(
        points,
        overrides
    ) {

        const settings =
            resolveSettings(overrides);


        const cleanPoints =
            Array.isArray(points)
                ? points
                    .filter(Boolean)
                    .map(clonePoint)
                : [];


        const segments =
            buildSegments(
                cleanPoints,
                settings
            );


        function getPoint(t) {

            const resolved =
                resolveSegment(
                    segments,
                    t
                );


            if (!resolved) {

                return createPoint(0, 0);
            }


            const segment =
                resolved.segment;


            return cubicPoint(
                segment.start,
                segment.control1,
                segment.control2,
                segment.end,
                resolved.localT
            );
        }


        function getTangent(t) {

            const resolved =
                resolveSegment(
                    segments,
                    t
                );


            if (!resolved) {

                return createPoint(1, 0);
            }


            const segment =
                resolved.segment;


            return normalizePoint(
                cubicDerivative(
                    segment.start,
                    segment.control1,
                    segment.control2,
                    segment.end,
                    resolved.localT
                )
            );
        }


        function getNormal(t) {

            const tangent =
                getTangent(t);


            /*
                Screen coordinates increase
                downward, so this normal points
                toward the upper lip.
            */

            return createPoint(
                tangent.y,
                -tangent.x
            );
        }


        function getSegments() {

            return segments.map(
                function (segment) {

                    return {
                        index:
                            segment.index,

                        start:
                            clonePoint(
                                segment.start
                            ),

                        control1:
                            clonePoint(
                                segment.control1
                            ),

                        control2:
                            clonePoint(
                                segment.control2
                            ),

                        end:
                            clonePoint(
                                segment.end
                            )
                    };
                }
            );
        }


        function getHandles() {

            const handles = [];


            segments.forEach(
                function (segment) {

                    handles.push({
                        segmentIndex:
                            segment.index,

                        type:
                            "outgoing",

                        anchor:
                            clonePoint(
                                segment.start
                            ),

                        point:
                            clonePoint(
                                segment.control1
                            )
                    });


                    handles.push({
                        segmentIndex:
                            segment.index,

                        type:
                            "incoming",

                        anchor:
                            clonePoint(
                                segment.end
                            ),

                        point:
                            clonePoint(
                                segment.control2
                            )
                    });
                }
            );


            return handles;
        }


        return {
            points:
                cleanPoints,

            segments:
                segments,

            settings:
                settings,

            getPoint:
                getPoint,

            getTangent:
                getTangent,

            getNormal:
                getNormal,

            getSegments:
                getSegments,

            getHandles:
                getHandles
        };
    }


    /* ==========================
       PUBLIC API
    ========================== */

    window.MouthBezierSpline = {

        defaults:
            Object.freeze({
                ...defaultSettings
            }),

        create:
            createSpline,

        buildSegments:
            function (
                points,
                overrides
            ) {

                return buildSegments(
                    points,
                    resolveSettings(overrides)
                );
            }
    };


    console.log(
        "mouthBezierSpline.js V1.0 loaded"
    );

})();
