/* ==========================
   FACELAB
   FACE INSPECTOR — VERSION 2.0

   Direct-editing inspector for procedural
   FaceLab feature engines.

   Current editable feature:
   - Mouth

   Mouth handles:
   - Left corner
   - Right corner
   - Cupid bow
   - Upper lip
   - Lower lip

   Requires:
   - MouthEngine
   - mouthEngineSettings
   - Face SVG
========================== */

(function () {
  "use strict";

  const SVG_NAMESPACE = "http://www.w3.org/2000/svg";

  /* ==========================
       DEFAULT SETTINGS
    ========================== */

  const defaultFaceInspectorSettings = {
    enabled: true,

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
        rgba(255,255,255,.65);

    background-color:
        rgba(255,255,255,.05);

    border-radius:.4rem;

    line-height:1.45;

}


/* ==========================
   FLOATING REOPEN BUTTON
========================== */

#faceInspectorReopen{

    position:fixed;

    right:1rem;
    bottom:1rem;

    z-index:10001;

    display:flex;
    align-items:center;
    gap:.45rem;

    padding:.7rem 1rem;

    border:none;

    border-radius:999px;

    background:#1c2129;

    color:white;

    cursor:pointer;

    font-size:.85rem;

    font-weight:600;

    box-shadow:
        0 8px 24px rgba(0,0,0,.35);

    transition:
        transform .15s ease,
        background .15s ease;

}

#faceInspectorReopen:hover{

    background:#28303b;

    transform:translateY(-2px);

}

