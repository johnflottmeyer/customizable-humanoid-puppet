/* =========================================================
   FACELAB EYE SYSTEM
   Version 2.2.1

   2.2.1
   - Tear duct is centered on inner canthus.
   - Removed old 2.2px vertical duct displacement.
   - Three tear-duct Inspector handles remain available.
========================================================= */

/* ==========================
   DEFAULT EYE VALUES
========================== */

const defaultEyeSettings = {
  eyeY: 235,
  eyeSpacing: 134,

  eyeWidth: 80,
  eyeHeight: 30,
  eyeRotation: 0,

  eyeUpperArch: 1.2,
  eyeLowerArch: 0.75,

  eyeInnerCorner: -2,
  eyeOuterCorner: 2,

  irisSize: 27,

  irisCenterX: 0,
  irisCenterY: -2,

  pupilSize: 10,
  pupilX: 0,
  pupilY: 0,

  /* LEFT TEAR DUCT */

  leftTearDuctX: 0,
  leftTearDuctY: 0,

  leftTearDuctUpperX: 0,
  leftTearDuctUpperY: 0,

  leftTearDuctLowerX: 0,
  leftTearDuctLowerY: 0,

  /* RIGHT TEAR DUCT */

  rightTearDuctX: 0,
  rightTearDuctY: 0,

  rightTearDuctUpperX: 0,
  rightTearDuctUpperY: 0,

  rightTearDuctLowerX: 0,
  rightTearDuctLowerY: 0,
};

window.eyeSettings = {
  ...defaultEyeSettings,
};

window.eyeAnatomy = {
  left: null,
  right: null,
};

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

function displayEyeValue(settingName) {
  const valueDisplay =
    document.getElementById(
      `${settingName}Value`,
    );

  if (!valueDisplay) {
    return;
  }

  valueDisplay.textContent =
    window.eyeSettings[
      settingName
    ];
}

function clamp(
  value,
  minimum,
  maximum,
) {
  return Math.max(
    minimum,
    Math.min(
      maximum,
      value,
    ),
  );
}

function safeEyeNumber(
  value,
  fallback,
) {
  const number =
    Number(value);

  return Number.isFinite(number)
    ? number
    : fallback;
}

function refreshFaceInspector() {
  if (
    window.FaceInspector &&
    typeof window.FaceInspector
      .refresh ===
      "function"
  ) {
    window.FaceInspector
      .refresh();
  }
}

/* ==========================
   BUILD EYE ANATOMY
========================== */

