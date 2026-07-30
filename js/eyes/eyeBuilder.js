/* =========================================================
   FACELAB EYE BUILDER
   Version 3.1.0

   PURPOSE

   Creates a richer set of anatomical eye landmarks and
   passes them through EyeRig and then to EyeGeometry.

   LOAD AFTER:
   js/eyes/eyeGeometry.js
   js/eyes/eyeRig.js
========================================================= */

(function initializeEyeBuilder() {
  "use strict";

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

    sampleCount: 18,
  };

  function safeNumber(value, fallback) {
    const number = Number(value);
    return Number.isFinite(number) ? number : fallback;
  }

  function clamp(value, minimum, maximum) {
    return Math.max(minimum, Math.min(maximum, value));
  }

  function point(x, y) {
    return { x: safeNumber(x, 0), y: safeNumber(y, 0) };
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

  function normalizeVector(vector) {
    const length = Math.hypot(vector.x, vector.y);
    if (length < 0.0001) return point(0, 0);
    return point(vector.x / length, vector.y / length);
  }

  function resolveSettings(inputSettings) {
    const input =
      inputSettings && typeof inputSettings === "object" ? inputSettings : {};

    const settings = { ...defaultBuilderSettings, ...input };

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

    settings.sampleCount = clamp(
      Math.floor(
        safeNumber(settings.sampleCount, defaultBuilderSettings.sampleCount),
      ),
      4,
      100,
    );

    return settings;
  }

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

    const eyeAxis = normalizeVector(subtractPoints(outerCanthus, innerCanthus));

    function axisPoint(position, verticalOffset) {
      return addPoints(
        pointBetween(innerCanthus, outerCanthus, position),
        point(0, verticalOffset),
      );
    }

    const upperRise = settings.height * settings.upperPeakHeight;
    const lowerDepth = settings.height * settings.lowerLowDepth;

    const upperInnerShoulder = axisPoint(
      settings.upperInnerShoulderPosition,
      -upperRise * settings.upperInnerShoulderHeight,
    );

    const upperPeak = axisPoint(settings.upperPeakPosition, -upperRise);

    const upperOuterShoulder = axisPoint(
      settings.upperOuterShoulderPosition,
      -upperRise * settings.upperOuterShoulderHeight,
    );

    const lowerInnerShoulder = axisPoint(
      settings.lowerInnerShoulderPosition,
      lowerDepth * settings.lowerInnerShoulderDepth,
    );

    const lowerLow = axisPoint(settings.lowerLowPosition, lowerDepth);

    const lowerOuterShoulder = axisPoint(
      settings.lowerOuterShoulderPosition,
      lowerDepth * settings.lowerOuterShoulderDepth,
    );

    const tearDuct = addPoints(
      innerCanthus,
      addPoints(
        scalePoint(eyeAxis, -settings.tearDuctLength),
        point(0, settings.tearDuctHeight),
      ),
    );

    const irisCenter = point(
      settings.centerX + settings.irisCenterX,
      settings.centerY + settings.irisCenterY,
    );

    return {
      center: point(settings.centerX, settings.centerY),

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

      eyeAxis,
      up: point(0, -1),
      down: point(0, 1),
      anatomicalDirection,
    };
  }

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

      sampleCount: settings.sampleCount,
    };
  }

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

    const transform = `rotate(${settings.rotation} ${settings.centerX} ${settings.centerY})`;

    return {
      type: "eye",
      side: settings.side,
      settings: { ...settings },
      parameters: { ...parameters },

      baseLandmarks,
      transformedBaseLandmarks,

      landmarks,
      riggedLandmarks: landmarks,
      transformedLandmarks,
      rigState: { ...rigResult.state },
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

  function describe() {
    return {
      type: "Eye",
      architecture: ["EyeBuilder", "EyeRig", "EyeGeometry", "EyeRenderer"],
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

  window.EyeBuilder = {
    version: "3.1.0",
    defaults: Object.freeze({ ...defaultBuilderSettings }),
    build,
    buildLandmarks: function publicBuildLandmarks(inputSettings) {
      return buildLandmarks(resolveSettings(inputSettings));
    },
    describe,
    getDefaults: function getDefaults() {
      return { ...defaultBuilderSettings };
    },
  };

  console.log("EyeBuilder 3.1 loaded");
})();
