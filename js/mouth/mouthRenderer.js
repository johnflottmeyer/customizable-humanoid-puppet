/* ==========================
   MOUTH RENDERER — VERSION 5.1

   Responsibilities:

   - Locate the face SVG
   - Create the mouth SVG group
   - Clear previous mouth rendering
   - Render completed geometry paths
   - Create subtle lip surface gradients
   - Render a softer mouth seam

   This file performs no mouth geometry.
========================== */

(function () {
  "use strict";

  const SVG_NAMESPACE = "http://www.w3.org/2000/svg";

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

  function hexToRgb(hex) {
    const value = String(hex || "").replace("#", "");

    if (!/^[0-9a-fA-F]{6}$/.test(value)) {
      return null;
    }

    return {
      r: parseInt(value.slice(0, 2), 16),
      g: parseInt(value.slice(2, 4), 16),
      b: parseInt(value.slice(4, 6), 16),
    };
  }

  function rgbToHex(rgb) {
    function part(value) {
      return Math.round(clamp(value, 0, 255))
        .toString(16)
        .padStart(2, "0");
    }

    return "#" + part(rgb.r) + part(rgb.g) + part(rgb.b);
  }

  function mixColors(first, second, amount) {
    const firstRgb = hexToRgb(first);
    const secondRgb = hexToRgb(second);

    if (!firstRgb || !secondRgb) {
      return first || second || "#000000";
    }

    const blend = clamp(safeNumber(amount, 0.5), 0, 1);

    return rgbToHex({
      r: firstRgb.r + (secondRgb.r - firstRgb.r) * blend,
      g: firstRgb.g + (secondRgb.g - firstRgb.g) * blend,
      b: firstRgb.b + (secondRgb.b - firstRgb.b) * blend,
    });
  }

  /* ==========================
       SVG LOCATION
    ========================== */

  function getFaceSvg() {
    return (
      document.getElementById("faceSvg") ||
      document.getElementById("face") ||
      document.querySelector("svg")
    );
  }

  function getMouthGroup() {
    const svg = getFaceSvg();

    if (!svg) {
      console.warn("MouthRenderer could not find the face SVG.");
      return null;
    }

    let group = document.getElementById("mouthEngineGroup");

    if (!group) {
      group = document.createElementNS(SVG_NAMESPACE, "g");
      group.setAttribute("id", "mouthEngineGroup");
    }

    svg.appendChild(group);

    return group;
  }

  /* ==========================
       ELEMENT HELPERS
    ========================== */

  function clearElement(element) {
    if (!element) {
      return;
    }

    while (element.firstChild) {
      element.removeChild(element.firstChild);
    }
  }

  function createSvgElement(name, attributes) {
    const element = document.createElementNS(SVG_NAMESPACE, name);

    Object.entries(attributes || {}).forEach(function (entry) {
      const key = entry[0];
      const value = entry[1];

      if (value !== undefined && value !== null) {
        element.setAttribute(key, value);
      }
    });

    return element;
  }

  function createPath(pathData, options) {
    const settings = options || {};

    return createSvgElement("path", {
      d: pathData || "",
      fill: settings.fill || "none",
      stroke: settings.stroke || "none",
      "stroke-width": safeNumber(settings.strokeWidth, 1),
      "stroke-linecap": settings.lineCap || "round",
      "stroke-linejoin": settings.lineJoin || "round",
      opacity: settings.opacity === undefined ? 1 : settings.opacity,
      id: settings.id || null,
      class: settings.className || null,
    });
  }


  /* ==========================
       GEOMETRY HELPERS
    ========================== */

  function validPoint(point) {
    return Boolean(
      point &&
      Number.isFinite(Number(point.x)) &&
      Number.isFinite(Number(point.y))
    );
  }

  function findSampleAtT(samples, targetT) {
    if (!Array.isArray(samples) || samples.length === 0) {
      return null;
    }

    let nearest = samples[0];
    let nearestDistance = Math.abs(
      safeNumber(nearest.t, 0) - targetT
    );

    samples.forEach(function (sample) {
      const distance = Math.abs(
        safeNumber(sample.t, 0) - targetT
      );

      if (distance < nearestDistance) {
        nearest = sample;
        nearestDistance = distance;
      }
    });

    return nearest;
  }

  function geometryBounds(points) {
    const valid = (points || []).filter(validPoint);

    if (!valid.length) {
      return null;
    }

    let minX = valid[0].x;
    let maxX = valid[0].x;
    let minY = valid[0].y;
    let maxY = valid[0].y;

    valid.forEach(function (point) {
      minX = Math.min(minX, point.x);
      maxX = Math.max(maxX, point.x);
      minY = Math.min(minY, point.y);
      maxY = Math.max(maxY, point.y);
    });

    return {
      minX: minX,
      maxX: maxX,
      minY: minY,
      maxY: maxY,
      width: Math.max(0.001, maxX - minX),
      height: Math.max(0.001, maxY - minY),
    };
  }

  function percentWithin(value, minimum, span) {
    return (
      clamp(
        ((value - minimum) / Math.max(span, 0.001)) * 100,
        0,
        100
      ) + "%"
    );
  }


  /* ==========================
       DEFS / GRADIENTS
    ========================== */

  function getOrCreateDefs(svg) {
    let defs = svg.querySelector("#mouthRendererDefs");

    if (!defs) {
      defs = createSvgElement("defs", {
        id: "mouthRendererDefs",
      });

      svg.insertBefore(defs, svg.firstChild);
    }

    clearElement(defs);

    return defs;
  }

  function appendStop(gradient, offset, color, opacity) {
    gradient.appendChild(
      createSvgElement("stop", {
        offset: offset,
        "stop-color": color,
        "stop-opacity": opacity,
      }),
    );
  }

  function createUpperLipGradient(defs, settings) {
    const base = settings.upperLipColor || "#b85f68";

    const highlight =
      settings.upperLipHighlight ||
      mixColors(base, "#ffffff", 0.22);

    const shadow =
      settings.upperLipShadow ||
      mixColors(base, "#000000", 0.22);

    const highlightStrength =
      clamp(safeNumber(settings.lipHighlightStrength, 0.34), 0, 1);

    const shadowStrength =
      clamp(safeNumber(settings.lipShadowStrength, 0.28), 0, 1);

    const gradient = createSvgElement("linearGradient", {
      id: "upperLipSurfaceGradient",
      x1: "0%",
      y1: "0%",
      x2: "0%",
      y2: "100%",
    });

    appendStop(
      gradient,
      "0%",
      mixColors(base, highlight, highlightStrength),
      1,
    );

    appendStop(
      gradient,
      "48%",
      base,
      1,
    );

    appendStop(
      gradient,
      "100%",
      mixColors(base, shadow, shadowStrength),
      1,
    );

    defs.appendChild(gradient);

    return "url(#upperLipSurfaceGradient)";
  }

  function createLowerLipGradient(defs, settings) {
    const base = settings.lowerLipColor || "#ca7880";

    const highlight =
      settings.lowerLipHighlight ||
      mixColors(base, "#ffffff", 0.25);

    const shadow =
      settings.lowerLipShadow ||
      mixColors(base, "#000000", 0.18);

    const highlightStrength =
      clamp(safeNumber(settings.lipHighlightStrength, 0.34), 0, 1);

    const shadowStrength =
      clamp(safeNumber(settings.lipShadowStrength, 0.28), 0, 1);

    const gradient = createSvgElement("linearGradient", {
      id: "lowerLipSurfaceGradient",
      x1: "0%",
      y1: "0%",
      x2: "0%",
      y2: "100%",
    });

    appendStop(
      gradient,
      "0%",
      mixColors(base, shadow, shadowStrength * 0.55),
      1,
    );

    appendStop(
      gradient,
      "52%",
      base,
      1,
    );

    appendStop(
      gradient,
      "100%",
      mixColors(base, highlight, highlightStrength),
      1,
    );

    defs.appendChild(gradient);

    return "url(#lowerLipSurfaceGradient)";
  }

  function createTongueGradient(
    defs,
    settings
  ) {
    const front =
      settings.tongueFrontColor ||
      "#6d3039";

    const back =
      settings.tongueBackColor ||
      "#5b2a31";

    const shadowStrength =
      clamp(
        safeNumber(
          settings.tongueShadowStrength,
          0.42
        ),
        0,
        1
      );

    const gradient =
      createSvgElement(
        "linearGradient",
        {
          id: "tongueSurfaceGradient",
          x1: "0%",
          y1: "0%",
          x2: "0%",
          y2: "100%",
        }
      );

    appendStop(
      gradient,
      "0%",
      mixColors(
        front,
        "#2d1116",
        shadowStrength * 0.72
      ),
      1
    );

    appendStop(
      gradient,
      "38%",
      front,
      1
    );

    appendStop(
      gradient,
      "100%",
      back,
      1
    );

    defs.appendChild(
      gradient
    );

    return "url(#tongueSurfaceGradient)";
  }


  function createEeTeethGradient(
    defs,
    settings
  ) {
    const toothColor =
      settings.teethColor ||
      "#eee7dc";

    const gradient =
      createSvgElement(
        "linearGradient",
        {
          id:
            "eeTeethHorizontalGradient",
          x1: "0%",
          y1: "0%",
          x2: "100%",
          y2: "0%"
        }
      );

    appendStop(
      gradient,
      "0%",
      toothColor,
      0.62
    );

    appendStop(
      gradient,
      "16%",
      toothColor,
      0.92
    );

    appendStop(
      gradient,
      "50%",
      toothColor,
      1
    );

    appendStop(
      gradient,
      "84%",
      toothColor,
      0.92
    );

    appendStop(
      gradient,
      "100%",
      toothColor,
      0.62
    );

    defs.appendChild(
      gradient
    );

    return "url(#eeTeethHorizontalGradient)";
  }


  function createGeometryRadialGradient(
    defs,
    id,
    centerX,
    centerY,
    radiusX,
    radiusY,
    base,
    highlight,
    shadow,
    highlightStrength,
    edgeStrength
  ) {
    const gradient =
      createSvgElement("radialGradient", {
        id: id,
        gradientUnits: "objectBoundingBox",
        cx: centerX,
        cy: centerY,
        r: radiusX,
        fx: centerX,
        fy: centerY,
      });

    appendStop(
      gradient,
      "0%",
      mixColors(
        base,
        highlight,
        clamp(highlightStrength, 0, 1)
      ),
      0.78
    );

    appendStop(
      gradient,
      "52%",
      base,
      0.20
    );

    appendStop(
      gradient,
      "100%",
      mixColors(
        base,
        shadow,
        clamp(edgeStrength, 0, 1)
      ),
      0.56
    );

    defs.appendChild(gradient);

    return "url(#" + id + ")";
  }


  function prepareSurfacePaint(geometry, settings) {
    const svg = getFaceSvg();

    if (!svg) {
      return {
        upperFill: settings.upperLipColor,
        lowerFill: settings.lowerLipColor,
        upperLeftLobeFill: "none",
        upperRightLobeFill: "none",
        lowerCenterFill: "none",
      };
    }

    const defs = getOrCreateDefs(svg);

    const upperBase =
      settings.upperLipColor || "#b85f68";

    const lowerBase =
      settings.lowerLipColor || "#ca7880";

    const upperHighlight =
      settings.upperLipHighlight ||
      mixColors(upperBase, "#ffffff", 0.22);

    const upperShadow =
      settings.upperLipShadow ||
      mixColors(upperBase, "#000000", 0.22);

    const lowerHighlight =
      settings.lowerLipHighlight ||
      mixColors(lowerBase, "#ffffff", 0.25);

    const lowerShadow =
      settings.lowerLipShadow ||
      mixColors(lowerBase, "#000000", 0.18);

    const upperBounds =
      geometryBounds(geometry.upperPoints);

    const lowerBounds =
      geometryBounds(geometry.lowerPoints);

    const samples =
      Array.isArray(geometry.anatomySamples)
        ? geometry.anatomySamples
        : [];

    const leftLobeSample =
      findSampleAtT(samples, 0.36);

    const rightLobeSample =
      findSampleAtT(samples, 0.64);

    const lowerCenterSample =
      findSampleAtT(samples, 0.50);

    let upperLeftLobeFill = "none";
    let upperRightLobeFill = "none";
    let lowerCenterFill = "none";

    if (
      upperBounds &&
      leftLobeSample &&
      validPoint(leftLobeSample.upperBorder)
    ) {
      upperLeftLobeFill =
        createGeometryRadialGradient(
          defs,
          "upperLipLeftLobeGradient",
          percentWithin(
            leftLobeSample.upperBorder.x,
            upperBounds.minX,
            upperBounds.width
          ),
          percentWithin(
            leftLobeSample.upperBorder.y,
            upperBounds.minY,
            upperBounds.height
          ),
          "34%",
          "54%",
          upperBase,
          upperHighlight,
          upperShadow,
          safeNumber(
            settings.upperLobeHighlightStrength,
            0.18
          ),
          safeNumber(
            settings.lipEdgeDepthStrength,
            0.12
          )
        );
    }

    if (
      upperBounds &&
      rightLobeSample &&
      validPoint(rightLobeSample.upperBorder)
    ) {
      upperRightLobeFill =
        createGeometryRadialGradient(
          defs,
          "upperLipRightLobeGradient",
          percentWithin(
            rightLobeSample.upperBorder.x,
            upperBounds.minX,
            upperBounds.width
          ),
          percentWithin(
            rightLobeSample.upperBorder.y,
            upperBounds.minY,
            upperBounds.height
          ),
          "34%",
          "54%",
          upperBase,
          upperHighlight,
          upperShadow,
          safeNumber(
            settings.upperLobeHighlightStrength,
            0.18
          ),
          safeNumber(
            settings.lipEdgeDepthStrength,
            0.12
          )
        );
    }

    if (
      lowerBounds &&
      lowerCenterSample &&
      validPoint(lowerCenterSample.lowerBorder)
    ) {
      lowerCenterFill =
        createGeometryRadialGradient(
          defs,
          "lowerLipCenterGradient",
          percentWithin(
            lowerCenterSample.lowerBorder.x,
            lowerBounds.minX,
            lowerBounds.width
          ),
          percentWithin(
            lowerCenterSample.lowerBorder.y,
            lowerBounds.minY,
            lowerBounds.height
          ),
          "46%",
          "64%",
          lowerBase,
          lowerHighlight,
          lowerShadow,
          safeNumber(
            settings.lowerCenterHighlightStrength,
            0.20
          ),
          safeNumber(
            settings.lipEdgeDepthStrength,
            0.12
          )
        );
    }

    return {
      eeTeethFill:
        createEeTeethGradient(
          defs,
          settings
        ),

      tongueFill:
        createTongueGradient(
          defs,
          settings
        ),

      upperFill:
        createUpperLipGradient(
          defs,
          settings
        ),

      lowerFill:
        createLowerLipGradient(
          defs,
          settings
        ),

      upperLeftLobeFill:
        upperLeftLobeFill,

      upperRightLobeFill:
        upperRightLobeFill,

      lowerCenterFill:
        lowerCenterFill,
    };
  }



  /* ==========================
       MOUTH ARTICULATION
    ========================== */

  function getOpenAmount(settings) {
    return clamp(
      safeNumber(settings.mouthOpen, 0),
      0,
      1
    );
  }

  function getOpenOffsets(settings) {
    const amount =
      getOpenAmount(settings);

    const baseDistance =
      Math.max(
        0,
        safeNumber(
          settings.mouthOpenDistance,
          22
        )
      );

    /*
        Nonlinear opening progression.

        At 0.5 the boost is intentionally small,
        preserving a useful conversational opening.

        Near 1.0 the cubic term contributes much
        more vertical travel, allowing wide-open
        visemes to become rounder without making
        every talking frame look exaggerated.
    */

    const fullOpenBoost =
      Math.max(
        0,
        safeNumber(
          settings.fullOpenBoost,
          0.72
        )
      );

    const boostedAmount =
      amount +
      fullOpenBoost *
      Math.pow(amount, 3);

    const distance =
      baseDistance *
      boostedAmount;

    const upperShare =
      clamp(
        safeNumber(
          settings.upperOpenShare,
          0.30
        ),
        0,
        1
      );

    const lowerShare =
      clamp(
        safeNumber(
          settings.lowerOpenShare,
          0.70
        ),
        0,
        1
      );

    return {
      amount: amount,
      upperY: -(distance * upperShare),
      lowerY: distance * lowerShare,
      gap: distance * (upperShare + lowerShare),
    };
  }

  function createTranslatedGroup(id, translateY) {
    return createSvgElement("g", {
      id: id,
      transform:
        "translate(0 " +
        safeNumber(translateY, 0) +
        ")",
    });
  }

  function buildInnerMouthPath(
    geometry,
    offsets
  ) {
    if (
      !geometry ||
      !geometry.seamPath ||
      offsets.amount <= 0.001
    ) {
      return "";
    }

    /*
        Use the current seam twice:
        upper inner edge follows the upper lip,
        lower inner edge follows the lower lip.

        This is intentionally derived from the
        live seam geometry so it remains compatible
        with later speech/expression deformation.
    */

    return null;
  }


  /* ==========================
       DRAW LIP SHAPES
    ========================== */

  function pointsToClosedPath(points) {
    const valid =
      (points || []).filter(validPoint);

    if (valid.length < 2) {
      return "";
    }

    let path =
      "M " +
      valid[0].x +
      " " +
      valid[0].y;

    for (
      let index = 1;
      index < valid.length;
      index += 1
    ) {
      path +=
        " L " +
        valid[index].x +
        " " +
        valid[index].y;
    }

    path += " Z";

    return path;
  }

  function buildArticulatedLipPaths(
    geometry,
    settings
  ) {
    const offsets =
      getOpenOffsets(settings);


    const lipPucker =
      clamp(
        safeNumber(
          settings.lipPucker,
          0
        ),
        -1,
        1
      );


    const cornerPull =
      clamp(
        safeNumber(
          settings.cornerPull,
          0
        ),
        -1,
        1
      );


    const lowerLipRaise =
      clamp(
        safeNumber(
          settings.lowerLipRaise,
          0
        ),
        0,
        1
      );


    const upperLipRaise =
      clamp(
        safeNumber(
          settings.upperLipRaise,
          0
        ),
        -1,
        1
      );


    const lipCompression =
      clamp(
        safeNumber(
          settings.lipCompression,
          0
        ),
        0,
        1
      );


    const ohRoundnessBoost =
      clamp(
        safeNumber(
          settings.ohRoundnessBoost,
          0
        ),
        0,
        1
      );


    const fvContactStrength =
      clamp(
        safeNumber(
          settings.fvContactStrength,
          0
        ),
        0,
        1
      );


    const eeCornerStretch =
      clamp(
        safeNumber(
          settings.eeCornerStretch,
          0
        ),
        0,
        1
      );


    const lipPress =
      clamp(
        safeNumber(
          settings.lipPress,
          0
        ),
        0,
        1
      );


    const lowerLipToTeeth =
      clamp(
        safeNumber(
          settings.lowerLipToTeeth,
          0
        ),
        0,
        1
      );


    const upperTeethReveal =
      clamp(
        safeNumber(
          settings.upperTeethReveal,
          settings.showTeeth === false ? 0 : 1
        ),
        0,
        1
      );


    const lowerTeethReveal =
      clamp(
        safeNumber(
          settings.lowerTeethReveal,
          0
        ),
        0,
        1
      );


    const samples =
      Array.isArray(geometry.anatomySamples)
        ? geometry.anatomySamples
        : [];

    if (
      offsets.amount <= 0.001 ||
      samples.length < 2
    ) {
      return {
        upperPath: geometry.upperPath,
        lowerPath: geometry.lowerPath,
        cavityPath: "",
      };
    }

    const upperOuter = [];
    const upperInner = [];
    const lowerInner = [];
    const lowerOuter = [];

    /*
        V1.8

        As the mouth opens, the overall mouth width
        contracts slightly.

        This removes the "wide sideways flap" look
        and gives wide-open shapes a more vertical,
        natural oval.

        Compression is nonlinear so normal talking
        openings remain close to the neutral width.
    */

    const leftCorner =
      samples[0] &&
      samples[0].seamPoint;

    const rightCorner =
      samples[samples.length - 1] &&
      samples[samples.length - 1].seamPoint;

    const mouthCenterX =
      (
        validPoint(leftCorner) &&
        validPoint(rightCorner)
      )
        ? (
            leftCorner.x +
            rightCorner.x
          ) / 2
        : safeNumber(
            settings.centerX,
            250
          );

    const widthCompression =
      clamp(
        safeNumber(
          settings.openWidthCompression,
          0.20
        ),
        0,
        0.45
      );

    const widthPower =
      Math.max(
        0.5,
        safeNumber(
          settings.openWidthPower,
          1.8
        )
      );

    const openCompression =
      widthCompression *
      Math.pow(
        offsets.amount,
        widthPower
      );

    /*
        Inner cavity receives the full width
        compression.

        Outer lip contour receives only a fraction
        of that compression so the lips do not
        purse into an O while the cavity narrows.
    */

    const innerWidthScale =
      1 -
      openCompression;

    const outerCompressionShare =
      clamp(
        safeNumber(
          settings.outerLipCompressionShare,
          0.35
        ),
        0,
        1
      );

    const outerWidthScale =
      1 -
      openCompression *
      outerCompressionShare;


    function compressInnerX(x) {
      return (
        mouthCenterX +
        (
          x -
          mouthCenterX
        ) *
        innerWidthScale
      );
    }


    function compressOuterX(x) {
      return (
        mouthCenterX +
        (
          x -
          mouthCenterX
        ) *
        outerWidthScale
      );
    }

    samples.forEach(function (sample) {
      if (
        !validPoint(sample.seamPoint) ||
        !validPoint(sample.upperBorder) ||
        !validPoint(sample.lowerBorder)
      ) {
        return;
      }

      const t =
        clamp(
          safeNumber(sample.t, 0),
          0,
          1
        );

      /*
          The sine envelope is zero at both mouth
          corners and one at the center.

          Therefore the lips remain physically
          connected at the ends while the middle
          bows apart into an oval.
      */

      const envelope =
        Math.sin(Math.PI * t);

      /*
          Slightly rounder envelope at larger
          openings. This prevents the cavity from
          reading as two straight translated flaps.
      */

      const roundness =
        clamp(
          safeNumber(
            settings.openRoundness,
            1.35
          ),
          0.6,
          2.4
        );

      /*
          Lower exponent = broader vertical bow.
          As mouthOpen increases, the inner edges
          become rounder through more of the width
          while still returning exactly to the
          anchored corners.
      */

      const envelopeExponent =
        1 /
        (
          1 +
          offsets.amount *
          0.55 *
          roundness
        );

      const shapedEnvelope =
        Math.pow(
          envelope,
          envelopeExponent
        );

      /*
          V2.9 VISEME DEFORMATION

          centerWeight:
              strongest around the center lip body

          cornerWeight:
              strongest toward both corners
      */

      const centerWeight =
        Math.pow(
          envelope,
          1.15
        );


      const cornerWeight =
        1 -
        centerWeight;


      /*
          Pucker brings the outer thirds inward.

          Negative pucker does the opposite and
          helps EE flatten/widen.
      */

      const puckerScale =
        1 -
        lipPucker *
        (
          0.18 +
          ohRoundnessBoost *
          0.10
        ) *
        centerWeight;


      /*
          Corner pull acts mostly on the outer
          thirds.

          Positive = EE style lateral pull
          Negative = OH/OO corner contraction
      */

      const cornerOffsetX =
        cornerPull *
        13 *
        cornerWeight;


      const eeStretchPixels =
        eeCornerStretch *
        6.5 *
        cornerWeight;


      const sideSign =
        t < 0.5
          ? -1
          : 1;


      const deformedSeamX =
        mouthCenterX +
        (
          sample.seamPoint.x -
          mouthCenterX
        ) *
        puckerScale +
        sideSign *
        (
          cornerOffsetX +
          eeStretchPixels
        );


      const deformedUpperX =
        mouthCenterX +
        (
          sample.upperBorder.x -
          mouthCenterX
        ) *
        puckerScale +
        sideSign *
        (
          cornerOffsetX +
          eeStretchPixels
        );


      const deformedLowerX =
        mouthCenterX +
        (
          sample.lowerBorder.x -
          mouthCenterX
        ) *
        puckerScale +
        sideSign *
        (
          cornerOffsetX +
          eeStretchPixels
        );


      /*
          Compression closes the inner lip edges
          toward one another.

          It is strongest through the center and
          fades at the corners.
      */

      const compressionPixels =
        lipCompression *
        5.5 *
        centerWeight;


      const upperRaisePixels =
        upperLipRaise *
        4.5 *
        centerWeight;


      const lowerRaisePixels =
        lowerLipRaise *
        7.5 *
        centerWeight;


      const ohVerticalBoost =
        ohRoundnessBoost *
        5.5 *
        centerWeight;


      const fvContactLift =
        fvContactStrength *
        6.0 *
        centerWeight;


      /*
          M/B/P lip press:
          press both inner edges into one shared
          contact line while allowing the outer
          lip bodies to retain fullness.
      */

      const lipPressPixels =
        lipPress *
        3.0 *
        centerWeight;


      /*
          F/V contact:
          lower inner lip rises toward the lower
          edge of the upper teeth instead of merely
          collapsing upward into the upper lip.
      */

      const lowerLipTeethLift =
        lowerLipToTeeth *
        4.8 *
        centerWeight;


      const upperShift =
        offsets.upperY *
        shapedEnvelope +
        compressionPixels -
        upperRaisePixels -
        ohVerticalBoost +
        lipPressPixels;


      const lowerShift =
        offsets.lowerY *
        shapedEnvelope -
        compressionPixels -
        lowerRaisePixels +
        ohVerticalBoost -
        fvContactLift -
        lipPressPixels -
        lowerLipTeethLift;

      /*
          Lip tissue stretches as the mouth opens.
          Compress only the OUTER border relative
          to the articulated inner edge. This keeps
          the opening dominant instead of making
          the lips look like thick hinged flaps.
      */

      const compression =
        clamp(
          safeNumber(
            settings.openLipCompression,
            0.18
          ) *
          offsets.amount *
          shapedEnvelope,
          0,
          0.45
        );

      const upperThicknessY =
        sample.upperBorder.y -
        sample.seamPoint.y;

      const lowerThicknessY =
        sample.lowerBorder.y -
        sample.seamPoint.y;

      upperInner.push({
        x: compressInnerX(deformedSeamX),
        y:
          sample.seamPoint.y +
          upperShift,
      });

      lowerInner.push({
        x: compressInnerX(deformedSeamX),
        y:
          sample.seamPoint.y +
          lowerShift,
      });

      upperOuter.push({
        x: compressOuterX(deformedUpperX),
        y:
          sample.seamPoint.y +
          upperShift +
          upperThicknessY *
          (1 - compression),
      });

      lowerOuter.push({
        x: compressOuterX(deformedLowerX),
        y:
          sample.seamPoint.y +
          lowerShift +
          fvContactLift * 0.82 +
          lowerLipTeethLift * 0.72 +
          lowerThicknessY *
          (1 - compression),
      });
    });

    /*
        ROUND OPEN CORNERS

        The articulated outer and inner paths can
        otherwise meet at a sharp point because the
        cavity and lip surface use different width
        scales.

        Blend the final samples toward a shared
        corner center. This keeps the lips connected
        while creating a softer tissue transition.
    */

    const cornerRoundness =
      clamp(
        safeNumber(
          settings.openCornerRoundness,
          0.72
        ),
        0,
        1
      ) *
      offsets.amount;

    function softenCorner(
      outer,
      inner,
      atStart
    ) {
      if (
        cornerRoundness <= 0.001 ||
        outer.length < 4 ||
        inner.length < 4
      ) {
        return;
      }

      const endIndex =
        atStart
          ? 0
          : outer.length - 1;

      const cornerX =
        (
          outer[endIndex].x +
          inner[endIndex].x
        ) / 2;

      const cornerY =
        (
          outer[endIndex].y +
          inner[endIndex].y
        ) / 2;

      const count =
        Math.min(
          4,
          outer.length
        );

      for (
        let step = 0;
        step < count;
        step += 1
      ) {
        const index =
          atStart
            ? step
            : outer.length - 1 - step;

        const proximity =
          1 -
          step /
          count;

        const blend =
          cornerRoundness *
          proximity *
          proximity;

        outer[index].x +=
          (
            cornerX -
            outer[index].x
          ) *
          blend;

        outer[index].y +=
          (
            cornerY -
            outer[index].y
          ) *
          blend;

        inner[index].x +=
          (
            cornerX -
            inner[index].x
          ) *
          blend;

        inner[index].y +=
          (
            cornerY -
            inner[index].y
          ) *
          blend;
      }
    }

    softenCorner(
      upperOuter,
      upperInner,
      true
    );

    softenCorner(
      upperOuter,
      upperInner,
      false
    );

    softenCorner(
      lowerOuter,
      lowerInner,
      true
    );

    softenCorner(
      lowerOuter,
      lowerInner,
      false
    );


    function buildLipPath(
      outer,
      inner
    ) {
      if (
        outer.length < 2 ||
        inner.length < 2
      ) {
        return "";
      }

      const points =
        outer.concat(
          inner.slice().reverse()
        );

      return pointsToClosedPath(points);
    }

    const cavityPoints =
      upperInner.concat(
        lowerInner.slice().reverse()
      );

    return {
      upperPath:
        buildLipPath(
          upperOuter,
          upperInner
        ),

      lowerPath:
        buildLipPath(
          lowerOuter,
          lowerInner
        ),

      cavityPath:
        pointsToClosedPath(
          cavityPoints
        ),
    };
  }

  /* ==========================
       EXPLICIT VISEME GEOMETRY
    ========================== */

  function buildExplicitVisemeGeometry(
    geometry,
    settings
  ) {
    const pose =
      String(
        settings.explicitVisemePose ||
        ""
      ).toUpperCase();

    if (
      pose !== "MBP" &&
      pose !== "EE" &&
      pose !== "FV" &&
      pose !== "L" &&
      pose !== "TH" &&
      pose !== "SH" &&
      pose !== "WR" &&
      pose !== "TDN" &&
      pose !== "KG" &&
      pose !== "UHEH"
    ) {
      return null;
    }

    const samples =
      Array.isArray(
        geometry.anatomySamples
      )
        ? geometry.anatomySamples
        : [];

    if (samples.length < 3) {
      return null;
    }

    const upperOuter = [];
    const upperInner = [];
    const lowerInner = [];
    const lowerOuter = [];

    samples.forEach(function (sample) {
      if (
        !validPoint(sample.seamPoint) ||
        !validPoint(sample.upperBorder) ||
        !validPoint(sample.lowerBorder)
      ) {
        return;
      }

      const t =
        clamp(
          safeNumber(sample.t, 0),
          0,
          1
        );

      const centerWeight =
        Math.sin(
          Math.PI * t
        );

      const cornerWeight =
        1 -
        centerWeight;

      let xScale = 1;

      let upperInnerY =
        sample.seamPoint.y;

      let lowerInnerY =
        sample.seamPoint.y;

      let upperOuterY =
        sample.upperBorder.y;

      let lowerOuterY =
        sample.lowerBorder.y;


      if (pose === "MBP") {
        /*
            M / B / P:
            pressed, flattened closed lips.
        */

        xScale = 0.985;

        const contactY =
          settings.centerY +
          (
            sample.seamPoint.y -
            settings.centerY
          ) *
          0.06;

        upperInnerY =
          contactY;

        lowerInnerY =
          contactY;

        upperOuterY =
          contactY -
          (
            contactY -
            sample.upperBorder.y
          ) *
          0.58;

        lowerOuterY =
          contactY +
          (
            sample.lowerBorder.y -
            contactY
          ) *
          0.58;
      }


      if (pose === "EE") {
        /*
            EE:
            shallow grin-like opening with
            restrained width and visible teeth.
        */

        xScale =
          1.035 +
          cornerWeight *
          0.008;

        const gap =
          9.8 *
          Math.pow(
            centerWeight,
            0.64
          );

        upperInnerY =
          sample.seamPoint.y -
          gap *
          (
            0.52 +
            0.08 *
            centerWeight
          );

        lowerInnerY =
          sample.seamPoint.y +
          gap *
          (
            0.48 -
            0.04 *
            centerWeight
          );

        upperOuterY =
          upperInnerY -
          (
            sample.seamPoint.y -
            sample.upperBorder.y
          ) *
          0.90;

        lowerOuterY =
          lowerInnerY +
          (
            sample.lowerBorder.y -
            sample.seamPoint.y
          ) *
          0.94;
      }


      if (pose === "L") {
        /*
            L:
            modest central opening with mostly neutral lips.
            The dedicated L teeth/tongue layers use the
            upperInner/lowerInner arrays produced here.
        */

        xScale =
          0.99;

        const gap =
          7.2 *
          Math.pow(
            centerWeight,
            0.78
          );

        upperInnerY =
          sample.seamPoint.y -
          gap *
          0.44;

        lowerInnerY =
          sample.seamPoint.y +
          gap *
          0.56;

        upperOuterY =
          upperInnerY -
          (
            sample.seamPoint.y -
            sample.upperBorder.y
          ) *
          0.96;

        lowerOuterY =
          lowerInnerY +
          (
            sample.lowerBorder.y -
            sample.seamPoint.y
          ) *
          0.98;
      }


      if (pose === "UHEH") {
        /*
            UH / EH:
            medium-width vowel with a moderate opening.
            It sits between EE and AH without rounding
            forward like OH / OO.
        */

        xScale =
          1.035;

        const gap =
          9.1 *
          Math.pow(
            centerWeight,
            0.74
          );

        upperInnerY =
          sample.seamPoint.y -
          gap *
          0.42;

        lowerInnerY =
          sample.seamPoint.y +
          gap *
          0.58;

        upperOuterY =
          upperInnerY -
          (
            sample.seamPoint.y -
            sample.upperBorder.y
          ) *
          0.98;

        lowerOuterY =
          lowerInnerY +
          (
            sample.lowerBorder.y -
            sample.seamPoint.y
          ) *
          1.01;
      }


      if (pose === "KG") {
        /*
            K / G:
            modest open cavity, slightly heavier lower-jaw
            drop, with no visible tongue-tip articulation.
        */

        xScale =
          0.985;

        const gap =
          8.4 *
          Math.pow(
            centerWeight,
            0.76
          );

        upperInnerY =
          sample.seamPoint.y -
          gap *
          0.34;

        lowerInnerY =
          sample.seamPoint.y +
          gap *
          0.66;

        upperOuterY =
          upperInnerY -
          (
            sample.seamPoint.y -
            sample.upperBorder.y
          ) *
          0.97;

        lowerOuterY =
          lowerInnerY +
          (
            sample.lowerBorder.y -
            sample.seamPoint.y
          ) *
          1.03;
      }


      if (pose === "TDN") {
        /*
            T / D / N:
            small, relaxed opening.
            Similar family to L, but the tongue
            sits higher/back and is less visible.
        */

        xScale =
          0.995;

        const gap =
          6.2 *
          Math.pow(
            centerWeight,
            0.80
          );

        upperInnerY =
          sample.seamPoint.y -
          gap *
          0.43;

        lowerInnerY =
          sample.seamPoint.y +
          gap *
          0.57;

        upperOuterY =
          upperInnerY -
          (
            sample.seamPoint.y -
            sample.upperBorder.y
          ) *
          0.97;

        lowerOuterY =
          lowerInnerY +
          (
            sample.lowerBorder.y -
            sample.seamPoint.y
          ) *
          0.98;
      }


      if (pose === "WR") {
        /*
            W / R:
            tight pursed opening.
            Narrower than OH/OO and much less vertically open.
        */

        xScale =
          0.84;

        const gap =
          4.4 *
          Math.pow(
            centerWeight,
            0.62
          );

        upperInnerY =
          sample.seamPoint.y -
          gap *
          0.48;

        lowerInnerY =
          sample.seamPoint.y +
          gap *
          0.52;

        upperOuterY =
          upperInnerY -
          (
            sample.seamPoint.y -
            sample.upperBorder.y
          ) *
          1.10;

        lowerOuterY =
          lowerInnerY +
          (
            sample.lowerBorder.y -
            sample.seamPoint.y
          ) *
          1.10;
      }


      if (pose === "SH") {
        /*
            SH / CH / J:
            compact rounded opening.
            Outer width narrows while the inner opening
            stays slightly taller through the center.
        */

        xScale =
          0.96;

        const gap =
          5.7 *
          Math.pow(
            centerWeight,
            0.82
          );

        upperInnerY =
          sample.seamPoint.y -
          gap *
          0.46;

        lowerInnerY =
          sample.seamPoint.y +
          gap *
          0.54;

        upperOuterY =
          upperInnerY -
          (
            sample.seamPoint.y -
            sample.upperBorder.y
          ) *
          1.03;

        lowerOuterY =
          lowerInnerY +
          (
            sample.lowerBorder.y -
            sample.seamPoint.y
          ) *
          1.03;
      }


      if (pose === "TH") {
        /*
            TH:
            modest central opening with a slightly
            forward lower inner edge so the tongue
            can project between the teeth.
        */

        xScale =
          0.99;

        const gap =
          10.6 *
          Math.pow(
            centerWeight,
            0.72
          );

        upperInnerY =
          sample.seamPoint.y -
          gap *
          0.42;

        lowerInnerY =
          sample.seamPoint.y +
          gap *
          0.58;

        upperOuterY =
          upperInnerY -
          (
            sample.seamPoint.y -
            sample.upperBorder.y
          ) *
          0.95;

        lowerOuterY =
          lowerInnerY +
          (
            sample.lowerBorder.y -
            sample.seamPoint.y
          ) *
          0.96;
      }


      if (pose === "FV") {
        /*
            F / V:
            upper teeth exposed; lower inner lip
            rises into their lower edge while
            the lower outer lip remains visible.
        */

        xScale = 0.99;

        const gap =
          4.8 *
          Math.pow(
            centerWeight,
            0.86
          );

        upperInnerY =
          sample.seamPoint.y -
          gap *
          0.66 -
          centerWeight *
          0.85;

        const toothDepth =
          6.4 *
          Math.pow(
            centerWeight,
            0.68
          );

        lowerInnerY =
          upperInnerY +
          toothDepth -
          0.10 *
          centerWeight;

        upperOuterY =
          upperInnerY -
          (
            sample.seamPoint.y -
            sample.upperBorder.y
          ) *
          0.90;

        lowerOuterY =
          lowerInnerY +
          (
            sample.lowerBorder.y -
            sample.seamPoint.y
          ) *
          1.08;
      }


      const seamX =
        settings.centerX +
        (
          sample.seamPoint.x -
          settings.centerX
        ) *
        xScale;

      const upperX =
        settings.centerX +
        (
          sample.upperBorder.x -
          settings.centerX
        ) *
        xScale;

      const lowerX =
        settings.centerX +
        (
          sample.lowerBorder.x -
          settings.centerX
        ) *
        xScale;


      upperInner.push({
        x: seamX,
        y: upperInnerY
      });

      lowerInner.push({
        x: seamX,
        y: lowerInnerY
      });

      upperOuter.push({
        x: upperX,
        y: upperOuterY
      });

      lowerOuter.push({
        x: lowerX,
        y: lowerOuterY
      });
    });


    function buildLipPath(
      outer,
      inner
    ) {
      return pointsToClosedPath(
        outer.concat(
          inner
            .slice()
            .reverse()
        )
      );
    }


    return {
      pose: pose,

      upperPath:
        buildLipPath(
          upperOuter,
          upperInner
        ),

      lowerPath:
        buildLipPath(
          lowerOuter,
          lowerInner
        ),

      cavityPath:
        pose === "MBP"
          ? ""
          : pointsToClosedPath(
              upperInner.concat(
                lowerInner
                  .slice()
                  .reverse()
              )
            ),

      upperInner: upperInner,
      lowerInner: lowerInner,
      upperOuter: upperOuter,
      lowerOuter: lowerOuter
    };
  }


  function drawLipShapes(group, geometry, settings) {
    if (settings.showLipShapes === false) {
      return;
    }

    const paint =
      prepareSurfacePaint(
        geometry,
        settings
      );

    const genericArticulation =
      buildArticulatedLipPaths(
        geometry,
        settings
      );


    const explicitArticulation =
      buildExplicitVisemeGeometry(
        geometry,
        settings
      );


    const articulation =
      explicitArticulation ||
      genericArticulation;


    /*
        V3.2.1

        Teeth-layer pose values belong in the
        drawLipShapes scope because the upper/lower
        dental surfaces are rendered here.

        V3.2 accidentally declared lowerTeethReveal
        only inside buildArticulatedLipPaths(), which
        made it unavailable to this rendering block.
    */

    const upperTeethReveal =
      clamp(
        safeNumber(
          settings.upperTeethReveal,
          settings.showTeeth === false
            ? 0
            : 1
        ),
        0,
        1
      );


    const lowerTeethReveal =
      clamp(
        safeNumber(
          settings.lowerTeethReveal,
          0
        ),
        0,
        1
      );

    /*
        Cavity is drawn first so the articulated
        lips sit naturally on top of it.
    */

    if (articulation.cavityPath) {
      group.appendChild(
        createPath(
          articulation.cavityPath,
          {
            id: "innerMouthCavity",
            className: "innerMouthCavity",
            fill:
              settings.innerMouthColor ||
              "#54242b",
            stroke: "none",
          }
        ),
      );
    }

    /*
        EXPLICIT VISEME TEETH

        EE and F/V use the actual explicit cavity
        edges rather than generic mouthOpen offsets.
    */

    const explicitPose =
      String(
        settings.explicitVisemePose ||
        ""
      ).toUpperCase();

    let explicitUpperTeethDrawn =
      false;

    if (
      (
        explicitPose === "EE" ||
        explicitPose === "FV"
      ) &&
      articulation.upperInner &&
      articulation.lowerInner &&
      articulation.upperInner.length > 4 &&
      articulation.lowerInner.length ===
        articulation.upperInner.length
    ) {
      const toothTop = [];
      const toothBottom = [];
      const count =
        articulation.upperInner.length;

      for (
        let index = 0;
        index < count;
        index += 1
      ) {
        const t =
          count <= 1
            ? 0
            : index / (count - 1);

        const toothInset =
          explicitPose === "EE"
            ? 0.155
            : 0.13;

        if (
          t < toothInset ||
          t > 1 - toothInset
        ) {
          continue;
        }

        const upperPoint =
          articulation.upperInner[index];
        const lowerPoint =
          articulation.lowerInner[index];

        if (
          !validPoint(upperPoint) ||
          !validPoint(lowerPoint)
        ) {
          continue;
        }

        const envelope =
          Math.sin(Math.PI * t);

        const cavityHeight =
          Math.max(
            0,
            lowerPoint.y - upperPoint.y
          );

        const depthShare =
          explicitPose === "FV"
            ? 0.96
            : 0.68;

        const minimumDepth =
          explicitPose === "FV"
            ? 4.8
            : 4.4;

        /*
            Make the upper dental band read as a
            row of teeth rather than a flat stripe.
            The center descends slightly farther
            than the sides.
        */

        const dentalArc =
          explicitPose === "EE"
            ? (
                0.60 +
                0.40 *
                Math.pow(
                  envelope,
                  1.08
                )
              )
            : (
                0.78 +
                0.22 *
                Math.pow(
                  envelope,
                  1.45
                )
              );

        const toothDepth =
          Math.max(
            minimumDepth * envelope,
            cavityHeight * depthShare
          ) *
          dentalArc;

        /*
            EE upper tooth edge:
            subtle center arc so the row follows
            the mouth rather than forming a ruler-
            straight white strip.
        */

        const toothTopOffset =
          explicitPose === "EE"
            ? (
                0.08 +
                0.22 *
                Math.pow(
                  envelope,
                  1.30
                )
              )
            : (
                0.18 *
                envelope
              );

        toothTop.push({
          x: upperPoint.x,
          y:
            upperPoint.y +
            toothTopOffset
        });

        /*
            EE lower tooth edge:
            center incisors extend slightly farther
            down while lateral visibility tapers.
        */

        const eeDepthScale =
          explicitPose === "EE"
            ? (
                0.68 +
                0.32 *
                Math.pow(
                  envelope,
                  1.18
                )
              )
            : 1;

        const eeCenterDrop =
          explicitPose === "EE"
            ? (
                0.78 *
                Math.pow(
                  envelope,
                  1.08
                )
              )
            : 0;

        toothBottom.push({
          x: upperPoint.x,
          y:
            Math.min(
              lowerPoint.y -
              (
                explicitPose === "FV"
                  ? 0.05
                  : 1.15
              ),
              upperPoint.y +
              toothDepth *
              eeDepthScale +
              eeCenterDrop
            )
        });
      }

      if (
        toothTop.length > 1 &&
        toothBottom.length > 1
      ) {
        const explicitUpperTeethPath =
          pointsToClosedPath(
            toothTop.concat(
              toothBottom.slice().reverse()
            )
          );

        group.appendChild(
          createPath(
            explicitUpperTeethPath,
            {
              id: "upperTeethExplicit",
              className:
                "upperTeeth upperTeethExplicit",
              fill:
                explicitPose === "EE"
                  ? (
                      paint.eeTeethFill ||
                      settings.teethColor ||
                      "#eee7dc"
                    )
                  : (
                      settings.teethColor ||
                      "#eee7dc"
                    ),
              stroke: "none",
              opacity:
                explicitPose === "FV"
                  ? 1
                  : 0.96
            }
          )
        );

        explicitUpperTeethDrawn = true;
      }
    }


    /*
        LOWER TEETH

        Only rendered when the current viseme asks
        for them. EE can show a subtle lower dental
        edge without adding permanent lower teeth to
        the neutral/open-mouth renderer.
    */

    if (
      lowerTeethReveal > 0.001 &&
      articulation.cavityPath &&
      Array.isArray(geometry.anatomySamples) &&
      geometry.anatomySamples.length > 3
    ) {
      const samples =
        geometry.anatomySamples;

      const offsets =
        getOpenOffsets(settings);

      const lowerTop = [];
      const lowerBottom = [];

      samples.forEach(function (sample) {
        if (!validPoint(sample.seamPoint)) {
          return;
        }

        const t =
          clamp(
            safeNumber(sample.t, 0),
            0,
            1
          );

        if (t < 0.16 || t > 0.84) {
          return;
        }

        const envelope =
          Math.sin(Math.PI * t);

        const lowerInnerY =
          sample.seamPoint.y +
          offsets.lowerY *
          envelope;

        const cavityDepth =
          offsets.gap *
          envelope;

        lowerTop.push({
          x: sample.seamPoint.x,
          y:
            lowerInnerY -
            cavityDepth * 0.18
        });

        lowerBottom.push({
          x: sample.seamPoint.x,
          y:
            lowerInnerY -
            cavityDepth * 0.04
        });
      });

      if (
        lowerTop.length > 1 &&
        lowerBottom.length > 1
      ) {
        const lowerTeethPath =
          pointsToClosedPath(
            lowerTop.concat(
              lowerBottom
                .slice()
                .reverse()
            )
          );

        group.appendChild(
          createPath(
            lowerTeethPath,
            {
              id: "lowerTeeth",
              className: "lowerTeeth",
              fill:
                settings.teethColor ||
                "#eee7dc",
              stroke: "none",
              opacity:
                lowerTeethReveal *
                0.72
            }
          )
        );
      }
    }


    /*
        EXPLICIT L UPPER TEETH

        L needs a dedicated dental band because the generic tooth
        reveal can be too shallow to read through this pose.

        Render order is important:
        cavity -> upper teeth -> tongue tip -> lips
    */

    if (
      explicitPose === "L" &&
      articulation.upperInner &&
      articulation.lowerInner &&
      articulation.upperInner.length > 4 &&
      articulation.lowerInner.length ===
        articulation.upperInner.length
    ) {

      const lToothTop = [];
      const lToothBottom = [];

      const count =
        articulation.upperInner.length;

      for (
        let index = 0;
        index < count;
        index += 1
      ) {

        const t =
          count <= 1
            ? 0
            : index / (count - 1);

        if (
          t < 0.20 ||
          t > 0.80
        ) {
          continue;
        }

        const upperPoint =
          articulation.upperInner[index];

        const lowerPoint =
          articulation.lowerInner[index];

        if (
          !validPoint(upperPoint) ||
          !validPoint(lowerPoint)
        ) {
          continue;
        }

        const envelope =
          Math.sin(
            Math.PI * t
          );

        const cavityHeight =
          Math.max(
            1,
            lowerPoint.y -
            upperPoint.y
          );

        const topY =
          upperPoint.y +
          0.20 *
          envelope;

        const bottomY =
          Math.min(
            lowerPoint.y - 1.0,
            upperPoint.y +
            Math.max(
              2.8 * envelope,
              cavityHeight * 0.48
            )
          );

        lToothTop.push({
          x: upperPoint.x,
          y: topY
        });

        lToothBottom.push({
          x: upperPoint.x,
          y: bottomY
        });
      }

      if (
        lToothTop.length > 1 &&
        lToothBottom.length > 1
      ) {

        const lTeethPath =
          pointsToClosedPath(
            lToothTop.concat(
              lToothBottom
                .slice()
                .reverse()
            )
          );

        group.appendChild(
          createPath(
            lTeethPath,
            {
              id: "upperTeethL",
              className:
                "upperTeeth upperTeethL",
              fill:
                settings.teethColor ||
                "#eee7dc",
              stroke: "none",
              opacity: 1
            }
          )
        );
      }
    }


    /*
        EXPLICIT L TONGUE

        The tongue tip rises into the upper dental region and overlaps
        the lower edge of the upper teeth around the center.

        This is intentionally more obvious than a realistic tongue tip
        at first; we can tune it back once the pose reads clearly.
    */

    if (
      explicitPose === "L" &&
      articulation.upperInner &&
      articulation.lowerInner &&
      articulation.upperInner.length > 4 &&
      articulation.lowerInner.length ===
        articulation.upperInner.length
    ) {

      const lTongueTop = [];
      const lTongueBottom = [];

      const count =
        articulation.upperInner.length;

      for (
        let index = 0;
        index < count;
        index += 1
      ) {

        const t =
          count <= 1
            ? 0
            : index / (count - 1);

        if (
          t < 0.315 ||
          t > 0.685
        ) {
          continue;
        }

        const upperPoint =
          articulation.upperInner[index];

        const lowerPoint =
          articulation.lowerInner[index];

        if (
          !validPoint(upperPoint) ||
          !validPoint(lowerPoint)
        ) {
          continue;
        }

        const localT =
          (t - 0.315) /
          0.37;

        const rawArch =
          Math.sin(
            Math.PI * localT
          );

        /*
            Broad, flatter tongue-tip plateau.
            Raising rawArch to a low power keeps the center wide
            instead of creating the previous little pointed bump.
        */
        const arch =
          Math.pow(
            Math.max(
              0,
              rawArch
            ),
            0.34
          );

        const cavityHeight =
          Math.max(
            1,
            lowerPoint.y -
            upperPoint.y
          );

        /*
            Center tip reaches into the dental zone.
            Side points stay lower so this reads as a tongue tip,
            not a broad AH tongue.
        */

        const topY =
          lowerPoint.y -
          cavityHeight *
          (
            0.40 +
            0.64 *
            Math.pow(
              arch,
              1.45
            )
          );

        const bottomY =
          lowerPoint.y -
          cavityHeight *
          (
            0.10 +
            0.22 *
            arch
          );

        lTongueTop.push({
          x: upperPoint.x,
          y: topY
        });

        lTongueBottom.push({
          x: lowerPoint.x,
          y: bottomY
        });
      }

      if (
        lTongueTop.length > 1 &&
        lTongueBottom.length > 1
      ) {

        const lTonguePath =
          pointsToClosedPath(
            lTongueTop.concat(
              lTongueBottom
                .slice()
                .reverse()
            )
          );

        group.appendChild(
          createPath(
            lTonguePath,
            {
              id: "tongueL",
              className:
                "tongueSurface tongueL",
              fill:
                settings.tongueTipColor ||
                settings.tongueFrontColor ||
                "#c96f78",
              stroke:
                settings.tongueEdgeColor ||
                "rgba(90, 35, 45, 0.22)",
              strokeWidth: 0.55,
              opacity: 1
            }
          )
        );
      }
    }


    /*
        EXPLICIT SH / CH / J UPPER TEETH

        A restrained dental reveal behind the rounded lips.
        The lips remain the dominant feature of this pose.
    */

    if (
      explicitPose === "SH" &&
      articulation.upperInner &&
      articulation.lowerInner &&
      articulation.upperInner.length > 4 &&
      articulation.lowerInner.length ===
        articulation.upperInner.length
    ) {

      const shToothTop = [];
      const shToothBottom = [];

      const count =
        articulation.upperInner.length;

      for (
        let index = 0;
        index < count;
        index += 1
      ) {

        const t =
          count <= 1
            ? 0
            : index / (count - 1);

        if (
          t < 0.28 ||
          t > 0.72
        ) {
          continue;
        }

        const upperPoint =
          articulation.upperInner[index];

        const lowerPoint =
          articulation.lowerInner[index];

        if (
          !validPoint(upperPoint) ||
          !validPoint(lowerPoint)
        ) {
          continue;
        }

        const envelope =
          Math.sin(
            Math.PI * t
          );

        const cavityHeight =
          Math.max(
            1,
            lowerPoint.y -
            upperPoint.y
          );

        shToothTop.push({
          x: upperPoint.x,
          y:
            upperPoint.y +
            0.18 *
            envelope
        });

        shToothBottom.push({
          x: upperPoint.x,
          y:
            Math.min(
              lowerPoint.y - 1.35,
              upperPoint.y +
              Math.max(
                2.1 * envelope,
                cavityHeight * 0.28
              )
            )
        });
      }

      if (
        shToothTop.length > 1 &&
        shToothBottom.length > 1
      ) {

        const shTeethPath =
          pointsToClosedPath(
            shToothTop.concat(
              shToothBottom
                .slice()
                .reverse()
            )
          );

        group.appendChild(
          createPath(
            shTeethPath,
            {
              id: "upperTeethSH",
              className:
                "upperTeeth upperTeethSH",
              fill:
                settings.teethColor ||
                "#eee7dc",
              stroke: "none",
              opacity: 0.88
            }
          )
        );
      }
    }


    /*
        EXPLICIT T / D / N UPPER TEETH
    */

    if (
      explicitPose === "TDN" &&
      articulation.upperInner &&
      articulation.lowerInner &&
      articulation.upperInner.length > 4 &&
      articulation.lowerInner.length ===
        articulation.upperInner.length
    ) {

      const tdnToothTop = [];
      const tdnToothBottom = [];
      const count =
        articulation.upperInner.length;

      for (
        let index = 0;
        index < count;
        index += 1
      ) {

        const t =
          count <= 1
            ? 0
            : index / (count - 1);

        if (
          t < 0.24 ||
          t > 0.76
        ) {
          continue;
        }

        const upperPoint =
          articulation.upperInner[index];

        const lowerPoint =
          articulation.lowerInner[index];

        if (
          !validPoint(upperPoint) ||
          !validPoint(lowerPoint)
        ) {
          continue;
        }

        const envelope =
          Math.sin(
            Math.PI * t
          );

        const cavityHeight =
          Math.max(
            1,
            lowerPoint.y -
            upperPoint.y
          );

        tdnToothTop.push({
          x: upperPoint.x,
          y:
            upperPoint.y +
            0.15 *
            envelope
        });

        tdnToothBottom.push({
          x: upperPoint.x,
          y:
            Math.min(
              lowerPoint.y - 1.2,
              upperPoint.y +
              Math.max(
                2.2 * envelope,
                cavityHeight * 0.30
              )
            )
        });
      }

      if (
        tdnToothTop.length > 1 &&
        tdnToothBottom.length > 1
      ) {

        const tdnTeethPath =
          pointsToClosedPath(
            tdnToothTop.concat(
              tdnToothBottom
                .slice()
                .reverse()
            )
          );

        group.appendChild(
          createPath(
            tdnTeethPath,
            {
              id: "upperTeethTDN",
              className:
                "upperTeeth upperTeethTDN",
              fill:
                settings.teethColor ||
                "#eee7dc",
              stroke: "none",
              opacity: 0.84
            }
          )
        );
      }
    }


    /*
        EXPLICIT T / D / N TONGUE

        Tongue tip rises behind the upper incisors,
        but stays subtler and narrower than L.
    */

    if (
      explicitPose === "TDN" &&
      articulation.upperInner &&
      articulation.lowerInner &&
      articulation.upperInner.length > 4 &&
      articulation.lowerInner.length ===
        articulation.upperInner.length
    ) {

      const tdnTongueTop = [];
      const tdnTongueBottom = [];
      const count =
        articulation.upperInner.length;

      for (
        let index = 0;
        index < count;
        index += 1
      ) {

        const t =
          count <= 1
            ? 0
            : index / (count - 1);

        if (
          t < 0.39 ||
          t > 0.61
        ) {
          continue;
        }

        const upperPoint =
          articulation.upperInner[index];

        const lowerPoint =
          articulation.lowerInner[index];

        if (
          !validPoint(upperPoint) ||
          !validPoint(lowerPoint)
        ) {
          continue;
        }

        const localT =
          (t - 0.39) /
          0.22;

        const rawArch =
          Math.sin(
            Math.PI * localT
          );

        const arch =
          Math.pow(
            Math.max(
              0,
              rawArch
            ),
            0.46
          );

        const cavityHeight =
          Math.max(
            1,
            lowerPoint.y -
            upperPoint.y
          );

        const topY =
          lowerPoint.y -
          cavityHeight *
          (
            0.34 +
            0.56 *
            arch
          );

        const bottomY =
          lowerPoint.y -
          cavityHeight *
          (
            0.08 +
            0.13 *
            arch
          );

        tdnTongueTop.push({
          x: upperPoint.x,
          y: topY
        });

        tdnTongueBottom.push({
          x: lowerPoint.x,
          y: bottomY
        });
      }

      if (
        tdnTongueTop.length > 1 &&
        tdnTongueBottom.length > 1
      ) {

        const tdnTonguePath =
          pointsToClosedPath(
            tdnTongueTop.concat(
              tdnTongueBottom
                .slice()
                .reverse()
            )
          );

        group.appendChild(
          createPath(
            tdnTonguePath,
            {
              id: "tongueTDN",
              className:
                "tongueSurface tongueTDN",
              fill:
                settings.tongueTipColor ||
                settings.tongueFrontColor ||
                "#c96f78",
              stroke:
                settings.tongueEdgeColor ||
                "rgba(90, 35, 45, 0.18)",
              strokeWidth: 0.45,
              opacity: 0.94
            }
          )
        );
      }
    }


    /*
        EXPLICIT TH UPPER TEETH
    */

    if (
      explicitPose === "TH" &&
      articulation.upperInner &&
      articulation.lowerInner &&
      articulation.upperInner.length > 4 &&
      articulation.lowerInner.length ===
        articulation.upperInner.length
    ) {

      const thToothTop = [];
      const thToothBottom = [];
      const count =
        articulation.upperInner.length;

      for (
        let index = 0;
        index < count;
        index += 1
      ) {

        const t =
          count <= 1
            ? 0
            : index / (count - 1);

        if (
          t < 0.18 ||
          t > 0.82
        ) {
          continue;
        }

        const upperPoint =
          articulation.upperInner[index];

        const lowerPoint =
          articulation.lowerInner[index];

        if (
          !validPoint(upperPoint) ||
          !validPoint(lowerPoint)
        ) {
          continue;
        }

        const envelope =
          Math.sin(
            Math.PI * t
          );

        const cavityHeight =
          Math.max(
            1,
            lowerPoint.y -
            upperPoint.y
          );

        thToothTop.push({
          x: upperPoint.x,
          y:
            upperPoint.y +
            0.18 *
            envelope
        });

        thToothBottom.push({
          x: upperPoint.x,
          y:
            Math.min(
              lowerPoint.y - 1.2,
              upperPoint.y +
              Math.max(
                2.6 * envelope,
                cavityHeight * 0.36
              )
            )
        });
      }

      if (
        thToothTop.length > 1 &&
        thToothBottom.length > 1
      ) {

        const thTeethPath =
          pointsToClosedPath(
            thToothTop.concat(
              thToothBottom
                .slice()
                .reverse()
            )
          );

        group.appendChild(
          createPath(
            thTeethPath,
            {
              id: "upperTeethTH",
              className:
                "upperTeeth upperTeethTH",
              fill:
                settings.teethColor ||
                "#eee7dc",
              stroke: "none",
              opacity: 1
            }
          )
        );
      }
    }


    /*
        EXPLICIT TH TONGUE

        Wider than L and pushed forward/downward so the tip
        visibly protrudes between the teeth instead of rising
        behind them.
    */

    if (
      explicitPose === "TH" &&
      articulation.upperInner &&
      articulation.lowerInner &&
      articulation.upperInner.length > 4 &&
      articulation.lowerInner.length ===
        articulation.upperInner.length
    ) {

      const thTongueTop = [];
      const thTongueBottom = [];

      const count =
        articulation.upperInner.length;

      for (
        let index = 0;
        index < count;
        index += 1
      ) {

        const t =
          count <= 1
            ? 0
            : index / (count - 1);

        if (
          t < 0.27 ||
          t > 0.73
        ) {
          continue;
        }

        const upperPoint =
          articulation.upperInner[index];

        const lowerPoint =
          articulation.lowerInner[index];

        if (
          !validPoint(upperPoint) ||
          !validPoint(lowerPoint)
        ) {
          continue;
        }

        const localT =
          (t - 0.27) /
          0.46;

        const rawArch =
          Math.sin(
            Math.PI * localT
          );

        const arch =
          Math.pow(
            Math.max(
              0,
              rawArch
            ),
            0.78
          );

        const sideTaper =
          Math.pow(
            Math.max(
              0,
              rawArch
            ),
            0.58
          );

        const cavityHeight =
          Math.max(
            1,
            lowerPoint.y -
            upperPoint.y
          );

        /*
            TH tongue top sits lower than L and extends
            forward into the gap between teeth.
        */

        const topY =
          upperPoint.y +
          cavityHeight *
          (
            0.36 -
            0.11 *
            arch
          );

        const bottomY =
          topY +
          cavityHeight *
          (
            0.035 +
            0.12 *
            sideTaper
          );

        thTongueTop.push({
          x: upperPoint.x,
          y: topY
        });

        thTongueBottom.push({
          x: lowerPoint.x,
          y: bottomY
        });
      }

      if (
        thTongueTop.length > 1 &&
        thTongueBottom.length > 1
      ) {

        const thTonguePath =
          pointsToClosedPath(
            thTongueTop.concat(
              thTongueBottom
                .slice()
                .reverse()
            )
          );

        group.appendChild(
          createPath(
            thTonguePath,
            {
              id: "tongueTH",
              className:
                "tongueSurface tongueTH",
              fill:
                settings.tongueTipColor ||
                settings.tongueFrontColor ||
                "#c96f78",
              stroke:
                settings.tongueEdgeColor ||
                "rgba(90, 35, 45, 0.22)",
              strokeWidth: 0.55,
              opacity: 1
            }
          )
        );
      }
    }


    /*
        TONGUE

        Broad curved surface rising from the lower
        rear of the mouth cavity. It is drawn before
        the teeth and lips so it remains inside the
        mouth rather than looking like a floating
        oval.
    */

    const tongueOpenAmount =
      getOpenAmount(settings);

    const tongueRevealStart =
      clamp(
        safeNumber(
          settings.tongueRevealStart,
          0.48
        ),
        0,
        0.95
      );

    if (
      settings.showTongue !== false &&
      explicitPose !== "L" &&
      explicitPose !== "TH" &&
      explicitPose !== "TDN" &&
      explicitPose !== "KG" &&
      explicitPose !== "UHEH" &&
      articulation.cavityPath &&
      tongueOpenAmount >
        tongueRevealStart
    ) {
      const samples =
        Array.isArray(
          geometry.anatomySamples
        )
          ? geometry.anatomySamples
          : [];

      if (samples.length > 3) {
        const offsets =
          getOpenOffsets(settings);

        const tongueWidth =
          clamp(
            safeNumber(
              settings.tongueWidth,
              0.72
            ),
            0.30,
            0.95
          );

        const tongueHeight =
          clamp(
            safeNumber(
              settings.tongueHeight,
              0.30
            ),
            0.08,
            0.60
          );

        const startT =
          (1 - tongueWidth) / 2;

        const endT =
          1 - startT;

        const tongueTop = [];
        const tongueBottom = [];

        samples.forEach(
          function(sample) {
            if (
              !validPoint(
                sample.seamPoint
              )
            ) {
              return;
            }

            const t =
              clamp(
                safeNumber(
                  sample.t,
                  0
                ),
                0,
                1
              );

            if (
              t < startT ||
              t > endT
            ) {
              return;
            }

            const localT =
              (
                t -
                startT
              ) /
              (
                endT -
                startT
              );

            const arch =
              Math.sin(
                Math.PI *
                localT
              );

            const mouthEnvelope =
              Math.sin(
                Math.PI *
                t
              );

            const upperY =
              sample.seamPoint.y +
              offsets.upperY *
              mouthEnvelope;

            const lowerY =
              sample.seamPoint.y +
              offsets.lowerY *
              mouthEnvelope;

            const cavityHeight =
              Math.max(
                0,
                lowerY -
                upperY
              );

            /*
                Tongue rises from the lower portion
                of the cavity, with a broad rounded
                center and lower edges at the sides.
            */

            const tongueDome =
              clamp(
                safeNumber(
                  settings.tongueDome,
                  0.12
                ),
                0,
                0.35
              );

            const tongueSideFalloff =
              Math.max(
                0.5,
                safeNumber(
                  settings.tongueSideFalloff,
                  1.35
                )
              );

            const shapedArch =
              Math.pow(
                arch,
                tongueSideFalloff
              );

            /*
                Soft center dome with sides falling
                back into the mouth cavity.
            */

            const topY =
              lowerY -
              cavityHeight *
              (
                0.08 +
                tongueHeight *
                shapedArch +
                tongueDome *
                Math.pow(
                  shapedArch,
                  2.35
                )
              );

            const bottomY =
              lowerY -
              cavityHeight *
              0.025;

            tongueTop.push({
              x: sample.seamPoint.x,
              y: topY
            });

            tongueBottom.push({
              x: sample.seamPoint.x,
              y: bottomY
            });
          }
        );

        if (
          tongueTop.length > 1 &&
          tongueBottom.length > 1
        ) {
          const tonguePath =
            pointsToClosedPath(
              tongueTop.concat(
                tongueBottom
                  .slice()
                  .reverse()
              )
            );

          const tongueReveal =
            clamp(
              (
                tongueOpenAmount -
                tongueRevealStart
              ) /
              (
                1 -
                tongueRevealStart
              ),
              0,
              1
            );

          group.appendChild(
            createPath(
              tonguePath,
              {
                id: "tongueSurface",
                className:
                  "tongueSurface",
                fill:
                  paint.tongueFill ||
                  settings.tongueColor ||
                  "#7f3f49",
                stroke: "none",
                opacity:
                  tongueReveal *
                  0.92
              }
            )
          );

          /*
              Front-edge lip shadow.

              A faint dark stroke along the tongue
              boundary helps it sit under the lower
              lip instead of reading as a separate
              ball inside the mouth.
          */

          group.appendChild(
            createPath(
              tonguePath,
              {
                id: "tongueFrontShadow",
                className:
                  "tongueFrontShadow",
                fill: "none",
                stroke: "#4a2027",
                strokeWidth: 0.8,
                opacity:
                  tongueReveal *
                  0.34
              }
            )
          );
        }
      }
    }


    /*
        UPPER TEETH

        Render a single soft dental band rather than
        individual teeth. It follows the current
        articulated cavity and is clipped visually
        by the lips drawn afterward.
    */

    const openAmount =
      getOpenAmount(settings);

    const revealStart =
      clamp(
        safeNumber(
          settings.teethRevealStart,
          0.35
        ),
        0,
        0.95
      );

    const explicitTeethPose =
      String(
        settings.explicitVisemePose ||
        ""
      ).toUpperCase();


    const forceUpperTeeth =
      (
        explicitTeethPose === "EE" ||
        explicitTeethPose === "FV"
      );


    if (
      !explicitUpperTeethDrawn &&
      settings.showTeeth !== false &&
      articulation.cavityPath &&
      (
        openAmount > revealStart ||
        forceUpperTeeth
      )
    ) {
      const samples =
        Array.isArray(geometry.anatomySamples)
          ? geometry.anatomySamples
          : [];

      if (samples.length > 3) {
        const offsets =
          getOpenOffsets(settings);

        const widthCompression =
          clamp(
            safeNumber(
              settings.openWidthCompression,
              0.20
            ),
            0,
            0.45
          );

        const widthPower =
          Math.max(
            0.5,
            safeNumber(
              settings.openWidthPower,
              1.8
            )
          );

        const widthScale =
          1 -
          widthCompression *
          Math.pow(
            offsets.amount,
            widthPower
          );

        const left =
          samples[0].seamPoint;

        const right =
          samples[samples.length - 1].seamPoint;

        const centerX =
          (
            left.x +
            right.x
          ) / 2;

        const inset =
          clamp(
            safeNumber(
              settings.teethInset,
              0.10
            ),
            0,
            0.35
          );

        const teethHeight =
          clamp(
            safeNumber(
              settings.teethHeight,
              0.27
            ),
            0.05,
            0.55
          );

        const top = [];
        const bottom = [];

        samples.forEach(function(sample) {
          if (!validPoint(sample.seamPoint)) {
            return;
          }

          const t =
            clamp(
              safeNumber(sample.t, 0),
              0,
              1
            );

          if (
            t < inset ||
            t > 1 - inset
          ) {
            return;
          }

          const envelope =
            Math.sin(Math.PI * t);

          const x =
            centerX +
            (
              sample.seamPoint.x -
              centerX
            ) *
            widthScale;

          const upperInnerY =
            sample.seamPoint.y +
            offsets.upperY *
            Math.pow(
              envelope,
              1 /
              (
                1 +
                offsets.amount *
                0.55 *
                clamp(
                  safeNumber(
                    settings.openRoundness,
                    1.35
                  ),
                  0.6,
                  2.4
                )
              )
            );

          const cavityDepth =
            offsets.gap *
            envelope;

          top.push({
            x: x,
            y:
              upperInnerY +
              cavityDepth * 0.04
          });

          /*
              Dental arc:
              central incisors extend slightly farther
              down than the lateral teeth.
          */

          const lateralRecede =
            clamp(
              safeNumber(
                settings.teethLateralRecede,
                0.13
              ),
              0,
              0.35
            );

          /*
              Center incisors remain deepest while
              lateral teeth recede upward slightly.
          */

          const dentalArc =
            (
              0.80 +
              0.20 *
              Math.pow(
                envelope,
                1.6
              )
            ) *
            (
              1 -
              lateralRecede *
              Math.pow(
                Math.abs(
                  t -
                  0.5
                ) * 2,
                1.35
              )
            );

          bottom.push({
            x: x,
            y:
              upperInnerY +
              cavityDepth *
              teethHeight *
              dentalArc
          });
        });

        if (
          top.length > 1 &&
          bottom.length > 1
        ) {
          const points =
            top.concat(
              bottom.slice().reverse()
            );

          const teethPath =
            pointsToClosedPath(points);

          let reveal =
            clamp(
              (
                openAmount -
                revealStart
              ) /
              (
                1 -
                revealStart
              ),
              0,
              1
            );


          if (
            explicitTeethPose === "EE"
          ) {
            reveal =
              Math.max(
                reveal,
                0.82
              );
          }


          if (
            explicitTeethPose === "FV"
          ) {
            reveal =
              Math.max(
                reveal,
                0.96
              );
          }

          group.appendChild(
            createPath(
              teethPath,
              {
                id: "upperTeeth",
                className: "upperTeeth",
                fill:
                  settings.teethColor ||
                  "#f3eee7",
                stroke: "none",
                opacity:
                  reveal *
                  upperTeethReveal
              }
            )
          );

          /*
              Faint central incisor separation.

              This is deliberately only one short
              center seam, rather than outlining
              every tooth.
          */

          const centerSample =
            samples[
              Math.floor(
                samples.length / 2
              )
            ];

          if (
            centerSample &&
            validPoint(
              centerSample.seamPoint
            )
          ) {
            const centerEnvelope = 1;

            const centerXTooth =
              centerX;

            const centerUpperY =
              centerSample.seamPoint.y +
              offsets.upperY;

            const centerDepth =
              offsets.gap *
              teethHeight;

            const seamOpacity =
              clamp(
                safeNumber(
                  settings.teethCenterSeamOpacity,
                  0.13
                ),
                0,
                0.5
              ) *
              reveal;

            const seamWidth =
              Math.max(
                0.1,
                safeNumber(
                  settings.teethCenterSeamWidth,
                  0.55
                )
              );

            group.appendChild(
              createPath(
                "M " +
                centerXTooth +
                " " +
                (
                  centerUpperY +
                  centerDepth * 0.12
                ) +
                " L " +
                centerXTooth +
                " " +
                (
                  centerUpperY +
                  centerDepth * 0.88
                ),
                {
                  id: "upperTeethCenterSeam",
                  className:
                    "upperTeethCenterSeam",
                  fill: "none",
                  stroke: "#8f8278",
                  strokeWidth: seamWidth,
                  opacity: seamOpacity
                }
              )
            );
          }
        }
      }
    }


    if (articulation.upperPath) {
      group.appendChild(
        createPath(
          articulation.upperPath,
          {
            id: "upperLipShape",
            className: "upperLipShape",
            fill: paint.upperFill,
            stroke: "none",
          }
        ),
      );
    }

    if (articulation.lowerPath) {
      group.appendChild(
        createPath(
          articulation.lowerPath,
          {
            id: "lowerLipShape",
            className: "lowerLipShape",
            fill: paint.lowerFill,
            stroke: "none",
          }
        ),
      );
    }

    /*
        Keep the anatomical surface overlays on the
        same articulated paths so they deform with
        the lips rather than floating independently.
    */

    if (
      articulation.upperPath &&
      paint.upperLeftLobeFill !== "none"
    ) {
      group.appendChild(
        createPath(
          articulation.upperPath,
          {
            id: "upperLipLeftLobeLight",
            className: "upperLipAnatomyLight",
            fill: paint.upperLeftLobeFill,
            stroke: "none",
            opacity: 0.34,
          }
        ),
      );
    }

    if (
      articulation.upperPath &&
      paint.upperRightLobeFill !== "none"
    ) {
      group.appendChild(
        createPath(
          articulation.upperPath,
          {
            id: "upperLipRightLobeLight",
            className: "upperLipAnatomyLight",
            fill: paint.upperRightLobeFill,
            stroke: "none",
            opacity: 0.34,
          }
        ),
      );
    }

    if (
      articulation.lowerPath &&
      paint.lowerCenterFill !== "none"
    ) {
      group.appendChild(
        createPath(
          articulation.lowerPath,
          {
            id: "lowerLipCenterLight",
            className: "lowerLipAnatomyLight",
            fill: paint.lowerCenterFill,
            stroke: "none",
            opacity: 0.38,
          }
        ),
      );
    }
  }


  /* ==========================
       DRAW SEAM
    ========================== */

  function drawSeam(group, geometry, settings) {
    if (
      !geometry.seamPath ||
      settings.showSeam === false
    ) {
      return;
    }

    const explicitPose =
      String(
        settings.explicitVisemePose ||
        ""
      ).toUpperCase();

    if (
      explicitPose === "MBP" ||
      explicitPose === "EE" ||
      explicitPose === "FV" ||
      explicitPose === "L" ||
      explicitPose === "TH" ||
      explicitPose === "SH" ||
      explicitPose === "WR" ||
      explicitPose === "TDN" ||
      explicitPose === "KG" ||
      explicitPose === "UHEH"
    ) {
      return;
    }

    const offsets =
      getOpenOffsets(settings);

    const seamColor =
      settings.seamColor ||
      "#8f2740";

    const seamWidth =
      Math.max(
        0.1,
        safeNumber(
          settings.seamWidth,
          1.20
        )
      );

    /*
        Fade the closed-mouth seam as the lips
        separate. At full opening the inner-mouth
        cavity defines the opening instead.
    */

    const seamOpacity =
      1 -
      offsets.amount;

    if (seamOpacity <= 0.01) {
      return;
    }

    group.appendChild(
      createPath(geometry.seamPath, {
        id: "mouthSeamSoft",
        className:
          "mouthSeam mouthSeamSoft",
        fill: "none",
        stroke: seamColor,
        strokeWidth:
          seamWidth * 1.65,
        opacity:
          0.11 *
          seamOpacity,
      }),
    );

    group.appendChild(
      createPath(geometry.seamPath, {
        id: "mouthSeam",
        className: "mouthSeam",
        fill: "none",
        stroke: seamColor,
        strokeWidth: seamWidth,
        opacity:
          clamp(
            safeNumber(
              settings.seamCenterDarkness,
              0.85
            ),
            0,
            1
          ) *
          seamOpacity,
      }),
    );
  }


  /* ==========================
       DRAW COMPLETE MOUTH
    ========================== */

  function draw(geometry, rendererSettings) {
    const settings = rendererSettings || {};

    if (!geometry) {
      console.warn("MouthRenderer.draw() received no geometry.");
      return null;
    }

    const group = getMouthGroup();

    if (!group) {
      return null;
    }

    clearElement(group);

    drawLipShapes(group, geometry, settings);
    drawSeam(group, geometry, settings);

    return group;
  }

  /* ==========================
       CLEAR
    ========================== */

  function clear() {
    const group = document.getElementById("mouthEngineGroup");
    clearElement(group);

    const defs = document.getElementById("mouthRendererDefs");
    clearElement(defs);
  }

  /* ==========================
       PUBLIC API
    ========================== */

  window.MouthRenderer = {
    draw: draw,

    clear: clear,

    getFaceSvg: getFaceSvg,

    getGroup: getMouthGroup,

    createPath: createPath,

    drawLipShapes: drawLipShapes,

    drawSeam: drawSeam,
  };

  console.log("mouthRenderer.js V5.1 loaded");
})();
