/* ==========================
   FACELAB
   LANDMARK — VERSION 1.0

   Shared editable geometry point.

   Used by:

   - MouthLandmarks
   - NoseLandmarks
   - EyeLandmarks
   - BrowLandmarks
   - GeometryInspector

   A Landmark wraps a Point while
   preserving direct x/y access:

       landmark.x
       landmark.y

   Editor code may instead use:

       landmark.position.x
       landmark.position.y
========================== */

(function () {
  "use strict";

  /* ==========================
       NUMBER HELPERS
    ========================== */

  function safeNumber(value, fallback) {
    const number = Number(value);

    return Number.isFinite(number) ? number : fallback;
  }

  /* ==========================
       POINT HELPERS
    ========================== */

  function createPoint(x, y) {
    if (window.Point) {
      return new window.Point(x, y);
    }

    return {
      x: safeNumber(x, 0),
      y: safeNumber(y, 0),
    };
  }

  function readPointX(point, fallback) {
    if (!point) {
      return fallback;
    }

    return safeNumber(point.x, fallback);
  }

  function readPointY(point, fallback) {
    if (!point) {
      return fallback;
    }

    return safeNumber(point.y, fallback);
  }

  /* ==========================
       LANDMARK CLASS
    ========================== */

  class Landmark {
    constructor(options) {
      const settings = options || {};

      this.id = settings.id || "";

      this.label = settings.label || settings.id || "Landmark";

      this.position = createPoint(
        safeNumber(settings.x, 0),
        safeNumber(settings.y, 0),
      );

      this.movable = settings.movable !== false;

      this.visible = settings.visible !== false;

      this.group = settings.group || "geometry";

      this.role = settings.role || "anatomy";

      this.mirroredId = settings.mirroredId || null;

      this.lockedX = settings.lockedX === true;

      this.lockedY = settings.lockedY === true;

      this.selected = settings.selected === true;

      this.hovered = settings.hovered === true;

      this.metadata = {
        ...(settings.metadata || {}),
      };
    }

    /* ==========================
           COMPATIBILITY ACCESSORS
        ========================== */

    get x() {
      return this.position.x;
    }

    set x(value) {
      if (this.lockedX) {
        return;
      }

      this.position.x = safeNumber(value, this.position.x);
    }

    get y() {
      return this.position.y;
    }

    set y(value) {
      if (this.lockedY) {
        return;
      }

      this.position.y = safeNumber(value, this.position.y);
    }

    /* ==========================
           POSITION METHODS
        ========================== */

    setPosition(x, y, options) {
      if (!this.movable) {
        return this;
      }

      const settings = options || {};

      const ignoreLocks = settings.ignoreLocks === true;

      if (ignoreLocks || !this.lockedX) {
        this.position.x = safeNumber(x, this.position.x);
      }

      if (ignoreLocks || !this.lockedY) {
        this.position.y = safeNumber(y, this.position.y);
      }

      return this;
    }

    moveTo(x, y, options) {
      return this.setPosition(x, y, options);
    }

    moveBy(deltaX, deltaY, options) {
      if (!this.movable) {
        return this;
      }

      const settings = options || {};

      const ignoreLocks = settings.ignoreLocks === true;

      if (ignoreLocks || !this.lockedX) {
        this.position.x += safeNumber(deltaX, 0);
      }

      if (ignoreLocks || !this.lockedY) {
        this.position.y += safeNumber(deltaY, 0);
      }

      return this;
    }

    copyPositionFrom(source, options) {
      if (!source) {
        return this;
      }

      return this.setPosition(
        readPointX(source.position || source, this.x),

        readPointY(source.position || source, this.y),

        options,
      );
    }

    /* ==========================
           DISTANCE METHODS
        ========================== */

    distanceTo(target) {
      if (!target) {
        return Infinity;
      }

      const point = target.position || target;

      const targetX = readPointX(point, this.x);

      const targetY = readPointY(point, this.y);

      return Math.hypot(targetX - this.x, targetY - this.y);
    }

    squaredDistanceTo(target) {
      if (!target) {
        return Infinity;
      }

      const point = target.position || target;

      const targetX = readPointX(point, this.x);

      const targetY = readPointY(point, this.y);

      const deltaX = targetX - this.x;

      const deltaY = targetY - this.y;

      return deltaX * deltaX + deltaY * deltaY;
    }

    /* ==========================
           MIRROR METHODS
        ========================== */

    mirroredPosition(axisX) {
      const mirrorAxis = safeNumber(axisX, 0);

      return createPoint(
        mirrorAxis - (this.x - mirrorAxis),

        this.y,
      );
    }

    mirrorAcrossX(axisX, options) {
      const mirrored = this.mirroredPosition(axisX);

      return this.setPosition(mirrored.x, mirrored.y, options);
    }

    copyMirroredFrom(source, axisX, options) {
      if (!source) {
        return this;
      }

      const sourcePoint = source.position || source;

      const mirrorAxis = safeNumber(axisX, 0);

      const sourceX = readPointX(sourcePoint, mirrorAxis);

      const sourceY = readPointY(sourcePoint, this.y);

      return this.setPosition(
        mirrorAxis - (sourceX - mirrorAxis),

        sourceY,

        options,
      );
    }

    /* ==========================
           STATE METHODS
        ========================== */

    select() {
      this.selected = true;
      return this;
    }

    deselect() {
      this.selected = false;
      return this;
    }

    setSelected(value) {
      this.selected = value === true;

      return this;
    }

    setHovered(value) {
      this.hovered = value === true;

      return this;
    }

    show() {
      this.visible = true;
      return this;
    }

    hide() {
      this.visible = false;
      return this;
    }

    lockX() {
      this.lockedX = true;
      return this;
    }

    unlockX() {
      this.lockedX = false;
      return this;
    }

    lockY() {
      this.lockedY = true;
      return this;
    }

    unlockY() {
      this.lockedY = false;
      return this;
    }

    lock() {
      this.lockedX = true;
      this.lockedY = true;
      return this;
    }

    unlock() {
      this.lockedX = false;
      this.lockedY = false;
      return this;
    }

    /* ==========================
           CONVERSION METHODS
        ========================== */

    toPoint() {
      return createPoint(this.x, this.y);
    }

    toJSON() {
      return {
        id: this.id,
        label: this.label,

        position: {
          x: this.x,
          y: this.y,
        },

        movable: this.movable,
        visible: this.visible,

        group: this.group,
        role: this.role,

        mirroredId: this.mirroredId,

        lockedX: this.lockedX,
        lockedY: this.lockedY,

        selected: this.selected,
        hovered: this.hovered,

        metadata: {
          ...this.metadata,
        },

        /*
                  Included for compatibility
                  and easier console inspection.
                */

        x: this.x,
        y: this.y,
      };
    }

    clone(overrides) {
      const changes = overrides || {};

      return new Landmark({
        id: changes.id !== undefined ? changes.id : this.id,

        label: changes.label !== undefined ? changes.label : this.label,

        x: changes.x !== undefined ? changes.x : this.x,

        y: changes.y !== undefined ? changes.y : this.y,

        movable: changes.movable !== undefined ? changes.movable : this.movable,

        visible: changes.visible !== undefined ? changes.visible : this.visible,

        group: changes.group !== undefined ? changes.group : this.group,

        role: changes.role !== undefined ? changes.role : this.role,

        mirroredId:
          changes.mirroredId !== undefined
            ? changes.mirroredId
            : this.mirroredId,

        lockedX: changes.lockedX !== undefined ? changes.lockedX : this.lockedX,

        lockedY: changes.lockedY !== undefined ? changes.lockedY : this.lockedY,

        selected:
          changes.selected !== undefined ? changes.selected : this.selected,

        hovered: changes.hovered !== undefined ? changes.hovered : this.hovered,

        metadata: {
          ...this.metadata,
          ...(changes.metadata || {}),
        },
      });
    }
  }

  /* ==========================
       STATIC HELPERS
    ========================== */

  Landmark.from = function (value, options) {
    const settings = options || {};

    if (value instanceof Landmark) {
      return value.clone(settings);
    }

    const source = value && value.position ? value.position : value || {};

    return new Landmark({
      ...value,
      ...settings,

      x: settings.x !== undefined ? settings.x : readPointX(source, 0),

      y: settings.y !== undefined ? settings.y : readPointY(source, 0),
    });
  };

  Landmark.isLandmark = function (value) {
    return value instanceof Landmark;
  };

  /* ==========================
       GLOBAL API
    ========================== */

  window.Landmark = Landmark;

  window.FaceLab = window.FaceLab || {};

  window.FaceLab.Landmark = Landmark;

  console.log("landmark.js V1.0 loaded");
})();
