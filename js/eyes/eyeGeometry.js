/* =========================================================
   FACELAB EYE GEOMETRY
   Consolidated Version 5.0.0

   Contains:
   - base curve geometry
   - surface generation
   - upper lid geometry
   - lower lid geometry
   - medial/lateral canthi
   - eye assembly
   - builder compatibility
========================================================= */

(function initializeConsolidatedEyeGeometry() {
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

  function lineCommand(source) {
    return `L ${source.x} ${source.y}`;
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
      width: 78,
      height: 32,
      /* Patch 4 anatomical curve controls */
      upperCanthusHandle: 0.24,
      upperShoulderHandle: 0.31,
      upperCenterHandle: 0.46,
      upperShoulderAxisInfluence: 0.42,

      lowerCanthusHandle: 0.22,
      lowerShoulderHandle: 0.30,
      lowerCenterHandle: 0.48,
      lowerShoulderAxisInfluence: 0.5,
      upperCreaseHeight: 7,
      upperCreaseInset: 7,
      lowerCreaseDepth: 4,
      lowerCreaseInset: 12,
      tearDuctSurfaceHeight: 1.5,
      socketWidthScale: 1.34,
      socketHeightScale: 1.72,
      socketOffsetY: 1,
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

  const BaseEyeGeometry = {
    version: "3.0.0",
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
    lineCommand,
    cubicCommand,
  };

  console.log("EyeGeometry base loaded");


  /* ==========================
     DEFAULT SETTINGS
  ========================== */

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

    /*
        These settings remain compatible with the previous
        builder, but now influence orbital arc projection.
    */

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

    /*
        Eyeball model.

        globeWidthScale controls horizontal curvature.
        globeHeightScale controls vertical curvature.
        lidWrap controls how strongly landmarks follow the
        globe rather than a flat eye axis.
    */

    globeWidthScale: 0.58,
    globeHeightScale: 0.72,

    upperLidWrap: 0.88,
    lowerLidWrap: 0.72,

    upperTemporalBias: 0.08,
    lowerTemporalBias: 0.05,

    innerCanthusFlattening: 0.34,
    outerCanthusFlattening: 0.24,

    sampleCount: 18,
  };

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

  function pointBetween(first, second, amount) {
    return point(
      first.x + (second.x - first.x) * amount,

      first.y + (second.y - first.y) * amount,
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

  function dotProduct(first, second) {
    return first.x * second.x + first.y * second.y;
  }

  /* ==========================
     SETTINGS
  ========================== */

  function resolveSettings(inputSettings) {
    const input =
      inputSettings && typeof inputSettings === "object" ? inputSettings : {};

    const settings = {
      ...defaultBuilderSettings,
      ...input,
    };

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

    settings.globeWidthScale = clamp(
      safeNumber(
        settings.globeWidthScale,
        defaultBuilderSettings.globeWidthScale,
      ),
      0.25,
      1.2,
    );

    settings.globeHeightScale = clamp(
      safeNumber(
        settings.globeHeightScale,
        defaultBuilderSettings.globeHeightScale,
      ),
      0.25,
      1.5,
    );

    settings.upperLidWrap = clamp(
      safeNumber(settings.upperLidWrap, defaultBuilderSettings.upperLidWrap),
      0,
      1.5,
    );

    settings.lowerLidWrap = clamp(
      safeNumber(settings.lowerLidWrap, defaultBuilderSettings.lowerLidWrap),
      0,
      1.5,
    );

    settings.upperTemporalBias = clamp(
      safeNumber(
        settings.upperTemporalBias,
        defaultBuilderSettings.upperTemporalBias,
      ),
      -0.4,
      0.4,
    );

    settings.lowerTemporalBias = clamp(
      safeNumber(
        settings.lowerTemporalBias,
        defaultBuilderSettings.lowerTemporalBias,
      ),
      -0.4,
      0.4,
    );

    settings.innerCanthusFlattening = clamp(
      safeNumber(
        settings.innerCanthusFlattening,
        defaultBuilderSettings.innerCanthusFlattening,
      ),
      0,
      0.9,
    );

    settings.outerCanthusFlattening = clamp(
      safeNumber(
        settings.outerCanthusFlattening,
        defaultBuilderSettings.outerCanthusFlattening,
      ),
      0,
      0.9,
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

  /* ==========================
     ORBITAL MODEL
  ========================== */

  function createOrbitalModel(settings, innerCanthus, outerCanthus) {
    const axisVector = subtractPoints(outerCanthus, innerCanthus);

    const axis = normalizeVector(axisVector);

    let upperNormal = perpendicularVector(axis);

    if (upperNormal.y > 0) {
      upperNormal = scalePoint(upperNormal, -1);
    }

    const lowerNormal = scalePoint(upperNormal, -1);

    const center = pointBetween(innerCanthus, outerCanthus, 0.5);

    const halfWidth = vectorLength(axisVector) / 2;

    const globeRadiusX = Math.max(2, settings.width * settings.globeWidthScale);

    const globeRadiusY = Math.max(
      2,
      settings.height * settings.globeHeightScale,
    );

    return {
      center,
      axis,
      upperNormal,
      lowerNormal,
      halfWidth,
      globeRadiusX,
      globeRadiusY,
      innerCanthus,
      outerCanthus,
    };
  }

  function resolveCanthusFlattening(amount, settings) {
    const innerInfluence = 1 - smoothStep(0, 0.24, amount);

    const outerInfluence = smoothStep(0.76, 1, amount);

    const innerFlattening = settings.innerCanthusFlattening * innerInfluence;

    const outerFlattening = settings.outerCanthusFlattening * outerInfluence;

    return clamp(1 - innerFlattening - outerFlattening, 0.05, 1);
  }

  function resolveTemporalBias(amount, bias) {
    return mix(1 - bias, 1 + bias, smoothStep(0.15, 0.85, amount));
  }

  function orbitalPoint(
    model,
    settings,
    position,
    direction,
    amplitude,
    wrapAmount,
    temporalBias,
  ) {
    const t = clamp(position, 0, 1);

    const axisPoint = pointBetween(model.innerCanthus, model.outerCanthus, t);

    /*
        Elliptical globe projection.

        At the canthi the vertical component approaches zero.
        Through the central region the lid wraps over the
        globe rather than rising from a flat baseline.
    */

    const normalizedX = clamp((t - 0.5) * 2, -1, 1);

    const globeArc = Math.sqrt(Math.max(0, 1 - normalizedX * normalizedX));

    const canthusFlattening = resolveCanthusFlattening(t, settings);

    const sideBias = resolveTemporalBias(t, temporalBias);

    const verticalDistance =
      model.globeRadiusY *
      globeArc *
      wrapAmount *
      amplitude *
      canthusFlattening *
      sideBias;

    const normal =
      direction === "lower" ? model.lowerNormal : model.upperNormal;

    return addPoints(axisPoint, scalePoint(normal, verticalDistance));
  }

  /* ==========================
     LANDMARK BUILDING
  ========================== */

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

    const model = createOrbitalModel(settings, innerCanthus, outerCanthus);

    /*
        Upper landmarks.

        The old height controls now scale orbital projection
        instead of creating straight vertical offsets.
    */

    const upperInnerShoulder = orbitalPoint(
      model,
      settings,
      settings.upperInnerShoulderPosition,
      "upper",
      settings.upperPeakHeight * settings.upperInnerShoulderHeight,
      settings.upperLidWrap,
      settings.upperTemporalBias,
    );

    const upperPeak = orbitalPoint(
      model,
      settings,
      settings.upperPeakPosition,
      "upper",
      settings.upperPeakHeight,
      settings.upperLidWrap,
      settings.upperTemporalBias,
    );

    const upperOuterShoulder = orbitalPoint(
      model,
      settings,
      settings.upperOuterShoulderPosition,
      "upper",
      settings.upperPeakHeight * settings.upperOuterShoulderHeight,
      settings.upperLidWrap,
      settings.upperTemporalBias,
    );

    /*
        Lower landmarks.

        Lower landmarks use a weaker globe wrap so the lower
        lid supports the eye without becoming a deep bowl.
    */

    const lowerInnerShoulder = orbitalPoint(
      model,
      settings,
      settings.lowerInnerShoulderPosition,
      "lower",
      settings.lowerLowDepth * settings.lowerInnerShoulderDepth,
      settings.lowerLidWrap,
      settings.lowerTemporalBias,
    );

    const lowerLow = orbitalPoint(
      model,
      settings,
      settings.lowerLowPosition,
      "lower",
      settings.lowerLowDepth,
      settings.lowerLidWrap,
      settings.lowerTemporalBias,
    );

    const lowerOuterShoulder = orbitalPoint(
      model,
      settings,
      settings.lowerOuterShoulderPosition,
      "lower",
      settings.lowerLowDepth * settings.lowerOuterShoulderDepth,
      settings.lowerLidWrap,
      settings.lowerTemporalBias,
    );

    /*
        Tear duct extends from the inner canthus toward the
        nose along the reverse anatomical eye axis.
    */

    const tearDuct = addPoints(
      innerCanthus,
      addPoints(
        scalePoint(model.axis, -settings.tearDuctLength),

        scalePoint(model.lowerNormal, settings.tearDuctHeight),
      ),
    );

    const irisCenter = point(
      settings.centerX + settings.irisCenterX,

      settings.centerY + settings.irisCenterY,
    );

    return {
      center: point(settings.centerX, settings.centerY),

      globeCenter: copyPoint(model.center),

      globeRadiusX: model.globeRadiusX,

      globeRadiusY: model.globeRadiusY,

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

      eyeAxis: copyPoint(model.axis),

      upperNormal: copyPoint(model.upperNormal),

      lowerNormal: copyPoint(model.lowerNormal),

      up: point(0, -1),
      down: point(0, 1),

      anatomicalDirection,
    };
  }

  /* ==========================
     GEOMETRY PARAMETERS
  ========================== */

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

      globeWidthScale: settings.globeWidthScale,

      globeHeightScale: settings.globeHeightScale,

      upperLidWrap: settings.upperLidWrap,

      lowerLidWrap: settings.lowerLidWrap,

      sampleCount: settings.sampleCount,
    };
  }

  /* ==========================
     BUILD
  ========================== */

  function build(inputSettings) {
    if (!BaseEyeGeometry || typeof BaseEyeGeometry.build !== "function") {
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

    const geometry = BaseEyeGeometry.build(landmarks, parameters);

    const transformedBaseLandmarks = BaseEyeGeometry.rotateLandmarks(
      baseLandmarks,
      settings.rotation,
    );

    const transformedLandmarks = BaseEyeGeometry.rotateLandmarks(
      landmarks,
      settings.rotation,
    );

    const transform =
      `rotate(${settings.rotation} ` +
      `${settings.centerX} ` +
      `${settings.centerY})`;

    return {
      type: "eye",

      side: settings.side,

      settings: {
        ...settings,
      },

      parameters: {
        ...parameters,
      },

      baseLandmarks,
      transformedBaseLandmarks,

      landmarks,
      riggedLandmarks: landmarks,

      transformedLandmarks,

      rigState: {
        ...rigResult.state,
      },

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

  /* ==========================
     DESCRIPTION
  ========================== */

  function describe() {
    return {
      type: "Eye",

      architecture: [
        "EyeBuilder",
        "EyeRig",
        "EyeGeometry",
        "EyeSurface",
        "EyeRenderer",
      ],

      model: "elliptical globe projection",

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

  /* ==========================
     PUBLIC API
  ========================== */

  const BaseEyeBuilder = {
    version: "4.0.0",

    defaults: Object.freeze({
      ...defaultBuilderSettings,
    }),

    build,

    buildLandmarks: function publicBuildLandmarks(inputSettings) {
      return buildLandmarks(resolveSettings(inputSettings));
    },

    describe,

    getDefaults: function getDefaults() {
      return {
        ...defaultBuilderSettings,
      };
    },
  };

  console.log("EyeBuilder base loaded");

  function buildBaseEyeAnatomy(inputSettings) {
    return BaseEyeBuilder.build(inputSettings);
  }

  /* ==========================
     SURFACE GEOMETRY
  ========================== */


  if (!window.EyeGeometry || typeof window.EyeGeometry.buildSurfaceGeometry !== "function") {
    console.error(
      "EyeSurface requires EyeGeometry. Load eyeGeometry.js before eyeSurface.js.",
    );
    return;
  }

  const originalBuild = window.EyeGeometry.buildSurfaceGeometry.bind(window.EyeGeometry);

  /* ==========================
     HELPERS
  ========================== */

  function surfaceNumber(value, fallback) {
    const resolved = Number(value);
    return Number.isFinite(resolved) ? resolved : fallback;
  }

  function surfaceClamp(value, minimum, maximum) {
    return Math.max(minimum, Math.min(maximum, value));
  }

  function surfaceMix(start, end, amount) {
    return start + (end - start) * amount;
  }

  function surfaceSmoothStep(start, end, value) {
    const amount = surfaceClamp((value - start) / Math.max(0.0001, end - start), 0, 1);

    return amount * amount * (3 - 2 * amount);
  }

  function surfacePoint(x, y) {
    return {
      x: surfaceNumber(x, 0),
      y: surfaceNumber(y, 0),
    };
  }

  function surfaceCopyPoint(source) {
    return surfacePoint(source.x, source.y);
  }

  function surfaceAddPoints(first, second) {
    return surfacePoint(first.x + second.x, first.y + second.y);
  }

  function surfaceSubtractPoints(first, second) {
    return surfacePoint(first.x - second.x, first.y - second.y);
  }

  function surfaceScalePoint(source, amount) {
    return surfacePoint(source.x * amount, source.y * amount);
  }

  function surfaceMixPoints(first, second, amount) {
    return surfacePoint(
      surfaceMix(first.x, second.x, amount),
      surfaceMix(first.y, second.y, amount),
    );
  }

  function surfaceVectorLength(vector) {
    return Math.hypot(vector.x, vector.y);
  }

  function surfaceNormalizeVector(vector) {
    const length = surfaceVectorLength(vector);

    if (length < 0.0001) {
      return surfacePoint(1, 0);
    }

    return surfacePoint(vector.x / length, vector.y / length);
  }

  function surfacePerpendicularVector(vector) {
    return surfacePoint(-vector.y, vector.x);
  }

  function surfacePointDistance(first, second) {
    return Math.hypot(second.x - first.x, second.y - first.y);
  }

  function surfaceDotProduct(first, second) {
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
    const t = surfaceClamp(amount, 0, 1);

    const shifted = surfaceClamp((t - 0.035) / 0.965, 0, 1);

    const arch = Math.pow(Math.max(0, Math.sin(Math.PI * shifted)), 0.86);

    const medialRelease = surfaceSmoothStep(0, 0.075, t);
    const temporalRelease = 1 - surfaceSmoothStep(0.94, 1, t);

    const temporalBias = surfaceMix(0.93, 1.1, surfaceSmoothStep(0.22, 0.68, t));

    const outerTaper = 1 - 0.1 * surfaceSmoothStep(0.76, 1, t);

    return arch * medialRelease * temporalRelease * temporalBias * outerTaper;
  }

  /*
      Lower lid remains shallower than the upper lid, but has
      enough volume to support the globe. Its low region is
      shifted slightly outward instead of sitting at center.
  */
  function lowerLidProfile(amount) {
    const t = surfaceClamp(amount, 0, 1);

    const shifted = surfaceClamp((t - 0.015) / 0.985, 0, 1);

    const arch = Math.pow(Math.max(0, Math.sin(Math.PI * shifted)), 1.22);

    const medialRelease = surfaceSmoothStep(0, 0.07, t);
    const temporalRelease = 1 - surfaceSmoothStep(0.95, 1, t);

    const supportBias = surfaceMix(0.94, 1.08, surfaceSmoothStep(0.38, 0.76, t));

    const temporalRise = 1 - 0.14 * surfaceSmoothStep(0.72, 0.96, t);

    return arch * medialRelease * temporalRelease * supportBias * temporalRise;
  }

  /* ==========================
     SURFACE MEASUREMENTS
  ========================== */

  function measureLandmarkOffset(landmark, axisPoint, direction) {
    if (!landmark) {
      return 0;
    }

    return surfaceDotProduct(surfaceSubtractPoints(landmark, axisPoint), direction);
  }

  function resolveSurfaceMeasurements(landmarks) {
    const sourceInner = landmarks.innerCanthus;
    const sourceOuter = landmarks.outerCanthus;

    const sourceAxisVector = surfaceSubtractPoints(sourceOuter, sourceInner);

    const sourceAxis = surfaceNormalizeVector(sourceAxisVector);

    let upperNormal = surfacePerpendicularVector(sourceAxis);

    if (upperNormal.y > 0) {
      upperNormal = surfaceScalePoint(upperNormal, -1);
    }

    const lowerNormal = surfaceScalePoint(upperNormal, -1);

    const sourceWidth = Math.max(4, surfaceVectorLength(sourceAxisVector));

    /*
        The medial corner sits lower toward the nose.
        The outer corner receives only a slight lift.
    */
    const medialDrop = surfaceClamp(sourceWidth * 0.035, 2.0, 3.4);

    const temporalLift = surfaceClamp(sourceWidth * 0.008, 0.35, 0.8);

    const innerCanthus = surfaceAddPoints(
      sourceInner,
      surfaceScalePoint(lowerNormal, medialDrop),
    );

    const outerCanthus = surfaceAddPoints(
      sourceOuter,
      surfaceScalePoint(upperNormal, temporalLift),
    );

    const eyeAxisVector = surfaceSubtractPoints(outerCanthus, innerCanthus);

    const width = Math.max(4, surfaceVectorLength(eyeAxisVector));

    const eyeAxis = surfaceNormalizeVector(eyeAxisVector);

    upperNormal = surfacePerpendicularVector(eyeAxis);

    if (upperNormal.y > 0) {
      upperNormal = surfaceScalePoint(upperNormal, -1);
    }

    const adjustedLowerNormal = surfaceScalePoint(upperNormal, -1);

    const middleAxisPoint = surfaceMixPoints(innerCanthus, outerCanthus, 0.5);

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
        More open than EyeSurface 1.2.
        These limits prevent the eye from collapsing into a
        squint while still keeping the upper lid dominant.
    */
    const upperHeight = surfaceClamp(requestedUpperHeight, width * 0.17, width * 0.23);

    const lowerDepth = surfaceClamp(requestedLowerDepth, width * 0.072, width * 0.115);

    return {
      sourceInnerCanthus: surfaceCopyPoint(sourceInner),
      sourceOuterCanthus: surfaceCopyPoint(sourceOuter),

      innerCanthus: surfaceCopyPoint(innerCanthus),
      outerCanthus: surfaceCopyPoint(outerCanthus),

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

    const sampleCount = surfaceClamp(
      Math.floor(surfaceNumber(parameters && parameters.sampleCount, 18) * 3),
      42,
      84,
    );

    const upperSamples = [];
    const lowerSamples = [];

    for (let index = 0; index <= sampleCount; index += 1) {
      const amount = index / sampleCount;

      const axisPoint = surfaceMixPoints(
        measurements.innerCanthus,
        measurements.outerCanthus,
        amount,
      );

      const upperPoint = surfaceAddPoints(
        axisPoint,
        surfaceScalePoint(
          measurements.upperNormal,
          measurements.upperHeight * upperLidProfile(amount),
        ),
      );

      const lowerPoint = surfaceAddPoints(
        axisPoint,
        surfaceScalePoint(
          measurements.lowerNormal,
          measurements.lowerDepth * lowerLidProfile(amount),
        ),
      );

      upperSamples.push({
        amount: amount,
        surfacePoint: upperPoint,
      });

      lowerSamples.push({
        amount: amount,
        surfacePoint: lowerPoint,
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
      const previous = samples[Math.max(0, index - 1)].surfacePoint;

      const next = samples[Math.min(samples.length - 1, index + 1)].surfacePoint;

      const tangent = surfaceNormalizeVector(surfaceSubtractPoints(next, previous));

      let normal = surfacePerpendicularVector(tangent);

      if (surfaceDotProduct(normal, preferredNormal) < 0) {
        normal = surfaceScalePoint(normal, -1);
      }

      sample.tangent = tangent;
      sample.normal = surfaceNormalizeVector(normal);
    });
  }

  /* ==========================
     PATH GENERATION
  ========================== */

  function createPathFromSamples(samples) {
    if (!samples.length) {
      return "";
    }

    const commands = [`M ${samples[0].surfacePoint.x} ${samples[0].surfacePoint.y}`];

    for (let index = 1; index < samples.length; index += 1) {
      const previous = samples[Math.max(0, index - 2)].surfacePoint;

      const current = samples[index - 1].surfacePoint;
      const next = samples[index].surfacePoint;

      const after = samples[Math.min(samples.length - 1, index + 1)].surfacePoint;

      const control1 = surfacePoint(
        current.x + (next.x - previous.x) / 6,
        current.y + (next.y - previous.y) / 6,
      );

      const control2 = surfacePoint(
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
      total += surfacePointDistance(samples[index - 1].surfacePoint, samples[index].surfacePoint);
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

    let minX = samples[0].surfacePoint.x;
    let minY = samples[0].surfacePoint.y;
    let maxX = samples[0].surfacePoint.x;
    let maxY = samples[0].surfacePoint.y;

    samples.forEach(function inspectSample(sample) {
      minX = Math.min(minX, sample.surfacePoint.x);
      minY = Math.min(minY, sample.surfacePoint.y);
      maxX = Math.max(maxX, sample.surfacePoint.x);
      maxY = Math.max(maxY, sample.surfacePoint.y);
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
    const resolvedAmount = surfaceClamp(surfaceNumber(amount, 0), 0, 1);

    const scaledIndex = resolvedAmount * (samples.length - 1);

    const lowerIndex = Math.floor(scaledIndex);

    const upperIndex = Math.min(samples.length - 1, lowerIndex + 1);

    const localAmount = scaledIndex - lowerIndex;

    const lowerSample = samples[lowerIndex];
    const upperSample = samples[upperIndex];

    return {
      amount: resolvedAmount,

      surfacePoint: surfaceMixPoints(lowerSample.surfacePoint, upperSample.surfacePoint, localAmount),

      tangent: surfaceNormalizeVector(
        surfaceMixPoints(lowerSample.tangent, upperSample.tangent, localAmount),
      ),

      normal: surfaceNormalizeVector(
        surfaceMixPoints(lowerSample.normal, upperSample.normal, localAmount),
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

      surfacePoint: function getCurvePoint(amount) {
        return surfaceCopyPoint(interpolateSample(samples, amount).surfacePoint);
      },

      tangent: function getCurveTangent(amount) {
        return surfaceCopyPoint(interpolateSample(samples, amount).tangent);
      },

      normal: function getCurveNormal(amount) {
        return surfaceCopyPoint(interpolateSample(samples, amount).normal);
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
    const nasalDirection = surfaceScalePoint(generated.eyeAxis, -1);

    const ductLength = surfaceClamp(generated.width * 0.052, 3.6, 5.8);

    const ductHeight = surfaceClamp(generated.width * 0.022, 1.5, 2.6);

    const tip = surfaceAddPoints(
      inner,
      surfaceAddPoints(
        surfaceScalePoint(nasalDirection, ductLength),
        surfaceScalePoint(generated.lowerNormal, ductHeight * 0.25),
      ),
    );

    const upperJoin = surfaceAddPoints(
      inner,
      surfaceScalePoint(generated.upperNormal, ductHeight * 0.45),
    );

    const lowerJoin = surfaceAddPoints(
      inner,
      surfaceScalePoint(generated.lowerNormal, ductHeight * 0.72),
    );

    const upperControl = surfaceMixPoints(upperJoin, tip, 0.62);

    const lowerControl = surfaceMixPoints(lowerJoin, tip, 0.62);

    const path = [
      `M ${upperJoin.x} ${upperJoin.y}`,

      `C ${upperControl.x} ${upperControl.y}`,
      `${tip.x} ${tip.y - ductHeight * 0.28}`,
      `${tip.x} ${tip.y}`,

      `C ${tip.x} ${tip.y + ductHeight * 0.28}`,
      `${lowerControl.x} ${lowerControl.y}`,
      `${lowerJoin.x} ${lowerJoin.y}`,

      `Q ${inner.x} ${inner.y}`,
      `${upperJoin.x} ${upperJoin.y}`,

      "Z",
    ].join(" ");

    return {
      path: path,
      tip: surfaceCopyPoint(tip),
      upperJoin: surfaceCopyPoint(upperJoin),
      lowerJoin: surfaceCopyPoint(lowerJoin),
      innerCanthus: surfaceCopyPoint(inner),
      nasalDirection: surfaceCopyPoint(nasalDirection),
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

          surfacePoint: surfaceCopyPoint(sample.surfacePoint),
          tangent: surfaceScalePoint(sample.tangent, -1),
          normal: surfaceCopyPoint(sample.normal),
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
        tearDuct: surfaceCopyPoint(innerCanthusSurface.tip),

        sourceInnerCanthus: surfaceCopyPoint(generated.sourceInnerCanthus),

        innerCanthus: surfaceCopyPoint(generated.innerCanthus),

        sourceOuterCanthus: surfaceCopyPoint(generated.sourceOuterCanthus),

        outerCanthus: surfaceCopyPoint(generated.outerCanthus),

        upperPeak: surfaceCopyPoint(landmarks.upperPeak),

        lowerLow: surfaceCopyPoint(landmarks.lowerLow),

        eyeAxis: surfaceCopyPoint(generated.eyeAxis),
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

  function buildSurfaceGeometry(landmarks, parameters) {
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
          Keep legacy property available, but surfacePoint it to the
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

  /* ==========================
     UPPER LID COMPONENT
  ========================== */


  function upperNumber(value, fallback) {
    const resolved = Number(value);
    return Number.isFinite(resolved) ? resolved : fallback;
  }

  function upperClamp(value, minimum, maximum) {
    return Math.max(minimum, Math.min(maximum, value));
  }

  function upperMix(start, end, amount) {
    return start + (end - start) * amount;
  }

  function upperSmoothStep(start, end, value) {
    const amount = upperClamp(
      (value - start) / Math.max(0.0001, end - start),
      0,
      1,
    );

    return amount * amount * (3 - 2 * amount);
  }

  function upperPoint(x, y) {
    return {
      x: upperNumber(x, 0),
      y: upperNumber(y, 0),
    };
  }

  function upperCopyPoint(source) {
    return source
      ? upperPoint(source.x, source.y)
      : upperPoint(0, 0);
  }

  function upperAddPoints(first, second) {
    return upperPoint(
      first.x + second.x,
      first.y + second.y,
    );
  }

  function upperSubtractPoints(first, second) {
    return upperPoint(
      first.x - second.x,
      first.y - second.y,
    );
  }

  function upperScalePoint(source, amount) {
    return upperPoint(
      source.x * amount,
      source.y * amount,
    );
  }

  function upperVectorLength(vector) {
    return Math.hypot(vector.x, vector.y);
  }

  function upperNormalizeVector(vector) {
    const length = upperVectorLength(vector);

    if (length < 0.0001) {
      return upperPoint(1, 0);
    }

    return upperPoint(
      vector.x / length,
      vector.y / length,
    );
  }

  function upperPerpendicularVector(vector) {
    return upperPoint(-vector.y, vector.x);
  }

  function upperDotProduct(first, second) {
    return first.x * second.x + first.y * second.y;
  }

  function upperReversePoints(points) {
    return points
      .slice()
      .reverse()
      .map(upperCopyPoint);
  }

  function upperCreateSmoothPath(points) {
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

      const control1 = upperPoint(
        current.x + (next.x - previous.x) / 6,
        current.y + (next.y - previous.y) / 6,
      );

      const control2 = upperPoint(
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

  function upperRemoveInitialMove(path) {
    return String(path || "").replace(
      /^M\s+[-\d.eE+]+\s+[-\d.eE+]+/,
      "",
    );
  }

  function upperCreateRibbonPath(edgePoints, outerPoints) {
    const edgePath = upperCreateSmoothPath(edgePoints);

    const returnPath = upperCreateSmoothPath(
      upperReversePoints(outerPoints),
    );

    return [
      edgePath,
      upperRemoveInitialMove(returnPath),
      "Z",
    ].join(" ");
  }

  function upperDecorateSamples(points, preferredNormal) {
    return points.map(function decorate(source, index) {
      const previous =
        points[Math.max(0, index - 1)];

      const next =
        points[Math.min(points.length - 1, index + 1)];

      const tangent = upperNormalizeVector(
        upperSubtractPoints(next, previous),
      );

      let normal = upperPerpendicularVector(tangent);

      if (upperDotProduct(normal, preferredNormal) < 0) {
        normal = upperScalePoint(normal, -1);
      }

      return {
        amount:
          index /
          Math.max(1, points.length - 1),

        upperPoint: upperCopyPoint(source),
        tangent: tangent,
        normal: upperNormalizeVector(normal),
      };
    });
  }

  function edgeProfile(amount) {
    const t = upperClamp(amount, 0, 1);

    const shifted = upperClamp(
      (t - 0.022) / 0.978,
      0,
      1,
    );

    const arch = Math.pow(
      Math.max(0, Math.sin(Math.PI * shifted)),
      0.80,
    );

    const medialRelease = upperSmoothStep(0, 0.23, t);

    const lateralRelease =
      1 - upperSmoothStep(0.85, 1, t);

    const crestBias = upperMix(
      0.92,
      1.09,
      upperSmoothStep(0.22, 0.67, t),
    );

    const lateralTaper =
      1 - 0.08 * upperSmoothStep(0.70, 1, t);

    return (
      arch *
      medialRelease *
      lateralRelease *
      crestBias *
      lateralTaper
    );
  }

  function tissueProfile(amount) {
    const t = upperClamp(amount, 0, 1);

    return (
      Math.pow(
        Math.max(0, Math.sin(Math.PI * t)),
        0.70,
      ) *
      upperSmoothStep(0, 0.10, t) *
      (1 - upperSmoothStep(0.91, 1, t))
    );
  }

  function plateProfile(amount) {
    const t = upperClamp(amount, 0, 1);

    return (
      Math.pow(
        Math.max(0, Math.sin(Math.PI * t)),
        0.90,
      ) *
      upperSmoothStep(0, 0.08, t) *
      (1 - upperSmoothStep(0.94, 1, t))
    );
  }

  function creaseProfile(amount) {
    const t = upperClamp(amount, 0, 1);

    return (
      Math.pow(
        Math.max(0, Math.sin(Math.PI * t)),
        0.78,
      ) *
      upperSmoothStep(0, 0.17, t) *
      (1 - upperSmoothStep(0.84, 1, t))
    );
  }

  function buildUpperLidComponent(anatomy, axisModel, options) {
    if (!anatomy || !axisModel) {
      throw new Error(
        "EyeUpperLid.buildUpperLidComponent requires anatomy and axisModel.",
      );
    }

    const settings = {
      sampleCount: 64,

      openingScale: 0.63,
      openingMinimumScale: 0.19,
      openingMaximumScale: 0.27,

      tissueScale: 0.125,
      tissueMinimum: 9,
      tissueMaximum: 16,

      tarsalScale: 0.035,
      tarsalMinimum: 2.4,
      tarsalMaximum: 4.2,

      creaseScale: 0.075,
      creaseMinimum: 5.5,
      creaseMaximum: 10,

      ...(options || {}),
    };

    const baseHeight = upperNumber(
      anatomy.settings && anatomy.settings.height,
      32,
    );

    const openingHeight = upperClamp(
      baseHeight * settings.openingScale,
      axisModel.width * settings.openingMinimumScale,
      axisModel.width * settings.openingMaximumScale,
    );

    const tissueThickness = upperClamp(
      axisModel.width * settings.tissueScale,
      settings.tissueMinimum,
      settings.tissueMaximum,
    );

    const tarsalHeight = upperClamp(
      axisModel.width * settings.tarsalScale,
      settings.tarsalMinimum,
      settings.tarsalMaximum,
    );

    const creaseOffset = upperClamp(
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

      const axisPoint = upperPoint(
        upperMix(
          axisModel.innerCanthus.x,
          axisModel.outerCanthus.x,
          amount,
        ),
        upperMix(
          axisModel.innerCanthus.y,
          axisModel.outerCanthus.y,
          amount,
        ),
      );

      const edge = upperAddPoints(
        axisPoint,
        upperScalePoint(
          axisModel.upperNormal,
          openingHeight * edgeProfile(amount),
        ),
      );

      const tarsal = upperAddPoints(
        edge,
        upperScalePoint(
          axisModel.upperNormal,
          tarsalHeight * plateProfile(amount),
        ),
      );

      const tissue = upperAddPoints(
        edge,
        upperScalePoint(
          axisModel.upperNormal,
          tissueThickness * tissueProfile(amount),
        ),
      );

      const crease = upperAddPoints(
        edge,
        upperScalePoint(
          axisModel.upperNormal,
          creaseOffset * creaseProfile(amount),
        ),
      );

      edgePoints.push(edge);
      tarsalPoints.push(tarsal);
      tissuePoints.push(tissue);
      creasePoints.push(crease);
    }

    const edgePath = upperCreateSmoothPath(edgePoints);
    const skinSurfacePath = upperCreateRibbonPath(
      tarsalPoints,
      tissuePoints,
    );

    const tarsalPlatePath = upperCreateRibbonPath(
      edgePoints,
      tarsalPoints,
    );

    const creasePath = upperCreateSmoothPath(
      creasePoints.slice(
        Math.floor(settings.sampleCount * 0.13),
        Math.ceil(settings.sampleCount * 0.87),
      ),
    );

    function pointAt(amount) {
      const index = Math.round(
        upperClamp(amount, 0, 1) *
          settings.sampleCount,
      );

      return upperCopyPoint(edgePoints[index]);
    }

    return {
      type: "upperLid",
      version: "1.0.0",

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

      samples: upperDecorateSamples(
        edgePoints,
        axisModel.upperNormal,
      ),

      surfaceSamples: upperDecorateSamples(
        tissuePoints,
        axisModel.upperNormal,
      ),

      thickness: tissueThickness,
      tarsalHeight: tarsalHeight,
      exposure: openingHeight,
      creaseOffset: creaseOffset,

      medialAttachment: upperCopyPoint(edgePoints[0]),

      lateralAttachment: upperCopyPoint(
        edgePoints[edgePoints.length - 1],
      ),

      landmarks: {
        medialCanthus: upperCopyPoint(edgePoints[0]),
        medialShoulder: pointAt(0.16),
        medialCrest: pointAt(0.34),
        centerCrest: pointAt(0.52),
        lateralCrest: pointAt(0.67),
        lateralShoulder: pointAt(0.84),

        lateralCanthus: upperCopyPoint(
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

  /* ==========================
     LOWER LID COMPONENT
  ========================== */


  function lowerNumber(value, fallback) {
    const resolved = Number(value);
    return Number.isFinite(resolved) ? resolved : fallback;
  }

  function lowerClamp(value, minimum, maximum) {
    return Math.max(minimum, Math.min(maximum, value));
  }

  function lowerMix(start, end, amount) {
    return start + (end - start) * amount;
  }

  function lowerSmoothStep(start, end, value) {
    const amount = lowerClamp(
      (value - start) / Math.max(0.0001, end - start),
      0,
      1,
    );

    return amount * amount * (3 - 2 * amount);
  }

  function lowerPoint(x, y) {
    return {
      x: lowerNumber(x, 0),
      y: lowerNumber(y, 0),
    };
  }

  function lowerCopyPoint(source) {
    return source ? lowerPoint(source.x, source.y) : lowerPoint(0, 0);
  }

  function lowerAddPoints(first, second) {
    return lowerPoint(first.x + second.x, first.y + second.y);
  }

  function lowerSubtractPoints(first, second) {
    return lowerPoint(first.x - second.x, first.y - second.y);
  }

  function lowerScalePoint(source, amount) {
    return lowerPoint(source.x * amount, source.y * amount);
  }

  function lowerVectorLength(vector) {
    return Math.hypot(vector.x, vector.y);
  }

  function lowerNormalizeVector(vector) {
    const length = lowerVectorLength(vector);

    if (length < 0.0001) {
      return lowerPoint(1, 0);
    }

    return lowerPoint(vector.x / length, vector.y / length);
  }

  function lowerPerpendicularVector(vector) {
    return lowerPoint(-vector.y, vector.x);
  }

  function lowerDotProduct(first, second) {
    return first.x * second.x + first.y * second.y;
  }

  function lowerReversePoints(points) {
    return points.slice().reverse().map(lowerCopyPoint);
  }

  function lowerCreateSmoothPath(points) {
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

      const control1 = lowerPoint(
        current.x + (next.x - previous.x) / 6,
        current.y + (next.y - previous.y) / 6,
      );

      const control2 = lowerPoint(
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

  function lowerRemoveInitialMove(path) {
    return String(path || "").replace(
      /^M\s+[-\d.eE+]+\s+[-\d.eE+]+/,
      "",
    );
  }

  function lowerCreateRibbonPath(edgePoints, outerPoints) {
    const returnPath = lowerCreateSmoothPath(
      lowerReversePoints(outerPoints),
    );

    return [
      lowerCreateSmoothPath(edgePoints),
      lowerRemoveInitialMove(returnPath),
      "Z",
    ].join(" ");
  }

  function lowerDecorateSamples(points, preferredNormal) {
    return points.map(function decorate(source, index) {
      const previous = points[Math.max(0, index - 1)];
      const next = points[Math.min(points.length - 1, index + 1)];

      const tangent = lowerNormalizeVector(
        lowerSubtractPoints(next, previous),
      );

      let normal = lowerPerpendicularVector(tangent);

      if (lowerDotProduct(normal, preferredNormal) < 0) {
        normal = lowerScalePoint(normal, -1);
      }

      return {
        amount: index / Math.max(1, points.length - 1),
        lowerPoint: lowerCopyPoint(source),
        tangent: tangent,
        normal: lowerNormalizeVector(normal),
      };
    });
  }

  function edgeProfile(amount) {
    const t = lowerClamp(amount, 0, 1);

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
      lowerSmoothStep(0, 0.10, t) *
      (1 - lowerSmoothStep(0.93, 1, t)) *
      (1 - 0.16 * lowerSmoothStep(0.72, 1, t))
    );
  }

  function tissueProfile(amount) {
    const t = lowerClamp(amount, 0, 1);

    return (
      Math.pow(
        Math.max(0, Math.sin(Math.PI * t)),
        0.88,
      ) *
      lowerSmoothStep(0, 0.13, t) *
      (1 - lowerSmoothStep(0.90, 1, t))
    );
  }

  function troughProfile(amount) {
    const t = lowerClamp(amount, 0, 1);

    return (
      Math.pow(
        Math.max(0, Math.sin(Math.PI * t)),
        1.10,
      ) *
      lowerSmoothStep(0.05, 0.18, t) *
      (1 - lowerSmoothStep(0.78, 0.95, t))
    );
  }

  function buildLowerLidComponent(anatomy, axisModel, options) {
    if (!anatomy || !axisModel) {
      throw new Error(
        "EyeLowerLid.buildLowerLidComponent requires anatomy and axisModel.",
      );
    }

    const settings = {
      sampleCount: 64,

      openingScale: 0.37,
      openingMinimumScale: 0.095,
      openingMaximumScale: 0.155,

      tissueScale: 0.090,
      tissueMinimum: 6.5,
      tissueMaximum: 12,

      supportScale: 0.030,
      supportMinimum: 2,
      supportMaximum: 4,

      troughScale: 0.060,
      troughMinimum: 4.5,
      troughMaximum: 8.5,

      ...(options || {}),
    };

    const baseHeight = lowerNumber(
      anatomy.settings && anatomy.settings.height,
      32,
    );

    const openingDepth = lowerClamp(
      baseHeight * settings.openingScale,
      axisModel.width * settings.openingMinimumScale,
      axisModel.width * settings.openingMaximumScale,
    );

    const tissueThickness = lowerClamp(
      axisModel.width * settings.tissueScale,
      settings.tissueMinimum,
      settings.tissueMaximum,
    );

    const supportHeight = lowerClamp(
      axisModel.width * settings.supportScale,
      settings.supportMinimum,
      settings.supportMaximum,
    );

    const troughOffset = lowerClamp(
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

      const axisPoint = lowerPoint(
        lowerMix(
          axisModel.innerCanthus.x,
          axisModel.outerCanthus.x,
          amount,
        ),
        lowerMix(
          axisModel.innerCanthus.y,
          axisModel.outerCanthus.y,
          amount,
        ),
      );

      const edge = lowerAddPoints(
        axisPoint,
        lowerScalePoint(
          axisModel.lowerNormal,
          openingDepth * edgeProfile(amount),
        ),
      );

      const support = lowerAddPoints(
        edge,
        lowerScalePoint(
          axisModel.lowerNormal,
          supportHeight * tissueProfile(amount),
        ),
      );

      const tissue = lowerAddPoints(
        edge,
        lowerScalePoint(
          axisModel.lowerNormal,
          tissueThickness * tissueProfile(amount),
        ),
      );

      const trough = lowerAddPoints(
        edge,
        lowerScalePoint(
          axisModel.lowerNormal,
          troughOffset * troughProfile(amount),
        ),
      );

      edgePoints.push(edge);
      supportPoints.push(support);
      tissuePoints.push(tissue);
      troughPoints.push(trough);
    }

    const edgePath = lowerCreateSmoothPath(edgePoints);

    const tarsalPlatePath = lowerCreateRibbonPath(
      edgePoints,
      supportPoints,
    );

    const tissuePath = lowerCreateRibbonPath(
      supportPoints,
      tissuePoints,
    );

    const tearTroughPath = lowerCreateSmoothPath(
      troughPoints.slice(
        Math.floor(settings.sampleCount * 0.12),
        Math.ceil(settings.sampleCount * 0.82),
      ),
    );

    function pointAt(amount) {
      return lowerCopyPoint(
        edgePoints[
          Math.round(
            lowerClamp(amount, 0, 1) *
              settings.sampleCount,
          )
        ],
      );
    }

    return {
      type: "lowerLid",
      version: "1.0.0",

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

      samples: lowerDecorateSamples(
        edgePoints,
        axisModel.lowerNormal,
      ),

      surfaceSamples: lowerDecorateSamples(
        tissuePoints,
        axisModel.lowerNormal,
      ),

      thickness: tissueThickness,
      support: openingDepth,
      tarsalHeight: supportHeight,
      troughOffset: troughOffset,

      medialAttachment: lowerCopyPoint(edgePoints[0]),

      lateralAttachment: lowerCopyPoint(
        edgePoints[edgePoints.length - 1],
      ),

      landmarks: {
        medialCanthus: lowerCopyPoint(edgePoints[0]),
        medialShelf: pointAt(0.18),
        tearTrough: pointAt(0.34),
        infraorbitalSupport: pointAt(0.58),
        lateralShelf: pointAt(0.80),
        lateralCanthus: lowerCopyPoint(
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

  /* ==========================
     CANTHUS COMPONENTS
  ========================== */


  function canthusNumber(value, fallback) {
    const resolved = Number(value);
    return Number.isFinite(resolved) ? resolved : fallback;
  }

  function canthusClamp(value, minimum, maximum) {
    return Math.max(minimum, Math.min(maximum, value));
  }

  function canthusPoint(x, y) {
    return {
      x: canthusNumber(x, 0),
      y: canthusNumber(y, 0),
    };
  }

  function canthusCopyPoint(source) {
    return source
      ? canthusPoint(source.x, source.y)
      : canthusPoint(0, 0);
  }

  function canthusAddPoints(first, second) {
    return canthusPoint(
      first.x + second.x,
      first.y + second.y,
    );
  }

  function canthusScalePoint(source, amount) {
    return canthusPoint(
      source.x * amount,
      source.y * amount,
    );
  }

  function canthusMixPoints(first, second, amount) {
    return canthusPoint(
      first.x + (second.x - first.x) * amount,
      first.y + (second.y - first.y) * amount,
    );
  }

  function buildMedialCanthusComponent(
    axisModel,
    upperLid,
    lowerLid,
    options,
  ) {
    const settings = {
      joinInsetScale: 0.018,

      upperJoinLiftScale: 0.008,
      lowerJoinDropScale: 0.012,

      caruncleLengthScale: 0.043,
      caruncleHeightScale: 0.027,

      plicaLengthScale: 0.022,
      plicaHeightScale: 0.014,

      ...(options || {}),
    };

    const width = axisModel.width;

    const inner = canthusCopyPoint(
      axisModel.innerCanthus,
    );

    const nasalDirection = canthusScalePoint(
      axisModel.axis,
      -1,
    );

    /*
        The upper and lower lids stop at separate attachment
        points so the medial corner has real vertical volume.
    */

    const upperJoin = canthusAddPoints(
      inner,
      canthusAddPoints(
        canthusScalePoint(
          axisModel.axis,
          width * settings.joinInsetScale,
        ),
        canthusScalePoint(
          axisModel.upperNormal,
          width * settings.upperJoinLiftScale,
        ),
      ),
    );

    const lowerJoin = canthusAddPoints(
      inner,
      canthusAddPoints(
        canthusScalePoint(
          axisModel.axis,
          width * settings.joinInsetScale,
        ),
        canthusScalePoint(
          axisModel.lowerNormal,
          width * settings.lowerJoinDropScale,
        ),
      ),
    );

    const caruncleLength = canthusClamp(
      width * settings.caruncleLengthScale,
      3.3,
      5.8,
    );

    const caruncleHeight = canthusClamp(
      width * settings.caruncleHeightScale,
      2.1,
      3.8,
    );

    /*
        Caruncle center sits just nasal to the canthus but
        remains between the lid joins instead of floating
        outside the eye.
    */

    const center = canthusAddPoints(
      inner,
      canthusAddPoints(
        canthusScalePoint(
          nasalDirection,
          caruncleLength * 0.20,
        ),
        canthusScalePoint(
          axisModel.lowerNormal,
          caruncleHeight * 0.06,
        ),
      ),
    );

    const nasalRound = canthusAddPoints(
      center,
      canthusScalePoint(
        nasalDirection,
        caruncleLength * 0.55,
      ),
    );

    const temporalRound = canthusAddPoints(
      center,
      canthusScalePoint(
        axisModel.axis,
        caruncleLength * 0.48,
      ),
    );

    const upperRound = canthusAddPoints(
      center,
      canthusScalePoint(
        axisModel.upperNormal,
        caruncleHeight * 0.58,
      ),
    );

    const lowerRound = canthusAddPoints(
      center,
      canthusScalePoint(
        axisModel.lowerNormal,
        caruncleHeight * 0.64,
      ),
    );

    /*
        Rounded organic path.

        There are no pointed tips. Each side is formed from
        broad cubic curves.
    */

    const carunclePath = [
      `M ${upperJoin.x} ${upperJoin.y}`,

      `C ${
        canthusMixPoints(upperJoin, upperRound, 0.50).x
      } ${
        canthusMixPoints(upperJoin, upperRound, 0.50).y
      }`,

      `${
        canthusMixPoints(upperRound, nasalRound, 0.48).x
      } ${
        canthusMixPoints(upperRound, nasalRound, 0.48).y
      }`,

      `${nasalRound.x} ${nasalRound.y}`,

      `C ${
        canthusMixPoints(nasalRound, lowerRound, 0.48).x
      } ${
        canthusMixPoints(nasalRound, lowerRound, 0.48).y
      }`,

      `${
        canthusMixPoints(lowerRound, lowerJoin, 0.50).x
      } ${
        canthusMixPoints(lowerRound, lowerJoin, 0.50).y
      }`,

      `${lowerJoin.x} ${lowerJoin.y}`,

      `C ${
        canthusMixPoints(lowerJoin, temporalRound, 0.52).x
      } ${
        canthusMixPoints(lowerJoin, temporalRound, 0.52).y
      }`,

      `${
        canthusMixPoints(temporalRound, upperJoin, 0.52).x
      } ${
        canthusMixPoints(temporalRound, upperJoin, 0.52).y
      }`,

      `${upperJoin.x} ${upperJoin.y}`,

      "Z",
    ].join(" ");

    /*
        Small soft crescent between the caruncle and sclera.
        It no longer forms a pointed triangle.
    */

    const plicaLength = canthusClamp(
      width * settings.plicaLengthScale,
      1.7,
      3.2,
    );

    const plicaHeight = canthusClamp(
      width * settings.plicaHeightScale,
      1.0,
      2.0,
    );

    const plicaCenter = canthusAddPoints(
      temporalRound,
      canthusScalePoint(
        axisModel.axis,
        plicaLength * 0.22,
      ),
    );

    const plicaUpper = canthusAddPoints(
      plicaCenter,
      canthusScalePoint(
        axisModel.upperNormal,
        plicaHeight,
      ),
    );

    const plicaLower = canthusAddPoints(
      plicaCenter,
      canthusScalePoint(
        axisModel.lowerNormal,
        plicaHeight,
      ),
    );

    const plicaOuter = canthusAddPoints(
      plicaCenter,
      canthusScalePoint(
        axisModel.axis,
        plicaLength,
      ),
    );

    const plicaPath = [
      `M ${plicaUpper.x} ${plicaUpper.y}`,

      `C ${
        canthusMixPoints(plicaUpper, plicaOuter, 0.58).x
      } ${
        canthusMixPoints(plicaUpper, plicaOuter, 0.58).y
      }`,

      `${
        canthusMixPoints(plicaOuter, plicaLower, 0.58).x
      } ${
        canthusMixPoints(plicaOuter, plicaLower, 0.58).y
      }`,

      `${plicaLower.x} ${plicaLower.y}`,

      `Q ${plicaCenter.x} ${plicaCenter.y}`,

      `${plicaUpper.x} ${plicaUpper.y}`,

      "Z",
    ].join(" ");

    return {
      type: "medialCanthus",
      version: "1.1.0",

      canthusPoint: inner,

      upperJoin: upperJoin,
      lowerJoin: lowerJoin,

      caruncle: {
        type: "caruncle",

        path: carunclePath,
        center: center,

        nasalRound: nasalRound,
        temporalRound: temporalRound,
        upperRound: upperRound,
        lowerRound: lowerRound,

        length: caruncleLength,
        height: caruncleHeight,
      },

      plica: {
        type: "plica",

        path: plicaPath,
        center: plicaCenter,
        outer: plicaOuter,

        length: plicaLength,
        height: plicaHeight,
      },

      tearDuct: {
        type: "tearDuct",

        path: carunclePath,
        center: center,

        upperJoin: upperJoin,
        lowerJoin: lowerJoin,

        innerCanthus: inner,
      },
    };
  }

  function buildLateralCanthusComponent(
    axisModel,
    upperLid,
    lowerLid,
  ) {
    const sharedPoint = canthusCopyPoint(
      axisModel.outerCanthus,
    );

    return {
      type: "lateralCanthus",
      version: "1.1.0",

      canthusPoint: sharedPoint,

      upperJoin: canthusCopyPoint(sharedPoint),
      lowerJoin: canthusCopyPoint(sharedPoint),

      path: "",
    };
  }

  function buildCanthusComponents(
    axisModel,
    upperLid,
    lowerLid,
    options,
  ) {
    if (!axisModel || !upperLid || !lowerLid) {
      throw new Error(
        "EyeCanthus.buildCanthusComponents requires axisModel, upperLid and lowerLid.",
      );
    }

    return {
      medial: buildMedialCanthusComponent(
        axisModel,
        upperLid,
        lowerLid,
        options && options.medial,
      ),

      lateral: buildLateralCanthusComponent(
        axisModel,
        upperLid,
        lowerLid,
      ),
    };
  }

  /* ==========================
     EYE ASSEMBLY
  ========================== */


  function assemblyNumber(value, fallback) {
    const resolved = Number(value);
    return Number.isFinite(resolved) ? resolved : fallback;
  }

  function assemblyClamp(value, minimum, maximum) {
    return Math.max(minimum, Math.min(maximum, value));
  }

  function assemblyMix(start, end, amount) {
    return start + (end - start) * amount;
  }

  function assemblySmoothStep(start, end, value) {
    const amount = assemblyClamp(
      (value - start) / Math.max(0.0001, end - start),
      0,
      1,
    );

    return amount * amount * (3 - 2 * amount);
  }

  function assemblyPoint(x, y) {
    return {
      x: assemblyNumber(x, 0),
      y: assemblyNumber(y, 0),
    };
  }

  function assemblyCopyPoint(source) {
    return source
      ? assemblyPoint(source.x, source.y)
      : assemblyPoint(0, 0);
  }

  function assemblyAddPoints(first, second) {
    return assemblyPoint(
      first.x + second.x,
      first.y + second.y,
    );
  }

  function assemblySubtractPoints(first, second) {
    return assemblyPoint(
      first.x - second.x,
      first.y - second.y,
    );
  }

  function assemblyScalePoint(source, amount) {
    return assemblyPoint(
      source.x * amount,
      source.y * amount,
    );
  }

  function assemblyMixPoints(first, second, amount) {
    return assemblyPoint(
      assemblyMix(first.x, second.x, amount),
      assemblyMix(first.y, second.y, amount),
    );
  }

  function assemblyVectorLength(vector) {
    return Math.hypot(vector.x, vector.y);
  }

  function assemblyNormalizeVector(vector) {
    const length = assemblyVectorLength(vector);

    if (length < 0.0001) {
      return assemblyPoint(1, 0);
    }

    return assemblyPoint(
      vector.x / length,
      vector.y / length,
    );
  }

  function assemblyPerpendicularVector(vector) {
    return assemblyPoint(-vector.y, vector.x);
  }

  function assemblyDotProduct(first, second) {
    return first.x * second.x + first.y * second.y;
  }

  function assemblyReversePoints(points) {
    return points
      .slice()
      .reverse()
      .map(assemblyCopyPoint);
  }

  function assemblyCreateSmoothPath(points) {
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

      const control1 = assemblyPoint(
        current.x + (next.x - previous.x) / 6,
        current.y + (next.y - previous.y) / 6,
      );

      const control2 = assemblyPoint(
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

  function assemblyRemoveInitialMove(path) {
    return String(path || "").replace(
      /^M\s+[-\d.eE+]+\s+[-\d.eE+]+/,
      "",
    );
  }

  function assemblyCreateRibbonPath(edgePoints, outerPoints) {
    const edgePath = assemblyCreateSmoothPath(edgePoints);

    const returningPath = assemblyCreateSmoothPath(
      assemblyReversePoints(outerPoints),
    );

    return [
      edgePath,
      assemblyRemoveInitialMove(returningPath),
      "Z",
    ].join(" ");
  }

  function assemblyDecorateSamples(points, preferredNormal) {
    return points.map(function decorate(source, index) {
      const previous =
        points[Math.max(0, index - 1)];

      const next =
        points[Math.min(points.length - 1, index + 1)];

      const tangent = assemblyNormalizeVector(
        assemblySubtractPoints(next, previous),
      );

      let normal = assemblyPerpendicularVector(tangent);

      if (assemblyDotProduct(normal, preferredNormal) < 0) {
        normal = assemblyScalePoint(normal, -1);
      }

      return {
        amount:
          index /
          Math.max(1, points.length - 1),

        assemblyPoint: assemblyCopyPoint(source),
        tangent: tangent,
        normal: assemblyNormalizeVector(normal),
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

    const sourceVector = assemblySubtractPoints(
      sourceOuter,
      sourceInner,
    );

    const sourceAxis = assemblyNormalizeVector(sourceVector);

    let upperNormal = assemblyPerpendicularVector(sourceAxis);

    if (upperNormal.y > 0) {
      upperNormal = assemblyScalePoint(upperNormal, -1);
    }

    const width = Math.max(
      1,
      assemblyVectorLength(sourceVector),
    );

    /*
        Medial side sits lower toward the nose.
        Lateral side is only slightly higher.
    */

    const medialDrop = assemblyClamp(
      width * 0.045,
      2.8,
      4.4,
    );

    const lateralLift = assemblyClamp(
      width * 0.010,
      0.5,
      1.0,
    );

    const innerCanthus = assemblyAddPoints(
      sourceInner,
      assemblyScalePoint(upperNormal, -medialDrop),
    );

    const outerCanthus = assemblyAddPoints(
      sourceOuter,
      assemblyScalePoint(upperNormal, lateralLift),
    );

    const axisVector = assemblySubtractPoints(
      outerCanthus,
      innerCanthus,
    );

    const axis = assemblyNormalizeVector(axisVector);

    upperNormal = assemblyPerpendicularVector(axis);

    if (upperNormal.y > 0) {
      upperNormal = assemblyScalePoint(upperNormal, -1);
    }

    return {
      sourceInnerCanthus: assemblyCopyPoint(sourceInner),
      sourceOuterCanthus: assemblyCopyPoint(sourceOuter),

      innerCanthus: assemblyCopyPoint(innerCanthus),
      outerCanthus: assemblyCopyPoint(outerCanthus),

      axis: axis,
      upperNormal: upperNormal,
      lowerNormal: assemblyScalePoint(upperNormal, -1),

      width: Math.max(1, assemblyVectorLength(axisVector)),

      center: assemblyMixPoints(
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
    const t = assemblyClamp(amount, 0, 1);

    const shifted = assemblyClamp(
      (t - 0.025) / 0.975,
      0,
      1,
    );

    const arch = Math.pow(
      Math.max(0, Math.sin(Math.PI * shifted)),
      0.78,
    );

    const innerRelease = assemblySmoothStep(0, 0.22, t);

    const outerRelease =
      1 - assemblySmoothStep(0.86, 1, t);

    const outerBias = assemblyMix(
      0.91,
      1.09,
      assemblySmoothStep(0.20, 0.68, t),
    );

    return (
      arch *
      innerRelease *
      outerRelease *
      outerBias
    );
  }

  function upperTissueProfile(amount) {
    const t = assemblyClamp(amount, 0, 1);

    return (
      Math.pow(
        Math.max(0, Math.sin(Math.PI * t)),
        0.75,
      ) *
      assemblySmoothStep(0, 0.12, t) *
      (1 - assemblySmoothStep(0.90, 1, t))
    );
  }

  function lowerEdgeProfile(amount) {
    const t = assemblyClamp(amount, 0, 1);

    const shifted = assemblyClamp(
      (t - 0.01) / 0.99,
      0,
      1,
    );

    const arch = Math.pow(
      Math.max(0, Math.sin(Math.PI * shifted)),
      1.08,
    );

    const innerRelease = assemblySmoothStep(0, 0.11, t);

    const outerRelease =
      1 - assemblySmoothStep(0.91, 1, t);

    /*
        Fuller beneath the iris, with the low assemblyPoint
        shifted slightly toward the outer half.
    */
    const supportBias = assemblyMix(
      0.94,
      1.12,
      assemblySmoothStep(0.34, 0.70, t),
    );

    const outerRise =
      1 - 0.16 * assemblySmoothStep(0.74, 1, t);

    return (
      arch *
      innerRelease *
      outerRelease *
      supportBias *
      outerRise
    );
  }

  function lowerTissueProfile(amount) {
    const t = assemblyClamp(amount, 0, 1);

    return (
      Math.pow(
        Math.max(0, Math.sin(Math.PI * t)),
        0.92,
      ) *
      assemblySmoothStep(0, 0.15, t) *
      (1 - assemblySmoothStep(0.88, 1, t))
    );
  }

  /* ==========================
     GLOBE
  ========================== */

  function buildGlobeComponent(anatomy, axisModel) {
    const irisRadius = assemblyNumber(
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
        ? assemblyCopyPoint(anatomy.landmarks.globeCenter)
        : assemblyCopyPoint(
            anatomy.landmarks.irisCenter ||
              axisModel.center,
          );

    return {
      type: "globe",

      center: globeCenter,
      radius: globeRadius,

      radiusX: assemblyNumber(
        anatomy.landmarks &&
          anatomy.landmarks.globeRadiusX,
        globeRadius,
      ),

      radiusY: assemblyNumber(
        anatomy.landmarks &&
          anatomy.landmarks.globeRadiusY,
        globeRadius,
      ),

      iris: {
        center: assemblyCopyPoint(anatomy.iris.center),
        radius: anatomy.iris.radius,
      },

      pupil: {
        center: assemblyCopyPoint(anatomy.pupil.center),
        radius: anatomy.pupil.radius,
      },
    };
  }

  /* ==========================
     UPPER LID
  ========================== */

  function buildUpperLid(anatomy, axisModel) {
    return buildUpperLidComponent(anatomy, axisModel);
  }

  /* ==========================
     LOWER LID
  ========================== */

  function buildLowerLid(anatomy, axisModel) {
    return buildLowerLidComponent(anatomy, axisModel);
  }

  /* ==========================
     CANTHI
  ========================== */

  function buildCanthi(
    axisModel,
    upperLid,
    lowerLid,
  ) {
    return buildCanthusComponents(
      axisModel,
      upperLid,
      lowerLid,
    );
  }

  /* ==========================
     OPENING
  ========================== */

  function buildOpeningComponent(
    upperLid,
    lowerLid,
    medialCanthus,
    lateralCanthus,
  ) {
    /*
        Force both ends to share exact connection points.
    */

    const upperPoints = upperLid.points.map(assemblyCopyPoint);
    const lowerPoints = lowerLid.points.map(assemblyCopyPoint);

    upperPoints[0] = assemblyCopyPoint(
      medialCanthus.upperJoin,
    );

    lowerPoints[0] = assemblyCopyPoint(
      medialCanthus.lowerJoin,
    );

    upperPoints[
      upperPoints.length - 1
    ] = assemblyCopyPoint(
      lateralCanthus.assemblyPoint,
    );

    lowerPoints[
      lowerPoints.length - 1
    ] = assemblyCopyPoint(
      lateralCanthus.assemblyPoint,
    );

    const upperPath = assemblyCreateSmoothPath(upperPoints);

    const lowerPath = assemblyCreateSmoothPath(
      assemblyReversePoints(lowerPoints),
    );

    return {
      type: "opening",

      path: [
        upperPath,
        assemblyRemoveInitialMove(lowerPath),
        "Z",
      ].join(" "),

      upperPath: upperPath,
      lowerPath: lowerPath,

      upperSamples: assemblyDecorateSamples(
        upperPoints,
        assemblyPoint(0, -1),
      ),

      lowerSamples: assemblyDecorateSamples(
        lowerPoints,
        assemblyPoint(0, 1),
      ),
    };
  }

  /* ==========================
     BUILD
  ========================== */

  function buildEyeAssembly(inputSettings) {
    if (
      !window.EyeBuilder ||
      typeof window.EyeBuilder.buildEyeAssembly !== "function"
    ) {
      throw new Error(
        "EyeAssembly requires EyeBuilder. Load eyeBuilder.js before eyeAssembly.js.",
      );
    }

    const anatomy = window.EyeBuilder.buildEyeAssembly(
      inputSettings,
    );

    const axisModel = createAxisModel(anatomy);

    if (!axisModel) {
      return anatomy;
    }

    const globe = buildGlobeComponent(
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

    const opening = buildOpeningComponent(
      upperLid,
      lowerLid,
      medialCanthus,
      lateralCanthus,
    );

    const assembly = {
      type: "eyeAssembly",
      version: "1.5.0",

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

  /*
      Public geometry API.

      Existing callers can still use EyeGeometry.build for
      base geometry, while EyeGeometry.buildEye returns the
      complete assembled anatomy.
  */

  window.EyeGeometry = {
    ...BaseEyeGeometry,

    version: "5.0.0",

    buildBase: BaseEyeGeometry.build,

    buildSurface: buildSurfaceGeometry,

    buildUpperLid: buildUpperLidComponent,

    buildLowerLid: buildLowerLidComponent,

    buildCanthi: buildCanthusComponents,

    buildEye: buildEyeAssembly,
  };

  /*
      Temporary compatibility alias. This lets the current
      eyes.js continue calling EyeBuilder.build while all
      implementation now lives inside eyeGeometry.js.
  */

  window.EyeBuilder = {
    version: "5.0.0-compat",

    defaults: BaseEyeBuilder.defaults,

    build: function buildConsolidatedEye(inputSettings) {
      return buildEyeAssembly(inputSettings);
    },

    buildLandmarks: BaseEyeBuilder.buildLandmarks,

    describe: BaseEyeBuilder.describe,

    getDefaults: BaseEyeBuilder.getDefaults,
  };

  console.log("EyeGeometry 5.0 consolidated loaded");
})();
