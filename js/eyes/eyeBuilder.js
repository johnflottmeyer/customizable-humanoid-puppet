/* =========================================================
   FACELAB EYE BUILDER
   Version 4.0.1

   PURPOSE

   Builds anatomical eye landmarks around an elliptical
   eyeball model rather than placing them as vertical offsets
   from a straight eye axis.

   PIPELINE

   EyeBuilder
      ↓
   EyeRig
      ↓
   EyeGeometry / EyeSurface
      ↓
   EyeRenderer

   LOAD AFTER:

   js/eyes/eyeGeometry.js
   js/eyes/eyeRig.js
========================================================= */

(function initializeEyeBuilder() {
  "use strict";

  /* ==========================
     DEFAULT SETTINGS
  ========================== */

  const defaultBuilderSettings = {
    side: "left",

    centerX: 180,
    centerY: 235,

    width: 78,
    height: 32,
    rotation: 0,

    innerCornerY: 0,
    outerCornerY: 1,

    tearDuctLength: 4.5,
    tearDuctHeight: 2.2,
    tearDuctSurfaceHeight: 1.5,

    /*
        These settings remain compatible with the previous
        builder, but now influence orbital arc projection.
    */

    upperPeakPosition: 0.48,
    upperPeakHeight: 0.36,

    upperInnerShoulderPosition: 0.23,
    upperOuterShoulderPosition: 0.76,

    upperInnerShoulderHeight: 0.58,
    upperOuterShoulderHeight: 0.62,

    upperInnerTension: 0.72,
    upperOuterTension: 0.54,

    lowerLowPosition: 0.56,
    lowerLowDepth: 0.3,

    lowerInnerShoulderPosition: 0.26,
    lowerOuterShoulderPosition: 0.77,

    lowerInnerShoulderDepth: 0.26,
    lowerOuterShoulderDepth: 0.18,

    lowerOuterTension: 0.36,
    lowerInnerTension: 0.48,

    upperCreaseHeight: 7,
    upperCreaseInset: 7,

    lowerCreaseDepth: 4,
    lowerCreaseInset: 12,

    socketWidthScale: 1.34,
    socketHeightScale: 1.72,
    socketOffsetY: 1,

    irisSize: 28,
    irisCenterX: 0,
    irisCenterY: 1,
    pupilSize: 10,

    /*
        Eyeball model.

        globeWidthScale controls horizontal curvature.
        globeHeightScale controls vertical curvature.
        lidWrap controls how strongly landmarks follow the
        globe rather than a flat eye axis.
    */

    globeWidthScale: 0.58,
    globeHeightScale: 0.72,

    upperLidWrap: 0.88,
    lowerLidWrap: 0.72,

    upperTemporalBias: 0.08,
    lowerTemporalBias: 0.05,

    innerCanthusFlattening: 0.34,
    outerCanthusFlattening: 0.24,

    sampleCount: 18,
  };

  /* ==========================
     NUMBER HELPERS
  ========================== */

  function safeNumber(value, fallback) {
    const resolved = Number(value);

    return Number.isFinite(resolved) ? resolved : fallback;
  }

  function clamp(value, minimum, maximum) {
    return Math.max(minimum, Math.min(maximum, value));
  }

  function mix(start, end, amount) {
    return start + (end - start) * amount;
  }

  function smoothStep(start, end, value) {
    const amount = clamp(
      (value - start) / Math.max(0.0001, end - start),

      0,
      1,
    );

    return amount * amount * (3 - 2 * amount);
  }

  /* ==========================
     POINT HELPERS
  ========================== */

  function point(x, y) {
    return {
      x: safeNumber(x, 0),
      y: safeNumber(y, 0),
    };
  }

  function copyPoint(source) {
    return point(source.x, source.y);
  }

  function addPoints(first, second) {
    return point(first.x + second.x, first.y + second.y);
  }

  function subtractPoints(first, second) {
    return point(first.x - second.x, first.y - second.y);
  }

  function scalePoint(source, amount) {
    return point(source.x * amount, source.y * amount);
  }

  function pointBetween(first, second, amount) {
    return point(
      first.x + (second.x - first.x) * amount,

      first.y + (second.y - first.y) * amount,
    );
  }

  function vectorLength(vector) {
    return Math.hypot(vector.x, vector.y);
  }

  function normalizeVector(vector) {
    const length = vectorLength(vector);

    if (length < 0.0001) {
      return point(1, 0);
    }

    return point(vector.x / length, vector.y / length);
  }

  function perpendicularVector(vector) {
    return point(-vector.y, vector.x);
  }

  /* ==========================
     SETTINGS
  ========================== */

  function resolveSettings(inputSettings) {
    const input =
      inputSettings && typeof inputSettings === "object" ? inputSettings : {};

    const settings = {
      ...defaultBuilderSettings,
      ...input,
    };

    settings.side = settings.side === "right" ? "right" : "left";

    settings.centerX = safeNumber(
      settings.centerX,
      defaultBuilderSettings.centerX,
    );

    settings.centerY = safeNumber(
      settings.centerY,
      defaultBuilderSettings.centerY,
    );

    settings.width = clamp(
      safeNumber(settings.width, defaultBuilderSettings.width),
      4,
      300,
    );

    settings.height = clamp(
      safeNumber(settings.height, defaultBuilderSettings.height),
      2,
      180,
    );

    settings.rotation = safeNumber(
      settings.rotation,
      defaultBuilderSettings.rotation,
    );

    settings.innerCornerY = safeNumber(
      settings.innerCornerY,
      defaultBuilderSettings.innerCornerY,
    );

    settings.outerCornerY = safeNumber(
      settings.outerCornerY,
      defaultBuilderSettings.outerCornerY,
    );

    settings.tearDuctLength = clamp(
      safeNumber(
        settings.tearDuctLength,
        defaultBuilderSettings.tearDuctLength,
      ),
      0,
      30,
    );

    settings.tearDuctHeight = clamp(
      safeNumber(
        settings.tearDuctHeight,
        defaultBuilderSettings.tearDuctHeight,
      ),
      -20,
      20,
    );

    settings.upperPeakPosition = clamp(
      safeNumber(
        settings.upperPeakPosition,
        defaultBuilderSettings.upperPeakPosition,
      ),
      0.15,
      0.8,
    );

    settings.upperPeakHeight = clamp(
      safeNumber(
        settings.upperPeakHeight,
        defaultBuilderSettings.upperPeakHeight,
      ),
      0.02,
      1.4,
    );

    settings.upperInnerShoulderPosition = clamp(
      safeNumber(
        settings.upperInnerShoulderPosition,
        defaultBuilderSettings.upperInnerShoulderPosition,
      ),
      0.05,
      settings.upperPeakPosition - 0.04,
    );

    settings.upperOuterShoulderPosition = clamp(
      safeNumber(
        settings.upperOuterShoulderPosition,
        defaultBuilderSettings.upperOuterShoulderPosition,
      ),
      settings.upperPeakPosition + 0.04,
      0.95,
    );

    settings.upperInnerShoulderHeight = clamp(
      safeNumber(
        settings.upperInnerShoulderHeight,
        defaultBuilderSettings.upperInnerShoulderHeight,
      ),
      0.1,
      1.1,
    );

    settings.upperOuterShoulderHeight = clamp(
      safeNumber(
        settings.upperOuterShoulderHeight,
        defaultBuilderSettings.upperOuterShoulderHeight,
      ),
      0.1,
      1.1,
    );

    settings.lowerLowPosition = clamp(
      safeNumber(
        settings.lowerLowPosition,
        defaultBuilderSettings.lowerLowPosition,
      ),
      0.15,
      0.85,
    );

    settings.lowerLowDepth = clamp(
      safeNumber(settings.lowerLowDepth, defaultBuilderSettings.lowerLowDepth),
      0.01,
      1.2,
    );

    settings.lowerInnerShoulderPosition = clamp(
      safeNumber(
        settings.lowerInnerShoulderPosition,
        defaultBuilderSettings.lowerInnerShoulderPosition,
      ),
      0.05,
      settings.lowerLowPosition - 0.04,
    );

    settings.lowerOuterShoulderPosition = clamp(
      safeNumber(
        settings.lowerOuterShoulderPosition,
        defaultBuilderSettings.lowerOuterShoulderPosition,
      ),
      settings.lowerLowPosition + 0.04,
      0.95,
    );

    settings.lowerInnerShoulderDepth = clamp(
      safeNumber(
        settings.lowerInnerShoulderDepth,
        defaultBuilderSettings.lowerInnerShoulderDepth,
      ),
      0.05,
      1.1,
    );

    settings.lowerOuterShoulderDepth = clamp(
      safeNumber(
        settings.lowerOuterShoulderDepth,
        defaultBuilderSettings.lowerOuterShoulderDepth,
      ),
      0.05,
      1.1,
    );

    settings.globeWidthScale = clamp(
      safeNumber(
        settings.globeWidthScale,
        defaultBuilderSettings.globeWidthScale,
      ),
      0.25,
      1.2,
    );

    settings.globeHeightScale = clamp(
      safeNumber(
        settings.globeHeightScale,
        defaultBuilderSettings.globeHeightScale,
      ),
      0.25,
      1.5,
    );

    settings.upperLidWrap = clamp(
      safeNumber(settings.upperLidWrap, defaultBuilderSettings.upperLidWrap),
      0,
      1.5,
    );

    settings.lowerLidWrap = clamp(
      safeNumber(settings.lowerLidWrap, defaultBuilderSettings.lowerLidWrap),
      0,
      1.5,
    );

    settings.upperTemporalBias = clamp(
      safeNumber(
        settings.upperTemporalBias,
        defaultBuilderSettings.upperTemporalBias,
      ),
      -0.4,
      0.4,
    );

    settings.lowerTemporalBias = clamp(
      safeNumber(
        settings.lowerTemporalBias,
        defaultBuilderSettings.lowerTemporalBias,
      ),
      -0.4,
      0.4,
    );

    settings.innerCanthusFlattening = clamp(
      safeNumber(
        settings.innerCanthusFlattening,
        defaultBuilderSettings.innerCanthusFlattening,
      ),
      0,
      0.9,
    );

    settings.outerCanthusFlattening = clamp(
      safeNumber(
        settings.outerCanthusFlattening,
        defaultBuilderSettings.outerCanthusFlattening,
      ),
      0,
      0.9,
    );

    settings.sampleCount = clamp(
      Math.floor(
        safeNumber(settings.sampleCount, defaultBuilderSettings.sampleCount),
      ),
      4,
      100,
    );

    return settings;
  }

  /* ==========================
     ORBITAL MODEL
  ========================== */

  function createOrbitalModel(settings, innerCanthus, outerCanthus) {
    const axisVector = subtractPoints(outerCanthus, innerCanthus);

    const axis = normalizeVector(axisVector);

    let upperNormal = perpendicularVector(axis);

    if (upperNormal.y > 0) {
      upperNormal = scalePoint(upperNormal, -1);
    }

    const lowerNormal = scalePoint(upperNormal, -1);

    const center = pointBetween(innerCanthus, outerCanthus, 0.5);

    const globeRadiusX = Math.max(2, settings.width * settings.globeWidthScale);

    const globeRadiusY = Math.max(
      2,
      settings.height * settings.globeHeightScale,
    );

    return {
      center,
      axis,
      upperNormal,
      lowerNormal,
      globeRadiusX,
      globeRadiusY,
      innerCanthus,
      outerCanthus,
    };
  }

  function resolveCanthusFlattening(amount, settings) {
    const innerInfluence = 1 - smoothStep(0, 0.24, amount);

    const outerInfluence = smoothStep(0.76, 1, amount);

    const innerFlattening = settings.innerCanthusFlattening * innerInfluence;

    const outerFlattening = settings.outerCanthusFlattening * outerInfluence;

    return clamp(1 - innerFlattening - outerFlattening, 0.05, 1);
  }

  function resolveTemporalBias(amount, bias) {
    return mix(1 - bias, 1 + bias, smoothStep(0.15, 0.85, amount));
  }

  function orbitalPoint(
    model,
    settings,
    position,
    direction,
    amplitude,
    wrapAmount,
    temporalBias,
  ) {
    const t = clamp(position, 0, 1);

    const axisPoint = pointBetween(model.innerCanthus, model.outerCanthus, t);

    /*
        Elliptical globe projection.

        At the canthi the vertical component approaches zero.
        Through the central region the lid wraps over the
        globe rather than rising from a flat baseline.
    */

    const normalizedX = clamp((t - 0.5) * 2, -1, 1);

    const globeArc = Math.sqrt(Math.max(0, 1 - normalizedX * normalizedX));

    const canthusFlattening = resolveCanthusFlattening(t, settings);

    const sideBias = resolveTemporalBias(t, temporalBias);

    const verticalDistance =
      model.globeRadiusY *
      globeArc *
      wrapAmount *
      amplitude *
      canthusFlattening *
      sideBias;

    const normal =
      direction === "lower" ? model.lowerNormal : model.upperNormal;

    return addPoints(axisPoint, scalePoint(normal, verticalDistance));
  }

  /* ==========================
     LANDMARK BUILDING
  ========================== */

  function buildLandmarks(settings) {
    const halfWidth = settings.width / 2;

    const anatomicalDirection = settings.side === "left" ? -1 : 1;

    const innerCanthus = point(
      settings.centerX - anatomicalDirection * halfWidth,

      settings.centerY + settings.innerCornerY,
    );

    const outerCanthus = point(
      settings.centerX + anatomicalDirection * halfWidth,

      settings.centerY + settings.outerCornerY,
    );

    const model = createOrbitalModel(settings, innerCanthus, outerCanthus);

    /*
        Upper landmarks.

        The old height controls now scale orbital projection
        instead of creating straight vertical offsets.
    */

    const upperInnerShoulder = orbitalPoint(
      model,
      settings,
      settings.upperInnerShoulderPosition,
      "upper",
      settings.upperPeakHeight * settings.upperInnerShoulderHeight,
      settings.upperLidWrap,
      settings.upperTemporalBias,
    );

    const upperPeak = orbitalPoint(
      model,
      settings,
      settings.upperPeakPosition,
      "upper",
      settings.upperPeakHeight,
      settings.upperLidWrap,
      settings.upperTemporalBias,
    );

    const upperOuterShoulder = orbitalPoint(
      model,
      settings,
      settings.upperOuterShoulderPosition,
      "upper",
      settings.upperPeakHeight * settings.upperOuterShoulderHeight,
      settings.upperLidWrap,
      settings.upperTemporalBias,
    );

    /*
        Lower landmarks.

        Lower landmarks use a weaker globe wrap so the lower
        lid supports the eye without becoming a deep bowl.
    */

    const lowerInnerShoulder = orbitalPoint(
      model,
      settings,
      settings.lowerInnerShoulderPosition,
      "lower",
      settings.lowerLowDepth * settings.lowerInnerShoulderDepth,
      settings.lowerLidWrap,
      settings.lowerTemporalBias,
    );

    const lowerLow = orbitalPoint(
      model,
      settings,
      settings.lowerLowPosition,
      "lower",
      settings.lowerLowDepth,
      settings.lowerLidWrap,
      settings.lowerTemporalBias,
    );

    const lowerOuterShoulder = orbitalPoint(
      model,
      settings,
      settings.lowerOuterShoulderPosition,
      "lower",
      settings.lowerLowDepth * settings.lowerOuterShoulderDepth,
      settings.lowerLidWrap,
      settings.lowerTemporalBias,
    );

    /*
        Tear duct extends from the inner canthus toward the
        nose along the reverse anatomical eye axis.
    */

    const tearDuct = addPoints(
      innerCanthus,
      addPoints(
        scalePoint(model.axis, -settings.tearDuctLength),

        scalePoint(model.lowerNormal, settings.tearDuctHeight),
      ),
    );

    const irisCenter = point(
      settings.centerX + settings.irisCenterX,

      settings.centerY + settings.irisCenterY,
    );

    return {
      center: point(settings.centerX, settings.centerY),

      globeCenter: copyPoint(model.center),

      globeRadiusX: model.globeRadiusX,

      globeRadiusY: model.globeRadiusY,

      tearDuct,
      innerCanthus,

      upperInnerShoulder,
      upperPeak,
      upperOuterShoulder,

      outerCanthus,

      lowerOuterShoulder,
      lowerLow,
      lowerInnerShoulder,

      irisCenter,

      pupilCenter: copyPoint(irisCenter),

      eyeAxis: copyPoint(model.axis),

      upperNormal: copyPoint(model.upperNormal),

      lowerNormal: copyPoint(model.lowerNormal),

      up: point(0, -1),
      down: point(0, 1),

      anatomicalDirection,
    };
  }

  /* ==========================
     GEOMETRY PARAMETERS
  ========================== */

  function createGeometryParameters(settings) {
    return {
      width: settings.width,

      height: settings.height,

      upperInnerTension: settings.upperInnerTension,

      upperOuterTension: settings.upperOuterTension,

      lowerOuterTension: settings.lowerOuterTension,

      lowerInnerTension: settings.lowerInnerTension,

      upperCreaseHeight: settings.upperCreaseHeight,

      upperCreaseInset: settings.upperCreaseInset,

      lowerCreaseDepth: settings.lowerCreaseDepth,

      lowerCreaseInset: settings.lowerCreaseInset,

      tearDuctSurfaceHeight: settings.tearDuctSurfaceHeight,

      socketWidthScale: settings.socketWidthScale,

      socketHeightScale: settings.socketHeightScale,

      socketOffsetY: settings.socketOffsetY,

      globeWidthScale: settings.globeWidthScale,

      globeHeightScale: settings.globeHeightScale,

      upperLidWrap: settings.upperLidWrap,

      lowerLidWrap: settings.lowerLidWrap,

      sampleCount: settings.sampleCount,
    };
  }

  /* ==========================
     BUILD
  ========================== */

  function build(inputSettings) {
    if (!window.EyeGeometry || typeof window.EyeGeometry.build !== "function") {
      throw new Error(
        "EyeGeometry is unavailable. Load eyeGeometry.js before eyeBuilder.js.",
      );
    }

    const settings = resolveSettings(inputSettings);

    const baseLandmarks = buildLandmarks(settings);

    const rigResult =
      window.EyeRig && typeof window.EyeRig.apply === "function"
        ? window.EyeRig.apply(baseLandmarks, settings.rigState)
        : {
            landmarks: baseLandmarks,

            baseLandmarks: baseLandmarks,

            state: settings.rigState || {},
          };

    const landmarks = rigResult.landmarks;

    const parameters = createGeometryParameters(settings);

    const geometry = window.EyeGeometry.build(landmarks, parameters);

    const transformedBaseLandmarks = window.EyeGeometry.rotateLandmarks(
      baseLandmarks,
      settings.rotation,
    );

    const transformedLandmarks = window.EyeGeometry.rotateLandmarks(
      landmarks,
      settings.rotation,
    );

    const transform =
      `rotate(${settings.rotation} ` +
      `${settings.centerX} ` +
      `${settings.centerY})`;

    return {
      type: "eye",

      side: settings.side,

      settings: {
        ...settings,
      },

      parameters: {
        ...parameters,
      },

      baseLandmarks,
      transformedBaseLandmarks,

      landmarks,
      riggedLandmarks: landmarks,

      transformedLandmarks,

      rigState: {
        ...rigResult.state,
      },

      geometry,

      opening: geometry.opening,

      upperLid: geometry.upperLid,

      lowerLid: geometry.lowerLid,

      upperCrease: geometry.upperCrease,

      lowerCrease: geometry.lowerCrease,

      tearDuct: geometry.tearDuct,

      socket: geometry.socket,

      iris: {
        center: copyPoint(landmarks.irisCenter),

        radius: settings.irisSize / 2,
      },

      pupil: {
        center: copyPoint(landmarks.pupilCenter),

        radius: settings.pupilSize / 2,
      },

      transform,
    };
  }

  /* ==========================
     DESCRIPTION
  ========================== */

  function describe() {
    return {
      type: "Eye",

      architecture: [
        "EyeBuilder",
        "EyeRig",
        "EyeGeometry",
        "EyeSurface",
        "EyeRenderer",
      ],

      model: "elliptical globe projection",

      landmarks: [
        "tearDuct",
        "innerCanthus",
        "upperInnerShoulder",
        "upperPeak",
        "upperOuterShoulder",
        "outerCanthus",
        "lowerOuterShoulder",
        "lowerLow",
        "lowerInnerShoulder",
        "irisCenter",
        "pupilCenter",
      ],

      surfaces: ["opening", "tearDuct", "socket", "iris", "pupil"],
    };
  }

  /* ==========================
     PUBLIC API
  ========================== */

  window.EyeBuilder = {
    version: "4.0.1",

    defaults: Object.freeze({
      ...defaultBuilderSettings,
    }),

    build,

    buildLandmarks: function publicBuildLandmarks(inputSettings) {
      return buildLandmarks(resolveSettings(inputSettings));
    },

    describe,

    getDefaults: function getDefaults() {
      return {
        ...defaultBuilderSettings,
      };
    },
  };

  console.log("EyeBuilder 4.0.1 loaded");
})();
