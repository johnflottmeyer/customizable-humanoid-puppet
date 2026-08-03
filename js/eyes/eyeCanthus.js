/* =========================================================
   FACELAB EYE CANTHUS
   Version 1.1.0

   PURPOSE

   Builds integrated medial and lateral canthi.

   Version 1.1 removes the pointed triangular inner corner
   and replaces it with:

   - rounded caruncle
   - soft plica fold
   - separate upper/lower lid joins
   - single-point lateral canthus

   LOAD BEFORE:
   js/eyes/eyeAssembly.js
========================================================= */

(function initializeEyeCanthus() {
  "use strict";

  function number(value, fallback) {
    const resolved = Number(value);
    return Number.isFinite(resolved) ? resolved : fallback;
  }

  function clamp(value, minimum, maximum) {
    return Math.max(minimum, Math.min(maximum, value));
  }

  function point(x, y) {
    return {
      x: number(x, 0),
      y: number(y, 0),
    };
  }

  function copyPoint(source) {
    return source
      ? point(source.x, source.y)
      : point(0, 0);
  }

  function addPoints(first, second) {
    return point(
      first.x + second.x,
      first.y + second.y,
    );
  }

  function scalePoint(source, amount) {
    return point(
      source.x * amount,
      source.y * amount,
    );
  }

  function mixPoints(first, second, amount) {
    return point(
      first.x + (second.x - first.x) * amount,
      first.y + (second.y - first.y) * amount,
    );
  }

  function buildMedial(
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

    const inner = copyPoint(
      axisModel.innerCanthus,
    );

    const nasalDirection = scalePoint(
      axisModel.axis,
      -1,
    );

    /*
        The upper and lower lids stop at separate attachment
        points so the medial corner has real vertical volume.
    */

    const upperJoin = addPoints(
      inner,
      addPoints(
        scalePoint(
          axisModel.axis,
          width * settings.joinInsetScale,
        ),
        scalePoint(
          axisModel.upperNormal,
          width * settings.upperJoinLiftScale,
        ),
      ),
    );

    const lowerJoin = addPoints(
      inner,
      addPoints(
        scalePoint(
          axisModel.axis,
          width * settings.joinInsetScale,
        ),
        scalePoint(
          axisModel.lowerNormal,
          width * settings.lowerJoinDropScale,
        ),
      ),
    );

    const caruncleLength = clamp(
      width * settings.caruncleLengthScale,
      3.3,
      5.8,
    );

    const caruncleHeight = clamp(
      width * settings.caruncleHeightScale,
      2.1,
      3.8,
    );

    /*
        Caruncle center sits just nasal to the canthus but
        remains between the lid joins instead of floating
        outside the eye.
    */

    const center = addPoints(
      inner,
      addPoints(
        scalePoint(
          nasalDirection,
          caruncleLength * 0.20,
        ),
        scalePoint(
          axisModel.lowerNormal,
          caruncleHeight * 0.06,
        ),
      ),
    );

    const nasalRound = addPoints(
      center,
      scalePoint(
        nasalDirection,
        caruncleLength * 0.55,
      ),
    );

    const temporalRound = addPoints(
      center,
      scalePoint(
        axisModel.axis,
        caruncleLength * 0.48,
      ),
    );

    const upperRound = addPoints(
      center,
      scalePoint(
        axisModel.upperNormal,
        caruncleHeight * 0.58,
      ),
    );

    const lowerRound = addPoints(
      center,
      scalePoint(
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
        mixPoints(upperJoin, upperRound, 0.50).x
      } ${
        mixPoints(upperJoin, upperRound, 0.50).y
      }`,

      `${
        mixPoints(upperRound, nasalRound, 0.48).x
      } ${
        mixPoints(upperRound, nasalRound, 0.48).y
      }`,

      `${nasalRound.x} ${nasalRound.y}`,

      `C ${
        mixPoints(nasalRound, lowerRound, 0.48).x
      } ${
        mixPoints(nasalRound, lowerRound, 0.48).y
      }`,

      `${
        mixPoints(lowerRound, lowerJoin, 0.50).x
      } ${
        mixPoints(lowerRound, lowerJoin, 0.50).y
      }`,

      `${lowerJoin.x} ${lowerJoin.y}`,

      `C ${
        mixPoints(lowerJoin, temporalRound, 0.52).x
      } ${
        mixPoints(lowerJoin, temporalRound, 0.52).y
      }`,

      `${
        mixPoints(temporalRound, upperJoin, 0.52).x
      } ${
        mixPoints(temporalRound, upperJoin, 0.52).y
      }`,

      `${upperJoin.x} ${upperJoin.y}`,

      "Z",
    ].join(" ");

    /*
        Small soft crescent between the caruncle and sclera.
        It no longer forms a pointed triangle.
    */

    const plicaLength = clamp(
      width * settings.plicaLengthScale,
      1.7,
      3.2,
    );

    const plicaHeight = clamp(
      width * settings.plicaHeightScale,
      1.0,
      2.0,
    );

    const plicaCenter = addPoints(
      temporalRound,
      scalePoint(
        axisModel.axis,
        plicaLength * 0.22,
      ),
    );

    const plicaUpper = addPoints(
      plicaCenter,
      scalePoint(
        axisModel.upperNormal,
        plicaHeight,
      ),
    );

    const plicaLower = addPoints(
      plicaCenter,
      scalePoint(
        axisModel.lowerNormal,
        plicaHeight,
      ),
    );

    const plicaOuter = addPoints(
      plicaCenter,
      scalePoint(
        axisModel.axis,
        plicaLength,
      ),
    );

    const plicaPath = [
      `M ${plicaUpper.x} ${plicaUpper.y}`,

      `C ${
        mixPoints(plicaUpper, plicaOuter, 0.58).x
      } ${
        mixPoints(plicaUpper, plicaOuter, 0.58).y
      }`,

      `${
        mixPoints(plicaOuter, plicaLower, 0.58).x
      } ${
        mixPoints(plicaOuter, plicaLower, 0.58).y
      }`,

      `${plicaLower.x} ${plicaLower.y}`,

      `Q ${plicaCenter.x} ${plicaCenter.y}`,

      `${plicaUpper.x} ${plicaUpper.y}`,

      "Z",
    ].join(" ");

    return {
      type: "medialCanthus",
      version: "1.1.0",

      point: inner,

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

  function buildLateral(
    axisModel,
    upperLid,
    lowerLid,
  ) {
    const sharedPoint = copyPoint(
      axisModel.outerCanthus,
    );

    return {
      type: "lateralCanthus",
      version: "1.1.0",

      point: sharedPoint,

      upperJoin: copyPoint(sharedPoint),
      lowerJoin: copyPoint(sharedPoint),

      path: "",
    };
  }

  function build(
    axisModel,
    upperLid,
    lowerLid,
    options,
  ) {
    if (!axisModel || !upperLid || !lowerLid) {
      throw new Error(
        "EyeCanthus.build requires axisModel, upperLid and lowerLid.",
      );
    }

    return {
      medial: buildMedial(
        axisModel,
        upperLid,
        lowerLid,
        options && options.medial,
      ),

      lateral: buildLateral(
        axisModel,
        upperLid,
        lowerLid,
      ),
    };
  }

  window.EyeCanthus = {
    version: "1.1.0",

    build: build,
    buildMedial: buildMedial,
    buildLateral: buildLateral,
  };

  console.log("EyeCanthus 1.1 loaded");
})();
