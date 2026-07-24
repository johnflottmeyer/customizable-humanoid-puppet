/* ==========================
   FACELAB
   MOUTH LANDMARKS — V1.0

   Creates predictable anatomical points
   for the landmark-based mouth engine.

   This file does not draw anything.
========================== */

(function () {
  "use strict";

  /* ==========================
     NUMBER HELPERS
  ========================== */

  function safeNumber(value, fallback) {
    const number = Number(value);

    return Number.isFinite(number) ? number : fallback;
  }

  function clamp(value, minimum, maximum) {
    return Math.max(minimum, Math.min(maximum, value));
  }

  function createPoint(x, y) {
    if (window.Point) {
      return new window.Point(x, y);
    }

    return {
      x: x,
      y: y,
    };
  }

  /* ==========================
     BUILD LANDMARKS
  ========================== */

  function build(settings) {
    const source = settings || {};

    const centerX = safeNumber(source.centerX, 250);

    const centerY = safeNumber(source.centerY, 381);

    const width = clamp(safeNumber(source.width, 150), 30, 300);

    const halfWidth = width / 2;

    const cornerY = safeNumber(source.cornerY, 0);

    const upperLipThickness = clamp(
      safeNumber(source.upperLipThickness, 6.5),
      0,
      35,
    );

    const lowerLipThickness = clamp(
      safeNumber(source.lowerLipThickness, 7.2),
      0,
      40,
    );

    const cupidBowHeight = clamp(safeNumber(source.cupidBowHeight, 2.5), 0, 20);

    const cupidBowWidth = clamp(
      safeNumber(source.cupidBowWidth, 0.16),
      0.05,
      0.4,
    );

    const philtrumDip = clamp(safeNumber(source.philtrumDip, 1.5), 0, 15);

    const upperCenterFullness = clamp(
      safeNumber(source.upperCenterFullness, 0),
      -10,
      20,
    );

    const lowerCenterFullness = clamp(
      safeNumber(source.lowerCenterFullness, 1.8),
      -10,
      25,
    );

    const lowerLobeWidth = clamp(
      safeNumber(source.lowerLobeWidth, 0.3),
      0.08,
      0.7,
    );

    const smile = clamp(safeNumber(source.smile, 0), -20, 20);

    /*
      Positive smile raises the mouth corners
      because SVG Y increases downward.
    */

    const cornerOffsetY = cornerY - smile;

    const leftCorner = createPoint(
      centerX - halfWidth,
      centerY + cornerOffsetY,
    );

    const rightCorner = createPoint(
      centerX + halfWidth,
      centerY + cornerOffsetY,
    );

    /*
      The mouth seam has a shallow center curve.
      It remains independent of lip thickness.
    */

    const seamLeftCenter = createPoint(
      centerX - width * 0.25,
      centerY - smile * 0.12,
    );

    const seamCenter = createPoint(centerX, centerY);

    const seamRightCenter = createPoint(
      centerX + width * 0.25,
      centerY - smile * 0.12,
    );

    /*
      Upper lip landmarks.
    */

    const cupidOffsetX = width * cupidBowWidth;

    const upperPeakY =
      centerY - upperLipThickness - cupidBowHeight - upperCenterFullness * 0.25;

    const upperDipY = centerY - upperLipThickness + philtrumDip;

    const upperLeftOuter = createPoint(
      centerX - width * 0.33,
      centerY - upperLipThickness * 0.55,
    );

    const upperLeftPeak = createPoint(centerX - cupidOffsetX, upperPeakY);

    const upperCenterDip = createPoint(centerX, upperDipY);

    const upperRightPeak = createPoint(centerX + cupidOffsetX, upperPeakY);

    const upperRightOuter = createPoint(
      centerX + width * 0.33,
      centerY - upperLipThickness * 0.55,
    );

    /*
      Lower lip landmarks.
    */

    const lowerCenterY = centerY + lowerLipThickness + lowerCenterFullness;

    const lowerLobeOffsetX = width * lowerLobeWidth;

    const lowerLeftOuter = createPoint(
      centerX - width * 0.34,
      centerY + lowerLipThickness * 0.45,
    );

    const lowerLeftLobe = createPoint(
      centerX - lowerLobeOffsetX,
      centerY + lowerLipThickness + lowerCenterFullness * 0.72,
    );

    const lowerCenter = createPoint(centerX, lowerCenterY);

    const lowerRightLobe = createPoint(
      centerX + lowerLobeOffsetX,
      centerY + lowerLipThickness + lowerCenterFullness * 0.72,
    );

    const lowerRightOuter = createPoint(
      centerX + width * 0.34,
      centerY + lowerLipThickness * 0.45,
    );

    return {
      center: createPoint(centerX, centerY),

      leftCorner: leftCorner,
      rightCorner: rightCorner,

      seamLeftCenter: seamLeftCenter,
      seamCenter: seamCenter,
      seamRightCenter: seamRightCenter,

      upperLeftOuter: upperLeftOuter,
      upperLeftPeak: upperLeftPeak,
      upperCenterDip: upperCenterDip,
      upperRightPeak: upperRightPeak,
      upperRightOuter: upperRightOuter,

      lowerLeftOuter: lowerLeftOuter,
      lowerLeftLobe: lowerLeftLobe,
      lowerCenter: lowerCenter,
      lowerRightLobe: lowerRightLobe,
      lowerRightOuter: lowerRightOuter,
    };
  }

  /* ==========================
     PUBLIC API
  ========================== */

  window.MouthLandmarks = {
    build: build,
  };

  window.FaceLab = window.FaceLab || {};

  window.FaceLab.MouthLandmarks = window.MouthLandmarks;

  console.log("mouthLandmarks.js V1.0 loaded");
})();
