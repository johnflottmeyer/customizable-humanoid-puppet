/* ==========================
   MOUTH RENDERER — VERSION 1.0

   Responsibilities:

   - Locate the face SVG
   - Create the mouth SVG group
   - Clear previous mouth rendering
   - Render completed geometry paths

   This file performs no mouth geometry.
========================== */

(function () {
  "use strict";

  const SVG_NAMESPACE = "http://www.w3.org/2000/svg";

  /* ==========================
       NUMBER HELPER
    ========================== */

  function safeNumber(value, fallback) {
    const number = Number(value);

    return Number.isFinite(number) ? number : fallback;
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

    /*
            Reappend the group so the
            procedural mouth stays above
            older mouth layers.
        */

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

  function createPath(pathData, options) {
    const settings = options || {};

    const path = document.createElementNS(SVG_NAMESPACE, "path");

    path.setAttribute("d", pathData || "");

    path.setAttribute("fill", settings.fill || "none");

    path.setAttribute("stroke", settings.stroke || "none");

    path.setAttribute("stroke-width", safeNumber(settings.strokeWidth, 1));

    path.setAttribute("stroke-linecap", settings.lineCap || "round");

    path.setAttribute("stroke-linejoin", settings.lineJoin || "round");

    if (settings.id) {
      path.setAttribute("id", settings.id);
    }

    if (settings.className) {
      path.setAttribute("class", settings.className);
    }

    return path;
  }

  /* ==========================
       DRAW LIP SHAPES
    ========================== */

  function drawLipShapes(group, geometry, settings) {
    if (geometry.upperPath && settings.showLipShapes !== false) {
      group.appendChild(
        createPath(geometry.upperPath, {
          id: "upperLipShape",

          className: "upperLipShape",

          fill: settings.upperLipColor,

          stroke: "none",
        }),
      );
    }

    if (geometry.lowerPath && settings.showLipShapes !== false) {
      group.appendChild(
        createPath(geometry.lowerPath, {
          id: "lowerLipShape",

          className: "lowerLipShape",

          fill: settings.lowerLipColor,

          stroke: "none",
        }),
      );
    }
  }

  /* ==========================
       DRAW SEAM
    ========================== */

  function drawSeam(group, geometry, settings) {
    if (!geometry.seamPath || settings.showSeam === false) {
      return;
    }

    group.appendChild(
      createPath(geometry.seamPath, {
        id: "mouthSeam",

        className: "mouthSeam",

        fill: "none",

        stroke: settings.seamColor,

        strokeWidth: settings.seamWidth,
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

  console.log("mouthRenderer.js V1.0 loaded");
})();
