/* =========================================================
   FACELAB EYE LOWER LID
   Version 1.1.0

   PURPOSE

   Builds the lower eyelid as an independent anatomical
   component with a medial shelf, outward-shifted low point,
   lateral shelf, visible tissue and tear-trough guide.

   LOAD BEFORE:
   js/eyes/eyeAssembly.js
========================================================= */

(function initializeEyeLowerLid() {
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
    return source ? point(source.x, source.y) : point(0, 0);
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

  function dotProduct(first, second) {
    return first.x * second.x + first.y * second.y;
  }

  function reversePoints(points) {
    return points.slice().reverse().map(copyPoint);
  }

  function createSmoothPath(points) {
    if (!points || points.length === 0) {
      return "";
    }

    if (points.length === 1) {
      return `M ${points[0].x} ${points[0].y}`;
    }

    const commands = [`M ${points[0].x} ${points[0].y}`];

    for (let index = 1; index < points.length; index += 1) {
      const previous = points[Math.max(0, index - 2)];
      const current = points[index - 1];
      const next = points[index];
      const after = points[Math.min(points.length - 1, index + 1)];

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
    const returnPath = createSmoothPath(
      reversePoints(outerPoints),
    );

    return [
      createSmoothPath(edgePoints),
      removeInitialMove(returnPath),
      "Z",
    ].join(" ");
  }

  function decorateSamples(points, preferredNormal) {
    return points.map(function decorate(source, index) {
      const previous = points[Math.max(0, index - 1)];
      const next = points[Math.min(points.length - 1, index + 1)];

      const tangent = normalizeVector(
        subtractPoints(next, previous),
      );

      let normal = perpendicularVector(tangent);

      if (dotProduct(normal, preferredNormal) < 0) {
        normal = scalePoint(normal, -1);
      }

      return {
        amount: index / Math.max(1, points.length - 1),
        point: copyPoint(source),
        tangent: tangent,
        normal: normalizeVector(normal),
      };
    });
  }

  function edgeProfile(amount) {
    const t = clamp(amount, 0, 1);

    let value;

    if (t < 0.28) {
      const local = t / 0.28;

      value =
        Math.pow(
          Math.sin(local * Math.PI * 0.5),
          1.35,
        ) * 0.52;
    } else if (t < 0.66) {
      const local =
        (t - 0.28) / 0.38;

      value =
        0.52 +
        Math.sin(local * Math.PI * 0.5) * 0.48;
    } else {
      const local =
        (t - 0.66) / 0.34;

      value =
        Math.pow(
          Math.cos(local * Math.PI * 0.5),
          1.15,
        );
    }

    return (
      value *
      smoothStep(0, 0.10, t) *
      (1 - smoothStep(0.93, 1, t)) *
      (1 - 0.16 * smoothStep(0.72, 1, t))
    );
  }

  function tissueProfile(amount) {
    const t = clamp(amount, 0, 1);

    return (
      Math.pow(
        Math.max(0, Math.sin(Math.PI * t)),
        0.88,
      ) *
      smoothStep(0, 0.13, t) *
      (1 - smoothStep(0.90, 1, t))
    );
  }

  function troughProfile(amount) {
    const t = clamp(amount, 0, 1);

    return (
      Math.pow(
        Math.max(0, Math.sin(Math.PI * t)),
        1.10,
      ) *
      smoothStep(0.05, 0.18, t) *
      (1 - smoothStep(0.78, 0.95, t))
    );
  }

  function build(anatomy, axisModel, options) {
    if (!anatomy || !axisModel) {
      throw new Error(
        "EyeLowerLid.build requires anatomy and axisModel.",
      );
    }

    const settings = {
      sampleCount: 64,

      openingScale: 0.39,
      openingMinimumScale: 0.095,
      openingMaximumScale: 0.155,

      tissueScale: 0.105,
      tissueMinimum: 6.5,
      tissueMaximum: 12,

      supportScale: 0.042,
      supportMinimum: 2,
      supportMaximum: 5.2,

      troughScale: 0.060,
      troughMinimum: 4.5,
      troughMaximum: 8.5,

      ...(options || {}),
    };

    const baseHeight = number(
      anatomy.settings && anatomy.settings.height,
      32,
    );

    const openingDepth = clamp(
      baseHeight * settings.openingScale,
      axisModel.width * settings.openingMinimumScale,
      axisModel.width * settings.openingMaximumScale,
    );

    const tissueThickness = clamp(
      axisModel.width * settings.tissueScale,
      settings.tissueMinimum,
      settings.tissueMaximum,
    );

    const supportHeight = clamp(
      axisModel.width * settings.supportScale,
      settings.supportMinimum,
      settings.supportMaximum,
    );

    const troughOffset = clamp(
      axisModel.width * settings.troughScale,
      settings.troughMinimum,
      settings.troughMaximum,
    );

    const edgePoints = [];
    const supportPoints = [];
    const tissuePoints = [];
    const troughPoints = [];

    for (
      let index = 0;
      index <= settings.sampleCount;
      index += 1
    ) {
      const amount = index / settings.sampleCount;

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
          axisModel.lowerNormal,
          openingDepth * edgeProfile(amount),
        ),
      );

      const support = addPoints(
        edge,
        scalePoint(
          axisModel.lowerNormal,
          supportHeight * tissueProfile(amount),
        ),
      );

      const tissue = addPoints(
        edge,
        scalePoint(
          axisModel.lowerNormal,
          tissueThickness * tissueProfile(amount),
        ),
      );

      const trough = addPoints(
        edge,
        scalePoint(
          axisModel.lowerNormal,
          troughOffset * troughProfile(amount),
        ),
      );

      edgePoints.push(edge);
      supportPoints.push(support);
      tissuePoints.push(tissue);
      troughPoints.push(trough);
    }

    const edgePath = createSmoothPath(edgePoints);

    const tarsalPlatePath = createRibbonPath(
      edgePoints,
      supportPoints,
    );

    const tissuePath = createRibbonPath(
      supportPoints,
      tissuePoints,
    );

    const tearTroughPath = createSmoothPath(
      troughPoints.slice(
        Math.floor(settings.sampleCount * 0.12),
        Math.ceil(settings.sampleCount * 0.82),
      ),
    );

    function pointAt(amount) {
      return copyPoint(
        edgePoints[
          Math.round(
            clamp(amount, 0, 1) *
              settings.sampleCount,
          )
        ],
      );
    }

    return {
      type: "lowerLid",
      version: "1.1.0",

      path: edgePath,
      edgePath: edgePath,

      tissuePath: tissuePath,
      skinSurfacePath: tissuePath,

      tarsalPlatePath: tarsalPlatePath,
      lashMarginPath: edgePath,
      tearTroughPath: tearTroughPath,

      points: edgePoints,
      edgePoints: edgePoints,
      supportPoints: supportPoints,
      outerSurfacePoints: tissuePoints,
      troughPoints: troughPoints,

      samples: decorateSamples(
        edgePoints,
        axisModel.lowerNormal,
      ),

      surfaceSamples: decorateSamples(
        tissuePoints,
        axisModel.lowerNormal,
      ),

      thickness: tissueThickness,
      support: openingDepth,
      tarsalHeight: supportHeight,
      troughOffset: troughOffset,

      medialAttachment: copyPoint(edgePoints[0]),

      lateralAttachment: copyPoint(
        edgePoints[edgePoints.length - 1],
      ),

      landmarks: {
        medialCanthus: copyPoint(edgePoints[0]),
        medialShelf: pointAt(0.18),
        tearTrough: pointAt(0.34),
        infraorbitalSupport: pointAt(0.58),
        lateralShelf: pointAt(0.80),
        lateralCanthus: copyPoint(
          edgePoints[edgePoints.length - 1],
        ),
      },

      animation: {
        blinkWeight: 0.28,
        smileWeight: 0.52,
        squintWeight: 0.42,
        wideWeight: 0.18,
      },
    };
  }

  window.EyeLowerLid = {
    version: "1.1.0",
    build: build,
  };

  console.log("EyeLowerLid 1.1 loaded");
})();
