/* =========================================================
   FACELAB EYE SYSTEM
   EyeBuilder Renderer Migration
   Version 2.0

   REQUIRES:

   js/eyes/eyeBuilder.js

   EyeBuilder must load before this file.
========================================================= */

/* ==========================
   DEFAULT EYE VALUES
========================== */

const defaultEyeSettings = {
  /* POSITION */

  eyeY: 235,
  eyeSpacing: 134,

  /* EYE OPENING */

  eyeWidth: 80,
  eyeHeight: 30,
  eyeRotation: 0,

  eyeUpperArch: 1.2,
  eyeLowerArch: 0.75,

  eyeInnerCorner: -2,
  eyeOuterCorner: 2,

  /* IRIS */

  irisSize: 27,

  /*
      Fine adjustment for the resting
      center of both irises.
  */

  irisCenterX: 0,
  irisCenterY: -2,

  /* PUPIL / GAZE */

  pupilSize: 10,
  pupilX: 0,
  pupilY: 0,
};

/* ==========================
   CURRENT EYE SETTINGS
========================== */

window.eyeSettings = {
  ...defaultEyeSettings,
};

/* ==========================
   LATEST BUILT ANATOMY
========================== */

/*
    This becomes the shared geometry source for:

    - the SVG renderer
    - FaceInspector
    - future eye presets
    - debugging tools
*/

window.eyeAnatomy = {
  left: null,
  right: null,
};

/* ==========================
   EYE ANIMATION STATE
========================== */

window.eyeAnimationState = {
  lookX: 0,
  lookY: 0,

  blink: 0,
  squint: 0,
  wide: 0,
  happy: 0,
  angry: 0,
  sleepy: 0,
};

/* ==========================
   EYE CONTROL NAMES
========================== */

const eyeControls = [
  "eyeY",
  "eyeSpacing",

  "eyeWidth",
  "eyeHeight",
  "eyeRotation",

  "eyeUpperArch",
  "eyeLowerArch",

  "eyeInnerCorner",
  "eyeOuterCorner",

  "irisSize",
  "irisCenterX",
  "irisCenterY",

  "pupilSize",
  "pupilX",
  "pupilY",
];

/* ==========================
   DISPLAY CONTROL VALUE
========================== */

function displayEyeValue(settingName) {
  const valueDisplay = document.getElementById(`${settingName}Value`);

  if (!valueDisplay) {
    return;
  }

  valueDisplay.textContent = window.eyeSettings[settingName];
}

/* ==========================
   NUMBER HELPERS
========================== */

function clamp(value, minimum, maximum) {
  return Math.max(minimum, Math.min(maximum, value));
}

function safeEyeNumber(value, fallback) {
  const number = Number(value);

  return Number.isFinite(number) ? number : fallback;
}

/* ==========================
   BUILD EYE ANATOMY
========================== */

