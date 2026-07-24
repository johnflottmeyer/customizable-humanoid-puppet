/* ==========================
   MOUTH SURFACE BUILDER
   VERSION 1.0

   Combines:

   - MouthProfiles
   - MouthPads
   - MouthDirections

   into the final upper and lower
   lip surface geometry.

   This file contains no SVG code.
========================== */

(function () {
  "use strict";

  /* ==========================
       DEFAULT SETTINGS
    ========================== */

  const defaultMouthSurfaceSettings = {
    /*
            Profile controls the main procedural
            lip shape and responds directly to
            mouthEngineSettings.
        */

    profileStrength: 1,

    /*
            Pads add smaller soft-tissue detail.

            Keep this fairly low because the
            profile already establishes the
            main lip thickness.
        */

    upperPadStrength: 0.18,
    lowerPadStrength: 0.18,

    /*
            Maximum final distance from the seam.
            These prevent accidental extreme shapes
            during direct dragging.
        */

    minimumUpperHeight: 0,
    maximumUpperHeight: 40,

    minimumLowerHeight: 0,
    maximumLowerHeight: 45,
  };

  window.mouthSurfaceSettings = {
    ...defaultMouthSurfaceSettings,

    ...(window.mouthSurfaceSettings || {}),
  };

  /* ==========================
       NUMBER HELPERS
    ========================== */

  function safeNumber(value, fallback) {
    const number = Number(value);

    return Number.isFinite(number) ? number : fallback;
  }

  function clamp(value, minimum, maximum) {
    return Math.max(
      minimum,

      Math.min(maximum, value),
    );
  }

  /* ==========================
       CREATE POINT
    ========================== */

  function createPoint(x, y) {
    return new Point(x, y);
  }

  /* ==========================
       MOVE POINT
    ========================== */

  function movePoint(point, direction, distance) {
    return createPoint(
      point.x + direction.x * distance,

      point.y + direction.y * distance,
    );
  }

  /* ==========================
       BUILD ONE SURFACE SAMPLE
    ========================== */

  function buildSample(seamSample, profile, pads, directions) {
    const settings = window.mouthSurfaceSettings;

    /*
            MouthProfiles already calculates the
            procedural height using:

            - upperLipThickness
            - lowerLipThickness
            - cupidBowHeight
            - cupidBowWidth
            - philtrumDip
            - upperCenterFullness
            - lowerCenterFullness
            - lowerLobeWidth
            - corner taper
            - asymmetry
        */

    const profileUpperHeight = safeNumber(profile.upperHeight, 0);

    const profileLowerHeight = safeNumber(profile.lowerHeight, 0);

    /*
            MouthPads adds localized anatomical
            tissue variation without replacing
            the procedural profile.
        */

    const padUpperHeight = safeNumber(pads.upperHeight, 0);

    const padLowerHeight = safeNumber(pads.lowerHeight, 0);

    const upperHeight = clamp(
      profileUpperHeight * safeNumber(settings.profileStrength, 1) +
        padUpperHeight * safeNumber(settings.upperPadStrength, 0.18),

      safeNumber(settings.minimumUpperHeight, 0),

      safeNumber(settings.maximumUpperHeight, 40),
    );

    const lowerHeight = clamp(
      profileLowerHeight * safeNumber(settings.profileStrength, 1) +
        padLowerHeight * safeNumber(settings.lowerPadStrength, 0.18),

      safeNumber(settings.minimumLowerHeight, 0),

      safeNumber(settings.maximumLowerHeight, 45),
    );

    const upperBorder = movePoint(
      seamSample.seamPoint,

      directions.upper,

      upperHeight,
    );

    const lowerBorder = movePoint(
      seamSample.seamPoint,

      directions.lower,

      lowerHeight,
    );

    return {
      t: seamSample.t,

      seamPoint: seamSample.seamPoint,

      seamTangent: seamSample.seamTangent,

      seamNormal: seamSample.seamNormal,

      upperDirection: directions.upper,

      lowerDirection: directions.lower,

      upperHeight: upperHeight,

      lowerHeight: lowerHeight,

      profileUpperHeight: profileUpperHeight,

      profileLowerHeight: profileLowerHeight,

      padUpperHeight: padUpperHeight,

      padLowerHeight: padLowerHeight,

      upperPads: pads.upper,

      lowerPads: pads.lower,

      upperBorder: upperBorder,

      lowerBorder: lowerBorder,

      cornerWeight: safeNumber(profile.cornerWeight, 0),

      cupidWeight: safeNumber(profile.cupidWeight, 0),

      philtrumWeight: safeNumber(profile.philtrumWeight, 0),

      lowerLobeWeight: safeNumber(profile.lowerLobeWeight, 0),

      directionCornerWeight: safeNumber(directions.cornerWeight, 0),

      directionCenterWeight: safeNumber(directions.centerWeight, 0),
    };
  }

  /* ==========================
       BUILD COMPLETE SURFACE
    ========================== */

  function build(seamSamples, profileSettings, directionSettings) {
    if (!Array.isArray(seamSamples)) {
      return [];
    }

    if (!window.MouthProfiles || !window.MouthPads || !window.MouthDirections) {
      console.error("MouthSurfaceBuilder is missing a mouth dependency.");

      return [];
    }

    return seamSamples.map(function (seamSample) {
      const profile = window.MouthProfiles.sample(
        seamSample.t,

        profileSettings,
      );

      const pads = window.MouthPads.sample(seamSample.t);

      const directions = window.MouthDirections.sample(
        seamSample.t,

        seamSample.seamTangent,

        seamSample.seamNormal,

        directionSettings,
      );

      return buildSample(
        seamSample,

        profile,

        pads,

        directions,
      );
    });
  }

  /* ==========================
       UPDATE SETTINGS
    ========================== */

  function update(updates) {
    window.mouthSurfaceSettings = {
      ...window.mouthSurfaceSettings,

      ...(updates || {}),
    };

    if (typeof window.drawMouthEngine === "function") {
      window.drawMouthEngine();
    }
  }

  /* ==========================
       RESET SETTINGS
    ========================== */

  function reset() {
    window.mouthSurfaceSettings = {
      ...defaultMouthSurfaceSettings,
    };

    if (typeof window.drawMouthEngine === "function") {
      window.drawMouthEngine();
    }
  }

  /* ==========================
       PUBLIC API
    ========================== */

  window.MouthSurfaceBuilder = {
    defaults: Object.freeze({
      ...defaultMouthSurfaceSettings,
    }),

    buildSample: buildSample,

    build: build,

    update: update,

    reset: reset,
  };

  console.log("mouthSurfaceBuilder.js V1.0 loaded");
})();
