/* =========================================================
   FACELAB EYE BUILDER
   Compatibility Version 5.0.0

   The builder implementation now lives inside eyeGeometry.js.
   This file remains so existing script paths do not break.
========================================================= */

(function initializeEyeBuilderCompatibility() {
  "use strict";

  if (
    !window.EyeBuilder ||
    typeof window.EyeBuilder.build !== "function"
  ) {
    console.error(
      "EyeBuilder compatibility requires eyeGeometry.js to load first.",
    );

    return;
  }

  console.log("EyeBuilder 5.0 compatibility loaded");
})();
