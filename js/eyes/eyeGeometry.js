/* =========================================================
   FACELAB EYE GEOMETRY
   Version 3.0.1

   PURPOSE

   Builds upper and lower eyelids as independent anatomical
   surfaces made from controlled cubic Bézier segments.

   VERSION HISTORY

   3.0.0
   - Added anatomical shoulder transition points.
   - Flattened upper-peak and lower-low tangents.
   - Prevented diamond and tent-shaped eye openings.

   3.0.1
   - Removed one unused SVG line-command helper and export.
   - No geometry or rendering behavior changed.
========================================================= */

(function initializeEyeGeometry() {
  "use strict";

  function safeNumber(value, fallback) {
    const number = Number(value);
    return Number.isFinite(number) ? number : fallback;
  }

  function clamp(value, minimum, maximum) {
    return Math.max(minimum, Math.min(maximum, value));
  }

  function mix(start, end, amount) {
    return start + (end - start) * amount;
  }

  function point(x, y) {
    return { x: safeNumber(x, 0), y: safeNumber(y, 0) };
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

  function pointBetween(first, second, amount) {
    return point(mix(first.x, second.x, amount), mix(first.y, second.y, amount));
  }

  function pointDistance(first, second) {
    return Math.hypot(second.x - first.x, second.y - first.y);
  }

  function normalizeVector(vector) {
    const length = Math.hypot(vector.x, vector.y);
    if (length < 0.0001) return point(1, 0);
    return point(vector.x / length, vector.y / length);
  }

  function perpendicular(vector) {
    return point(-vector.y, vector.x);
  }

  function rotatePoint(source, center, degrees) {
    const radians = (safeNumber(degrees, 0) * Math.PI) / 180;
    const cosine = Math.cos(radians);
    const sine = Math.sin(radians);
    const offsetX = source.x - center.x;
    const offsetY = source.y - center.y;

    return point(
      center.x + offsetX * cosine - offsetY * sine,
      center.y + offsetX * sine + offsetY * cosine,
    );
  }

  function moveCommand(source) {
    return `M ${source.x} ${source.y}`;
  }

  function cubicCommand(control1, control2, destination) {
    return `C ${control1.x} ${control1.y} ${control2.x} ${control2.y} ${destination.x} ${destination.y}`;
  }

  function createCubicSegment(start, end, startDirection, endDirection, startTension, endTension) {
    const distance = pointDistance(start, end);
    const startVector = normalizeVector(startDirection);
    const endVector = normalizeVector(endDirection);

    const control1 = addPoints(
      start,
      scalePoint(startVector, distance * clamp(safeNumber(startTension, 0.4), 0.01, 1.5)),
    );

    const control2 = subtractPoints(
      end,
      scalePoint(endVector, distance * clamp(safeNumber(endTension, 0.4), 0.01, 1.5)),
    );

    return { start: copyPoint(start), control1, control2, end: copyPoint(end) };
  }

  function createSplineSegments(points, smoothness) {
    const source = Array.isArray(points) ? points : [];
    const tension = clamp(safeNumber(smoothness, 0.9), 0, 1.4);
    const segments = [];

    for (let index = 0; index < source.length - 1; index += 1) {
      const previous = source[index - 1] || source[index];
      const start = source[index];
      const end = source[index + 1];
      const next = source[index + 2] || end;

      const control1 = addPoints(
        start,
        scalePoint(subtractPoints(end, previous), tension / 6),
      );

      const control2 = subtractPoints(
        end,
        scalePoint(subtractPoints(next, start), tension / 6),
      );

      segments.push({
        start: copyPoint(start),
        control1,
        control2,
        end: copyPoint(end),
      });
    }

    return segments;
  }

  function segmentToCommand(segment) {
    return cubicCommand(segment.control1, segment.control2, segment.end);
  }

  function pathFromSegments(start, segments, closePath) {
    const commands = [moveCommand(start)];
    segments.forEach(function addSegment(segment) {
      commands.push(segmentToCommand(segment));
    });
    if (closePath) commands.push("Z");
    return commands.join(" ");
  }

  function sampleCubicPoint(segment, amount) {
    const t = clamp(safeNumber(amount, 0), 0, 1);
    const inverse = 1 - t;
    const inverseSquared = inverse * inverse;
    const tSquared = t * t;

    return point(
      inverseSquared * inverse * segment.start.x +
        3 * inverseSquared * t * segment.control1.x +
        3 * inverse * tSquared * segment.control2.x +
        tSquared * t * segment.end.x,
      inverseSquared * inverse * segment.start.y +
        3 * inverseSquared * t * segment.control1.y +
        3 * inverse * tSquared * segment.control2.y +
        tSquared * t * segment.end.y,
    );
  }

  function sampleCubicTangent(segment, amount) {
    const t = clamp(safeNumber(amount, 0), 0, 1);
    const inverse = 1 - t;

    return normalizeVector(point(
      3 * inverse * inverse * (segment.control1.x - segment.start.x) +
        6 * inverse * t * (segment.control2.x - segment.control1.x) +
        3 * t * t * (segment.end.x - segment.control2.x),
      3 * inverse * inverse * (segment.control1.y - segment.start.y) +
        6 * inverse * t * (segment.control2.y - segment.control1.y) +
        3 * t * t * (segment.end.y - segment.control2.y),
    ));
  }

  function sampleSegment(segment, sampleCount) {
    const count = Math.max(2, Math.floor(safeNumber(sampleCount, 16)));
    const samples = [];

    for (let index = 0; index <= count; index += 1) {
      const amount = index / count;
      const tangent = sampleCubicTangent(segment, amount);
      samples.push({
        amount,
        point: sampleCubicPoint(segment, amount),
        tangent,
        normal: perpendicular(tangent),
      });
    }

    return samples;
  }

  function sampleSegmentCollection(segments, sampleCount) {
    const samples = [];
    (segments || []).forEach(function sampleOne(segment, segmentIndex) {
      sampleSegment(segment, sampleCount).forEach(function addSample(sample, sampleIndex) {
        if (segmentIndex > 0 && sampleIndex === 0) return;
        samples.push({ ...sample, segmentIndex });
      });
    });
    return samples;
  }

  function calculateSampleLength(samples) {
    let length = 0;
    for (let index = 1; index < samples.length; index += 1) {
      length += pointDistance(samples[index - 1].point, samples[index].point);
    }
    return length;
  }

  function calculateSampleBounds(samples) {
    if (!samples || samples.length === 0) {
      return { minX: 0, minY: 0, maxX: 0, maxY: 0, width: 0, height: 0, centerX: 0, centerY: 0 };
    }

    let minX = samples[0].point.x;
    let minY = samples[0].point.y;
    let maxX = minX;
    let maxY = minY;

    samples.forEach(function inspect(sample) {
      minX = Math.min(minX, sample.point.x);
      minY = Math.min(minY, sample.point.y);
      maxX = Math.max(maxX, sample.point.x);
      maxY = Math.max(maxY, sample.point.y);
    });

    return {
      minX, minY, maxX, maxY,
      width: maxX - minX,
      height: maxY - minY,
      centerX: (minX + maxX) / 2,
      centerY: (minY + maxY) / 2,
    };
  }

  function sampleCurveByDistance(samples, totalLength, amount) {
    if (!samples || samples.length === 0) {
      return { amount: 0, point: point(0, 0), tangent: point(1, 0), normal: point(0, 1), distance: 0, segmentIndex: 0 };
    }

    const resolvedAmount = clamp(safeNumber(amount, 0), 0, 1);
    const targetDistance = totalLength * resolvedAmount;
    let traveled = 0;

    for (let index = 1; index < samples.length; index += 1) {
      const previous = samples[index - 1];
      const current = samples[index];
      const section = pointDistance(previous.point, current.point);

      if (targetDistance <= traveled + section || index === samples.length - 1) {
        const local = section > 0.0001 ? (targetDistance - traveled) / section : 0;
        const tangent = normalizeVector(pointBetween(previous.tangent, current.tangent, local));
        const normal = normalizeVector(pointBetween(previous.normal, current.normal, local));

        return {
          amount: resolvedAmount,
          point: pointBetween(previous.point, current.point, local),
          tangent,
          normal,
          distance: targetDistance,
          segmentIndex: current.segmentIndex ?? previous.segmentIndex ?? 0,
        };
      }

      traveled += section;
    }

    return { ...samples[samples.length - 1], amount: 1, distance: totalLength };
  }

  function createCurve(path, segments, sampleCount) {
    const resolvedSegments = Array.isArray(segments) ? segments : [];
    const samples = sampleSegmentCollection(resolvedSegments, sampleCount);
    const length = calculateSampleLength(samples);
    const bounds = calculateSampleBounds(samples);

    function sample(amount) {
      return sampleCurveByDistance(samples, length, amount);
    }

    return {
      path,
      segments: resolvedSegments,
      samples,
      length,
      bounds,
      boundingBox: bounds,
      sample,
      point: function curvePoint(amount) { return copyPoint(sample(amount).point); },
      tangent: function curveTangent(amount) { return copyPoint(sample(amount).tangent); },
      normal: function curveNormal(amount) { return copyPoint(sample(amount).normal); },
    };
  }

  function resolveOpeningLandmarks(landmarks) {
    return {
      eyeAxis: normalizeVector(landmarks.eyeAxis),
      reverseAxis: scalePoint(normalizeVector(landmarks.eyeAxis), -1),
      tearDuct: copyPoint(landmarks.tearDuct),
      innerCanthus: copyPoint(landmarks.innerCanthus),
      upperInnerShoulder: copyPoint(landmarks.upperInnerShoulder || pointBetween(landmarks.innerCanthus, landmarks.upperPeak, 0.52)),
      upperPeak: copyPoint(landmarks.upperPeak),
      upperOuterShoulder: copyPoint(landmarks.upperOuterShoulder || pointBetween(landmarks.upperPeak, landmarks.outerCanthus, 0.52)),
      outerCanthus: copyPoint(landmarks.outerCanthus),
      lowerOuterShoulder: copyPoint(landmarks.lowerOuterShoulder || pointBetween(landmarks.outerCanthus, landmarks.lowerLow, 0.52)),
      lowerLow: copyPoint(landmarks.lowerLow),
      lowerInnerShoulder: copyPoint(landmarks.lowerInnerShoulder || pointBetween(landmarks.lowerLow, landmarks.innerCanthus, 0.52)),
    };
  }

  /* ==========================
     ANATOMICAL LID SEGMENTS
  ========================== */

  function blendedTangent(previous, current, next, axis, axisInfluence) {
    const incoming = normalizeVector(subtractPoints(current, previous));
    const outgoing = normalizeVector(subtractPoints(next, current));
    const natural = normalizeVector(addPoints(incoming, outgoing));
    const influence = clamp(safeNumber(axisInfluence, 0), 0, 1);

    return normalizeVector(
      addPoints(
        scalePoint(natural, 1 - influence),
        scalePoint(axis, influence),
      ),
    );
  }

  function createControlledSegment(start, end, startTangent, endTangent, startHandle, endHandle) {
    const distance = pointDistance(start, end);

    return {
      start: copyPoint(start),
      control1: addPoints(
        start,
        scalePoint(
          normalizeVector(startTangent),
          distance * clamp(safeNumber(startHandle, 0.32), 0.05, 0.7),
        ),
      ),
      control2: subtractPoints(
        end,
        scalePoint(
          normalizeVector(endTangent),
          distance * clamp(safeNumber(endHandle, 0.32), 0.05, 0.7),
        ),
      ),
      end: copyPoint(end),
    };
  }

  function createAnatomicalLidSegments(points, axis, options) {
    const source = Array.isArray(points) ? points : [];

    if (source.length !== 5) {
      return createSplineSegments(source, 0.72);
    }

    const settings = {
      canthusHandle: 0.25,
      shoulderHandle: 0.31,
      centerHandle: 0.42,
      shoulderAxisInfluence: 0.32,
      ...(options || {}),
    };

    const start = source[0];
    const firstShoulder = source[1];
    const center = source[2];
    const secondShoulder = source[3];
    const end = source[4];

    const forwardAxis = normalizeVector(axis);

    const startTangent = normalizeVector(subtractPoints(firstShoulder, start));
    const firstShoulderTangent = blendedTangent(
      start,
      firstShoulder,
      center,
      forwardAxis,
      settings.shoulderAxisInfluence,
    );

    /*
        The center tangent is deliberately parallel to the
        eye axis. This creates a broad shelf over the iris
        instead of a pointed hill or V.
    */
    const centerTangent = forwardAxis;

    const secondShoulderTangent = blendedTangent(
      center,
      secondShoulder,
      end,
      forwardAxis,
      settings.shoulderAxisInfluence,
    );

    const endTangent = normalizeVector(subtractPoints(end, secondShoulder));

    return [
      createControlledSegment(
        start,
        firstShoulder,
        startTangent,
        firstShoulderTangent,
        settings.canthusHandle,
        settings.shoulderHandle,
      ),
      createControlledSegment(
        firstShoulder,
        center,
        firstShoulderTangent,
        centerTangent,
        settings.shoulderHandle,
        settings.centerHandle,
      ),
      createControlledSegment(
        center,
        secondShoulder,
        centerTangent,
        secondShoulderTangent,
        settings.centerHandle,
        settings.shoulderHandle,
      ),
      createControlledSegment(
        secondShoulder,
        end,
        secondShoulderTangent,
        endTangent,
        settings.shoulderHandle,
        settings.canthusHandle,
      ),
    ];
  }

  function buildOpeningSegments(landmarks, parameters) {
    const resolved = resolveOpeningLandmarks(landmarks);

    const upperPoints = [
      resolved.innerCanthus,
      resolved.upperInnerShoulder,
      resolved.upperPeak,
      resolved.upperOuterShoulder,
      resolved.outerCanthus,
    ];

    const lowerPoints = [
      resolved.outerCanthus,
      resolved.lowerOuterShoulder,
      resolved.lowerLow,
      resolved.lowerInnerShoulder,
      resolved.innerCanthus,
    ];

    const upperSegments = createAnatomicalLidSegments(
      upperPoints,
      resolved.eyeAxis,
      {
        canthusHandle: parameters.upperCanthusHandle,
        shoulderHandle: parameters.upperShoulderHandle,
        centerHandle: parameters.upperCenterHandle,
        shoulderAxisInfluence: parameters.upperShoulderAxisInfluence,
      },
    );

    const lowerSegments = createAnatomicalLidSegments(
      lowerPoints,
      resolved.reverseAxis,
      {
        canthusHandle: parameters.lowerCanthusHandle,
        shoulderHandle: parameters.lowerShoulderHandle,
        centerHandle: parameters.lowerCenterHandle,
        shoulderAxisInfluence: parameters.lowerShoulderAxisInfluence,
      },
    );

    return {
      resolvedLandmarks: resolved,
      upperPoints,
      lowerPoints,
      upperSegments,
      lowerSegments,

      upperInner: upperSegments[0],
      upperPeakInner: upperSegments[1],
      upperPeakOuter: upperSegments[2],
      upperOuter: upperSegments[3],

      lowerOuter: lowerSegments[0],
      lowerOuterCenter: lowerSegments[1],
      lowerInnerCenter: lowerSegments[2],
      lowerInner: lowerSegments[3],
    };
  }

  function buildOpening(landmarks, parameters) {
    const data = buildOpeningSegments(landmarks, parameters);
    const path = [
      moveCommand(data.resolvedLandmarks.innerCanthus),
      ...data.upperSegments.map(segmentToCommand),
      ...data.lowerSegments.map(segmentToCommand),
      "Z",
    ].join(" ");

    const upperPath = pathFromSegments(data.resolvedLandmarks.innerCanthus, data.upperSegments, false);
    const lowerPath = pathFromSegments(data.resolvedLandmarks.outerCanthus, data.lowerSegments, false);

    return {
      path,
      upperPath,
      lowerPath,
      resolvedLandmarks: data.resolvedLandmarks,
      segments: {
        upperInner: data.upperInner,
        upperPeakInner: data.upperPeakInner,
        upperPeakOuter: data.upperPeakOuter,
        upperOuter: data.upperOuter,
        lowerOuter: data.lowerOuter,
        lowerOuterCenter: data.lowerOuterCenter,
        lowerInnerCenter: data.lowerInnerCenter,
        lowerInner: data.lowerInner,
      },
      upperSegments: data.upperSegments,
      lowerSegments: data.lowerSegments,
      samples: sampleSegmentCollection([...data.upperSegments, ...data.lowerSegments], parameters.sampleCount),
      upperSamples: sampleSegmentCollection(data.upperSegments, parameters.sampleCount),
      lowerSamples: sampleSegmentCollection(data.lowerSegments, parameters.sampleCount),
    };
  }

  function buildUpperCrease(landmarks, parameters) {
    const resolved = resolveOpeningLandmarks(landmarks);
    const inset = clamp(parameters.upperCreaseInset / parameters.width, 0.03, 0.25);

    const points = [
      pointBetween(resolved.innerCanthus, resolved.upperInnerShoulder, inset),
      addPoints(resolved.upperInnerShoulder, point(0, -parameters.upperCreaseHeight * 0.82)),
      addPoints(resolved.upperPeak, point(0, -parameters.upperCreaseHeight)),
      addPoints(resolved.upperOuterShoulder, point(0, -parameters.upperCreaseHeight * 0.76)),
      pointBetween(resolved.upperOuterShoulder, resolved.outerCanthus, 1 - inset),
    ];

    const segments = createSplineSegments(points, 0.84);
    const path = pathFromSegments(points[0], segments, false);
    const curve = createCurve(path, segments, parameters.sampleCount);

    return {
      ...curve,
      start: points[0],
      innerPeak: points[1],
      peak: points[2],
      outerPeak: points[3],
      end: points[4],
    };
  }

  function buildLowerCrease(landmarks, parameters) {
    const resolved = resolveOpeningLandmarks(landmarks);
    const inset = clamp(parameters.lowerCreaseInset / parameters.width, 0.05, 0.32);

    const points = [
      pointBetween(resolved.outerCanthus, resolved.lowerOuterShoulder, inset),
      addPoints(resolved.lowerOuterShoulder, point(0, parameters.lowerCreaseDepth * 0.75)),
      addPoints(resolved.lowerLow, point(0, parameters.lowerCreaseDepth)),
      addPoints(resolved.lowerInnerShoulder, point(0, parameters.lowerCreaseDepth * 0.65)),
      pointBetween(resolved.lowerInnerShoulder, resolved.innerCanthus, 1 - inset),
    ];

    const segments = createSplineSegments(points, 0.82);
    const path = pathFromSegments(points[0], segments, false);
    const curve = createCurve(path, segments, parameters.sampleCount);

    return {
      ...curve,
      start: points[0],
      low: points[2],
      end: points[4],
    };
  }

  function buildTearDuct(landmarks, parameters) {
    const tear = landmarks.tearDuct;
    const inner = landmarks.innerCanthus;
    const middle = pointBetween(inner, tear, 0.52);
    const height = Math.max(1.25, parameters.tearDuctSurfaceHeight);

    const path = [
      moveCommand(inner),
      cubicCommand(
        addPoints(inner, point(0, -height * 0.35)),
        addPoints(middle, point(0, -height)),
        tear,
      ),
      cubicCommand(
        addPoints(middle, point(0, height * 0.8)),
        addPoints(inner, point(0, height * 0.45)),
        inner,
      ),
      "Z",
    ].join(" ");

    return { inner: copyPoint(inner), tip: copyPoint(tear), height, path };
  }

  function buildSocket(landmarks, parameters) {
    const socketWidth = parameters.width * parameters.socketWidthScale;
    const socketHeight = parameters.height * parameters.socketHeightScale;
    const center = point(landmarks.center.x, landmarks.center.y + parameters.socketOffsetY);
    const left = center.x - socketWidth / 2;
    const right = center.x + socketWidth / 2;
    const top = center.y - socketHeight / 2;
    const bottom = center.y + socketHeight / 2;
    const horizontalControl = socketWidth * 0.28;
    const verticalControl = socketHeight * 0.38;

    const path = [
      `M ${left} ${center.y}`,
      `C ${left} ${center.y - verticalControl} ${left + horizontalControl} ${top} ${center.x} ${top}`,
      `C ${right - horizontalControl} ${top} ${right} ${center.y - verticalControl} ${right} ${center.y}`,
      `C ${right} ${center.y + verticalControl} ${right - horizontalControl} ${bottom} ${center.x} ${bottom}`,
      `C ${left + horizontalControl} ${bottom} ${left} ${center.y + verticalControl} ${left} ${center.y}`,
      "Z",
    ].join(" ");

    return { center, width: socketWidth, height: socketHeight, path };
  }

  function rotateLandmarks(landmarks, degrees) {
    const center = landmarks.center;
    const rotated = {};

    Object.keys(landmarks).forEach(function rotateLandmark(key) {
      const value = landmarks[key];
      if (value && typeof value === "object" && Number.isFinite(value.x) && Number.isFinite(value.y)) {
        rotated[key] = rotatePoint(value, center, degrees);
      } else {
        rotated[key] = value;
      }
    });

    return rotated;
  }

  function build(landmarks, inputParameters) {
    if (!landmarks || typeof landmarks !== "object") {
      throw new Error("EyeGeometry.build requires eye landmarks.");
    }

    const parameters = {
      /* OPENING */

      width: 78,
      height: 32,

      upperCanthusHandle: 0.24,
      upperShoulderHandle: 0.31,
      upperCenterHandle: 0.46,
      upperShoulderAxisInfluence: 0.42,

      lowerCanthusHandle: 0.22,
      lowerShoulderHandle: 0.30,
      lowerCenterHandle: 0.48,
      lowerShoulderAxisInfluence: 0.5,

      /* CREASES */

      upperCreaseHeight: 7,
      upperCreaseInset: 7,

      lowerCreaseDepth: 4,
      lowerCreaseInset: 12,

      /* TEAR DUCT */

      tearDuctSurfaceHeight: 1.5,

      /* SOCKET */

      socketWidthScale: 1.34,
      socketHeightScale: 1.72,
      socketOffsetY: 1,

      /* SAMPLING */

      sampleCount: 18,

      ...(inputParameters || {}),
    };

    const opening = buildOpening(landmarks, parameters);
    const upperLid = createCurve(opening.upperPath, opening.upperSegments, parameters.sampleCount);
    const lowerLid = createCurve(opening.lowerPath, opening.lowerSegments, parameters.sampleCount);
    const upperCrease = buildUpperCrease(landmarks, parameters);
    const lowerCrease = buildLowerCrease(landmarks, parameters);
    const tearDuct = buildTearDuct(landmarks, parameters);
    const socket = buildSocket(landmarks, parameters);

    opening.upperCurve = upperLid;
    opening.lowerCurve = lowerLid;
    opening.length = upperLid.length + lowerLid.length;
    opening.bounds = calculateSampleBounds([...upperLid.samples, ...lowerLid.samples]);
    opening.boundingBox = opening.bounds;

    return {
      parameters,
      resolvedLandmarks: opening.resolvedLandmarks,
      opening,
      upperLid,
      lowerLid,
      upperCrease,
      lowerCrease,
      tearDuct,
      socket,
    };
  }

  window.EyeGeometry = {
    version: "3.0.1",
    build,
    resolveOpeningLandmarks,
    buildOpeningSegments,
    buildOpening,
    buildUpperCrease,
    buildLowerCrease,
    buildTearDuct,
    buildSocket,
    createCurve,
    sampleCurveByDistance,
    calculateSampleLength,
    calculateSampleBounds,
    createCubicSegment,
    createControlledSegment,
    createAnatomicalLidSegments,
    createSplineSegments,
    sampleCubicPoint,
    sampleCubicTangent,
    sampleSegment,
    sampleSegmentCollection,
    rotatePoint,
    rotateLandmarks,
    point,
    copyPoint,
    addPoints,
    subtractPoints,
    scalePoint,
    pointBetween,
    normalizeVector,
    perpendicular,
    moveCommand,
    cubicCommand,
  };

  console.log("EyeGeometry 3.0.1 loaded");
})();
