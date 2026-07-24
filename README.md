# FACELAB

# Changelog

All notable changes to FaceLab are documented here.

---

## [0.2.0] - In Progress

### Added

- Introduced the procedural Mouth Engine.
- Added anatomical mouth landmark generation.
- Added spline-based mouth seam generation.
- Added procedural upper and lower lip surface generation.
- Added lip profile system.
- Added directional field system for lip deformation.
- Added procedural tissue pad calculations.
- Added geometry caching for runtime inspection.
- Added public MouthEngine API.
- Added MouthDebug system for visualizing procedural geometry.
- Began Face Inspector architecture.

### Changed

- Refactored mouth rendering into a dedicated engine.
- Removed debug rendering from MouthEngine.
- Moved all diagnostic overlays into MouthDebug.
- Standardized geometry access through engine getters.
- Simplified rendering pipeline.

### Architecture

- Established Geometry → Renderer → Debug separation.
- Introduced reusable engine pattern for future facial features.
- Mouth is now the reference implementation for future Head, Eyes and Nose engines.

---

## [0.1.0] - Initial Foundation

### Added

- SVG face renderer.
- Procedural head generation.
- Eye rendering system.
- Initial procedural nose.
- Drawer based customization UI.
- Slider driven feature editing.
- Modular JavaScript organization.
- Face rendering pipeline.

### Changed

- Refactored project into feature-based modules.
- Improved separation between rendering and feature logic.

---

## Planned (0.3)

### Face Inspector

- Hover selection
- Click selection
- Property inspection
- Direct manipulation
- Live editing

### Core

- Selection Manager
- History / Undo
- Developer Mode

### Features

- Nose Engine 2.0
- Eye Engine 2.0

---

## Planned (0.4)

### Expressions

- Smile
- Frown
- Sneer
- Surprise
- Anger

### Animation

- Blend shapes
- Pose interpolation
- Expression mixing

---

## Planned (1.0)

- Complete procedural facial modeling engine.
- Save / Load projects.
- JSON export.
- SVG export.
- Facial presets.
- Procedural randomization.
- Interactive editing.
- Anatomical inspector.
