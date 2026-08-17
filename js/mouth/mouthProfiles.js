/* ==========================
   MOUTH PROFILES — VERSION 1.6

   Produces anatomical lip thickness values
   across the mouth from t = 0 to t = 1.

   t = 0     left corner
   t = 0.5   center
   t = 1     right corner
========================== */

(function () {

    "use strict";


    /* ==========================
       DEFAULT PROFILE SETTINGS
    ========================== */

    const defaultSettings = {

        /* Overall lip thickness */

        upperLipThickness: 9,
        lowerLipThickness: 12,


        /* Upper lip shape */

        cupidBowHeight: 5,
        cupidBowWidth: 0.16,
        philtrumDip: 3,
        upperCenterFullness: 1.5,


        /* Lower lip shape */

        lowerCenterFullness: 4,
        lowerLobeWidth: 0.34,


        /* Corners */

        cornerTaper: 1.65,
        cornerThickness: 0.08,


        /* Left/right balance */

        upperAsymmetry: 0,
        lowerAsymmetry: 0
    };


    /* ==========================
       NUMBER HELPERS
    ========================== */

    function clamp(value, minimum, maximum) {

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


    function mix(start, end, amount) {

        return (
            start +
            (end - start) * amount
        );

    }


    function safeNumber(value, fallback) {

        return Number.isFinite(value)
            ? value
            : fallback;

    }


    /* ==========================
       PROFILE HELPERS
    ========================== */

    /*
        Smooth bell-shaped curve.

        center:
            horizontal location from 0 to 1

        width:
            approximate half-width

        Returns:
            0 to 1
    */

    function gaussian(t, center, width) {

        const safeWidth =
            Math.max(
                Math.abs(width),
                0.0001
            );

        const distance =
            (t - center) /
            safeWidth;

        return Math.exp(
            -0.5 *
            distance *
            distance
        );

    }


    /*
        Smoothly fades the lip thickness
        toward both mouth corners.

        Returns approximately:

        0 at the corners
        1 near the center
    */

    function cornerTaper(t, power) {

        const normalized =
            Math.sin(
                Math.PI *
                clamp01(t)
            );

        return Math.pow(
            Math.max(
                normalized,
                0
            ),
            Math.max(
                power,
                0.01
            )
        );

    }


    /*
        Allows the corners to retain a small
        amount of thickness instead of reaching
        an absolute zero.
    */

    function cornerWeight(
        t,
        taperPower,
        minimumThickness
    ) {

        const taper =
            cornerTaper(
                t,
                taperPower
            );

        return mix(
            clamp01(minimumThickness),
            1,
            taper
        );

    }


    /*
        Produces a left-to-right bias.

        amount = 0
            symmetrical

        amount > 0
            right side fuller

        amount < 0
            left side fuller
    */

    function asymmetryWeight(t, amount) {

        const safeAmount =
            clamp(
                safeNumber(amount, 0),
                -1,
                1
            );

        const horizontal =
            (t - 0.5) * 2;

        return Math.max(
            0,
            1 +
            horizontal *
            safeAmount
        );

    }


    /* ==========================
       CUPID'S BOW
    ========================== */

    function cupidBowWeight(
        t,
        width
    ) {

        const safeWidth =
            clamp(
                safeNumber(width, 0.16),
                0.04,
                0.35
            );


        /*
            V1.4

            Keep the Cupid peaks closer to the
            center than V1.3.

            This produces a recognizable upper-lip
            M-shape without dividing the entire
            upper lip into two isolated humps.
        */

        const peakOffset =
            0.095;


        const peakWidth =
            safeWidth *
            0.82;


        const leftPeak =
            gaussian(
                t,
                0.5 -
                    peakOffset,
                peakWidth
            );


        const rightPeak =
            gaussian(
                t,
                0.5 +
                    peakOffset,
                peakWidth
            );


        return Math.max(
            leftPeak,
            rightPeak
        );

    }


    function philtrumWeight(
        t,
        width
    ) {

        /*
            V1.4

            A narrow center-only field.

            This creates a small Cupid notch
            instead of a broad central valley.
        */

        const safeWidth =
            clamp(
                safeNumber(width, 0.16) *
                    0.29,
                0.018,
                0.10
            );


        return gaussian(
            t,
            0.5,
            safeWidth
        );

    }


    /* ==========================
       LOWER LIP LOBE
    ========================== */

    function lowerLobeWeight(
        t,
        width
    ) {

        const safeWidth =
            clamp(
                safeNumber(width, 0.34),
                0.08,
                0.65
            );


        /*
            V1.4

            Two strongly overlapping lower-lip
            support fields create a broad central
            body instead of one pointed center bump.
        */

        const lobeOffset =
            0.08;


        const lobeWidth =
            safeWidth *
            0.85;


        const leftLobe =
            gaussian(
                t,
                0.5 -
                    lobeOffset,
                lobeWidth
            );


        const rightLobe =
            gaussian(
                t,
                0.5 +
                    lobeOffset,
                lobeWidth
            );


        return clamp01(
            (
                leftLobe +
                rightLobe
            ) *
            0.52
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

            upperLipThickness:
                Math.max(
                    safeNumber(
                        source.upperLipThickness,
                        defaultSettings.upperLipThickness
                    ),
                    0
                ),

            lowerLipThickness:
                Math.max(
                    safeNumber(
                        source.lowerLipThickness,
                        defaultSettings.lowerLipThickness
                    ),
                    0
                ),

            cupidBowHeight:
                Math.max(
                    safeNumber(
                        source.cupidBowHeight,
                        defaultSettings.cupidBowHeight
                    ),
                    0
                ),

            cupidBowWidth:
                clamp(
                    safeNumber(
                        source.cupidBowWidth,
                        defaultSettings.cupidBowWidth
                    ),
                    0.04,
                    0.35
                ),

            philtrumDip:
                Math.max(
                    safeNumber(
                        source.philtrumDip,
                        defaultSettings.philtrumDip
                    ),
                    0
                ),

            upperCenterFullness:
                safeNumber(
                    source.upperCenterFullness,
                    defaultSettings.upperCenterFullness
                ),

            lowerCenterFullness:
                safeNumber(
                    source.lowerCenterFullness,
                    defaultSettings.lowerCenterFullness
                ),

            lowerLobeWidth:
                clamp(
                    safeNumber(
                        source.lowerLobeWidth,
                        defaultSettings.lowerLobeWidth
                    ),
                    0.08,
                    0.65
                ),

            cornerTaper:
                Math.max(
                    safeNumber(
                        source.cornerTaper,
                        defaultSettings.cornerTaper
                    ),
                    0.01
                ),

            cornerThickness:
                clamp01(
                    safeNumber(
                        source.cornerThickness,
                        defaultSettings.cornerThickness
                    )
                ),

            upperAsymmetry:
                clamp(
                    safeNumber(
                        source.upperAsymmetry,
                        defaultSettings.upperAsymmetry
                    ),
                    -1,
                    1
                ),

            lowerAsymmetry:
                clamp(
                    safeNumber(
                        source.lowerAsymmetry,
                        defaultSettings.lowerAsymmetry
                    ),
                    -1,
                    1
                )
        };

    }


    /* ==========================
       UPPER LIP PROFILE
    ========================== */

    function getUpperHeight(
        t,
        settings
    ) {

        const normalizedT =
            clamp01(t);


        const values =
            normalizeSettings(
                settings
            );


        const taper =
            cornerWeight(
                normalizedT,
                values.cornerTaper,
                values.cornerThickness
            );


        const cupid =
            cupidBowWeight(
                normalizedT,
                values.cupidBowWidth
            );


        const philtrum =
            philtrumWeight(
                normalizedT,
                values.cupidBowWidth
            );


        /*
            A wide body field keeps the upper lip
            full through most of its width.
        */

        const broadBody =
            gaussian(
                normalizedT,
                0.5,
                0.50
            );


        /*
            Outer-third support delays the taper
            toward the corners while still allowing
            the actual corner points to stay thin.
        */

        const leftOuterSupport =
            gaussian(
                normalizedT,
                0.24,
                0.25
            );


        const rightOuterSupport =
            gaussian(
                normalizedT,
                0.76,
                0.25
            );


        const outerSupport =
            Math.max(
                leftOuterSupport,
                rightOuterSupport
            );


        const asymmetry =
            asymmetryWeight(
                normalizedT,
                values.upperAsymmetry
            );


        let height =
            values.upperLipThickness;


        /*
            Distinct but soft Cupid peaks.
        */

        height +=
            cupid *
            values.cupidBowHeight *
            0.72;


        /*
            Localized center notch.
        */

        height -=
            philtrum *
            values.philtrumDip *
            0.72;


        /*
            Gentle body fullness rather than a
            central plateau.
        */

        height +=
            broadBody *
            values.upperCenterFullness *
            0.55;


        /*
            Carry fullness toward the outer thirds.
        */

        height +=
            outerSupport *
            values.upperLipThickness *
            0.12;


        height *=
            taper;


        height *=
            asymmetry;


        return Math.max(
            height,
            0
        );

    }


    /* ==========================
       LOWER LIP PROFILE
    ========================== */

    function getLowerHeight(
        t,
        settings
    ) {

        const normalizedT =
            clamp01(t);

        const values =
            normalizeSettings(settings);

        const taper =
            cornerWeight(
                normalizedT,
                values.cornerTaper,
                values.cornerThickness
            );

        const centerLobe =
            lowerLobeWeight(
                normalizedT,
                values.lowerLobeWidth
            );

        const asymmetry =
            asymmetryWeight(
                normalizedT,
                values.lowerAsymmetry
            );


        /*
            The lower lip has one broad central
            lobe instead of a Cupid's bow.
        */

        let height =
            values.lowerLipThickness;

        height +=
            centerLobe *
            values.lowerCenterFullness;

        height *= taper;
        height *= asymmetry;


        return Math.max(
            height,
            0
        );

    }


    /* ==========================
       COMPLETE PROFILE SAMPLE
    ========================== */

    function sample(
        t,
        settings
    ) {

        const normalizedT =
            clamp01(t);

        const values =
            normalizeSettings(settings);


        return {

            t:
                normalizedT,

            upperHeight:
                getUpperHeight(
                    normalizedT,
                    values
                ),

            lowerHeight:
                getLowerHeight(
                    normalizedT,
                    values
                ),

            cornerWeight:
                cornerWeight(
                    normalizedT,
                    values.cornerTaper,
                    values.cornerThickness
                ),

            cupidWeight:
                cupidBowWeight(
                    normalizedT,
                    values.cupidBowWidth
                ),

            philtrumWeight:
                philtrumWeight(
                    normalizedT,
                    values.cupidBowWidth
                ),

            lowerLobeWeight:
                lowerLobeWeight(
                    normalizedT,
                    values.lowerLobeWidth
                )
        };

    }


    /* ==========================
       PROFILE SAMPLE ARRAY
    ========================== */

    function sampleRange(
        count,
        settings
    ) {

        const safeCount =
            Math.max(
                Math.floor(
                    safeNumber(count, 25)
                ),
                2
            );

        const samples =
            [];


        for (
            let index = 0;
            index < safeCount;
            index += 1
        ) {

            const t =
                index /
                (safeCount - 1);

            samples.push(
                sample(
                    t,
                    settings
                )
            );

        }


        return samples;

    }


    /* ==========================
       PUBLIC API
    ========================== */

    window.MouthProfiles = {

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

        getUpperHeight:
            getUpperHeight,

        getLowerHeight:
            getLowerHeight,

        getCornerWeight:
            cornerWeight,

        getCupidWeight:
            cupidBowWeight,

        getPhiltrumWeight:
            philtrumWeight,

        getLowerLobeWeight:
            lowerLobeWeight,

        sample:
            sample,

        sampleRange:
            sampleRange
    };

})();

console.log(
    "mouthProfiles.js V1.6 loaded"
);
