/*
==================================================
FACELAB — IDLE EYE ANIMATOR
VERSION 1.1
==================================================

Adds:
- natural blinking
- occasional double blink
- subtle random eye shifts
- return-to-center behavior
- reduced idle motion while speech is playing

Requires:
- eyes.js
- window.eyeAnimationState
- EyeSystem.draw() or drawEyes()
*/

(function () {

  "use strict";

  const DEFAULTS = Object.freeze({
    enabled: true,

    /* BLINK TIMING */
    blinkMinDelay: 3000,
    blinkMaxDelay: 6000,

    blinkCloseTime: 85,
    blinkHoldTime: 35,
    blinkOpenTime: 120,

    doubleBlinkChance: 0.16,
    doubleBlinkGap: 110,

    /* GAZE TIMING */
    gazeMinDelay: 1600,
    gazeMaxDelay: 4200,

    gazeMoveTime: 220,
    gazeHoldMin: 500,
    gazeHoldMax: 1400,
    gazeReturnTime: 320,

    /* GAZE RANGE */
    smallLookX: 3.5,
    smallLookY: 2.2,

    largeLookX: 6.5,
    largeLookY: 3.5,

    largeGlanceChance: 0.18,

    /* IDLE SHOULD BE QUIETER WHILE SPEAKING */
    pauseGazeWhileSpeaking: true,
    allowBlinkWhileSpeaking: true
  });

  const state = {
    running: false,

    blinkTimer: null,
    gazeTimer: null,

    blinkFrame: null,
    gazeFrame: null,

    isBlinking: false,

    settings: {
      ...DEFAULTS
    }
  };


  function clamp01(value) {

    return Math.max(
      0,
      Math.min(
        1,
        Number(value) || 0
      )
    );
  }


  function randomBetween(
    minimum,
    maximum
  ) {

    return (
      minimum +
      Math.random() *
      (
        maximum -
        minimum
      )
    );
  }


  function getEyeState() {

    if (
      !window.eyeAnimationState
    ) {
      window.eyeAnimationState = {
        lookX: 0,
        lookY: 0,
        blink: 0
      };
    }

    return window.eyeAnimationState;
  }


  function drawEyesNow() {

    if (
      window.EyeSystem &&
      typeof window.EyeSystem.draw ===
        "function"
    ) {
      window.EyeSystem.draw();
      return;
    }

    if (
      typeof window.drawEyes ===
      "function"
    ) {
      window.drawEyes();
    }
  }


  function isSpeaking() {

    return Boolean(
      window.MouthVisemeAnimator &&
      typeof window.MouthVisemeAnimator
        .isQueueRunning ===
        "function" &&
      window.MouthVisemeAnimator
        .isQueueRunning()
    );
  }


  function easeInOutCubic(t) {

    t = clamp01(t);

    return (
      t < 0.5
        ? 4 * t * t * t
        : 1 -
          Math.pow(
            -2 * t + 2,
            3
          ) / 2
    );
  }


  function tweenValue(
    from,
    to,
    duration,
    update,
    frameKey
  ) {

    return new Promise(
      function (resolve) {

        const start =
          performance.now();

        function frame(now) {

          if (!state.running) {
            resolve(false);
            return;
          }

          const raw =
            duration <= 0
              ? 1
              : (
                  now - start
                ) / duration;

          const progress =
            clamp01(raw);

          const eased =
            easeInOutCubic(
              progress
            );

          update(
            from +
            (
              to - from
            ) *
            eased
          );

          drawEyesNow();

          if (
            progress < 1
          ) {
            state[frameKey] =
              requestAnimationFrame(
                frame
              );
          } else {
            state[frameKey] = null;
            resolve(true);
          }
        }

        state[frameKey] =
          requestAnimationFrame(
            frame
          );
      }
    );
  }


  function wait(milliseconds) {

    return new Promise(
      function (resolve) {
        setTimeout(
          resolve,
          Math.max(
            0,
            milliseconds
          )
        );
      }
    );
  }


  async function blinkOnce() {

    if (!state.running) {
      return;
    }

    if (
      !state.settings
        .allowBlinkWhileSpeaking &&
      isSpeaking()
    ) {
      return;
    }

    /*
        Freeze gaze while the lids close/open.

        The remaining "side wiggle" was the idle gaze animation
        continuing at the same time as the blink. The blink itself
        now stays at one fixed pupil position.
    */

    state.isBlinking = true;

    const eyes =
      getEyeState();

    const frozenLookX =
      Number(eyes.lookX) || 0;

    const frozenLookY =
      Number(eyes.lookY) || 0;


    function holdGaze() {
      eyes.lookX =
        frozenLookX;

      eyes.lookY =
        frozenLookY;
    }


    await tweenValue(
      eyes.blink || 0,
      1,
      state.settings
        .blinkCloseTime,
      function (value) {

        holdGaze();

        eyes.blink =
          value;

      },
      "blinkFrame"
    );

    if (!state.running) {
      state.isBlinking = false;
      return;
    }

    holdGaze();

    eyes.blink = 1;

    drawEyesNow();

    await wait(
      state.settings
        .blinkHoldTime
    );

    if (!state.running) {
      state.isBlinking = false;
      return;
    }

    await tweenValue(
      1,
      0,
      state.settings
        .blinkOpenTime,
      function (value) {

        holdGaze();

        eyes.blink =
          value;

      },
      "blinkFrame"
    );

    holdGaze();

    eyes.blink = 0;

    drawEyesNow();

    state.isBlinking = false;
  }

  async function doBlinkCycle() {

    await blinkOnce();

    if (
      state.running &&
      Math.random() <
        state.settings
          .doubleBlinkChance
    ) {
      await wait(
        state.settings
          .doubleBlinkGap
      );

      await blinkOnce();
    }
  }


  function scheduleBlink() {

    if (!state.running) {
      return;
    }

    clearTimeout(
      state.blinkTimer
    );

    state.blinkTimer =
      setTimeout(
        async function () {

          await doBlinkCycle();

          scheduleBlink();

        },
        randomBetween(
          state.settings
            .blinkMinDelay,
          state.settings
            .blinkMaxDelay
        )
      );
  }


  function chooseGazeTarget() {

    const large =
      Math.random() <
      state.settings
        .largeGlanceChance;

    const maxX =
      large
        ? state.settings
            .largeLookX
        : state.settings
            .smallLookX;

    const maxY =
      large
        ? state.settings
            .largeLookY
        : state.settings
            .smallLookY;

    /*
        Bias toward horizontal movement.
        This keeps the eyes from constantly
        bobbing up and down.
    */

    let x =
      randomBetween(
        -maxX,
        maxX
      );

    let y =
      randomBetween(
        -maxY,
        maxY
      ) * 0.72;

    /*
        Occasionally choose a mostly-horizontal
        or mostly-vertical glance.
    */

    const mode =
      Math.random();

    if (mode < 0.36) {
      y *= 0.25;
    } else if (mode < 0.48) {
      x *= 0.30;
    }

    return {
      x,
      y
    };
  }


  async function moveGaze(
    targetX,
    targetY,
    duration
  ) {

    const eyes =
      getEyeState();

    const startX =
      Number(
        eyes.lookX
      ) || 0;

    const startY =
      Number(
        eyes.lookY
      ) || 0;

    const start =
      performance.now();

    return new Promise(
      function (resolve) {

        let pausedAt = null;
        let pausedDuration = 0;

        function frame(now) {

          if (!state.running) {
            resolve(false);
            return;
          }

          /*
              If a blink starts in the middle of a gaze shift,
              pause the gaze clock. This prevents the pupils from
              drifting sideways behind the closing lids and then
              jumping when they reopen.
          */

          if (
            state.isBlinking
          ) {

            if (
              pausedAt === null
            ) {
              pausedAt =
                now;
            }

            state.gazeFrame =
              requestAnimationFrame(
                frame
              );

            return;
          }

          if (
            pausedAt !== null
          ) {

            pausedDuration +=
              now -
              pausedAt;

            pausedAt =
              null;
          }

          const raw =
            duration <= 0
              ? 1
              : (
                  now -
                  start -
                  pausedDuration
                ) / duration;

          const progress =
            clamp01(raw);

          const eased =
            easeInOutCubic(
              progress
            );

          eyes.lookX =
            startX +
            (
              targetX -
              startX
            ) *
            eased;

          eyes.lookY =
            startY +
            (
              targetY -
              startY
            ) *
            eased;

          drawEyesNow();

          if (
            progress < 1
          ) {
            state.gazeFrame =
              requestAnimationFrame(
                frame
              );
          } else {
            state.gazeFrame = null;
            resolve(true);
          }
        }

        state.gazeFrame =
          requestAnimationFrame(
            frame
          );
      }
    );
  }


  async function doGazeCycle() {

    if (
      state.isBlinking
    ) {
      return;
    }

    if (
      state.settings
        .pauseGazeWhileSpeaking &&
      isSpeaking()
    ) {
      return;
    }

    const target =
      chooseGazeTarget();

    await moveGaze(
      target.x,
      target.y,
      state.settings
        .gazeMoveTime
    );

    if (!state.running) {
      return;
    }

    await wait(
      randomBetween(
        state.settings
          .gazeHoldMin,
        state.settings
          .gazeHoldMax
      )
    );

    if (!state.running) {
      return;
    }

    await moveGaze(
      0,
      0,
      state.settings
        .gazeReturnTime
    );
  }


  function scheduleGaze() {

    if (!state.running) {
      return;
    }

    clearTimeout(
      state.gazeTimer
    );

    state.gazeTimer =
      setTimeout(
        async function () {

          await doGazeCycle();

          scheduleGaze();

        },
        randomBetween(
          state.settings
            .gazeMinDelay,
          state.settings
            .gazeMaxDelay
        )
      );
  }


  function start(options) {

    if (state.running) {
      return;
    }

    state.settings = {
      ...DEFAULTS,
      ...(options || {})
    };

    state.running = true;

    const eyes =
      getEyeState();

    eyes.lookX =
      Number(
        eyes.lookX
      ) || 0;

    eyes.lookY =
      Number(
        eyes.lookY
      ) || 0;

    eyes.blink =
      Number(
        eyes.blink
      ) || 0;

    scheduleBlink();
    scheduleGaze();

    console.log(
      "FaceIdle started"
    );
  }


  function stop() {

    state.running = false;

    clearTimeout(
      state.blinkTimer
    );

    clearTimeout(
      state.gazeTimer
    );

    if (
      state.blinkFrame
    ) {
      cancelAnimationFrame(
        state.blinkFrame
      );
    }

    if (
      state.gazeFrame
    ) {
      cancelAnimationFrame(
        state.gazeFrame
      );
    }

    state.blinkTimer = null;
    state.gazeTimer = null;
    state.blinkFrame = null;
    state.gazeFrame = null;

    const eyes =
      getEyeState();

    eyes.blink = 0;
    eyes.lookX = 0;
    eyes.lookY = 0;

    drawEyesNow();

    console.log(
      "FaceIdle stopped"
    );
  }


  function restart(options) {

    stop();
    start(options);
  }


  window.FaceIdle = {

    version: "1.1",

    start,
    stop,
    restart,

    blink:
      blinkOnce,

    lookCenter:
      function () {
        return moveGaze(
          0,
          0,
          state.settings
            .gazeReturnTime
        );
      },

    isRunning:
      function () {
        return state.running;
      },

    getSettings:
      function () {
        return {
          ...state.settings
        };
      }

  };


  /*
      Start automatically once the page is ready.

      eyes.js must load before this file.
  */

  if (
    document.readyState ===
    "loading"
  ) {
    document.addEventListener(
      "DOMContentLoaded",
      function () {
        start();
      }
    );
  } else {
    start();
  }


  console.log(
    "idle.js V1.1 loaded"
  );

})();
