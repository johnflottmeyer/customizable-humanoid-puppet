/* ==========================
   FACELAB
   FACE INSPECTOR — VERSION 3.0.1

   Direct-editing inspector for procedural
   FaceLab feature engines.

   Generic direct-editing inspector for
   all FaceLab registered features.

   Requires:
   - FaceLab Core
   - Face SVG
========================== */

(function () {
  "use strict";

  const SVG_NAMESPACE = "http://www.w3.org/2000/svg";

  /* ==========================
       DEFAULT SETTINGS
    ========================== */

  const defaultFaceInspectorSettings = {
    enabled: false,

    showPanel: true,

    showHandles: true,

    handleRadius: 5,

    hoverRadius: 7,

    selectedRadius: 8,

    handleStrokeWidth: 1.5,

    dragScale: 1,

    handleFill: "#101820",

    handleStroke: "#66d9ef",

    hoverFill: "#66d9ef",

    hoverStroke: "#ffffff",

    selectedFill: "#ffcf4a",

    selectedStroke: "#ffffff",

    guideStroke: "#66d9ef",

    guideStrokeWidth: 1,

    guideOpacity: 0.55,
  };

  window.faceInspectorSettings = {
    ...defaultFaceInspectorSettings,

    ...(window.faceInspectorSettings || {}),
  };

  /* ==========================
       STATE
    ========================== */

  const state = {
    initialized: false,

    enabled: window.faceInspectorSettings.enabled,

    dragging: false,

    hoveredHandleId: null,

    selectedHandleId: null,

    activePointerId: null,

    dragStartPointer: null,

    dragStartSettings: null,

    handles: [],
  };

  /* ==========================
       DOM REFERENCES
    ========================== */

  let faceSvg = null;

  let handleLayer = null;

  let guideLayer = null;

  let panel = null;

  let panelStatus = null;

  let panelContent = null;

  let reopenButton = null;

  /* ==========================
       NUMBER HELPERS
    ========================== */

  function safeNumber(value, fallback) {
    const number = Number(value);

    return Number.isFinite(number) ? number : fallback;
  }

  function clamp(value, minimum, maximum) {
    return Math.max(
      minimum,

      Math.min(maximum, value),
    );
  }

  function formatNumber(value, decimals) {
    return safeNumber(value, 0).toFixed(decimals === undefined ? 2 : decimals);
  }

  /* ==========================
       SVG LOOKUP
    ========================== */

  function getFaceSvg() {
    return (
      document.getElementById("faceSvg") ||
      document.getElementById("face") ||
      document.querySelector("svg")
    );
  }

  /* ==========================
       SVG ELEMENT HELPERS
    ========================== */

  function createSvgElement(elementName) {
    return document.createElementNS(
      SVG_NAMESPACE,

      elementName,
    );
  }

  function clearElement(element) {
    if (!element) {
      return;
    }

    while (element.firstChild) {
      element.removeChild(element.firstChild);
    }
  }

  function createCircle(point, radius, options) {
    const settings = options || {};

    const circle = createSvgElement("circle");

    circle.setAttribute("cx", safeNumber(point.x, 0));

    circle.setAttribute("cy", safeNumber(point.y, 0));

    circle.setAttribute("r", safeNumber(radius, 5));

    circle.setAttribute("fill", settings.fill || "none");

    circle.setAttribute("stroke", settings.stroke || "none");

    circle.setAttribute("stroke-width", safeNumber(settings.strokeWidth, 1));

    circle.setAttribute("vector-effect", "non-scaling-stroke");

    return circle;
  }

  function createLine(firstPoint, secondPoint, options) {
    const settings = options || {};

    const line = createSvgElement("line");

    line.setAttribute("x1", safeNumber(firstPoint.x, 0));

    line.setAttribute("y1", safeNumber(firstPoint.y, 0));

    line.setAttribute("x2", safeNumber(secondPoint.x, 0));

    line.setAttribute("y2", safeNumber(secondPoint.y, 0));

    line.setAttribute("stroke", settings.stroke || "#ffffff");

    line.setAttribute("stroke-width", safeNumber(settings.strokeWidth, 1));

    line.setAttribute("stroke-opacity", safeNumber(settings.opacity, 1));

    line.setAttribute("stroke-linecap", "round");

    line.setAttribute("vector-effect", "non-scaling-stroke");

    return line;
  }

  /* ==========================
       INSPECTOR SVG LAYERS
    ========================== */

  function createInspectorLayers() {
    if (!faceSvg) {
      return;
    }

    guideLayer = document.getElementById("faceInspectorGuideLayer");

    if (!guideLayer) {
      guideLayer = createSvgElement("g");

      guideLayer.setAttribute("id", "faceInspectorGuideLayer");

      guideLayer.style.pointerEvents = "none";
    }

    handleLayer = document.getElementById("faceInspectorHandleLayer");

    if (!handleLayer) {
      handleLayer = createSvgElement("g");

      handleLayer.setAttribute("id", "faceInspectorHandleLayer");
    }

    /*
      Reappend both layers so they stay
      above the rendered facial features.
    */

    faceSvg.appendChild(guideLayer);

    faceSvg.appendChild(handleLayer);
  }

  /* ==========================
       PANEL STYLES
    ========================== */

  function createPanelStyles() {
    if (document.getElementById("faceInspectorV2Styles")) {
      return;
    }

    const style = document.createElement("style");

    style.id = "faceInspectorV2Styles";

    style.textContent = `

      #faceInspectorPanel {

        position: fixed;

        bottom: 1rem;
        right: 1rem;

        width: min(22rem, calc(100vw - 2rem));
        max-height: calc(100vh - 2rem);

        overflow: auto;

        z-index: 10000;

        color: #f4f7fa;

        background-color:
          rgba(20, 24, 30, 0.96);

        border:
          1px solid rgba(255, 255, 255, 0.18);

        border-radius: 0.75rem;

        box-shadow:
          0 0.75rem 2rem
          rgba(0, 0, 0, 0.42);

        font-family:
          Arial,
          Helvetica,
          sans-serif;

        font-size: 0.84rem;

        backdrop-filter:
          blur(0.5rem);

      }


      #faceInspectorPanel[hidden] {

        display: none;

      }


      .faceInspectorHeader {

        position: sticky;

        top: 0;

        display: flex;

        align-items: flex-start;
        justify-content: space-between;

        gap: 1rem;

        padding: 0.85rem 1rem;

        background-color:
          rgba(28, 33, 41, 0.98);

        border-bottom:
          1px solid rgba(255, 255, 255, 0.12);

        z-index: 1;

      }


      .faceInspectorTitle {

        font-size: 1rem;

        font-weight: 700;

      }


      .faceInspectorStatus {

        margin-top: 0.2rem;

        color:
          rgba(255, 255, 255, 0.58);

        font-size: 0.72rem;

      }


      .faceInspectorHeaderButtons {

        display: flex;

        align-items: center;

        gap: 0.35rem;

      }


      .faceInspectorHeader button {

        appearance: none;

        border:
          1px solid rgba(255, 255, 255, 0.16);

        border-radius: 0.35rem;

        background-color:
          rgba(255, 255, 255, 0.06);

        color: white;

        cursor: pointer;

        padding: 0.25rem 0.45rem;

        font-size: 0.78rem;

      }


      .faceInspectorHeader button:hover {

        background-color:
          rgba(255, 255, 255, 0.12);

      }


      #faceInspectorClose {

        border: 0;

        background-color: transparent;

        font-size: 1.25rem;

        line-height: 1;

      }


      .faceInspectorContent {

        padding: 1rem;

      }


      .faceInspectorEmpty {

        padding: 1.2rem 0.5rem;

        text-align: center;

        color:
          rgba(255, 255, 255, 0.58);

        line-height: 1.55;

      }


      .faceInspectorSection {

        margin-bottom: 1rem;

      }


      .faceInspectorSection:last-child {

        margin-bottom: 0;

      }


      .faceInspectorSectionTitle {

        margin-bottom: 0.5rem;

        padding-bottom: 0.35rem;

        color: #83e9ff;

        border-bottom:
          1px solid rgba(255, 255, 255, 0.12);

        font-size: 0.68rem;

        font-weight: 700;

        letter-spacing: 0.07em;

        text-transform: uppercase;

      }


      .faceInspectorRow {

        display: grid;

        grid-template-columns:
          minmax(0, 1fr)
          auto;

        gap: 1rem;

        padding: 0.27rem 0;

      }


      .faceInspectorLabel {

        color:
          rgba(255, 255, 255, 0.63);

      }


      .faceInspectorValue {

        color: white;

        text-align: right;

        font-family:
          ui-monospace,
          SFMono-Regular,
          Menlo,
          Consolas,
          monospace;

      }


      .faceInspectorHelp {

        margin-top: 0.75rem;

        padding: 0.65rem;

        color:
          rgba(255, 255, 255, 0.65);

        background-color:
          rgba(255, 255, 255, 0.05);

        border-radius: 0.4rem;

        line-height: 1.45;

      }


      /* ==========================
         FLOATING REOPEN BUTTON
      ========================== */

      #faceInspectorReopen {

        position: fixed;

        right: 1rem;
        bottom: 1rem;

        z-index: 10001;

        display: flex;
        align-items: center;
        gap: 0.45rem;

        padding: 0.7rem 1rem;

        border: none;

        border-radius: 999px;

        background: #1c2129;

        color: white;

        cursor: pointer;

        font-size: 0.85rem;

        font-weight: 600;

        box-shadow:
          0 8px 24px rgba(0, 0, 0, 0.35);

        transition:
          transform 0.15s ease,
          background 0.15s ease;

      }


      #faceInspectorReopen:hover {

        transform:
          translateY(-2px);

        background:
          #252c36;

      }


      #faceInspectorReopen[hidden] {

        display: none;

      }

    `;

    document.head.appendChild(style);
  }

  /* ==========================
     CREATE REOPEN BUTTON
  ========================== */

  function createReopenButton() {
    const existingButton = document.getElementById("faceInspectorReopen");

    if (existingButton) {
      reopenButton = existingButton;

      return;
    }

    reopenButton = document.createElement("button");

    reopenButton.type = "button";

    reopenButton.id = "faceInspectorReopen";

    reopenButton.textContent = "✦ Inspector";

    reopenButton.setAttribute("aria-label", "Open Face Inspector");

    reopenButton.addEventListener(
      "click",

      function () {
        showInspector();
      },
    );

    reopenButton.hidden = true;

    document.body.appendChild(reopenButton);
  }

  /* ==========================
       CREATE PANEL
    ========================== */

  function createPanel() {
    let existingPanel = document.getElementById("faceInspectorPanel");

    /*
      Replace an older inspector panel
      if one already exists.
    */

    if (existingPanel) {
      existingPanel.remove();
    }

    panel = document.createElement("aside");

    panel.id = "faceInspectorPanel";

    panel.innerHTML = `

      <div class="faceInspectorHeader">

        <div>

          <div class="faceInspectorTitle">
            Face Inspector 3
          </div>

          <div class="faceInspectorStatus">
            Direct Editing
          </div>

        </div>

        <div class="faceInspectorHeaderButtons">

          <button
            type="button"
            id="faceInspectorClear"
          >
            Clear
          </button>

          <button
            type="button"
            id="faceInspectorClose"
            aria-label="Close Face Inspector"
          >
            ×
          </button>

        </div>

      </div>

      <div class="faceInspectorContent">

        <div class="faceInspectorEmpty">

          Hover over a FaceLab handle.

          <br><br>

          Click and drag a handle to edit
          the procedural feature directly.

        </div>

      </div>

    `;

    document.body.appendChild(panel);

    panelStatus = panel.querySelector(".faceInspectorStatus");

    panelContent = panel.querySelector(".faceInspectorContent");

    const clearButton = panel.querySelector("#faceInspectorClear");

    const closeButton = panel.querySelector("#faceInspectorClose");

    if (clearButton) {
      clearButton.addEventListener(
        "click",

        function () {
          clearSelection();
        },
      );
    }

    if (closeButton) {
      closeButton.addEventListener(
        "click",

        function () {
          hideInspector();
        },
      );
    }

    panel.hidden = !window.faceInspectorSettings.showPanel;
  }

  /* ==========================
       SVG POINTER POSITION
    ========================== */

  function getSvgPointer(event) {
    if (!faceSvg) {
      return null;
    }

    const matrix = faceSvg.getScreenCTM();

    if (!matrix) {
      return null;
    }

    const svgPoint = faceSvg.createSVGPoint();

    svgPoint.x = event.clientX;

    svgPoint.y = event.clientY;

    return svgPoint.matrixTransform(matrix.inverse());
  }

  /* ==========================
       FACELAB FEATURE HANDLES
    ========================== */

  function collectFeatureHandles() {
    if (!window.FaceLab || typeof window.FaceLab.getHandles !== "function") {
      return [];
    }

    const handles = window.FaceLab.getHandles();

    return Array.isArray(handles) ? handles : [];
  }

  /* ==========================
       FEATURE SETTINGS
    ========================== */

  function getFeatureSettings(featureId) {
    if (
      window.FaceLab &&
      window.FaceLab.Core &&
      typeof window.FaceLab.Core.getFeatureSettings === "function"
    ) {
      return window.FaceLab.Core.getFeatureSettings(featureId) || {};
    }

    return {};
  }

  /* ==========================
       CONTROL SYNCHRONIZATION
    ========================== */

  function findSettingControls(propertyName, featureId) {
    const controls = [];

    const possibleIds = [
      propertyName,

      featureId + propertyName.charAt(0).toUpperCase() + propertyName.slice(1),
    ];

    possibleIds.forEach(function (controlId) {
      const control = document.getElementById(controlId);

      if (control && !controls.includes(control)) {
        controls.push(control);
      }
    });

    document
      .querySelectorAll(
        [
          `[data-setting="${propertyName}"]`,
          `[data-feature-setting="${propertyName}"]`,
          `[data-${featureId}-setting="${propertyName}"]`,
          `input[name="${propertyName}"]`,
        ].join(","),
      )
      .forEach(function (control) {
        if (!controls.includes(control)) {
          controls.push(control);
        }
      });

    return controls;
  }

  function syncControl(propertyName, featureId) {
    const settings = getFeatureSettings(featureId);

    const value = settings[propertyName];

    if (value === undefined) {
      return;
    }

    findSettingControls(propertyName, featureId).forEach(function (control) {
      if ("value" in control) {
        control.value = value;
      }

      control.dispatchEvent(
        new CustomEvent(
          "facelab-sync",

          {
            bubbles: true,

            detail: {
              feature: featureId,

              property: propertyName,

              value: value,
            },
          },
        ),
      );
    });

    const capitalizedProperty =
      propertyName.charAt(0).toUpperCase() + propertyName.slice(1);

    const valueDisplayIds = [
      propertyName + "Value",

      featureId + capitalizedProperty + "Value",
    ];

    valueDisplayIds.forEach(function (displayId) {
      const display = document.getElementById(displayId);

      if (display) {
        display.textContent = formatNumber(value, 3);
      }
    });
  }

  function syncControls(propertyNames, featureId) {
    if (!Array.isArray(propertyNames)) {
      return;
    }

    propertyNames.forEach(function (propertyName) {
      syncControl(propertyName, featureId);
    });
  }

  /* ==========================
       HANDLE LOOKUP
    ========================== */

  function getHandleById(handleId) {
    return (
      state.handles.find(function (handle) {
        return handle.id === handleId;
      }) || null
    );
  }

  /* ==========================
       DRAW GUIDE LINES
    ========================== */

  function drawGuides() {
    clearElement(guideLayer);

    if (!state.enabled) {
      return;
    }

    const guideGroups = new Map();

    state.handles.forEach(function (handle) {
      if (!handle.guideGroup) {
        return;
      }

      if (!guideGroups.has(handle.guideGroup)) {
        guideGroups.set(handle.guideGroup, []);
      }

      guideGroups.get(handle.guideGroup).push(handle);
    });

    guideGroups.forEach(function (handles) {
      handles.sort(function (firstHandle, secondHandle) {
        return (
          safeNumber(firstHandle.guideOrder, 0) -
          safeNumber(secondHandle.guideOrder, 0)
        );
      });

      for (let index = 0; index < handles.length - 1; index += 1) {
        const firstHandle = handles[index];

        const secondHandle = handles[index + 1];

        guideLayer.appendChild(
          createLine(
            firstHandle.point,

            secondHandle.point,

            {
              stroke: window.faceInspectorSettings.guideStroke,

              strokeWidth: window.faceInspectorSettings.guideStrokeWidth,

              opacity: window.faceInspectorSettings.guideOpacity,
            },
          ),
        );
      }
    });
  }

  /* ==========================
       HANDLE APPEARANCE
    ========================== */

  function getHandleAppearance(handleId) {
    const settings = window.faceInspectorSettings;

    if (handleId === state.selectedHandleId) {
      return {
        radius: settings.selectedRadius,

        fill: settings.selectedFill,

        stroke: settings.selectedStroke,
      };
    }

    if (handleId === state.hoveredHandleId) {
      return {
        radius: settings.hoverRadius,

        fill: settings.hoverFill,

        stroke: settings.hoverStroke,
      };
    }

    return {
      radius: settings.handleRadius,

      fill: settings.handleFill,

      stroke: settings.handleStroke,
    };
  }

  /* ==========================
       DRAW HANDLES
    ========================== */

  function drawHandles() {
    clearElement(handleLayer);

    if (!state.enabled || !window.faceInspectorSettings.showHandles) {
      return;
    }

    state.handles.forEach(function (handle) {
      if (!handle.point) {
        return;
      }

      const appearance = getHandleAppearance(handle.id);

      const circle = createCircle(
        handle.point,

        appearance.radius,

        {
          fill: appearance.fill,

          stroke: appearance.stroke,

          strokeWidth: window.faceInspectorSettings.handleStrokeWidth,
        },
      );

      circle.dataset.handleId = handle.id;

      circle.style.cursor = state.dragging ? "grabbing" : "grab";

      circle.style.pointerEvents = "all";

      circle.addEventListener(
        "pointerenter",

        handlePointerEnter,
      );

      circle.addEventListener(
        "pointerleave",

        handlePointerLeave,
      );

      circle.addEventListener(
        "pointerdown",

        handlePointerDown,
      );

      handleLayer.appendChild(circle);
    });
  }

  /* ==========================
       HOVER
    ========================== */

  function handlePointerEnter(event) {
    if (state.dragging || !state.enabled) {
      return;
    }

    const handleId = event.currentTarget.dataset.handleId;

    state.hoveredHandleId = handleId;

    const handle = getHandleById(handleId);

    if (handle && !state.selectedHandleId) {
      renderHandlePanel(handle, "Hover");
    }

    drawHandles();
  }

  function handlePointerLeave(event) {
    if (state.dragging) {
      return;
    }

    const handleId = event.currentTarget.dataset.handleId;

    if (state.hoveredHandleId === handleId) {
      state.hoveredHandleId = null;
    }

    if (state.selectedHandleId) {
      renderSelectedHandle();
    } else {
      renderEmptyPanel();
    }

    drawHandles();
  }

  /* ==========================
       START DRAG
    ========================== */

  function handlePointerDown(event) {
    if (!state.enabled) {
      return;
    }

    event.preventDefault();

    event.stopPropagation();

    const handleId = event.currentTarget.dataset.handleId;

    const handle = getHandleById(handleId);

    if (!handle) {
      return;
    }

    const pointer = getSvgPointer(event);

    if (!pointer) {
      return;
    }

    state.selectedHandleId = handleId;

    state.hoveredHandleId = handleId;

    state.dragging = true;

    state.activePointerId = event.pointerId;

    state.dragStartPointer = {
      x: pointer.x,

      y: pointer.y,
    };

    if (typeof handle.beginDrag === "function") {
      state.dragStartSettings = handle.beginDrag() || {};
    } else {
      state.dragStartSettings = getFeatureSettings(handle.feature);
    }

    /*
        A feature redraw can replace the SVG handle during
        pointer-down. Guard pointer capture so a detached
        handle cannot abort the drag operation.
    */

    if (
      event.currentTarget &&
      typeof event.currentTarget.setPointerCapture === "function"
    ) {
      try {
        event.currentTarget.setPointerCapture(event.pointerId);
      } catch (error) {
        console.warn(
          "Face Inspector could not capture this pointer; continuing drag without capture.",
          error,
        );
      }
    }

    window.addEventListener(
      "pointermove",

      handlePointerMove,
    );

    window.addEventListener(
      "pointerup",

      handlePointerUp,
    );

    window.addEventListener(
      "pointercancel",

      handlePointerUp,
    );

    renderHandlePanel(handle, "Dragging");

    drawHandles();
  }

  /* ==========================
       DRAG MOVE
    ========================== */

  function handlePointerMove(event) {
    if (!state.dragging || event.pointerId !== state.activePointerId) {
      return;
    }

    const pointer = getSvgPointer(event);

    if (!pointer || !state.dragStartPointer) {
      return;
    }

    const deltaX =
      (pointer.x - state.dragStartPointer.x) *
      window.faceInspectorSettings.dragScale;

    const deltaY =
      (pointer.y - state.dragStartPointer.y) *
      window.faceInspectorSettings.dragScale;

    const handle = getHandleById(state.selectedHandleId);

    if (!handle || typeof handle.drag !== "function") {
      return;
    }

    handle.drag(
      deltaX,

      deltaY,

      state.dragStartSettings || {},

      {
        handle: handle,

        feature: handle.feature,

        inspector: window.FaceInspector,
      },
    );
  }

  /* ==========================
       END DRAG
    ========================== */

  function handlePointerUp(event) {
    if (!state.dragging) {
      return;
    }

    if (
      state.activePointerId !== null &&
      event.pointerId !== state.activePointerId
    ) {
      return;
    }

    state.dragging = false;

    state.activePointerId = null;

    state.dragStartPointer = null;

    state.dragStartSettings = null;

    window.removeEventListener(
      "pointermove",

      handlePointerMove,
    );

    window.removeEventListener(
      "pointerup",

      handlePointerUp,
    );

    window.removeEventListener(
      "pointercancel",

      handlePointerUp,
    );

    refresh();

    renderSelectedHandle();
  }
  /* ==========================
       PANEL HTML HELPERS
    ========================== */

  function escapeHtml(value) {
    return String(value === undefined || value === null ? "" : value)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function panelRow(label, value) {
    return `

      <div class="faceInspectorRow">

        <span class="faceInspectorLabel">
          ${escapeHtml(label)}
        </span>

        <span class="faceInspectorValue">
          ${escapeHtml(value)}
        </span>

      </div>

    `;
  }

  function formatPropertyName(propertyName) {
    return String(propertyName || "")
      .replace(
        /([A-Z])/g,

        " $1",
      )
      .replace(
        /^./,

        function (firstCharacter) {
          return firstCharacter.toUpperCase();
        },
      );
  }

  /* ==========================
       RENDER HANDLE PANEL
    ========================== */

  function renderHandlePanel(handle, status) {
    if (!panelContent || !handle) {
      return;
    }

    const settings = getFeatureSettings(handle.feature);

    const properties = Array.isArray(handle.properties)
      ? handle.properties
      : [];

    const propertyRows = properties
      .map(function (propertyName) {
        const propertyValue = settings[propertyName];

        return panelRow(
          formatPropertyName(propertyName),

          propertyValue === undefined
            ? "—"
            : formatNumber(
                propertyValue,

                3,
              ),
        );
      })
      .join("");

    const helpText = handle.help || "Drag this handle to edit the feature.";

    panelContent.innerHTML = `

      <div class="faceInspectorSection">

        <div class="faceInspectorSectionTitle">
          Selection
        </div>

        ${panelRow("Handle", handle.label || handle.localId || handle.id)}

        ${panelRow("Feature", handle.featureLabel || handle.feature)}

        ${panelRow("X", formatNumber(handle.point.x, 2))}

        ${panelRow("Y", formatNumber(handle.point.y, 2))}

      </div>


      <div class="faceInspectorSection">

        <div class="faceInspectorSectionTitle">
          Parameters
        </div>

        ${propertyRows || panelRow("Properties", "None")}

      </div>


      <div class="faceInspectorHelp">

        ${escapeHtml(helpText)}

      </div>

    `;

    if (panelStatus) {
      panelStatus.textContent =
        status + " · " + (handle.label || handle.localId || handle.id);
    }
  }

  function renderSelectedHandle() {
    const handle = getHandleById(state.selectedHandleId);

    if (!handle) {
      renderEmptyPanel();

      return;
    }

    renderHandlePanel(handle, "Selected");
  }

  function renderEmptyPanel() {
    if (!panelContent) {
      return;
    }

    panelContent.innerHTML = `

      <div class="faceInspectorEmpty">

        Hover over a FaceLab handle.

        <br><br>

        Click and drag a handle to edit
        its procedural facial feature.

      </div>

    `;

    if (panelStatus) {
      const featureCount =
        window.FaceLab && typeof window.FaceLab.getFeatures === "function"
          ? window.FaceLab.getFeatures().length
          : 0;

      panelStatus.textContent =
        featureCount +
        (featureCount === 1 ? " feature registered" : " features registered");
    }
  }

  /* ==========================
       CLEAR SELECTION
    ========================== */

  function clearSelection() {
    state.selectedHandleId = null;

    state.hoveredHandleId = null;

    state.dragging = false;

    state.activePointerId = null;

    state.dragStartPointer = null;

    state.dragStartSettings = null;

    window.removeEventListener(
      "pointermove",

      handlePointerMove,
    );

    window.removeEventListener(
      "pointerup",

      handlePointerUp,
    );

    window.removeEventListener(
      "pointercancel",

      handlePointerUp,
    );

    renderEmptyPanel();

    drawHandles();
  }

  /* ==========================
       REFRESH
    ========================== */

  function refresh() {
    if (!state.initialized || !state.enabled) {
      return;
    }

    state.handles = collectFeatureHandles();

    /*
      Remove a selection when its
      feature no longer supplies it.
    */

    if (state.selectedHandleId && !getHandleById(state.selectedHandleId)) {
      state.selectedHandleId = null;
    }

    if (state.hoveredHandleId && !getHandleById(state.hoveredHandleId)) {
      state.hoveredHandleId = null;
    }

    drawGuides();

    drawHandles();

    if (state.selectedHandleId) {
      renderSelectedHandle();

      return;
    }

    if (state.hoveredHandleId) {
      const hoveredHandle = getHandleById(state.hoveredHandleId);

      if (hoveredHandle) {
        renderHandlePanel(hoveredHandle, "Hover");

        return;
      }
    }

    renderEmptyPanel();
  }

  /* ==========================
       SHOW INSPECTOR
    ========================== */

  function showInspector() {
    state.enabled = true;

    window.faceInspectorSettings.enabled = true;

    window.faceInspectorSettings.showPanel = true;

    if (panel) {
      panel.hidden = false;
    }

    if (reopenButton) {
      reopenButton.hidden = true;
    }

    if (handleLayer) {
      handleLayer.style.display = "";
    }

    if (guideLayer) {
      guideLayer.style.display = "";
    }

    refresh();
  }

  /* ==========================
       HIDE INSPECTOR
    ========================== */

  function hideInspector() {
    state.enabled = false;

    state.dragging = false;

    state.activePointerId = null;

    state.dragStartPointer = null;

    state.dragStartSettings = null;

    window.faceInspectorSettings.enabled = false;

    window.faceInspectorSettings.showPanel = false;

    window.removeEventListener(
      "pointermove",

      handlePointerMove,
    );

    window.removeEventListener(
      "pointerup",

      handlePointerUp,
    );

    window.removeEventListener(
      "pointercancel",

      handlePointerUp,
    );

    if (handleLayer) {
      handleLayer.style.display = "none";
    }

    if (guideLayer) {
      guideLayer.style.display = "none";
    }

    if (panel) {
      panel.hidden = true;
    }

    if (reopenButton) {
      reopenButton.hidden = false;
    }
  }

  /* ==========================
       ENABLE / DISABLE
    ========================== */

  function enable() {
    showInspector();
  }

  function disable() {
    hideInspector();
  }

  function toggle() {
    if (state.enabled) {
      hideInspector();
    } else {
      showInspector();
    }

    return state.enabled;
  }

  function showPanel() {
    showInspector();
  }

  function hidePanel() {
    hideInspector();
  }
  /* ==========================
       UPDATE SETTINGS
    ========================== */

  function updateSettings(updates) {
    if (!updates || typeof updates !== "object") {
      return {
        ...window.faceInspectorSettings,
      };
    }

    Object.assign(
      window.faceInspectorSettings,

      updates,
    );

    state.enabled = window.faceInspectorSettings.enabled !== false;

    if (window.faceInspectorSettings.showPanel === false) {
      if (panel) {
        panel.hidden = true;
      }

      if (reopenButton) {
        reopenButton.hidden = false;
      }
    } else {
      if (panel) {
        panel.hidden = false;
      }

      if (reopenButton) {
        reopenButton.hidden = true;
      }
    }

    if (state.enabled) {
      if (handleLayer) {
        handleLayer.style.display = "";
      }

      if (guideLayer) {
        guideLayer.style.display = "";
      }

      refresh();
    } else {
      if (handleLayer) {
        handleLayer.style.display = "none";
      }

      if (guideLayer) {
        guideLayer.style.display = "none";
      }
    }

    return {
      ...window.faceInspectorSettings,
    };
  }

  /* ==========================
       RESET SETTINGS
    ========================== */

  function resetSettings() {
    window.faceInspectorSettings = {
      ...defaultFaceInspectorSettings,
    };

    state.enabled = window.faceInspectorSettings.enabled;

    if (state.enabled) {
      showInspector();
    } else {
      hideInspector();
    }

    return {
      ...window.faceInspectorSettings,
    };
  }

  /* ==========================
       SELECT HANDLE
    ========================== */

  function selectHandle(handleId) {
    const handle = getHandleById(handleId);

    if (!handle) {
      return false;
    }

    state.selectedHandleId = handle.id;

    state.hoveredHandleId = null;

    renderSelectedHandle();

    drawHandles();

    return true;
  }

  /* ==========================
       SELECT FEATURE HANDLE
    ========================== */

  function selectFeatureHandle(featureId, localHandleId) {
    return selectHandle(featureId + ":" + localHandleId);
  }

  /* ==========================
       GET CURRENT HANDLES
    ========================== */

  function getHandles() {
    return state.handles.map(function (handle) {
      return {
        ...handle,

        point: handle.point
          ? {
              x: safeNumber(handle.point.x, 0),

              y: safeNumber(handle.point.y, 0),
            }
          : null,
      };
    });
  }

  /* ==========================
       REFRESH AFTER FEATURE UPDATE
    ========================== */

  function handleFaceLabRefresh() {
    if (!state.initialized || !state.enabled) {
      return;
    }

    refresh();
  }

  /* ==========================
       WINDOW RESIZE
    ========================== */

  function handleWindowResize() {
    if (!state.initialized || !state.enabled) {
      return;
    }

    refresh();
  }

  /* ==========================
       INITIALIZE
    ========================== */

  function initialize() {
    if (state.initialized) {
      refresh();

      return true;
    }

    faceSvg = getFaceSvg();

    if (!faceSvg) {
      console.warn("Face Inspector could not find the face SVG.");

      return false;
    }

    createPanelStyles();

    createInspectorLayers();

    createReopenButton();

    createPanel();

    window.addEventListener(
      "resize",

      handleWindowResize,
    );

    window.addEventListener(
      "facelab-refresh",

      handleFaceLabRefresh,
    );

    state.initialized = true;

    if (window.faceInspectorSettings.enabled === false) {
      hideInspector();
    } else {
      showInspector();
    }

    console.log("Face Inspector initialized");

    return true;
  }

  /* ==========================
       DESTROY
    ========================== */

  function destroy() {
    window.removeEventListener(
      "resize",

      handleWindowResize,
    );

    window.removeEventListener(
      "facelab-refresh",

      handleFaceLabRefresh,
    );

    window.removeEventListener(
      "pointermove",

      handlePointerMove,
    );

    window.removeEventListener(
      "pointerup",

      handlePointerUp,
    );

    window.removeEventListener(
      "pointercancel",

      handlePointerUp,
    );

    if (handleLayer) {
      handleLayer.remove();
    }

    if (guideLayer) {
      guideLayer.remove();
    }

    if (panel) {
      panel.remove();
    }

    if (reopenButton) {
      reopenButton.remove();
    }

    handleLayer = null;

    guideLayer = null;

    panel = null;

    panelStatus = null;

    panelContent = null;

    reopenButton = null;

    faceSvg = null;

    state.initialized = false;

    state.dragging = false;

    state.hoveredHandleId = null;

    state.selectedHandleId = null;

    state.activePointerId = null;

    state.dragStartPointer = null;

    state.dragStartSettings = null;

    state.handles = [];
  }

  /* ==========================
       PUBLIC API
    ========================== */

  window.FaceInspector = {
    version: "3.0.1",

    initialize: initialize,

    destroy: destroy,

    refresh: refresh,

    enable: enable,

    disable: disable,

    toggle: toggle,

    show: showInspector,

    hide: hideInspector,

    showPanel: showPanel,

    hidePanel: hidePanel,

    clearSelection: clearSelection,

    selectHandle: selectHandle,

    selectFeatureHandle: selectFeatureHandle,

    getHandles: getHandles,

    getState: function () {
      return {
        initialized: state.initialized,

        enabled: state.enabled,

        dragging: state.dragging,

        hoveredHandleId: state.hoveredHandleId,

        selectedHandleId: state.selectedHandleId,

        activePointerId: state.activePointerId,

        handleCount: state.handles.length,
      };
    },

    getSettings: function () {
      return {
        ...window.faceInspectorSettings,
      };
    },

    updateSettings: updateSettings,

    resetSettings: resetSettings,
  };

  /* ==========================
       AUTOMATIC STARTUP
    ========================== */

  function startFaceInspector() {
    /*
      Wait until the other scripts and SVG
      elements have finished loading.
    */

    window.setTimeout(
      function () {
        initialize();
      },

      0,
    );
  }

  if (document.readyState === "loading") {
    document.addEventListener(
      "DOMContentLoaded",

      startFaceInspector,

      {
        once: true,
      },
    );
  } else {
    startFaceInspector();
  }

  console.log("faceInspector.js V3.0.1 loaded");
})();
