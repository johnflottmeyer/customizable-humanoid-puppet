/* ==========================
   MOUTH RENDERER — VERSION 2.9

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
        0.18 *
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
        cornerOffsetX;


      const deformedUpperX =
        mouthCenterX +
        (
          sample.upperBorder.x -
          mouthCenterX
        ) *
        puckerScale +
        sideSign *
        cornerOffsetX;


      const deformedLowerX =
        mouthCenterX +
        (
          sample.lowerBorder.x -
          mouthCenterX
        ) *
        puckerScale +
        sideSign *
        cornerOffsetX;


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


      const upperShift =
        offsets.upperY *
        shapedEnvelope +
        compressionPixels -
        upperRaisePixels;


      const lowerShift =
        offsets.lowerY *
        shapedEnvelope -
        compressionPixels -
        lowerRaisePixels;

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

  function drawLipShapes(group, geometry, settings) {
    if (settings.showLipShapes === false) {
      return;
    }

    const paint =
      prepareSurfacePaint(
        geometry,
        settings
      );

    const articulation =
      buildArticulatedLipPaths(
        geometry,
        settings
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

    if (
      settings.showTeeth !== false &&
      articulation.cavityPath &&
      openAmount > revealStart
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

          const reveal =
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
                opacity: reveal
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

  console.log("mouthRenderer.js V2.9 loaded");
})();