function buildEyeAnatomy(
  side,
  centerX,
  centerY,
  rotation,
  animatedEyeHeight,
  blinkAmount,
) {
  if (!window.EyeAssembly || typeof window.EyeAssembly.build !== "function") {
    console.error(
      "EyeAssembly is unavailable. Load js/eyes/eyeAssembly.js before js/eyes.js.",
    );

    return null;
  }

  const settings = window.eyeSettings;

  /*
      The existing upper and lower arch sliders
      use a broader numerical range than the
      builder's proportional settings.

      These conversions retain compatibility
      with the existing controls.
  */

  const upperPeakHeight = clamp(
    safeEyeNumber(settings.eyeUpperArch, defaultEyeSettings.eyeUpperArch) *
      0.43,

    0.08,
    1.1,
  );

  const lowerLowDepth = clamp(
    safeEyeNumber(settings.eyeLowerArch, defaultEyeSettings.eyeLowerArch) * 0.4,

    0.04,
    0.9,
  );

  /*
      During a blink, the vertical corner offsets
      flatten progressively.

      This keeps the closed eye from retaining
      exaggerated corner differences.
  */

  const cornerInfluence = 1 - clamp(blinkAmount, 0, 1);

  /*
      EyeBuilder defines coordinates anatomically:

      innerCornerY = inner canthus offset
      outerCornerY = outer canthus offset

      The builder mirrors those positions for the
      left and right eye automatically.
  */

  //return window.EyeBuilder.build({
  return window.EyeAssembly.build({
    side: side,

    centerX: centerX,
    centerY: centerY,

    width: safeEyeNumber(settings.eyeWidth, defaultEyeSettings.eyeWidth),

    height: safeEyeNumber(settings.eyeHeight, defaultEyeSettings.eyeHeight),

    rotation: rotation,

    /* CORNERS */

    innerCornerY:
      safeEyeNumber(
        settings.eyeInnerCorner,
        defaultEyeSettings.eyeInnerCorner,
      ) * cornerInfluence,

    outerCornerY:
      safeEyeNumber(
        settings.eyeOuterCorner,
        defaultEyeSettings.eyeOuterCorner,
      ) * cornerInfluence,

    /* UPPER OPENING */

    upperPeakPosition: 0.39,
    upperPeakHeight: upperPeakHeight,

    upperInnerTension: 0.72,
    upperOuterTension: 0.54,

    /* LOWER OPENING */

    lowerLowPosition: 0.61,
    lowerLowDepth: lowerLowDepth,

    lowerOuterTension: 0.34,
    lowerInnerTension: 0.25,

    /* TEAR DUCT */

    tearDuctLength: 4.5,
    tearDuctHeight: 2.2,

    /* CREASES */

    upperCreaseHeight: 7,
    upperCreaseInset: 7,

    lowerCreaseDepth: 4,
    lowerCreaseInset: 12,

    /* SOCKET */

    socketWidthScale: 1.38,

    /*
        Keep the socket based on resting eye
        height, not blink-compressed height.
    */

    socketHeightScale:
      (safeEyeNumber(settings.eyeHeight, defaultEyeSettings.eyeHeight) + 18) /
      Math.max(
        safeEyeNumber(settings.eyeHeight, defaultEyeSettings.eyeHeight),
        1,
      ),

    socketOffsetY: 2,

    /* EYE RIG */

    rigState: {
      blink: clamp(safeEyeNumber(blinkAmount, 0), 0, 1),
      squint: clamp(safeEyeNumber(window.eyeAnimationState.squint, 0), 0, 1),
      wide: clamp(safeEyeNumber(window.eyeAnimationState.wide, 0), 0, 1),
      happy: clamp(safeEyeNumber(window.eyeAnimationState.happy, 0), 0, 1),
      angry: clamp(safeEyeNumber(window.eyeAnimationState.angry, 0), 0, 1),
      sleepy: clamp(safeEyeNumber(window.eyeAnimationState.sleepy, 0), 0, 1),

      /* Gaze remains in EyeRenderer for now to avoid double movement. */
      gazeX: 0,
      gazeY: 0,
    },

    /* IRIS */

    irisSize: safeEyeNumber(settings.irisSize, defaultEyeSettings.irisSize),

    irisCenterX: safeEyeNumber(
      settings.irisCenterX,
      defaultEyeSettings.irisCenterX,
    ),

    irisCenterY: safeEyeNumber(
      settings.irisCenterY,
      defaultEyeSettings.irisCenterY,
    ),

    pupilSize: safeEyeNumber(settings.pupilSize, defaultEyeSettings.pupilSize),
  });
}

/* ==========================
   CREATE TEAR DUCT SURFACE
========================== */

function createTearDuctSurfacePath(anatomy) {
  if (!anatomy || !anatomy.landmarks) {
    return "";
  }

  const tear = anatomy.landmarks.tearDuct;

  const inner = anatomy.landmarks.innerCanthus;

  if (!tear || !inner) {
    return "";
  }

  const middleX = (tear.x + inner.x) / 2;

  const ductHeight = Math.max(1.5, Math.abs(tear.y - inner.y) + 1.5);

  return [
    `M ${inner.x} ${inner.y}`,

    `C ${middleX} ${inner.y - ductHeight}`,
    `${tear.x} ${tear.y - ductHeight}`,
    `${tear.x} ${tear.y}`,

    `C ${tear.x} ${tear.y + ductHeight}`,
    `${middleX} ${inner.y + ductHeight}`,
    `${inner.x} ${inner.y}`,

    "Z",
  ].join(" ");
}

