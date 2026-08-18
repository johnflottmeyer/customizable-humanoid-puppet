/*
==================================================
FACELAB — MOUTH VISEME ANIMATOR
VERSION 1.0
==================================================

Purpose:
- Smoothly transitions between established viseme poses.
- Does NOT modify viseme geometry.
- Uses the existing MouthEngine.setViseme(name, strength) API.
- First transition layer deliberately passes through a very short
  neutral crossover so pose geometry remains isolated and stable.
*/

(function () {

  "use strict";

  const DEFAULT_DURATION = 180;

  let animationFrame = null;
  let animationToken = 0;
  let currentViseme = "neutral";

  function clamp01(value) {
    return Math.max(
      0,
      Math.min(
        1,
        Number(value) || 0
      )
    );
  }

  function normalizeName(name) {

    const key =
      String(name || "neutral")
        .trim()
        .toUpperCase();

    const aliases = {
      NEUTRAL: "neutral",
      REST: "neutral",

      M: "MBP",
      B: "MBP",
      P: "MBP",
      MBP: "MBP",

      E: "EE",
      EE: "EE",
      I: "EE",

      O: "OH",
      OH: "OH",
      OO: "OH",
      U: "OH",

      A: "AH",
      AH: "AH",

      F: "FV",
      V: "FV",
      FV: "FV"
    };

    return aliases[key] || "neutral";
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

  function getEngine() {

    return (
      window.MouthEngine ||
      window.mouthEngine ||
      null
    );
  }

  function drawViseme(
    name,
    strength
  ) {

    const engine =
      getEngine();

    if (
      !engine ||
      typeof engine.setViseme !==
        "function"
    ) {
      return false;
    }

    engine.setViseme(
      name,
      clamp01(strength)
    );

    return true;
  }

  function tween(
    from,
    to,
    duration,
    update,
    token
  ) {

    return new Promise(
      function (resolve) {

        const start =
          performance.now();

        function frame(now) {

          if (
            token !==
            animationToken
          ) {
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

          if (
            progress < 1
          ) {
            animationFrame =
              requestAnimationFrame(
                frame
              );
          } else {
            animationFrame = null;
            resolve(true);
          }
        }

        animationFrame =
          requestAnimationFrame(
            frame
          );
      }
    );
  }

  async function transitionTo(
    name,
    options
  ) {

    const target =
      normalizeName(name);

    const settings =
      options || {};

    const duration =
      Math.max(
        0,
        Number(
          settings.duration
        ) ||
        DEFAULT_DURATION
      );

    const token =
      ++animationToken;

    if (
      animationFrame
    ) {
      cancelAnimationFrame(
        animationFrame
      );

      animationFrame = null;
    }

    /*
        Same pose:
        simply restore it to full strength.
    */

    if (
      target ===
      currentViseme
    ) {

      await tween(
        0,
        1,
        duration,
        function (strength) {
          drawViseme(
            target,
            strength
          );
        },
        token
      );

      return target;
    }

    /*
        Neutral -> pose
    */

    if (
      currentViseme ===
      "neutral"
    ) {

      if (
        target ===
        "neutral"
      ) {
        drawViseme(
          "neutral",
          1
        );

        return target;
      }

      await tween(
        0,
        1,
        duration,
        function (strength) {
          drawViseme(
            target,
            strength
          );
        },
        token
      );

      if (
        token ===
        animationToken
      ) {
        currentViseme =
          target;
      }

      return target;
    }

    /*
        Pose -> neutral
    */

    if (
      target ===
      "neutral"
    ) {

      const completed =
        await tween(
          1,
          0,
          duration,
          function (strength) {
            drawViseme(
              currentViseme,
              strength
            );
          },
          token
        );

      if (
        completed &&
        token ===
        animationToken
      ) {
        drawViseme(
          "neutral",
          1
        );

        currentViseme =
          "neutral";
      }

      return target;
    }

    /*
        Pose -> pose

        First stable implementation:
        45% out of the old pose,
        10% neutral crossover,
        45% into the new pose.

        This prevents hard snapping while keeping
        every established viseme untouched.
    */

    const oldViseme =
      currentViseme;

    const half =
      duration * 0.45;

    const crossedOut =
      await tween(
        1,
        0,
        half,
        function (strength) {
          drawViseme(
            oldViseme,
            strength
          );
        },
        token
      );

    if (
      !crossedOut ||
      token !==
      animationToken
    ) {
      return target;
    }

    drawViseme(
      "neutral",
      1
    );

    await new Promise(
      function (resolve) {
        setTimeout(
          resolve,
          Math.max(
            0,
            duration * 0.10
          )
        );
      }
    );

    if (
      token !==
      animationToken
    ) {
      return target;
    }

    const crossedIn =
      await tween(
        0,
        1,
        half,
        function (strength) {
          drawViseme(
            target,
            strength
          );
        },
        token
      );

    if (
      crossedIn &&
      token ===
      animationToken
    ) {
      currentViseme =
        target;
    }

    return target;
  }

  function stop() {

    animationToken++;

    if (
      animationFrame
    ) {
      cancelAnimationFrame(
        animationFrame
      );

      animationFrame = null;
    }
  }

  async function runTestSequence() {

    const sequence = [
      ["neutral", 260],
      ["EE",      420],
      ["AH",      420],
      ["MBP",     420],
      ["OH",      420],
      ["FV",      420],
      ["neutral", 420]
    ];

    for (
      const [
        viseme,
        hold
      ] of sequence
    ) {

      await transitionTo(
        viseme,
        {
          duration: 190
        }
      );

      await new Promise(
        function (resolve) {
          setTimeout(
            resolve,
            hold
          );
        }
      );
    }
  }

  window.MouthVisemeAnimator = {

    version: "1.0",

    transitionTo:
      transitionTo,

    stop:
      stop,

    runTestSequence:
      runTestSequence,

    getCurrentViseme:
      function () {
        return currentViseme;
      },

    setDuration:
      function (duration) {
        return Math.max(
          0,
          Number(duration) ||
          DEFAULT_DURATION
        );
      }

  };

  console.log(
    "mouthVisemeAnimator.js V1.0 loaded"
  );

})();