function buildEyeAnatomy(
  side,
  centerX,
  centerY,
  rotation,
  blinkAmount,
) {
  if (
    !window.EyeBuilder ||
    typeof window.EyeBuilder
      .build !==
      "function"
  ) {
    console.error(
      "EyeBuilder is unavailable. Load js/eyes/eyeBuilder.js before js/eyes.js.",
    );

    return null;
  }

  const settings =
    window.eyeSettings;

  const upperPeakHeight =
    clamp(
      safeEyeNumber(
        settings.eyeUpperArch,
        defaultEyeSettings
          .eyeUpperArch,
      ) * 0.43,
      0.08,
      1.1,
    );

  const lowerLowDepth =
    clamp(
      safeEyeNumber(
        settings.eyeLowerArch,
        defaultEyeSettings
          .eyeLowerArch,
      ) * 0.4,
      0.04,
      0.9,
    );

  const cornerInfluence =
    1 -
    clamp(
      blinkAmount,
      0,
      1,
    );

  const isLeft =
    side === "left";

  return window.EyeBuilder.build({
    side,

    centerX,
    centerY,

    width:
      safeEyeNumber(
        settings.eyeWidth,
        defaultEyeSettings.eyeWidth,
      ),

    height:
      safeEyeNumber(
        settings.eyeHeight,
        defaultEyeSettings.eyeHeight,
      ),

    rotation,

    /* CORNERS */

    innerCornerY:
      safeEyeNumber(
        settings.eyeInnerCorner,
        defaultEyeSettings.eyeInnerCorner,
      ) *
      cornerInfluence,

    outerCornerY:
      safeEyeNumber(
        settings.eyeOuterCorner,
        defaultEyeSettings.eyeOuterCorner,
      ) *
      cornerInfluence,

    /* UPPER */

    upperPeakPosition: 0.39,

    upperPeakHeight,

    upperInnerTension: 0.72,
    upperOuterTension: 0.54,

    /* LOWER */

    lowerLowPosition: 0.61,

    lowerLowDepth,

    lowerOuterTension: 0.34,
    lowerInnerTension: 0.25,

    /* ==========================
       TEAR DUCT

       Important:
       tearDuctHeight used to be 2.2.

       That was forcing the entire duct
       away from the inner eye corner.

       It is now centered on the canthus.
    ========================== */

    tearDuctLength: 4.5,

    tearDuctHeight: 0,

    tearDuctSurfaceHeight: 1.35,

    tearDuctAttachmentInset: 0.22,

    tearDuctTipOffsetX:
      safeEyeNumber(
        isLeft
          ? settings.leftTearDuctX
          : settings.rightTearDuctX,
        0,
      ),

    tearDuctTipOffsetY:
      safeEyeNumber(
        isLeft
          ? settings.leftTearDuctY
          : settings.rightTearDuctY,
        0,
      ),

    tearDuctUpperOffsetX:
      safeEyeNumber(
        isLeft
          ? settings.leftTearDuctUpperX
          : settings.rightTearDuctUpperX,
        0,
      ),

    tearDuctUpperOffsetY:
      safeEyeNumber(
        isLeft
          ? settings.leftTearDuctUpperY
          : settings.rightTearDuctUpperY,
        0,
      ),

    tearDuctLowerOffsetX:
      safeEyeNumber(
        isLeft
          ? settings.leftTearDuctLowerX
          : settings.rightTearDuctLowerX,
        0,
      ),

    tearDuctLowerOffsetY:
      safeEyeNumber(
        isLeft
          ? settings.leftTearDuctLowerY
          : settings.rightTearDuctLowerY,
        0,
      ),

    /* CREASES */

    upperCreaseHeight: 7,
    upperCreaseInset: 7,

    lowerCreaseDepth: 4,
    lowerCreaseInset: 12,

    /* SOCKET */

    socketWidthScale: 1.38,

    socketHeightScale:
      (
        safeEyeNumber(
          settings.eyeHeight,
          defaultEyeSettings.eyeHeight,
        ) +
        18
      ) /
      Math.max(
        safeEyeNumber(
          settings.eyeHeight,
          defaultEyeSettings.eyeHeight,
        ),
        1,
      ),

    socketOffsetY: 2,

    /* RIG */

    rigState: {
      blink:
        clamp(
          safeEyeNumber(
            blinkAmount,
            0,
          ),
          0,
          1,
        ),

      squint:
        clamp(
          safeEyeNumber(
            window.eyeAnimationState
              .squint,
            0,
          ),
          0,
          1,
        ),

      wide:
        clamp(
          safeEyeNumber(
            window.eyeAnimationState
              .wide,
            0,
          ),
          0,
          1,
        ),

      happy:
        clamp(
          safeEyeNumber(
            window.eyeAnimationState
              .happy,
            0,
          ),
          0,
          1,
        ),

      angry:
        clamp(
          safeEyeNumber(
            window.eyeAnimationState
              .angry,
            0,
          ),
          0,
          1,
        ),

      sleepy:
        clamp(
          safeEyeNumber(
            window.eyeAnimationState
              .sleepy,
            0,
          ),
          0,
          1,
        ),

      gazeX: 0,
      gazeY: 0,
    },

    irisSize:
      safeEyeNumber(
        settings.irisSize,
        defaultEyeSettings.irisSize,
      ),

    irisCenterX:
      safeEyeNumber(
        settings.irisCenterX,
        defaultEyeSettings.irisCenterX,
      ),

    irisCenterY:
      safeEyeNumber(
        settings.irisCenterY,
        defaultEyeSettings.irisCenterY,
      ),

    pupilSize:
      safeEyeNumber(
        settings.pupilSize,
        defaultEyeSettings.pupilSize,
      ),
  });
}

/* ==========================
   DRAW EYE
========================== */

