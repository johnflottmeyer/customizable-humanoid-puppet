/* ==========================
   BROW RIDGE SYSTEM — V1.0

   Responsibilities:

   - Draw left and right brow shelves
   - Draw the central glabella
   - Add forehead-to-socket transitions
   - Connect optional drawer controls
   - Save, load, and reset settings

   This module initializes itself.
   No app.js changes are required.
========================== */

(function () {
  "use strict";

  /* ==========================
       DEFAULT SETTINGS
    ========================== */

  const defaultBrowSettings = {
    /* Overall position */

    browY: 198,

    /* Distance between brow centers */

    browSpacing: 132,

    /* Main ridge size */

    browWidth: 86,
    browHeight: 20,

    /* Shape */

    browArch: 9,
    browInnerHeight: 1,
    browOuterHeight: -2,

    browInnerReach: 4,
    browOuterReach: 3,

    /* Much softer than before */

    browDepth: 0.28,

    /* Central forehead structure */

    glabellaWidth: 42,
    glabellaHeight: 30,
    glabellaDepth: 0.18,

    /* Forehead transition */

    foreheadTransitionHeight: 40,
    foreheadTransitionOpacity: 0.1,

    /* Natural asymmetry */

    leftBrowOffsetY: 0,
    rightBrowOffsetY: 1,

    leftBrowRotation: -1,
    rightBrowRotation: 1,
  };

  /* ==========================
       GLOBAL SETTINGS
    ========================== */

  window.browSettings = {
    ...defaultBrowSettings,

    ...(window.browSettings || {}),
  };

  /* ==========================
       CONTROL NAMES
    ========================== */

  const browControls = [
    "browY",
    "browSpacing",

    "browWidth",
    "browHeight",

    "browArch",
    "browInnerHeight",
    "browOuterHeight",

    "browInnerReach",
    "browOuterReach",

    "browDepth",

    "glabellaWidth",
    "glabellaHeight",
    "glabellaDepth",

    "foreheadTransitionHeight",
    "foreheadTransitionOpacity",

    "leftBrowOffsetY",
    "rightBrowOffsetY",

    "leftBrowRotation",
    "rightBrowRotation",
  ];

  /* ==========================
       SVG HELPERS
    ========================== */

  function getElement(id) {
    return document.getElementById(id);
  }

  function setPath(id, pathData) {
    const element = getElement(id);

    if (!element) {
      return;
    }

    element.setAttribute("d", pathData);
  }

  function setOpacity(id, value) {
    const element = getElement(id);

    if (!element) {
      return;
    }

    element.setAttribute("opacity", String(value));
  }

  function setTransform(id, value) {
    const element = getElement(id);

    if (!element) {
      return;
    }

    element.setAttribute("transform", value);
  }

  /* ==========================
       VALUE DISPLAY
    ========================== */

  function displayBrowValue(settingName) {
    const valueDisplay = getElement(`${settingName}Value`);

    if (!valueDisplay) {
      return;
    }

    let value = window.browSettings[settingName];

    if (
      settingName === "browDepth" ||
      settingName === "glabellaDepth" ||
      settingName === "foreheadTransitionOpacity"
    ) {
      value = Number(value).toFixed(2);
    }

    valueDisplay.textContent = value;
  }

  function displayAllBrowValues() {
    browControls.forEach(displayBrowValue);
  }

  /* ==========================
       NUMBER HELPERS
    ========================== */

  function numberValue(value, fallback) {
    const parsed = Number(value);

    return Number.isFinite(parsed) ? parsed : fallback;
  }

  function clamp(value, minimum, maximum) {
    return Math.max(minimum, Math.min(maximum, value));
  }

  /* ==========================
       BUILD BROW SHELF
    ========================== */

  function buildBrowShelfPath(centerX, centerY, side) {
    const settings = window.browSettings;

    const width = numberValue(
      settings.browWidth,
      defaultBrowSettings.browWidth,
    );

    const height = numberValue(
      settings.browHeight,
      defaultBrowSettings.browHeight,
    );

    const arch = numberValue(settings.browArch, defaultBrowSettings.browArch);

    const innerHeight = numberValue(
      settings.browInnerHeight,
      defaultBrowSettings.browInnerHeight,
    );

    const outerHeight = numberValue(
      settings.browOuterHeight,
      defaultBrowSettings.browOuterHeight,
    );

    const innerReach = numberValue(
      settings.browInnerReach,
      defaultBrowSettings.browInnerReach,
    );

    const outerReach = numberValue(
      settings.browOuterReach,
      defaultBrowSettings.browOuterReach,
    );

    const halfWidth = width / 2;

    /*
            For the left brow, the inner edge is
            on the right.

            For the right brow, the inner edge
            is on the left.
        */

    const direction = side === "left" ? 1 : -1;

    const innerX = centerX + direction * (halfWidth + innerReach);

    const outerX = centerX - direction * (halfWidth + outerReach);

    const upperCenterX = centerX + direction * (width * 0.05);

    const upperCenterY = centerY - arch;

    const innerY = centerY - innerHeight;

    const outerY = centerY - outerHeight;

    const lowerCenterY = centerY + height;

    const lowerInnerY = centerY + height * 0.48;

    const lowerOuterY = centerY + height * 0.62;

    return [
      `M ${outerX} ${outerY}`,

      /*
                Upper shelf
            */

      `C ${outerX + direction * width * 0.18} ${outerY - arch * 0.48}`,

      `${upperCenterX - direction * width * 0.34} ${upperCenterY}`,

      `${upperCenterX} ${upperCenterY}`,

      `C ${upperCenterX + direction * width * 0.3} ${upperCenterY}`,

      `${innerX - direction * width * 0.14} ${innerY - arch * 0.12}`,

      `${innerX} ${innerY}`,

      /*
                Inner descent
            */

      `C ${innerX + direction * width * 0.01} ${centerY + height * 0.1}`,

      `${innerX - direction * width * 0.06} ${lowerInnerY}`,

      `${innerX - direction * width * 0.16} ${lowerInnerY}`,

      /*
                Underside of brow shelf
            */

      `C ${centerX + direction * width * 0.3} ${lowerCenterY}`,

      `${centerX - direction * width * 0.19} ${lowerCenterY}`,

      `${outerX + direction * width * 0.14} ${lowerOuterY}`,

      /*
                Outer fade
            */

      `C ${outerX + direction * width * 0.02} ${centerY + height * 0.35}`,

      `${outerX - direction * width * 0.02} ${centerY + height * 0.08}`,

      `${outerX} ${outerY}`,

      "Z",
    ].join(" ");
  }

  /* ==========================
       GLABELLA
    ========================== */

  function buildGlabellaPath() {
    const settings = window.browSettings;

    const centerX = 250;

    const browY = numberValue(settings.browY, defaultBrowSettings.browY);

    const width = numberValue(
      settings.glabellaWidth,
      defaultBrowSettings.glabellaWidth,
    );

    const height = numberValue(
      settings.glabellaHeight,
      defaultBrowSettings.glabellaHeight,
    );

    const halfWidth = width / 2;

    const topY = browY - height * 0.45;

    const middleY = browY + height * 0.08;

    const bottomY = browY + height * 0.6;

    return [
      `M ${centerX - halfWidth * 0.55} ${topY}`,

      `C
            ${centerX - halfWidth * 0.9}
            ${topY + height * 0.2}

            ${centerX - halfWidth}
            ${middleY}

            ${centerX - halfWidth * 0.72}
            ${bottomY}
        `,

      `C
            ${centerX - halfWidth * 0.3}
            ${bottomY + height * 0.1}

            ${centerX + halfWidth * 0.3}
            ${bottomY + height * 0.1}

            ${centerX + halfWidth * 0.72}
            ${bottomY}
        `,

      `C
            ${centerX + halfWidth}
            ${middleY}

            ${centerX + halfWidth * 0.9}
            ${topY + height * 0.2}

            ${centerX + halfWidth * 0.55}
            ${topY}
        `,

      `C
            ${centerX + halfWidth * 0.2}
            ${topY - height * 0.08}

            ${centerX - halfWidth * 0.2}
            ${topY - height * 0.08}

            ${centerX - halfWidth * 0.55}
            ${topY}
        `,

      "Z",
    ].join(" ");
  }

  /* ==========================
       FOREHEAD TRANSITION
    ========================== */

  function buildForeheadTransitionPath(centerX, centerY, side) {
    const settings = window.browSettings;

    const width = numberValue(
      settings.browWidth,
      defaultBrowSettings.browWidth,
    );

    const transitionHeight = numberValue(
      settings.foreheadTransitionHeight,
      defaultBrowSettings.foreheadTransitionHeight,
    );

    const direction = side === "left" ? 1 : -1;

    const innerX = centerX + direction * width * 0.38;

    const outerX = centerX - direction * width * 0.46;

    const topY = centerY - transitionHeight;

    const bottomY = centerY + 2;

    return [
      `M ${outerX} ${bottomY}`,

      `C
            ${outerX + direction * width * 0.08}
            ${centerY - transitionHeight * 0.48}

            ${centerX - direction * width * 0.22}
            ${topY}

            ${centerX}
            ${topY}
        `,

      `C
            ${centerX + direction * width * 0.18}
            ${topY + transitionHeight * 0.08}

            ${innerX}
            ${centerY - transitionHeight * 0.3}

            ${innerX}
            ${bottomY}
        `,

      `C
            ${centerX + direction * width * 0.18}
            ${centerY - 4}

            ${centerX - direction * width * 0.18}
            ${centerY - 4}

            ${outerX}
            ${bottomY}
        `,

      "Z",
    ].join(" ");
  }

  /* ==========================
       DRAW
    ========================== */

  function drawBrows() {
    const settings = window.browSettings;

    const browY = numberValue(settings.browY, defaultBrowSettings.browY);

    const spacing = numberValue(
      settings.browSpacing,
      defaultBrowSettings.browSpacing,
    );

    const leftCenterX = 250 - spacing / 2;

    const rightCenterX = 250 + spacing / 2;

    const leftOffsetY = numberValue(settings.leftBrowOffsetY, 0);

    const rightOffsetY = numberValue(settings.rightBrowOffsetY, 0);

    const leftCenterY = browY + leftOffsetY;

    const rightCenterY = browY + rightOffsetY;

    setPath(
      "leftBrowRidge",
      buildBrowShelfPath(leftCenterX, leftCenterY, "left"),
    );

    setPath(
      "rightBrowRidge",
      buildBrowShelfPath(rightCenterX, rightCenterY, "right"),
    );

    setPath("glabella", buildGlabellaPath());

    setPath(
      "leftForeheadTransition",
      buildForeheadTransitionPath(leftCenterX, leftCenterY, "left"),
    );

    setPath(
      "rightForeheadTransition",
      buildForeheadTransitionPath(rightCenterX, rightCenterY, "right"),
    );

    const browDepth = clamp(
      numberValue(settings.browDepth, defaultBrowSettings.browDepth),
      0,
      1,
    );

    const glabellaDepth = clamp(
      numberValue(settings.glabellaDepth, defaultBrowSettings.glabellaDepth),
      0,
      1,
    );

    const transitionOpacity = clamp(
      numberValue(
        settings.foreheadTransitionOpacity,
        defaultBrowSettings.foreheadTransitionOpacity,
      ),
      0,
      1,
    );

    setOpacity("leftBrowRidge", browDepth);

    setOpacity("rightBrowRidge", browDepth);

    setOpacity("glabella", glabellaDepth);

    setOpacity("leftForeheadTransition", transitionOpacity);

    setOpacity("rightForeheadTransition", transitionOpacity);

    const leftRotation = numberValue(settings.leftBrowRotation, 0);

    const rightRotation = numberValue(settings.rightBrowRotation, 0);

    setTransform(
      "leftBrowRidge",
      `rotate(${leftRotation} ${leftCenterX} ${leftCenterY})`,
    );

    setTransform(
      "rightBrowRidge",
      `rotate(${rightRotation} ${rightCenterX} ${rightCenterY})`,
    );

    displayAllBrowValues();
  }

  /* ==========================
       CONNECT CONTROLS
    ========================== */

  function initializeBrowControls() {
    browControls.forEach(function (settingName) {
      const input = getElement(settingName);

      if (!input) {
        return;
      }

      if (window.browSettings[settingName] !== undefined) {
        input.value = window.browSettings[settingName];
      }

      input.addEventListener("input", function () {
        window.browSettings[settingName] = numberValue(
          input.value,
          defaultBrowSettings[settingName],
        );

        drawBrows();
      });
    });

    displayAllBrowValues();
  }

  /* ==========================
       STORAGE
    ========================== */

  const storageKey = "humanoidAvatarBrowSettings";

  function saveBrowSettings() {
    try {
      localStorage.setItem(storageKey, JSON.stringify(window.browSettings));

      setStatus("Brow settings saved.");
    } catch (error) {
      console.error("Unable to save brow settings:", error);

      setStatus("Unable to save brow settings.");
    }
  }

  function loadBrowSettings() {
    try {
      const saved = localStorage.getItem(storageKey);

      if (!saved) {
        setStatus("No saved brow settings found.");

        return;
      }

      const parsed = JSON.parse(saved);

      window.browSettings = {
        ...defaultBrowSettings,

        ...parsed,
      };

      syncControlsFromSettings();

      drawBrows();

      setStatus("Saved brow settings loaded.");
    } catch (error) {
      console.error("Unable to load brow settings:", error);

      setStatus("Unable to load brow settings.");
    }
  }

  function resetBrowSettings() {
    window.browSettings = {
      ...defaultBrowSettings,
    };

    syncControlsFromSettings();

    drawBrows();

    setStatus("Brow settings reset.");
  }

  function syncControlsFromSettings() {
    browControls.forEach(function (settingName) {
      const input = getElement(settingName);

      if (!input) {
        return;
      }

      input.value = window.browSettings[settingName];
    });

    displayAllBrowValues();
  }

  function setStatus(message) {
    const status = getElement("browSaveStatus");

    if (!status) {
      return;
    }

    status.textContent = message;
  }

  function connectButton(id, callback) {
    const button = getElement(id);

    if (!button) {
      return;
    }

    button.addEventListener("click", callback);
  }

  /* ==========================
       INITIALIZE
    ========================== */

  function initializeBrows() {
    initializeBrowControls();

    connectButton("saveBrows", saveBrowSettings);

    connectButton("loadBrows", loadBrowSettings);

    connectButton("resetBrows", resetBrowSettings);

    drawBrows();
  }

  /* ==========================
       PUBLIC API
    ========================== */

  window.drawBrows = drawBrows;

  window.initializeBrows = initializeBrows;

  window.updateBrowSettings = function (updates) {
    window.browSettings = {
      ...window.browSettings,

      ...(updates || {}),
    };

    syncControlsFromSettings();

    drawBrows();
  };

  window.resetBrows = resetBrowSettings;

  window.BrowSystem = {
    defaults: Object.freeze({
      ...defaultBrowSettings,
    }),

    getSettings: function () {
      return {
        ...window.browSettings,
      };
    },

    draw: drawBrows,

    initialize: initializeBrows,

    update: window.updateBrowSettings,

    reset: resetBrowSettings,

    save: saveBrowSettings,

    load: loadBrowSettings,
  };

  /* ==========================
       FACELAB BROW HANDLES
    ========================== */

  function rotatePointAroundCenter(point, center, degrees) {
    const radians = (numberValue(degrees, 0) * Math.PI) / 180;

    const cosine = Math.cos(radians);

    const sine = Math.sin(radians);

    const offsetX = point.x - center.x;

    const offsetY = point.y - center.y;

    return {
      x: center.x + offsetX * cosine - offsetY * sine,

      y: center.y + offsetX * sine + offsetY * cosine,
    };
  }

  function refreshFaceInspector() {
    if (
      window.FaceInspector &&
      typeof window.FaceInspector.refresh === "function"
    ) {
      window.FaceInspector.refresh();
    }
  }

  function updateBrowFromHandle(updates) {
    window.updateBrowSettings(updates);

    refreshFaceInspector();
  }

  function createFaceLabBrowHandles() {
    const settings = window.browSettings;

    if (!settings) {
      return [];
    }

    const browY = numberValue(settings.browY, defaultBrowSettings.browY);

    const spacing = numberValue(
      settings.browSpacing,
      defaultBrowSettings.browSpacing,
    );

    const width = numberValue(
      settings.browWidth,
      defaultBrowSettings.browWidth,
    );

    const arch = numberValue(settings.browArch, defaultBrowSettings.browArch);

    const glabellaWidth = numberValue(
      settings.glabellaWidth,
      defaultBrowSettings.glabellaWidth,
    );

    const glabellaHeight = numberValue(
      settings.glabellaHeight,
      defaultBrowSettings.glabellaHeight,
    );

    const leftCenter = {
      x: 250 - spacing / 2,

      y: browY + numberValue(settings.leftBrowOffsetY, 0),
    };

    const rightCenter = {
      x: 250 + spacing / 2,

      y: browY + numberValue(settings.rightBrowOffsetY, 0),
    };

    const leftRotation = numberValue(settings.leftBrowRotation, 0);

    const rightRotation = numberValue(settings.rightBrowRotation, 0);

    const leftArchPoint = rotatePointAroundCenter(
      {
        x: leftCenter.x,
        y: leftCenter.y - arch,
      },

      leftCenter,

      leftRotation,
    );

    const rightArchPoint = rotatePointAroundCenter(
      {
        x: rightCenter.x,
        y: rightCenter.y - arch,
      },

      rightCenter,

      rightRotation,
    );

    const glabellaTop = {
      x: 250,

      y: browY - glabellaHeight * 0.45,
    };

    const glabellaRight = {
      x: 250 + glabellaWidth / 2,

      y: browY + glabellaHeight * 0.08,
    };

    return [
      {
        id: "leftCenter",

        label: "Left Brow Position",

        point: leftCenter,

        guideGroup: "browCenters",

        guideOrder: 0,

        properties: ["browSpacing", "leftBrowOffsetY"],

        help: "Drag horizontally to change brow spacing. Drag vertically to move the left brow independently.",

        beginDrag: function () {
          return {
            ...window.browSettings,
          };
        },

        drag: function (deltaX, deltaY, dragStart) {
          const start = dragStart || {};

          updateBrowFromHandle({
            browSpacing: clamp(
              numberValue(start.browSpacing, 132) - deltaX * 2,

              40,

              260,
            ),

            leftBrowOffsetY: clamp(
              numberValue(start.leftBrowOffsetY, 0) + deltaY,

              -60,

              60,
            ),
          });
        },
      },

      {
        id: "rightCenter",

        label: "Right Brow Position",

        point: rightCenter,

        guideGroup: "browCenters",

        guideOrder: 1,

        properties: ["browSpacing", "rightBrowOffsetY"],

        help: "Drag horizontally to change brow spacing. Drag vertically to move the right brow independently.",

        beginDrag: function () {
          return {
            ...window.browSettings,
          };
        },

        drag: function (deltaX, deltaY, dragStart) {
          const start = dragStart || {};

          updateBrowFromHandle({
            browSpacing: clamp(
              numberValue(start.browSpacing, 132) + deltaX * 2,

              40,

              260,
            ),

            rightBrowOffsetY: clamp(
              numberValue(start.rightBrowOffsetY, 0) + deltaY,

              -60,

              60,
            ),
          });
        },
      },

      {
        id: "leftArch",

        label: "Left Brow Arch",

        point: leftArchPoint,

        properties: ["browArch", "browWidth"],

        help: "Drag vertically to alter the shared brow arch. Drag horizontally to change the width of both brow ridges.",

        beginDrag: function () {
          return {
            ...window.browSettings,
          };
        },

        drag: function (deltaX, deltaY, dragStart) {
          const start = dragStart || {};

          updateBrowFromHandle({
            browArch: clamp(
              numberValue(start.browArch, 9) - deltaY,

              -20,

              50,
            ),

            browWidth: clamp(
              numberValue(start.browWidth, 86) - deltaX * 2,

              30,

              180,
            ),
          });
        },
      },

      {
        id: "rightArch",

        label: "Right Brow Arch",

        point: rightArchPoint,

        properties: ["browArch", "browWidth"],

        help: "Drag vertically to alter the shared brow arch. Drag horizontally to change the width of both brow ridges.",

        beginDrag: function () {
          return {
            ...window.browSettings,
          };
        },

        drag: function (deltaX, deltaY, dragStart) {
          const start = dragStart || {};

          updateBrowFromHandle({
            browArch: clamp(
              numberValue(start.browArch, 9) - deltaY,

              -20,

              50,
            ),

            browWidth: clamp(
              numberValue(start.browWidth, 86) + deltaX * 2,

              30,

              180,
            ),
          });
        },
      },

      {
        id: "glabellaTop",

        label: "Glabella Height",

        point: glabellaTop,

        properties: ["glabellaHeight", "browY"],

        help: "Drag vertically to change the height of the central glabella structure. Drag horizontally to move the entire brow system vertically only when combined with vertical motion.",

        beginDrag: function () {
          return {
            ...window.browSettings,
          };
        },

        drag: function (deltaX, deltaY, dragStart) {
          const start = dragStart || {};

          updateBrowFromHandle({
            glabellaHeight: clamp(
              numberValue(start.glabellaHeight, 30) - deltaY * 2,

              6,

              100,
            ),
          });
        },
      },

      {
        id: "glabellaWidth",

        label: "Glabella Width",

        point: glabellaRight,

        properties: ["glabellaWidth", "glabellaDepth"],

        help: "Drag horizontally to change the width of the glabella between the brow ridges.",

        beginDrag: function () {
          return {
            ...window.browSettings,
          };
        },

        drag: function (deltaX, deltaY, dragStart) {
          const start = dragStart || {};

          updateBrowFromHandle({
            glabellaWidth: clamp(
              numberValue(start.glabellaWidth, 42) + deltaX * 2,

              8,

              120,
            ),
          });
        },
      },
    ];
  }

  /* ==========================
       REGISTER BROW FEATURE
    ========================== */

  if (window.FaceLab && typeof window.FaceLab.registerFeature === "function") {
    window.FaceLab.registerFeature(
      "brow",

      {
        label: "Brow Ridge",

        getSettings: function () {
          return {
            ...window.browSettings,
          };
        },

        getHandles: createFaceLabBrowHandles,

        update: function (updates) {
          updateBrowFromHandle(updates || {});

          return {
            ...window.browSettings,
          };
        },

        draw: drawBrows,

        refresh: drawBrows,

        reset: resetBrowSettings,

        save: saveBrowSettings,

        load: loadBrowSettings,
      },
    );
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initializeBrows);
  } else {
    initializeBrows();
  }

  console.log("brow.js V1.0 loaded");
})();
