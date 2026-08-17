/* ==========================
   MOUTH ENGINE — VERSION 7.5

   Responsibilities:

   - Own mouth settings
   - Request geometry from MouthGeometry
   - Send geometry to MouthRenderer
   - Store the current mouth geometry
   - Expose geometry to MouthDebug
   - Refresh FaceInspector
   - Maintain compatibility functions

   Geometry is built by:
   mouthGeometry.js

   SVG is rendered by:
   mouthRenderer.js

   Bézier seam handles are built by:
   mouthBezierSpline.js
========================== */

(function () {
  "use strict";

  /* ==========================
       DEFAULT SETTINGS
    ========================== */

  const defaultMouthEngineSettings = {
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
            the previous Spline system.
        */

    tension: 0.25,

    /* ==========================
           AUTOMATIC BÉZIER HANDLES
        ========================== */

    /*
            Overall length of the automatically
            generated seam handles.
        */

    seamHandleStrength: 0.27,

    /*
            Reduces handle length near the
            left and right mouth corners.
        */

    seamCornerHandleScale: 0.72,

    /*
            Controls handle length around the
            center seam landmark.
        */

    seamCenterHandleScale: 0.82,

    /*
            Prevents generated handles from
            becoming longer than their segment.
        */

    seamMaximumHandleRatio: 0.42,

    /* ==========================
           UPPER LIP
        ========================== */

    upperLipThickness: 13,

    cupidBowHeight: 4.2,
    cupidBowWidth: 0.16,

    philtrumDip: 3.2,
    upperCenterFullness: 1.0,

    upperAsymmetry: 0,

    /* ==========================
           LOWER LIP
        ========================== */

    lowerLipThickness: 15,

    lowerCenterFullness: 3.2,
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
           APPEARANCE
        ========================== */

    upperLipColor: "#b85f68",
    lowerLipColor: "#ca7880",

    seamColor: "#8f2740",
    seamWidth: 1.45,

    /*
        Surface shading.
        These are renderer-only appearance values.
    */

    upperLipHighlight: "#d4878e",
    upperLipShadow: "#93444f",

    lowerLipHighlight: "#e0a0a5",
    lowerLipShadow: "#a95763",

    lipHighlightStrength: 0.34,
    lipShadowStrength: 0.28,

    seamCenterDarkness: 0.85,
    seamEdgeFade: 0.22,

    /*
        Secondary center-light / edge-depth layer.
        Kept deliberately subtle so the lips do
        not read as glossy lipstick.
    */

    lipCenterHighlightStrength: 0.16,
    lipEdgeDepthStrength: 0.12,

    /*
        Animation-safe anatomical highlight controls.

        These are interpreted by MouthRenderer using
        current generated geometry, not fixed page
        coordinates, so highlights follow deformations.
    */

    upperLobeHighlightStrength: 0.18,
    upperLobeHighlightWidth: 0.22,

    lowerCenterHighlightStrength: 0.20,
    lowerCenterHighlightWidth: 0.34,

    /* ==========================
           VISIBILITY
        ========================== */

    showLipShapes: true,
    showSeam: true,

    /* ==========================
           ARTICULATION
        ========================== */

    /*
        0 = neutral / closed
        1 = maximum open
    */

    mouthOpen: 0,

    /*
        Base vertical opening distance.
    */

    mouthOpenDistance: 22,

    /*
        Upper lip moves less than lower lip.
    */

    upperOpenShare: 0.30,
    lowerOpenShare: 0.70,

    /*
        Nonlinear boost near full-open.
    */

    fullOpenBoost: 0.72,

    /*
        Controls roundness and tissue stretch.
    */

    openRoundness: 1.35,
    openLipCompression: 0.18,

    /*
        Inner cavity becomes narrower as the
        mouth opens.
    */

    openWidthCompression: 0.20,
    openWidthPower: 1.8,

    /*
        Outer lips retain more neutral width.

        0.00 = outer lips keep neutral width
        1.00 = outer lips narrow as much as cavity
    */

    outerLipCompressionShare: 0.55,

    /*
        Softens the last part of the lip contour
        as it converges into each mouth corner.
    */

    openCornerRoundness: 0.72,

    /*
        Inner mouth / future teeth.
    */

    innerMouthColor: "#54242b",

    showTeeth: true,
    teethHeight: 0.43,
    teethInset: 0.13,
    teethRevealStart: 0.35,
    teethColor: "#eee7dc",

    /*
        Very subtle tooth definition.
        These are intentionally restrained so the
        dental row does not become cartoon "piano keys".
    */

    teethCenterSeamOpacity: 0.13,
    teethCenterSeamWidth: 0.55,
    teethLateralRecede: 0.13,

    /*
        Tongue surface.

        Kept subtle and only revealed at larger
        mouth openings.
    */

    showTongue: true,
    tongueRevealStart: 0.48,
    tongueHeight: 0.34,
    tongueWidth: 0.40,

    tongueColor: "#98515C",
    tongueFrontColor: "#87434E",
    tongueBackColor: "#743942",
    tongueShadowStrength: 0.52,
  
    tongueDome: 0.08,
    tongueSideFalloff: .95,
	

    /* ==========================
           VISEME / DEFORMATION
        ========================== */

    /*
        Base deformation values.

        These remain zero in the neutral mouth.
        Viseme presets temporarily derive from them.
    */

    viseme: "neutral",
    visemeStrength: 1,

    lipPucker: 0,
    cornerPull: 0,

    lowerLipRaise: 0,
    upperLipRaise: 0,

    lipCompression: 0,

    /* ==========================
           SAMPLING
        ========================== */

    sampleCount: 40,
  };

  /* ==========================
       GLOBAL SETTINGS
    ========================== */

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

      /*
                Complete editable landmark
                collection returned by
                MouthLandmarks.
            */

      namedLandmarks: {},

      /*
                Five Point objects used as
                seam anchors.
            */

      landmarks: [],

      /*
                Bézier seam spline and its
                generated control handles.
            */

      seamSpline: null,
      seamHandles: [],

      /*
                Sampled geometry.
            */

      seamSamples: [],
      anatomySamples: [],
      surfaceSamples: [],

      /*
                Extracted border points.
            */

      upperPoints: [],
      lowerPoints: [],
      seamPoints: [],

      /*
                Completed SVG path data.
            */

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

    if (
      !window.MouthGeometry ||
      typeof window.MouthGeometry.build !== "function"
    ) {
      missing.push("MouthGeometry");
    }

    if (
      !window.MouthRenderer ||
      typeof window.MouthRenderer.draw !== "function"
    ) {
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
       COPY HELPERS
    ========================== */

  function cloneArray(value) {
    return Array.isArray(value) ? value.slice() : [];
  }

  /*
        Keep the actual Landmark objects.

        This deliberately copies only the
        collection container, not the landmarks
        inside it. FaceInspector must retain
        access to the editable Landmark objects.
    */

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
       PROFILE SETTINGS
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

  /* ==========================
       DIRECTION SETTINGS
    ========================== */

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

  /* ==========================
       VISEME SYSTEM
    ========================== */

  const mouthVisemes =
    Object.freeze({

      neutral:
        Object.freeze({}),


      /*
          M / B / P

          Lips remain closed but compress
          slightly into each other.
      */

      MBP:
        Object.freeze({

          mouthOpen: 0,

          widthScale: 0.98,

          lipCompression: 0.78,

          cornerPull: -0.05,

          showTeeth: false,
          showTongue: false

        }),


      /*
          EE

          Corners pull outward and the
          opening remains relatively small.
      */

      EE:
        Object.freeze({

          mouthOpen: 0.20,

          widthScale: 1.03,

          cornerPull: 0.68,

          lipPucker: -0.12,

          lipCompression: 0.08,

          upperThicknessScale: 0.94,
          lowerThicknessScale: 0.92,

          showTeeth: true,
          showTongue: false

        }),


      /*
          OH / OO

          Corners move inward and the
          central lip body puckers forward.

          In a front view the pucker is
          represented by stronger narrowing
          through the outer thirds.
      */

      OH:
        Object.freeze({

          mouthOpen: 0.48,

          widthScale: 0.92,

          lipPucker: 0.82,

          cornerPull: -0.72,

          lipCompression: 0.14,

          upperThicknessScale: 1.08,
          lowerThicknessScale: 1.08,

          showTeeth: false,
          showTongue: false

        }),


      /*
          AH

          Primarily uses the articulation
          system already established.
      */

      AH:
        Object.freeze({

          mouthOpen: 0.82,

          widthScale: 0.96,

          lipPucker: 0,

          cornerPull: -0.08,

          lipCompression: 0,

          showTeeth: true,
          showTongue: true

        }),


      /*
          F / V

          Lower lip rises toward the upper
          teeth while the mouth remains only
          slightly open.
      */

      FV:
        Object.freeze({

          mouthOpen: 0.18,

          widthScale: 0.98,

          lowerLipRaise: 0.78,

          upperLipRaise: 0.06,

          lipCompression: 0.22,

          cornerPull: 0.04,

          upperThicknessScale: 0.96,
          lowerThicknessScale: 0.84,

          showTeeth: true,
          showTongue: false

        })

    });


  function clamp01(value) {

    return Math.max(
      0,
      Math.min(
        1,
        Number.isFinite(
          Number(value)
        )
          ? Number(value)
          : 0
      )
    );

  }


  function clampSigned(value) {

    return Math.max(
      -1,
      Math.min(
        1,
        Number.isFinite(
          Number(value)
        )
          ? Number(value)
          : 0
      )
    );

  }


  function mixNumber(
    start,
    end,
    amount
  ) {

    return (
      Number(start) +
      (
        Number(end) -
        Number(start)
      ) *
      amount
    );

  }


  function normalizeVisemeName(name) {

    const key =
      String(
        name || "neutral"
      )
        .trim()
        .toUpperCase();


    const aliases = {

      NEUTRAL: "neutral",
      REST: "neutral",
      CLOSED: "neutral",

      M: "MBP",
      B: "MBP",
      P: "MBP",
      MBP: "MBP",

      E: "EE",
      EE: "EE",
      I: "EE",

      O: "OH",
      OH: "OH",
      OO: "OH",
      U: "OH",

      A: "AH",
      AH: "AH",

      F: "FV",
      V: "FV",
      FV: "FV"

    };


    return (
      aliases[key] ||
      "neutral"
    );

  }


  function getVisemeSettings(
    settings
  ) {

    const source =
      settings ||
      window.mouthEngineSettings;


    const name =
      normalizeVisemeName(
        source.viseme
      );


    if (
      name ===
      "neutral"
    ) {

      return {

        ...source,

        viseme:
          "neutral"

      };

    }


    const preset =
      mouthVisemes[name] ||
      mouthVisemes.neutral;


    const strength =
      clamp01(

        source.visemeStrength ===
        undefined

          ? 1
          : source.visemeStrength

      );


    const result = {

      ...source,

      viseme:
        name

    };


    if (
      preset.mouthOpen !==
      undefined
    ) {

      result.mouthOpen =
        mixNumber(

          source.mouthOpen,

          preset.mouthOpen,

          strength

        );

    }


    if (
      preset.widthScale !==
      undefined
    ) {

      result.width =
        Number(
          source.width
        ) *
        mixNumber(

          1,

          preset.widthScale,

          strength

        );

    }


    if (
      preset.upperThicknessScale !==
      undefined
    ) {

      result.upperLipThickness =
        Number(
          source.upperLipThickness
        ) *
        mixNumber(

          1,

          preset.upperThicknessScale,

          strength

        );

    }


    if (
      preset.lowerThicknessScale !==
      undefined
    ) {

      result.lowerLipThickness =
        Number(
          source.lowerLipThickness
        ) *
        mixNumber(

          1,

          preset.lowerThicknessScale,

          strength

        );

    }


    [
      "lipPucker",
      "cornerPull",
      "lowerLipRaise",
      "upperLipRaise",
      "lipCompression"
    ].forEach(
      function (property) {

        if (
          preset[property] ===
          undefined
        ) {
          return;
        }


        result[property] =
          mixNumber(

            source[property] || 0,

            preset[property],

            strength

          );

      }
    );


    if (
      strength >=
      0.5
    ) {

      if (
        preset.showTeeth !==
        undefined
      ) {

        result.showTeeth =
          preset.showTeeth;

      }


      if (
        preset.showTongue !==
        undefined
      ) {

        result.showTongue =
          preset.showTongue;

      }

    }


    return result;

  }


  function setMouthViseme(
    name,
    strength
  ) {

    window.mouthEngineSettings = {

      ...window.mouthEngineSettings,

      viseme:
        normalizeVisemeName(
          name
        ),

      visemeStrength:

        strength ===
        undefined

          ? 1
          : clamp01(
              strength
            )

    };


    return drawMouthEngine();

  }


  function clearMouthViseme() {

    window.mouthEngineSettings = {

      ...window.mouthEngineSettings,

      viseme:
        "neutral",

      visemeStrength:
        1

    };


    return drawMouthEngine();

  }


  /* ==========================
       BUILD COMPLETE GEOMETRY
    ========================== */

  function buildMouthGeometry(overrides) {
    if (
      !window.MouthGeometry ||
      typeof window.MouthGeometry.build !== "function"
    ) {
      console.error(
        "MouthEngine cannot build geometry because MouthGeometry is unavailable.",
      );

      return buildEmptyGeometry();
    }

    const source =
      overrides ||
      window.mouthEngineSettings;


    return window.MouthGeometry.build(
      getVisemeSettings(
        source
      )
    );
  }

  /* ==========================
       BUILD LANDMARKS
    ========================== */

  function buildMouthLandmarks() {
    if (
      !window.MouthGeometry ||
      typeof window.MouthGeometry.buildNamedLandmarks !== "function"
    ) {
      return {};
    }

    return window.MouthGeometry.buildNamedLandmarks(window.mouthEngineSettings);
  }

  /* ==========================
       BUILD SEAM
    ========================== */

  function buildMouthSeam(seamControlPoints) {
    if (
      !window.MouthGeometry ||
      typeof window.MouthGeometry.buildSeamSpline !== "function"
    ) {
      return null;
    }

    let points = seamControlPoints;

    if (!Array.isArray(points) || points.length < 2) {
      const namedLandmarks = buildMouthLandmarks();

      points = window.MouthGeometry.buildSeamPoints(namedLandmarks);
    }

    return window.MouthGeometry.buildSeamSpline(
      points,
      window.mouthEngineSettings,
    );
  }

  /* ==========================
       SAMPLE SEAM
    ========================== */

  function sampleMouthSeam(seamSpline) {
    if (
      !window.MouthGeometry ||
      typeof window.MouthGeometry.sampleSeam !== "function"
    ) {
      return [];
    }

    const spline = seamSpline || buildMouthSeam();

    return window.MouthGeometry.sampleSeam(spline, window.mouthEngineSettings);
  }

  /* ==========================
       BUILD LIP ANATOMY
    ========================== */

  function buildLipAnatomy(seamSamples) {
    if (
      !window.MouthGeometry ||
      typeof window.MouthGeometry.buildAnatomy !== "function"
    ) {
      return [];
    }

    return window.MouthGeometry.buildAnatomy(
      seamSamples || [],
      window.mouthEngineSettings,
    );
  }

  /* ==========================
       COMPATIBILITY SAMPLE BUILDER
    ========================== */

  function buildMouthSamples(seamSpline) {
    const seamSamples = sampleMouthSeam(seamSpline);

    return buildLipAnatomy(seamSamples);
  }

  /* ==========================
       DRAW MOUTH
    ========================== */

  function drawMouthEngine() {
    /*
            Confirm that both the geometry and
            renderer modules are available.
        */

    if (!dependenciesAvailable()) {
      currentMouthGeometry = buildEmptyGeometry();

      return currentMouthGeometry;
    }

    /*
            Build the newest geometry from the
            current global settings.
        */

    const geometry = buildMouthGeometry(window.mouthEngineSettings);

    /*
            Store geometry before rendering or
            refreshing external tools.

            MouthDebug and FaceInspector may
            request it during their refresh.
        */

    currentMouthGeometry = geometry || buildEmptyGeometry();

    /*
            Draw the completed SVG path data.
        */

    const renderSettings =
      getVisemeSettings(
        window.mouthEngineSettings
      );


    window.MouthRenderer.draw(
      currentMouthGeometry,
      renderSettings
    );

    /*
            Synchronize the lower jaw / chin with
            mouth articulation.
        */

    if (
      typeof window.drawHead === "function"
    ) {

      const baselineOpen =
        window.mouthEngineSettings
          .mouthOpen;


      window.mouthEngineSettings
        .mouthOpen =
          renderSettings
            .mouthOpen;


      window.drawHead();


      window.mouthEngineSettings
        .mouthOpen =
          baselineOpen;

    }

    /*
            MouthDebug owns all diagnostic
            drawing.

            mouthDebug.js decides whether its
            display is enabled.
        */

    if (window.MouthDebug && typeof window.MouthDebug.draw === "function") {
      window.MouthDebug.draw();
    }

    /*
            FaceInspector.initialize() should
            run only once from app.js.

            Subsequent geometry changes use
            refresh().
        */

    if (
      window.FaceInspector &&
      typeof window.FaceInspector.refresh === "function"
    ) {
      window.FaceInspector.refresh();
    }

    return currentMouthGeometry;
  }

  /* ==========================
       CURRENT COMPLETE GEOMETRY
    ========================== */

  function getCurrentGeometry() {
    return {
      settings: currentMouthGeometry.settings || {},

      namedLandmarks: cloneLandmarkCollection(
        currentMouthGeometry.namedLandmarks,
      ),

      landmarks: cloneArray(currentMouthGeometry.landmarks),

      seamSpline: currentMouthGeometry.seamSpline || null,

      seamHandles: cloneArray(currentMouthGeometry.seamHandles),

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

  /* ==========================
       INDIVIDUAL GETTERS
    ========================== */

  function getCurrentNamedLandmarks() {
    return cloneLandmarkCollection(currentMouthGeometry.namedLandmarks);
  }

  function getCurrentMouthLandmarks() {
    return cloneArray(currentMouthGeometry.landmarks);
  }

  function getCurrentMouthSeamSpline() {
    return currentMouthGeometry.seamSpline || null;
  }

  function getCurrentMouthSeamHandles() {
    return cloneArray(currentMouthGeometry.seamHandles);
  }

  function getCurrentMouthSeamSamples() {
    return cloneArray(currentMouthGeometry.seamSamples);
  }

  function getCurrentMouthSurfaceSamples() {
    /*
            Returns the complete anatomy samples.

            MouthDebug and FaceInspector should
            generally use this collection.
        */

    return cloneArray(currentMouthGeometry.anatomySamples);
  }

  function getCurrentTrimmedSurfaceSamples() {
    /*
            Returns only the samples used by the
            visible upper and lower lip surfaces.
        */

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

  function getCurrentUpperPath() {
    return currentMouthGeometry.upperPath || "";
  }

  function getCurrentLowerPath() {
    return currentMouthGeometry.lowerPath || "";
  }

  function getCurrentSeamPath() {
    return currentMouthGeometry.seamPath || "";
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
       REPLACE SETTINGS
    ========================== */

  function setMouthEngineSettings(settings) {
    window.mouthEngineSettings = {
      ...defaultMouthEngineSettings,

      ...(settings || {}),
    };

    return drawMouthEngine();
  }

  /* ==========================
       RESET SETTINGS
    ========================== */

  function resetMouthEngine() {
    window.mouthEngineSettings = {
      ...defaultMouthEngineSettings,
    };

    return drawMouthEngine();
  }

  /* ==========================
       REDRAW ALIAS
    ========================== */

  function refreshMouthEngine() {
    return drawMouthEngine();
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

  window.getCurrentMouthSeamSpline = getCurrentMouthSeamSpline;

  window.getCurrentMouthSeamHandles = getCurrentMouthSeamHandles;

  window.getCurrentMouthSeamSamples = getCurrentMouthSeamSamples;

  window.getCurrentMouthSurfaceSamples = getCurrentMouthSurfaceSamples;

  window.getCurrentTrimmedMouthSurfaceSamples = getCurrentTrimmedSurfaceSamples;

  window.getCurrentUpperPoints = getCurrentUpperPoints;

  window.getCurrentLowerPoints = getCurrentLowerPoints;

  window.getCurrentSeamPoints = getCurrentSeamPoints;

  window.getCurrentUpperLipPath = getCurrentUpperPath;

  window.getCurrentLowerLipPath = getCurrentLowerPath;

  window.getCurrentMouthSeamPath = getCurrentSeamPath;

  /*
        Geometry helpers retained for existing
        MouthDebug and FaceInspector code.
    */

  window.getSeamPoints = function (samples) {
    return window.MouthGeometry.getSeamPoints(samples);
  };

  window.getUpperPoints = function (samples) {
    return window.MouthGeometry.getUpperPoints(samples);
  };

  window.getLowerPoints = function (samples) {
    return window.MouthGeometry.getLowerPoints(samples);
  };

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

  window.refreshMouthEngine = refreshMouthEngine;

  window.updateMouthEngineSettings = updateMouthEngineSettings;

  window.setMouthEngineSettings = setMouthEngineSettings;

  window.resetMouthEngine = resetMouthEngine;

  window.setMouthViseme =
    setMouthViseme;

  window.clearMouthViseme =
    clearMouthViseme;

  /* ==========================
       MOUTH ENGINE API
    ========================== */

  window.MouthEngine = {
    defaults: Object.freeze({
      ...defaultMouthEngineSettings,
    }),

    /* Settings */

    getSettings: function () {
      return {
        ...window.mouthEngineSettings,
      };
    },

    getProfileSettings: getMouthProfileSettings,

    getDirectionSettings: getMouthDirectionSettings,

    update: updateMouthEngineSettings,

    set: setMouthEngineSettings,

    reset: resetMouthEngine,

    /* Visemes */

    visemes:
      mouthVisemes,

    setViseme:
      setMouthViseme,

    clearViseme:
      clearMouthViseme,

    getVisemeSettings:
      function () {

        return getVisemeSettings(
          window.mouthEngineSettings
        );

      },

    /* Geometry construction */

    buildLandmarks: buildMouthLandmarks,

    buildSeam: buildMouthSeam,

    sampleSeam: sampleMouthSeam,

    buildAnatomy: buildLipAnatomy,

    buildSamples: buildMouthSamples,

    build: buildMouthGeometry,

    /* Rendering */

    draw: drawMouthEngine,

    refresh: refreshMouthEngine,

    /* Complete geometry */

    getGeometry: getCurrentGeometry,

    /* Landmarks */

    getNamedLandmarks: getCurrentNamedLandmarks,

    getLandmarks: getCurrentMouthLandmarks,

    /* Seam */

    getSeamSpline: getCurrentMouthSeamSpline,

    getSeamHandles: getCurrentMouthSeamHandles,

    getSeamSamples: getCurrentMouthSeamSamples,

    getSeamPoints: getCurrentSeamPoints,

    getSeamPath: getCurrentSeamPath,

    /* Lip surfaces */

    getSurfaceSamples: getCurrentMouthSurfaceSamples,

    getTrimmedSurfaceSamples: getCurrentTrimmedSurfaceSamples,

    getUpperPoints: getCurrentUpperPoints,

    getLowerPoints: getCurrentLowerPoints,

    getUpperPath: getCurrentUpperPath,

    getLowerPath: getCurrentLowerPath,
  };
  console.log("mouthEngine.js V7.5 loaded");
})();
