/* ==========================
   MOUTH DEBUGGER — VERSION 1.1

   Reads geometry produced by MouthEngine.

   It does not create the mouth surface and
   does not replace mouthEngine.js.
========================== */

(function () {
  "use strict";

  const SVG_NAMESPACE = "http://www.w3.org/2000/svg";

  /* ==========================
       DEFAULT DEBUG SETTINGS
    ========================== */

  const defaultMouthDebugSettings = {
    enabled: true,

    showLandmarks: true,

    showSeam: true,
    showSamples: true,

    showUpperBorder: true,
    showLowerBorder: true,

    showNormals: false,
    showTangents: false,

    showUpperDirections: false,
    showLowerDirections: false,

    showPads: true,
    showPadWidths: true,
  };

  window.mouthDebugSettings = {
    ...defaultMouthDebugSettings,

    ...(window.mouthDebugSettings || {}),
  };

  let initialized = false;

  let wrappedEngineDraw = false;

  /* ==========================
       BASIC HELPERS
    ========================== */

  function clamp(value, minimum, maximum) {
    return Math.max(minimum, Math.min(maximum, value));
  }

  function clamp01(value) {
    return clamp(value, 0, 1);
  }

  function isPoint(point) {
    return Boolean(
      point &&
      Number.isFinite(Number(point.x)) &&
      Number.isFinite(Number(point.y)),
    );
  }

  function isVector(vector) {
    return isPoint(vector);
  }

  /* ==========================
       SVG HELPERS
    ========================== */

  function getFaceSvg() {
    return document.getElementById("face") || document.querySelector("svg");
  }

  function getDebugLayer() {
    const svg = getFaceSvg();

    if (!svg) {
      console.warn("MouthDebug could not find the face SVG.");

      return null;
    }

    let layer = document.getElementById("mouthDebugLayer");

    if (!layer) {
      layer = document.createElementNS(SVG_NAMESPACE, "g");

      layer.setAttribute("id", "mouthDebugLayer");

      layer.setAttribute("pointer-events", "none");
    }

    /*
            Appending it again ensures that the
            debugger stays above the mouth.
        */

    svg.appendChild(layer);

    return layer;
  }

  function clearElement(element) {
    while (element.firstChild) {
      element.removeChild(element.firstChild);
    }
  }

  function createSvgElement(elementName, attributes) {
    const element = document.createElementNS(SVG_NAMESPACE, elementName);

    Object.entries(attributes || {}).forEach(function (entry) {
      const attributeName = entry[0];

      const value = entry[1];

      if (value !== undefined && value !== null) {
        element.setAttribute(attributeName, value);
      }
    });

    return element;
  }

  function pointPath(points) {
    const validPoints = points.filter(isPoint);

    if (!validPoints.length) {
      return "";
    }

    const commands = ["M", validPoints[0].x, validPoints[0].y];

    for (let index = 1; index < validPoints.length; index += 1) {
      commands.push("L", validPoints[index].x, validPoints[index].y);
    }

    return commands.join(" ");
  }

  function drawPath(layer, points, options) {
    const pathData = pointPath(points);

    if (!pathData) {
      return;
    }

    const path = createSvgElement("path", {
      d: pathData,

      fill: "none",

      stroke: options.stroke,

      "stroke-width": options.strokeWidth || 1,

      "stroke-linecap": "round",

      "stroke-linejoin": "round",

      "stroke-dasharray": options.dashArray || null,

      opacity: options.opacity === undefined ? 1 : options.opacity,
    });

    layer.appendChild(path);
  }

  function drawPoint(layer, point, options) {
    if (!isPoint(point)) {
      return;
    }

    const circle = createSvgElement("circle", {
      cx: point.x,

      cy: point.y,

      r: options.radius || 2,

      fill: options.fill || "#ffffff",

      stroke: options.stroke || "none",

      "stroke-width": options.strokeWidth || 0,

      opacity: options.opacity === undefined ? 1 : options.opacity,
    });

    layer.appendChild(circle);
  }

  function drawVector(layer, origin, vector, length, options) {
    if (!isPoint(origin) || !isVector(vector)) {
      return;
    }

    const line = createSvgElement("line", {
      x1: origin.x,

      y1: origin.y,

      x2: origin.x + vector.x * length,

      y2: origin.y + vector.y * length,

      stroke: options.stroke,

      "stroke-width": options.strokeWidth || 1,

      "stroke-linecap": "round",

      opacity: options.opacity === undefined ? 1 : options.opacity,
    });

    layer.appendChild(line);
  }

  /* ==========================
       READ ENGINE GEOMETRY
    ========================== */

  function getSurfaceSamples() {
    if (
      !window.MouthEngine ||
      typeof window.MouthEngine.getSurfaceSamples !== "function"
    ) {
      return [];
    }

    const samples = window.MouthEngine.getSurfaceSamples();

    return Array.isArray(samples) ? samples : [];
  }

  function getPointFromSample(sample, possibleNames) {
    for (let index = 0; index < possibleNames.length; index += 1) {
      const point = sample[possibleNames[index]];

      if (isPoint(point)) {
        return point;
      }
    }

    return null;
  }

  function normalizeSample(sample, index, count) {
    const seamPoint = getPointFromSample(sample, [
      "seamPoint",
      "point",
      "seam",
    ]);

    const upperBorder = getPointFromSample(sample, [
      "upperBorder",
      "upperPoint",
      "upper",
    ]);

    const lowerBorder = getPointFromSample(sample, [
      "lowerBorder",
      "lowerPoint",
      "lower",
    ]);

    return {
      source: sample,

      index: index,

      t: Number.isFinite(Number(sample.t))
        ? Number(sample.t)
        : count > 1
          ? index / (count - 1)
          : 0,

      seamPoint: seamPoint,

      upperBorder: upperBorder,

      lowerBorder: lowerBorder,

      seamNormal: sample.seamNormal || sample.normal || null,

      seamTangent: sample.seamTangent || sample.tangent || null,

      upperDirection: sample.upperDirection || null,

      lowerDirection: sample.lowerDirection || null,
    };
  }

  function getNormalizedSamples() {
    const sourceSamples = getSurfaceSamples();

    return sourceSamples.map(function (sample, index) {
      return normalizeSample(
        sample,

        index,

        sourceSamples.length,
      );
    });
  }

  /* ==========================
       LANDMARKS
    ========================== */

  function getDerivedLandmarks(samples) {
    if (!samples.length) {
      return [];
    }

    const positions = [0, 0.25, 0.5, 0.75, 1];

    return positions
      .map(function (position) {
        const index = Math.round(clamp01(position) * (samples.length - 1));

        return samples[index].seamPoint;
      })
      .filter(isPoint);
  }

  /* ==========================
       PAD VISUALIZATION
    ========================== */

  function padSpaceToT(padPosition) {
    return (clamp(Number(padPosition) || 0, -1, 1) + 1) / 2;
  }

  function findSampleAtT(samples, t) {
    if (!samples.length) {
      return null;
    }

    const index = Math.round(clamp01(t) * (samples.length - 1));

    return samples[index];
  }

  function getMouthWidth() {
    const settings = window.mouthEngineSettings || {};

    const width = Number(settings.width);

    return Number.isFinite(width) ? width : 150;
  }

  function drawPadMarker(layer, samples, pad) {
    const sample = findSampleAtT(
      samples,

      padSpaceToT(pad.position),
    );

    if (!sample || !isPoint(sample.seamPoint)) {
      return;
    }

    const mouthWidth = getMouthWidth();

    const radiusX = Math.max(
      3,

      (Math.abs(Number(pad.width) || 0.2) * mouthWidth) / 2,
    );

    const radiusY = Math.max(
      2,

      Math.abs(Number(pad.height) || 2),
    );

    if (window.mouthDebugSettings.showPadWidths) {
      const ellipse = createSvgElement("ellipse", {
        cx: sample.seamPoint.x,

        cy: sample.seamPoint.y,

        rx: radiusX,

        ry: radiusY,

        fill: "none",

        stroke: pad.color,

        "stroke-width": 1,

        "stroke-dasharray": "4 3",

        opacity: 0.75,
      });

      layer.appendChild(ellipse);
    }

    drawPoint(layer, sample.seamPoint, {
      radius: 3.1,

      fill: pad.color,

      stroke: "#111111",

      strokeWidth: 0.8,
    });
  }

  function drawPads(layer, samples) {
    const settings = window.mouthPadSettings;

    if (!settings) {
      return;
    }

    const upperSidePosition = Math.abs(
      Number(settings.upperSidePadPosition) || 0,
    );

    const lowerSidePosition = Math.abs(
      Number(settings.lowerSidePadPosition) || 0,
    );

    const pads = [
      {
        position: -upperSidePosition,

        width: settings.upperSidePadWidth,

        height: settings.upperSidePadHeight,

        color: "#ffae32",
      },

      {
        position: settings.upperCenterPadPosition,

        width: settings.upperCenterPadWidth,

        height: settings.upperCenterPadHeight,

        color: "#ffe45c",
      },

      {
        position: upperSidePosition,

        width: settings.upperSidePadWidth,

        height: settings.upperSidePadHeight,

        color: "#ffae32",
      },

      {
        position: settings.philtrumPosition,

        width: settings.philtrumWidth,

        height: settings.philtrumDepth,

        color: "#dc73ff",
      },

      {
        position: -lowerSidePosition,

        width: settings.lowerSidePadWidth,

        height: settings.lowerSidePadHeight,

        color: "#49cfff",
      },

      {
        position: settings.lowerCenterPadPosition,

        width: settings.lowerCenterPadWidth,

        height: settings.lowerCenterPadHeight,

        color: "#52ff9a",
      },

      {
        position: lowerSidePosition,

        width: settings.lowerSidePadWidth,

        height: settings.lowerSidePadHeight,

        color: "#49cfff",
      },
    ];

    pads.forEach(function (pad) {
      drawPadMarker(layer, samples, pad);
    });
  }

  /* ==========================
       DRAW DEBUG GEOMETRY
    ========================== */

  function draw() {
    const layer = getDebugLayer();

    if (!layer) {
      return;
    }

    clearElement(layer);

    const settings = window.mouthDebugSettings;

    layer.style.display = settings.enabled ? "" : "none";

    if (!settings.enabled) {
      return;
    }

    const samples = getNormalizedSamples();

    if (!samples.length) {
      console.warn("MouthDebug found no mouth-engine surface samples.");

      return;
    }

    const seamPoints = samples
      .map(function (sample) {
        return sample.seamPoint;
      })
      .filter(isPoint);

    const upperPoints = samples
      .map(function (sample) {
        return sample.upperBorder;
      })
      .filter(isPoint);

    const lowerPoints = samples
      .map(function (sample) {
        return sample.lowerBorder;
      })
      .filter(isPoint);

    if (settings.showUpperBorder) {
      drawPath(layer, upperPoints, {
        stroke: "#ff4f78",

        strokeWidth: 1.4,
      });
    }

    if (settings.showLowerBorder) {
      drawPath(layer, lowerPoints, {
        stroke: "#68ff68",

        strokeWidth: 1.4,
      });
    }

    if (settings.showSeam) {
      drawPath(layer, seamPoints, {
        stroke: "#ffffff",

        strokeWidth: 1.15,
      });
    }

    samples.forEach(function (sample) {
      if (settings.showSamples) {
        drawPoint(layer, sample.seamPoint, {
          radius: 1.7,

          fill: "#00cfff",
        });
      }

      if (settings.showNormals) {
        drawVector(layer, sample.seamPoint, sample.seamNormal, 12, {
          stroke: "#42ff72",

          strokeWidth: 1,
        });
      }

      if (settings.showTangents) {
        drawVector(layer, sample.seamPoint, sample.seamTangent, 12, {
          stroke: "#ff4c4c",

          strokeWidth: 1,
        });
      }

      if (settings.showUpperDirections) {
        drawVector(layer, sample.seamPoint, sample.upperDirection, 14, {
          stroke: "#ff9f32",

          strokeWidth: 1.1,
        });
      }

      if (settings.showLowerDirections) {
        drawVector(layer, sample.seamPoint, sample.lowerDirection, 14, {
          stroke: "#3faeff",

          strokeWidth: 1.1,
        });
      }
    });

    if (settings.showLandmarks) {
      const landmarks = getDerivedLandmarks(samples);

      landmarks.forEach(function (point, index) {
        drawPoint(layer, point, {
          radius: index === 2 ? 3.4 : 2.8,

          fill: index === 2 ? "#ffe13d" : "#00d8ff",

          stroke: "#111111",

          strokeWidth: 0.8,
        });
      });
    }

    if (settings.showPads) {
      drawPads(layer, samples);
    }
  }

  /* ==========================
       DRAWER PANEL
    ========================== */

  const controlDefinitions = [
    ["enabled", "Enable mouth debug"],

    ["showLandmarks", "Landmarks"],

    ["showSeam", "Seam"],

    ["showSamples", "Seam samples"],

    ["showUpperBorder", "Upper border"],

    ["showLowerBorder", "Lower border"],

    ["showNormals", "Normals"],

    ["showTangents", "Tangents"],

    ["showUpperDirections", "Upper growth directions"],

    ["showLowerDirections", "Lower growth directions"],

    ["showPads", "Pad centers"],

    ["showPadWidths", "Pad widths"],
  ];

  function createPanelMarkup() {
    const controls = controlDefinitions
      .map(function (definition) {
        const propertyName = definition[0];

        const label = definition[1];

        return [
          '<label class="mouthDebugOption">',

          "<input",

          ' type="checkbox"',

          ' data-mouth-debug="',
          propertyName,
          '">',

          "<span>",
          label,
          "</span>",

          "</label>",
        ].join("");
      })
      .join("");

    return [
      '<div class="mouthDebugOptions">',

      controls,

      '<div class="control-buttons">',

      "<button",
      ' type="button"',
      ' id="resetMouthDebug">',
      "Reset debug view",
      "</button>",

      "</div>",

      '<p style="font-size:12px;line-height:1.5;opacity:.72;margin:0;">',

      "White: seam<br>",
      "Pink: upper border<br>",
      "Green: lower border<br>",
      "Yellow, purple, blue: tissue pads",

      "</p>",

      "</div>",
    ].join("");
  }

  function createFallbackPanel() {
    const panelContainer = document.getElementById("customizePanels");

    if (!panelContainer) {
      return null;
    }

    const details = document.createElement("details");

    const summary = document.createElement("summary");

    const body = document.createElement("div");

    summary.textContent = "Mouth Debug";

    body.className = "panelBody";

    body.innerHTML = createPanelMarkup();

    details.appendChild(summary);

    details.appendChild(body);

    panelContainer.appendChild(details);

    return body;
  }

  function initializeDrawerPanel() {
    if (document.getElementById("mouthDebugControls")) {
      return;
    }

    let body = null;

    if (typeof window.addCustomizePanel === "function") {
      body = window.addCustomizePanel(
        "Mouth Debug",

        createPanelMarkup(),
      );
    }

    if (!body) {
      body = createFallbackPanel();
    }

    if (!body) {
      console.warn("MouthDebug could not create its drawer panel.");

      return;
    }

    body.id = "mouthDebugControls";

    body.querySelectorAll("[data-mouth-debug]").forEach(function (checkbox) {
      checkbox.addEventListener("change", function () {
        const propertyName = checkbox.getAttribute("data-mouth-debug");

        window.mouthDebugSettings[propertyName] = checkbox.checked;

        draw();
      });
    });

    const resetButton = body.querySelector("#resetMouthDebug");

    if (resetButton) {
      resetButton.addEventListener("click", reset);
    }

    applyInlineControlStyles(body);

    syncControls();
  }

  function applyInlineControlStyles(body) {
    const wrapper = body.querySelector(".mouthDebugOptions");

    if (wrapper) {
      wrapper.style.display = "flex";

      wrapper.style.flexDirection = "column";

      wrapper.style.gap = "0.65rem";
    }

    body.querySelectorAll(".mouthDebugOption").forEach(function (label) {
      label.style.display = "grid";

      label.style.gridTemplateColumns = "auto 1fr";

      label.style.alignItems = "center";

      label.style.gap = "0.65rem";

      label.style.padding = "0.45rem 0.55rem";

      label.style.backgroundColor = "#292c32";

      label.style.border = "1px solid #3d414a";

      label.style.borderRadius = "7px";

      label.style.cursor = "pointer";
    });
  }

  function syncControls() {
    document
      .querySelectorAll("[data-mouth-debug]")
      .forEach(function (checkbox) {
        const propertyName = checkbox.getAttribute("data-mouth-debug");

        checkbox.checked = Boolean(window.mouthDebugSettings[propertyName]);
      });
  }

  /* ==========================
       SETTINGS API
    ========================== */

  function update(newValues) {
    window.mouthDebugSettings = {
      ...window.mouthDebugSettings,

      ...(newValues || {}),
    };

    syncControls();

    draw();
  }

  function reset() {
    window.mouthDebugSettings = {
      ...defaultMouthDebugSettings,
    };

    syncControls();

    draw();
  }

  /* ==========================
       ENGINE DRAW HOOK
    ========================== */

  function wrapEngineDraw() {
    if (wrappedEngineDraw || typeof window.drawMouthEngine !== "function") {
      return;
    }

    const originalDraw = window.drawMouthEngine;

    window.drawMouthEngine = function () {
      const result = originalDraw.apply(this, arguments);

      draw();

      return result;
    };

    if (window.MouthEngine) {
      window.MouthEngine.draw = window.drawMouthEngine;
    }

    wrappedEngineDraw = true;
  }

  /* ==========================
       INITIALIZE
    ========================== */

  function initialize() {
    if (initialized) {
      draw();

      return;
    }

    wrapEngineDraw();

    initializeDrawerPanel();

    draw();

    initialized = true;

    console.log("mouthDebug.js V1.1 loaded");
  }

  /* ==========================
       PUBLIC API
    ========================== */

  window.MouthDebug = {
    defaults: Object.freeze({
      ...defaultMouthDebugSettings,
    }),

    initialize: initialize,

    draw: draw,

    update: update,

    reset: reset,

    syncControls: syncControls,
  };

  window.drawMouthDebug = draw;

  window.updateMouthDebugSettings = update;

  window.resetMouthDebug = reset;
})();