/* ==========================
   DRAW ONE EYE
========================== */

function drawEye(side, centerX, centerY, rotation) {
  const settings = window.eyeSettings;

  const animation = window.eyeAnimationState || {
    lookX: 0,
    lookY: 0,
    blink: 0,
  };

  if (!window.EyeRenderer || typeof window.EyeRenderer.render !== "function") {
    console.error(
      "EyeRenderer is unavailable. Load js/eyes/eyeRenderer.js before js/eyes.js.",
    );

    return;
  }

  const blinkAmount = clamp(safeEyeNumber(animation.blink, 0), 0, 1);

  const minimumEyeHeight = 1.5;

  const animatedEyeHeight = Math.max(
    minimumEyeHeight,

    safeEyeNumber(settings.eyeHeight, defaultEyeSettings.eyeHeight) *
      (1 - blinkAmount),
  );

  const anatomy = buildEyeAnatomy(
    side,
    centerX,
    centerY,
    rotation,
    animatedEyeHeight,
    blinkAmount,
  );

  if (!anatomy) {
    return;
  }

  window.eyeAnatomy[side] = anatomy;

  window.EyeRenderer.render({
    side: side,

    anatomy: anatomy,

    centerX: centerX,

    centerY: centerY,

    rotation: rotation,

    animatedEyeHeight: animatedEyeHeight,

    eyeSettings: settings,

    animationState: animation,
  });
}

/* ==========================
   DRAW BOTH EYES
========================== */

function drawEyes() {
  const settings = window.eyeSettings;

  const faceCenterX = 250;

  const leftEyeX = faceCenterX - settings.eyeSpacing / 2;

  const rightEyeX = faceCenterX + settings.eyeSpacing / 2;

  drawEye("left", leftEyeX, settings.eyeY, settings.eyeRotation);

  drawEye("right", rightEyeX, settings.eyeY, -settings.eyeRotation);
}

/* ==========================
   INITIALIZE EYE CONTROLS
========================== */

function initializeEyeControls() {
  eyeControls.forEach(function initializeEyeControl(settingName) {
    const slider = document.getElementById(settingName);

    if (!slider) {
      console.warn(`Could not find eye slider: ${settingName}`);

      return;
    }

    slider.value = window.eyeSettings[settingName];

    displayEyeValue(settingName);

    slider.addEventListener(
      "input",

      function handleEyeInput() {
        window.eyeSettings[settingName] = Number(slider.value);

        displayEyeValue(settingName);

        drawEyes();

        if (
          window.FaceInspector &&
          typeof window.FaceInspector.refresh === "function"
        ) {
          window.FaceInspector.refresh();
        }
      },
    );
  });
}

/* ==========================
   UPDATE EYE CONTROLS
========================== */

function updateEyeControls() {
  eyeControls.forEach(function updateEyeControl(settingName) {
    const slider = document.getElementById(settingName);

    if (!slider) {
      return;
    }

    slider.value = window.eyeSettings[settingName];

    displayEyeValue(settingName);
  });
}

/* ==========================
   STATUS MESSAGE
========================== */

function displayEyeStatus(message) {
  const status = document.getElementById("eyeSaveStatus");

  if (!status) {
    return;
  }

  status.textContent = message;
}

/* ==========================
   SAVE EYES
========================== */

function saveEyes() {
  try {
    localStorage.setItem(
      "humanoidEyeSettings",

      JSON.stringify(window.eyeSettings),
    );

    displayEyeStatus("Eye settings saved.");
  } catch (error) {
    displayEyeStatus("Eye settings could not be saved.");

    console.error("Eye settings could not be saved:", error);
  }
}