function drawEye(
  side,
  centerX,
  centerY,
  rotation,
) {
  const settings =
    window.eyeSettings;

  const animation =
    window.eyeAnimationState || {
      lookX: 0,
      lookY: 0,
      blink: 0,
    };

  if (
    !window.EyeRenderer ||
    typeof window.EyeRenderer
      .render !==
      "function"
  ) {
    console.error(
      "EyeRenderer is unavailable. Load js/eyes/eyeRenderer.js before js/eyes.js.",
    );

    return;
  }

  const blinkAmount =
    clamp(
      safeEyeNumber(
        animation.blink,
        0,
      ),
      0,
      1,
    );

  const animatedEyeHeight =
    Math.max(
      1.5,

      safeEyeNumber(
        settings.eyeHeight,
        defaultEyeSettings.eyeHeight,
      ) *
      (1 - blinkAmount),
    );

  const anatomy =
    buildEyeAnatomy(
      side,
      centerX,
      centerY,
      rotation,
      blinkAmount,
    );

  if (!anatomy) {
    return;
  }

  window.eyeAnatomy[
    side
  ] = anatomy;

  window.EyeRenderer.render({
    side,

    anatomy,

    centerX,
    centerY,

    rotation,

    animatedEyeHeight,

    eyeSettings:
      settings,

    animationState:
      animation,
  });
}

function drawEyes() {
  const settings =
    window.eyeSettings;

  const faceCenterX =
    250;

  const leftEyeX =
    faceCenterX -
    settings.eyeSpacing / 2;

  const rightEyeX =
    faceCenterX +
    settings.eyeSpacing / 2;

  drawEye(
    "left",
    leftEyeX,
    settings.eyeY,
    settings.eyeRotation,
  );

  drawEye(
    "right",
    rightEyeX,
    settings.eyeY,
    -settings.eyeRotation,
  );
}

/* ==========================
   CONTROLS
========================== */

function initializeEyeControls() {
  eyeControls.forEach(
    function (
      settingName,
    ) {
      const slider =
        document.getElementById(
          settingName,
        );

      if (!slider) {
        console.warn(
          `Could not find eye slider: ${settingName}`,
        );

        return;
      }

      slider.value =
        window.eyeSettings[
          settingName
        ];

      displayEyeValue(
        settingName,
      );

      slider.addEventListener(
        "input",

        function () {
          window.eyeSettings[
            settingName
          ] =
            Number(
              slider.value,
            );

          displayEyeValue(
            settingName,
          );

          drawEyes();

          refreshFaceInspector();
        },
      );
    },
  );
}

function updateEyeControls() {
  eyeControls.forEach(
    function (
      settingName,
    ) {
      const slider =
        document.getElementById(
          settingName,
        );

      if (!slider) {
        return;
      }

      slider.value =
        window.eyeSettings[
          settingName
        ];

      displayEyeValue(
        settingName,
      );
    },
  );
}

/* ==========================
   SAVE / LOAD
========================== */

function displayEyeStatus(message) {
  const status =
    document.getElementById(
      "eyeSaveStatus",
    );

  if (status) {
    status.textContent =
      message;
  }
}

function saveEyes() {
  try {
    localStorage.setItem(
      "humanoidEyeSettings",

      JSON.stringify(
        window.eyeSettings,
      ),
    );

    displayEyeStatus(
      "Eye settings saved.",
    );
  } catch (error) {
    console.error(
      error,
    );
  }
}

function loadEyes() {
  const savedSettings =
    localStorage.getItem(
      "humanoidEyeSettings",
    );

  if (!savedSettings) {
    return false;
  }

  try {
    Object.assign(
      window.eyeSettings,

      defaultEyeSettings,

      JSON.parse(
        savedSettings,
      ),
    );

    updateEyeControls();

    drawEyes();

    refreshFaceInspector();

    return true;
  } catch (error) {
    console.error(
      error,
    );

    return false;
  }
}

function resetEyes() {
  Object.assign(
    window.eyeSettings,
    defaultEyeSettings,
  );

  updateEyeControls();

  drawEyes();

  refreshFaceInspector();
}

/* ==========================
   RIG
========================== */

function setEyeRigPose(
  poseName,
  amount,
) {
  const allowedPoses = [
    "blink",
    "squint",
    "wide",
    "happy",
    "angry",
    "sleepy",
  ];

  if (
    !allowedPoses.includes(
      poseName,
    )
  ) {
    return;
  }

  window.eyeAnimationState[
    poseName
  ] =
    clamp(
      safeEyeNumber(
        amount,
        0,
      ),
      0,
      1,
    );

  drawEyes();

  refreshFaceInspector();
}

