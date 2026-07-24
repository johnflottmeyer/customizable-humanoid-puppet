/* ==========================
   MOUTH ENGINE — VERSION 4.3

   Responsibilities:

   - Build mouth landmarks
   - Build and sample the mouth seam
   - Apply lip profile and tissue pads
   - Calculate upper and lower lip borders
   - Draw completed lip surfaces
   - Draw the mouth seam
   - Store current geometry
   - Expose geometry to MouthDebug
   - Refresh FaceInspector selections

   Debug geometry is rendered only by
   mouthDebug.js.
========================== */

(function () {
  "use strict";

  const SVG_NAMESPACE = "http://www.w3.org/2000/svg";

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
      landmarks: [],

      seamSpline: null,

      seamSamples: [],

      anatomySamples: [],

      surfaceSamples: [],

      upperPoints: [],

      lowerPoints: [],

      seamPoints: [],
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

    if (!window.Point) {
      missing.push("Point");
    }

    if (!window.Spline) {
      missing.push("Spline");
    }

    if (!window.PathBuilder) {
      missing.push("PathBuilder");
    }

    if (!window.MouthProfiles) {
      missing.push("MouthProfiles");
    }

    if (!window.MouthDirections) {
      missing.push("MouthDirections");
    }

    if (!window.MouthPads) {
      missing.push("MouthPads");
    }

    if (missing.length) {
      console.error(
        "mouthEngine.js is missing dependencies:",

        missing.join(", "),
      );

      return false;
    }

    return true;
  }

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

  function clamp01(value) {
    return clamp(value, 0, 1);
  }

  function mix(start, end, amount) {
    return start + (end - start) * amount;
  }

  /* ==========================
       POINT HELPERS
    ========================== */

  function createPoint(x, y) {
    return new Point(x, y);
  }

  function clonePoint(point) {
    if (!point) {
      return null;
    }

    return createPoint(point.x, point.y);
  }

  function movePoint(point, direction, distance) {
    return createPoint(
      point.x + direction.x * distance,

      point.y + direction.y * distance,
    );
  }

  function mixPoints(first, second, amount) {
    const blend = clamp01(amount);

    return createPoint(
      mix(first.x, second.x, blend),

      mix(first.y, second.y, blend),
    );
  }

  function formatPoint(point) {
    return [safeNumber(point.x, 0), safeNumber(point.y, 0)].join(" ");
  }

  /* ==========================
       SVG HELPERS
    ========================== */

  function getFaceSvg() {
    return (
      document.getElementById("faceSvg") ||
      document.getElementById("face") ||
      document.querySelector("svg")
    );
  }

  function getMouthEngineGroup() {
    const svg = getFaceSvg();

    if (!svg) {
      console.warn("MouthEngine could not find the face SVG.");

      return null;
    }

    let group = document.getElementById("mouthEngineGroup");

    if (!group) {
      group = document.createElementNS(SVG_NAMESPACE, "g");

      group.setAttribute("id", "mouthEngineGroup");
    }

    /*
            Reappend the group so the procedural
            mouth remains above older mouth layers.
        */

    svg.appendChild(group);

    return group;
  }

  function clearElement(element) {
    if (!element) {
      return;
    }

    while (element.firstChild) {
      element.removeChild(element.firstChild);
    }
  }

  function createPath(pathData, options) {
    const settings = options || {};

    const path = document.createElementNS(SVG_NAMESPACE, "path");

    path.setAttribute("d", pathData || "");

    path.setAttribute("fill", settings.fill || "none");

    path.setAttribute("stroke", settings.stroke || "none");

    path.setAttribute("stroke-width", safeNumber(settings.strokeWidth, 1));

    path.setAttribute("stroke-linecap", settings.lineCap || "round");

    path.setAttribute("stroke-linejoin", settings.lineJoin || "round");

    if (settings.id) {
      path.setAttribute("id", settings.id);
    }

    if (settings.className) {
      path.setAttribute("class", settings.className);
    }

    return path;
  }

  /* ==========================
       SAMPLE COUNT
    ========================== */

  function getSampleCount() {
    return Math.max(
      8,

      Math.floor(
        safeNumber(
          window.mouthEngineSettings.sampleCount,

          defaultMouthEngineSettings.sampleCount,
        ),
      ),
    );
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
       MOUTH LANDMARKS
    ========================== */

  function buildMouthLandmarks() {
    const settings = window.mouthEngineSettings;

    const width = safeNumber(settings.width, defaultMouthEngineSettings.width);

    const centerX = safeNumber(
      settings.centerX,
      defaultMouthEngineSettings.centerX,
    );

    const centerY = safeNumber(
      settings.centerY,
      defaultMouthEngineSettings.centerY,
    );

    const halfWidth = width / 2;

    return [
      /*
                Left corner
            */

      createPoint(
        centerX - halfWidth,

        centerY + safeNumber(settings.cornerY, 0),
      ),

      /*
                Left upper peak
            */

      createPoint(
        centerX - width * 0.2,

        centerY + safeNumber(settings.peakY, -1.5),
      ),

      /*
                Center cupid point
            */

      createPoint(
        centerX,

        centerY + safeNumber(settings.cupidY, -0.5),
      ),

      /*
                Right upper peak
            */

      createPoint(
        centerX + width * 0.2,

        centerY + safeNumber(settings.peakY, -1.5),
      ),

      /*
                Right corner
            */

      createPoint(
        centerX + halfWidth,

        centerY + safeNumber(settings.cornerY, 0),
      ),
    ];
  }

  /* ==========================
       MOUTH SEAM
    ========================== */

  function buildMouthSeam(landmarks) {
    const points = Array.isArray(landmarks) ? landmarks : buildMouthLandmarks();

    return Spline.fromPoints(
      points,

      safeNumber(
        window.mouthEngineSettings.tension,

        defaultMouthEngineSettings.tension,
      ),
    );
  }

  /* ==========================
       SAMPLE SEAM
    ========================== */

  function sampleMouthSeam(seamSpline) {
    if (!seamSpline) {
      return [];
    }

    const sampleCount = getSampleCount();

    const samples = [];

    for (let index = 0; index <= sampleCount; index += 1) {
      const t = index / sampleCount;

      samples.push({
        t: t,

        seamPoint: seamSpline.getPoint(t),

        seamTangent: seamSpline.getTangent(t),

        seamNormal: seamSpline.getNormal(t),
      });
    }

    return samples;
  }

  /* ==========================
    BUILD LIP ANATOMY
  ========================== */

  /* ==========================
   BUILD LIP ANATOMY
========================== */

  function buildLipAnatomy(seamSamples) {
    if (!Array.isArray(seamSamples)) {
      return [];
    }

    const profileSettings = getMouthProfileSettings();

    const directionSettings = getMouthDirectionSettings();

    const settings = window.mouthEngineSettings || {};

    /*
    These are the original default values.

    They let thickness controls scale the
    existing pad geometry instead of replacing it.
  */

    const defaultUpperThickness = 6.5;
    const defaultLowerThickness = 7.2;

    const upperThickness = safeNumber(
      settings.upperLipThickness,
      defaultUpperThickness,
    );

    const lowerThickness = safeNumber(
      settings.lowerLipThickness,
      defaultLowerThickness,
    );

    const upperThicknessScale = clamp(
      upperThickness / defaultUpperThickness,
      0,
      4,
    );

    const lowerThicknessScale = clamp(
      lowerThickness / defaultLowerThickness,
      0,
      4,
    );

    const cupidBowHeight = safeNumber(settings.cupidBowHeight, 2.5);

    const philtrumDip = safeNumber(settings.philtrumDip, 1.5);

    const upperCenterFullness = safeNumber(settings.upperCenterFullness, 0);

    const lowerCenterFullness = safeNumber(settings.lowerCenterFullness, 1.8);

    return seamSamples.map(function (seamSample) {
      const profile = MouthProfiles.sample(seamSample.t, profileSettings);

      const pads = MouthPads.sample(seamSample.t);

      const directions = MouthDirections.sample(
        seamSample.t,
        seamSample.seamTangent,
        seamSample.seamNormal,
        directionSettings,
      );

      /*
      Begin with the original pad heights.
    */

      let upperHeight = pads.upperHeight * upperThicknessScale;

      let lowerHeight = pads.lowerHeight * lowerThicknessScale;

      /*
      Add small procedural offsets.

      These intentionally use restrained
      multipliers so the existing mouth shape
      remains recognizable.
    */

      upperHeight += profile.cupidWeight * cupidBowHeight * 0.45;

      upperHeight -= profile.philtrumWeight * philtrumDip * 0.4;

      upperHeight += directions.centerWeight * upperCenterFullness * 0.25;

      lowerHeight += profile.lowerLobeWeight * lowerCenterFullness * 0.4;

      /*
      Prevent either surface from exploding
      into oversized or pointed geometry.
    */

      upperHeight = clamp(upperHeight, 0, 30);

      lowerHeight = clamp(lowerHeight, 0, 35);

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

        upperPads: pads.upper,

        lowerPads: pads.lower,

        upperBorder: upperBorder,

        lowerBorder: lowerBorder,

        cornerWeight: profile.cornerWeight,

        cupidWeight: profile.cupidWeight,

        philtrumWeight: profile.philtrumWeight,

        lowerLobeWeight: profile.lowerLobeWeight,

        directionCornerWeight: directions.cornerWeight,

        directionCenterWeight: directions.centerWeight,
      };
    });
  }
  /* ==========================
       COMPATIBILITY BUILDER
    ========================== */

  function buildMouthSamples(seamSpline) {
    if (!seamSpline) {
      return [];
    }

    return buildLipAnatomy(sampleMouthSeam(seamSpline));
  }

  /* ==========================
       POINT ARRAY HELPERS
    ========================== */

  function getSeamPoints(samples) {
    if (!Array.isArray(samples)) {
      return [];
    }

    return samples

      .map(function (sample) {
        return sample.seamPoint;
      })

      .filter(Boolean);
  }

  function getUpperPoints(samples) {
    if (!Array.isArray(samples)) {
      return [];
    }

    return samples

      .map(function (sample) {
        return sample.upperBorder;
      })

      .filter(Boolean);
  }

  function getLowerPoints(samples) {
    if (!Array.isArray(samples)) {
      return [];
    }

    return samples

      .map(function (sample) {
        return sample.lowerBorder;
      })

      .filter(Boolean);
  }

  /* ==========================
       SURFACE CORNER INSET
    ========================== */

  function getLipSurfaceSamples(samples) {
    if (!Array.isArray(samples)) {
      return [];
    }

    if (samples.length <= 4) {
      return samples.slice();
    }

    const settings = window.mouthEngineSettings;

    const inset = clamp(
      safeNumber(
        settings.cornerInset,

        defaultMouthEngineSettings.cornerInset,
      ),

      0,

      0.22,
    );

    const maximumTrim = Math.max(
      0,

      Math.floor((samples.length - 3) / 2),
    );

    const trimCount = clamp(
      Math.round((samples.length - 1) * inset),

      0,

      maximumTrim,
    );

    if (trimCount === 0) {
      return samples.slice();
    }

    return samples.slice(
      trimCount,

      samples.length - trimCount,
    );
  }

  /* ==========================
       COMPLETE GEOMETRY
    ========================== */

  function buildMouthGeometry() {
    if (!dependenciesAvailable()) {
      return buildEmptyGeometry();
    }

    const landmarks = buildMouthLandmarks();

    const seamSpline = buildMouthSeam(landmarks);

    const seamSamples = sampleMouthSeam(seamSpline);

    const anatomySamples = buildLipAnatomy(seamSamples);

    const surfaceSamples = getLipSurfaceSamples(anatomySamples);

    return {
      landmarks: landmarks,

      seamSpline: seamSpline,

      seamSamples: seamSamples,

      anatomySamples: anatomySamples,

      surfaceSamples: surfaceSamples,

      upperPoints: getUpperPoints(anatomySamples),

      lowerPoints: getLowerPoints(anatomySamples),

      seamPoints: getSeamPoints(anatomySamples),
    };
  }

  /* ==========================
       OPEN POINT PATH
    ========================== */

  function buildOpenPointPath(points) {
    if (!Array.isArray(points) || !points.length) {
      return "";
    }

    const builder = new PathBuilder();

    builder.moveTo(points[0]);

    for (let index = 1; index < points.length; index += 1) {
      builder.lineTo(points[index]);
    }

    return builder.build();
  }

  /* ==========================
       ROUNDED LIP SURFACE
    ========================== */

  function buildRoundedLipSurfacePath(samples, borderProperty, borderFirst) {
    if (!Array.isArray(samples) || samples.length < 2) {
      return "";
    }

    const surfaceSamples = getLipSurfaceSamples(samples);

    if (surfaceSamples.length < 2) {
      return "";
    }

    const settings = window.mouthEngineSettings;

    const roundness = clamp01(
      safeNumber(
        settings.cornerRoundness,

        defaultMouthEngineSettings.cornerRoundness,
      ),
    );

    const fullLeftCorner = samples[0].seamPoint;

    const fullRightCorner = samples[samples.length - 1].seamPoint;

    const leftSample = surfaceSamples[0];

    const rightSample = surfaceSamples[surfaceSamples.length - 1];

    const leftBorder = leftSample[borderProperty];

    const rightBorder = rightSample[borderProperty];

    const leftSeam = leftSample.seamPoint;

    const rightSeam = rightSample.seamPoint;

    const rightControl = mixPoints(
      rightSeam,

      fullRightCorner,

      roundness,
    );

    const leftControl = mixPoints(
      leftSeam,

      fullLeftCorner,

      roundness,
    );

    const commands = [];

    if (borderFirst) {
      commands.push("M " + formatPoint(leftBorder));

      for (let index = 1; index < surfaceSamples.length; index += 1) {
        commands.push(
          "L " + formatPoint(surfaceSamples[index][borderProperty]),
        );
      }

      commands.push(
        "Q " + formatPoint(rightControl) + " " + formatPoint(rightSeam),
      );

      for (let index = surfaceSamples.length - 2; index >= 0; index -= 1) {
        commands.push("L " + formatPoint(surfaceSamples[index].seamPoint));
      }

      commands.push(
        "Q " + formatPoint(leftControl) + " " + formatPoint(leftBorder),
      );
    } else {
      commands.push("M " + formatPoint(leftSeam));

      for (let index = 1; index < surfaceSamples.length; index += 1) {
        commands.push("L " + formatPoint(surfaceSamples[index].seamPoint));
      }

      commands.push(
        "Q " + formatPoint(rightControl) + " " + formatPoint(rightBorder),
      );

      for (let index = surfaceSamples.length - 2; index >= 0; index -= 1) {
        commands.push(
          "L " + formatPoint(surfaceSamples[index][borderProperty]),
        );
      }

      commands.push(
        "Q " + formatPoint(leftControl) + " " + formatPoint(leftSeam),
      );
    }

    commands.push("Z");

    return commands.join(" ");
  }

  function buildUpperLipPath(samples) {
    return buildRoundedLipSurfacePath(
      samples,

      "upperBorder",

      true,
    );
  }

  function buildLowerLipPath(samples) {
    return buildRoundedLipSurfacePath(
      samples,

      "lowerBorder",

      false,
    );
  }

  /* ==========================
       DRAW LIP SURFACES
    ========================== */

  function drawLipShapes(group, samples) {
    const settings = window.mouthEngineSettings;

    const upperPathData = buildUpperLipPath(samples);

    const lowerPathData = buildLowerLipPath(samples);

    if (upperPathData) {
      group.appendChild(
        createPath(
          upperPathData,

          {
            id: "upperLipShape",

            className: "upperLipShape",

            fill: settings.upperLipColor,

            stroke: "none",
          },
        ),
      );
    }

    if (lowerPathData) {
      group.appendChild(
        createPath(
          lowerPathData,

          {
            id: "lowerLipShape",

            className: "lowerLipShape",

            fill: settings.lowerLipColor,

            stroke: "none",
          },
        ),
      );
    }
  }

  /* ==========================
       DRAW SEAM
    ========================== */

  function drawSeam(group, seamPoints) {
    const settings = window.mouthEngineSettings;

    const pathData = buildOpenPointPath(seamPoints);

    if (!pathData) {
      return;
    }

    group.appendChild(
      createPath(
        pathData,

        {
          id: "mouthSeam",

          className: "mouthSeam",

          fill: "none",

          stroke: settings.seamColor,

          strokeWidth: settings.seamWidth,
        },
      ),
    );
  }

  /* ==========================
       DRAW MOUTH ENGINE
    ========================== */

  function drawMouthEngine() {
    /*
            Confirm dependencies before trying
            to build any geometry.
        */

    if (!dependenciesAvailable()) {
      currentMouthGeometry = buildEmptyGeometry();

      return currentMouthGeometry;
    }

    /*
            Locate or create the SVG group used
            for the procedural mouth.
        */

    const group = getMouthEngineGroup();

    if (!group) {
      currentMouthGeometry = buildEmptyGeometry();

      return currentMouthGeometry;
    }

    /*
            Remove the previous mouth rendering.
        */

    clearElement(group);

    /*
            Build and store the newest mouth
            geometry before drawing or refreshing
            external tools.
        */

    const geometry = buildMouthGeometry();

    currentMouthGeometry = geometry;

    const settings = window.mouthEngineSettings;

    /*
            Draw the completed lip surfaces.
        */

    if (settings.showLipShapes !== false) {
      drawLipShapes(
        group,

        geometry.anatomySamples,
      );
    }

    /*
            Draw the central mouth seam.
        */

    if (settings.showSeam !== false) {
      drawSeam(
        group,

        geometry.seamPoints,
      );
    }

    /*
            MouthDebug owns all diagnostic
            rendering.

            It redraws only after the current
            geometry has been stored.
        */

    if (window.MouthDebug && typeof window.MouthDebug.draw === "function") {
      window.MouthDebug.draw();
    }

    /*
            Refresh any existing inspector
            selection after geometry changes.

            FaceInspector.initialize() must only
            run once from app.js.
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
       GEOMETRY CLONING
    ========================== */

  function cloneSampleArray(samples) {
    if (!Array.isArray(samples)) {
      return [];
    }

    return samples.slice();
  }

  function getCurrentGeometry() {
    return {
      landmarks: cloneSampleArray(currentMouthGeometry.landmarks),

      seamSpline: currentMouthGeometry.seamSpline,

      seamSamples: cloneSampleArray(currentMouthGeometry.seamSamples),

      anatomySamples: cloneSampleArray(currentMouthGeometry.anatomySamples),

      surfaceSamples: cloneSampleArray(currentMouthGeometry.surfaceSamples),

      upperPoints: cloneSampleArray(currentMouthGeometry.upperPoints),

      lowerPoints: cloneSampleArray(currentMouthGeometry.lowerPoints),

      seamPoints: cloneSampleArray(currentMouthGeometry.seamPoints),
    };
  }

  function getCurrentMouthSurfaceSamples() {
    return cloneSampleArray(currentMouthGeometry.anatomySamples);
  }

  function getCurrentTrimmedSurfaceSamples() {
    return cloneSampleArray(currentMouthGeometry.surfaceSamples);
  }

  function getCurrentMouthLandmarks() {
    return cloneSampleArray(currentMouthGeometry.landmarks);
  }

  function getCurrentMouthSeamSamples() {
    return cloneSampleArray(currentMouthGeometry.seamSamples);
  }

  function getCurrentUpperPoints() {
    return cloneSampleArray(currentMouthGeometry.upperPoints);
  }

  function getCurrentLowerPoints() {
    return cloneSampleArray(currentMouthGeometry.lowerPoints);
  }

  function getCurrentSeamPoints() {
    return cloneSampleArray(currentMouthGeometry.seamPoints);
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

  window.getSeamPoints = getSeamPoints;

  window.getUpperPoints = getUpperPoints;

  window.getLowerPoints = getLowerPoints;

  /*
        This helper still accepts an explicit
        samples array and returns the corner-
        trimmed lip surface samples.
    */

  window.getLipSurfaceSamples = getLipSurfaceSamples;

  window.getCurrentMouthGeometry = getCurrentGeometry;

  window.getCurrentMouthSurfaceSamples = getCurrentMouthSurfaceSamples;

  window.getCurrentTrimmedMouthSurfaceSamples = getCurrentTrimmedSurfaceSamples;

  window.getCurrentMouthLandmarks = getCurrentMouthLandmarks;

  window.getCurrentMouthSeamSamples = getCurrentMouthSeamSamples;

  window.buildUpperLipPath = buildUpperLipPath;

  window.buildLowerLipPath = buildLowerLipPath;

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

    getGeometry: getCurrentGeometry,

    /*
            Returns the complete anatomy samples.

            This is what MouthDebug and
            FaceInspector should use.
        */

    getSurfaceSamples: getCurrentMouthSurfaceSamples,

    /*
            Returns the corner-trimmed samples
            used by the visible lip surfaces.
        */

    getTrimmedSurfaceSamples: getCurrentTrimmedSurfaceSamples,

    getLandmarks: getCurrentMouthLandmarks,

    getSeamSamples: getCurrentMouthSeamSamples,

    getUpperPoints: getCurrentUpperPoints,

    getLowerPoints: getCurrentLowerPoints,

    getSeamPoints: getCurrentSeamPoints,

    draw: drawMouthEngine,

    update: updateMouthEngineSettings,

    reset: resetMouthEngine,
  };

  console.log("mouthEngine.js V4.3 loaded");
})();