/* ==========================
   LOAD EYES
========================== */

function loadEyes() {
  const savedSettings = localStorage.getItem("humanoidEyeSettings");

  if (!savedSettings) {
    displayEyeStatus("No saved eye settings were found.");

    return false;
  }

  try {
    const parsedSettings = JSON.parse(savedSettings);

    /*
        Begin with the newest defaults so saved
        data from older versions receives any
        newly added eye properties.
    */

    Object.assign(window.eyeSettings, defaultEyeSettings, parsedSettings);

    updateEyeControls();

    drawEyes();

    if (
      window.FaceInspector &&
      typeof window.FaceInspector.refresh === "function"
    ) {
      window.FaceInspector.refresh();
    }

    displayEyeStatus("Saved eye settings loaded.");

    return true;
  } catch (error) {
    displayEyeStatus("Saved eye settings could not be loaded.");

    console.error("Saved eye settings could not be loaded:", error);

    return false;
  }
}

/* ==========================
   RESET EYES
========================== */

function resetEyes() {
  Object.assign(window.eyeSettings, defaultEyeSettings);

  updateEyeControls();

  drawEyes();

  if (
    window.FaceInspector &&
    typeof window.FaceInspector.refresh === "function"
  ) {
    window.FaceInspector.refresh();
  }

  displayEyeStatus("Eye settings reset.");
}

/* ==========================
   EYE RIG CONTROLS
========================== */

function setEyeRigPose(poseName, amount) {
  const allowedPoses = ["blink", "squint", "wide", "happy", "angry", "sleepy"];

  if (!allowedPoses.includes(poseName)) {
    console.warn(`Unknown eye rig pose: ${poseName}`);
    return;
  }

  window.eyeAnimationState[poseName] = clamp(safeEyeNumber(amount, 0), 0, 1);

  drawEyes();

  if (
    window.FaceInspector &&
    typeof window.FaceInspector.refresh === "function"
  ) {
    window.FaceInspector.refresh();
  }
}

function resetEyeRig() {
  Object.assign(window.eyeAnimationState, {
    blink: 0,
    squint: 0,
    wide: 0,
    happy: 0,
    angry: 0,
    sleepy: 0,
  });

  drawEyes();
}

/* ==========================
   GLOBAL FUNCTIONS
========================== */

window.drawEye = drawEye;
window.drawEyes = drawEyes;

window.initializeEyeControls = initializeEyeControls;

window.updateEyeControls = updateEyeControls;

window.saveEyes = saveEyes;
window.loadEyes = loadEyes;
window.resetEyes = resetEyes;
window.setEyeRigPose = setEyeRigPose;
window.resetEyeRig = resetEyeRig;

/* =========================================================
   FACELAB EYE FEATURE
========================================================= */