function resetEyeRig() {
  Object.assign(
    window.eyeAnimationState,
    {
      blink: 0,
      squint: 0,
      wide: 0,
      happy: 0,
      angry: 0,
      sleepy: 0,
    },
  );

  drawEyes();

  refreshFaceInspector();
}

/* ==========================
   GLOBAL API
========================== */

window.drawEye =
  drawEye;

window.drawEyes =
  drawEyes;

window.initializeEyeControls =
  initializeEyeControls;

window.updateEyeControls =
  updateEyeControls;

window.saveEyes =
  saveEyes;

window.loadEyes =
  loadEyes;

window.resetEyes =
  resetEyes;

window.setEyeRigPose =
  setEyeRigPose;

window.resetEyeRig =
  resetEyeRig;

/* =========================================================
   FACELAB EYE FEATURE
========================================================= */

(function registerFaceLabEyes() {
  "use strict";

  function eyeNumber(
    value,
    fallback,
  ) {
    const number =
      Number(value);

    return Number.isFinite(number)
      ? number
      : fallback;
  }

  function eyeClamp(
    value,
    minimum,
    maximum,
  ) {
    return Math.max(
      minimum,
      Math.min(
        maximum,
        value,
      ),
    );
  }

  function rotateEyePoint(
    sourcePoint,
    center,
    degrees,
  ) {
    const radians =
      eyeNumber(
        degrees,
        0,
      ) *
      Math.PI /
      180;

    const cosine =
      Math.cos(
        radians,
      );

    const sine =
      Math.sin(
        radians,
      );

    const offsetX =
      sourcePoint.x -
      center.x;

    const offsetY =
      sourcePoint.y -
      center.y;

    return {
      x:
        center.x +
        offsetX *
          cosine -
        offsetY *
          sine,

      y:
        center.y +
        offsetX *
          sine +
        offsetY *
          cosine,
    };
  }

  function updateFaceLabEyes(
    updates,
  ) {
    if (
      !updates ||
      typeof updates !==
        "object"
    ) {
      return {
        ...window.eyeSettings,
      };
    }

    Object.assign(
      window.eyeSettings,
      updates,
    );

    updateEyeControls();

    drawEyes();

    refreshFaceInspector();

    return {
      ...window.eyeSettings,
    };
  }

  function getFaceLabEyeGeometry() {
    const settings =
      window.eyeSettings;

    const faceCenterX =
      250;

    const eyeY =
      eyeNumber(
        settings.eyeY,
        defaultEyeSettings.eyeY,
      );

    const spacing =
      eyeNumber(
        settings.eyeSpacing,
        defaultEyeSettings.eyeSpacing,
      );

    const width =
      eyeNumber(
        settings.eyeWidth,
        defaultEyeSettings.eyeWidth,
      );

    const height =
      eyeNumber(
        settings.eyeHeight,
        defaultEyeSettings.eyeHeight,
      );

    const rotation =
      eyeNumber(
        settings.eyeRotation,
        defaultEyeSettings.eyeRotation,
      );

    const leftCenter = {
      x:
        faceCenterX -
        spacing / 2,

      y:
        eyeY,
    };

    const rightCenter = {
      x:
        faceCenterX +
        spacing / 2,

      y:
        eyeY,
    };

    return {
      settings,

      faceCenterX,
      eyeY,
      spacing,

      width,
      height,

      halfWidth:
        width / 2,

      halfHeight:
        height / 2,

      rotation,

      leftCenter,
      rightCenter,

      leftRotation:
        rotation,

      rightRotation:
        -rotation,
    };
  }

  function getBuilderLandmark(
    side,
    landmarkName,
    fallback,
  ) {
    const anatomy =
      window.eyeAnatomy &&
      window.eyeAnatomy[
        side
      ];

    if (
      anatomy &&
      anatomy.transformedLandmarks &&
      anatomy.transformedLandmarks[
        landmarkName
      ]
    ) {
      const landmark =
        anatomy.transformedLandmarks[
          landmarkName
        ];

      return {
        x: landmark.x,
        y: landmark.y,
      };
    }

    return fallback;
  }

  function createFaceLabEyeHandles() {
    const geometry =
      getFaceLabEyeGeometry();

    const leftCenter =
      geometry.leftCenter;

    const rightCenter =
      geometry.rightCenter;

    const leftInner =
      getBuilderLandmark(
        "left",
        "innerCanthus",

        rotateEyePoint(
          {
            x:
              leftCenter.x +
              geometry.halfWidth,

            y:
              leftCenter.y,
          },

          leftCenter,

          geometry.leftRotation,
        ),
      );

    const leftOuter =
      getBuilderLandmark(
        "left",
        "outerCanthus",

        rotateEyePoint(
          {
            x:
              leftCenter.x -
              geometry.halfWidth,

            y:
              leftCenter.y,
          },

          leftCenter,

          geometry.leftRotation,
        ),
      );

    const rightInner =
      getBuilderLandmark(
        "right",
        "innerCanthus",

        rotateEyePoint(
          {
            x:
              rightCenter.x -
              geometry.halfWidth,

            y:
              rightCenter.y,
          },

          rightCenter,

          geometry.rightRotation,
        ),
      );

    const rightOuter =
      getBuilderLandmark(
        "right",
        "outerCanthus",

        rotateEyePoint(
          {
            x:
              rightCenter.x +
              geometry.halfWidth,

            y:
              rightCenter.y,
          },

          rightCenter,

          geometry.rightRotation,
        ),
      );

    const leftUpper =
      getBuilderLandmark(
        "left",
        "upperPeak",
        leftCenter,
      );

    const leftLower =
      getBuilderLandmark(
        "left",
        "lowerLow",
        leftCenter,
      );

    const rightUpper =
      getBuilderLandmark(
        "right",
        "upperPeak",
        rightCenter,
      );

    const rightLower =
      getBuilderLandmark(
        "right",
        "lowerLow",
        rightCenter,
      );

    const leftTearUpper =
      getBuilderLandmark(
        "left",
        "tearDuctUpper",
        leftInner,
      );

    const leftTearTip =
      getBuilderLandmark(
        "left",
        "tearDuct",
        leftInner,
      );

    const leftTearLower =
      getBuilderLandmark(
        "left",
        "tearDuctLower",
        leftInner,
      );

    const rightTearUpper =
      getBuilderLandmark(
        "right",
        "tearDuctUpper",
        rightInner,
      );

    const rightTearTip =
      getBuilderLandmark(
        "right",
        "tearDuct",
        rightInner,
      );

    const rightTearLower =
      getBuilderLandmark(
        "right",
        "tearDuctLower",
        rightInner,
      );

    function dragSettingPair(
      xProperty,
      yProperty,
    ) {
      return function (
        deltaX,
        deltaY,
        dragStart,
      ) {
        const start =
          dragStart || {};

        updateFaceLabEyes({
          [xProperty]:
            eyeClamp(
              eyeNumber(
                start[
                  xProperty
                ],
                0,
              ) +
              deltaX,
              -30,
              30,
            ),

          [yProperty]:
            eyeClamp(
              eyeNumber(
                start[
                  yProperty
                ],
                0,
              ) +
              deltaY,
              -30,
              30,
            ),
        });
      };
    }

    const handles = [
      /* LEFT DUCT */

      {
        id:
          "leftTearDuctUpper",

        label:
          "Left Upper Tear Duct",

        point:
          leftTearUpper,

        guideGroup:
          "leftTearDuct",

        guideOrder: 0,

        properties: [
          "leftTearDuctUpperX",
          "leftTearDuctUpperY",
        ],

        help:
          "Controls the upper attachment of the tear duct at the inner canthus.",

        beginDrag:
          function () {
            return {
              ...window.eyeSettings,
            };
          },

        drag:
          dragSettingPair(
            "leftTearDuctUpperX",
            "leftTearDuctUpperY",
          ),
      },

      {
        id:
          "leftTearDuct",

        label:
          "Left Tear Duct Tip",

        point:
          leftTearTip,

        guideGroup:
          "leftTearDuct",

        guideOrder: 1,

        properties: [
          "leftTearDuctX",
          "leftTearDuctY",
        ],

        help:
          "Controls the nasal tip of the left tear duct.",

        beginDrag:
          function () {
            return {
              ...window.eyeSettings,
            };
          },

        drag:
          dragSettingPair(
            "leftTearDuctX",
            "leftTearDuctY",
          ),
      },

      {
        id:
          "leftTearDuctLower",

        label:
          "Left Lower Tear Duct",

        point:
          leftTearLower,

        guideGroup:
          "leftTearDuct",

        guideOrder: 2,

        properties: [
          "leftTearDuctLowerX",
          "leftTearDuctLowerY",
        ],

        help:
          "Controls the lower attachment of the tear duct at the inner canthus.",

        beginDrag:
          function () {
            return {
              ...window.eyeSettings,
            };
          },

        drag:
          dragSettingPair(
            "leftTearDuctLowerX",
            "leftTearDuctLowerY",
          ),
      },

      /* RIGHT DUCT */

      {
        id:
          "rightTearDuctUpper",

        label:
          "Right Upper Tear Duct",

        point:
          rightTearUpper,

        guideGroup:
          "rightTearDuct",

        guideOrder: 0,

        properties: [
          "rightTearDuctUpperX",
          "rightTearDuctUpperY",
        ],

        help:
          "Controls the upper attachment of the tear duct at the inner canthus.",

        beginDrag:
          function () {
            return {
              ...window.eyeSettings,
            };
          },

        drag:
          dragSettingPair(
            "rightTearDuctUpperX",
            "rightTearDuctUpperY",
          ),
      },

      {
        id:
          "rightTearDuct",

        label:
          "Right Tear Duct Tip",

        point:
          rightTearTip,

        guideGroup:
          "rightTearDuct",

        guideOrder: 1,

        properties: [
          "rightTearDuctX",
          "rightTearDuctY",
        ],

        help:
          "Controls the nasal tip of the right tear duct.",

        beginDrag:
          function () {
            return {
              ...window.eyeSettings,
            };
          },

        drag:
          dragSettingPair(
            "rightTearDuctX",
            "rightTearDuctY",
          ),
      },

      {
        id:
          "rightTearDuctLower",

        label:
          "Right Lower Tear Duct",

        point:
          rightTearLower,

        guideGroup:
          "rightTearDuct",

        guideOrder: 2,

        properties: [
          "rightTearDuctLowerX",
          "rightTearDuctLowerY",
        ],

        help:
          "Controls the lower attachment of the tear duct at the inner canthus.",

        beginDrag:
          function () {
            return {
              ...window.eyeSettings,
            };
          },

        drag:
          dragSettingPair(
            "rightTearDuctLowerX",
            "rightTearDuctLowerY",
          ),
      },

      /* EYE CENTERS */

      {
        id:
          "leftCenter",

        label:
          "Left Eye Position",

        point:
          leftCenter,

        guideGroup:
          "eyeCenters",

        guideOrder: 0,

        properties: [
          "eyeSpacing",
          "eyeY",
        ],

        beginDrag:
          function () {
            return {
              ...window.eyeSettings,
            };
          },

        drag:
          function (
            deltaX,
            deltaY,
            start,
          ) {
            updateFaceLabEyes({
              eyeSpacing:
                eyeClamp(
                  eyeNumber(
                    start.eyeSpacing,
                    defaultEyeSettings.eyeSpacing,
                  ) -
                  deltaX * 2,
                  40,
                  240,
                ),

              eyeY:
                eyeClamp(
                  eyeNumber(
                    start.eyeY,
                    defaultEyeSettings.eyeY,
                  ) +
                  deltaY,
                  120,
                  360,
                ),
            });
          },
      },

      {
        id:
          "rightCenter",

        label:
          "Right Eye Position",

        point:
          rightCenter,

        guideGroup:
          "eyeCenters",

        guideOrder: 1,

        properties: [
          "eyeSpacing",
          "eyeY",
        ],

        beginDrag:
          function () {
            return {
              ...window.eyeSettings,
            };
          },

        drag:
          function (
            deltaX,
            deltaY,
            start,
          ) {
            updateFaceLabEyes({
              eyeSpacing:
                eyeClamp(
                  eyeNumber(
                    start.eyeSpacing,
                    defaultEyeSettings.eyeSpacing,
                  ) +
                  deltaX * 2,
                  40,
                  240,
                ),

              eyeY:
                eyeClamp(
                  eyeNumber(
                    start.eyeY,
                    defaultEyeSettings.eyeY,
                  ) +
                  deltaY,
                  120,
                  360,
                ),
            });
          },
      },

      /* INNER CANTHI */

      {
        id:
          "leftInnerCorner",

        label:
          "Left Inner Canthus",

        point:
          leftInner,

        guideGroup:
          "leftEyeShape",

        guideOrder: 2,

        properties: [
          "eyeWidth",
          "eyeSpacing",
          "eyeRotation",
        ],

        beginDrag:
          function () {
            return {
              ...window.eyeSettings,
            };
          },

        drag:
          function (
            deltaX,
            deltaY,
            start,
          ) {
            updateFaceLabEyes({
              eyeWidth:
                eyeClamp(
                  eyeNumber(
                    start.eyeWidth,
                    defaultEyeSettings.eyeWidth,
                  ) +
                  deltaX,
                  25,
                  160,
                ),

              eyeSpacing:
                eyeClamp(
                  eyeNumber(
                    start.eyeSpacing,
                    defaultEyeSettings.eyeSpacing,
                  ) -
                  deltaX,
                  40,
                  240,
                ),

              eyeRotation:
                eyeClamp(
                  eyeNumber(
                    start.eyeRotation,
                    0,
                  ) +
                  deltaY * 0.35,
                  -30,
                  30,
                ),
            });
          },
      },

      {
        id:
          "rightInnerCorner",

        label:
          "Right Inner Canthus",

        point:
          rightInner,

        guideGroup:
          "rightEyeShape",

        guideOrder: 0,

        properties: [
          "eyeWidth",
          "eyeSpacing",
          "eyeRotation",
        ],

        beginDrag:
          function () {
            return {
              ...window.eyeSettings,
            };
          },

        drag:
          function (
            deltaX,
            deltaY,
            start,
          ) {
            updateFaceLabEyes({
              eyeWidth:
                eyeClamp(
                  eyeNumber(
                    start.eyeWidth,
                    defaultEyeSettings.eyeWidth,
                  ) -
                  deltaX,
                  25,
                  160,
                ),

              eyeSpacing:
                eyeClamp(
                  eyeNumber(
                    start.eyeSpacing,
                    defaultEyeSettings.eyeSpacing,
                  ) +
                  deltaX,
                  40,
                  240,
                ),

              eyeRotation:
                eyeClamp(
                  eyeNumber(
                    start.eyeRotation,
                    0,
                  ) -
                  deltaY * 0.35,
                  -30,
                  30,
                ),
            });
          },
      },

      /* OUTER CANTHI */

      {
        id:
          "leftOuterCorner",

        label:
          "Left Outer Canthus",

        point:
          leftOuter,

        guideGroup:
          "leftEyeShape",

        guideOrder: 0,

        properties: [
          "eyeWidth",
          "eyeRotation",
        ],

        beginDrag:
          function () {
            return {
              ...window.eyeSettings,
            };
          },

        drag:
          function (
            deltaX,
            deltaY,
            start,
          ) {
            updateFaceLabEyes({
              eyeWidth:
                eyeClamp(
                  eyeNumber(
                    start.eyeWidth,
                    defaultEyeSettings.eyeWidth,
                  ) -
                  deltaX * 2,
                  25,
                  160,
                ),

              eyeRotation:
                eyeClamp(
                  eyeNumber(
                    start.eyeRotation,
                    0,
                  ) -
                  deltaY * 0.35,
                  -30,
                  30,
                ),
            });
          },
      },

      {
        id:
          "rightOuterCorner",

        label:
          "Right Outer Canthus",

        point:
          rightOuter,

        guideGroup:
          "rightEyeShape",

        guideOrder: 2,

        properties: [
          "eyeWidth",
          "eyeRotation",
        ],

        beginDrag:
          function () {
            return {
              ...window.eyeSettings,
            };
          },

        drag:
          function (
            deltaX,
            deltaY,
            start,
          ) {
            updateFaceLabEyes({
              eyeWidth:
                eyeClamp(
                  eyeNumber(
                    start.eyeWidth,
                    defaultEyeSettings.eyeWidth,
                  ) +
                  deltaX * 2,
                  25,
                  160,
                ),

              eyeRotation:
                eyeClamp(
                  eyeNumber(
                    start.eyeRotation,
                    0,
                  ) +
                  deltaY * 0.35,
                  -30,
                  30,
                ),
            });
          },
      },

      /* UPPER / LOWER */

      {
        id:
          "leftUpperLid",

        label:
          "Left Upper Lid Peak",

        point:
          leftUpper,

        guideGroup:
          "leftEyeShape",

        guideOrder: 1,

        properties: [
          "eyeHeight",
        ],

        beginDrag:
          function () {
            return {
              ...window.eyeSettings,
            };
          },

        drag:
          function (
            deltaX,
            deltaY,
            start,
          ) {
            updateFaceLabEyes({
              eyeHeight:
                eyeClamp(
                  eyeNumber(
                    start.eyeHeight,
                    defaultEyeSettings.eyeHeight,
                  ) -
                  deltaY * 2,
                  4,
                  110,
                ),
            });
          },
      },

      {
        id:
          "leftLowerLid",

        label:
          "Left Lower Lid Low Point",

        point:
          leftLower,

        guideGroup:
          "leftEyeShape",

        guideOrder: 3,

        properties: [
          "eyeHeight",
        ],

        beginDrag:
          function () {
            return {
              ...window.eyeSettings,
            };
          },

        drag:
          function (
            deltaX,
            deltaY,
            start,
          ) {
            updateFaceLabEyes({
              eyeHeight:
                eyeClamp(
                  eyeNumber(
                    start.eyeHeight,
                    defaultEyeSettings.eyeHeight,
                  ) +
                  deltaY * 2,
                  4,
                  110,
                ),
            });
          },
      },

      {
        id:
          "rightUpperLid",

        label:
          "Right Upper Lid Peak",

        point:
          rightUpper,

        guideGroup:
          "rightEyeShape",

        guideOrder: 1,

        properties: [
          "eyeHeight",
        ],

        beginDrag:
          function () {
            return {
              ...window.eyeSettings,
            };
          },

        drag:
          function (
            deltaX,
            deltaY,
            start,
          ) {
            updateFaceLabEyes({
              eyeHeight:
                eyeClamp(
                  eyeNumber(
                    start.eyeHeight,
                    defaultEyeSettings.eyeHeight,
                  ) -
                  deltaY * 2,
                  4,
                  110,
                ),
            });
          },
      },

      {
        id:
          "rightLowerLid",

        label:
          "Right Lower Lid Low Point",

        point:
          rightLower,

        guideGroup:
          "rightEyeShape",

        guideOrder: 3,

        properties: [
          "eyeHeight",
        ],

        beginDrag:
          function () {
            return {
              ...window.eyeSettings,
            };
          },

        drag:
          function (
            deltaX,
            deltaY,
            start,
          ) {
            updateFaceLabEyes({
              eyeHeight:
                eyeClamp(
                  eyeNumber(
                    start.eyeHeight,
                    defaultEyeSettings.eyeHeight,
                  ) +
                  deltaY * 2,
                  4,
                  110,
                ),
            });
          },
      },
    ];

    return handles;
  }

  window.updateEyeSettings =
    updateFaceLabEyes;

  window.EyeSystem = {
    version: "2.2.1",

    defaults:
      Object.freeze({
        ...defaultEyeSettings,
      }),

    getSettings:
      function () {
        return {
          ...window.eyeSettings,
        };
      },

    getAnatomy:
      function (side) {
        if (side) {
          return (
            window.eyeAnatomy[
              side
            ] ||
            null
          );
        }

        return {
          left:
            window.eyeAnatomy.left,

          right:
            window.eyeAnatomy.right,
        };
      },

    getHandles:
      createFaceLabEyeHandles,

    draw:
      drawEyes,

    refresh:
      drawEyes,

    initialize:
      initializeEyeControls,

    update:
      updateFaceLabEyes,

    setPose:
      setEyeRigPose,

    resetRig:
      resetEyeRig,

    reset:
      resetEyes,

    save:
      saveEyes,

    load:
      loadEyes,
  };

  if (
    window.FaceLab &&
    typeof window.FaceLab
      .registerFeature ===
      "function"
  ) {
    window.FaceLab.registerFeature(
      "eyes",

      {
        label: "Eyes",

        defaults:
          window.EyeSystem
            .defaults,

        getSettings:
          window.EyeSystem
            .getSettings,

        getAnatomy:
          window.EyeSystem
            .getAnatomy,

        getHandles:
          createFaceLabEyeHandles,

        update:
          updateFaceLabEyes,

        draw:
          drawEyes,

        refresh:
          drawEyes,

        reset:
          resetEyes,

        save:
          saveEyes,

        load:
          loadEyes,
      },
    );
  } else {
    console.warn(
      "FaceLab Core was not available when eyes.js loaded.",
    );
  }

  console.log(
    "FaceLab Eye System 2.2.1 registered",
  );
})();