#faceInspectorReopen[hidden]{

    display:none;

}
        `;

    document.head.appendChild(style);
  }
/* ==========================
   CREATE REOPEN BUTTON
========================== */

function createReopenButton() {

    const existingButton =
        document.getElementById(
            "faceInspectorReopen"
        );


    if (existingButton) {

        reopenButton =
            existingButton;

        return;
    }


    reopenButton =
        document.createElement(
            "button"
        );


    reopenButton.type =
        "button";


    reopenButton.id =
        "faceInspectorReopen";


    reopenButton.textContent =
        "✦ Inspector";


    reopenButton.setAttribute(
        "aria-label",
        "Open Face Inspector"
    );


    reopenButton.addEventListener(
        "click",

        function () {

            showInspector();

        }
    );


    reopenButton.hidden =
        true;


    document.body.appendChild(
        reopenButton
    );

}
  /* ==========================
       CREATE PANEL
    ========================== */

  function createPanel() {
    let existingPanel = document.getElementById("faceInspectorPanel");

    /*
            Replace the old inspector panel if
            Face Inspector V1 created it.
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
                        Face Inspector 2
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

                    Hover over a mouth handle.

                    <br><br>

                    Click and drag a handle to edit
                    the procedural mouth directly.

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

           }
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
       CURRENT MOUTH GEOMETRY
    ========================== */

  function getMouthGeometry() {
    if (
      !window.MouthEngine ||
      typeof window.MouthEngine.getGeometry !== "function"
    ) {
      return null;
    }

    return window.MouthEngine.getGeometry();
  }

  function getMouthSamples() {
    const geometry = getMouthGeometry();

    if (!geometry || !Array.isArray(geometry.anatomySamples)) {
      return [];
    }

    return geometry.anatomySamples;
  }

  function findNearestSample(targetT) {
    const samples = getMouthSamples();

    if (!samples.length) {
      return null;
    }

    let nearest = samples[0];

    let nearestDistance = Math.abs(safeNumber(nearest.t, 0) - targetT);

    samples.forEach(function (sample) {
      const distance = Math.abs(safeNumber(sample.t, 0) - targetT);

      if (distance < nearestDistance) {
        nearest = sample;

        nearestDistance = distance;
      }
    });

    return nearest;
  }

  /* ==========================
       HANDLE DEFINITIONS
    ========================== */

  function createMouthHandles() {
    const geometry = getMouthGeometry();

    if (!geometry) {
      return [];
    }

    const landmarks = Array.isArray(geometry.landmarks)
      ? geometry.landmarks
      : [];

    const samples = getMouthSamples();

    if (landmarks.length < 2 || !samples.length) {
      return [];
    }

    const leftCorner = landmarks[0];

    const rightCorner = landmarks[landmarks.length - 1];

    const upperSample = findNearestSample(0.28);
    const cupidPeakSample = findNearestSample(0.4);
    const centerSample = findNearestSample(0.5);

    if (
      !leftCorner ||
      !rightCorner ||
      !upperSample ||
      !cupidPeakSample ||
      !centerSample
    ) {
      return [];
    }

    return [
      {
        id: "mouthLeftCorner",

        label: "Left Mouth Corner",

        feature: "mouth",

        point: leftCorner,

        properties: ["width", "cornerY"],

        help: "Drag horizontally to change mouth width. Drag vertically to change corner height.",

        drag: dragLeftCorner,
      },

      {
        id: "mouthRightCorner",

        label: "Right Mouth Corner",

        feature: "mouth",

        point: rightCorner,

        properties: ["width", "cornerY"],

        help: "Drag horizontally to change mouth width. Drag vertically to change corner height.",

        drag: dragRightCorner,
      },

      {
        id: "mouthCupidBow",

        label: "Cupid Bow",

        feature: "mouth",

        point: cupidPeakSample.upperBorder,

        properties: ["cupidBowHeight", "cupidBowWidth", "philtrumDip"],

        help: "Drag vertically to raise or lower the cupid bow. Drag horizontally to alter cupid-bow width.",

        drag: dragCupidBow,
      },

      {
        id: "mouthUpperLip",

        label: "Upper Lip Fullness",

        feature: "mouth",

        point: upperSample.upperBorder,

        properties: ["upperLipThickness", "upperCenterFullness"],

        help: "Drag vertically to change upper-lip thickness. Drag horizontally to alter center fullness.",

        drag: dragUpperLip,
      },

      {
        id: "mouthLowerLip",

        label: "Lower Lip Fullness",

        feature: "mouth",

        point: centerSample.lowerBorder,

        properties: [
          "lowerLipThickness",
          "lowerCenterFullness",
          "lowerLobeWidth",
        ],

        help: "Drag vertically to change lower-lip thickness. Drag horizontally to alter lower-lobe width.",

        drag: dragLowerLip,
      },
    ];
  }

  /* ==========================
       DRAG SETTING HELPERS
    ========================== */

  function getDragStartSetting(propertyName, fallback) {
    if (!state.dragStartSettings) {
      return fallback;
    }

    return safeNumber(
      state.dragStartSettings[propertyName],

      fallback,
    );
  }

  function updateMouthSettings(updates) {
    window.mouthEngineSettings = {
      ...window.mouthEngineSettings,

      ...(updates || {}),
    };

    syncControls(Object.keys(updates || {}));

    if (window.MouthEngine && typeof window.MouthEngine.draw === "function") {
      window.MouthEngine.draw();
    } else if (typeof window.drawMouthEngine === "function") {
      window.drawMouthEngine();
    }

    refresh();
  }

  /* ==========================
       HANDLE DRAG MAPPINGS
    ========================== */

  function dragLeftCorner(deltaX, deltaY) {
    const startWidth = getDragStartSetting("width", 150);

    const startCornerY = getDragStartSetting("cornerY", 0);

    updateMouthSettings({
      width: clamp(
        startWidth - deltaX * 2,

        30,

        300,
      ),

      cornerY: clamp(
        startCornerY + deltaY,

        -60,

        60,
      ),
    });
  }

  function dragRightCorner(deltaX, deltaY) {
    const startWidth = getDragStartSetting("width", 150);

    const startCornerY = getDragStartSetting("cornerY", 0);

    updateMouthSettings({
      width: clamp(
        startWidth + deltaX * 2,

        30,

        300,
      ),

      cornerY: clamp(
        startCornerY + deltaY,

        -60,

        60,
      ),
    });
  }

  function dragCupidBow(deltaX, deltaY) {
    const startHeight = getDragStartSetting("cupidBowHeight", 2.5);

    const startWidth = getDragStartSetting("cupidBowWidth", 0.16);

    updateMouthSettings({
      cupidBowHeight: clamp(startHeight - deltaY, 0, 25),

      cupidBowWidth: clamp(startWidth + deltaX * 0.003, 0.04, 0.45),
    });
  }

  function dragUpperLip(deltaX, deltaY) {
    const startThickness = getDragStartSetting("upperLipThickness", 6.5);

    const startFullness = getDragStartSetting("upperCenterFullness", 0);

    updateMouthSettings({
      upperLipThickness: clamp(startThickness - deltaY * 0.6, 0, 35),

      upperCenterFullness: clamp(startFullness + deltaX * 0.03, -10, 20),
    });
  }

  function dragLowerLip(deltaX, deltaY) {
    const startThickness = getDragStartSetting("lowerLipThickness", 7.2);

    const startFullness = getDragStartSetting("lowerCenterFullness", 1.8);

    const startLobeWidth = getDragStartSetting("lowerLobeWidth", 0.3);

    updateMouthSettings({
      lowerLipThickness: clamp(startThickness + deltaY * 0.6, 0, 40),

      lowerCenterFullness: clamp(startFullness + deltaY * 0.35, -10, 25),

      lowerLobeWidth: clamp(startLobeWidth + deltaX * 0.003, 0.05, 0.75),
    });
  }

  /* ==========================
       CONTROL SYNCHRONIZATION
    ========================== */

  function findSettingControls(propertyName) {
    const controls = [];

    const byId = document.getElementById(propertyName);

    if (byId) {
      controls.push(byId);
    }

    document
      .querySelectorAll(
        `[data-setting="${propertyName}"],
                 [data-mouth-setting="${propertyName}"],
                 input[name="${propertyName}"]`,
      )
      .forEach(function (control) {
        if (!controls.includes(control)) {
          controls.push(control);
        }
      });

    return controls;
  }

  function syncControl(propertyName) {
    const settings = window.mouthEngineSettings;

    if (!settings) {
      return;
    }

    const value = settings[propertyName];

    findSettingControls(propertyName).forEach(function (control) {
      if ("value" in control) {
        control.value = value;
      }

      control.dispatchEvent(
        new CustomEvent(
          "facelab-sync",

          {
            bubbles: true,

            detail: {
              property: propertyName,

              value: value,
            },
          },
        ),
      );
    });

    const valueDisplayIds = [
      propertyName + "Value",

      "mouth" +
        propertyName.charAt(0).toUpperCase() +
        propertyName.slice(1) +
        "Value",
    ];

    valueDisplayIds.forEach(function (displayId) {
      const display = document.getElementById(displayId);

      if (display) {
        display.textContent = formatNumber(value, 3);
      }
    });
  }

  function syncControls(propertyNames) {
    if (!Array.isArray(propertyNames)) {
      return;
    }

    propertyNames.forEach(syncControl);
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

    const leftCorner = getHandleById("mouthLeftCorner");

    const rightCorner = getHandleById("mouthRightCorner");

    if (leftCorner && rightCorner) {
      guideLayer.appendChild(
        createLine(
          leftCorner.point,

          rightCorner.point,

          {
            stroke: window.faceInspectorSettings.guideStroke,

            strokeWidth: window.faceInspectorSettings.guideStrokeWidth,

            opacity: window.faceInspectorSettings.guideOpacity,
          },
        ),
      );
    }
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

    state.dragStartSettings = {
      ...window.mouthEngineSettings,
    };

    event.currentTarget.setPointerCapture(event.pointerId);

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

    handle.drag(deltaX, deltaY);
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
    return String(value)
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
    return propertyName

      .replace(
        /([A-Z])/g,

        " $1",
      )

      .replace(/^./, function (firstCharacter) {
        return firstCharacter.toUpperCase();
      });
  }

  /* ==========================
       RENDER PANEL
    ========================== */

  function renderHandlePanel(handle, status) {
    if (!panelContent || !handle) {
      return;
    }

    const settings = window.mouthEngineSettings || {};

    const propertyRows = handle.properties
      .map(function (propertyName) {
        return panelRow(
          formatPropertyName(propertyName),

          formatNumber(
            settings[propertyName],

            3,
          ),
        );
      })
      .join("");

    panelContent.innerHTML = `

            <div class="faceInspectorSection">

                <div class="faceInspectorSectionTitle">
                    Selection
                </div>

                ${panelRow("Feature", handle.label)}

                ${panelRow("Engine", handle.feature)}

                ${panelRow("X", formatNumber(handle.point.x, 2))}

                ${panelRow("Y", formatNumber(handle.point.y, 2))}

            </div>


            <div class="faceInspectorSection">

                <div class="faceInspectorSectionTitle">
                    Parameters
                </div>

                ${propertyRows}

            </div>


            <div class="faceInspectorHelp">

                ${escapeHtml(handle.help)}

            </div>

        `;

    if (panelStatus) {
      panelStatus.textContent = status + " · " + handle.label;
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

                Hover over a mouth handle.

                <br><br>

                Click and drag a handle to edit
                the procedural mouth directly.

            </div>

        `;

    if (panelStatus) {
      panelStatus.textContent = "Direct Editing";
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

    state.handles = createMouthHandles();

    /*
            Remove selections that no longer
            exist after an engine rebuild.
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
    } else if (state.hoveredHandleId) {
      const hoveredHandle = getHandleById(state.hoveredHandleId);

      if (hoveredHandle) {
        renderHandlePanel(hoveredHandle, "Hover");
      }
    }
  }

  /* ==========================
   ENABLE / DISABLE
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


function hideInspector() {

    state.enabled = false;

    window.faceInspectorSettings.enabled = false;

    window.faceInspectorSettings.showPanel = false;


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
       INITIALIZE
    ========================== */

  function initialize() {
    if (state.initialized) {
      refresh();

      return true;
    }

    faceSvg = getFaceSvg();

    if (!faceSvg) {
      console.warn("Face Inspector 2 could not find the face SVG.");

      return false;
    }

    createPanelStyles();

createPanel();

createReopenButton();

createInspectorLayers();

    state.initialized = true;
    
    
    if (state.enabled) {
      enable();
    } else {
      disable();
    }

    return true;
  }

  /* ==========================
       PUBLIC API
    ========================== */

  window.FaceInspector = {
    initialize: initialize,

    refresh: refresh,

    enable: enable,

    disable: disable,

    toggle: toggle,

    show: showInspector,

    hide: hideInspector,

    showPanel: showPanel,
hidePanel: hidePanel,

    getHandles: function () {
      return state.handles.slice();
    },

    getSelectedHandle: function () {
      return getHandleById(state.selectedHandleId);
    },

    getState: function () {
      return {
        initialized: state.initialized,

        enabled: state.enabled,

        dragging: state.dragging,

        hoveredHandleId: state.hoveredHandleId,

        selectedHandleId: state.selectedHandleId,
      };
    },
  };

  /*
        Begin FaceLab namespace without
        breaking existing global APIs.
    */

  window.FaceLab = window.FaceLab || {};

  window.FaceLab.Inspector = window.FaceInspector;

  console.log("faceInspector.js V2.1 loaded");
})();