(function registerFaceLabEyes() {
  "use strict";

  /* ==========================
     NUMBER HELPERS
  ========================== */

  function eyeNumber(value, fallback) {
    const number = Number(value);

    return Number.isFinite(number) ? number : fallback;
  }

  function eyeClamp(value, minimum, maximum) {
    return Math.max(minimum, Math.min(maximum, value));
  }

  /* ==========================
     ROTATE HANDLE POINT
  ========================== */

  function rotateEyePoint(sourcePoint, center, degrees) {
    const radians = (eyeNumber(degrees, 0) * Math.PI) / 180;

    const cosine = Math.cos(radians);

    const sine = Math.sin(radians);

    const offsetX = sourcePoint.x - center.x;

    const offsetY = sourcePoint.y - center.y;

    return {
      x: center.x + offsetX * cosine - offsetY * sine,

      y: center.y + offsetX * sine + offsetY * cosine,
    };
  }

  /* ==========================
     UPDATE EYE SETTINGS
  ========================== */

  function updateFaceLabEyes(updates) {
    if (!updates || typeof updates !== "object") {
      return {
        ...window.eyeSettings,
      };
    }

    Object.assign(window.eyeSettings, updates);

    updateEyeControls();

    drawEyes();

    if (
      window.FaceInspector &&
      typeof window.FaceInspector.refresh === "function"
    ) {
      window.FaceInspector.refresh();
    }

    return {
      ...window.eyeSettings,
    };
  }

  /* ==========================
     EYE GEOMETRY
  ========================== */

  function getFaceLabEyeGeometry() {
    const settings = window.eyeSettings;

    const faceCenterX = 250;

    const eyeY = eyeNumber(settings.eyeY, defaultEyeSettings.eyeY);

    const spacing = eyeNumber(
      settings.eyeSpacing,
      defaultEyeSettings.eyeSpacing,
    );

    const width = eyeNumber(settings.eyeWidth, defaultEyeSettings.eyeWidth);

    const height = eyeNumber(settings.eyeHeight, defaultEyeSettings.eyeHeight);

    const rotation = eyeNumber(
      settings.eyeRotation,
      defaultEyeSettings.eyeRotation,
    );

    const halfWidth = width / 2;

    const halfHeight = height / 2;

    const leftCenter = {
      x: faceCenterX - spacing / 2,

      y: eyeY,
    };

    const rightCenter = {
      x: faceCenterX + spacing / 2,

      y: eyeY,
    };

    return {
      settings: settings,

      faceCenterX: faceCenterX,

      eyeY: eyeY,

      spacing: spacing,

      width: width,
      height: height,

      halfWidth: halfWidth,
      halfHeight: halfHeight,

      rotation: rotation,

      leftCenter: leftCenter,
      rightCenter: rightCenter,

      leftRotation: rotation,
      rightRotation: -rotation,
    };
  }

  /* ==========================
     GET BUILDER LANDMARK
  ========================== */

  function getBuilderLandmark(side, landmarkName, fallback) {
    const anatomy = window.eyeAnatomy && window.eyeAnatomy[side];

    if (
      anatomy &&
      anatomy.transformedLandmarks &&
      anatomy.transformedLandmarks[landmarkName]
    ) {
      const landmark = anatomy.transformedLandmarks[landmarkName];

      return {
        x: landmark.x,
        y: landmark.y,
      };
    }

    return fallback;
  }

  /* ==========================
     CREATE EYE HANDLES
  ========================== */

  function createFaceLabEyeHandles() {
    const geometry = getFaceLabEyeGeometry();

    const leftCenter = geometry.leftCenter;

    const rightCenter = geometry.rightCenter;

    /*
        Prefer the actual EyeBuilder landmarks.

        The old calculated points remain as
        fallbacks during initialization before
        the first complete eye draw.
    */

    const leftInner = getBuilderLandmark(
      "left",
      "innerCanthus",

      rotateEyePoint(
        {
          x: leftCenter.x + geometry.halfWidth,

          y: leftCenter.y,
        },

        leftCenter,
        geometry.leftRotation,
      ),
    );

    const leftOuter = getBuilderLandmark(
      "left",
      "outerCanthus",

      rotateEyePoint(
        {
          x: leftCenter.x - geometry.halfWidth,

          y: leftCenter.y,
        },

        leftCenter,
        geometry.leftRotation,
      ),
    );

    const rightInner = getBuilderLandmark(
      "right",
      "innerCanthus",

      rotateEyePoint(
        {
          x: rightCenter.x - geometry.halfWidth,

          y: rightCenter.y,
        },

        rightCenter,
        geometry.rightRotation,
      ),
    );

    const rightOuter = getBuilderLandmark(
      "right",
      "outerCanthus",

      rotateEyePoint(
        {
          x: rightCenter.x + geometry.halfWidth,

          y: rightCenter.y,
        },

        rightCenter,
        geometry.rightRotation,
      ),
    );

    const leftUpper = getBuilderLandmark(
      "left",
      "upperPeak",

      rotateEyePoint(
        {
          x: leftCenter.x,

          y: leftCenter.y - geometry.halfHeight,
        },

        leftCenter,
        geometry.leftRotation,
      ),
    );

    const leftLower = getBuilderLandmark(
      "left",
      "lowerLow",

      rotateEyePoint(
        {
          x: leftCenter.x,

          y: leftCenter.y + geometry.halfHeight,
        },

        leftCenter,
        geometry.leftRotation,
      ),
    );

    const rightUpper = getBuilderLandmark(
      "right",
      "upperPeak",

      rotateEyePoint(
        {
          x: rightCenter.x,

          y: rightCenter.y - geometry.halfHeight,
        },

        rightCenter,
        geometry.rightRotation,
      ),
    );

    const rightLower = getBuilderLandmark(
      "right",
      "lowerLow",

      rotateEyePoint(
        {
          x: rightCenter.x,

          y: rightCenter.y + geometry.halfHeight,
        },

        rightCenter,
        geometry.rightRotation,
      ),
    );

    return [
      /* ==========================
         LEFT EYE CENTER
      ========================== */

      {
        id: "leftCenter",

        label: "Left Eye Position",

        point: leftCenter,

        guideGroup: "eyeCenters",
        guideOrder: 0,

        properties: ["eyeSpacing", "eyeY"],

        help: "Drag horizontally to change eye spacing. Drag vertically to move both eyes.",

        beginDrag: function () {
          return {
            ...window.eyeSettings,
          };
        },

        drag: function (deltaX, deltaY, dragStart) {
          const start = dragStart || {};

          updateFaceLabEyes({
            eyeSpacing: eyeClamp(
              eyeNumber(start.eyeSpacing, defaultEyeSettings.eyeSpacing) -
                deltaX * 2,

              40,
              240,
            ),

            eyeY: eyeClamp(
              eyeNumber(start.eyeY, defaultEyeSettings.eyeY) + deltaY,

              120,
              360,
            ),
          });
        },
      },

      /* ==========================
         RIGHT EYE CENTER
      ========================== */

      {
        id: "rightCenter",

        label: "Right Eye Position",

        point: rightCenter,

        guideGroup: "eyeCenters",
        guideOrder: 1,

        properties: ["eyeSpacing", "eyeY"],

        help: "Drag horizontally to change eye spacing. Drag vertically to move both eyes.",

        beginDrag: function () {
          return {
            ...window.eyeSettings,
          };
        },

        drag: function (deltaX, deltaY, dragStart) {
          const start = dragStart || {};

          updateFaceLabEyes({
            eyeSpacing: eyeClamp(
              eyeNumber(start.eyeSpacing, defaultEyeSettings.eyeSpacing) +
                deltaX * 2,

              40,
              240,
            ),

            eyeY: eyeClamp(
              eyeNumber(start.eyeY, defaultEyeSettings.eyeY) + deltaY,

              120,
              360,
            ),
          });
        },
      },

      /* ==========================
         LEFT INNER CANTHUS
      ========================== */

      {
        id: "leftInnerCorner",

        label: "Left Inner Canthus",

        point: leftInner,

        guideGroup: "leftEyeShape",

        guideOrder: 2,

        properties: ["eyeWidth", "eyeSpacing", "eyeRotation"],

        help: "Drag horizontally to alter eye width and inner spacing. Drag vertically to rotate the eye line.",

        beginDrag: function () {
          return {
            ...window.eyeSettings,
          };
        },

        drag: function (deltaX, deltaY, dragStart) {
          const start = dragStart || {};

          updateFaceLabEyes({
            eyeWidth: eyeClamp(
              eyeNumber(start.eyeWidth, defaultEyeSettings.eyeWidth) + deltaX,

              25,
              160,
            ),

            eyeSpacing: eyeClamp(
              eyeNumber(start.eyeSpacing, defaultEyeSettings.eyeSpacing) -
                deltaX,

              40,
              240,
            ),

            eyeRotation: eyeClamp(
              eyeNumber(start.eyeRotation, defaultEyeSettings.eyeRotation) +
                deltaY * 0.35,

              -30,
              30,
            ),
          });
        },
      },

      /* ==========================
         LEFT OUTER CANTHUS
      ========================== */

      {
        id: "leftOuterCorner",

        label: "Left Outer Canthus",

        point: leftOuter,

        guideGroup: "leftEyeShape",

        guideOrder: 0,

        properties: ["eyeWidth", "eyeRotation"],

        help: "Drag horizontally to change eye width. Drag vertically to rotate the eye line.",

        beginDrag: function () {
          return {
            ...window.eyeSettings,
          };
        },

        drag: function (deltaX, deltaY, dragStart) {
          const start = dragStart || {};

          updateFaceLabEyes({
            eyeWidth: eyeClamp(
              eyeNumber(start.eyeWidth, defaultEyeSettings.eyeWidth) -
                deltaX * 2,

              25,
              160,
            ),

            eyeRotation: eyeClamp(
              eyeNumber(start.eyeRotation, defaultEyeSettings.eyeRotation) -
                deltaY * 0.35,

              -30,
              30,
            ),
          });
        },
      },

      /* ==========================
         RIGHT INNER CANTHUS
      ========================== */

      {
        id: "rightInnerCorner",

        label: "Right Inner Canthus",

        point: rightInner,

        guideGroup: "rightEyeShape",

        guideOrder: 0,

        properties: ["eyeWidth", "eyeSpacing", "eyeRotation"],

        help: "Drag horizontally to alter eye width and inner spacing. Drag vertically to rotate the eye line.",

        beginDrag: function () {
          return {
            ...window.eyeSettings,
          };
        },

        drag: function (deltaX, deltaY, dragStart) {
          const start = dragStart || {};

          updateFaceLabEyes({
            eyeWidth: eyeClamp(
              eyeNumber(start.eyeWidth, defaultEyeSettings.eyeWidth) - deltaX,

              25,
              160,
            ),

            eyeSpacing: eyeClamp(
              eyeNumber(start.eyeSpacing, defaultEyeSettings.eyeSpacing) +
                deltaX,

              40,
              240,
            ),

            eyeRotation: eyeClamp(
              eyeNumber(start.eyeRotation, defaultEyeSettings.eyeRotation) -
                deltaY * 0.35,

              -30,
              30,
            ),
          });
        },
      },

      /* ==========================
         RIGHT OUTER CANTHUS
      ========================== */

      {
        id: "rightOuterCorner",

        label: "Right Outer Canthus",

        point: rightOuter,

        guideGroup: "rightEyeShape",

        guideOrder: 2,

        properties: ["eyeWidth", "eyeRotation"],

        help: "Drag horizontally to change eye width. Drag vertically to rotate the eye line.",

        beginDrag: function () {
          return {
            ...window.eyeSettings,
          };
        },

        drag: function (deltaX, deltaY, dragStart) {
          const start = dragStart || {};

          updateFaceLabEyes({
            eyeWidth: eyeClamp(
              eyeNumber(start.eyeWidth, defaultEyeSettings.eyeWidth) +
                deltaX * 2,

              25,
              160,
            ),

            eyeRotation: eyeClamp(
              eyeNumber(start.eyeRotation, defaultEyeSettings.eyeRotation) +
                deltaY * 0.35,

              -30,
              30,
            ),
          });
        },
      },

      /* ==========================
         LEFT UPPER PEAK
      ========================== */

      {
        id: "leftUpperLid",

        label: "Left Upper Lid Peak",

        point: leftUpper,

        guideGroup: "leftEyeShape",

        guideOrder: 1,

        properties: ["eyeHeight", "eyeUpperArch"],

        help: "Drag vertically to adjust the upper eye opening.",

        beginDrag: function () {
          return {
            ...window.eyeSettings,
          };
        },

        drag: function (deltaX, deltaY, dragStart) {
          const start = dragStart || {};

          updateFaceLabEyes({
            eyeHeight: eyeClamp(
              eyeNumber(start.eyeHeight, defaultEyeSettings.eyeHeight) -
                deltaY * 2,

              4,
              110,
            ),
          });
        },
      },

      /* ==========================
         LEFT LOWER LOW POINT
      ========================== */

      {
        id: "leftLowerLid",

        label: "Left Lower Lid Low Point",

        point: leftLower,

        guideGroup: "leftEyeShape",

        guideOrder: 3,

        properties: ["eyeHeight", "eyeLowerArch"],

        help: "Drag vertically to adjust the lower eye opening.",

        beginDrag: function () {
          return {
            ...window.eyeSettings,
          };
        },

        drag: function (deltaX, deltaY, dragStart) {
          const start = dragStart || {};

          updateFaceLabEyes({
            eyeHeight: eyeClamp(
              eyeNumber(start.eyeHeight, defaultEyeSettings.eyeHeight) +
                deltaY * 2,

              4,
              110,
            ),
          });
        },
      },

      /* ==========================
         RIGHT UPPER PEAK
      ========================== */

      {
        id: "rightUpperLid",

        label: "Right Upper Lid Peak",

        point: rightUpper,

        guideGroup: "rightEyeShape",

        guideOrder: 1,

        properties: ["eyeHeight", "eyeUpperArch"],

        help: "Drag vertically to adjust the upper eye opening.",

        beginDrag: function () {
          return {
            ...window.eyeSettings,
          };
        },

        drag: function (deltaX, deltaY, dragStart) {
          const start = dragStart || {};

          updateFaceLabEyes({
            eyeHeight: eyeClamp(
              eyeNumber(start.eyeHeight, defaultEyeSettings.eyeHeight) -
                deltaY * 2,

              4,
              110,
            ),
          });
        },
      },

      /* ==========================
         RIGHT LOWER LOW POINT
      ========================== */

      {
        id: "rightLowerLid",

        label: "Right Lower Lid Low Point",

        point: rightLower,

        guideGroup: "rightEyeShape",

        guideOrder: 3,

        properties: ["eyeHeight", "eyeLowerArch"],

        help: "Drag vertically to adjust the lower eye opening.",

        beginDrag: function () {
          return {
            ...window.eyeSettings,
          };
        },

        drag: function (deltaX, deltaY, dragStart) {
          const start = dragStart || {};

          updateFaceLabEyes({
            eyeHeight: eyeClamp(
              eyeNumber(start.eyeHeight, defaultEyeSettings.eyeHeight) +
                deltaY * 2,

              4,
              110,
            ),
          });
        },
      },
    ];
  }

  /* ==========================
     PUBLIC EYE SYSTEM API
  ========================== */

  window.updateEyeSettings = updateFaceLabEyes;

  window.EyeSystem = {
    version: "2.1.0",

    defaults: Object.freeze({
      ...defaultEyeSettings,
    }),

    getSettings: function () {
      return {
        ...window.eyeSettings,
      };
    },

    getAnatomy: function (side) {
      if (side) {
        return window.eyeAnatomy[side] || null;
      }

      return {
        left: window.eyeAnatomy.left,

        right: window.eyeAnatomy.right,
      };
    },

    getHandles: createFaceLabEyeHandles,

    draw: drawEyes,
    refresh: drawEyes,

    initialize: initializeEyeControls,

    update: updateFaceLabEyes,

    setPose: setEyeRigPose,
    resetRig: resetEyeRig,

    reset: resetEyes,
    save: saveEyes,
    load: loadEyes,
  };

  /* ==========================
     REGISTER EYE FEATURE
  ========================== */

  if (window.FaceLab && typeof window.FaceLab.registerFeature === "function") {
    window.FaceLab.registerFeature(
      "eyes",

      {
        label: "Eyes",

        defaults: window.EyeSystem.defaults,

        getSettings: window.EyeSystem.getSettings,

        getAnatomy: window.EyeSystem.getAnatomy,

        getHandles: createFaceLabEyeHandles,

        update: updateFaceLabEyes,

        draw: drawEyes,
        refresh: drawEyes,

        reset: resetEyes,
        save: saveEyes,
        load: loadEyes,
      },
    );
  } else {
    console.warn("FaceLab Core was not available when eyes.js loaded.");
  }

  console.log("FaceLab Eye System 2.1 registered");
})();
