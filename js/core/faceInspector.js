/* ==========================
   FACELAB
   FACE INSPECTOR — VERSION 3.1.3

   Direct-editing inspector for procedural
   FaceLab feature engines.

   Adds:
   - Inspector zoom
   - Grab-to-pan navigation
   - Reset view
   - Recenter view without changing zoom
   - Smaller handles at 100%
   - Progressive handle shrink while zooming
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

    /*
      Smaller default handles.

      These are intentionally kept fairly
      compact because detailed facial
      landmarks can sit very close together.
    */

    handleRadius: 3.5,
    hoverRadius: 4.75,
    selectedRadius: 5.75,

    handleStrokeWidth: 1.25,

    /*
      Controls how aggressively handles
      shrink as Inspector zoom increases.

      1.0 = roughly constant screen size
      >1  = progressively smaller on screen
    */

    handleZoomShrinkPower: 1.25,

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

    /* VIEW */

    zoom: 1,

    zoomMinimum: 0.5,
    zoomMaximum: 3,
    zoomStep: 0.25,

    panX: 0,
    panY: 0,
  };

  window.faceInspectorSettings = {
    ...defaultFaceInspectorSettings,
    ...(window.faceInspectorSettings || {}),
  };

  /* ==========================
     NUMBER HELPERS
  ========================== */

  function safeNumber(value, fallback) {
    const number = Number(value);

    return Number.isFinite(number)
      ? number
      : fallback;
  }

  function clamp(value, minimum, maximum) {
    return Math.max(
      minimum,
      Math.min(maximum, value),
    );
  }

  function formatNumber(value, decimals) {
    return safeNumber(value, 0).toFixed(
      decimals === undefined ? 2 : decimals,
    );
  }

  /* ==========================
     STATE
  ========================== */

  const state = {
    initialized: false,

    enabled:
      window.faceInspectorSettings.enabled,

    dragging: false,

    hoveredHandleId: null,
    selectedHandleId: null,

    activePointerId: null,

    dragStartPointer: null,
    dragStartSettings: null,

    handles: [],

    /* VIEW */

    zoom: safeNumber(
      window.faceInspectorSettings.zoom,
      1,
    ),

    panX: safeNumber(
      window.faceInspectorSettings.panX,
      0,
    ),

    panY: safeNumber(
      window.faceInspectorSettings.panY,
      0,
    ),

    /* PAN */

    panning: false,

    panPointerId: null,

    panStartClientX: 0,
    panStartClientY: 0,

    panStartX: 0,
    panStartY: 0,
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

  let zoomOutButton = null;
  let zoomResetButton = null;
  let zoomInButton = null;

  let recenterButton = null;

  let originalFaceTransform = "";
  let originalFaceTransformOrigin = "";
  let originalFaceCursor = "";

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

    const circle =
      createSvgElement("circle");

    circle.setAttribute(
      "cx",
      safeNumber(point.x, 0),
    );

    circle.setAttribute(
      "cy",
      safeNumber(point.y, 0),
    );

    circle.setAttribute(
      "r",
      safeNumber(radius, 3.5),
    );

    circle.setAttribute(
      "fill",
      settings.fill || "none",
    );

    circle.setAttribute(
      "stroke",
      settings.stroke || "none",
    );

    circle.setAttribute(
      "stroke-width",
      safeNumber(
        settings.strokeWidth,
        1,
      ),
    );

    circle.setAttribute(
      "vector-effect",
      "non-scaling-stroke",
    );

    return circle;
  }

  function createLine(
    firstPoint,
    secondPoint,
    options,
  ) {
    const settings = options || {};

    const line =
      createSvgElement("line");

    line.setAttribute(
      "x1",
      safeNumber(firstPoint.x, 0),
    );

    line.setAttribute(
      "y1",
      safeNumber(firstPoint.y, 0),
    );

    line.setAttribute(
      "x2",
      safeNumber(secondPoint.x, 0),
    );

    line.setAttribute(
      "y2",
      safeNumber(secondPoint.y, 0),
    );

    line.setAttribute(
      "stroke",
      settings.stroke || "#ffffff",
    );

    line.setAttribute(
      "stroke-width",
      safeNumber(
        settings.strokeWidth,
        1,
      ),
    );

    line.setAttribute(
      "stroke-opacity",
      safeNumber(
        settings.opacity,
        1,
      ),
    );

    line.setAttribute(
      "stroke-linecap",
      "round",
    );

    line.setAttribute(
      "vector-effect",
      "non-scaling-stroke",
    );

    return line;
  }

  /* ==========================
     INSPECTOR LAYERS
  ========================== */

  function createInspectorLayers() {
    if (!faceSvg) {
      return;
    }

    guideLayer =
      document.getElementById(
        "faceInspectorGuideLayer",
      );

    if (!guideLayer) {
      guideLayer =
        createSvgElement("g");

      guideLayer.setAttribute(
        "id",
        "faceInspectorGuideLayer",
      );

      guideLayer.style.pointerEvents =
        "none";
    }

    handleLayer =
      document.getElementById(
        "faceInspectorHandleLayer",
      );

    if (!handleLayer) {
      handleLayer =
        createSvgElement("g");

      handleLayer.setAttribute(
        "id",
        "faceInspectorHandleLayer",
      );
    }

    faceSvg.appendChild(guideLayer);
    faceSvg.appendChild(handleLayer);
  }

  /* ==========================
     VIEW / ZOOM
  ========================== */

  function getZoomMinimum() {
    return safeNumber(
      window.faceInspectorSettings.zoomMinimum,
      0.5,
    );
  }

  function getZoomMaximum() {
    return safeNumber(
      window.faceInspectorSettings.zoomMaximum,
      3,
    );
  }

  function getZoomStep() {
    return safeNumber(
      window.faceInspectorSettings.zoomStep,
      0.25,
    );
  }

  function normalizeZoom(value) {
    return clamp(
      safeNumber(value, 1),
      getZoomMinimum(),
      getZoomMaximum(),
    );
  }

  function formatZoomPercent() {
    return (
      Math.round(state.zoom * 100) +
      "%"
    );
  }

  function updateZoomControls() {
    if (zoomResetButton) {
      zoomResetButton.textContent =
        formatZoomPercent();
    }

    if (zoomOutButton) {
      zoomOutButton.disabled =
        state.zoom <=
        getZoomMinimum() + 0.0001;
    }

    if (zoomInButton) {
      zoomInButton.disabled =
        state.zoom >=
        getZoomMaximum() - 0.0001;
    }
  }

  function applyViewTransform() {
    if (!faceSvg) {
      return;
    }

    state.zoom =
      normalizeZoom(state.zoom);

    window.faceInspectorSettings.zoom =
      state.zoom;

    window.faceInspectorSettings.panX =
      state.panX;

    window.faceInspectorSettings.panY =
      state.panY;

    const viewTransform =
      `translate(${state.panX}px, ${state.panY}px) ` +
      `scale(${state.zoom})`;

    faceSvg.style.transformOrigin =
      "50% 50%";

    faceSvg.style.transform =
      originalFaceTransform &&
      originalFaceTransform.trim() !== ""
        ? `${originalFaceTransform} ${viewTransform}`
        : viewTransform;

    updateZoomControls();
  }

  function setZoom(value) {
    state.zoom =
      normalizeZoom(value);

    applyViewTransform();

    if (state.enabled) {
      refresh();
    }

    return state.zoom;
  }

  function zoomIn() {
    return setZoom(
      state.zoom + getZoomStep(),
    );
  }

  function zoomOut() {
    return setZoom(
      state.zoom - getZoomStep(),
    );
  }

  /* ==========================
     RESET VIEW
  ========================== */

  function resetView() {
    state.zoom = 1;

    state.panX = 0;
    state.panY = 0;

    applyViewTransform();

    if (state.enabled) {
      refresh();
    }

    return {
      zoom: state.zoom,
      panX: state.panX,
      panY: state.panY,
    };
  }

  /* ==========================
     RECENTER VIEW
  ========================== */

  function recenterView() {
    state.panX = 0;
    state.panY = 0;

    applyViewTransform();

    if (state.enabled) {
      refresh();
    }

    return {
      zoom: state.zoom,
      panX: state.panX,
      panY: state.panY,
    };
  }

  function setPan(x, y) {
    state.panX =
      safeNumber(x, 0);

    state.panY =
      safeNumber(y, 0);

    applyViewTransform();

    return {
      x: state.panX,
      y: state.panY,
    };
  }

  /* ==========================
     PANEL STYLES
  ========================== */

  function createPanelStyles() {
    if (
      document.getElementById(
        "faceInspectorV2Styles",
      )
    ) {
      return;
    }

    const style =
      document.createElement("style");

    style.id =
      "faceInspectorV2Styles";

    style.textContent = `

      #faceInspectorPanel {
        position: fixed;
        bottom: 1rem;
        right: 1rem;

        width: min(
          26rem,
          calc(100vw - 2rem)
        );

        max-height:
          calc(100vh - 2rem);

        overflow: auto;
        z-index: 10000;
        color: #f4f7fa;

        background-color:
          rgba(20,24,30,.96);

        border:
          1px solid
          rgba(255,255,255,.18);

        border-radius: .75rem;

        box-shadow:
          0 .75rem 2rem
          rgba(0,0,0,.42);

        font-family:
          Arial,
          Helvetica,
          sans-serif;

        font-size: .84rem;

        backdrop-filter:
          blur(.5rem);
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

        gap: .6rem;
        padding: .85rem 1rem;

        background-color:
          rgba(28,33,41,.98);

        border-bottom:
          1px solid
          rgba(255,255,255,.12);

        z-index: 1;
      }

      .faceInspectorTitle {
        font-size: 1rem;
        font-weight: 700;
      }

      .faceInspectorStatus {
        margin-top: .2rem;

        color:
          rgba(255,255,255,.58);

        font-size: .72rem;
      }

      .faceInspectorHeaderButtons {
        display: flex;
        align-items: center;
        gap: .3rem;
        flex-wrap: wrap;
        justify-content: flex-end;
      }

      .faceInspectorHeader button {
        appearance: none;

        border:
          1px solid
          rgba(255,255,255,.16);

        border-radius: .35rem;

        background-color:
          rgba(255,255,255,.06);

        color: white;
        cursor: pointer;

        padding:
          .25rem .45rem;

        font-size: .78rem;
      }

      .faceInspectorHeader button:hover {
        background-color:
          rgba(255,255,255,.12);
      }

      .faceInspectorHeader button:disabled {
        opacity: .35;
        cursor: default;
      }

      .faceInspectorZoomControls {
        display: flex;
        align-items: center;
        gap: .2rem;
      }

      .faceInspectorZoomControls button {
        min-width: 1.9rem;
      }

      #faceInspectorZoomReset {
        min-width: 3.5rem;

        font-family:
          ui-monospace,
          SFMono-Regular,
          Menlo,
          Consolas,
          monospace;

        font-size: .72rem;
      }

      #faceInspectorRecenter {
        min-width: 3.6rem;
      }

      #faceInspectorClose {
        border: 0;
        background: transparent;

        font-size: 1.25rem;
        line-height: 1;
      }

      .faceInspectorContent {
        padding: 1rem;
      }

      .faceInspectorEmpty {
        padding:
          1.2rem .5rem;

        text-align: center;

        color:
          rgba(255,255,255,.58);

        line-height: 1.55;
      }

      .faceInspectorSection {
        margin-bottom: 1rem;
      }

      .faceInspectorSection:last-child {
        margin-bottom: 0;
      }

      .faceInspectorSectionTitle {
        margin-bottom: .5rem;
        padding-bottom: .35rem;

        color: #83e9ff;

        border-bottom:
          1px solid
          rgba(255,255,255,.12);

        font-size: .68rem;
        font-weight: 700;
        letter-spacing: .07em;
        text-transform: uppercase;
      }

      .faceInspectorRow {
        display: grid;

        grid-template-columns:
          minmax(0,1fr)
          auto;

        gap: 1rem;

        padding:
          .27rem 0;
      }

      .faceInspectorLabel {
        color:
          rgba(255,255,255,.63);
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
        margin-top: .75rem;
        padding: .65rem;

        color:
          rgba(255,255,255,.65);

        background-color:
          rgba(255,255,255,.05);

        border-radius: .4rem;

        line-height: 1.45;
      }

      #faceInspectorReopen {
        position: fixed;

        right: 1rem;
        bottom: 1rem;

        z-index: 10001;

        display: flex;
        align-items: center;

        gap: .45rem;

        padding:
          .7rem 1rem;

        border: none;
        border-radius: 999px;

        background: #1c2129;
        color: white;

        cursor: pointer;

        font-size: .85rem;
        font-weight: 600;

        box-shadow:
          0 8px 24px
          rgba(0,0,0,.35);
      }

      #faceInspectorReopen[hidden] {
        display: none;
      }

    `;

    document.head.appendChild(style);
  }

  /* ==========================
     REOPEN BUTTON
  ========================== */

  function createReopenButton() {
    const existingButton =
      document.getElementById(
        "faceInspectorReopen",
      );

    if (existingButton) {
      reopenButton =
        existingButton;

      return;
    }

    reopenButton =
      document.createElement("button");

    reopenButton.type =
      "button";

    reopenButton.id =
      "faceInspectorReopen";

    reopenButton.textContent =
      "✦ Inspector";

    reopenButton.addEventListener(
      "click",
      function () {
        showInspector();
      },
    );

    reopenButton.hidden = true;

    document.body.appendChild(
      reopenButton,
    );
  }

  /* ==========================
     PANEL
  ========================== */

  function createPanel() {
    const existingPanel =
      document.getElementById(
        "faceInspectorPanel",
      );

    if (existingPanel) {
      existingPanel.remove();
    }

    panel =
      document.createElement("aside");

    panel.id =
      "faceInspectorPanel";

    panel.innerHTML = `

      <div class="faceInspectorHeader">

        <div>

          <div class="faceInspectorTitle">
            Face Inspector 3.1
          </div>

          <div class="faceInspectorStatus">
            Direct Editing
          </div>

        </div>

        <div class="faceInspectorHeaderButtons">

          <div class="faceInspectorZoomControls">

            <button
              type="button"
              id="faceInspectorZoomOut"
              title="Zoom out"
            >
              −
            </button>

            <button
              type="button"
              id="faceInspectorZoomReset"
              title="Reset zoom to 100% and recenter"
            >
              100%
            </button>

            <button
              type="button"
              id="faceInspectorZoomIn"
              title="Zoom in"
            >
              +
            </button>

          </div>

          <button
            type="button"
            id="faceInspectorRecenter"
            title="Recenter face without changing zoom"
          >
            Center
          </button>

          <button
            type="button"
            id="faceInspectorClear"
          >
            Clear
          </button>

          <button
            type="button"
            id="faceInspectorClose"
          >
            ×
          </button>

        </div>

      </div>

      <div class="faceInspectorContent">

        <div class="faceInspectorEmpty">

          Hover over a FaceLab handle.

          <br><br>

          Drag a handle to edit anatomy.

          <br><br>

          Drag empty face space to pan.

        </div>

      </div>

    `;

    document.body.appendChild(panel);

    panelStatus =
      panel.querySelector(
        ".faceInspectorStatus",
      );

    panelContent =
      panel.querySelector(
        ".faceInspectorContent",
      );

    zoomOutButton =
      panel.querySelector(
        "#faceInspectorZoomOut",
      );

    zoomResetButton =
      panel.querySelector(
        "#faceInspectorZoomReset",
      );

    zoomInButton =
      panel.querySelector(
        "#faceInspectorZoomIn",
      );

    recenterButton =
      panel.querySelector(
        "#faceInspectorRecenter",
      );

    const clearButton =
      panel.querySelector(
        "#faceInspectorClear",
      );

    const closeButton =
      panel.querySelector(
        "#faceInspectorClose",
      );

    if (zoomOutButton) {
      zoomOutButton.addEventListener(
        "click",
        zoomOut,
      );
    }

    if (zoomResetButton) {
      zoomResetButton.addEventListener(
        "click",
        resetView,
      );
    }

    if (zoomInButton) {
      zoomInButton.addEventListener(
        "click",
        zoomIn,
      );
    }

    if (recenterButton) {
      recenterButton.addEventListener(
        "click",
        recenterView,
      );
    }

    if (clearButton) {
      clearButton.addEventListener(
        "click",
        clearSelection,
      );
    }

    if (closeButton) {
      closeButton.addEventListener(
        "click",
        hideInspector,
      );
    }

    panel.hidden =
      !window.faceInspectorSettings.showPanel;

    updateZoomControls();
  }

  /* ==========================
     POINTER POSITION
  ========================== */

  function getSvgPointer(event) {
    if (!faceSvg) {
      return null;
    }

    const matrix =
      faceSvg.getScreenCTM();

    if (!matrix) {
      return null;
    }

    const svgPoint =
      faceSvg.createSVGPoint();

    svgPoint.x =
      event.clientX;

    svgPoint.y =
      event.clientY;

    return svgPoint.matrixTransform(
      matrix.inverse(),
    );
  }

  /* ==========================
     PAN START
  ========================== */

  function handleFacePointerDown(event) {
    if (!state.enabled) {
      return;
    }

    if (
      event.button !== undefined &&
      event.button !== 0
    ) {
      return;
    }

    event.preventDefault();

    state.panning = true;

    state.panPointerId =
      event.pointerId;

    state.panStartClientX =
      event.clientX;

    state.panStartClientY =
      event.clientY;

    state.panStartX =
      state.panX;

    state.panStartY =
      state.panY;

    faceSvg.style.cursor =
      "grabbing";

    window.addEventListener(
      "pointermove",
      handlePanMove,
    );

    window.addEventListener(
      "pointerup",
      handlePanEnd,
    );

    window.addEventListener(
      "pointercancel",
      handlePanEnd,
    );
  }

  /* ==========================
     PAN MOVE
  ========================== */

  function handlePanMove(event) {
    if (
      !state.panning ||
      event.pointerId !==
        state.panPointerId
    ) {
      return;
    }

    const deltaX =
      event.clientX -
      state.panStartClientX;

    const deltaY =
      event.clientY -
      state.panStartClientY;

    state.panX =
      state.panStartX +
      deltaX;

    state.panY =
      state.panStartY +
      deltaY;

    applyViewTransform();
  }

  /* ==========================
     PAN END
  ========================== */

  function handlePanEnd(event) {
    if (!state.panning) {
      return;
    }

    if (
      state.panPointerId !== null &&
      event.pointerId !==
        state.panPointerId
    ) {
      return;
    }

    state.panning = false;

    state.panPointerId = null;

    if (faceSvg) {
      faceSvg.style.cursor =
        "grab";
    }

    window.removeEventListener(
      "pointermove",
      handlePanMove,
    );

    window.removeEventListener(
      "pointerup",
      handlePanEnd,
    );

    window.removeEventListener(
      "pointercancel",
      handlePanEnd,
    );
  }

  /* ==========================
     FEATURE HANDLES
  ========================== */

  function collectFeatureHandles() {
    if (
      !window.FaceLab ||
      typeof window.FaceLab.getHandles !==
        "function"
    ) {
      return [];
    }

    const handles =
      window.FaceLab.getHandles();

    return Array.isArray(handles)
      ? handles
      : [];
  }

  /* ==========================
     FEATURE SETTINGS
  ========================== */

  function getFeatureSettings(featureId) {
    if (
      window.FaceLab &&
      window.FaceLab.Core &&
      typeof window.FaceLab.Core
        .getFeatureSettings ===
        "function"
    ) {
      return (
        window.FaceLab.Core
          .getFeatureSettings(
            featureId,
          ) || {}
      );
    }

    return {};
  }

  /* ==========================
     HANDLE LOOKUP
  ========================== */

  function getHandleById(handleId) {
    return (
      state.handles.find(
        function (handle) {
          return (
            handle.id ===
            handleId
          );
        },
      ) || null
    );
  }

  /* ==========================
     DRAW GUIDES
  ========================== */

  function drawGuides() {
    clearElement(guideLayer);

    if (!state.enabled) {
      return;
    }

    const guideGroups =
      new Map();

    state.handles.forEach(
      function (handle) {
        if (!handle.guideGroup) {
          return;
        }

        if (
          !guideGroups.has(
            handle.guideGroup,
          )
        ) {
          guideGroups.set(
            handle.guideGroup,
            [],
          );
        }

        guideGroups
          .get(handle.guideGroup)
          .push(handle);
      },
    );

    guideGroups.forEach(
      function (handles) {
        handles.sort(
          function (a, b) {
            return (
              safeNumber(
                a.guideOrder,
                0,
              ) -
              safeNumber(
                b.guideOrder,
                0,
              )
            );
          },
        );

        for (
          let index = 0;
          index <
          handles.length - 1;
          index += 1
        ) {
          guideLayer.appendChild(
            createLine(
              handles[index].point,
              handles[index + 1]
                .point,
              {
                stroke:
                  window
                    .faceInspectorSettings
                    .guideStroke,

                strokeWidth:
                  window
                    .faceInspectorSettings
                    .guideStrokeWidth,

                opacity:
                  window
                    .faceInspectorSettings
                    .guideOpacity,
              },
            ),
          );
        }
      },
    );
  }

  /* ==========================
     HANDLE APPEARANCE
  ========================== */

  function getZoomAdjustedHandleRadius(
    radius,
  ) {
    const zoom =
      Math.max(
        1,
        safeNumber(
          state.zoom,
          1,
        ),
      );

    const shrinkPower =
      Math.max(
        0,
        safeNumber(
          window
            .faceInspectorSettings
            .handleZoomShrinkPower,
          1.25,
        ),
      );

    /*
      The face SVG is being enlarged by zoom.

      Dividing the SVG-space radius by the
      zoom factor prevents the landmark from
      growing along with the face.

      Using a power above 1 makes it become
      slightly smaller on screen as zoom
      increases.
    */

    return (
      safeNumber(
        radius,
        3.5,
      ) /
      Math.pow(
        zoom,
        shrinkPower,
      )
    );
  }

  function getHandleAppearance(
    handleId,
  ) {
    const settings =
      window.faceInspectorSettings;

    if (
      handleId ===
      state.selectedHandleId
    ) {
      return {
        radius:
          getZoomAdjustedHandleRadius(
            settings.selectedRadius,
          ),

        fill:
          settings.selectedFill,

        stroke:
          settings.selectedStroke,
      };
    }

    if (
      handleId ===
      state.hoveredHandleId
    ) {
      return {
        radius:
          getZoomAdjustedHandleRadius(
            settings.hoverRadius,
          ),

        fill:
          settings.hoverFill,

        stroke:
          settings.hoverStroke,
      };
    }

    return {
      radius:
        getZoomAdjustedHandleRadius(
          settings.handleRadius,
        ),

      fill:
        settings.handleFill,

      stroke:
        settings.handleStroke,
    };
  }

  /* ==========================
     DRAW HANDLES
  ========================== */

  function drawHandles() {
    clearElement(handleLayer);

    if (
      !state.enabled ||
      !window.faceInspectorSettings
        .showHandles
    ) {
      return;
    }

    state.handles.forEach(
      function (handle) {
        if (!handle.point) {
          return;
        }

        const appearance =
          getHandleAppearance(
            handle.id,
          );

        const circle =
          createCircle(
            handle.point,
            appearance.radius,
            {
              fill:
                appearance.fill,

              stroke:
                appearance.stroke,

              strokeWidth:
                window
                  .faceInspectorSettings
                  .handleStrokeWidth,
            },
          );

        circle.dataset.handleId =
          handle.id;

        circle.style.cursor =
          state.dragging
            ? "grabbing"
            : "grab";

        circle.style.pointerEvents =
          "all";

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

        handleLayer.appendChild(
          circle,
        );
      },
    );
  }

  /* ==========================
     HOVER
  ========================== */

  function handlePointerEnter(event) {
    if (
      state.dragging ||
      !state.enabled
    ) {
      return;
    }

    const handleId =
      event.currentTarget.dataset
        .handleId;

    state.hoveredHandleId =
      handleId;

    const handle =
      getHandleById(handleId);

    if (
      handle &&
      !state.selectedHandleId
    ) {
      renderHandlePanel(
        handle,
        "Hover",
      );
    }

    drawHandles();
  }

  function handlePointerLeave(event) {
    if (state.dragging) {
      return;
    }

    const handleId =
      event.currentTarget.dataset
        .handleId;

    if (
      state.hoveredHandleId ===
      handleId
    ) {
      state.hoveredHandleId =
        null;
    }

    if (
      state.selectedHandleId
    ) {
      renderSelectedHandle();
    } else {
      renderEmptyPanel();
    }

    drawHandles();
  }

  /* ==========================
     HANDLE DRAG START
  ========================== */

  function handlePointerDown(event) {
    if (!state.enabled) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();

    const handleId =
      event.currentTarget.dataset
        .handleId;

    const handle =
      getHandleById(handleId);

    if (!handle) {
      return;
    }

    const pointer =
      getSvgPointer(event);

    if (!pointer) {
      return;
    }

    state.selectedHandleId =
      handleId;

    state.hoveredHandleId =
      handleId;

    state.dragging = true;

    state.activePointerId =
      event.pointerId;

    state.dragStartPointer = {
      x: pointer.x,
      y: pointer.y,
    };

    if (
      typeof handle.beginDrag ===
      "function"
    ) {
      state.dragStartSettings =
        handle.beginDrag() || {};
    } else {
      state.dragStartSettings =
        getFeatureSettings(
          handle.feature,
        );
    }

    if (
      event.currentTarget &&
      typeof event.currentTarget
        .setPointerCapture ===
        "function"
    ) {
      try {
        event.currentTarget
          .setPointerCapture(
            event.pointerId,
          );
      } catch (error) {
        console.warn(
          "Face Inspector could not capture pointer.",
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

    renderHandlePanel(
      handle,
      "Dragging",
    );

    drawHandles();
  }

  /* ==========================
     HANDLE DRAG MOVE
  ========================== */

  function handlePointerMove(event) {
    if (
      !state.dragging ||
      event.pointerId !==
        state.activePointerId
    ) {
      return;
    }

    const pointer =
      getSvgPointer(event);

    if (
      !pointer ||
      !state.dragStartPointer
    ) {
      return;
    }

    const deltaX =
      (
        pointer.x -
        state.dragStartPointer.x
      ) *
      window
        .faceInspectorSettings
        .dragScale;

    const deltaY =
      (
        pointer.y -
        state.dragStartPointer.y
      ) *
      window
        .faceInspectorSettings
        .dragScale;

    const handle =
      getHandleById(
        state.selectedHandleId,
      );

    if (
      !handle ||
      typeof handle.drag !==
        "function"
    ) {
      return;
    }

    handle.drag(
      deltaX,
      deltaY,
      state.dragStartSettings || {},
      {
        handle,
        feature:
          handle.feature,
        inspector:
          window.FaceInspector,
      },
    );
  }

  /* ==========================
     HANDLE DRAG END
  ========================== */

  function handlePointerUp(event) {
    if (!state.dragging) {
      return;
    }

    if (
      state.activePointerId !==
        null &&
      event.pointerId !==
        state.activePointerId
    ) {
      return;
    }

    state.dragging = false;

    state.activePointerId =
      null;

    state.dragStartPointer =
      null;

    state.dragStartSettings =
      null;

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
     PANEL HELPERS
  ========================== */

  function escapeHtml(value) {
    return String(
      value === undefined ||
      value === null
        ? ""
        : value,
    )
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll(
        "'",
        "&#039;",
      );
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

  function formatPropertyName(
    propertyName,
  ) {
    return String(
      propertyName || "",
    )
      .replace(
        /([A-Z])/g,
        " $1",
      )
      .replace(
        /^./,
        function (
          firstCharacter,
        ) {
          return firstCharacter
            .toUpperCase();
        },
      );
  }

  /* ==========================
     RENDER PANEL
  ========================== */

  function renderHandlePanel(
    handle,
    status,
  ) {
    if (
      !panelContent ||
      !handle
    ) {
      return;
    }

    const settings =
      getFeatureSettings(
        handle.feature,
      );

    const properties =
      Array.isArray(
        handle.properties,
      )
        ? handle.properties
        : [];

    const propertyRows =
      properties
        .map(
          function (
            propertyName,
          ) {
            const value =
              settings[
                propertyName
              ];

            return panelRow(
              formatPropertyName(
                propertyName,
              ),

              value === undefined
                ? "—"
                : formatNumber(
                    value,
                    3,
                  ),
            );
          },
        )
        .join("");

    panelContent.innerHTML = `

      <div class="faceInspectorSection">

        <div class="faceInspectorSectionTitle">
          Selection
        </div>

        ${panelRow(
          "Handle",
          handle.label ||
            handle.localId ||
            handle.id,
        )}

        ${panelRow(
          "Feature",
          handle.featureLabel ||
            handle.feature,
        )}

        ${panelRow(
          "X",
          formatNumber(
            handle.point.x,
            2,
          ),
        )}

        ${panelRow(
          "Y",
          formatNumber(
            handle.point.y,
            2,
          ),
        )}

      </div>

      <div class="faceInspectorSection">

        <div class="faceInspectorSectionTitle">
          Parameters
        </div>

        ${
          propertyRows ||
          panelRow(
            "Properties",
            "None",
          )
        }

      </div>

      <div class="faceInspectorHelp">

        ${escapeHtml(
          handle.help ||
            "Drag this handle to edit the feature.",
        )}

      </div>

    `;

    if (panelStatus) {
      panelStatus.textContent =
        status +
        " · " +
        (
          handle.label ||
          handle.localId ||
          handle.id
        );
    }
  }

  function renderSelectedHandle() {
    const handle =
      getHandleById(
        state.selectedHandleId,
      );

    if (!handle) {
      renderEmptyPanel();
      return;
    }

    renderHandlePanel(
      handle,
      "Selected",
    );
  }

  function renderEmptyPanel() {
    if (!panelContent) {
      return;
    }

    panelContent.innerHTML = `

      <div class="faceInspectorEmpty">

        Hover over a FaceLab handle.

        <br><br>

        Drag a landmark to edit
        facial geometry.

        <br><br>

        Drag empty face space to
        reposition the view.

      </div>

    `;

    if (panelStatus) {
      const featureCount =
        window.FaceLab &&
        typeof window.FaceLab
          .getFeatures ===
          "function"
          ? window.FaceLab
              .getFeatures()
              .length
          : 0;

      panelStatus.textContent =
        featureCount +
        (
          featureCount === 1
            ? " feature registered"
            : " features registered"
        );
    }
  }

  /* ==========================
     CLEAR SELECTION
  ========================== */

  function clearSelection() {
    state.selectedHandleId =
      null;

    state.hoveredHandleId =
      null;

    state.dragging = false;

    state.activePointerId =
      null;

    state.dragStartPointer =
      null;

    state.dragStartSettings =
      null;

    renderEmptyPanel();

    drawHandles();
  }

  /* ==========================
     REFRESH
  ========================== */

  function refresh() {
    if (
      !state.initialized ||
      !state.enabled
    ) {
      return;
    }

    state.handles =
      collectFeatureHandles();

    if (
      state.selectedHandleId &&
      !getHandleById(
        state.selectedHandleId,
      )
    ) {
      state.selectedHandleId =
        null;
    }

    if (
      state.hoveredHandleId &&
      !getHandleById(
        state.hoveredHandleId,
      )
    ) {
      state.hoveredHandleId =
        null;
    }

    drawGuides();
    drawHandles();

    updateZoomControls();

    if (
      state.selectedHandleId
    ) {
      renderSelectedHandle();
      return;
    }

    if (
      state.hoveredHandleId
    ) {
      const handle =
        getHandleById(
          state.hoveredHandleId,
        );

      if (handle) {
        renderHandlePanel(
          handle,
          "Hover",
        );

        return;
      }
    }

    renderEmptyPanel();
  }

  /* ==========================
     SHOW / HIDE
  ========================== */

  function showInspector() {
    state.enabled = true;

    window.faceInspectorSettings.enabled =
      true;

    window.faceInspectorSettings.showPanel =
      true;

    if (panel) {
      panel.hidden = false;
    }

    if (reopenButton) {
      reopenButton.hidden = true;
    }

    if (handleLayer) {
      handleLayer.style.display =
        "";
    }

    if (guideLayer) {
      guideLayer.style.display =
        "";
    }

    applyViewTransform();

    refresh();
  }

  function hideInspector() {
    state.enabled = false;

    state.dragging = false;
    state.panning = false;

    state.activePointerId = null;
    state.panPointerId = null;

    window.faceInspectorSettings.enabled =
      false;

    window.faceInspectorSettings.showPanel =
      false;

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

    window.removeEventListener(
      "pointermove",
      handlePanMove,
    );

    window.removeEventListener(
      "pointerup",
      handlePanEnd,
    );

    window.removeEventListener(
      "pointercancel",
      handlePanEnd,
    );

    if (handleLayer) {
      handleLayer.style.display =
        "none";
    }

    if (guideLayer) {
      guideLayer.style.display =
        "none";
    }

    if (panel) {
      panel.hidden = true;
    }

    if (reopenButton) {
      reopenButton.hidden =
        false;
    }
  }

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

  /* ==========================
     SETTINGS
  ========================== */

  function updateSettings(
    updates,
  ) {
    if (
      !updates ||
      typeof updates !==
        "object"
    ) {
      return {
        ...window.faceInspectorSettings,
      };
    }

    Object.assign(
      window.faceInspectorSettings,
      updates,
    );

    if (
      updates.enabled !==
      undefined
    ) {
      state.enabled =
        updates.enabled !== false;
    }

    if (
      updates.zoom !==
      undefined
    ) {
      state.zoom =
        normalizeZoom(
          updates.zoom,
        );
    }

    if (
      updates.panX !==
      undefined
    ) {
      state.panX =
        safeNumber(
          updates.panX,
          0,
        );
    }

    if (
      updates.panY !==
      undefined
    ) {
      state.panY =
        safeNumber(
          updates.panY,
          0,
        );
    }

    applyViewTransform();

    if (
      window.faceInspectorSettings
        .showPanel === false
    ) {
      if (panel) {
        panel.hidden = true;
      }

      if (reopenButton) {
        reopenButton.hidden =
          false;
      }
    } else {
      if (panel) {
        panel.hidden = false;
      }

      if (reopenButton) {
        reopenButton.hidden =
          true;
      }
    }

    if (state.enabled) {
      if (handleLayer) {
        handleLayer.style.display =
          "";
      }

      if (guideLayer) {
        guideLayer.style.display =
          "";
      }

      refresh();
    } else {
      if (handleLayer) {
        handleLayer.style.display =
          "none";
      }

      if (guideLayer) {
        guideLayer.style.display =
          "none";
      }
    }

    return {
      ...window.faceInspectorSettings,
    };
  }

  function resetSettings() {
    window.faceInspectorSettings = {
      ...defaultFaceInspectorSettings,
    };

    state.enabled =
      window.faceInspectorSettings
        .enabled;

    resetView();

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
     HANDLE SELECTION
  ========================== */

  function selectHandle(handleId) {
    const handle =
      getHandleById(handleId);

    if (!handle) {
      return false;
    }

    state.selectedHandleId =
      handle.id;

    state.hoveredHandleId =
      null;

    renderSelectedHandle();

    drawHandles();

    return true;
  }

  function selectFeatureHandle(
    featureId,
    localHandleId,
  ) {
    return selectHandle(
      featureId +
        ":" +
        localHandleId,
    );
  }

  function getHandles() {
    return state.handles.map(
      function (handle) {
        return {
          ...handle,

          point:
            handle.point
              ? {
                  x:
                    safeNumber(
                      handle.point.x,
                      0,
                    ),

                  y:
                    safeNumber(
                      handle.point.y,
                      0,
                    ),
                }
              : null,
        };
      },
    );
  }

  /* ==========================
     FACELAB REFRESH
  ========================== */

  function handleFaceLabRefresh() {
    if (
      !state.initialized ||
      !state.enabled
    ) {
      return;
    }

    refresh();
  }

  function handleWindowResize() {
    if (
      !state.initialized
    ) {
      return;
    }

    applyViewTransform();

    if (state.enabled) {
      refresh();
    }
  }

  /* ==========================
     INITIALIZE
  ========================== */

  function initialize() {
    if (state.initialized) {
      refresh();
      return true;
    }

    faceSvg =
      getFaceSvg();

    if (!faceSvg) {
      console.warn(
        "Face Inspector could not find the face SVG.",
      );

      return false;
    }

    originalFaceTransform =
      faceSvg.style.transform ||
      "";

    originalFaceTransformOrigin =
      faceSvg.style
        .transformOrigin ||
      "";

    originalFaceCursor =
      faceSvg.style.cursor ||
      "";

    createPanelStyles();

    createInspectorLayers();

    createReopenButton();

    createPanel();

    state.zoom =
      normalizeZoom(
        window
          .faceInspectorSettings
          .zoom,
      );

    state.panX =
      safeNumber(
        window
          .faceInspectorSettings
          .panX,
        0,
      );

    state.panY =
      safeNumber(
        window
          .faceInspectorSettings
          .panY,
        0,
      );

    applyViewTransform();

    faceSvg.style.cursor =
      "grab";

    faceSvg.addEventListener(
      "pointerdown",
      handleFacePointerDown,
    );

    window.addEventListener(
      "resize",
      handleWindowResize,
    );

    window.addEventListener(
      "facelab-refresh",
      handleFaceLabRefresh,
    );

    state.initialized = true;

    if (
      window
        .faceInspectorSettings
        .enabled === false
    ) {
      hideInspector();
    } else {
      showInspector();
    }

    console.log(
      "Face Inspector 3.1.3 initialized",
    );

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

    window.removeEventListener(
      "pointermove",
      handlePanMove,
    );

    window.removeEventListener(
      "pointerup",
      handlePanEnd,
    );

    window.removeEventListener(
      "pointercancel",
      handlePanEnd,
    );

    if (faceSvg) {
      faceSvg.removeEventListener(
        "pointerdown",
        handleFacePointerDown,
      );

      faceSvg.style.transform =
        originalFaceTransform;

      faceSvg.style.transformOrigin =
        originalFaceTransformOrigin;

      faceSvg.style.cursor =
        originalFaceCursor;
    }

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

    zoomOutButton = null;
    zoomResetButton = null;
    zoomInButton = null;
    recenterButton = null;

    faceSvg = null;

    state.initialized = false;

    state.dragging = false;
    state.panning = false;

    state.hoveredHandleId = null;
    state.selectedHandleId = null;

    state.activePointerId = null;
    state.panPointerId = null;

    state.dragStartPointer = null;
    state.dragStartSettings = null;

    state.handles = [];
  }

  /* ==========================
     PUBLIC API
  ========================== */

  window.FaceInspector = {
    version: "3.1.3",

    initialize,
    destroy,

    refresh,

    enable,
    disable,
    toggle,

    show: showInspector,
    hide: hideInspector,

    showPanel: showInspector,
    hidePanel: hideInspector,

    clearSelection,

    selectHandle,
    selectFeatureHandle,

    getHandles,

    /* VIEW */

    zoomIn,
    zoomOut,

    setZoom,
    setPan,

    resetZoom: resetView,
    resetView,

    recenterView,

    getZoom: function () {
      return state.zoom;
    },

    getView: function () {
      return {
        zoom:
          state.zoom,

        panX:
          state.panX,

        panY:
          state.panY,
      };
    },

    getState: function () {
      return {
        initialized:
          state.initialized,

        enabled:
          state.enabled,

        dragging:
          state.dragging,

        panning:
          state.panning,

        hoveredHandleId:
          state.hoveredHandleId,

        selectedHandleId:
          state.selectedHandleId,

        activePointerId:
          state.activePointerId,

        handleCount:
          state.handles.length,

        zoom:
          state.zoom,

        panX:
          state.panX,

        panY:
          state.panY,
      };
    },

    getSettings: function () {
      return {
        ...window.faceInspectorSettings,
      };
    },

    updateSettings,

    resetSettings,
  };

  /* ==========================
     AUTOMATIC STARTUP
  ========================== */

  function startFaceInspector() {
    window.setTimeout(
      function () {
        initialize();
      },
      0,
    );
  }

  if (
    document.readyState ===
    "loading"
  ) {
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

  console.log(
    "faceInspector.js V3.1.3 loaded",
  );
})();
