/* =========================================================
   FACELAB COLOR CONTROLS
   Version 1.0

   Adds live skin + iris color controls to the Customize drawer.

   LOAD AFTER:
   js/drawer.js

   LOAD BEFORE:
   js/app.js

   Works with EyeRenderer 5.5.5+
========================================================= */

(function initializeFaceLabColorControls() {
  "use strict";

  const STORAGE_KEY = "facelabAppearanceColors";

  const defaults = Object.freeze({
    skinLight: "#FFE0C2",
    skinMid: "#F5C89D",
    skinDark: "#C88458",

    irisDark: "#1D363C",
    irisMid: "#557782",
    irisLight: "#9FB8BD",
    irisWarm: "#B68765",
  });

  const cssVariables = {
    skinLight: "--skin-light",
    skinMid: "--skin-mid",
    skinDark: "--skin-dark",

    irisDark: "--iris-dark",
    irisMid: "--iris-mid",
    irisLight: "--iris-light",
    irisWarm: "--iris-warm",
  };

  let colors = {
    ...defaults,
    ...loadSavedColors(),
  };

  /* ==========================
     STORAGE
  ========================== */

  function loadSavedColors() {
    try {
      const raw =
        localStorage.getItem(
          STORAGE_KEY,
        );

      if (!raw) {
        return {};
      }

      const parsed =
        JSON.parse(raw);

      return parsed &&
        typeof parsed === "object"
        ? parsed
        : {};
    } catch (error) {
      console.warn(
        "FaceLab color settings could not be loaded.",
        error,
      );

      return {};
    }
  }

  function saveColors() {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(colors),
      );
    } catch (error) {
      console.warn(
        "FaceLab color settings could not be saved.",
        error,
      );
    }
  }

  /* ==========================
     APPLY COLORS
  ========================== */

  function applyColors(
    shouldRedrawEyes,
  ) {
    const root =
      document.documentElement;

    Object.entries(
      cssVariables,
    ).forEach(
      function applyVariable(entry) {
        const settingName =
          entry[0];

        const variableName =
          entry[1];

        root.style.setProperty(
          variableName,
          colors[settingName],
        );
      },
    );

    if (
      shouldRedrawEyes !== false &&
      typeof window.drawEyes ===
        "function"
    ) {
      window.drawEyes();
    }

    if (
      window.FaceInspector &&
      typeof window.FaceInspector.refresh ===
        "function"
    ) {
      window.FaceInspector.refresh();
    }
  }

  /* ==========================
     PANEL MARKUP
  ========================== */

  const controls = [
    ["skinLight", "Skin highlight"],
    ["skinMid", "Skin midtone"],
    ["skinDark", "Skin shadow"],

    ["irisDark", "Iris dark"],
    ["irisMid", "Iris base"],
    ["irisLight", "Iris light"],
    ["irisWarm", "Iris warm accent"],
  ];

  function createMarkup() {
    return (
      '<div class="facelab-color-options">' +

      controls.map(
        function buildControl(definition) {
          const settingName =
            definition[0];

          const label =
            definition[1];

          return (
            '<label style="' +
            'display:grid;' +
            'grid-template-columns:1fr auto;' +
            'align-items:center;' +
            'gap:12px;' +
            'margin:8px 0;' +
            '">' +

            '<span>' +
            label +
            '</span>' +

            '<input ' +
            'type="color" ' +
            'data-face-color="' +
            settingName +
            '" ' +
            'value="' +
            colors[settingName] +
            '" ' +
            'style="' +
            'width:46px;' +
            'height:30px;' +
            'padding:0;' +
            'border:0;' +
            'background:transparent;' +
            'cursor:pointer;' +
            '">' +

            '</label>'
          );
        },
      ).join("") +

      '<div class="control-buttons">' +

      '<button ' +
      'type="button" ' +
      'id="resetFaceColors">' +
      'Reset colors' +
      '</button>' +

      '</div>' +

      '</div>'
    );
  }

  /* ==========================
     DRAWER PANEL
  ========================== */

  function initializePanel() {
    if (
      document.getElementById(
        "faceColorControls",
      )
    ) {
      return;
    }

    let body = null;

    if (
      typeof window.addCustomizePanel ===
      "function"
    ) {
      body =
        window.addCustomizePanel(
          "Appearance",
          createMarkup(),
          false,
        );
    } else {
      const panelContainer =
        document.getElementById(
          "customizePanels",
        );

      if (!panelContainer) {
        return;
      }

      const details =
        document.createElement(
          "details",
        );

      const summary =
        document.createElement(
          "summary",
        );

      summary.textContent =
        "Appearance";

      body =
        document.createElement(
          "div",
        );

      body.className =
        "panelBody";

      body.innerHTML =
        createMarkup();

      details.appendChild(
        summary,
      );

      details.appendChild(
        body,
      );

      panelContainer.appendChild(
        details,
      );
    }

    if (!body) {
      return;
    }

    body.id =
      "faceColorControls";

    body.querySelectorAll(
      "[data-face-color]",
    ).forEach(
      function connectPicker(picker) {
        picker.addEventListener(
          "input",
          function handleColorInput() {
            const settingName =
              picker.getAttribute(
                "data-face-color",
              );

            colors[settingName] =
              picker.value;

            applyColors(true);
            saveColors();
          },
        );
      },
    );

    const resetButton =
      body.querySelector(
        "#resetFaceColors",
      );

    if (resetButton) {
      resetButton.addEventListener(
        "click",
        function resetColors() {
          colors = {
            ...defaults,
          };

          body.querySelectorAll(
            "[data-face-color]",
          ).forEach(
            function resetPicker(
              picker,
            ) {
              const settingName =
                picker.getAttribute(
                  "data-face-color",
                );

              picker.value =
                colors[settingName];
            },
          );

          saveColors();
          applyColors(true);
        },
      );
    }
  }

  /* ==========================
     PUBLIC API
  ========================== */

  window.FaceLabColors = {
    defaults,

    get:
      function getColors() {
        return {
          ...colors,
        };
      },

    set:
      function setColors(
        updates,
      ) {
        colors = {
          ...colors,
          ...(updates || {}),
        };

        saveColors();
        applyColors(true);
      },

    reset:
      function resetColors() {
        colors = {
          ...defaults,
        };

        saveColors();
        applyColors(true);
      },
  };

  /* ==========================
     INITIALIZE
  ========================== */

  /*
     Apply immediately so the CSS variables exist before
     the main FaceLab app performs its first draw.
  */

  applyColors(false);

  if (
    document.readyState ===
    "loading"
  ) {
    document.addEventListener(
      "DOMContentLoaded",
      initializePanel,
      {
        once: true,
      },
    );
  } else {
    initializePanel();
  }

  console.log(
    "colorControls.js V1.0 loaded",
  );
})();
