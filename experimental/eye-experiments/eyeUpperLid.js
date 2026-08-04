/* =========================================================
   FACELAB EYE UPPER LID
   Version 1.2.0

   PURPOSE

   Builds the upper eyelid as an independent anatomical
   component with separate:

   - lid edge
   - skin surface
   - tarsal plate
   - lash margin
   - crease
   - animation-ready landmarks

   LOAD BEFORE:
   js/eyes/eyeAssembly.js
========================================================= */

(function initializeEyeUpperLid() {
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

      const current = points[index - 1];
      const next = points[index];

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

    const returnPath = createSmoothPath(
      reversePoints(outerPoints),
    );

    return [
      edgePath,
      removeInitialMove(returnPath),
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

  function edgeProfile(amount) {
    const t = clamp(amount, 0, 1);

    let value;

    if (t < 0.34) {
      const local = t / 0.34;

      value =
        Math.pow(
          Math.sin(local * Math.PI * 0.5),
          1.18,
        ) * 0.88;
    } else if (t < 0.70) {
      const local =
        (t - 0.34) / 0.36;

      value =
        0.88 +
        Math.sin(local * Math.PI) * 0.12;
    } else {
      const local =
        (t - 0.70) / 0.30;

      value =
        Math.pow(
          Math.cos(local * Math.PI * 0.5),
          0.88,
        );
    }

    const medialRelease =
      smoothStep(0, 0.12, t);

    const lateralRelease =
      1 - smoothStep(0.92, 1, t);

    const outerBias =
      mix(
        0.96,
        1.06,
        smoothStep(0.40, 0.72, t),
      );

    return (
      value *
      medialRelease *
      lateralRelease *
      outerBias
    );
  }

  function tissueProfile(amount) {
    const t = clamp(amount, 0, 1);

    return (
      Math.pow(
        Math.max(0, Math.sin(Math.PI * t)),
        0.70,
      ) *
      smoothStep(0, 0.10, t) *
      (1 - smoothStep(0.91, 1, t))
    );
  }

  function plateProfile(amount) {
    const t = clamp(amount, 0, 1);

    return (
      Math.pow(
        Math.max(0, Math.sin(Math.PI * t)),
        0.90,
      ) *
      smoothStep(0, 0.08, t) *
      (1 - smoothStep(0.94, 1, t))
    );
  }

  function creaseProfile(amount) {
    const t = clamp(amount, 0, 1);

    return (
      Math.pow(
        Math.max(0, Math.sin(Math.PI * t)),
        0.78,
      ) *
      smoothStep(0, 0.17, t) *
      (1 - smoothStep(0.84, 1, t))
    );
  }

  function build(anatomy, axisModel, options) {
    if (!anatomy || !axisModel) {
      throw new Error(
        "EyeUpperLid.build requires anatomy and axisModel.",
      );
    }

    const settings = {
      sampleCount: 64,

      openingScale: 0.68,
      openingMinimumScale: 0.19,
      openingMaximumScale: 0.285,

      tissueScale: 0.145,
      tissueMinimum: 9,
      tissueMaximum: 16,

      tarsalScale: 0.045,
      tarsalMinimum: 2.4,
      tarsalMaximum: 5.2,

      creaseScale: 0.075,
      creaseMinimum: 5.5,
      creaseMaximum: 10,

      ...(options || {}),
    };

    const baseHeight = number(
      anatomy.settings && anatomy.settings.height,
      32,
    );

    const openingHeight = clamp(
      baseHeight * settings.openingScale,
      axisModel.width * settings.openingMinimumScale,
      axisModel.width * settings.openingMaximumScale,
    );

    const tissueThickness = clamp(
      axisModel.width * settings.tissueScale,
      settings.tissueMinimum,
      settings.tissueMaximum,
    );

    const tarsalHeight = clamp(
      axisModel.width * settings.tarsalScale,
      settings.tarsalMinimum,
      settings.tarsalMaximum,
    );

    const creaseOffset = clamp(
      axisModel.width * settings.creaseScale,
      settings.creaseMinimum,
      settings.creaseMaximum,
    );

    const edgePoints = [];
    const tissuePoints = [];
    const tarsalPoints = [];
    const creasePoints = [];

    for (
      let index = 0;
      index <= settings.sampleCount;
      index += 1
    ) {
      const amount =
        index / settings.sampleCount;

      const axisPoint = point(
        mix(
          axisModel.innerCanthus.x,
          axisModel.outerCanthus.x,
          amount,
        ),
        mix(
          axisModel.innerCanthus.y,
          axisModel.outerCanthus.y,
          amount,
        ),
      );

      const edge = addPoints(
        axisPoint,
        scalePoint(
          axisModel.upperNormal,
          openingHeight * edgeProfile(amount),
        ),
      );

      const tarsal = addPoints(
        edge,
        scalePoint(
          axisModel.upperNormal,
          tarsalHeight * plateProfile(amount),
        ),
      );

      const tissue = addPoints(
        edge,
        scalePoint(
          axisModel.upperNormal,
          tissueThickness * tissueProfile(amount),
        ),
      );

      const crease = addPoints(
        edge,
        scalePoint(
          axisModel.upperNormal,
          creaseOffset * creaseProfile(amount),
        ),
      );

      edgePoints.push(edge);
      tarsalPoints.push(tarsal);
      tissuePoints.push(tissue);
      creasePoints.push(crease);
    }

    const edgePath = createSmoothPath(edgePoints);
    const skinSurfacePath = createRibbonPath(
      tarsalPoints,
      tissuePoints,
    );

    const tarsalPlatePath = createRibbonPath(
      edgePoints,
      tarsalPoints,
    );

    const creasePath = createSmoothPath(
      creasePoints.slice(
        Math.floor(settings.sampleCount * 0.13),
        Math.ceil(settings.sampleCount * 0.87),
      ),
    );

    function pointAt(amount) {
      const index = Math.round(
        clamp(amount, 0, 1) *
          settings.sampleCount,
      );

      return copyPoint(edgePoints[index]);
    }

    return {
      type: "upperLid",
      version: "1.2.0",

      path: edgePath,
      edgePath: edgePath,

      tissuePath: skinSurfacePath,
      skinSurfacePath: skinSurfacePath,

      tarsalPlatePath: tarsalPlatePath,
      lashMarginPath: edgePath,
      creasePath: creasePath,

      points: edgePoints,
      edgePoints: edgePoints,
      tarsalPoints: tarsalPoints,
      outerSurfacePoints: tissuePoints,
      creasePoints: creasePoints,

      samples: decorateSamples(
        edgePoints,
        axisModel.upperNormal,
      ),

      surfaceSamples: decorateSamples(
        tissuePoints,
        axisModel.upperNormal,
      ),

      thickness: tissueThickness,
      tarsalHeight: tarsalHeight,
      exposure: openingHeight,
      creaseOffset: creaseOffset,

      medialAttachment: copyPoint(edgePoints[0]),

      lateralAttachment: copyPoint(
        edgePoints[edgePoints.length - 1],
      ),

      landmarks: {
        medialCanthus: copyPoint(edgePoints[0]),
        medialShoulder: pointAt(0.16),
        medialCrest: pointAt(0.34),
        centerCrest: pointAt(0.52),
        lateralCrest: pointAt(0.67),
        lateralShoulder: pointAt(0.84),

        lateralCanthus: copyPoint(
          edgePoints[edgePoints.length - 1],
        ),
      },

      animation: {
        blinkWeight: 0.88,
        squintWeight: 0.58,
        wideWeight: 0.72,
      },
    };
  }

  window.EyeUpperLid = {
    version: "1.2.0",
    build: build,
  };

  console.log("EyeUpperLid 1.2 loaded");
})();
