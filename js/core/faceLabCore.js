/* ==========================
   FACELAB CORE — VERSION 3.0

   Shared registry for procedural
   facial features.

   A registered feature may expose:

   - id
   - label
   - getHandles()
   - getSettings()
   - update()
   - draw()
   - refresh()
   - save()
   - load()
   - reset()

   Face Inspector reads handles from
   this registry instead of containing
   feature-specific editing logic.
========================== */

(function () {
  "use strict";

  /* ==========================
       EXISTING NAMESPACE
    ========================== */

  window.FaceLab = window.FaceLab || {};

  /* ==========================
       FEATURE STORAGE
    ========================== */

  const features = new Map();

  /* ==========================
       VALIDATION
    ========================== */

  function normalizeFeatureId(value) {
    return String(value || "")
      .trim()
      .toLowerCase();
  }

  function validateFeature(featureId, feature) {
    if (!featureId) {
      console.error("FaceLab.registerFeature requires a feature ID.");

      return false;
    }

    if (!feature || typeof feature !== "object") {
      console.error(`FaceLab feature "${featureId}" must be an object.`);

      return false;
    }

    if (
      feature.getHandles !== undefined &&
      typeof feature.getHandles !== "function"
    ) {
      console.error(
        `FaceLab feature "${featureId}" has an invalid getHandles property.`,
      );

      return false;
    }

    return true;
  }

  /* ==========================
       REGISTER FEATURE
    ========================== */

  function registerFeature(featureId, feature) {
    const id = normalizeFeatureId(featureId);

    if (!validateFeature(id, feature)) {
      return null;
    }

    const registeredFeature = {
      id: id,

      label: feature.label || id,

      enabled: feature.enabled !== false,

      ...feature,
    };

    features.set(id, registeredFeature);

    /*
            Let inspector discover the new
            feature immediately when possible.
        */

    if (
      window.FaceInspector &&
      typeof window.FaceInspector.refresh === "function"
    ) {
      window.FaceInspector.refresh();
    }

    return registeredFeature;
  }

  /* ==========================
       REMOVE FEATURE
    ========================== */

  function unregisterFeature(featureId) {
    const id = normalizeFeatureId(featureId);

    const removed = features.delete(id);

    if (
      removed &&
      window.FaceInspector &&
      typeof window.FaceInspector.refresh === "function"
    ) {
      window.FaceInspector.refresh();
    }

    return removed;
  }

  /* ==========================
       FEATURE LOOKUP
    ========================== */

  function getFeature(featureId) {
    const id = normalizeFeatureId(featureId);

    return features.get(id) || null;
  }

  function hasFeature(featureId) {
    const id = normalizeFeatureId(featureId);

    return features.has(id);
  }

  function getFeatures() {
    return Array.from(features.values());
  }

  function getEnabledFeatures() {
    return getFeatures().filter(function (feature) {
      return feature.enabled !== false;
    });
  }

  /* ==========================
       ENABLE / DISABLE FEATURE
    ========================== */

  function setFeatureEnabled(featureId, enabled) {
    const feature = getFeature(featureId);

    if (!feature) {
      return false;
    }

    feature.enabled = Boolean(enabled);

    if (
      window.FaceInspector &&
      typeof window.FaceInspector.refresh === "function"
    ) {
      window.FaceInspector.refresh();
    }

    return true;
  }

  /* ==========================
       COLLECT HANDLES
    ========================== */

  function getHandles() {
    const handles = [];

    getEnabledFeatures().forEach(function (feature) {
      if (typeof feature.getHandles !== "function") {
        return;
      }

      let featureHandles;

      try {
        featureHandles = feature.getHandles();
      } catch (error) {
        console.error(
          `FaceLab feature "${feature.id}" failed while building handles:`,
          error,
        );

        return;
      }

      if (!Array.isArray(featureHandles)) {
        return;
      }

      featureHandles.forEach(function (handle) {
        if (!handle || !handle.id || !handle.point) {
          return;
        }

        /*
                            Prefix IDs to prevent two
                            features from registering
                            identically named handles.
                        */

        const localId = String(handle.id);

        handles.push({
          featureId: feature.id,

          featureLabel: feature.label,

          localId: localId,

          id: `${feature.id}:${localId}`,

          ...handle,

          /*
                                Preserve the fully
                                qualified registry ID.
                            */

          feature: feature.id,
        });
      });
    });

    return handles;
  }

  /* ==========================
       FEATURE SETTINGS
    ========================== */

  function getFeatureSettings(featureId) {
    const feature = getFeature(featureId);

    if (!feature) {
      return {};
    }

    if (typeof feature.getSettings === "function") {
      return feature.getSettings() || {};
    }

    return {};
  }

  function updateFeature(featureId, updates) {
    const feature = getFeature(featureId);

    if (!feature) {
      console.warn(`FaceLab could not update unknown feature "${featureId}".`);

      return null;
    }

    let result = null;

    if (typeof feature.update === "function") {
      result = feature.update(updates || {});
    } else {
      console.warn(`FaceLab feature "${featureId}" does not provide update().`);
    }

    if (
      window.FaceInspector &&
      typeof window.FaceInspector.refresh === "function"
    ) {
      window.FaceInspector.refresh();
    }

    return result;
  }

  /* ==========================
       DRAW / REFRESH
    ========================== */

  function drawFeature(featureId) {
    const feature = getFeature(featureId);

    if (!feature || typeof feature.draw !== "function") {
      return null;
    }

    return feature.draw();
  }

  function refreshFeature(featureId) {
    const feature = getFeature(featureId);

    if (!feature) {
      return null;
    }

    if (typeof feature.refresh === "function") {
      return feature.refresh();
    }

    if (typeof feature.draw === "function") {
      return feature.draw();
    }

    return null;
  }

  function refreshAllFeatures() {
    getEnabledFeatures().forEach(function (feature) {
      try {
        if (typeof feature.refresh === "function") {
          feature.refresh();
        } else if (typeof feature.draw === "function") {
          feature.draw();
        }
      } catch (error) {
        console.error(
          `FaceLab feature "${feature.id}" failed during refresh:`,
          error,
        );
      }
    });

    if (
      window.FaceInspector &&
      typeof window.FaceInspector.refresh === "function"
    ) {
      window.FaceInspector.refresh();
    }
  }

  /* ==========================
       SAVE / LOAD / RESET
    ========================== */

  function runFeatureAction(featureId, actionName) {
    const feature = getFeature(featureId);

    if (!feature || typeof feature[actionName] !== "function") {
      return null;
    }

    const result = feature[actionName]();

    if (
      window.FaceInspector &&
      typeof window.FaceInspector.refresh === "function"
    ) {
      window.FaceInspector.refresh();
    }

    return result;
  }

  function saveFeature(featureId) {
    return runFeatureAction(featureId, "save");
  }

  function loadFeature(featureId) {
    return runFeatureAction(featureId, "load");
  }

  function resetFeature(featureId) {
    return runFeatureAction(featureId, "reset");
  }

  /* ==========================
       DEBUG SUMMARY
    ========================== */

  function describeFeatures() {
    return getFeatures().map(function (feature) {
      let handleCount = 0;

      if (typeof feature.getHandles === "function") {
        try {
          const featureHandles = feature.getHandles();

          handleCount = Array.isArray(featureHandles)
            ? featureHandles.length
            : 0;
        } catch (error) {
          handleCount = 0;
        }
      }

      return {
        id: feature.id,

        label: feature.label,

        enabled: feature.enabled !== false,

        handleCount: handleCount,
      };
    });
  }

  /* ==========================
       PUBLIC CORE API
    ========================== */

  window.FaceLab.Core = {
    version: "3.0",

    registerFeature: registerFeature,

    unregisterFeature: unregisterFeature,

    getFeature: getFeature,

    hasFeature: hasFeature,

    getFeatures: getFeatures,

    getEnabledFeatures: getEnabledFeatures,

    setFeatureEnabled: setFeatureEnabled,

    getHandles: getHandles,

    getFeatureSettings: getFeatureSettings,

    updateFeature: updateFeature,

    drawFeature: drawFeature,

    refreshFeature: refreshFeature,

    refreshAll: refreshAllFeatures,

    saveFeature: saveFeature,

    loadFeature: loadFeature,

    resetFeature: resetFeature,

    describeFeatures: describeFeatures,
  };

  /*
        Convenient top-level aliases.
    */

  window.FaceLab.registerFeature = registerFeature;

  window.FaceLab.unregisterFeature = unregisterFeature;

  window.FaceLab.getFeature = getFeature;

  window.FaceLab.getFeatures = getFeatures;

  window.FaceLab.getHandles = getHandles;

  window.FaceLab.updateFeature = updateFeature;

  window.FaceLab.refreshAll = refreshAllFeatures;

  console.log("faceLabCore.js V3.0 loaded");
})();
