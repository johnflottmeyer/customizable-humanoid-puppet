/*
==================================================
FACELAB — MOUTH VISEME ANIMATOR
VERSION 1.2
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

  let queueToken = 0;
  let queueRunning = false;

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
        Pose -> pose — V1.1

        Direct overlapping transition.

        There is no neutral hold between poses. The old articulation
        fades only partway out, then the destination pose takes over
        from that partially articulated state.
    */

    const oldViseme =
      currentViseme;

    const firstHalf =
      duration * 0.50;

    const secondHalf =
      duration * 0.50;

    const crossedOut =
      await tween(
        1,
        0.38,
        firstHalf,
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

    const crossedIn =
      await tween(
        0.38,
        1,
        secondHalf,
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

  function wait(
    milliseconds,
    token
  ) {
    return new Promise(
      function (resolve) {

        const duration =
          Math.max(
            0,
            Number(milliseconds) || 0
          );

        if (duration === 0) {
          resolve(
            token === queueToken
          );
          return;
        }

        setTimeout(
          function () {
            resolve(
              token === queueToken
            );
          },
          duration
        );
      }
    );
  }


  function normalizeQueueItem(
    item
  ) {

    if (
      typeof item === "string"
    ) {
      return {
        viseme:
          normalizeName(item),
        duration:
          DEFAULT_DURATION,
        hold:
          0
      };
    }

    const source =
      item || {};

    return {
      viseme:
        normalizeName(
          source.viseme ||
          source.name ||
          "neutral"
        ),

      duration:
        Math.max(
          0,
          Number(
            source.duration
          ) ||
          DEFAULT_DURATION
        ),

      hold:
        Math.max(
          0,
          Number(
            source.hold
          ) ||
          0
        )
    };
  }


  async function playQueue(
    sequence,
    options
  ) {

    if (
      !Array.isArray(sequence) ||
      sequence.length === 0
    ) {
      return false;
    }

    const settings =
      options || {};

    const token =
      ++queueToken;

    queueRunning = true;

    if (
      settings.startNeutral !== false
    ) {
      await transitionTo(
        "neutral",
        {
          duration:
            Math.max(
              0,
              Number(
                settings.neutralDuration
              ) ||
              120
            )
        }
      );
    }

    for (
      const rawItem of sequence
    ) {

      if (
        token !== queueToken
      ) {
        queueRunning = false;
        return false;
      }

      const item =
        normalizeQueueItem(
          rawItem
        );

      await transitionTo(
        item.viseme,
        {
          duration:
            item.duration
        }
      );

      if (
        token !== queueToken
      ) {
        queueRunning = false;
        return false;
      }

      if (
        item.hold > 0
      ) {
        const completed =
          await wait(
            item.hold,
            token
          );

        if (!completed) {
          queueRunning = false;
          return false;
        }
      }
    }

    if (
      settings.endNeutral !== false &&
      token === queueToken
    ) {
      await transitionTo(
        "neutral",
        {
          duration:
            Math.max(
              0,
              Number(
                settings.neutralDuration
              ) ||
              120
            )
        }
      );
    }

    if (
      token === queueToken
    ) {
      queueRunning = false;
      return true;
    }

    queueRunning = false;
    return false;
  }


  function stopQueue() {

    queueToken++;
    queueRunning = false;

    stop();
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

    version: "1.2",

    transitionTo:
      transitionTo,

    stop:
      stop,

    runTestSequence:
      runTestSequence,

    playQueue:
      playQueue,

    stopQueue:
      stopQueue,

    isQueueRunning:
      function () {
        return queueRunning;
      },

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
    "mouthVisemeAnimator.js V1.2 loaded"
  );

})();
