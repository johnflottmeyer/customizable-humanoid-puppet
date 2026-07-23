/* ==========================
   MOUTH DIRECTIONS

   Produces procedural growth directions
   for the upper and lower lip surfaces.

   Requires:

   Vector
========================== */

(function () {

    "use strict";


    /* ==========================
       DEFAULT SETTINGS
    ========================== */

    const defaultSettings = {

        /*
           How strongly the lip directions
           move toward vertical.

           0:
               follow the seam normal

           1:
               fully vertical
        */

        verticalBias: 0.82,


        /*
           Rotates the directions outward
           near the mouth corners.
        */

        cornerFlare: 0.45,


        /*
           Controls how far toward the center
           the corner flare extends.
        */

        cornerFlareWidth: 0.28,


        /*
           Independent upper/lower controls.
        */

        upperVerticalBias: 0.88,
        lowerVerticalBias: 0.94,

        upperCornerFlare: 0.34,
        lowerCornerFlare: 0.18,


        /*
           Expression values.

           Positive smile raises corners.
           Negative smile lowers corners.
        */

        smile: 0,

        upperExpressionStrength: 0.28,
        lowerExpressionStrength: 0.18,


        /*
           Left/right variation.

           Positive values favor the right.
           Negative values favor the left.
        */

        asymmetry: 0

    };


    /* ==========================
       NUMBER HELPERS
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


    function clamp01(value) {

        return clamp(
            value,
            0,
            1
        );

    }


    function safeNumber(
        value,
        fallback
    ) {

        return Number.isFinite(value)
            ? value
            : fallback;

    }


    function mix(
        start,
        end,
        amount
    ) {

        return (
            start +
            (end - start) *
            amount
        );

    }


    /* ==========================
       VECTOR HELPERS
    ========================== */

    function createVector(
        x,
        y
    ) {

        if (window.Vector) {

            return new Vector(
                x,
                y
            );

        }

        return {
            x: x,
            y: y
        };

    }


    function vectorLength(vector) {

        return Math.sqrt(
            vector.x * vector.x +
            vector.y * vector.y
        );

    }


    function normalizeVector(
        vector,
        fallback
    ) {

        const length =
            vectorLength(vector);

        if (length <= 0.000001) {

            return createVector(
                fallback.x,
                fallback.y
            );

        }

        return createVector(
            vector.x / length,
            vector.y / length
        );

    }


    function mixVectors(
        first,
        second,
        amount
    ) {

        const blend =
            clamp01(amount);

        return createVector(

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


    function addVectors(
        first,
        second
    ) {

        return createVector(

            first.x +
            second.x,

            first.y +
            second.y

        );

    }


    function multiplyVector(
        vector,
        amount
    ) {

        return createVector(

            vector.x *
            amount,

            vector.y *
            amount

        );

    }


    /* ==========================
       SETTINGS
    ========================== */

    function createSettings(overrides) {

        return Object.assign(
            {},
            defaultSettings,
            overrides || {}
        );

    }


    function normalizeSettings(settings) {

        const source =
            createSettings(settings);


        return {

            verticalBias:
                clamp01(
                    safeNumber(
                        source.verticalBias,
                        defaultSettings.verticalBias
                    )
                ),

            cornerFlare:
                clamp(
                    safeNumber(
                        source.cornerFlare,
                        defaultSettings.cornerFlare
                    ),
                    0,
                    2
                ),

            cornerFlareWidth:
                clamp(
                    safeNumber(
                        source.cornerFlareWidth,
                        defaultSettings.cornerFlareWidth
                    ),
                    0.05,
                    0.5
                ),

            upperVerticalBias:
                clamp01(
                    safeNumber(
                        source.upperVerticalBias,
                        defaultSettings.upperVerticalBias
                    )
                ),

            lowerVerticalBias:
                clamp01(
                    safeNumber(
                        source.lowerVerticalBias,
                        defaultSettings.lowerVerticalBias
                    )
                ),

            upperCornerFlare:
                clamp(
                    safeNumber(
                        source.upperCornerFlare,
                        defaultSettings.upperCornerFlare
                    ),
                    0,
                    2
                ),

            lowerCornerFlare:
                clamp(
                    safeNumber(
                        source.lowerCornerFlare,
                        defaultSettings.lowerCornerFlare
                    ),
                    0,
                    2
                ),

            smile:
                clamp(
                    safeNumber(
                        source.smile,
                        defaultSettings.smile
                    ),
                    -1,
                    1
                ),

            upperExpressionStrength:
                clamp(
                    safeNumber(
                        source.upperExpressionStrength,
                        defaultSettings.upperExpressionStrength
                    ),
                    0,
                    2
                ),

            lowerExpressionStrength:
                clamp(
                    safeNumber(
                        source.lowerExpressionStrength,
                        defaultSettings.lowerExpressionStrength
                    ),
                    0,
                    2
                ),

            asymmetry:
                clamp(
                    safeNumber(
                        source.asymmetry,
                        defaultSettings.asymmetry
                    ),
                    -1,
                    1
                )

        };

    }


    /* ==========================
       POSITION HELPERS
    ========================== */

    function getHorizontalPosition(t) {

        return (
            clamp01(t) -
            0.5
        ) * 2;

    }


    function getSideSign(t) {

        const horizontal =
            getHorizontalPosition(t);

        if (horizontal < 0) {
            return -1;
        }

        if (horizontal > 0) {
            return 1;
        }

        return 0;

    }


    function getCornerWeight(
        t,
        width
    ) {

        const horizontal =
            Math.abs(
                getHorizontalPosition(t)
            );

        const safeWidth =
            clamp(
                width,
                0.05,
                0.5
            );

        const start =
            1 -
            safeWidth * 2;

        const normalized =
            (
                horizontal -
                start
            ) /
            (
                1 -
                start
            );

        const weight =
            clamp01(normalized);

        /*
           Smoothstep.
        */

        return (
            weight *
            weight *
            (
                3 -
                2 * weight
            )
        );

    }


    function getCenterWeight(t) {

        const horizontal =
            Math.abs(
                getHorizontalPosition(t)
            );

        return (
            1 -
            clamp01(horizontal)
        );

    }


    function getAsymmetryWeight(
        t,
        amount
    ) {

        const horizontal =
            getHorizontalPosition(t);

        return (
            1 +
            horizontal *
            amount
        );

    }


    /* ==========================
       BASE DIRECTIONS
    ========================== */

    function getUpperVerticalDirection() {

        return createVector(
            0,
            -1
        );

    }


    function getLowerVerticalDirection() {

        return createVector(
            0,
            1
        );

    }


    /*
       The normal returned by the spline may
       point either upward or downward depending
       on the spline implementation.

       These functions force the normal into the
       correct hemisphere.
    */

    function getUpperNormal(normal) {

        const normalized =
            normalizeVector(
                normal,
                {
                    x: 0,
                    y: -1
                }
            );

        if (normalized.y > 0) {

            return createVector(
                -normalized.x,
                -normalized.y
            );

        }

        return normalized;

    }


    function getLowerNormal(normal) {

        const normalized =
            normalizeVector(
                normal,
                {
                    x: 0,
                    y: 1
                }
            );

        if (normalized.y < 0) {

            return createVector(
                -normalized.x,
                -normalized.y
            );

        }

        return normalized;

    }


    /* ==========================
       CORNER FLARE
    ========================== */

    function applyCornerFlare(
        direction,
        t,
        amount,
        width
    ) {

        const side =
            getSideSign(t);

        const weight =
            getCornerWeight(
                t,
                width
            );

        const flare =
            createVector(
                side *
                amount *
                weight,
                0
            );

        return normalizeVector(

            addVectors(
                direction,
                flare
            ),

            direction

        );

    }


    /* ==========================
       SMILE FIELD
    ========================== */

    function applyUpperExpression(
        direction,
        t,
        settings
    ) {

        const cornerWeight =
            getCornerWeight(
                t,
                settings.cornerFlareWidth
            );

        const smileAmount =
            settings.smile *
            settings.upperExpressionStrength *
            cornerWeight;

        /*
           Positive smile raises the corners.
           Negative smile lowers the corners.
        */

        const expression =
            createVector(
                0,
                -smileAmount
            );

        return normalizeVector(

            addVectors(
                direction,
                expression
            ),

            direction

        );

    }


    function applyLowerExpression(
        direction,
        t,
        settings
    ) {

        const cornerWeight =
            getCornerWeight(
                t,
                settings.cornerFlareWidth
            );

        const smileAmount =
            settings.smile *
            settings.lowerExpressionStrength *
            cornerWeight;

        /*
           For the lower lip, smiling also lifts
           the corner direction slightly.
        */

        const expression =
            createVector(
                0,
                -smileAmount
            );

        return normalizeVector(

            addVectors(
                direction,
                expression
            ),

            direction

        );

    }


    /* ==========================
       UPPER LIFT DIRECTION
    ========================== */

    function getUpperLiftDirection(
        t,
        tangent,
        normal,
        settings
    ) {

        const values =
            normalizeSettings(settings);

        const upperNormal =
            getUpperNormal(normal);

        const vertical =
            getUpperVerticalDirection();

        const centerWeight =
            getCenterWeight(t);

        /*
           Use more vertical influence near the
           center and slightly more normal influence
           toward the corners.
        */

        const verticalBias =
            clamp01(

                values.upperVerticalBias +

                centerWeight *
                (
                    1 -
                    values.upperVerticalBias
                ) *
                0.35

            );

        let direction =
            normalizeVector(

                mixVectors(
                    upperNormal,
                    vertical,
                    verticalBias
                ),

                vertical

            );


        direction =
            applyCornerFlare(
                direction,
                t,
                values.upperCornerFlare,
                values.cornerFlareWidth
            );


        direction =
            applyUpperExpression(
                direction,
                t,
                values
            );


        const asymmetry =
            getAsymmetryWeight(
                t,
                values.asymmetry
            );


        direction =
            createVector(

                direction.x *
                asymmetry,

                direction.y

            );


        return normalizeVector(
            direction,
            vertical
        );

    }


    /* ==========================
       LOWER LIFT DIRECTION
    ========================== */

    function getLowerLiftDirection(
        t,
        tangent,
        normal,
        settings
    ) {

        const values =
            normalizeSettings(settings);

        const lowerNormal =
            getLowerNormal(normal);

        const vertical =
            getLowerVerticalDirection();

        const centerWeight =
            getCenterWeight(t);


        const verticalBias =
            clamp01(

                values.lowerVerticalBias +

                centerWeight *
                (
                    1 -
                    values.lowerVerticalBias
                ) *
                0.5

            );


        let direction =
            normalizeVector(

                mixVectors(
                    lowerNormal,
                    vertical,
                    verticalBias
                ),

                vertical

            );


        direction =
            applyCornerFlare(
                direction,
                t,
                values.lowerCornerFlare,
                values.cornerFlareWidth
            );


        direction =
            applyLowerExpression(
                direction,
                t,
                values
            );


        const asymmetry =
            getAsymmetryWeight(
                t,
                values.asymmetry
            );


        direction =
            createVector(

                direction.x *
                asymmetry,

                direction.y

            );


        return normalizeVector(
            direction,
            vertical
        );

    }


    /* ==========================
       COMPLETE DIRECTION SAMPLE
    ========================== */

    function sample(
        t,
        tangent,
        normal,
        settings
    ) {

        return {

            t:
                clamp01(t),

            upper:
                getUpperLiftDirection(
                    t,
                    tangent,
                    normal,
                    settings
                ),

            lower:
                getLowerLiftDirection(
                    t,
                    tangent,
                    normal,
                    settings
                ),

            cornerWeight:
                getCornerWeight(
                    t,
                    normalizeSettings(settings)
                        .cornerFlareWidth
                ),

            centerWeight:
                getCenterWeight(t)

        };

    }


    /* ==========================
       PUBLIC API
    ========================== */

    window.MouthDirections = {

        defaults:
            Object.freeze(
                Object.assign(
                    {},
                    defaultSettings
                )
            ),

        createSettings:
            createSettings,

        normalizeSettings:
            normalizeSettings,

        getCornerWeight:
            getCornerWeight,

        getCenterWeight:
            getCenterWeight,

