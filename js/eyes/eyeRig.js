/* =========================================================
   FACELAB EYE RIG
   Version 1.0.0

   PURPOSE

   Poses anatomical landmarks between EyeBuilder and
   EyeGeometry without changing either the renderer or the
   underlying resting anatomy.

   PIPELINE

   EyeBuilder -> EyeRig -> EyeGeometry -> EyeRenderer

   LOAD BEFORE:
   js/eyes/eyeBuilder.js
========================================================= */

(function initializeEyeRig() {
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

  function point(x, y) {
    return { x: number(x, 0), y: number(y, 0) };
  }

  function copyValue(value) {
    if (
      value &&
      typeof value === "object" &&
      Number.isFinite(value.x) &&
      Number.isFinite(value.y)
    ) {
      return point(value.x, value.y);
    }

    return value;
  }

  function cloneLandmarks(landmarks) {
    const clone = {};

    Object.keys(landmarks || {}).forEach(function cloneLandmark(key) {
      clone[key] = copyValue(landmarks[key]);
    });

    return clone;
  }

  function move(landmarks, name, deltaX, deltaY, weight) {
    const source = landmarks[name];

    if (!source || !Number.isFinite(source.x) || !Number.isFinite(source.y)) {
      return;
    }

    source.x += number(deltaX, 0) * weight;
    source.y += number(deltaY, 0) * weight;
  }

  function moveTowardY(landmarks, name, targetY, amount) {
    const source = landmarks[name];

    if (!source || !Number.isFinite(source.y)) {
      return;
    }

    source.y = mix(source.y, targetY, clamp(amount, 0, 1));
  }

  function estimateHeight(landmarks) {
    const upper = landmarks.upperPeak;
    const lower = landmarks.lowerLow;

    if (!upper || !lower) {
      return 32;
    }

    return Math.max(4, Math.abs(lower.y - upper.y));
  }

  function resolveState(inputState) {
    const input = inputState && typeof inputState === "object" ? inputState : {};

    return {
      blink: clamp(number(input.blink, 0), 0, 1),
      squint: clamp(number(input.squint, 0), 0, 1),
      wide: clamp(number(input.wide, 0), 0, 1),
      happy: clamp(number(input.happy, 0), 0, 1),
      angry: clamp(number(input.angry, 0), 0, 1),
      sleepy: clamp(number(input.sleepy, 0), 0, 1),
      gazeX: number(input.gazeX, 0),
      gazeY: number(input.gazeY, 0),
      asymmetry: number(input.asymmetry, 0),
    };
  }

  function applyExpressionPoses(landmarks, state, height) {
    const unit = height / 32;

    /* HAPPY: lower lid rises and the upper outer lid softens. */
    move(landmarks, "lowerInnerShoulder", 0, -2.2 * unit, state.happy);
    move(landmarks, "lowerLow", 0, -3.2 * unit, state.happy);
    move(landmarks, "lowerOuterShoulder", 0, -2.8 * unit, state.happy);
    move(landmarks, "upperOuterShoulder", 0, 1.1 * unit, state.happy);

    /* ANGRY: inner upper lid descends and outer upper lid rises. */
    move(landmarks, "upperInnerShoulder", 0, 3.4 * unit, state.angry);
    move(landmarks, "upperPeak", 0, 1.4 * unit, state.angry);
    move(landmarks, "upperOuterShoulder", 0, -1.4 * unit, state.angry);
    move(landmarks, "lowerInnerShoulder", 0, -0.8 * unit, state.angry);

    /* SLEEPY: upper lid drops with a slight outer bias. */
    move(landmarks, "upperInnerShoulder", 0, 2.4 * unit, state.sleepy);
    move(landmarks, "upperPeak", 0, 4.8 * unit, state.sleepy);
    move(landmarks, "upperOuterShoulder", 0, 5.4 * unit, state.sleepy);

    /* WIDE: open both lids while leaving the canthi anchored. */
    move(landmarks, "upperInnerShoulder", 0, -2.4 * unit, state.wide);
    move(landmarks, "upperPeak", 0, -5.2 * unit, state.wide);
    move(landmarks, "upperOuterShoulder", 0, -3.2 * unit, state.wide);
    move(landmarks, "lowerInnerShoulder", 0, 1.4 * unit, state.wide);
    move(landmarks, "lowerLow", 0, 3.5 * unit, state.wide);
    move(landmarks, "lowerOuterShoulder", 0, 2.0 * unit, state.wide);

    /* SQUINT: both lids move toward the eye axis. */
    const centerY = landmarks.center ? landmarks.center.y : 0;
    moveTowardY(landmarks, "upperInnerShoulder", centerY, state.squint * 0.48);
    moveTowardY(landmarks, "upperPeak", centerY, state.squint * 0.58);
    moveTowardY(landmarks, "upperOuterShoulder", centerY, state.squint * 0.52);
    moveTowardY(landmarks, "lowerInnerShoulder", centerY, state.squint * 0.38);
    moveTowardY(landmarks, "lowerLow", centerY, state.squint * 0.46);
    moveTowardY(landmarks, "lowerOuterShoulder", centerY, state.squint * 0.42);
  }

  function applyBlink(landmarks, blinkAmount) {
    if (blinkAmount <= 0) {
      return;
    }

    const centerY = landmarks.center ? landmarks.center.y : 0;
    const closureY = centerY + 0.8;

    /* Human blinks are upper-lid dominant. */
    moveTowardY(landmarks, "upperInnerShoulder", closureY, blinkAmount * 0.88);
    moveTowardY(landmarks, "upperPeak", closureY, blinkAmount * 0.96);
    moveTowardY(landmarks, "upperOuterShoulder", closureY, blinkAmount * 0.92);

    moveTowardY(landmarks, "lowerInnerShoulder", closureY, blinkAmount * 0.42);
    moveTowardY(landmarks, "lowerLow", closureY, blinkAmount * 0.48);
    moveTowardY(landmarks, "lowerOuterShoulder", closureY, blinkAmount * 0.45);
  }

  function applyGaze(landmarks, state) {
    ["irisCenter", "pupilCenter"].forEach(function moveGazePoint(name) {
      move(landmarks, name, state.gazeX, state.gazeY, 1);
    });
  }

  function apply(baseLandmarks, inputState) {
    if (!baseLandmarks || typeof baseLandmarks !== "object") {
      throw new Error("EyeRig.apply requires anatomical landmarks.");
    }

    const landmarks = cloneLandmarks(baseLandmarks);
    const state = resolveState(inputState);
    const height = estimateHeight(landmarks);

    applyExpressionPoses(landmarks, state, height);
    applyBlink(landmarks, state.blink);
    applyGaze(landmarks, state);

    return {
      landmarks: landmarks,
      state: state,
      baseLandmarks: cloneLandmarks(baseLandmarks),
    };
  }

  function pose(name, amount, extraState) {
    const state = {
      ...(extraState || {}),
    };

    state[name] = clamp(number(amount, 1), 0, 1);

    return state;
  }

  window.EyeRig = {
    version: "1.0.0",
    apply: apply,
    pose: pose,
    resolveState: resolveState,
    cloneLandmarks: cloneLandmarks,
  };

  console.log("EyeRig 1.0 loaded");
})();
