/* ==========================
   FACELAB
   MOUTH INSPECTOR — VERSION 1.6

   Mouth-specific Face Inspector adapter.

   Responsibilities:
   - Define mouth editing handles
   - Define handle labels/help
   - Register the mouth with FaceLab

   Requires:
   - faceLabCore.js
   - mouthEngine.js
========================== */

(function () {
  "use strict";

function createFaceLabMouthHandles() {
    const geometry =
      window.MouthEngine &&
      typeof window.MouthEngine.getGeometry === "function"
        ? window.MouthEngine.getGeometry()
        : null;

    if (!geometry) {
      return [];
    }

    const landmarks = Array.isArray(geometry.landmarks)
      ? geometry.landmarks
      : [];

    const samples = Array.isArray(geometry.anatomySamples)
      ? geometry.anatomySamples
      : [];

    if (landmarks.length < 2 || samples.length === 0) {
      return [];
    }

    function findNearestSample(targetT) {
      let nearest = samples[0];

      let nearestDistance = Math.abs(Number(nearest.t || 0) - targetT);

      samples.forEach(function (sample) {
        const distance = Math.abs(Number(sample.t || 0) - targetT);

        if (distance < nearestDistance) {
          nearest = sample;

          nearestDistance = distance;
        }
      });

      return nearest;
    }

    const leftCorner = landmarks[0];

    const rightCorner = landmarks[landmarks.length - 1];

    const upperSample = findNearestSample(0.28);

    const cupidSample = findNearestSample(0.4);

    const centerSample = findNearestSample(0.5);

    return [
      {
        id: "leftCorner",

        label: "Left Mouth Corner",

        point: leftCorner,

        properties: ["width", "cornerY"],

        help: "Drag horizontally to change mouth width. Drag vertically to change corner height.",

        beginDrag: function () {
          return {
            ...window.mouthEngineSettings,
          };
        },

        drag: function (deltaX, deltaY, dragStart) {
          const start = dragStart || {};

          window.MouthEngine.update({
            width: Math.max(
              30,
              Math.min(300, Number(start.width || 150) - deltaX * 2),
            ),

            cornerY: Math.max(
              -60,
              Math.min(60, Number(start.cornerY || 0) + deltaY),
            ),
          });
        },
      },

      {
        id: "rightCorner",

        label: "Right Mouth Corner",

        point: rightCorner,

        properties: ["width", "cornerY"],

        help: "Drag horizontally to change mouth width. Drag vertically to change corner height.",

        beginDrag: function () {
          return {
            ...window.mouthEngineSettings,
          };
        },

        drag: function (deltaX, deltaY, dragStart) {
          const start = dragStart || {};

          window.MouthEngine.update({
            width: Math.max(
              30,
              Math.min(300, Number(start.width || 150) + deltaX * 2),
            ),

            cornerY: Math.max(
              -60,
              Math.min(60, Number(start.cornerY || 0) + deltaY),
            ),
          });
        },
      },

      {
        id: "cupidBow",

        label: "Cupid Bow",

        point: cupidSample.upperBorder,

        properties: ["cupidBowHeight", "cupidBowWidth", "philtrumDip"],

        help: "Drag vertically to change cupid-bow height. Drag horizontally to alter its width.",

        beginDrag: function () {
          return {
            ...window.mouthEngineSettings,
          };
        },

        drag: function (deltaX, deltaY, dragStart) {
          const start = dragStart || {};

          window.MouthEngine.update({
            cupidBowHeight: Math.max(
              0,
              Math.min(25, Number(start.cupidBowHeight || 3.2) - deltaY),
            ),

            cupidBowWidth: Math.max(
              0.04,
              Math.min(
                0.45,
                Number(start.cupidBowWidth || 0.16) + deltaX * 0.003,
              ),
            ),
          });
        },
      },

      {
        id: "upperLip",

        label: "Upper Lip Fullness",

        point: upperSample.upperBorder,

        properties: ["upperLipThickness", "upperCenterFullness"],

        help: "Drag vertically to change upper-lip thickness. Drag horizontally to alter center fullness.",

        beginDrag: function () {
          return {
            ...window.mouthEngineSettings,
          };
        },

        drag: function (deltaX, deltaY, dragStart) {
          const start = dragStart || {};

          window.MouthEngine.update({
            upperLipThickness: Math.max(
              0,
              Math.min(
                35,
                Number(start.upperLipThickness || 6.5) - deltaY * 0.6,
              ),
            ),

            upperCenterFullness: Math.max(
              -10,
              Math.min(
                20,
                Number(start.upperCenterFullness || 0) + deltaX * 0.03,
              ),
            ),
          });
        },
      },

      {
        id: "lowerLip",

        label: "Lower Lip Fullness",

        point: centerSample.lowerBorder,

        properties: [
          "lowerLipThickness",
          "lowerCenterFullness",
          "lowerLobeWidth",
        ],

        help: "Drag vertically to alter lower-lip fullness. Drag horizontally to change lower-lobe width.",

        beginDrag: function () {
          return {
            ...window.mouthEngineSettings,
          };
        },

        drag: function (deltaX, deltaY, dragStart) {
          const start = dragStart || {};

          window.MouthEngine.update({
            lowerLipThickness: Math.max(
              0,
              Math.min(
                40,
                Number(start.lowerLipThickness || 8.5) + deltaY * 0.6,
              ),
            ),

            lowerCenterFullness: Math.max(
              -10,
              Math.min(
                25,
                Number(start.lowerCenterFullness || 2.5) + deltaY * 0.35,
              ),
            ),

            lowerLobeWidth: Math.max(
              0.05,
              Math.min(
                0.75,
                Number(start.lowerLobeWidth || 0.34) + deltaX * 0.003,
              ),
            ),
          });
        },
      },
    ];
  }

  /* ==========================
       VISEME TEST BUTTONS
    ========================== */

  function createVisemeTestPanel() {
    if (
      document.getElementById(
        "mouthVisemeTestPanel"
      )
    ) {
      return;
    }

    /*
        Temporary viseme controls must live on
        document.body.

        Putting a position:fixed element inside
        the customization drawer can cause it to
        be clipped/hidden by the drawer's own
        positioning and overflow rules.
    */

    const parent =
      document.body;

    const panel =
      document.createElement(
        "div"
      );

    panel.id =
      "mouthVisemeTestPanel";

    panel.style.position =
      "fixed";

    panel.style.left =
      "18px";

    panel.style.bottom =
      "18px";

    panel.style.zIndex =
      "2147483647";

    panel.style.display =
      "flex";

    panel.style.flexWrap =
      "wrap";

    panel.style.gap =
      "6px";

    panel.style.maxWidth =
      "280px";

    panel.style.padding =
      "10px";

    panel.style.background =
      "rgba(24, 26, 30, 0.94)";

    panel.style.border =
      "1px solid #3d414a";

    panel.style.borderRadius =
      "8px";

    panel.style.boxShadow =
      "0 6px 20px rgba(0,0,0,.25)";


    const title =
      document.createElement(
        "div"
      );

    title.textContent =
      "Viseme Test";

    title.style.width =
      "100%";

    title.style.fontSize =
      "12px";

    title.style.fontWeight =
      "700";

    title.style.color =
      "#ffffff";

    title.style.marginBottom =
      "2px";

    panel.appendChild(
      title
    );


    const speechRow =
      document.createElement(
        "div"
      );

    speechRow.style.width =
      "100%";

    speechRow.style.display =
      "flex";

    speechRow.style.gap =
      "6px";

    speechRow.style.marginBottom =
      "6px";


    const speechInput =
      document.createElement(
        "input"
      );

    speechInput.type =
      "text";

    speechInput.id =
      "mouthTextVisemeInput";

    speechInput.value =
      "Maybe we should go.";

    speechInput.placeholder =
      "Type text to animate";

    speechInput.style.flex =
      "1";

    speechInput.style.minWidth =
      "0";

    speechInput.style.padding =
      "6px 8px";

    speechInput.style.border =
      "1px solid #4b505a";

    speechInput.style.borderRadius =
      "6px";

    speechInput.style.background =
      "#1f2227";

    speechInput.style.color =
      "#f2f2f2";


    const speechButton =
      document.createElement(
        "button"
      );

    speechButton.type =
      "button";

    speechButton.textContent =
      "Speak";

    speechButton.style.padding =
      "6px 10px";

    speechButton.style.border =
      "1px solid #4b505a";

    speechButton.style.borderRadius =
      "6px";

    speechButton.style.background =
      "#343942";

    speechButton.style.color =
      "#f2f2f2";

    speechButton.style.cursor =
      "pointer";


    function runTextVisemeTest() {

      const text =
        speechInput.value.trim();

      if (!text) {
        return;
      }


      if (
        window.TextToVisemes &&
        typeof window.TextToVisemes
          .speak ===
          "function"
      ) {

        window.TextToVisemes
          .speak(text);

      } else {

        console.warn(
          "TextToVisemes is not available."
        );

      }

    }


    speechButton.addEventListener(
      "click",
      runTextVisemeTest
    );


    speechInput.addEventListener(
      "keydown",
      function (event) {

        if (
          event.key ===
          "Enter"
        ) {

          runTextVisemeTest();

        }

      }
    );


    speechRow.appendChild(
      speechInput
    );

    speechRow.appendChild(
      speechButton
    );

    panel.appendChild(
      speechRow
    );


    const visemes = [
      ["neutral", "Neutral"],
      ["MBP", "M / B / P"],
      ["EE", "EE"],
      ["L", "L"],
      ["TH", "TH"],
      ["SH", "SH / CH / J"],
      ["WR", "W / R"],
      ["OH", "OH / OO"],
      ["AH", "AH"],
      ["FV", "F / V"]
    ];


    visemes.forEach(
      function (definition) {

        const value =
          definition[0];

        const label =
          definition[1];


        const button =
          document.createElement(
            "button"
          );

        button.type =
          "button";

        button.textContent =
          label;

        button.dataset.viseme =
          value;

        button.style.padding =
          "6px 9px";

        button.style.border =
          "1px solid #4b505a";

        button.style.borderRadius =
          "6px";

        button.style.background =
          "#2b2f35";

        button.style.color =
          "#f2f2f2";

        button.style.cursor =
          "pointer";

        button.addEventListener(
          "click",
          function () {

            panel
              .querySelectorAll(
                "button"
              )
              .forEach(
                function (
                  otherButton
                ) {

                  otherButton.style.background =
                    "#2b2f35";
                }
              );


            button.style.background =
              "#4a5360";


            if (
              value ===
              "neutral"
            ) {

              if (
                window.MouthEngine &&
                typeof window.MouthEngine
                  .clearViseme ===
                  "function"
              ) {

                window.MouthEngine
                  .clearViseme();

              }

              return;
            }


            if (
              window.MouthEngine &&
              typeof window.MouthEngine
                .setViseme ===
                "function"
            ) {

              window.MouthEngine
                .setViseme(
                  value
                );

            }

          }
        );


        panel.appendChild(
          button
        );

      }
    );


    parent.appendChild(
      panel
    );

    console.log(
      "Mouth viseme test panel mounted"
    );
  }


  if (window.FaceLab && typeof window.FaceLab.registerFeature === "function") {
    window.FaceLab.registerFeature(
      "mouth",

      {
        label: "Mouth",

        getSettings: function () {
          return {
            ...window.mouthEngineSettings,
          };
        },

        getHandles: createFaceLabMouthHandles,

        update: window.MouthEngine.update,

        draw: window.MouthEngine.draw,

        refresh: window.MouthEngine.refresh,

        reset: window.MouthEngine.reset,
      },
    );
  }

  if (
    document.readyState === "loading"
  ) {

    document.addEventListener(
      "DOMContentLoaded",
      createVisemeTestPanel
    );

  } else {

    createVisemeTestPanel();

  }


  console.log("mouthInspector.js V1.6 loaded");
})();
