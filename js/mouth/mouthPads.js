/* ==========================
   MOUTH PADS — VERSION 1.0

   Procedural soft-tissue fields
   for the upper and lower lips.

   This file contains no SVG code.
========================== */

(function () {

    "use strict";


    /* ==========================
       DEFAULT SETTINGS
    ========================== */

    const defaultMouthPadSettings = {

        /* Upper side pads */

        upperSidePadPosition: 0.29,
        upperSidePadWidth: 0.24,
        upperSidePadHeight: 5.4,
        upperSidePadFalloff: 1.65,


        /* Upper center pad */

        upperCenterPadPosition: 0,
        upperCenterPadWidth: 0.16,
        upperCenterPadHeight: 3.0,
        upperCenterPadFalloff: 1.9,


        /* Philtrum channel */

        philtrumPosition: 0,
        philtrumWidth: 0.075,
        philtrumDepth: 1.75,
        philtrumFalloff: 2.6,


        /* Lower center pad */

        lowerCenterPadPosition: 0,
        lowerCenterPadWidth: 0.40,
        lowerCenterPadHeight: 7.0,
        lowerCenterPadFalloff: 1.45,


        /* Lower side support */

        lowerSidePadPosition: 0.31,
        lowerSidePadWidth: 0.25,
        lowerSidePadHeight: 1.35,
        lowerSidePadFalloff: 1.85,


        /* Corner control */

        cornerTaperStart: 0.68,
        cornerTaperPower: 1.55,
        minimumCornerThickness: 0.08,


        /* Asymmetry */

        upperAsymmetry: 0,
        lowerAsymmetry: 0

    };


    window.mouthPadSettings = {
        ...defaultMouthPadSettings
    };


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


    function smoothstep(
        edge0,
        edge1,
        value
    ) {

        if (edge0 === edge1) {
            return value < edge0 ? 0 : 1;
        }

        const amount =
            clamp01(
                (value - edge0) /
                (edge1 - edge0)
            );

        return (
            amount *
            amount *
            (3 - 2 * amount)
        );
    }


    /* ==========================
       PARAMETER SPACE

       Mouth seam uses t = 0 to 1.
       Pad space uses x = -1 to 1.
    ========================== */

    function parameterToPadSpace(t) {

        return (
            clamp01(t) *
            2 -
            1
        );
    }


    /* ==========================
       GAUSSIAN PAD
    ========================== */

    function sampleGaussianPad(
        x,
        pad
    ) {

        const center =
            safeNumber(
                pad.center,
                0
            );

        const width =
            Math.max(
                0.0001,
                Math.abs(
                    safeNumber(
                        pad.width,
                        0.2
                    )
                )
            );

        const height =
            safeNumber(
                pad.height,
                1
            );

        const falloff =
            Math.max(
                0.1,
                safeNumber(
                    pad.falloff,
                    2
                )
            );

        const normalizedDistance =
            Math.abs(
                x - center
            ) /
            width;

        return (
            height *
            Math.exp(
                -falloff *
                normalizedDistance *
                normalizedDistance
            )
        );
    }


    /* ==========================
       CORNER TAPER
    ========================== */

    function sampleCornerTaper(
        x,
        settings
    ) {

        const absoluteX =
            Math.abs(x);

        const taperStart =
            clamp(
                safeNumber(
                    settings.cornerTaperStart,
                    defaultMouthPadSettings.cornerTaperStart
                ),
                0,
                0.98
            );

        const taperPower =
            Math.max(
                0.1,
                safeNumber(
                    settings.cornerTaperPower,
                    defaultMouthPadSettings.cornerTaperPower
                )
            );

        const minimumThickness =
            clamp01(
                safeNumber(
                    settings.minimumCornerThickness,
                    defaultMouthPadSettings.minimumCornerThickness
                )
            );

        const taperAmount =
            smoothstep(
                taperStart,
                1,
                absoluteX
            );

        const shapedTaper =
            Math.pow(
                taperAmount,
                taperPower
            );

        return (
            1 -
            shapedTaper *
            (1 - minimumThickness)
        );
    }


    /* ==========================
       ASYMMETRY
    ========================== */

    function sampleAsymmetry(
        x,
        amount
    ) {

        const asymmetry =
            clamp(
                safeNumber(
                    amount,
                    0
                ),
                -1,
                1
            );

        return (
            1 +
            x *
            asymmetry *
            0.35
        );
    }


    /* ==========================
       UPPER LIP FIELD
    ========================== */

    function sampleUpper(
        t,
        overrides
    ) {

        const settings = {
            ...window.mouthPadSettings,
            ...(overrides || {})
        };

        const x =
            parameterToPadSpace(t);

        const sidePosition =
            Math.abs(
                safeNumber(
                    settings.upperSidePadPosition,
                    defaultMouthPadSettings.upperSidePadPosition
                )
            );

        const leftPad =
            sampleGaussianPad(
                x,
                {
                    center: -sidePosition,
                    width: settings.upperSidePadWidth,
                    height: settings.upperSidePadHeight,
                    falloff: settings.upperSidePadFalloff
                }
            );

        const centerPad =
            sampleGaussianPad(
                x,
                {
                    center: settings.upperCenterPadPosition,
                    width: settings.upperCenterPadWidth,
                    height: settings.upperCenterPadHeight,
                    falloff: settings.upperCenterPadFalloff
                }
            );

        const rightPad =
            sampleGaussianPad(
                x,
                {
                    center: sidePosition,
                    width: settings.upperSidePadWidth,
                    height: settings.upperSidePadHeight,
                    falloff: settings.upperSidePadFalloff
                }
            );

        const philtrumChannel =
            sampleGaussianPad(
                x,
                {
                    center: settings.philtrumPosition,
                    width: settings.philtrumWidth,
                    height: settings.philtrumDepth,
                    falloff: settings.philtrumFalloff
                }
            );

        const rawHeight =
            Math.max(
                0,
                leftPad +
                centerPad +
                rightPad -
                philtrumChannel
            );

        const cornerTaper =
            sampleCornerTaper(
                x,
                settings
            );

        const asymmetry =
            sampleAsymmetry(
                x,
                settings.upperAsymmetry
            );

        return {

            x: x,

            height:
                rawHeight *
                cornerTaper *
                asymmetry,

            leftPad: leftPad,
            centerPad: centerPad,
            rightPad: rightPad,

            philtrumChannel:
                philtrumChannel,

            cornerTaper:
                cornerTaper,

            asymmetry:
                asymmetry

        };
    }


    /* ==========================
       LOWER LIP FIELD
    ========================== */

    function sampleLower(
        t,
        overrides
    ) {

        const settings = {
            ...window.mouthPadSettings,
            ...(overrides || {})
        };

        const x =
            parameterToPadSpace(t);

        const sidePosition =
            Math.abs(
                safeNumber(
                    settings.lowerSidePadPosition,
                    defaultMouthPadSettings.lowerSidePadPosition
                )
            );

        const centerPad =
            sampleGaussianPad(
                x,
                {
                    center: settings.lowerCenterPadPosition,
                    width: settings.lowerCenterPadWidth,
                    height: settings.lowerCenterPadHeight,
                    falloff: settings.lowerCenterPadFalloff
                }
            );

        const leftPad =
            sampleGaussianPad(
                x,
                {
                    center: -sidePosition,
                    width: settings.lowerSidePadWidth,
                    height: settings.lowerSidePadHeight,
                    falloff: settings.lowerSidePadFalloff
                }
            );

        const rightPad =
            sampleGaussianPad(
                x,
                {
                    center: sidePosition,
                    width: settings.lowerSidePadWidth,
                    height: settings.lowerSidePadHeight,
                    falloff: settings.lowerSidePadFalloff
                }
            );

        const rawHeight =
            Math.max(
                0,
                centerPad +
                leftPad +
                rightPad
            );

        const cornerTaper =
            sampleCornerTaper(
                x,
                settings
            );

        const asymmetry =
            sampleAsymmetry(
                x,
                settings.lowerAsymmetry
            );

        return {

            x: x,

            height:
                rawHeight *
                cornerTaper *
                asymmetry,

            centerPad: centerPad,
            leftPad: leftPad,
            rightPad: rightPad,

            cornerTaper:
                cornerTaper,

            asymmetry:
                asymmetry

        };
    }


    /* ==========================
       SAMPLE BOTH LIPS
    ========================== */

    function sample(
        t,
        overrides
    ) {

        const upper =
            sampleUpper(
                t,
                overrides
            );

        const lower =
            sampleLower(
                t,
                overrides
            );

        return {

            t:
                clamp01(t),

            x:
                parameterToPadSpace(t),

            upper:
                upper,

            lower:
                lower,

            upperHeight:
                upper.height,

            lowerHeight:
                lower.height

        };
    }


    /* ==========================
       SAMPLE COMPLETE FIELD
    ========================== */

    function sampleField(
        count,
        overrides
    ) {

        const sampleCount =
            Math.max(
                2,
                Math.floor(
                    safeNumber(
                        count,
                        40
                    )
                )
            );

        const samples = [];

        for (
            let index = 0;
            index <= sampleCount;
            index += 1
        ) {

            samples.push(
                sample(
                    index / sampleCount,
                    overrides
                )
            );
        }

        return samples;
    }


    /* ==========================
       UPDATE SETTINGS
    ========================== */

    function updateMouthPadSettings(
        updates
    ) {

        window.mouthPadSettings = {
            ...window.mouthPadSettings,
            ...(updates || {})
        };

        if (
            typeof window.drawMouthEngine ===
            "function"
        ) {
            window.drawMouthEngine();
        }
    }


    /* ==========================
       RESET SETTINGS
    ========================== */

    function resetMouthPadSettings() {

        window.mouthPadSettings = {
            ...defaultMouthPadSettings
        };

        if (
            typeof window.drawMouthEngine ===
            "function"
        ) {
            window.drawMouthEngine();
        }
    }


    /* ==========================
       PUBLIC API
    ========================== */

    window.sampleMouthPads =
        sample;

    window.sampleUpperMouthPads =
        sampleUpper;

    window.sampleLowerMouthPads =
        sampleLower;

    window.updateMouthPadSettings =
        updateMouthPadSettings;

    window.resetMouthPadSettings =
        resetMouthPadSettings;

    window.MouthPads = {

        defaults:
            Object.freeze({
                ...defaultMouthPadSettings
            }),

        gaussian:
            sampleGaussianPad,

        cornerTaper:
            sampleCornerTaper,

        sampleUpper:
            sampleUpper,

        sampleLower:
            sampleLower,

        sample:
            sample,

        sampleField:
            sampleField,

        update:
            updateMouthPadSettings,

        reset:
            resetMouthPadSettings

    };

})();


console.log(
    "mouthPads.js V1.0 loaded"
);
