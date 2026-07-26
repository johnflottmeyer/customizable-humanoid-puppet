/* ==========================
   MOUTH ENGINE — VERSION 5.0

   Responsibilities:

   - Own mouth settings
   - Request geometry from MouthGeometry
   - Send geometry to MouthRenderer
   - Store current geometry
   - Refresh MouthDebug
   - Refresh FaceInspector
   - Provide compatibility APIs
========================== */

(function () {
  "use strict";

  /* ==========================
       DEFAULT SETTINGS
    ========================== */

  const defaultMouthEngineSettings = {
    /* Position */

    centerX: 250,
    centerY: 381,

    /* Mouth seam */

    width: 150,

    cornerY: 0,
    peakY: -1.5,
    cupidY: -0.5,

    tension: 0.25,

    /* Upper lip */

    upperLipThickness: 6.5,

    cupidBowHeight: 3.2,
    cupidBowWidth: 0.16,

    philtrumDip: 2.4,
    upperCenterFullness: 0.5,

    upperAsymmetry: 0,

    /* Lower lip */

    lowerLipThickness: 8.5,

    lowerCenterFullness: 2.5,
    lowerLobeWidth: 0.34,

    lowerAsymmetry: 0,

    /* Corners */

    cornerTaper: 1.9,
    cornerThickness: 0.02,

    cornerInset: 0.04,
    cornerRoundness: 0.7,

    /* Direction field */

    upperVerticalBias: 0.88,
    lowerVerticalBias: 0.94,

    upperCornerFlare: 0.34,
    lowerCornerFlare: 0.18,

    cornerFlareWidth: 0.28,

    smile: 0,

    upperExpressionStrength: 0.28,
    lowerExpressionStrength: 0.18,

    directionAsymmetry: 0,

    /* Appearance */

    upperLipColor: "#b85f68",
    lowerLipColor: "#ca7880",

    seamColor: "#8f2740",
    seamWidth: 2,

    /* Visibility */

    showLipShapes: true,
    showSeam: true,

    /* Sampling */

    sampleCount: 40,
  };

  window.mouthEngineSettings = {
    ...defaultMouthEngineSettings,

    ...(window.mouthEngineSettings || {}),
  };

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
      seamPoints: [],

      upperPath: "",
      lowerPath: "",
      seamPath: "",
    };
  }

  /* ==========================
       CURRENT GEOMETRY
    ========================== */

  let currentMouthGeometry = buildEmptyGeometry();

  /* ==========================
       DEPENDENCIES
    ========================== */

  function dependenciesAvailable() {
    const missing = [];

    if (!window.MouthGeometry) {
      missing.push("MouthGeometry");
    }

    if (!window.MouthRenderer) {
      missing.push("MouthRenderer");
    }

    if (missing.length > 0) {
      console.error(
        "mouthEngine.js is missing dependencies:",
        missing.join(", "),
      );

      return false;
    }

    return true;
  }

  /* ==========================
       ARRAY COPY
    ========================== */

  function cloneArray(value) {
    return Array.isArray(value) ? value.slice() : [];
  }

  /* ==========================
       LANDMARK COPY

       Keep the actual Landmark objects.
       Do not convert them into Points.
    ========================== */

  function cloneLandmarkCollection(collection) {
    if (!collection) {
      return {};
    }

    if (collection instanceof Map) {
      return new Map(collection);
    }

    if (Array.isArray(collection)) {
      return collection.slice();
    }

    return {
      ...collection,
    };
  }

  /* ==========================
       BUILD GEOMETRY
    ========================== */

  function buildMouthGeometry(overrides) {
    if (
      !window.MouthGeometry ||
      typeof window.MouthGeometry.build !== "function"
    ) {
      return buildEmptyGeometry();
    }

    return window.MouthGeometry.build(overrides);
  }

  /* ==========================
       DRAW
    ========================== */

  function drawMouthEngine() {
    if (!dependenciesAvailable()) {
      currentMouthGeometry = buildEmptyGeometry();

      return currentMouthGeometry;
    }

    const geometry = buildMouthGeometry(window.mouthEngineSettings);

    currentMouthGeometry = geometry;

    window.MouthRenderer.draw(geometry, window.mouthEngineSettings);

    /*
            MouthDebug reads the geometry
            through MouthEngine.
        */

    if (window.MouthDebug && typeof window.MouthDebug.draw === "function") {
      window.MouthDebug.draw();
    }

    /*
            FaceInspector.initialize()
            should still run only once
            from app.js.
        */

    if (
      window.FaceInspector &&
      typeof window.FaceInspector.refresh === "function"
    ) {
      window.FaceInspector.refresh();
    }

    return geometry;
  }

  /* ==========================
       CURRENT GEOMETRY
    ========================== */

  function getCurrentGeometry() {
    return {
      settings: currentMouthGeometry.settings,

      namedLandmarks: cloneLandmarkCollection(
        currentMouthGeometry.namedLandmarks,
      ),

      landmarks: cloneArray(currentMouthGeometry.landmarks),

      seamSpline: currentMouthGeometry.seamSpline,

      seamSamples: cloneArray(currentMouthGeometry.seamSamples),

      anatomySamples: cloneArray(currentMouthGeometry.anatomySamples),

      surfaceSamples: cloneArray(currentMouthGeometry.surfaceSamples),

      upperPoints: cloneArray(currentMouthGeometry.upperPoints),

      lowerPoints: cloneArray(currentMouthGeometry.lowerPoints),

      seamPoints: cloneArray(currentMouthGeometry.seamPoints),

      upperPath: currentMouthGeometry.upperPath || "",

      lowerPath: currentMouthGeometry.lowerPath || "",

      seamPath: currentMouthGeometry.seamPath || "",
    };
  }

  function getCurrentNamedLandmarks() {
    return cloneLandmarkCollection(currentMouthGeometry.namedLandmarks);
  }

  function getCurrentMouthLandmarks() {
    return cloneArray(currentMouthGeometry.landmarks);
  }

  function getCurrentMouthSeamSamples() {
    return cloneArray(currentMouthGeometry.seamSamples);
  }

  function getCurrentMouthSurfaceSamples() {
    return cloneArray(currentMouthGeometry.anatomySamples);
  }

  function getCurrentTrimmedSurfaceSamples() {
    return cloneArray(currentMouthGeometry.surfaceSamples);
  }

  function getCurrentUpperPoints() {
    return cloneArray(currentMouthGeometry.upperPoints);
  }

  function getCurrentLowerPoints() {
    return cloneArray(currentMouthGeometry.lowerPoints);
  }

  function getCurrentSeamPoints() {
    return cloneArray(currentMouthGeometry.seamPoints);
  }

  /* ==========================
       UPDATE SETTINGS
    ========================== */

  function updateMouthEngineSettings(updates) {
    window.mouthEngineSettings = {
      ...window.mouthEngineSettings,

      ...(updates || {}),
    };

    return drawMouthEngine();
  }

  /* ==========================
       RESET
    ========================== */

  function resetMouthEngine() {
    window.mouthEngineSettings = {
      ...defaultMouthEngineSettings,
    };

    return drawMouthEngine();
  }

  /* ==========================
       COMPATIBILITY HELPERS
    ========================== */

  function getMouthProfileSettings() {
    const settings = window.mouthEngineSettings;

    return {
      upperLipThickness: settings.upperLipThickness,

      lowerLipThickness: settings.lowerLipThickness,

      cupidBowHeight: settings.cupidBowHeight,

      cupidBowWidth: settings.cupidBowWidth,

      philtrumDip: settings.philtrumDip,

      upperCenterFullness: settings.upperCenterFullness,

      lowerCenterFullness: settings.lowerCenterFullness,

      lowerLobeWidth: settings.lowerLobeWidth,

      cornerTaper: settings.cornerTaper,

      cornerThickness: settings.cornerThickness,

      upperAsymmetry: settings.upperAsymmetry,

      lowerAsymmetry: settings.lowerAsymmetry,
    };
  }

  function getMouthDirectionSettings() {
    const settings = window.mouthEngineSettings;

    return {
      upperVerticalBias: settings.upperVerticalBias,

      lowerVerticalBias: settings.lowerVerticalBias,

      upperCornerFlare: settings.upperCornerFlare,

      lowerCornerFlare: settings.lowerCornerFlare,

      cornerFlareWidth: settings.cornerFlareWidth,

      smile: settings.smile,

      upperExpressionStrength: settings.upperExpressionStrength,

      lowerExpressionStrength: settings.lowerExpressionStrength,

      asymmetry: settings.directionAsymmetry,
    };
  }

  function buildMouthLandmarks() {
    return window.MouthGeometry.buildNamedLandmarks(window.mouthEngineSettings);
  }

  function buildMouthSeam() {
    const namedLandmarks = buildMouthLandmarks();

    const seamPoints = window.MouthGeometry.buildSeamPoints(namedLandmarks);

    return window.MouthGeometry.buildSeamSpline(
      seamPoints,
      window.mouthEngineSettings,
    );
  }

  function sampleMouthSeam(seamSpline) {
    return window.MouthGeometry.sampleSeam(
      seamSpline,
      window.mouthEngineSettings,
    );
  }

  function buildLipAnatomy(seamSamples) {
    return window.MouthGeometry.buildAnatomy(
      seamSamples,
      window.mouthEngineSettings,
    );
  }

  function buildMouthSamples(seamSpline) {
    return buildLipAnatomy(sampleMouthSeam(seamSpline));
  }

  /* ==========================
       GLOBAL COMPATIBILITY API
    ========================== */

  window.getMouthProfileSettings = getMouthProfileSettings;

  window.getMouthDirectionSettings = getMouthDirectionSettings;

  window.buildMouthLandmarks = buildMouthLandmarks;

  window.buildMouthSeam = buildMouthSeam;

  window.sampleMouthSeam = sampleMouthSeam;

  window.buildLipAnatomy = buildLipAnatomy;

  window.buildMouthSamples = buildMouthSamples;

  window.buildMouthGeometry = buildMouthGeometry;

  window.getCurrentMouthGeometry = getCurrentGeometry;

  window.getCurrentNamedMouthLandmarks = getCurrentNamedLandmarks;

  window.getCurrentMouthLandmarks = getCurrentMouthLandmarks;

  window.getCurrentMouthSeamSamples = getCurrentMouthSeamSamples;

  window.getCurrentMouthSurfaceSamples = getCurrentMouthSurfaceSamples;

  window.getCurrentTrimmedMouthSurfaceSamples = getCurrentTrimmedSurfaceSamples;

  window.getCurrentUpperPoints = getCurrentUpperPoints;

  window.getCurrentLowerPoints = getCurrentLowerPoints;

  window.getCurrentSeamPoints = getCurrentSeamPoints;

  window.getSeamPoints = window.MouthGeometry.getSeamPoints;

  window.getUpperPoints = window.MouthGeometry.getUpperPoints;

  window.getLowerPoints = window.MouthGeometry.getLowerPoints;

  window.getLipSurfaceSamples = function (samples) {
    return window.MouthGeometry.getSurfaceSamples(
      samples,
      window.mouthEngineSettings,
    );
  };

  window.buildUpperLipPath = function (samples) {
    return window.MouthGeometry.buildUpperLipPath(
      samples,
      window.mouthEngineSettings,
    );
  };

  window.buildLowerLipPath = function (samples) {
    return window.MouthGeometry.buildLowerLipPath(
      samples,
      window.mouthEngineSettings,
    );
  };

  window.drawMouthEngine = drawMouthEngine;

  window.updateMouthEngineSettings = updateMouthEngineSettings;

  window.resetMouthEngine = resetMouthEngine;

  /* ==========================
       MOUTH ENGINE API
    ========================== */

  window.MouthEngine = {
    defaults: Object.freeze({
      ...defaultMouthEngineSettings,
    }),

    getProfileSettings: getMouthProfileSettings,

    getDirectionSettings: getMouthDirectionSettings,

    buildLandmarks: buildMouthLandmarks,

    buildSeam: buildMouthSeam,

    sampleSeam: sampleMouthSeam,

    buildAnatomy: buildLipAnatomy,

    build: buildMouthGeometry,

    draw: drawMouthEngine,

    update: updateMouthEngineSettings,

    reset: resetMouthEngine,

    getGeometry: getCurrentGeometry,

    getNamedLandmarks: getCurrentNamedLandmarks,

    getLandmarks: getCurrentMouthLandmarks,

    getSeamSamples: getCurrentMouthSeamSamples,

    getSurfaceSamples: getCurrentMouthSurfaceSamples,

    getTrimmedSurfaceSamples: getCurrentTrimmedSurfaceSamples,

    getUpperPoints: getCurrentUpperPoints,

    getLowerPoints: getCurrentLowerPoints,

    getSeamPoints: getCurrentSeamPoints,
  };

  console.log("mouthEngine.js V5.0 loaded");
})();
