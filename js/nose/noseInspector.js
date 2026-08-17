/* =========================================================
   FACELAB NOSE INSPECTOR
   Version 1.0.0

   Adds Face Inspector handles to the existing nose.js
   without changing the nose rendering geometry.

   Handles:
   - Move entire nose
   - Overall nose size
   - Nose width
   - Nose height
   - Left/right alar wing size
   - Left/right nostril opening size

   Requires:
   - faceLabCore.js
   - nose.js
   - faceInspector.js
========================================================= */

(function () {
  "use strict";

  const FACE_CENTER_X = 250;
  const BRIDGE_CENTER_Y = 369;

  function number(value, fallback) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  }

  function clamp(value, minimum, maximum) {
    return Math.max(minimum, Math.min(maximum, value));
  }

  function currentSettings() {
    return window.noseSettings || {};
  }

  function updateNose(updates) {
    if (!window.noseSettings || !updates) {
      return;
    }

    Object.assign(window.noseSettings, updates);

    if (typeof window.updateNoseControls === "function") {
      window.updateNoseControls();
    }

    if (typeof window.applyNoseSettings === "function") {
      window.applyNoseSettings();
    }

    if (
      window.FaceInspector &&
      typeof window.FaceInspector.refresh === "function"
    ) {
      window.FaceInspector.refresh();
    }
  }

  function getGeometry() {
    const settings = currentSettings();

    const noseX = number(settings.noseX, 0);
    const noseY = number(settings.noseY, -75);

    const noseWidth = Math.max(number(settings.noseWidth, 29), 4);
    const noseHeight = Math.max(number(settings.noseHeight, 33), 6);

    const nostrilSpacing = Math.max(number(settings.nostrilSpacing, 20), 2);
    const nostrilY = number(settings.nostrilY, 395);
    const nostrilWidth = Math.max(number(settings.nostrilWidth, 26), 3);
    const nostrilHeight = Math.max(number(settings.nostrilHeight, 18), 2);

    const holeSpacing = Math.max(number(settings.nostrilHoleSpacing, 16.5), 2);
    const holeY = number(settings.nostrilHoleY, 398);
    const holeWidth = Math.max(number(settings.nostrilHoleWidth, 6.8), 1);
    const holeHeight = Math.max(number(settings.nostrilHoleHeight, 2.45), 1);

    const leftWingCenterX =
      FACE_CENTER_X - nostrilSpacing - nostrilWidth * 0.28;

    const rightWingCenterX =
      FACE_CENTER_X + nostrilSpacing + nostrilWidth * 0.28;

    const overallHalfWidth = Math.max(
      noseWidth * 1.12,
      nostrilSpacing + nostrilWidth * 0.56
    );

    const overallTopY = BRIDGE_CENTER_Y - noseHeight * 0.36;
    const overallBottomY = Math.max(
      nostrilY + nostrilHeight * 0.55,
      BRIDGE_CENTER_Y + noseHeight * 0.86
    );

    return {
      settings,

      noseX,
      noseY,

      noseWidth,
      noseHeight,

      nostrilSpacing,
      nostrilY,
      nostrilWidth,
      nostrilHeight,

      holeSpacing,
      holeY,
      holeWidth,
      holeHeight,

      center: {
        x: FACE_CENTER_X + noseX,
        y: BRIDGE_CENTER_Y + noseHeight * 0.38 + noseY,
      },

      widthRight: {
        x: FACE_CENTER_X + noseWidth * 1.12 + noseX,
        y: BRIDGE_CENTER_Y + noseHeight * 0.34 + noseY,
      },

      heightTop: {
        x: FACE_CENTER_X + noseX,
        y: overallTopY + noseY,
      },

      leftWing: {
        x: leftWingCenterX - nostrilWidth * 0.30 + noseX,
        y: nostrilY + noseY,
      },

      rightWing: {
        x: rightWingCenterX + nostrilWidth * 0.30 + noseX,
        y: nostrilY + noseY,
      },

      leftHole: {
        x: FACE_CENTER_X - holeSpacing + noseX,
        y: holeY + noseY,
      },

      rightHole: {
        x: FACE_CENTER_X + holeSpacing + noseX,
        y: holeY + noseY,
      },

      overallSize: {
        x: FACE_CENTER_X + overallHalfWidth + 8 + noseX,
        y: overallBottomY + 8 + noseY,
      },
    };
  }

  function scaleWholeNose(scale, start) {
    const safeScale = clamp(scale, 0.45, 2.25);

    const anchorY = BRIDGE_CENTER_Y;

    updateNose({
      noseWidth: clamp(number(start.noseWidth, 29) * safeScale, 8, 80),
      noseHeight: clamp(number(start.noseHeight, 33) * safeScale, 12, 90),

      nostrilSpacing: clamp(
        number(start.nostrilSpacing, 20) * safeScale,
        6,
        70
      ),

      nostrilWidth: clamp(
        number(start.nostrilWidth, 26) * safeScale,
        8,
        70
      ),

      nostrilHeight: clamp(
        number(start.nostrilHeight, 18) * safeScale,
        5,
        50
      ),

      nostrilY:
        anchorY +
        (number(start.nostrilY, 395) - anchorY) * safeScale,

      nostrilHoleSpacing: clamp(
        number(start.nostrilHoleSpacing, 16.5) * safeScale,
        4,
        60
      ),

      nostrilHoleWidth: clamp(
        number(start.nostrilHoleWidth, 6.8) * safeScale,
        1.5,
        28
      ),

      nostrilHoleHeight: clamp(
        number(start.nostrilHoleHeight, 2.45) * safeScale,
        0.8,
        14
      ),

      nostrilHoleY:
        anchorY +
        (number(start.nostrilHoleY, 398) - anchorY) * safeScale,
    });
  }

  function createNoseHandles() {
    const geometry = getGeometry();

    return [
      {
        id: "noseMove",
        label: "Nose Position",
        point: geometry.center,
        properties: ["noseX", "noseY"],
        help: "Drag to move the entire nose.",
        beginDrag: function () {
          return { ...currentSettings() };
        },
        drag: function (deltaX, deltaY, start) {
          updateNose({
            noseX: number(start.noseX, 0) + deltaX,
            noseY: number(start.noseY, -75) + deltaY,
          });
        },
      },

      {
        id: "noseOverallSize",
        label: "Overall Nose Size",
        point: geometry.overallSize,
        properties: [
          "noseWidth",
          "noseHeight",
          "nostrilSpacing",
          "nostrilWidth",
          "nostrilHeight",
          "nostrilHoleSpacing",
          "nostrilHoleWidth",
          "nostrilHoleHeight",
        ],
        help:
          "Drag diagonally outward to enlarge the entire nose, or inward to shrink it proportionally.",
        beginDrag: function () {
          return { ...currentSettings() };
        },
        drag: function (deltaX, deltaY, start) {
          /*
             Use both axes so the handle feels natural when
             dragged diagonally. Right/down enlarges; left/up shrinks.
          */
          const scale =
            1 +
            (deltaX + deltaY) /
              Math.max(
                number(start.noseWidth, 29) +
                  number(start.noseHeight, 33),
                30
              );

          scaleWholeNose(scale, start);
        },
      },

      {
        id: "noseWidth",
        label: "Nose Width",
        point: geometry.widthRight,
        properties: ["noseWidth"],
        help: "Drag horizontally to change tip and lower-bridge width.",
        beginDrag: function () {
          return { ...currentSettings() };
        },
        drag: function (deltaX, deltaY, start) {
          updateNose({
            noseWidth: clamp(
              number(start.noseWidth, 29) + deltaX * 0.65,
              8,
              80
            ),
          });
        },
      },

      {
        id: "noseHeight",
        label: "Nose Height",
        point: geometry.heightTop,
        properties: ["noseHeight"],
        help: "Drag vertically to change the main nose height.",
        beginDrag: function () {
          return { ...currentSettings() };
        },
        drag: function (deltaX, deltaY, start) {
          updateNose({
            noseHeight: clamp(
              number(start.noseHeight, 33) - deltaY * 0.75,
              12,
              90
            ),
          });
        },
      },

      {
        id: "leftAlarWing",
        label: "Left Alar Wing",
        point: geometry.leftWing,
        properties: [
          "nostrilSpacing",
          "nostrilY",
          "nostrilWidth",
          "nostrilHeight",
        ],
        help:
          "Drag horizontally to widen/narrow the wing and vertically to raise/lower it.",
        beginDrag: function () {
          return { ...currentSettings() };
        },
        drag: function (deltaX, deltaY, start) {
          updateNose({
            nostrilSpacing: clamp(
              number(start.nostrilSpacing, 20) - deltaX * 0.35,
              6,
              70
            ),
            nostrilWidth: clamp(
              number(start.nostrilWidth, 26) - deltaX * 0.45,
              8,
              70
            ),
            nostrilY: number(start.nostrilY, 395) + deltaY,
          });
        },
      },

      {
        id: "rightAlarWing",
        label: "Right Alar Wing",
        point: geometry.rightWing,
        properties: [
          "nostrilSpacing",
          "nostrilY",
          "nostrilWidth",
          "nostrilHeight",
        ],
        help:
          "Drag horizontally to widen/narrow the wing and vertically to raise/lower it.",
        beginDrag: function () {
          return { ...currentSettings() };
        },
        drag: function (deltaX, deltaY, start) {
          updateNose({
            nostrilSpacing: clamp(
              number(start.nostrilSpacing, 20) + deltaX * 0.35,
              6,
              70
            ),
            nostrilWidth: clamp(
              number(start.nostrilWidth, 26) + deltaX * 0.45,
              8,
              70
            ),
            nostrilY: number(start.nostrilY, 395) + deltaY,
          });
        },
      },

      {
        id: "leftNostrilOpening",
        label: "Left Nostril Opening",
        point: geometry.leftHole,
        properties: [
          "nostrilHoleSpacing",
          "nostrilHoleY",
          "nostrilHoleWidth",
          "nostrilHoleHeight",
        ],
        help:
          "Drag horizontally to adjust opening size/spacing and vertically to alter opening height/position.",
        beginDrag: function () {
          return { ...currentSettings() };
        },
        drag: function (deltaX, deltaY, start) {
          updateNose({
            nostrilHoleSpacing: clamp(
              number(start.nostrilHoleSpacing, 16.5) - deltaX * 0.25,
              4,
              60
            ),
            nostrilHoleWidth: clamp(
              number(start.nostrilHoleWidth, 6.8) - deltaX * 0.18,
              1.5,
              28
            ),
            nostrilHoleHeight: clamp(
              number(start.nostrilHoleHeight, 2.45) + deltaY * 0.10,
              0.8,
              14
            ),
            nostrilHoleY: number(start.nostrilHoleY, 398) + deltaY * 0.45,
          });
        },
      },

      {
        id: "rightNostrilOpening",
        label: "Right Nostril Opening",
        point: geometry.rightHole,
        properties: [
          "nostrilHoleSpacing",
          "nostrilHoleY",
          "nostrilHoleWidth",
          "nostrilHoleHeight",
        ],
        help:
          "Drag horizontally to adjust opening size/spacing and vertically to alter opening height/position.",
        beginDrag: function () {
          return { ...currentSettings() };
        },
        drag: function (deltaX, deltaY, start) {
          updateNose({
            nostrilHoleSpacing: clamp(
              number(start.nostrilHoleSpacing, 16.5) + deltaX * 0.25,
              4,
              60
            ),
            nostrilHoleWidth: clamp(
              number(start.nostrilHoleWidth, 6.8) + deltaX * 0.18,
              1.5,
              28
            ),
            nostrilHoleHeight: clamp(
              number(start.nostrilHoleHeight, 2.45) + deltaY * 0.10,
              0.8,
              14
            ),
            nostrilHoleY: number(start.nostrilHoleY, 398) + deltaY * 0.45,
          });
        },
      },
    ];
  }

  function registerNoseFeature() {
    if (
      !window.FaceLab ||
      typeof window.FaceLab.registerFeature !== "function" ||
      !window.noseSettings ||
      typeof window.applyNoseSettings !== "function"
    ) {
      return false;
    }

    window.FaceLab.registerFeature("nose", {
      label: "Nose",

      getSettings: function () {
        return { ...currentSettings() };
      },

      getHandles: createNoseHandles,

      update: updateNose,

      draw: function () {
        window.applyNoseSettings();
      },

      refresh: function () {
        window.applyNoseSettings();
      },

      reset:
        typeof window.resetNose === "function"
          ? window.resetNose
          : function () {},

      save:
        typeof window.saveNose === "function"
          ? window.saveNose
          : function () {},

      load:
        typeof window.loadNose === "function"
          ? window.loadNose
          : function () {},
    });

    if (
      window.FaceInspector &&
      typeof window.FaceInspector.refresh === "function"
    ) {
      window.FaceInspector.refresh();
    }

    console.log("noseInspector.js V1.0 registered");

    return true;
  }

  /*
     Usually faceLabCore.js and nose.js are already loaded.
     Retry briefly so this file is not fragile about script order.
  */
  if (!registerNoseFeature()) {
    let attempts = 0;

    const timer = window.setInterval(function () {
      attempts += 1;

      if (registerNoseFeature() || attempts >= 30) {
        window.clearInterval(timer);

        if (attempts >= 30) {
          console.warn(
            "Nose inspector adapter could not register. Load it after faceLabCore.js and nose.js."
          );
        }
      }
    }, 100);
  }
})();
