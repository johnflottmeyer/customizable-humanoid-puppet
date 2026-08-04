/* =========================================================
   FACELAB EYE ASSEMBLY
   Version 1.7.0

   PURPOSE

   Builds the eye as separate anatomical components:

   - globe
   - independent upper lid
   - independent lower lid
   - medial canthus
   - rounded inner-only tear duct
   - lateral canthus
   - visible opening

   LOAD AFTER:
   js/eyes/eyeBuilder.js

   LOAD BEFORE:
   js/eyes/eyeRenderer.js
   js/eyes.js
========================================================= */

(function initializeEyeAssembly() {
  "use strict";

  function number(value, fallback) {
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

  function point(x, y) {
    return {
      x: number(x, 0),
      y: number(y, 0),
    };
  }

  function copyPoint(source) {
    return source
      ? point(source.x, source.y)
      : point(0, 0);
  }

  function addPoints(first, second) {
    return point(
      first.x + second.x,
      first.y + second.y,
    );
  }

  function subtractPoints(first, second) {
    return point(
      first.x - second.x,
      first.y - second.y,
    );
  }

  function scalePoint(source, amount) {
    return point(
      source.x * amount,
      source.y * amount,
    );
  }

  function mixPoints(first, second, amount) {
    return point(
      mix(first.x, second.x, amount),
      mix(first.y, second.y, amount),
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

    return point(
      vector.x / length,
      vector.y / length,
    );
  }

  function perpendicularVector(vector) {
    return point(-vector.y, vector.x);
  }

  function dotProduct(first, second) {
    return first.x * second.x + first.y * second.y;
  }

  function reversePoints(points) {
    return points
      .slice()
      .reverse()
      .map(copyPoint);
  }

  function createSmoothPath(points) {
    if (!points || points.length === 0) {
      return "";
    }

    if (points.length === 1) {
      return `M ${points[0].x} ${points[0].y}`;
    }

    const commands = [
      `M ${points[0].x} ${points[0].y}`,
    ];

    for (let index = 1; index < points.length; index += 1) {
      const previous =
        points[Math.max(0, index - 2)];

      const current =
        points[index - 1];

      const next =
        points[index];

      const after =
        points[Math.min(points.length - 1, index + 1)];

      const control1 = point(
        current.x + (next.x - previous.x) / 6,
        current.y + (next.y - previous.y) / 6,
      );

      const control2 = point(
        next.x - (after.x - current.x) / 6,
        next.y - (after.y - current.y) / 6,
      );

      commands.push(
        [
          "C",
          control1.x,
          control1.y,
          control2.x,
          control2.y,
          next.x,
          next.y,
        ].join(" "),
      );
    }

    return commands.join(" ");
  }

  function removeInitialMove(path) {
    return String(path || "").replace(
      /^M\s+[-\d.eE+]+\s+[-\d.eE+]+/,
      "",
    );
  }

  function createRibbonPath(edgePoints, outerPoints) {
    const edgePath = createSmoothPath(edgePoints);

    const returningPath = createSmoothPath(
      reversePoints(outerPoints),
    );

    return [
      edgePath,
      removeInitialMove(returningPath),
      "Z",
    ].join(" ");
  }

  function decorateSamples(points, preferredNormal) {
    return points.map(function decorate(source, index) {
      const previous =
        points[Math.max(0, index - 1)];

      const next =
        points[Math.min(points.length - 1, index + 1)];

      const tangent = normalizeVector(
        subtractPoints(next, previous),
      );

      let normal = perpendicularVector(tangent);

      if (dotProduct(normal, preferredNormal) < 0) {
        normal = scalePoint(normal, -1);
      }

      return {
        amount:
          index /
          Math.max(1, points.length - 1),

        point: copyPoint(source),
        tangent: tangent,
        normal: normalizeVector(normal),
      };
    });
  }

  /* ==========================
     AXIS / CANTHI
  ========================== */

  function createAxisModel(anatomy) {
    const landmarks = anatomy.landmarks || {};

    const sourceInner = landmarks.innerCanthus;
    const sourceOuter = landmarks.outerCanthus;

    if (!sourceInner || !sourceOuter) {
      return null;
    }

    const sourceVector = subtractPoints(
      sourceOuter,
      sourceInner,
    );

    const sourceAxis = normalizeVector(sourceVector);

    let upperNormal = perpendicularVector(sourceAxis);

    if (upperNormal.y > 0) {
      upperNormal = scalePoint(upperNormal, -1);
    }

    const width = Math.max(
      1,
      vectorLength(sourceVector),
    );

    /*
        Medial side sits lower toward the nose.
        Lateral side is only slightly higher.
    */

    const medialDrop = clamp(
      width * 0.045,
      2.8,
      4.4,
    );

    const lateralLift = clamp(
      width * 0.010,
      0.5,
      1.0,
    );

    const innerCanthus = addPoints(
      sourceInner,
      scalePoint(upperNormal, -medialDrop),
    );

    const outerCanthus = addPoints(
      sourceOuter,
      scalePoint(upperNormal, lateralLift),
    );

    const axisVector = subtractPoints(
      outerCanthus,
      innerCanthus,
    );

    const axis = normalizeVector(axisVector);

    upperNormal = perpendicularVector(axis);

    if (upperNormal.y > 0) {
      upperNormal = scalePoint(upperNormal, -1);
    }

    return {
      sourceInnerCanthus: copyPoint(sourceInner),
      sourceOuterCanthus: copyPoint(sourceOuter),

      innerCanthus: copyPoint(innerCanthus),
      outerCanthus: copyPoint(outerCanthus),

      axis: axis,
      upperNormal: upperNormal,
      lowerNormal: scalePoint(upperNormal, -1),

      width: Math.max(1, vectorLength(axisVector)),

      center: mixPoints(
        innerCanthus,
        outerCanthus,
        0.5,
      ),

      medialDrop: medialDrop,
      lateralLift: lateralLift,
    };
  }

  /* ==========================
     PROFILES
  ========================== */

  function upperEdgeProfile(amount) {
    const t = clamp(amount, 0, 1);

    const shifted = clamp(
      (t - 0.025) / 0.975,
      0,
      1,
    );

    const arch = Math.pow(
      Math.max(0, Math.sin(Math.PI * shifted)),
      0.78,
    );

    const innerRelease = smoothStep(0, 0.22, t);

    const outerRelease =
      1 - smoothStep(0.86, 1, t);

    const outerBias = mix(
      0.91,
      1.09,
      smoothStep(0.20, 0.68, t),
    );

    return (
      arch *
      innerRelease *
      outerRelease *
      outerBias
    );
  }

  function upperTissueProfile(amount) {
    const t = clamp(amount, 0, 1);

    return (
      Math.pow(
        Math.max(0, Math.sin(Math.PI * t)),
        0.75,
      ) *
      smoothStep(0, 0.12, t) *
      (1 - smoothStep(0.90, 1, t))
    );
  }

  function lowerEdgeProfile(amount) {
    const t = clamp(amount, 0, 1);

    const shifted = clamp(
      (t - 0.01) / 0.99,
      0,
      1,
    );

    const arch = Math.pow(
      Math.max(0, Math.sin(Math.PI * shifted)),
      1.08,
    );

    const innerRelease = smoothStep(0, 0.11, t);

    const outerRelease =
      1 - smoothStep(0.91, 1, t);

    /*
        Fuller beneath the iris, with the low point
        shifted slightly toward the outer half.
    */
    const supportBias = mix(
      0.94,
      1.12,
      smoothStep(0.34, 0.70, t),
    );

    const outerRise =
      1 - 0.16 * smoothStep(0.74, 1, t);

    return (
      arch *
      innerRelease *
      outerRelease *
      supportBias *
      outerRise
    );
  }

  function lowerTissueProfile(amount) {
    const t = clamp(amount, 0, 1);

    return (
      Math.pow(
        Math.max(0, Math.sin(Math.PI * t)),
        0.92,
      ) *
      smoothStep(0, 0.15, t) *
      (1 - smoothStep(0.88, 1, t))
    );
  }

  /* ==========================
     GLOBE
  ========================== */

  function buildGlobe(anatomy, axisModel) {
    const irisRadius = number(
      anatomy.iris && anatomy.iris.radius,
      13.5,
    );

    const globeRadius = Math.max(
      irisRadius * 1.7,
      axisModel.width * 0.31,
    );

    const globeCenter =
      anatomy.landmarks &&
      anatomy.landmarks.globeCenter
        ? copyPoint(anatomy.landmarks.globeCenter)
        : copyPoint(
            anatomy.landmarks.irisCenter ||
              axisModel.center,
          );

    return {
      type: "globe",

      center: globeCenter,
      radius: globeRadius,

      radiusX: number(
        anatomy.landmarks &&
          anatomy.landmarks.globeRadiusX,
        globeRadius,
      ),

      radiusY: number(
        anatomy.landmarks &&
          anatomy.landmarks.globeRadiusY,
        globeRadius,
      ),

      iris: {
        center: copyPoint(anatomy.iris.center),
        radius: anatomy.iris.radius,
      },

      pupil: {
        center: copyPoint(anatomy.pupil.center),
        radius: anatomy.pupil.radius,
      },
    };
  }

  /* ==========================
     UPPER LID
  ========================== */

  function buildUpperLid(anatomy, axisModel) {
    if (
      !window.EyeUpperLid ||
      typeof window.EyeUpperLid.build !== "function"
    ) {
      throw new Error(
        "EyeUpperLid is unavailable. Load eyeUpperLid.js before eyeAssembly.js.",
      );
    }

    return window.EyeUpperLid.build(
      anatomy,
      axisModel,
    );
  }

  /* ==========================
     LOWER LID
  ========================== */

  function buildLowerLid(anatomy, axisModel) {
    if (
      !window.EyeLowerLid ||
      typeof window.EyeLowerLid.build !== "function"
    ) {
      throw new Error(
        "EyeLowerLid is unavailable. Load eyeLowerLid.js before eyeAssembly.js.",
      );
    }

    return window.EyeLowerLid.build(
      anatomy,
      axisModel,
    );
  }

  /* ==========================
     CANTHI
  ========================== */

  function buildCanthi(
    axisModel,
    upperLid,
    lowerLid,
  ) {
    if (
      !window.EyeCanthus ||
      typeof window.EyeCanthus.build !== "function"
    ) {
      throw new Error(
        "EyeCanthus is unavailable. Load eyeCanthus.js before eyeAssembly.js.",
      );
    }

    return window.EyeCanthus.build(
      axisModel,
      upperLid,
      lowerLid,
    );
  }

  /* ==========================
     OPENING
  ========================== */

  function buildOpening(
    upperLid,
    lowerLid,
    medialCanthus,
    lateralCanthus,
  ) {
    /*
        Force both ends to share exact connection points.
    */

    const upperPoints = upperLid.points.map(copyPoint);
    const lowerPoints = lowerLid.points.map(copyPoint);

    upperPoints[0] = copyPoint(
      medialCanthus.upperJoin,
    );

    lowerPoints[0] = copyPoint(
      medialCanthus.lowerJoin,
    );

    upperPoints[
      upperPoints.length - 1
    ] = copyPoint(
      lateralCanthus.point,
    );

    lowerPoints[
      lowerPoints.length - 1
    ] = copyPoint(
      lateralCanthus.point,
    );

    const upperPath = createSmoothPath(upperPoints);

    const lowerPath = createSmoothPath(
      reversePoints(lowerPoints),
    );

    return {
      type: "opening",

      path: [
        upperPath,
        removeInitialMove(lowerPath),
        "Z",
      ].join(" "),

      upperPath: upperPath,
      lowerPath: lowerPath,

      upperSamples: decorateSamples(
        upperPoints,
        point(0, -1),
      ),

      lowerSamples: decorateSamples(
        lowerPoints,
        point(0, 1),
      ),
    };
  }

  /* ==========================
     BUILD
  ========================== */

  function build(inputSettings) {
    if (
      !window.EyeBuilder ||
      typeof window.EyeBuilder.build !== "function"
    ) {
      throw new Error(
        "EyeAssembly requires EyeBuilder. Load eyeBuilder.js before eyeAssembly.js.",
      );
    }

    const anatomy = window.EyeBuilder.build(
      inputSettings,
    );

    const axisModel = createAxisModel(anatomy);

    if (!axisModel) {
      return anatomy;
    }

    const globe = buildGlobe(
      anatomy,
      axisModel,
    );

    const upperLid = buildUpperLid(
      anatomy,
      axisModel,
    );

    const lowerLid = buildLowerLid(
      anatomy,
      axisModel,
    );

    const canthi = buildCanthi(
      axisModel,
      upperLid,
      lowerLid,
    );

    const medialCanthus = canthi.medial;

    const lateralCanthus = canthi.lateral;

    const opening = buildOpening(
      upperLid,
      lowerLid,
      medialCanthus,
      lateralCanthus,
    );

    const assembly = {
      type: "eyeAssembly",
      version: "1.7.0",

      side: anatomy.side,
      settings: anatomy.settings,
      parameters: anatomy.parameters,
      transform: anatomy.transform,

      axis: axisModel,
      globe: globe,

      upperLid: upperLid,
      lowerLid: lowerLid,

      medialCanthus: medialCanthus,
      lateralCanthus: lateralCanthus,

      tearDuct: medialCanthus.tearDuct,

      socket: anatomy.socket,
      opening: opening,

      sourceAnatomy: anatomy,
    };

    return {
      ...anatomy,

      assembly: assembly,
      globe: globe,

      opening: opening,

      upperLid: {
        ...anatomy.upperLid,

        path: upperLid.edgePath,
        samples: upperLid.samples,

        tissuePath: upperLid.tissuePath,
        component: upperLid,
      },

      lowerLid: {
        ...anatomy.lowerLid,

        path: lowerLid.edgePath,
        samples: lowerLid.samples,

        tissuePath: lowerLid.tissuePath,
        component: lowerLid,
      },

      medialCanthus: medialCanthus,
      innerCanthus: medialCanthus,

      lateralCanthus: lateralCanthus,
      outerCanthus: lateralCanthus,

      tearDuct: medialCanthus.tearDuct,

      components: {
        globe: globe,
        upperLid: upperLid,
        lowerLid: lowerLid,
        medialCanthus: medialCanthus,
        lateralCanthus: lateralCanthus,
        tearDuct: medialCanthus.tearDuct,
        opening: opening,
        socket: anatomy.socket,
      },
    };
  }

  window.EyeAssembly = {
    version: "1.7.0",

    build: build,
    buildUpperLid: buildUpperLid,
    buildLowerLid: buildLowerLid,
    buildCanthi: buildCanthi,
  };

  console.log("EyeAssembly 1.7 loaded");
})();
