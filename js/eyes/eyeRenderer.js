/* =========================================================
   FACELAB EYE RENDERER
   Version 5.2.7

   PURPOSE

   Draws EyeBuilder / EyeGeometry / EyeSurface anatomy into
   the existing SVG eye elements.

   Version 2 introduces actual eyelid surfaces:

   - upper eyelid skin surface
   - lower eyelid skin surface
   - separate lid edges
   - independent upper and lower creases
   - smaller inner-only tear duct
   - clipped iris, pupil, and highlight

   This file automatically creates these SVG elements when
   they are not already present:

   - leftUpperLidSurface
   - rightUpperLidSurface
   - leftLowerLidSurface
   - rightLowerLidSurface

   Existing IDs remain unchanged:

   - leftUpperLid
   - rightUpperLid
   - leftLowerLid
   - rightLowerLid

   LOAD AFTER:

   js/eyes/eyeGeometry.js
   js/eyes/eyeSurface.js
   js/eyes/eyeBuilder.js

   LOAD BEFORE:

   js/eyes.js
========================================================= */

(function initializeEyeRenderer() {
  "use strict";

  const SVG_NAMESPACE = "http://www.w3.org/2000/svg";

  const DEFAULT_RENDER_OPTIONS = Object.freeze({
    /* SOCKET POSITION */

    socketLiftY: -8,

    /* UPPER LID FOLD */

    upperFoldOffsetScale: 0.055,
    upperFoldMinimum: 4.2,
    upperFoldMaximum: 7.5,
    upperFoldWidth: 0.9,
    upperFoldOpacity: 0.2,
    upperFoldStart: 0.12,
    upperFoldEnd: 0.88,

    irisScale: 0.9,

    /*
          Lift the iris slightly beneath the upper lid.
      */

    irisLift: 7.2,

    /*
          Lid-edge line widths.
      */

    upperLidWidth: 1.25,
    lowerLidWidth: 0.95,

    /*
          Eyelid surface dimensions.

          These are measured relative to the calculated eye
          width so that both small and large eyes remain
          proportionate.
      */

    upperSurfaceDepthScale: 0.095,
    lowerSurfaceDepthScale: 0.085,

    upperSurfaceMinimum: 7,
    upperSurfaceMaximum: 16,

    lowerSurfaceMinimum: 6,
    lowerSurfaceMaximum: 14,

    /*
          Surface appearance.

          By default the renderer uses the existing FaceLab
          skin gradient when available.
      */

    upperSurfaceFill: "url(#faceLabUpperLidGradient)",

    lowerSurfaceFill: "url(#faceLabLowerLidGradient)",

    upperSurfaceOpacity: 0.96,
    lowerSurfaceOpacity: 0.92,

    /*
          Lid creases.
      */

    upperCreaseWidth: 1.05,
    lowerCreaseWidth: 0.72,

    upperCreaseOpacity: 0.22,
    lowerCreaseOpacity: 0.13,

    upperCreaseOffsetScale: 0.064,
    lowerCreaseOffsetScale: 0.03,

    upperCreaseStart: 0.18,
    upperCreaseEnd: 0.84,

    lowerCreaseStart: 0.18,
    lowerCreaseEnd: 0.82,

    /*
          Tear duct.

          Version 2 deliberately keeps this small and
          integrated into the inner canthus.
      */

    tearDuctOpacity: 0.58,
    tearDuctLengthScale: 0.032,
    tearDuctHeightScale: 0.013,

    /*
        Tear-duct placement.

        X moves along the eye axis:
        positive values move toward the iris.

        Y moves vertically in SVG coordinates:
        positive values move downward.
    */

    tearDuctOffsetX: 0, // retained for compatibility; 5.2.6a uses lid endpoints
    tearDuctOffsetY: 0, // retained for compatibility; 5.2.6a uses lid endpoints

    /*
          Highlight.
      */

    highlightScale: 0.11,
    highlightOffsetScale: 0.18,
  });

  /*
     EDITABLE TEAR-DUCT LANDMARKS

     These are renderer-level offsets from the true medial
     canthus. FaceLab/EyeBuilder can expose these as handles.
     Keeping them here means the rendered duct always uses
     the same editable position.
  */

  const tearDuctLandmarks = {
    left: { x: 0, y: 0 },
    right: { x: 0, y: 0 },
  };

  function getTearDuctLandmark(side) {
    const value = tearDuctLandmarks[side];

    return value
      ? { x: value.x, y: value.y }
      : { x: 0, y: 0 };
  }

  function setTearDuctLandmark(side, x, y) {
    if (!tearDuctLandmarks[side]) {
      return false;
    }

    tearDuctLandmarks[side].x =
      Number.isFinite(Number(x)) ? Number(x) : 0;

    tearDuctLandmarks[side].y =
      Number.isFinite(Number(y)) ? Number(y) : 0;

    return true;
  }

  /* ==========================
     BASIC HELPERS
  ========================== */

  function number(value, fallback) {
    const resolved = Number(value);

    return Number.isFinite(resolved) ? resolved : fallback;
  }

  function clamp(value, minimum, maximum) {
    return Math.max(minimum, Math.min(maximum, value));
  }

  function mix(start, end, amount) {
    return start + (end - start) * amount;
  }

  function point(x, y) {
    return {
      x: number(x, 0),

      y: number(y, 0),
    };
  }

  function copyPoint(source) {
    return point(source.x, source.y);
  }

  function addPoints(first, second) {
    return point(first.x + second.x, first.y + second.y);
  }

  function subtractPoints(first, second) {
    return point(first.x - second.x, first.y - second.y);
  }

  function scalePoint(source, amount) {
    return point(source.x * amount, source.y * amount);
  }

  function mixPoints(first, second, amount) {
    return point(
      mix(first.x, second.x, amount),

      mix(first.y, second.y, amount),
    );
  }

  function vectorLength(vector) {
    return Math.hypot(vector.x, vector.y);
  }

  function normalizeVector(vector) {
    const length = vectorLength(vector);

    if (length < 0.0001) {
      return point(1, 0);
    }

    return point(vector.x / length, vector.y / length);
  }

  function perpendicularVector(vector) {
    return point(-vector.y, vector.x);
  }

  function reversePointArray(points) {
    return points.slice().reverse().map(copyPoint);
  }

  /* ==========================
     DOM HELPERS
  ========================== */

  function getElement(side, suffix) {
    return document.getElementById(`${side}${suffix}`);
  }

  function createSvgPath(id) {
    const path = document.createElementNS(SVG_NAMESPACE, "path");

    path.setAttribute("id", id);

    path.style.pointerEvents = "none";

    return path;
  }

  function ensureSvgDefinitions() {
    const svg =
      document.getElementById("face") ||
      document.querySelector("svg");

    if (!svg) {
      return null;
    }

    let definitions = svg.querySelector("defs");

    if (!definitions) {
      definitions = document.createElementNS(
        SVG_NAMESPACE,
        "defs",
      );

      svg.insertBefore(definitions, svg.firstChild);
    }

    return definitions;
  }

  function ensureLinearGradient(id, coordinates, stops) {
    const definitions = ensureSvgDefinitions();

    if (!definitions) {
      return null;
    }

    let gradient = document.getElementById(id);

    if (!gradient) {
      gradient = document.createElementNS(
        SVG_NAMESPACE,
        "linearGradient",
      );

      gradient.setAttribute("id", id);
      definitions.appendChild(gradient);
    }

    gradient.setAttribute("x1", coordinates.x1);
    gradient.setAttribute("y1", coordinates.y1);
    gradient.setAttribute("x2", coordinates.x2);
    gradient.setAttribute("y2", coordinates.y2);

    gradient.replaceChildren();

    stops.forEach(function addStop(stopData) {
      const stop = document.createElementNS(
        SVG_NAMESPACE,
        "stop",
      );

      stop.setAttribute("offset", stopData.offset);
      stop.setAttribute("stop-color", stopData.color);

      if (stopData.opacity !== undefined) {
        stop.setAttribute("stop-opacity", stopData.opacity);
      }

      gradient.appendChild(stop);
    });

    return gradient;
  }

  function ensureRadialGradient(
    id,
    attributes,
    stops,
  ) {
    const definitions = ensureSvgDefinitions();

    if (!definitions) {
      return null;
    }

    let gradient = document.getElementById(id);

    if (!gradient) {
      gradient = document.createElementNS(
        SVG_NAMESPACE,
        "radialGradient",
      );

      gradient.setAttribute("id", id);
      definitions.appendChild(gradient);
    }

    Object.keys(attributes).forEach(
      function setGradientAttribute(name) {
        gradient.setAttribute(
          name,
          attributes[name],
        );
      },
    );

    gradient.replaceChildren();

    stops.forEach(function addStop(stopData) {
      const stop = document.createElementNS(
        SVG_NAMESPACE,
        "stop",
      );

      stop.setAttribute(
        "offset",
        stopData.offset,
      );

      stop.setAttribute(
        "stop-color",
        stopData.color,
      );

      if (stopData.opacity !== undefined) {
        stop.setAttribute(
          "stop-opacity",
          stopData.opacity,
        );
      }

      gradient.appendChild(stop);
    });

    return gradient;
  }

  function ensureEyeGradients() {
    ensureLinearGradient(
      "faceLabUpperLidGradient",
      { x1: "0%", y1: "0%", x2: "0%", y2: "100%" },
      [
        { offset: "0%", color: "var(--skin-mid)", opacity: "0.48" },
        { offset: "46%", color: "var(--skin-light)", opacity: "0.88" },
        { offset: "100%", color: "var(--skin-dark)", opacity: "0.36" },
      ],
    );

    ensureLinearGradient(
      "faceLabLowerLidGradient",
      { x1: "0%", y1: "0%", x2: "0%", y2: "100%" },
      [
        { offset: "0%", color: "var(--skin-light)", opacity: "0.68" },
        { offset: "56%", color: "var(--skin-mid)", opacity: "0.52" },
        { offset: "100%", color: "var(--skin-dark)", opacity: "0.22" },
      ],
    );

    ensureLinearGradient(
      "faceLabScleraGradient",
      {
        x1: "0%",
        y1: "50%",
        x2: "100%",
        y2: "50%",
      },
      [
        {
          offset: "0%",
          color: "#b8aaa2",
        },
        {
          offset: "12%",
          color: "#d7d1cd",
        },
        {
          offset: "30%",
          color: "#f3f2f1",
        },
        {
          offset: "50%",
          color: "#ffffff",
        },
        {
          offset: "70%",
          color: "#f3f2f1",
        },
        {
          offset: "88%",
          color: "#d7d1cd",
        },
        {
          offset: "100%",
          color: "#b8aaa2",
        },
      ],
    );
  }

  function insertBeforeElement(parent, element, reference) {
    if (!parent || !element) {
      return;
    }

    if (reference && reference.parentNode === parent) {
      parent.insertBefore(element, reference);

      return;
    }

    parent.appendChild(element);
  }

  function ensureSurfaceElement(side, surfaceSuffix, edgeElement) {
    const id = `${side}${surfaceSuffix}`;

    let element = document.getElementById(id);

    if (element) {
      return element;
    }

    element = createSvgPath(id);

    const parent = edgeElement && edgeElement.parentNode;

    if (!parent) {
      return element;
    }

    /*
        Insert the filled surface immediately before the edge
        so the darker edge remains visible on top.
    */

    insertBeforeElement(parent, element, edgeElement);

    return element;
  }

  function ensureAnatomyElement(
    side,
    suffix,
    referenceElement,
  ) {
    const id = `${side}${suffix}`;

    let element = document.getElementById(id);

    if (element) {
      return element;
    }

    element = createSvgPath(id);

    const parent =
      referenceElement &&
      referenceElement.parentNode;

    if (!parent) {
      return element;
    }

    insertBeforeElement(
      parent,
      element,
      referenceElement,
    );

    return element;
  }

  function setPath(element, path, transform) {
    if (!element) {
      return;
    }

    element.setAttribute("d", path || "");

    if (transform) {
      element.setAttribute("transform", transform);
    } else {
      element.removeAttribute("transform");
    }
  }

  function setCircle(element, centerX, centerY, radius, transform) {
    if (!element) {
      return;
    }

    element.setAttribute("cx", centerX);

    element.setAttribute("cy", centerY);

    element.setAttribute("r", Math.max(0, radius));

    if (transform) {
      element.setAttribute("transform", transform);
    } else {
      element.removeAttribute("transform");
    }
  }

  function styleCurve(element, width, opacity) {
    if (!element) {
      return;
    }

    element.style.strokeWidth = `${width}px`;

    element.style.strokeLinecap = "round";

    element.style.strokeLinejoin = "round";

    element.style.opacity = String(opacity);

    element.style.fill = "none";

    element.style.pointerEvents = "none";
  }

  function styleSurface(element, fill, opacity) {
    if (!element) {
      return;
    }

    element.style.fill = fill;

    element.style.opacity = String(opacity);

    element.style.stroke = "none";

    element.style.pointerEvents = "none";
  }

  /* ==========================
     SAMPLE HELPERS
  ========================== */

  function resolveSamplePoint(sample) {
    if (!sample) {
      return null;
    }

    if (
      sample.point &&
      Number.isFinite(Number(sample.point.x)) &&
      Number.isFinite(Number(sample.point.y))
    ) {
      return copyPoint(sample.point);
    }

    if (
      Number.isFinite(Number(sample.x)) &&
      Number.isFinite(Number(sample.y))
    ) {
      return point(sample.x, sample.y);
    }

    return null;
  }

  function extractCurvePoints(anatomy, name) {
    const directSamples = anatomy[`${name}Samples`];

    if (Array.isArray(directSamples) && directSamples.length > 1) {
      return directSamples.map(resolveSamplePoint).filter(Boolean);
    }

    const curve = anatomy[name];

    if (curve && Array.isArray(curve.samples) && curve.samples.length > 1) {
      return curve.samples.map(resolveSamplePoint).filter(Boolean);
    }

    return [];
  }

  function calculateEyeAxis(anatomy) {
    const landmarks =
      anatomy.landmarks || anatomy.opening?.resolvedLandmarks || {};

    const inner = landmarks.innerCanthus;

    const outer = landmarks.outerCanthus;

    if (inner && outer) {
      const axis = normalizeVector(subtractPoints(outer, inner));

      let upperNormal = perpendicularVector(axis);

      if (upperNormal.y > 0) {
        upperNormal = scalePoint(upperNormal, -1);
      }

      return {
        inner: copyPoint(inner),

        outer: copyPoint(outer),

        axis: axis,

        upperNormal: upperNormal,

        lowerNormal: scalePoint(upperNormal, -1),

        width: Math.max(1, vectorLength(subtractPoints(outer, inner))),
      };
    }

    const upperPoints = extractCurvePoints(anatomy, "upperLid");

    if (upperPoints.length > 1) {
      const first = upperPoints[0];

      const last = upperPoints[upperPoints.length - 1];

      const axis = normalizeVector(subtractPoints(last, first));

      let upperNormal = perpendicularVector(axis);

      if (upperNormal.y > 0) {
        upperNormal = scalePoint(upperNormal, -1);
      }

      return {
        inner: copyPoint(first),

        outer: copyPoint(last),

        axis: axis,

        upperNormal: upperNormal,

        lowerNormal: scalePoint(upperNormal, -1),

        width: Math.max(1, vectorLength(subtractPoints(last, first))),
      };
    }

    return {
      inner: point(0, 0),

      outer: point(1, 0),

      axis: point(1, 0),

      upperNormal: point(0, -1),

      lowerNormal: point(0, 1),

      width: 1,
    };
  }

  function orientPoints(points, startReference) {
    if (!points || points.length < 2) {
      return points || [];
    }

    const firstDistance = vectorLength(
      subtractPoints(points[0], startReference),
    );

    const lastDistance = vectorLength(
      subtractPoints(points[points.length - 1], startReference),
    );

    if (lastDistance < firstDistance) {
      return reversePointArray(points);
    }

    return points.map(copyPoint);
  }

  /* ==========================
     PATH GENERATION
  ========================== */

  function createSmoothPath(points) {
    if (!points || points.length === 0) {
      return "";
    }

    if (points.length === 1) {
      return `M ${points[0].x} ` + `${points[0].y}`;
    }

    const commands = [`M ${points[0].x} ${points[0].y}`];

    for (let index = 1; index < points.length; index += 1) {
      const previous = points[Math.max(0, index - 2)];

      const current = points[index - 1];

      const next = points[index];

      const after = points[Math.min(points.length - 1, index + 1)];

      const control1 = point(
        current.x + (next.x - previous.x) / 6,

        current.y + (next.y - previous.y) / 6,
      );

      const control2 = point(
        next.x - (after.x - current.x) / 6,

        next.y - (after.y - current.y) / 6,
      );

      commands.push(
        [
          "C",

          control1.x,
          control1.y,

          control2.x,
          control2.y,

          next.x,
          next.y,
        ].join(" "),
      );
    }

    return commands.join(" ");
  }

  function createClosedRibbonPath(edgePoints, outerPoints) {
    if (edgePoints.length < 2 || outerPoints.length < 2) {
      return "";
    }

    const edgePath = createSmoothPath(edgePoints);

    const reversedOuter = reversePointArray(outerPoints);

    const outerPath = createSmoothPath(reversedOuter).replace(
      /^M\s+[-\d.eE+]+\s+[-\d.eE+]+/,
      "",
    );

    return [edgePath, outerPath, "Z"].join(" ");
  }

  /* ==========================
     SURFACE PROFILES
  ========================== */

  function upperSurfaceProfile(amount) {
    const t = clamp(amount, 0, 1);

    const arch = Math.pow(
      Math.max(0, Math.sin(Math.PI * t)),
      0.68,
    );

    const innerRelease = clamp(t / 0.11, 0, 1);

    const outerRelease = clamp((1 - t) / 0.1, 0, 1);

    const centerFullness =
      0.84 +
      0.24 *
        Math.exp(
          -Math.pow((t - 0.56) / 0.24, 2),
        );

    const temporalBias = mix(0.96, 1.05, t);

    return (
      arch *
      innerRelease *
      outerRelease *
      centerFullness *
      temporalBias
    );
  }

  function lowerSurfaceProfile(amount) {
    const t = clamp(amount, 0, 1);

    /*
        Broad enough to read as actual lower-lid tissue,
        while tapering cleanly into both canthi.
    */

    const arch = Math.pow(
      Math.max(0, Math.sin(Math.PI * t)),
      1.05,
    );

    const innerRelease = clamp(t / 0.22, 0, 1);

    const outerRelease = clamp((1 - t) / 0.22, 0, 1);

    /*
        Fullest just beneath the iris, with a slight
        temporal shift instead of perfect symmetry.
    */

    const centralRoll =
      0.68 +
      0.58 *
        Math.exp(
          -Math.pow((t - 0.56) / 0.18, 2),
        );

    return (
      arch *
      innerRelease *
      outerRelease *
      centralRoll
    );
  }

  function creaseProfile(amount) {
    const t = clamp(amount, 0, 1);

    return Math.pow(
      Math.sin(Math.PI * t),

      0.78,
    );
  }

  /* ==========================
     SURFACE BUILDING
  ========================== */

  function offsetPoints(
    sourcePoints,
    normal,
    maximumDistance,
    profileFunction,
  ) {
    const lastIndex = Math.max(1, sourcePoints.length - 1);

    return sourcePoints.map(function offsetPoint(source, index) {
      const amount = index / lastIndex;

      const profile = profileFunction(amount);

      return addPoints(
        source,

        scalePoint(normal, maximumDistance * profile),
      );
    });
  }

  function slicePointsByAmount(points, startAmount, endAmount) {
    if (!points || points.length < 2) {
      return [];
    }

    const startIndex = clamp(
      Math.floor(startAmount * (points.length - 1)),

      0,
      points.length - 1,
    );

    const endIndex = clamp(
      Math.ceil(endAmount * (points.length - 1)),

      startIndex + 1,
      points.length - 1,
    );

    return points.slice(startIndex, endIndex + 1);
  }

  function buildLidSurfaces(anatomy, options) {
    const axisData = calculateEyeAxis(anatomy);

    let upperPoints = extractCurvePoints(anatomy, "upperLid");

    let lowerPoints = extractCurvePoints(anatomy, "lowerLid");

    upperPoints = orientPoints(upperPoints, axisData.inner);

    lowerPoints = orientPoints(lowerPoints, axisData.inner);

    const upperDepth = clamp(
      axisData.width * options.upperSurfaceDepthScale,

      options.upperSurfaceMinimum,
      options.upperSurfaceMaximum,
    );

    const lowerDepth = clamp(
      axisData.width * options.lowerSurfaceDepthScale,

      options.lowerSurfaceMinimum,
      options.lowerSurfaceMaximum,
    );

    const upperOuterPoints = offsetPoints(
      upperPoints,
      axisData.upperNormal,
      upperDepth,
      upperSurfaceProfile,
    );

    const lowerOuterPoints = offsetPoints(
      lowerPoints,
      axisData.lowerNormal,
      lowerDepth,
      lowerSurfaceProfile,
    );

    return {
      axisData: axisData,

      upperPoints: upperPoints,

      lowerPoints: lowerPoints,

      upperOuterPoints: upperOuterPoints,

      lowerOuterPoints: lowerOuterPoints,

      upperSurfacePath: createClosedRibbonPath(upperPoints, upperOuterPoints),

      lowerSurfacePath: createClosedRibbonPath(lowerPoints, lowerOuterPoints),

      upperDepth: upperDepth,

      lowerDepth: lowerDepth,
    };
  }

  /* ==========================
     CREASE BUILDING
  ========================== */

  function createGeneratedCreasePath(
    sourcePoints,
    normal,
    offsetDistance,
    startAmount,
    endAmount,
  ) {
    const selectedPoints = slicePointsByAmount(
      sourcePoints,
      startAmount,
      endAmount,
    );

    if (selectedPoints.length < 2) {
      return "";
    }

    const lastIndex = Math.max(1, selectedPoints.length - 1);

    const creasePoints = selectedPoints.map(
      function createCreasePoint(source, index) {
        const amount = index / lastIndex;

        const profile = creaseProfile(amount);

        return addPoints(
          source,

          scalePoint(
            normal,

            offsetDistance * (0.72 + profile * 0.28),
          ),
        );
      },
    );

    return createSmoothPath(creasePoints);
  }

  /* ==========================
     TEAR DUCT
  ========================== */

  function createTearDuctSurfacePath(anatomy, side, options) {
    if (!anatomy) {
      return "";
    }

    const axisData = calculateEyeAxis(anatomy);

    const landmarks =
      anatomy.landmarks || anatomy.opening?.resolvedLandmarks || {};

    const inner = landmarks.innerCanthus || axisData.inner;

    if (!inner) {
      return "";
    }

    /*
        Move from the inner canthus toward the nose.

        Left eye:
        nasal direction is generally positive X.

        Right eye:
        nasal direction is generally negative X.

        Using the side explicitly prevents a tear-duct shape
        from appearing on the outer corner.
    */

    const nasalDirection = side === "left" ? point(1, 0) : point(-1, 0);

    /*
        Blend the horizontal nasal direction with the reverse
        eye axis. This keeps the tear duct attached correctly
        even when the eye is rotated.
    */

    const reverseAxis = scalePoint(axisData.axis, -1);

    let ductDirection = normalizeVector(addPoints(nasalDirection, reverseAxis));

    if (Math.abs(ductDirection.x) < 0.25) {
      ductDirection = nasalDirection;
    }

    const ductLength = clamp(
      axisData.width * options.tearDuctLengthScale,

      3,
      8,
    );

    const ductHeight = clamp(
      axisData.width * options.tearDuctHeightScale,

      1.6,
      4,
    );

    const tip = addPoints(
      inner,

      scalePoint(ductDirection, ductLength),
    );

    const upper = addPoints(
      inner,

      scalePoint(axisData.upperNormal, ductHeight * 0.52),
    );

    const lower = addPoints(
      inner,

      scalePoint(axisData.lowerNormal, ductHeight * 0.7),
    );

    const upperControl = mixPoints(upper, tip, 0.62);

    const lowerControl = mixPoints(lower, tip, 0.62);

    return [
      `M ${upper.x} ${upper.y}`,

      `C ${upperControl.x} ${upperControl.y}`,
      `${tip.x} ${tip.y - ductHeight * 0.2}`,
      `${tip.x} ${tip.y}`,

      `C ${tip.x} ${tip.y + ductHeight * 0.2}`,
      `${lowerControl.x} ${lowerControl.y}`,
      `${lower.x} ${lower.y}`,

      `Q ${inner.x} ${inner.y}`,
      `${upper.x} ${upper.y}`,

      "Z",
    ].join(" ");
  }

  /* ==========================
     ELEMENT COLLECTION
  ========================== */

  function getRequiredElements(side) {
    const elements = {
      socket:
        getElement(side, "EyeSocket"),

      white:
        getElement(side, "EyeWhite"),

      clipPath:
        getElement(side, "EyeClipPath"),

      iris:
        getElement(side, "Iris"),

      irisInner:
        getElement(side, "IrisInner"),

      pupil:
        getElement(side, "Pupil"),

      highlight:
        getElement(side, "EyeHighlight"),

      upperLid:
        getElement(side, "UpperLid"),

      lowerLid:
        getElement(side, "LowerLid"),

      upperCrease:
        getElement(side, "UpperLidCrease"),

      lowerCrease:
        getElement(side, "LowerLidCrease"),

      tearDuct:
        getElement(side, "TearDuct"),
    };

    elements.upperFold =
      ensureAnatomyElement(
        side,
        "UpperLidFold",
        elements.upperLid,
      );

    elements.upperSurface =
      ensureSurfaceElement(
        side,
        "UpperLidSurface",
        elements.upperLid,
      );

    elements.lowerSurface =
      ensureSurfaceElement(
        side,
        "LowerLidSurface",
        elements.lowerLid,
      );

    elements.plica =
      ensureAnatomyElement(
        side,
        "Plica",
        elements.tearDuct,
      );

    return elements;
  }

  function validateElements(side, elements) {
    const required = [
      "white",
      "clipPath",
      "iris",
      "irisInner",
      "pupil",
      "highlight",
      "upperLid",
    ];

    const missing = required.filter(function findMissing(name) {
      return !elements[name];
    });

    if (missing.length === 0) {
      return true;
    }

    console.warn(
      `EyeRenderer could not find required ${side} eye elements: ${missing.join(", ")}`,
    );

    return false;
  }

  /* ==========================
     SOCKET
  ========================== */

  function renderSocket(
    elements,
    anatomy,
    centerX,
    centerY,
    rotation,
    options,
  ) {
    if (!elements.socket || !anatomy.socket) {
      return;
    }

    setPath(elements.socket, anatomy.socket.path, null);

    const socketLiftY =
      number(options.socketLiftY, -8);

    elements.socket.setAttribute(
      "transform",
      [
        `translate(0 ${socketLiftY})`,
        `rotate(${rotation * 1.5} ${centerX} ${centerY})`,
      ].join(" "),
    );
  }

  /* ==========================
     OPENING
  ========================== */

  function renderOpening(elements, anatomy, transform) {
    setPath(elements.white, anatomy.opening.path, transform);

    if (elements.white) {
      elements.white.style.fill =
        "url(#faceLabScleraGradient)";
    }

    setPath(elements.clipPath, anatomy.opening.path, transform);
  }

  /* ==========================
     LID SURFACES
  ========================== */

  function renderLidSurfaces(elements, surfaces, anatomy, transform, options) {
    const upperComponent = anatomy.components && anatomy.components.upperLid;

    const lowerComponent = anatomy.components && anatomy.components.lowerLid;

    const upperPath =
      upperComponent && upperComponent.tissuePath
        ? upperComponent.tissuePath
        : surfaces.upperSurfacePath;

    const lowerPath =
      lowerComponent && lowerComponent.tissuePath
        ? lowerComponent.tissuePath
        : surfaces.lowerSurfacePath;

    if (elements.upperSurface) {
      setPath(elements.upperSurface, upperPath, transform);

      styleSurface(
        elements.upperSurface,
        options.upperSurfaceFill,
        options.upperSurfaceOpacity,
      );
    }

    if (elements.lowerSurface) {
      setPath(elements.lowerSurface, lowerPath, transform);

      styleSurface(
        elements.lowerSurface,
        options.lowerSurfaceFill,
        options.lowerSurfaceOpacity,
      );
    }
  }

  /* ==========================
     LID EDGES
  ========================== */

  function buildRenderedLidPath(
    anatomy,
    componentName,
    isUpper,
  ) {
    const component =
      anatomy.components &&
      anatomy.components[componentName];

    if (
      !component ||
      !Array.isArray(component.points) ||
      component.points.length < 2
    ) {
      return anatomy[componentName]
        ? anatomy[componentName].path
        : "";
    }

    const points =
      component.points.map(copyPoint);

    const medial =
      anatomy.components &&
      anatomy.components.medialCanthus;

    const lateral =
      anatomy.components &&
      anatomy.components.lateralCanthus;

    if (medial) {
      points[0] = copyPoint(
        isUpper
          ? medial.upperJoin
          : medial.lowerJoin,
      );
    }

    if (lateral && lateral.point) {
      points[
        points.length - 1
      ] = copyPoint(lateral.point);
    }

    return createSmoothPath(points);
  }

  function renderLidEdges(
    elements,
    anatomy,
    transform,
    options,
  ) {
    const upperPath =
      buildRenderedLidPath(
        anatomy,
        "upperLid",
        true,
      );

    const lowerPath =
      buildRenderedLidPath(
        anatomy,
        "lowerLid",
        false,
      );

    setPath(
      elements.upperLid,
      upperPath,
      transform,
    );

    styleCurve(
      elements.upperLid,
      options.upperLidWidth,
      0.95,
    );

    if (elements.lowerLid) {
      setPath(
        elements.lowerLid,
        lowerPath,
        transform,
      );

      styleCurve(
        elements.lowerLid,
        options.lowerLidWidth,
        0.90,
      );
    }
  }

  /* ==========================
     UPPER LID FOLD
  ========================== */

  function buildUpperLidFoldPath(anatomy, options) {
    const axisData = calculateEyeAxis(anatomy);

    let upperPoints = extractCurvePoints(
      anatomy,
      "upperLid",
    );

    upperPoints = orientPoints(
      upperPoints,
      axisData.inner,
    );

    if (upperPoints.length < 3) {
      return "";
    }

    const selectedPoints = slicePointsByAmount(
      upperPoints,
      options.upperFoldStart,
      options.upperFoldEnd,
    );

    if (selectedPoints.length < 2) {
      return "";
    }

    const foldOffset = clamp(
      axisData.width * options.upperFoldOffsetScale,
      options.upperFoldMinimum,
      options.upperFoldMaximum,
    );

    const lastIndex = Math.max(
      1,
      selectedPoints.length - 1,
    );

    const foldPoints = selectedPoints.map(
      function createFoldPoint(source, index) {
        const amount = index / lastIndex;

        const arch = Math.pow(
          Math.max(0, Math.sin(Math.PI * amount)),
          0.8,
        );

        const innerRelease = clamp(
          amount / 0.22,
          0,
          1,
        );

        const outerRelease = clamp(
          (1 - amount) / 0.26,
          0,
          1,
        );

        const temporalBias = mix(
          0.96,
          1.05,
          amount,
        );

        const distance =
          foldOffset *
          arch *
          innerRelease *
          outerRelease *
          temporalBias;

        return addPoints(
          source,
          scalePoint(
            axisData.upperNormal,
            distance,
          ),
        );
      },
    );

    return createSmoothPath(foldPoints);
  }

  function renderUpperLidFold(
    elements,
    anatomy,
    transform,
    options,
  ) {
    if (!elements.upperFold) {
      return;
    }

    const path = buildUpperLidFoldPath(
      anatomy,
      options,
    );

    setPath(
      elements.upperFold,
      path,
      transform,
    );

    styleCurve(
      elements.upperFold,
      options.upperFoldWidth,
      options.upperFoldOpacity,
    );

    elements.upperFold.style.stroke =
      "rgba(116, 72, 50, 0.72)";
  }

  /* ==========================
     CREASES
  ========================== */

  function renderCreases(elements, surfaces, transform, options) {
    if (elements.upperCrease) {
      const upperOffset =
        surfaces.axisData.width * options.upperCreaseOffsetScale;

      const upperPath = createGeneratedCreasePath(
        surfaces.upperPoints,
        surfaces.axisData.upperNormal,
        upperOffset,
        options.upperCreaseStart,
        options.upperCreaseEnd,
      );

      setPath(elements.upperCrease, upperPath, transform);

      styleCurve(
        elements.upperCrease,
        options.upperCreaseWidth,
        options.upperCreaseOpacity,
      );
    }

    if (elements.lowerCrease) {
      const lowerOffset =
        surfaces.axisData.width * options.lowerCreaseOffsetScale;

      const lowerPath = createGeneratedCreasePath(
        surfaces.lowerPoints,
        surfaces.axisData.lowerNormal,
        lowerOffset,
        options.lowerCreaseStart,
        options.lowerCreaseEnd,
      );

      setPath(elements.lowerCrease, lowerPath, transform);

      styleCurve(
        elements.lowerCrease,
        options.lowerCreaseWidth,
        options.lowerCreaseOpacity,
      );
    }
  }

  /* ==========================
     TEAR DUCT
  ========================== */

  function createRoundedCarunclePath(
    anatomy,
    side,
    options,
  ) {
    const axisData =
      calculateEyeAxis(anatomy);

    let upperPoints =
      extractCurvePoints(
        anatomy,
        "upperLid",
      );

    let lowerPoints =
      extractCurvePoints(
        anatomy,
        "lowerLid",
      );

    upperPoints =
      orientPoints(
        upperPoints,
        axisData.inner,
      );

    lowerPoints =
      orientPoints(
        lowerPoints,
        axisData.inner,
      );

    if (
      upperPoints.length < 2 ||
      lowerPoints.length < 2
    ) {
      return "";
    }

    /*
        Build the tear duct FROM the actual medial ends
        of the upper and lower lids. This prevents the
        caruncle from becoming a detached appendage.
    */

    const upperCorner =
      upperPoints[0];

    const lowerCorner =
      lowerPoints[0];

    const eyeDirection =
      normalizeVector(axisData.axis);

    const length =
      clamp(
        axisData.width *
          options.tearDuctLengthScale,
        2.6,
        4.4,
      );

    /*
        Root sits between the two lid endpoints.
        The visible pink pocket extends inward toward
        the iris rather than outward toward the nose.
    */

    const landmarkOffset =
      getTearDuctLandmark(side);

    const root =
      addPoints(
        axisData.inner,
        point(
          landmarkOffset.x,
          landmarkOffset.y,
        ),
      );

    /*
        The joins remain tied to the actual lid endpoints,
        while the pocket center can be positioned directly
        with the inspector landmark.
    */

    const upperJoin =
      mixPoints(
        upperCorner,
        root,
        0.38,
      );

    const lowerJoin =
      mixPoints(
        lowerCorner,
        root,
        0.38,
      );

    const tip =
      addPoints(
        root,
        scalePoint(
          eyeDirection,
          length,
        ),
      );

    const upperPocket =
      addPoints(
        mixPoints(
          root,
          tip,
          0.58,
        ),
        scalePoint(
          axisData.upperNormal,
          Math.max(
            0.8,
            vectorLength(
              subtractPoints(
                upperCorner,
                lowerCorner,
              ),
            ) * 0.18,
          ),
        ),
      );

    const lowerPocket =
      addPoints(
        mixPoints(
          root,
          tip,
          0.58,
        ),
        scalePoint(
          axisData.lowerNormal,
          Math.max(
            0.8,
            vectorLength(
              subtractPoints(
                upperCorner,
                lowerCorner,
              ),
            ) * 0.18,
          ),
        ),
      );

    return [
      `M ${upperJoin.x} ${upperJoin.y}`,

      `C ${mix(upperJoin.x, upperPocket.x, 0.55)} ${mix(upperJoin.y, upperPocket.y, 0.55)}`,
      `${upperPocket.x} ${upperPocket.y}`,
      `${tip.x} ${tip.y}`,

      `C ${lowerPocket.x} ${lowerPocket.y}`,
      `${mix(lowerPocket.x, lowerJoin.x, 0.55)} ${mix(lowerPocket.y, lowerJoin.y, 0.55)}`,
      `${lowerJoin.x} ${lowerJoin.y}`,

      `Q ${root.x} ${root.y}`,
      `${upperJoin.x} ${upperJoin.y}`,

      "Z",
    ].join(" ");
  }

  function renderTearDuct(
    elements,
    anatomy,
    side,
    transform,
    options,
  ) {
    const medial =
      anatomy.components &&
      anatomy.components.medialCanthus;

    /*
        Use the renderer-owned rounded caruncle rather than
        the much smaller geometry placeholder. This makes
        the tear duct visibly anatomical while remaining
        attached to the existing inner canthus.
    */

    const path =
      createRoundedCarunclePath(
        anatomy,
        side,
        options,
      );

    if (elements.tearDuct) {
      setPath(
        elements.tearDuct,
        path,
        transform,
      );

      elements.tearDuct.style.fill =
        "#c8847c";

      elements.tearDuct.style.stroke =
        "#79524d";

      elements.tearDuct.style.strokeWidth =
        "0.24px";

      elements.tearDuct.style.strokeLinejoin =
        "round";

      elements.tearDuct.style.opacity =
        String(options.tearDuctOpacity);

      elements.tearDuct.style.pointerEvents =
        "none";
    }

    const plicaPath =
      medial &&
      medial.plica &&
      medial.plica.path;

    if (elements.plica) {
      setPath(
        elements.plica,
        plicaPath || "",
        transform,
      );

      elements.plica.style.fill =
        "#e8b5a7";

      elements.plica.style.stroke =
        "none";

      elements.plica.style.opacity =
        plicaPath ? "0.22" : "0";

      elements.plica.style.pointerEvents =
        "none";
    }
  }

  /* ==========================
     IRIS POSITION
  ========================== */

  function resolveIrisPosition(
    anatomy,
    eyeSettings,
    animationState,
    animatedEyeHeight,
    options,
  ) {
    const sourceRadius = number(anatomy.iris && anatomy.iris.radius, 0);

    const irisRadius = Math.max(
      1,

      sourceRadius * options.irisScale,
    );

    const pupilRadius = Math.min(
      irisRadius * 0.72,

      Math.max(
        1,

        number(anatomy.pupil && anatomy.pupil.radius, 1),
      ),
    );

    const maximumIrisX = Math.max(
      0,

      number(eyeSettings.eyeWidth, 78) / 2 - irisRadius - 5,
    );

    const maximumIrisY = Math.max(
      0,

      animatedEyeHeight / 2 - irisRadius - 2,
    );

    const gazeX = clamp(
      number(eyeSettings.pupilX, 0) + number(animationState.lookX, 0),

      -maximumIrisX,
      maximumIrisX,
    );

    const gazeY = clamp(
      number(eyeSettings.pupilY, 0) + number(animationState.lookY, 0),

      -maximumIrisY,
      maximumIrisY,
    );

    return {
      x: anatomy.iris.center.x + gazeX,

      y: anatomy.iris.center.y + gazeY - options.irisLift,

      irisRadius: irisRadius,

      pupilRadius: pupilRadius,
    };
  }

  /* ==========================
     IRIS LAYERS
  ========================== */

  function renderIrisLayers(
    elements,
    anatomy,
    eyeSettings,
    animationState,
    animatedEyeHeight,
    transform,
    options,
  ) {
    const placement = resolveIrisPosition(
      anatomy,
      eyeSettings,
      animationState,
      animatedEyeHeight,
      options,
    );

    setCircle(
      elements.iris,
      placement.x,
      placement.y,
      placement.irisRadius,
      transform,
    );

    setCircle(
      elements.irisInner,
      placement.x,
      placement.y,
      placement.irisRadius * 0.68,
      transform,
    );

    setCircle(
      elements.pupil,
      placement.x,
      placement.y,
      placement.pupilRadius,
      transform,
    );

    const irisSetting = number(eyeSettings.irisSize, placement.irisRadius * 2);

    const highlightRadius = Math.max(
      1.6,

      irisSetting * options.highlightScale,
    );

    const highlightOffset = irisSetting * options.highlightOffsetScale;

    setCircle(
      elements.highlight,

      placement.x - highlightOffset,

      placement.y - highlightOffset,

      highlightRadius,

      transform,
    );

    return placement;
  }

  /* ==========================
     MAIN RENDER
  ========================== */

  function render(input) {
    if (!input || !input.side || !input.anatomy) {
      console.warn("EyeRenderer.render requires side and anatomy.");

      return null;
    }

    const side = input.side;

    const anatomy = input.anatomy;

    ensureEyeGradients();

    const options = {
      ...DEFAULT_RENDER_OPTIONS,
      ...(input.options || {}),
    };

    const elements = getRequiredElements(side);

    if (!validateElements(side, elements)) {
      return null;
    }

    const transform = anatomy.transform || "";

    const surfaces = buildLidSurfaces(anatomy, options);

    /*
        Rendering order:

        1. socket
        2. sclera and clip
        3. iris, pupil and highlight
        4. filled eyelid surfaces
        5. lid edges
        6. creases
        7. tear duct

        The new surface elements are automatically inserted
        directly beneath their corresponding edge elements.
    */

    renderSocket(
      elements,
      anatomy,
      number(input.centerX, 0),
      number(input.centerY, 0),
      number(input.rotation, 0),
      options,
    );

    renderOpening(elements, anatomy, transform);

    const irisPlacement = renderIrisLayers(
      elements,
      anatomy,
      input.eyeSettings || {},
      input.animationState || {},
      number(input.animatedEyeHeight, 1),
      transform,
      options,
    );

    renderLidSurfaces(elements, surfaces, anatomy, transform, options);

    renderUpperLidFold(elements, anatomy, transform, options);

    renderLidEdges(elements, anatomy, transform, options);

    renderCreases(elements, surfaces, transform, options);

    renderTearDuct(elements, anatomy, side, transform, options);

    return {
      side: side,

      elements: elements,

      iris: irisPlacement,

      surfaces: surfaces,

      options: options,
    };
  }

  /* ==========================
     PUBLIC API
  ========================== */

  window.EyeRenderer = {
    version: "5.2.7",

    defaults: DEFAULT_RENDER_OPTIONS,

    render: render,

    buildLidSurfaces: buildLidSurfaces,

    buildUpperLidFoldPath: buildUpperLidFoldPath,

    createTearDuctSurfacePath: createTearDuctSurfacePath,

    createRoundedCarunclePath: createRoundedCarunclePath,

    getTearDuctLandmark: getTearDuctLandmark,

    setTearDuctLandmark: setTearDuctLandmark,
  };

  console.log("EyeRenderer 5.2.7 loaded");
})();
