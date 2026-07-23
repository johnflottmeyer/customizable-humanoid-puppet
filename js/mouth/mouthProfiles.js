/* ==========================
   MOUTH PROFILES

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
            Two peaks positioned on either
            side of the philtrum center.
        */

        const leftPeak =
            gaussian(
                t,
                0.36,
                safeWidth
            );

        const rightPeak =
            gaussian(
                t,
                0.64,
                safeWidth
            );

        return Math.max(
            leftPeak,
            rightPeak
        );

    }


    function philtrumWeight(t, width) {

        const safeWidth =
            clamp(
                safeNumber(width, 0.16) * 0.72,
                0.025,
                0.22
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

        return gaussian(
            t,
            0.5,
            safeWidth
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
            normalizeSettings(settings);

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

        const centerFullness =
            gaussian(
                normalizedT,
                0.5,
                0.30
            );

        const asymmetry =
            asymmetryWeight(
                normalizedT,
                values.upperAsymmetry
            );


        /*
            Anatomical upper-lip profile:

            base thickness
            + two Cupid peaks
            - central philtrum dip
            + gentle center fullness
        */

        let height =
            values.upperLipThickness;

        height +=
            cupid *
            values.cupidBowHeight;

        height -=
            philtrum *
            values.philtrumDip;

        height +=
            centerFullness *
            values.upperCenterFullness;

        height *= taper;
        height *= asymmetry;


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
    "mouthProfiles.js loaded"
);
