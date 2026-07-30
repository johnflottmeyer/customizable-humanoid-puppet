/* =========================================================
   FACELAB EYE SURFACE
   Version 1.2.0

   PURPOSE

   Generates a neutral human eyelid shape from the eye axis
   instead of drawing directly through peak and shoulder
   landmarks.

   Anatomical landmarks influence the eye proportions, but
   the final eyelid opening is generated from stable upper
   and lower lid profiles.

   LOAD AFTER:
   js/eyes/eyeGeometry.js

   LOAD BEFORE:
   js/eyes/eyeRig.js
   js/eyes/eyeBuilder.js
========================================================= */

(function initializeEyeSurface() {
  "use strict";

  if (!window.EyeGeometry || typeof window.EyeGeometry.build !== "function") {
    console.error(
      "EyeSurface requires EyeGeometry. Load eyeGeometry.js before eyeSurface.js.",
    );

    return;
  }

  const originalBuild = window.EyeGeometry.build.bind(window.EyeGeometry);

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

    return point(vector.x / length, vector.y / length);
  }

  function perpendicularVector(vector) {
    return point(-vector.y, vector.x);
  }

  function pointDistance(first, second) {
    return Math.hypot(second.x - first.x, second.y - first.y);
  }

  function dotProduct(first, second) {
    return first.x * second.x + first.y * second.y;
  }

  /* ==========================
     HUMAN UPPER LID PROFILE
  ========================== */

  function upperLidProfile(amount) {
    const t = clamp(amount, 0, 1);

    /*
        Shift the arch slightly toward the outer side.

        This avoids a perfectly centered mathematical arch
        while keeping the upper lid broad and continuous.
    */

    const shiftedT = clamp(
      (t - 0.015) / 0.985,

      0,
      1,
    );

    /*
        A higher exponent than the previous version prevents
        the middle from becoming too flat or inflated.
    */

    const broadArch = Math.pow(
      Math.max(
        0,

        Math.sin(Math.PI * shiftedT),
      ),

      0.92,
    );

    /*
        Allow the upper lid to leave the inner canthus
        gradually rather than rising immediately.
    */

    const innerRelease = smoothStep(0, 0.08, t);

    /*
        Taper gently toward the outer canthus.
    */

    const outerRelease = 1 - smoothStep(0.93, 1, t);

    /*
        The temporal side receives slightly more height.

        This moves the broadest section away from the nasal
        corner without introducing a visible peak.
    */

    const outerBias = mix(
      0.96,
      1.07,

      smoothStep(0.28, 0.7, t),
    );

    return broadArch * innerRelease * outerRelease * outerBias;
  }

  /* ==========================
     HUMAN LOWER LID PROFILE
  ========================== */

  function lowerLidProfile(amount) {
    const t = clamp(amount, 0, 1);

    /*
        The lower lid is shallower than the upper lid, but it
        should still have a visible curved contour.

        The lower exponent gives the eye more vertical balance
        than the nearly straight earlier version.
    */

    const arch = Math.pow(
      Math.max(
        0,

        Math.sin(Math.PI * t),
      ),

      1.18,
    );

    /*
        Preserve a broad lower contour instead of creating a
        sharp central low point.
    */

    const centerShape =
      0.9 +
      0.1 *
        Math.pow(
          Math.abs(t - 0.5) * 2,

          1.3,
        );

    /*
        Slightly reduce the depth toward the outer corner.

        This lets the lower lid rise into the lateral canthus
        instead of hanging beneath it.
    */

    const outerRise = 1 - 0.12 * smoothStep(0.58, 0.92, t);

    return arch * centerShape * outerRise;
  }

  /* ==========================
     LANDMARK MEASUREMENT
  ========================== */

  function measureLandmarkOffset(landmark, axisPoint, direction) {
    if (!landmark) {
      return 0;
    }

    return dotProduct(
      subtractPoints(landmark, axisPoint),

      direction,
    );
  }

  function resolveSurfaceMeasurements(landmarks) {
    const innerCanthus = landmarks.innerCanthus;

    const outerCanthus = landmarks.outerCanthus;

    const eyeAxisVector = subtractPoints(outerCanthus, innerCanthus);

    const width = Math.max(
      4,

      vectorLength(eyeAxisVector),
    );

    const eyeAxis = normalizeVector(eyeAxisVector);

    let upperNormal = perpendicularVector(eyeAxis);

    /*
        SVG coordinates increase downward.

        The upper normal must point toward negative Y.
    */

    if (upperNormal.y > 0) {
      upperNormal = scalePoint(upperNormal, -1);
    }

    const lowerNormal = scalePoint(upperNormal, -1);

    const middleAxisPoint = mixPoints(innerCanthus, outerCanthus, 0.5);

    const requestedUpperHeight = Math.abs(
      measureLandmarkOffset(
        landmarks.upperPeak,

        middleAxisPoint,

        upperNormal,
      ),
    );

    const requestedLowerDepth = Math.abs(
      measureLandmarkOffset(
        landmarks.lowerLow,

        middleAxisPoint,

        lowerNormal,
      ),
    );

    /*
        Human-neutral proportional limits.

        These limits keep old FaceLab slider values from
        producing diamond-shaped or extremely compressed eyes.
    */

    const upperHeight = clamp(
      requestedUpperHeight,

      width * 0.14,

      width * 0.19,
    );

    const lowerDepth = clamp(
      requestedLowerDepth,

      width * 0.055,

      width * 0.085,
    );

    return {
      innerCanthus: copyPoint(innerCanthus),

      outerCanthus: copyPoint(outerCanthus),

      eyeAxis: eyeAxis,

      upperNormal: upperNormal,

      lowerNormal: lowerNormal,

      width: width,

      upperHeight: upperHeight,

      lowerDepth: lowerDepth,
    };
  }

  /* ==========================
     SAMPLE GENERATION
  ========================== */

  function generateLidSamples(landmarks, parameters) {
    const measurements = resolveSurfaceMeasurements(landmarks);

    const sampleCount = clamp(
      Math.floor(
        safeNumber(
          parameters && parameters.sampleCount,

          18,
        ) * 3,
      ),

      36,
      72,
    );

    const upperSamples = [];
    const lowerSamples = [];

    for (let index = 0; index <= sampleCount; index += 1) {
      const amount = index / sampleCount;

      const axisPoint = mixPoints(
        measurements.innerCanthus,

        measurements.outerCanthus,

        amount,
      );

      const upperAmount = upperLidProfile(amount);

      const lowerAmount = lowerLidProfile(amount);

      const upperPoint = addPoints(
        axisPoint,

        scalePoint(
          measurements.upperNormal,

          measurements.upperHeight * upperAmount,
        ),
      );

      const lowerPoint = addPoints(
        axisPoint,

        scalePoint(
          measurements.lowerNormal,

          measurements.lowerDepth * lowerAmount,
        ),
      );

      upperSamples.push({
        amount: amount,

        point: upperPoint,
      });

      lowerSamples.push({
        amount: amount,

        point: lowerPoint,
      });
    }

    decorateSamples(
      upperSamples,

      measurements.upperNormal,
    );

    decorateSamples(
      lowerSamples,

      measurements.lowerNormal,
    );

    return {
      ...measurements,

      upperSamples: upperSamples,

      lowerSamples: lowerSamples,
    };
  }

  /* ==========================
     SAMPLE TANGENTS / NORMALS
  ========================== */

  function decorateSamples(samples, preferredNormal) {
    samples.forEach(function decorateSample(sample, index) {
      const previous = samples[Math.max(0, index - 1)].point;

      const next = samples[Math.min(samples.length - 1, index + 1)].point;

      const tangent = normalizeVector(subtractPoints(next, previous));

      let normal = perpendicularVector(tangent);

      if (dotProduct(normal, preferredNormal) < 0) {
        normal = scalePoint(normal, -1);
      }

      sample.tangent = tangent;

      sample.normal = normalizeVector(normal);
    });
  }

  /* ==========================
     PATH FROM SAMPLES
  ========================== */

  function createPathFromSamples(samples) {
    if (!samples.length) {
      return "";
    }

    const commands = [`M ${samples[0].point.x} ${samples[0].point.y}`];

    for (let index = 1; index < samples.length; index += 1) {
      const previous = samples[Math.max(0, index - 2)].point;

      const current = samples[index - 1].point;

      const next = samples[index].point;

      const after = samples[Math.min(samples.length - 1, index + 1)].point;

      /*
          Catmull-Rom style controls connect the samples
          smoothly without redefining the anatomical profile.
      */

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

  /* ==========================
     SAMPLE METRICS
  ========================== */

  function calculateSampleLength(samples) {
    let total = 0;

    for (let index = 1; index < samples.length; index += 1) {
      total += pointDistance(
        samples[index - 1].point,

        samples[index].point,
      );
    }

    return total;
  }

  function calculateBounds(samples) {
    if (!samples.length) {
      return {
        minX: 0,
        minY: 0,

        maxX: 0,
        maxY: 0,

        width: 0,
        height: 0,

        centerX: 0,
        centerY: 0,
      };
    }

    let minX = samples[0].point.x;

    let minY = samples[0].point.y;

    let maxX = samples[0].point.x;

    let maxY = samples[0].point.y;

    samples.forEach(function inspectSample(sample) {
      minX = Math.min(minX, sample.point.x);

      minY = Math.min(minY, sample.point.y);

      maxX = Math.max(maxX, sample.point.x);

      maxY = Math.max(maxY, sample.point.y);
    });

    return {
      minX: minX,

      minY: minY,

      maxX: maxX,

      maxY: maxY,

      width: maxX - minX,

      height: maxY - minY,

      centerX: (minX + maxX) / 2,

      centerY: (minY + maxY) / 2,
    };
  }

  /* ==========================
     SAMPLE INTERPOLATION
  ========================== */

  function interpolateSample(samples, amount) {
    const resolvedAmount = clamp(
      safeNumber(amount, 0),

      0,
      1,
    );

    const scaledIndex = resolvedAmount * (samples.length - 1);

    const lowerIndex = Math.floor(scaledIndex);

    const upperIndex = Math.min(
      samples.length - 1,

      lowerIndex + 1,
    );

    const localAmount = scaledIndex - lowerIndex;

    const lowerSample = samples[lowerIndex];

    const upperSample = samples[upperIndex];

    return {
      amount: resolvedAmount,

      point: mixPoints(
        lowerSample.point,

        upperSample.point,

        localAmount,
      ),

      tangent: normalizeVector(
        mixPoints(
          lowerSample.tangent,

          upperSample.tangent,

          localAmount,
        ),
      ),

      normal: normalizeVector(
        mixPoints(
          lowerSample.normal,

          upperSample.normal,

          localAmount,
        ),
      ),
    };
  }

  /* ==========================
     CURVE OBJECT
  ========================== */

  function createCurveObject(samples) {
    const path = createPathFromSamples(samples);

    const bounds = calculateBounds(samples);

    return {
      path: path,

      samples: samples,

      length: calculateSampleLength(samples),

      bounds: bounds,

      boundingBox: bounds,

      sample: function sampleCurve(amount) {
        return interpolateSample(samples, amount);
      },

      point: function getCurvePoint(amount) {
        return copyPoint(interpolateSample(samples, amount).point);
      },

      tangent: function getCurveTangent(amount) {
        return copyPoint(interpolateSample(samples, amount).tangent);
      },

      normal: function getCurveNormal(amount) {
        return copyPoint(interpolateSample(samples, amount).normal);
      },
    };
  }

  /* ==========================
     BUILD HUMAN EYE SURFACE
  ========================== */

  function buildSurface(landmarks, parameters) {
    const generated = generateLidSamples(
      landmarks,

      parameters || {},
    );

    const upperLid = createCurveObject(generated.upperSamples);

    /*
        The renderer expects the lower path to travel from the
        outer canthus back toward the inner canthus.
    */

    const reversedLowerSamples = generated.lowerSamples
      .slice()
      .reverse()
      .map(function reverseSample(sample, index, samples) {
        return {
          amount:
            index /
            Math.max(
              1,

              samples.length - 1,
            ),

          point: copyPoint(sample.point),

          tangent: scalePoint(sample.tangent, -1),

          normal: copyPoint(sample.normal),
        };
      });

    const lowerLid = createCurveObject(reversedLowerSamples);

    /*
        Remove the lower path's initial move command so it
        continues from the end of the upper lid.
    */

    const lowerOpeningPath = lowerLid.path.replace(
      /^M\s+[-\d.eE+]+\s+[-\d.eE+]+/,
      "",
    );

    const openingPath = [upperLid.path, lowerOpeningPath, "Z"].join(" ");

    const combinedSamples = [...upperLid.samples, ...lowerLid.samples];

    const openingBounds = calculateBounds(combinedSamples);

    const opening = {
      path: openingPath,

      upperPath: upperLid.path,

      lowerPath: lowerLid.path,

      upperSamples: upperLid.samples,

      lowerSamples: lowerLid.samples,

      samples: combinedSamples,

      upperCurve: upperLid,

      lowerCurve: lowerLid,

      length: upperLid.length + lowerLid.length,

      bounds: openingBounds,

      boundingBox: openingBounds,

      resolvedLandmarks: {
        tearDuct: copyPoint(landmarks.tearDuct),

        innerCanthus: copyPoint(landmarks.innerCanthus),

        outerCanthus: copyPoint(landmarks.outerCanthus),

        upperPeak: copyPoint(landmarks.upperPeak),

        lowerLow: copyPoint(landmarks.lowerLow),

        eyeAxis: copyPoint(landmarks.eyeAxis),
      },
    };

    return {
      opening: opening,

      upperLid: upperLid,

      lowerLid: lowerLid,

      upperHeight: generated.upperHeight,

      lowerDepth: generated.lowerDepth,

      width: generated.width,
    };
  }

  /* ==========================
     GEOMETRY OVERRIDE
  ========================== */

  function build(landmarks, parameters) {
    const legacyGeometry = originalBuild(landmarks, parameters);

    if (
      !landmarks ||
      !landmarks.innerCanthus ||
      !landmarks.outerCanthus ||
      !landmarks.upperPeak ||
      !landmarks.lowerLow
    ) {
      return legacyGeometry;
    }

    const surface = buildSurface(
      landmarks,

      parameters || {},
    );

    return {
      ...legacyGeometry,

      opening: surface.opening,

      upperLid: surface.upperLid,

      lowerLid: surface.lowerLid,

      upperSamples: surface.upperLid.samples,

      lowerSamples: surface.lowerLid.samples,

      upperSurface: surface.upperLid,

      lowerSurface: surface.lowerLid,

      openingSurface: surface.opening,

      surfaceMetrics: {
        width: surface.width,

        upperHeight: surface.upperHeight,

        lowerDepth: surface.lowerDepth,
      },
    };
  }

  /* ==========================
     PUBLIC API
  ========================== */

  window.EyeSurface = {
    version: "1.2.0",

    build: buildSurface,

    upperProfile: upperLidProfile,

    lowerProfile: lowerLidProfile,
  };

  window.EyeGeometry.build = build;

  window.EyeGeometry.version = "1.2.0 + EyeSurface 1.2";

  console.log("EyeSurface 1.2 loaded");
})();
