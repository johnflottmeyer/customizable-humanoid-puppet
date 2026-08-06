/* =========================================================
   FACELAB EYE SURFACE
   Version 2.1.0

   PURPOSE

   Builds a more human eye opening from separate anatomical
   regions:

   - upper lid edge
   - lower lid edge
   - inner canthus transition
   - tear duct surface
   - outer canthus transition

   The medial corner is allowed to sit lower toward the nose,
   the upper crest is shifted outward, and the lower lid is
   fuller beneath the iris.

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

  const baseGeometryBuild = window.EyeGeometry.build.bind(window.EyeGeometry);

  /* ==========================
     HELPERS
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
    const amount = clamp((value - start) / Math.max(0.0001, end - start), 0, 1);

    return amount * amount * (3 - 2 * amount);
  }

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
     ANATOMICAL PROFILES
  ========================== */

  /*
      Broad upper lid with the crest shifted toward the
      temporal side. This is deliberately not symmetrical.
  */
  function upperLidProfile(amount) {
    const t = clamp(amount, 0, 1);

    const shifted = clamp((t - 0.035) / 0.965, 0, 1);

    const arch = Math.pow(Math.max(0, Math.sin(Math.PI * shifted)), 0.86);

    const medialRelease = smoothStep(0, 0.075, t);
    const temporalRelease = 1 - smoothStep(0.94, 1, t);

    const temporalBias = mix(0.93, 1.1, smoothStep(0.22, 0.68, t));

    const outerTaper = 1 - 0.1 * smoothStep(0.76, 1, t);

    return arch * medialRelease * temporalRelease * temporalBias * outerTaper;
  }

  /*
      Lower lid remains shallower than the upper lid, but has
      enough volume to support the globe. Its low region is
      shifted slightly outward instead of sitting at center.
  */
  function lowerLidProfile(amount) {
    const t = clamp(amount, 0, 1);

    const shifted = clamp((t - 0.015) / 0.985, 0, 1);

    const arch = Math.pow(Math.max(0, Math.sin(Math.PI * shifted)), 1.22);

    const medialRelease = smoothStep(0, 0.07, t);
    const temporalRelease = 1 - smoothStep(0.95, 1, t);

    const supportBias = mix(0.94, 1.08, smoothStep(0.38, 0.76, t));

    const temporalRise = 1 - 0.14 * smoothStep(0.72, 0.96, t);

    return arch * medialRelease * temporalRelease * supportBias * temporalRise;
  }

  /* ==========================
     SURFACE MEASUREMENTS
  ========================== */

  function measureLandmarkOffset(landmark, axisPoint, direction) {
    if (!landmark) {
      return 0;
    }

    return dotProduct(subtractPoints(landmark, axisPoint), direction);
  }

  function resolveSurfaceMeasurements(landmarks) {
    const sourceInner = landmarks.innerCanthus;
    const sourceOuter = landmarks.outerCanthus;

    const sourceAxisVector = subtractPoints(sourceOuter, sourceInner);

    const sourceAxis = normalizeVector(sourceAxisVector);

    let upperNormal = perpendicularVector(sourceAxis);

    if (upperNormal.y > 0) {
      upperNormal = scalePoint(upperNormal, -1);
    }

    const lowerNormal = scalePoint(upperNormal, -1);

    const sourceWidth = Math.max(4, vectorLength(sourceAxisVector));

    /*
        The medial corner sits lower toward the nose.
        The outer corner receives only a slight lift.
    */
    const medialDrop = clamp(sourceWidth * 0.045, 2.8, 4.4);

    const temporalLift = clamp(sourceWidth * 0.005, 0.2, 0.55);

    const innerCanthus = addPoints(
      sourceInner,
      scalePoint(lowerNormal, medialDrop),
    );

    const outerCanthus = addPoints(
      sourceOuter,
      scalePoint(upperNormal, temporalLift),
    );

    const eyeAxisVector = subtractPoints(outerCanthus, innerCanthus);

    const width = Math.max(4, vectorLength(eyeAxisVector));

    const eyeAxis = normalizeVector(eyeAxisVector);

    upperNormal = perpendicularVector(eyeAxis);

    if (upperNormal.y > 0) {
      upperNormal = scalePoint(upperNormal, -1);
    }

    const adjustedLowerNormal = scalePoint(upperNormal, -1);

    const middleAxisPoint = mixPoints(innerCanthus, outerCanthus, 0.5);

    const requestedUpperHeight = Math.abs(
      measureLandmarkOffset(landmarks.upperPeak, middleAxisPoint, upperNormal),
    );

    const requestedLowerDepth = Math.abs(
      measureLandmarkOffset(
        landmarks.lowerLow,
        middleAxisPoint,
        adjustedLowerNormal,
      ),
    );

    /*
        These limits prevent the eye from collapsing into a
        squint while still keeping the upper lid dominant.
    */
    const upperHeight = clamp(requestedUpperHeight, width * 0.19, width * 0.255);

    const lowerDepth = clamp(requestedLowerDepth, width * 0.082, width * 0.132);

    return {
      sourceInnerCanthus: copyPoint(sourceInner),
      sourceOuterCanthus: copyPoint(sourceOuter),

      innerCanthus: copyPoint(innerCanthus),
      outerCanthus: copyPoint(outerCanthus),

      eyeAxis: eyeAxis,
      upperNormal: upperNormal,
      lowerNormal: adjustedLowerNormal,

      width: width,
      upperHeight: upperHeight,
      lowerDepth: lowerDepth,

      medialDrop: medialDrop,
      temporalLift: temporalLift,
    };
  }

  /* ==========================
     SAMPLE GENERATION
  ========================== */

  function generateLidSamples(landmarks, parameters) {
    const measurements = resolveSurfaceMeasurements(landmarks);

    const sampleCount = clamp(
      Math.floor(safeNumber(parameters && parameters.sampleCount, 18) * 3),
      42,
      84,
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

      const upperPoint = addPoints(
        axisPoint,
        scalePoint(
          measurements.upperNormal,
          measurements.upperHeight * upperLidProfile(amount),
        ),
      );

      const lowerPoint = addPoints(
        axisPoint,
        scalePoint(
          measurements.lowerNormal,
          measurements.lowerDepth * lowerLidProfile(amount),
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

    decorateSamples(upperSamples, measurements.upperNormal);

    decorateSamples(lowerSamples, measurements.lowerNormal);

    return {
      ...measurements,
      upperSamples: upperSamples,
      lowerSamples: lowerSamples,
    };
  }

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
     PATH GENERATION
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

  function calculateSampleLength(samples) {
    let total = 0;

    for (let index = 1; index < samples.length; index += 1) {
      total += pointDistance(samples[index - 1].point, samples[index].point);
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

  function interpolateSample(samples, amount) {
    const resolvedAmount = clamp(safeNumber(amount, 0), 0, 1);

    const scaledIndex = resolvedAmount * (samples.length - 1);

    const lowerIndex = Math.floor(scaledIndex);

    const upperIndex = Math.min(samples.length - 1, lowerIndex + 1);

    const localAmount = scaledIndex - lowerIndex;

    const lowerSample = samples[lowerIndex];
    const upperSample = samples[upperIndex];

    return {
      amount: resolvedAmount,

      point: mixPoints(lowerSample.point, upperSample.point, localAmount),

      tangent: normalizeVector(
        mixPoints(lowerSample.tangent, upperSample.tangent, localAmount),
      ),

      normal: normalizeVector(
        mixPoints(lowerSample.normal, upperSample.normal, localAmount),
      ),
    };
  }

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
     INNER CANTHUS / TEAR DUCT
  ========================== */

  function createInnerCanthusSurface(landmarks, generated) {
    const inner = generated.innerCanthus;

    /*
        Nasal direction is always opposite the inner-to-outer
        eye axis, so this remains correct for both eyes.
    */
    const nasalDirection = scalePoint(generated.eyeAxis, -1);

    const ductLength = clamp(generated.width * 0.048, 3.8, 5.6);

    const ductHeight = clamp(generated.width * 0.032, 2.3, 3.6);

    const center = addPoints(
      inner,
      addPoints(
        scalePoint(nasalDirection, ductLength * 0.48),
        scalePoint(generated.lowerNormal, ductHeight * 0.08),
      ),
    );

    const tip = addPoints(
      center,
      scalePoint(nasalDirection, ductLength * 0.52),
    );

    const upperJoin = addPoints(
      inner,
      scalePoint(generated.upperNormal, ductHeight * 0.5),
    );

    const lowerJoin = addPoints(
      inner,
      scalePoint(generated.lowerNormal, ductHeight * 0.72),
    );

    const nasalUpper = addPoints(
      tip,
      scalePoint(generated.upperNormal, ductHeight * 0.42),
    );

    const nasalLower = addPoints(
      tip,
      scalePoint(generated.lowerNormal, ductHeight * 0.46),
    );

    const upperControl1 = mixPoints(upperJoin, nasalUpper, 0.44);

    const upperControl2 = mixPoints(nasalUpper, upperJoin, 0.22);

    const noseControl1 = addPoints(
      nasalUpper,
      scalePoint(nasalDirection, ductLength * 0.18),
    );

    const noseControl2 = addPoints(
      nasalLower,
      scalePoint(nasalDirection, ductLength * 0.18),
    );

    const lowerControl1 = mixPoints(nasalLower, lowerJoin, 0.22);

    const lowerControl2 = mixPoints(lowerJoin, nasalLower, 0.44);

    const path = [
      `M ${upperJoin.x} ${upperJoin.y}`,

      `C ${upperControl1.x} ${upperControl1.y}`,
      `${upperControl2.x} ${upperControl2.y}`,
      `${nasalUpper.x} ${nasalUpper.y}`,

      `C ${noseControl1.x} ${noseControl1.y}`,
      `${noseControl2.x} ${noseControl2.y}`,
      `${nasalLower.x} ${nasalLower.y}`,

      `C ${lowerControl1.x} ${lowerControl1.y}`,
      `${lowerControl2.x} ${lowerControl2.y}`,
      `${lowerJoin.x} ${lowerJoin.y}`,

      `Q ${inner.x} ${inner.y}`,
      `${upperJoin.x} ${upperJoin.y}`,

      "Z",
    ].join(" ");

    return {
      path: path,
      tip: copyPoint(tip),
      center: copyPoint(center),
      upperJoin: copyPoint(upperJoin),
      lowerJoin: copyPoint(lowerJoin),
      innerCanthus: copyPoint(inner),
      nasalDirection: copyPoint(nasalDirection),
      width: ductLength,
      height: ductHeight,
    };
  }

  /* ==========================
     BUILD SURFACE
  ========================== */

  function buildSurface(landmarks, parameters) {
    const generated = generateLidSamples(landmarks, parameters || {});

    const upperLid = createCurveObject(generated.upperSamples);

    const reversedLowerSamples = generated.lowerSamples
      .slice()
      .reverse()
      .map(function reverseSample(sample, index, samples) {
        return {
          amount: index / Math.max(1, samples.length - 1),

          point: copyPoint(sample.point),
          tangent: scalePoint(sample.tangent, -1),
          normal: copyPoint(sample.normal),
        };
      });

    const lowerLid = createCurveObject(reversedLowerSamples);

    const lowerOpeningPath = lowerLid.path.replace(
      /^M\s+[-\d.eE+]+\s+[-\d.eE+]+/,
      "",
    );

    const openingPath = [upperLid.path, lowerOpeningPath, "Z"].join(" ");

    const combinedSamples = [...upperLid.samples, ...lowerLid.samples];

    const openingBounds = calculateBounds(combinedSamples);

    const innerCanthusSurface = createInnerCanthusSurface(landmarks, generated);

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
        tearDuct: copyPoint(innerCanthusSurface.tip),

        sourceInnerCanthus: copyPoint(generated.sourceInnerCanthus),

        innerCanthus: copyPoint(generated.innerCanthus),

        sourceOuterCanthus: copyPoint(generated.sourceOuterCanthus),

        outerCanthus: copyPoint(generated.outerCanthus),

        upperPeak: copyPoint(landmarks.upperPeak),

        lowerLow: copyPoint(landmarks.lowerLow),

        eyeAxis: copyPoint(generated.eyeAxis),
      },
    };

    return {
      opening: opening,

      upperLid: upperLid,
      lowerLid: lowerLid,

      upperLidEdge: upperLid,
      lowerLidEdge: lowerLid,

      innerCanthusSurface: innerCanthusSurface,

      tearDuctSurface: innerCanthusSurface,

      upperHeight: generated.upperHeight,

      lowerDepth: generated.lowerDepth,

      width: generated.width,

      medialDrop: generated.medialDrop,

      temporalLift: generated.temporalLift,
    };
  }

  /* ==========================
     GEOMETRY OVERRIDE
  ========================== */

  function build(landmarks, parameters) {
    const legacyGeometry = baseGeometryBuild(landmarks, parameters);

    if (
      !landmarks ||
      !landmarks.innerCanthus ||
      !landmarks.outerCanthus ||
      !landmarks.upperPeak ||
      !landmarks.lowerLow
    ) {
      return legacyGeometry;
    }

    const surface = buildSurface(landmarks, parameters || {});

    return {
      ...legacyGeometry,

      opening: surface.opening,

      upperLid: surface.upperLid,
      lowerLid: surface.lowerLid,

      upperLidEdge: surface.upperLidEdge,
      lowerLidEdge: surface.lowerLidEdge,

      innerCanthusSurface: surface.innerCanthusSurface,

      tearDuctSurface: surface.tearDuctSurface,

      /*
          Keep legacy property available, but point it to the
          new inner-only tear duct surface.
      */
      tearDuct: surface.tearDuctSurface,

      upperSamples: surface.upperLid.samples,

      lowerSamples: surface.lowerLid.samples,

      upperSurface: surface.upperLid,

      lowerSurface: surface.lowerLid,

      openingSurface: surface.opening,

      surfaceMetrics: {
        width: surface.width,

        upperHeight: surface.upperHeight,

        lowerDepth: surface.lowerDepth,

        medialDrop: surface.medialDrop,

        temporalLift: surface.temporalLift,
      },
    };
  }

  /* ==========================
     PUBLIC API
  ========================== */

  window.EyeSurface = {
    version: "2.1.0",

    build: buildSurface,

    upperProfile: upperLidProfile,

    lowerProfile: lowerLidProfile,

    createInnerCanthusSurface: createInnerCanthusSurface,
  };

  window.EyeGeometry.build = build;


  console.log("EyeSurface 2.1.0 loaded");
})();
