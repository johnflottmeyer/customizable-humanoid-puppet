/* =========================================================
   FACELAB EYE RENDERER
   Version 5.5.9

   5.5.9
   - Flips the tear-duct iris-facing arc to a true concave "(" profile.
   - Keeps one continuous smooth arc from upper edge to lower edge.
   - Preserves duct position, inset, offset, rotation and overall size.
   - Keeps color controls and iris rendering unchanged.
========================================================= */

(function initializeEyeRenderer() {
  "use strict";

  const SVG_NAMESPACE = "http://www.w3.org/2000/svg";

  const DEFAULT_RENDER_OPTIONS = Object.freeze({

    /* SOCKET */

    socketLiftY: -8,

    /* UPPER LID FOLD */

    upperFoldOffsetScale: 0.055,
    upperFoldMinimum: 4.2,
    upperFoldMaximum: 7.5,

    upperFoldWidth: 0.9,
    upperFoldOpacity: 0.2,

    upperFoldStart: 0.12,
    upperFoldEnd: 0.88,

    /* IRIS */

    irisScale: 0.9,
    irisLift: 7.2,

    /*
       Organic iris texture.
    */

    irisFiberCount: 54,

    irisFiberInnerScale: 1.04,
    irisFiberOuterScale: 0.95,

    irisFiberWidthMinimum: 0.24,
    irisFiberWidthMaximum: 0.68,

    irisFiberOpacityMinimum: 0.10,
    irisFiberOpacityMaximum: 0.34,

    irisWarmOpacity: 0.34,

    /*
       Upper-lid shadow over the iris.
       The gradient itself supplies the vertical fade.
    */

    irisTopShadowOpacity: 0.68,

    /*
       Break up the radial "spoke" rhythm.
    */

    irisFiberAngleJitter: 0.16,
    irisFiberCurveJitter: 0.32,
    irisFiberLengthMinimum: 0.52,
    irisFiberLengthMaximum: 1.0,
    irisFiberStartJitter: 0.30,

    /* LID EDGES */

    upperLidWidth: 1.25,
    lowerLidWidth: 0.95,

    /* EYELID SURFACES */

    upperSurfaceDepthScale: 0.095,
    lowerSurfaceDepthScale: 0.085,

    upperSurfaceMinimum: 7,
    upperSurfaceMaximum: 16,

    lowerSurfaceMinimum: 6,
    lowerSurfaceMaximum: 14,

    upperSurfaceFill: "url(#faceLabUpperLidGradient)",
    lowerSurfaceFill: "url(#faceLabLowerLidGradient)",

    upperSurfaceOpacity: 0.96,
    lowerSurfaceOpacity: 0.92,

    /* CREASES */

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

    /* TEAR DUCT */

    tearDuctOpacity: 0.88,

    tearDuctFill: "#d58b82",
    tearDuctStroke: "#87534d",
    tearDuctStrokeWidth: 0.4,

    tearDuctDepthScale: 0.095,
    tearDuctMinimumDepth: 6.5,
    tearDuctMaximumDepth: 8.5,

    tearDuctHalfHeightScale: 0.026,
    tearDuctMinimumHalfHeight: 1.8,
    tearDuctMaximumHalfHeight: 2.6,

tearDuctOffsetY:
        2.6,

      tearDuctInset:
        3.3,

      tearDuctRotation:
        -14,

    /* HIGHLIGHT */

    highlightScale: 0.11,
    highlightOffsetScale: 0.18,
  });

  /* =========================================================
     BASIC HELPERS
  ========================================================= */

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
    return point(
      first.x + second.x,
      first.y + second.y,
    );
  }

  function subtractPoints(first, second) {
    return point(
      first.x - second.x,
      first.y - second.y,
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

    return point(
      vector.x / length,
      vector.y / length,
    );
  }

  function perpendicularVector(vector) {
    return point(
      -vector.y,
      vector.x,
    );
  }

  function rotatePointAround(source, center, degrees) {
    const radians = degrees * Math.PI / 180;

    const cosine = Math.cos(radians);
    const sine = Math.sin(radians);

    const offsetX = source.x - center.x;
    const offsetY = source.y - center.y;

    return point(
      center.x +
        offsetX * cosine -
        offsetY * sine,

      center.y +
        offsetX * sine +
        offsetY * cosine,
    );
  }

  function reversePointArray(points) {
    return points
      .slice()
      .reverse()
      .map(copyPoint);
  }

  /*
     Deterministic pseudo-random value.

     Important:
     iris texture does NOT change every redraw.
  */

  function seededValue(index, seed) {
    const value =
      Math.sin(
        index * 12.9898 +
        seed * 78.233,
      ) * 43758.5453;

    return value - Math.floor(value);
  }

  /* =========================================================
     DOM HELPERS
  ========================================================= */

  function getElement(side, suffix) {
    return document.getElementById(
      `${side}${suffix}`,
    );
  }

  function createSvgPath(id) {
    const path =
      document.createElementNS(
        SVG_NAMESPACE,
        "path",
      );

    path.setAttribute("id", id);

    path.style.pointerEvents = "none";

    return path;
  }

  function createSvgGroup(id) {
    const group =
      document.createElementNS(
        SVG_NAMESPACE,
        "g",
      );

    group.setAttribute("id", id);

    group.style.pointerEvents = "none";

    return group;
  }

  function createSvgCircle(id) {
    const circle =
      document.createElementNS(
        SVG_NAMESPACE,
        "circle",
      );

    circle.setAttribute("id", id);

    circle.style.pointerEvents = "none";

    return circle;
  }

  function ensureSvgDefinitions() {
    const svg =
      document.getElementById("face") ||
      document.querySelector("svg");

    if (!svg) {
      return null;
    }

    let definitions =
      svg.querySelector("defs");

    if (!definitions) {
      definitions =
        document.createElementNS(
          SVG_NAMESPACE,
          "defs",
        );

      svg.insertBefore(
        definitions,
        svg.firstChild,
      );
    }

    return definitions;
  }

  function ensureLinearGradient(
    id,
    coordinates,
    stops,
  ) {
    const definitions =
      ensureSvgDefinitions();

    if (!definitions) {
      return null;
    }

    let gradient =
      document.getElementById(id);

    if (!gradient) {
      gradient =
        document.createElementNS(
          SVG_NAMESPACE,
          "linearGradient",
        );

      gradient.setAttribute("id", id);

      definitions.appendChild(gradient);
    }

    gradient.setAttribute(
      "x1",
      coordinates.x1,
    );

    gradient.setAttribute(
      "y1",
      coordinates.y1,
    );

    gradient.setAttribute(
      "x2",
      coordinates.x2,
    );

    gradient.setAttribute(
      "y2",
      coordinates.y2,
    );

    gradient.replaceChildren();

    stops.forEach(function addStop(stopData) {
      const stop =
        document.createElementNS(
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

      if (
        stopData.opacity !==
        undefined
      ) {
        stop.setAttribute(
          "stop-opacity",
          stopData.opacity,
        );
      }

      gradient.appendChild(stop);
    });

    return gradient;
  }

  function ensureRadialGradient(
    id,
    stops,
  ) {
    const definitions =
      ensureSvgDefinitions();

    if (!definitions) {
      return null;
    }

    let gradient =
      document.getElementById(id);

    if (!gradient) {
      gradient =
        document.createElementNS(
          SVG_NAMESPACE,
          "radialGradient",
        );

      gradient.setAttribute("id", id);

      definitions.appendChild(gradient);
    }

    gradient.setAttribute("cx", "50%");
    gradient.setAttribute("cy", "50%");
    gradient.setAttribute("r", "50%");

    gradient.replaceChildren();

    stops.forEach(function addStop(stopData) {
      const stop =
        document.createElementNS(
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

      if (
        stopData.opacity !==
        undefined
      ) {
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

    /* ==========================
       EYELIDS
    ========================== */

    ensureLinearGradient(
      "faceLabUpperLidGradient",

      {
        x1: "0%",
        y1: "0%",
        x2: "0%",
        y2: "100%",
      },

      [
        {
          offset: "0%",
          color: "var(--skin-mid)",
          opacity: "0.48",
        },

        {
          offset: "46%",
          color: "var(--skin-light)",
          opacity: "0.88",
        },

        {
          offset: "100%",
          color: "var(--skin-dark)",
          opacity: "0.36",
        },
      ],
    );

    ensureLinearGradient(
      "faceLabLowerLidGradient",

      {
        x1: "0%",
        y1: "0%",
        x2: "0%",
        y2: "100%",
      },

      [
        {
          offset: "0%",
          color: "var(--skin-light)",
          opacity: "0.68",
        },

        {
          offset: "56%",
          color: "var(--skin-mid)",
          opacity: "0.52",
        },

        {
          offset: "100%",
          color: "var(--skin-dark)",
          opacity: "0.22",
        },
      ],
    );

    /* ==========================
       SCLERA
    ========================== */

    /*
       SCLERA

       Horizontal-only curvature:
       darker at both corners, clean white through the center.
       No top-to-bottom shadow is applied to the whites.
    */

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
          color: "#bfb1aa",
        },

        {
          offset: "14%",
          color: "#ded8d4",
        },

        {
          offset: "32%",
          color: "#f5f4f3",
        },

        {
          offset: "50%",
          color: "#ffffff",
        },

        {
          offset: "68%",
          color: "#f5f4f3",
        },

        {
          offset: "86%",
          color: "#ded8d4",
        },

        {
          offset: "100%",
          color: "#bfb1aa",
        },
      ],
    );

    /* ==========================
       ORGANIC IRIS

       Notice:
       there are no hard bands here.
    ========================== */

    ensureRadialGradient(
      "faceLabIrisBaseGradient",

      [
        {
          offset: "0%",
          color: "var(--iris-dark)",
        },

        {
          offset: "24%",
          color: "var(--iris-mid)",
        },

        {
          offset: "58%",
          color: "var(--iris-light)",
        },

        {
          offset: "82%",
          color: "var(--iris-mid)",
        },

        {
          offset: "100%",
          color: "var(--iris-dark)",
        },
      ],
    );

    /*
       Warm central pigment.

       Transparent toward edge so this
       does not create another ring.
    */

    ensureRadialGradient(
      "faceLabIrisWarmGradient",

      [
        {
          offset: "0%",
          color: "var(--iris-warm)",
          opacity: "0.74",
        },

        {
          offset: "28%",
          color: "var(--iris-warm)",
          opacity: "0.50",
        },

        {
          offset: "56%",
          color: "var(--iris-warm)",
          opacity: "0.16",
        },

        {
          offset: "100%",
          color: "var(--iris-mid)",
          opacity: "0",
        },
      ],
    );

    /*
       Upper-lid shadow.

       At the top this produces roughly 30-35% darkening,
       then fades away through the middle of the iris.
    */

    ensureLinearGradient(
      "faceLabIrisTopShadowGradient",

      {
        x1: "0%",
        y1: "0%",
        x2: "0%",
        y2: "100%",
      },

      [
        {
          offset: "0%",
          color: "#071014",
          opacity: "0.50",
        },

        {
          offset: "34%",
          color: "#071014",
          opacity: "0.27",
        },

        {
          offset: "62%",
          color: "#071014",
          opacity: "0.06",
        },

        {
          offset: "78%",
          color: "#071014",
          opacity: "0",
        },

        {
          offset: "100%",
          color: "#071014",
          opacity: "0",
        },
      ],
    );
  }

  function insertBeforeElement(
    parent,
    element,
    reference,
  ) {
    if (!parent || !element) {
      return;
    }

    if (
      reference &&
      reference.parentNode === parent
    ) {
      parent.insertBefore(
        element,
        reference,
      );

      return;
    }

    parent.appendChild(element);
  }

  function ensureSurfaceElement(
    side,
    surfaceSuffix,
    edgeElement,
  ) {
    const id =
      `${side}${surfaceSuffix}`;

    let element =
      document.getElementById(id);

    if (element) {
      return element;
    }

    element =
      createSvgPath(id);

    const parent =
      edgeElement &&
      edgeElement.parentNode;

    if (!parent) {
      return element;
    }

    insertBeforeElement(
      parent,
      element,
      edgeElement,
    );

    return element;
  }

  function ensureAnatomyElement(
    side,
    suffix,
    referenceElement,
  ) {
    const id =
      `${side}${suffix}`;

    let element =
      document.getElementById(id);

    if (element) {
      return element;
    }

    element =
      createSvgPath(id);

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

  function ensureIrisFiberGroup(
    side,
    irisElement,
    irisInnerElement,
  ) {
    const id =
      `${side}IrisFibers`;

    let group =
      document.getElementById(id);

    if (group) {
      return group;
    }

    group =
      createSvgGroup(id);

    const parent =
      irisElement &&
      irisElement.parentNode;

    if (!parent) {
      return group;
    }

    /*
       Put texture above iris base
       but below warm center / pupil.
    */

    if (
      irisInnerElement &&
      irisInnerElement.parentNode === parent
    ) {
      parent.insertBefore(
        group,
        irisInnerElement,
      );
    } else {
      parent.appendChild(group);
    }

    return group;
  }

  function ensureIrisTopShadow(
    side,
    irisElement,
    pupilElement,
  ) {
    const id =
      `${side}IrisTopShadow`;

    let element =
      document.getElementById(id);

    if (element) {
      return element;
    }

    element =
      createSvgCircle(id);

    const parent =
      irisElement &&
      irisElement.parentNode;

    if (!parent) {
      return element;
    }

    /*
       Keep the shadow above iris texture / warm pigment,
       but below the pupil and catchlight.
    */

    if (
      pupilElement &&
      pupilElement.parentNode === parent
    ) {
      parent.insertBefore(
        element,
        pupilElement,
      );
    } else {
      parent.appendChild(element);
    }

    return element;
  }

  function setPath(
    element,
    path,
    transform,
  ) {
    if (!element) {
      return;
    }

    element.setAttribute(
      "d",
      path || "",
    );

    if (transform) {
      element.setAttribute(
        "transform",
        transform,
      );
    } else {
      element.removeAttribute(
        "transform",
      );
    }
  }

  function setCircle(
    element,
    centerX,
    centerY,
    radius,
    transform,
  ) {
    if (!element) {
      return;
    }

    element.setAttribute(
      "cx",
      centerX,
    );

    element.setAttribute(
      "cy",
      centerY,
    );

    element.setAttribute(
      "r",
      Math.max(0, radius),
    );

    if (transform) {
      element.setAttribute(
        "transform",
        transform,
      );
    } else {
      element.removeAttribute(
        "transform",
      );
    }
  }

  function styleCurve(
    element,
    width,
    opacity,
  ) {
    if (!element) {
      return;
    }

    element.style.strokeWidth =
      `${width}px`;

    element.style.strokeLinecap =
      "round";

    element.style.strokeLinejoin =
      "round";

    element.style.opacity =
      String(opacity);

    element.style.fill = "none";
    element.style.pointerEvents = "none";
  }

  function styleSurface(
    element,
    fill,
    opacity,
  ) {
    if (!element) {
      return;
    }

    element.style.fill = fill;

    element.style.opacity =
      String(opacity);

    element.style.stroke = "none";
    element.style.pointerEvents = "none";
  }

  /* =========================================================
     SAMPLE HELPERS
  ========================================================= */

  function resolveSamplePoint(sample) {
    if (!sample) {
      return null;
    }

    if (
      sample.point &&
      Number.isFinite(
        Number(sample.point.x),
      ) &&
      Number.isFinite(
        Number(sample.point.y),
      )
    ) {
      return copyPoint(
        sample.point,
      );
    }

    if (
      Number.isFinite(
        Number(sample.x),
      ) &&
      Number.isFinite(
        Number(sample.y),
      )
    ) {
      return point(
        sample.x,
        sample.y,
      );
    }

    return null;
  }

  function extractCurvePoints(
    anatomy,
    name,
  ) {
    const directSamples =
      anatomy[
        `${name}Samples`
      ];

    if (
      Array.isArray(directSamples) &&
      directSamples.length > 1
    ) {
      return directSamples
        .map(resolveSamplePoint)
        .filter(Boolean);
    }

    const curve =
      anatomy[name];

    if (
      curve &&
      Array.isArray(curve.samples) &&
      curve.samples.length > 1
    ) {
      return curve.samples
        .map(resolveSamplePoint)
        .filter(Boolean);
    }

    return [];
  }

  function calculateEyeAxis(anatomy) {
    const landmarks =
      anatomy.landmarks ||
      anatomy.opening
        ?.resolvedLandmarks ||
      {};

    const inner =
      landmarks.innerCanthus;

    const outer =
      landmarks.outerCanthus;

    if (inner && outer) {
      const axis =
        normalizeVector(
          subtractPoints(
            outer,
            inner,
          ),
        );

      let upperNormal =
        perpendicularVector(axis);

      if (upperNormal.y > 0) {
        upperNormal =
          scalePoint(
            upperNormal,
            -1,
          );
      }

      return {
        inner: copyPoint(inner),
        outer: copyPoint(outer),
        axis,

        upperNormal,

        lowerNormal:
          scalePoint(
            upperNormal,
            -1,
          ),

        width:
          Math.max(
            1,

            vectorLength(
              subtractPoints(
                outer,
                inner,
              ),
            ),
          ),
      };
    }

    const upperPoints =
      extractCurvePoints(
        anatomy,
        "upperLid",
      );

    if (upperPoints.length > 1) {
      const first =
        upperPoints[0];

      const last =
        upperPoints[
          upperPoints.length - 1
        ];

      const axis =
        normalizeVector(
          subtractPoints(
            last,
            first,
          ),
        );

      let upperNormal =
        perpendicularVector(axis);

      if (upperNormal.y > 0) {
        upperNormal =
          scalePoint(
            upperNormal,
            -1,
          );
      }

      return {
        inner: copyPoint(first),
        outer: copyPoint(last),

        axis,

        upperNormal,

        lowerNormal:
          scalePoint(
            upperNormal,
            -1,
          ),

        width:
          Math.max(
            1,

            vectorLength(
              subtractPoints(
                last,
                first,
              ),
            ),
          ),
      };
    }

    return {
      inner: point(0, 0),
      outer: point(1, 0),

      axis: point(1, 0),

      upperNormal:
        point(0, -1),

      lowerNormal:
        point(0, 1),

      width: 1,
    };
  }

  function orientPoints(
    points,
    startReference,
  ) {
    if (
      !points ||
      points.length < 2
    ) {
      return points || [];
    }

    const firstDistance =
      vectorLength(
        subtractPoints(
          points[0],
          startReference,
        ),
      );

    const lastDistance =
      vectorLength(
        subtractPoints(
          points[
            points.length - 1
          ],
          startReference,
        ),
      );

    if (
      lastDistance <
      firstDistance
    ) {
      return reversePointArray(
        points,
      );
    }

    return points.map(copyPoint);
  }

  /* =========================================================
     PATH GENERATION
  ========================================================= */

  function createSmoothPath(points) {
    if (
      !points ||
      points.length === 0
    ) {
      return "";
    }

    if (points.length === 1) {
      return (
        `M ${points[0].x} ` +
        `${points[0].y}`
      );
    }

    const commands = [
      `M ${points[0].x} ${points[0].y}`,
    ];

    for (
      let index = 1;
      index < points.length;
      index += 1
    ) {
      const previous =
        points[
          Math.max(
            0,
            index - 2,
          )
        ];

      const current =
        points[index - 1];

      const next =
        points[index];

      const after =
        points[
          Math.min(
            points.length - 1,
            index + 1,
          )
        ];

      const control1 =
        point(
          current.x +
            (
              next.x -
              previous.x
            ) /
              6,

          current.y +
            (
              next.y -
              previous.y
            ) /
              6,
        );

      const control2 =
        point(
          next.x -
            (
              after.x -
              current.x
            ) /
              6,

          next.y -
            (
              after.y -
              current.y
            ) /
              6,
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

  function createClosedRibbonPath(
    edgePoints,
    outerPoints,
  ) {
    if (
      edgePoints.length < 2 ||
      outerPoints.length < 2
    ) {
      return "";
    }

    const edgePath =
      createSmoothPath(
        edgePoints,
      );

    const reversedOuter =
      reversePointArray(
        outerPoints,
      );

    const outerPath =
      createSmoothPath(
        reversedOuter,
      ).replace(
        /^M\s+[-\d.eE+]+\s+[-\d.eE+]+/,
        "",
      );

    return [
      edgePath,
      outerPath,
      "Z",
    ].join(" ");
  }

  /* =========================================================
     SURFACE PROFILES
  ========================================================= */

  function upperSurfaceProfile(amount) {
    const t =
      clamp(
        amount,
        0,
        1,
      );

    const arch =
      Math.pow(
        Math.max(
          0,
          Math.sin(
            Math.PI * t,
          ),
        ),
        0.68,
      );

    const innerRelease =
      clamp(
        t / 0.11,
        0,
        1,
      );

    const outerRelease =
      clamp(
        (1 - t) / 0.1,
        0,
        1,
      );

    const centerFullness =
      0.84 +
      0.24 *
        Math.exp(
          -Math.pow(
            (t - 0.56) /
              0.24,
            2,
          ),
        );

    return (
      arch *
      innerRelease *
      outerRelease *
      centerFullness *
      mix(
        0.96,
        1.05,
        t,
      )
    );
  }

  function lowerSurfaceProfile(amount) {
    const t =
      clamp(
        amount,
        0,
        1,
      );

    const arch =
      Math.pow(
        Math.max(
          0,
          Math.sin(
            Math.PI * t,
          ),
        ),
        1.05,
      );

    const innerRelease =
      clamp(
        t / 0.22,
        0,
        1,
      );

    const outerRelease =
      clamp(
        (1 - t) / 0.22,
        0,
        1,
      );

    const centralRoll =
      0.68 +
      0.58 *
        Math.exp(
          -Math.pow(
            (t - 0.56) /
              0.18,
            2,
          ),
        );

    return (
      arch *
      innerRelease *
      outerRelease *
      centralRoll
    );
  }

  function creaseProfile(amount) {
    const t =
      clamp(
        amount,
        0,
        1,
      );

    return Math.pow(
      Math.sin(
        Math.PI * t,
      ),
      0.78,
    );
  }

  /* =========================================================
     SURFACE BUILDING
  ========================================================= */

  function offsetPoints(
    sourcePoints,
    normal,
    maximumDistance,
    profileFunction,
  ) {
    const lastIndex =
      Math.max(
        1,
        sourcePoints.length - 1,
      );

    return sourcePoints.map(
      function offsetPoint(
        source,
        index,
      ) {
        const amount =
          index /
          lastIndex;

        const profile =
          profileFunction(amount);

        return addPoints(
          source,

          scalePoint(
            normal,
            maximumDistance *
              profile,
          ),
        );
      },
    );
  }

  function slicePointsByAmount(
    points,
    startAmount,
    endAmount,
  ) {
    if (
      !points ||
      points.length < 2
    ) {
      return [];
    }

    const startIndex =
      clamp(
        Math.floor(
          startAmount *
            (
              points.length - 1
            ),
        ),

        0,

        points.length - 1,
      );

    const endIndex =
      clamp(
        Math.ceil(
          endAmount *
            (
              points.length - 1
            ),
        ),

        startIndex + 1,

        points.length - 1,
      );

    return points.slice(
      startIndex,
      endIndex + 1,
    );
  }

  function buildLidSurfaces(
    anatomy,
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

    const upperDepth =
      clamp(
        axisData.width *
          options
            .upperSurfaceDepthScale,

        options
          .upperSurfaceMinimum,

        options
          .upperSurfaceMaximum,
      );

    const lowerDepth =
      clamp(
        axisData.width *
          options
            .lowerSurfaceDepthScale,

        options
          .lowerSurfaceMinimum,

        options
          .lowerSurfaceMaximum,
      );

    const upperOuterPoints =
      offsetPoints(
        upperPoints,

        axisData.upperNormal,

        upperDepth,

        upperSurfaceProfile,
      );

    const lowerOuterPoints =
      offsetPoints(
        lowerPoints,

        axisData.lowerNormal,

        lowerDepth,

        lowerSurfaceProfile,
      );

    return {
      axisData,

      upperPoints,
      lowerPoints,

      upperOuterPoints,
      lowerOuterPoints,

      upperSurfacePath:
        createClosedRibbonPath(
          upperPoints,
          upperOuterPoints,
        ),

      lowerSurfacePath:
        createClosedRibbonPath(
          lowerPoints,
          lowerOuterPoints,
        ),

      upperDepth,
      lowerDepth,
    };
  }

  /* =========================================================
     CREASE BUILDING
  ========================================================= */

  function createGeneratedCreasePath(
    sourcePoints,
    normal,
    offsetDistance,
    startAmount,
    endAmount,
  ) {
    const selectedPoints =
      slicePointsByAmount(
        sourcePoints,
        startAmount,
        endAmount,
      );

    if (
      selectedPoints.length < 2
    ) {
      return "";
    }

    const lastIndex =
      Math.max(
        1,
        selectedPoints.length - 1,
      );

    const creasePoints =
      selectedPoints.map(
        function createCreasePoint(
          source,
          index,
        ) {
          const amount =
            index /
            lastIndex;

          const profile =
            creaseProfile(amount);

          return addPoints(
            source,

            scalePoint(
              normal,

              offsetDistance *
                (
                  0.72 +
                  profile * 0.28
                ),
            ),
          );
        },
      );

    return createSmoothPath(
      creasePoints,
    );
  }

  /* =========================================================
     TEAR DUCT
     Preserved from 5.4.9
  ========================================================= */

  function createTearDuctSurfacePath(
    anatomy,
    side,
    options,
  ) {
    if (!anatomy) {
      return "";
    }

    const axisData =
      calculateEyeAxis(anatomy);

    const landmarks =
      anatomy.landmarks ||
      anatomy.opening
        ?.resolvedLandmarks ||
      {};

    const originalInner =
      landmarks.innerCanthus ||
      axisData.inner;

    if (!originalInner) {
      return "";
    }

    const eyeCenter =
      landmarks.center ||
      landmarks.globeCenter ||
      (
        anatomy.iris &&
        anatomy.iris.center
      ) ||
      mixPoints(
        axisData.inner,
        axisData.outer,
        0.5,
      );

    const inward =
      normalizeVector(
        subtractPoints(
          eyeCenter,
          originalInner,
        ),
      );

    let upperNormal =
      perpendicularVector(inward);

    if (
      upperNormal.y > 0
    ) {
      upperNormal =
        scalePoint(
          upperNormal,
          -1,
        );
    }

    const lowerNormal =
      scalePoint(
        upperNormal,
        -1,
      );

    const inner =
      addPoints(
        originalInner,

        addPoints(
          scalePoint(
            inward,
            options.tearDuctInset,
          ),

          point(
            0,
            options.tearDuctOffsetY,
          ),
        ),
      );

    const depth =
      clamp(
        axisData.width *
          options
            .tearDuctDepthScale,

        options
          .tearDuctMinimumDepth,

        options
          .tearDuctMaximumDepth,
      );

    const halfHeight =
      clamp(
        axisData.width *
          options
            .tearDuctHalfHeightScale,

        options
          .tearDuctMinimumHalfHeight,

        options
          .tearDuctMaximumHalfHeight,
      );

    let innerUpper =
      addPoints(
        inner,

        scalePoint(
          upperNormal,
          halfHeight * 0.12,
        ),
      );

    let innerLower =
      addPoints(
        inner,

        scalePoint(
          lowerNormal,
          halfHeight * 0.16,
        ),
      );

    let upperShoulder =
      addPoints(
        inner,

        addPoints(
          scalePoint(
            inward,
            depth * 0.68,
          ),

          scalePoint(
            upperNormal,
            halfHeight * 0.82,
          ),
        ),
      );

    let lowerShoulder =
      addPoints(
        inner,

        addPoints(
          scalePoint(
            inward,
            depth * 0.66,
          ),

          scalePoint(
            lowerNormal,
            halfHeight * 1.38,
          ),
        ),
      );

    let frontUpper =
      addPoints(
        inner,

        addPoints(
          scalePoint(
            inward,
            depth * 0.93,
          ),

          scalePoint(
            upperNormal,
            halfHeight * 0.48,
          ),
        ),
      );

    let frontLower =
      addPoints(
        inner,

        addPoints(
          scalePoint(
            inward,
            depth * 0.94,
          ),

          scalePoint(
            lowerNormal,
            halfHeight * 0.88,
          ),
        ),
      );

    let upperStartControl =
      addPoints(
        innerUpper,

        addPoints(
          scalePoint(
            inward,
            depth * 0.27,
          ),

          scalePoint(
            upperNormal,
            halfHeight * 0.08,
          ),
        ),
      );

    let upperShoulderControl =
      addPoints(
        upperShoulder,

        scalePoint(
          inward,
          -depth * 0.16,
        ),
      );

    let upperFrontControl1 =
      addPoints(
        upperShoulder,

        scalePoint(
          inward,
          depth * 0.18,
        ),
      );

    let upperFrontControl2 =
      addPoints(
        frontUpper,

        scalePoint(
          upperNormal,
          halfHeight * 0.18,
        ),
      );

    /*
       5.5.6

       Concave eye-facing edge.

       Instead of pushing the middle of the front edge farther
       toward the eyeball, pull the curve controls slightly back
       toward the inner canthus. This makes the broad edge cup
       around the globe rather than bulge into it.

       Left eye  ->  }>
       Right eye ->  <(
    */

    /*
       5.5.9

       TRUE CONCAVE IRIS-FACING ARC

       The upper/lower edge points remain farther toward the iris,
       while the center controls are pulled back toward the inner
       canthus. That reverses the previous slight ")" bulge and
       produces the desired "(" globe-following arc.
    */

    const frontCup =
      addPoints(
        inner,

        scalePoint(
          inward,
          depth * 0.46,
        ),
      );

    let frontRoundUpperControl =
      addPoints(
        frontCup,

        scalePoint(
          upperNormal,
          halfHeight * 0.48,
        ),
      );

    let frontRoundLowerControl =
      addPoints(
        frontCup,

        scalePoint(
          lowerNormal,
          halfHeight * 0.62,
        ),
      );

    let lowerFrontControl1 =
      addPoints(
        frontLower,

        scalePoint(
          lowerNormal,
          halfHeight * 0.30,
        ),
      );

    let lowerFrontControl2 =
      addPoints(
        lowerShoulder,

        scalePoint(
          inward,
          depth * 0.17,
        ),
      );

    let lowerShoulderControl =
      addPoints(
        lowerShoulder,

        addPoints(
          scalePoint(
            inward,
            -depth * 0.19,
          ),

          scalePoint(
            lowerNormal,
            halfHeight * 0.08,
          ),
        ),
      );

    let lowerEndControl =
      addPoints(
        innerLower,

        scalePoint(
          inward,
          depth * 0.25,
        ),
      );

    let innerRoundLower =
      addPoints(
        innerLower,

        scalePoint(
          inward,
          -depth * 0.025,
        ),
      );

    let innerRoundUpper =
      addPoints(
        innerUpper,

        scalePoint(
          inward,
          -depth * 0.025,
        ),
      );

    const baseRotation =
      number(
        options.tearDuctRotation,
        5,
      );

    const rotation =
      side === "left"
        ? -baseRotation
        : baseRotation;

    innerUpper =
      rotatePointAround(
        innerUpper,
        inner,
        rotation,
      );

    innerLower =
      rotatePointAround(
        innerLower,
        inner,
        rotation,
      );

    upperShoulder =
      rotatePointAround(
        upperShoulder,
        inner,
        rotation,
      );

    lowerShoulder =
      rotatePointAround(
        lowerShoulder,
        inner,
        rotation,
      );

    frontUpper =
      rotatePointAround(
        frontUpper,
        inner,
        rotation,
      );

    frontLower =
      rotatePointAround(
        frontLower,
        inner,
        rotation,
      );

    upperStartControl =
      rotatePointAround(
        upperStartControl,
        inner,
        rotation,
      );

    upperShoulderControl =
      rotatePointAround(
        upperShoulderControl,
        inner,
        rotation,
      );

    upperFrontControl1 =
      rotatePointAround(
        upperFrontControl1,
        inner,
        rotation,
      );

    upperFrontControl2 =
      rotatePointAround(
        upperFrontControl2,
        inner,
        rotation,
      );

    frontRoundUpperControl =
      rotatePointAround(
        frontRoundUpperControl,
        inner,
        rotation,
      );

    frontRoundLowerControl =
      rotatePointAround(
        frontRoundLowerControl,
        inner,
        rotation,
      );

    lowerFrontControl1 =
      rotatePointAround(
        lowerFrontControl1,
        inner,
        rotation,
      );

    lowerFrontControl2 =
      rotatePointAround(
        lowerFrontControl2,
        inner,
        rotation,
      );

    lowerShoulderControl =
      rotatePointAround(
        lowerShoulderControl,
        inner,
        rotation,
      );

    lowerEndControl =
      rotatePointAround(
        lowerEndControl,
        inner,
        rotation,
      );

    innerRoundLower =
      rotatePointAround(
        innerRoundLower,
        inner,
        rotation,
      );

    innerRoundUpper =
      rotatePointAround(
        innerRoundUpper,
        inner,
        rotation,
      );

    return [
      `M ${innerUpper.x} ${innerUpper.y}`,

      `C ${upperStartControl.x} ${upperStartControl.y}`,
      `${upperShoulderControl.x} ${upperShoulderControl.y}`,
      `${upperShoulder.x} ${upperShoulder.y}`,

      /*
         5.5.8

         ONE smooth concave arc across the iris-facing edge.
         This replaces the previous upper-front / rounded-front /
         lower-front sequence that created the molar-tooth silhouette.
      */

      `C ${frontRoundUpperControl.x} ${frontRoundUpperControl.y}`,
      `${frontRoundLowerControl.x} ${frontRoundLowerControl.y}`,
      `${lowerShoulder.x} ${lowerShoulder.y}`,

      `C ${lowerShoulderControl.x} ${lowerShoulderControl.y}`,
      `${lowerEndControl.x} ${lowerEndControl.y}`,
      `${innerLower.x} ${innerLower.y}`,

      `C ${innerRoundLower.x} ${innerRoundLower.y}`,
      `${innerRoundUpper.x} ${innerRoundUpper.y}`,
      `${innerUpper.x} ${innerUpper.y}`,

      "Z",
    ].join(" ");
  }

  function createRoundedCarunclePath(
    anatomy,
    side,
    options,
  ) {
    return createTearDuctSurfacePath(
      anatomy,
      side,
      options,
    );
  }

  /* =========================================================
     ELEMENT COLLECTION
  ========================================================= */

  function getRequiredElements(side) {
    const elements = {
      socket:
        getElement(
          side,
          "EyeSocket",
        ),

      white:
        getElement(
          side,
          "EyeWhite",
        ),

      clipPath:
        getElement(
          side,
          "EyeClipPath",
        ),

      iris:
        getElement(
          side,
          "Iris",
        ),

      irisInner:
        getElement(
          side,
          "IrisInner",
        ),

      pupil:
        getElement(
          side,
          "Pupil",
        ),

      highlight:
        getElement(
          side,
          "EyeHighlight",
        ),

      upperLid:
        getElement(
          side,
          "UpperLid",
        ),

      lowerLid:
        getElement(
          side,
          "LowerLid",
        ),

      upperCrease:
        getElement(
          side,
          "UpperLidCrease",
        ),

      lowerCrease:
        getElement(
          side,
          "LowerLidCrease",
        ),

      tearDuct: null,
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

    elements.irisFibers =
      ensureIrisFiberGroup(
        side,
        elements.iris,
        elements.irisInner,
      );

    elements.irisTopShadow =
      ensureIrisTopShadow(
        side,
        elements.iris,
        elements.pupil,
      );

    const existingTearDuct =
      getElement(
        side,
        "TearDuct",
      );

    if (existingTearDuct) {
      elements.tearDuct =
        existingTearDuct;
    } else {
      const eyeParent =
        elements.white &&
        elements.white.parentNode;

      if (eyeParent) {
        elements.tearDuct =
          createSvgPath(
            `${side}TearDuct`,
          );

        eyeParent.appendChild(
          elements.tearDuct,
        );
      }
    }

    if (
      elements.tearDuct &&
      elements.tearDuct.parentNode
    ) {
      elements
        .tearDuct
        .parentNode
        .appendChild(
          elements.tearDuct,
        );
    }

    elements.plica =
      ensureAnatomyElement(
        side,
        "Plica",
        elements.tearDuct,
      );

    return elements;
  }

  function validateElements(
    side,
    elements,
  ) {
    const required = [
      "white",
      "clipPath",
      "iris",
      "irisInner",
      "pupil",
      "highlight",
      "upperLid",
    ];

    const missing =
      required.filter(
        function findMissing(name) {
          return !elements[name];
        },
      );

    if (missing.length === 0) {
      return true;
    }

    console.warn(
      `EyeRenderer could not find required ${side} eye elements: ${missing.join(", ")}`,
    );

    return false;
  }

  /* =========================================================
     SOCKET
  ========================================================= */

  function renderSocket(
    elements,
    anatomy,
    centerX,
    centerY,
    rotation,
    options,
  ) {
    if (
      !elements.socket ||
      !anatomy.socket
    ) {
      return;
    }

    setPath(
      elements.socket,
      anatomy.socket.path,
      null,
    );

    elements.socket.setAttribute(
      "transform",

      [
        `translate(0 ${number(options.socketLiftY, -8)})`,

        `rotate(${rotation * 1.5} ${centerX} ${centerY})`,
      ].join(" "),
    );
  }

  /* =========================================================
     OPENING
  ========================================================= */

  function renderOpening(
    elements,
    anatomy,
    transform,
  ) {
    setPath(
      elements.white,
      anatomy.opening.path,
      transform,
    );

    elements.white.style.fill =
      "url(#faceLabScleraGradient)";

    setPath(
      elements.clipPath,
      anatomy.opening.path,
      transform,
    );
  }

  /* =========================================================
     LID SURFACES
  ========================================================= */

  function renderLidSurfaces(
    elements,
    surfaces,
    anatomy,
    transform,
    options,
  ) {
    const upperComponent =
      anatomy.components &&
      anatomy.components.upperLid;

    const lowerComponent =
      anatomy.components &&
      anatomy.components.lowerLid;

    const upperPath =
      upperComponent &&
      upperComponent.tissuePath
        ? upperComponent.tissuePath
        : surfaces.upperSurfacePath;

    const lowerPath =
      lowerComponent &&
      lowerComponent.tissuePath
        ? lowerComponent.tissuePath
        : surfaces.lowerSurfacePath;

    if (elements.upperSurface) {
      setPath(
        elements.upperSurface,
        upperPath,
        transform,
      );

      styleSurface(
        elements.upperSurface,
        options.upperSurfaceFill,
        options.upperSurfaceOpacity,
      );
    }

    if (elements.lowerSurface) {
      setPath(
        elements.lowerSurface,
        lowerPath,
        transform,
      );

      styleSurface(
        elements.lowerSurface,
        options.lowerSurfaceFill,
        options.lowerSurfaceOpacity,
      );
    }
  }

  /* =========================================================
     LID EDGES
  ========================================================= */

  function buildRenderedLidPath(
    anatomy,
    componentName,
    isUpper,
  ) {
    const component =
      anatomy.components &&
      anatomy.components[
        componentName
      ];

    if (
      !component ||
      !Array.isArray(
        component.points,
      ) ||
      component.points.length < 2
    ) {
      return anatomy[componentName]
        ? anatomy[componentName].path
        : "";
    }

    const points =
      component.points.map(
        copyPoint,
      );

    const medial =
      anatomy.components &&
      anatomy.components
        .medialCanthus;

    const lateral =
      anatomy.components &&
      anatomy.components
        .lateralCanthus;

    if (medial) {
      points[0] =
        copyPoint(
          isUpper
            ? medial.upperJoin
            : medial.lowerJoin,
        );
    }

    if (
      lateral &&
      lateral.point
    ) {
      points[
        points.length - 1
      ] =
        copyPoint(
          lateral.point,
        );
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
        0.9,
      );
    }
  }

  /* =========================================================
     UPPER LID FOLD
  ========================================================= */

  function buildUpperLidFoldPath(
    anatomy,
    options,
  ) {
    const axisData =
      calculateEyeAxis(anatomy);

    let upperPoints =
      extractCurvePoints(
        anatomy,
        "upperLid",
      );

    upperPoints =
      orientPoints(
        upperPoints,
        axisData.inner,
      );

    if (upperPoints.length < 3) {
      return "";
    }

    const selectedPoints =
      slicePointsByAmount(
        upperPoints,
        options.upperFoldStart,
        options.upperFoldEnd,
      );

    if (
      selectedPoints.length < 2
    ) {
      return "";
    }

    const foldOffset =
      clamp(
        axisData.width *
          options
            .upperFoldOffsetScale,

        options.upperFoldMinimum,
        options.upperFoldMaximum,
      );

    const lastIndex =
      Math.max(
        1,
        selectedPoints.length - 1,
      );

    const foldPoints =
      selectedPoints.map(
        function createFoldPoint(
          source,
          index,
        ) {
          const amount =
            index /
            lastIndex;

          const arch =
            Math.pow(
              Math.max(
                0,
                Math.sin(
                  Math.PI *
                    amount,
                ),
              ),
              0.8,
            );

          const innerRelease =
            clamp(
              amount / 0.22,
              0,
              1,
            );

          const outerRelease =
            clamp(
              (1 - amount) /
                0.26,
              0,
              1,
            );

          const distance =
            foldOffset *
            arch *
            innerRelease *
            outerRelease *
            mix(
              0.96,
              1.05,
              amount,
            );

          return addPoints(
            source,

            scalePoint(
              axisData.upperNormal,
              distance,
            ),
          );
        },
      );

    return createSmoothPath(
      foldPoints,
    );
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

    const path =
      buildUpperLidFoldPath(
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
      "rgba(116,72,50,0.72)";
  }

  /* =========================================================
     CREASES
  ========================================================= */

  function renderCreases(
    elements,
    surfaces,
    transform,
    options,
  ) {
    if (elements.upperCrease) {
      const upperPath =
        createGeneratedCreasePath(
          surfaces.upperPoints,
          surfaces.axisData.upperNormal,

          surfaces.axisData.width *
            options
              .upperCreaseOffsetScale,

          options.upperCreaseStart,
          options.upperCreaseEnd,
        );

      setPath(
        elements.upperCrease,
        upperPath,
        transform,
      );

      styleCurve(
        elements.upperCrease,
        options.upperCreaseWidth,
        options.upperCreaseOpacity,
      );
    }

    if (elements.lowerCrease) {
      const lowerPath =
        createGeneratedCreasePath(
          surfaces.lowerPoints,
          surfaces.axisData.lowerNormal,

          surfaces.axisData.width *
            options
              .lowerCreaseOffsetScale,

          options.lowerCreaseStart,
          options.lowerCreaseEnd,
        );

      setPath(
        elements.lowerCrease,
        lowerPath,
        transform,
      );

      styleCurve(
        elements.lowerCrease,
        options.lowerCreaseWidth,
        options.lowerCreaseOpacity,
      );
    }
  }

  /* =========================================================
     TEAR DUCT RENDER
  ========================================================= */

  function renderTearDuct(
    elements,
    anatomy,
    side,
    transform,
    options,
  ) {
    if (!elements.tearDuct) {
      return;
    }

    elements.tearDuct.style.display =
      "";

    elements.tearDuct.style.visibility =
      "visible";

    elements.tearDuct.style.clipPath =
      "none";

    elements.tearDuct.removeAttribute(
      "clip-path",
    );

    const path =
      createTearDuctSurfacePath(
        anatomy,
        side,
        options,
      );

    setPath(
      elements.tearDuct,
      path,
      transform,
    );

    elements.tearDuct.style.fill =
      options.tearDuctFill;

    elements.tearDuct.style.stroke =
      options.tearDuctStroke;

    elements.tearDuct.style.strokeWidth =
      `${options.tearDuctStrokeWidth}px`;

    elements.tearDuct.style.strokeLinecap =
      "round";

    elements.tearDuct.style.strokeLinejoin =
      "round";

    elements.tearDuct.style.opacity =
      String(
        options.tearDuctOpacity,
      );

    elements.tearDuct.style.pointerEvents =
      "none";

    if (
      elements.tearDuct.parentNode
    ) {
      elements.tearDuct
        .parentNode
        .appendChild(
          elements.tearDuct,
        );
    }

    if (elements.plica) {
      setPath(
        elements.plica,
        "",
        transform,
      );

      elements.plica.style.opacity =
        "0";
    }
  }

  /* =========================================================
     IRIS POSITION
  ========================================================= */

  function resolveIrisPosition(
    anatomy,
    eyeSettings,
    animationState,
    animatedEyeHeight,
    options,
  ) {
    const sourceRadius =
      number(
        anatomy.iris &&
        anatomy.iris.radius,
        0,
      );

    const irisRadius =
      Math.max(
        1,

        sourceRadius *
          options.irisScale,
      );

    const pupilRadius =
      Math.min(
        irisRadius * 0.72,

        Math.max(
          1,

          number(
            anatomy.pupil &&
            anatomy.pupil.radius,
            1,
          ),
        ),
      );

    const maximumIrisX =
      Math.max(
        0,

        number(
          eyeSettings.eyeWidth,
          78,
        ) /
          2 -
          irisRadius -
          5,
      );

    const maximumIrisY =
      Math.max(
        0,

        animatedEyeHeight /
          2 -
          irisRadius -
          2,
      );

    const gazeX =
      clamp(
        number(
          eyeSettings.pupilX,
          0,
        ) +
          number(
            animationState.lookX,
            0,
          ),

        -maximumIrisX,
        maximumIrisX,
      );

    const gazeY =
      clamp(
        number(
          eyeSettings.pupilY,
          0,
        ) +
          number(
            animationState.lookY,
            0,
          ),

        -maximumIrisY,
        maximumIrisY,
      );

    return {
      x:
        anatomy.iris.center.x +
        gazeX,

      y:
        anatomy.iris.center.y +
        gazeY -
        options.irisLift,

      irisRadius,
      pupilRadius,
    };
  }

  /* =========================================================
     ORGANIC IRIS FIBERS
  ========================================================= */

  function renderIrisFibers(
    group,
    side,
    placement,
    transform,
    options,
  ) {
    if (!group) {
      return;
    }

    group.replaceChildren();

    if (transform) {
      group.setAttribute(
        "transform",
        transform,
      );
    } else {
      group.removeAttribute(
        "transform",
      );
    }

    const count =
      Math.max(
        12,
        Math.round(
          options.irisFiberCount,
        ),
      );

    /*
       Different deterministic seed for each eye.
       The fibers stay stable between redraws.
    */

    const seed =
      side === "left"
        ? 17
        : 41;

    /*
       Softer palette than 5.5.0:
       gray-blue / teal / cream / muted amber.
    */

    const colors = [
      "var(--iris-light)",
      "var(--iris-mid)",
      "#c5c0a9",
      "var(--iris-mid)",
      "var(--iris-warm)",
      "#a8b8af",
      "var(--iris-dark)",
      "#d0c7ad",
      "var(--iris-light)",
    ];

    for (
      let index = 0;
      index < count;
      index += 1
    ) {
      const baseAngle =
        (
          Math.PI *
          2 *
          index
        ) /
        count;

      /*
         Much stronger spacing irregularity than 5.5.0.
         This removes the evenly spaced spoke pattern.
      */

      const angleJitter =
        (
          seededValue(
            index,
            seed,
          ) -
          0.5
        ) *
        options.irisFiberAngleJitter;

      const angle =
        baseAngle +
        angleJitter;

      /*
         Start points no longer form a clean inner ring.
      */

      const startVariation =
        mix(
          1 -
            options.irisFiberStartJitter,
          1 +
            options.irisFiberStartJitter,
          seededValue(
            index,
            seed + 2,
          ),
        );

      const startRadius =
        placement.pupilRadius *
        options.irisFiberInnerScale *
        startVariation;

      /*
         Fiber lengths vary considerably.
         Some stop in the middle of the iris,
         while others almost reach the limbal edge.
      */

      const lengthVariation =
        mix(
          options.irisFiberLengthMinimum,
          options.irisFiberLengthMaximum,
          seededValue(
            index,
            seed + 3,
          ),
        );

      const maximumEndRadius =
        placement.irisRadius *
        options.irisFiberOuterScale;

      const endRadius =
        mix(
          startRadius +
            (
              maximumEndRadius -
              startRadius
            ) *
            0.38,
          maximumEndRadius,
          lengthVariation,
        );

      /*
         Fibers twist slightly as they travel outward.
      */

      const endAngle =
        angle +
        (
          seededValue(
            index,
            seed + 4,
          ) -
          0.5
        ) *
        options.irisFiberCurveJitter;

      const start =
        point(
          placement.x +
            Math.cos(angle) *
              startRadius,

          placement.y +
            Math.sin(angle) *
              startRadius,
        );

      const end =
        point(
          placement.x +
            Math.cos(endAngle) *
              endRadius,

          placement.y +
            Math.sin(endAngle) *
              endRadius,
        );

      /*
         Two independently shifted controls make each
         strand feel fibrous rather than like a straight
         spoke from the pupil.
      */

      const control1Radius =
        mix(
          startRadius,
          endRadius,
          0.34,
        );

      const control2Radius =
        mix(
          startRadius,
          endRadius,
          0.72,
        );

      const control1Angle =
        angle +
        (
          seededValue(
            index,
            seed + 5,
          ) -
          0.5
        ) *
        options.irisFiberCurveJitter *
        0.9;

      const control2Angle =
        endAngle +
        (
          seededValue(
            index,
            seed + 6,
          ) -
          0.5
        ) *
        options.irisFiberCurveJitter *
        0.65;

      const control1 =
        point(
          placement.x +
            Math.cos(
              control1Angle,
            ) *
              control1Radius,

          placement.y +
            Math.sin(
              control1Angle,
            ) *
              control1Radius,
        );

      const control2 =
        point(
          placement.x +
            Math.cos(
              control2Angle,
            ) *
              control2Radius,

          placement.y +
            Math.sin(
              control2Angle,
            ) *
              control2Radius,
        );

      const path =
        createSvgPath(
          `${side}IrisFiber${index}`,
        );

      path.setAttribute(
        "d",
        [
          `M ${start.x} ${start.y}`,

          `C ${control1.x} ${control1.y}`,
          `${control2.x} ${control2.y}`,
          `${end.x} ${end.y}`,
        ].join(" "),
      );

      const colorIndex =
        Math.floor(
          seededValue(
            index,
            seed + 7,
          ) *
          colors.length,
        );

      path.style.stroke =
        colors[
          Math.min(
            colors.length - 1,
            colorIndex,
          )
        ];

      path.style.strokeWidth =
        `${mix(
          options.irisFiberWidthMinimum,
          options.irisFiberWidthMaximum,
          seededValue(
            index,
            seed + 8,
          ),
        )}px`;

      /*
         A few fibers are deliberately faint.
         This prevents a uniformly filled sunburst.
      */

      const visibilityVariation =
        Math.pow(
          seededValue(
            index,
            seed + 9,
          ),
          0.72,
        );

      path.style.opacity =
        String(
          mix(
            options.irisFiberOpacityMinimum,
            options.irisFiberOpacityMaximum,
            visibilityVariation,
          ),
        );

      path.style.fill =
        "none";

      path.style.strokeLinecap =
        "round";

      path.style.pointerEvents =
        "none";

      group.appendChild(path);
    }
  }

  /* =========================================================
     IRIS RENDER
  ========================================================= */

  function renderIrisLayers(
    elements,
    side,
    anatomy,
    eyeSettings,
    animationState,
    animatedEyeHeight,
    transform,
    options,
  ) {
    const placement =
      resolveIrisPosition(
        anatomy,
        eyeSettings,
        animationState,
        animatedEyeHeight,
        options,
      );

    /*
       BASE IRIS

       Organic gradient instead of
       a hard colored disc/ring.
    */

    setCircle(
      elements.iris,
      placement.x,
      placement.y,
      placement.irisRadius,
      transform,
    );

    elements.iris.style.fill =
      "url(#faceLabIrisBaseGradient)";

    elements.iris.style.stroke =
      "#30484a";

    elements.iris.style.strokeWidth =
      "1.1px";

    /*
       RADIAL FIBERS
    */

    renderIrisFibers(
      elements.irisFibers,
      side,
      placement,
      transform,
      options,
    );

    /*
       REPURPOSE OLD irisInner ELEMENT.

       Instead of a ring, it becomes
       a soft warm central pigment wash.
    */

    setCircle(
      elements.irisInner,
      placement.x,
      placement.y,
      placement.irisRadius * 0.72,
      transform,
    );

    elements.irisInner.style.fill =
      "url(#faceLabIrisWarmGradient)";

    elements.irisInner.style.stroke =
      "none";

    elements.irisInner.style.opacity =
      String(
        options.irisWarmOpacity,
      );

    /*
       UPPER-LID IRIS SHADOW

       Full iris-sized overlay with a vertical gradient.
       This darkens the top while leaving the lower iris clear.
    */

    if (elements.irisTopShadow) {
      setCircle(
        elements.irisTopShadow,
        placement.x,
        placement.y,
        placement.irisRadius,
        transform,
      );

      elements.irisTopShadow.style.fill =
        "url(#faceLabIrisTopShadowGradient)";

      elements.irisTopShadow.style.stroke =
        "none";

      elements.irisTopShadow.style.opacity =
        String(
          options.irisTopShadowOpacity,
        );

      elements.irisTopShadow.style.pointerEvents =
        "none";
    }

    /*
       PUPIL
    */

    setCircle(
      elements.pupil,
      placement.x,
      placement.y,
      placement.pupilRadius,
      transform,
    );

    elements.pupil.style.fill =
      "#050607";

    elements.pupil.style.stroke =
      "none";

    /*
       CATCHLIGHT
    */

    const irisSetting =
      number(
        eyeSettings.irisSize,
        placement.irisRadius * 2,
      );

    const highlightRadius =
      Math.max(
        1.6,

        irisSetting *
          options.highlightScale,
      );

    const highlightOffset =
      irisSetting *
      options.highlightOffsetScale;

    setCircle(
      elements.highlight,

      placement.x -
        highlightOffset,

      placement.y -
        highlightOffset,

      highlightRadius,
      transform,
    );

    return placement;
  }

  /* =========================================================
     MAIN RENDER
  ========================================================= */

  function render(input) {
    if (
      !input ||
      !input.side ||
      !input.anatomy
    ) {
      console.warn(
        "EyeRenderer.render requires side and anatomy.",
      );

      return null;
    }

    const side =
      input.side;

    const anatomy =
      input.anatomy;

    ensureEyeGradients();

    const options = {
      ...DEFAULT_RENDER_OPTIONS,
      ...(input.options || {}),
    };

    const elements =
      getRequiredElements(side);

    if (
      !validateElements(
        side,
        elements,
      )
    ) {
      return null;
    }

    const transform =
      anatomy.transform || "";

    const surfaces =
      buildLidSurfaces(
        anatomy,
        options,
      );

    renderSocket(
      elements,
      anatomy,

      number(
        input.centerX,
        0,
      ),

      number(
        input.centerY,
        0,
      ),

      number(
        input.rotation,
        0,
      ),

      options,
    );

    renderOpening(
      elements,
      anatomy,
      transform,
    );

    const irisPlacement =
      renderIrisLayers(
        elements,
        side,
        anatomy,

        input.eyeSettings || {},
        input.animationState || {},

        number(
          input.animatedEyeHeight,
          1,
        ),

        transform,
        options,
      );

    renderLidSurfaces(
      elements,
      surfaces,
      anatomy,
      transform,
      options,
    );

    renderUpperLidFold(
      elements,
      anatomy,
      transform,
      options,
    );

    renderLidEdges(
      elements,
      anatomy,
      transform,
      options,
    );

    renderCreases(
      elements,
      surfaces,
      transform,
      options,
    );

    renderTearDuct(
      elements,
      anatomy,
      side,
      transform,
      options,
    );

    return {
      side,
      elements,

      iris:
        irisPlacement,

      surfaces,
      options,
    };
  }

  /* =========================================================
     PUBLIC API
  ========================================================= */

  window.EyeRenderer = {
    version: "5.5.9",

    defaults:
      DEFAULT_RENDER_OPTIONS,

    render,

    buildLidSurfaces,

    buildUpperLidFoldPath,

    createTearDuctSurfacePath,

    createRoundedCarunclePath,
  };

  console.log(
    "EyeRenderer 5.5.9 loaded",
  );
})();
