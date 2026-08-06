# FACELAB

# Changelog

All notable changes to FaceLab are documented here.

---

## [0.3.0] - In Progress

### Added

#### Face Inspector

* Added Face Inspector editing system.
* Added hover and click selection.
* Added draggable anatomical landmarks.
* Added direct manipulation of facial geometry.
* Added landmark grouping and metadata.
* Added named landmark support.
* Added mirrored landmark relationships.
* Added movable and hidden reference landmarks.
* Added landmark role definitions.
* Added Bézier control handle editing.
* Added incoming and outgoing spline handles.
* Added live geometry updates while editing.
* Added inspector reopening after the panel is closed.
* Added geometry inspection and export tools.

#### Mouth Integration

* Connected Face Inspector to the procedural Mouth Engine.
* Added editable mouth seam landmarks.
* Added mouth corner landmarks.
* Added upper lip peak landmarks.
* Added mouth center reference landmark.
* Added inspector-driven mouth geometry regeneration.
* Added support for direct editing of mouth spline control handles.
* Added named anatomical landmark data to Mouth Engine geometry output.

### Changed

* Face Inspector is now integrated with the procedural geometry system rather than functioning only as a diagnostic overlay.
* Mouth landmarks can now influence generated mouth geometry directly.
* Improved synchronization between Mouth Engine, MouthDebug and Face Inspector.
* Improved mouth spline generation around the upper lip peaks and corners.
* Improved handling of inspector refreshes and redraws.
* Refined rendering order between facial geometry, debug tools and inspector overlays.

### Fixed

* Fixed draggable landmarks not updating mouth geometry.
* Fixed inner Bézier handles failing to affect the mouth spline.
* Fixed inspector state requiring a full page refresh after closing.
* Fixed persistent MouthDebug overlays when debugging was disabled.
* Fixed geometry/sample errors caused by missing procedural data.
* Fixed inspector SVG state errors during redraws.

### Architecture

* Established Face Inspector as the interactive editing layer for procedural FaceLab engines.
* Established named anatomical landmarks as the bridge between generated geometry and direct manipulation.
* Established reusable landmark metadata including:

  * position
  * visibility
  * movability
  * anatomical role
  * feature group
  * mirrored relationships
* Established editable spline handles as part of the procedural geometry workflow.
* Mouth Engine remains the reference implementation for future facial feature engines.

---

## [0.2.0] - Mouth Engine

### Added

* Introduced the procedural Mouth Engine.
* Added anatomical mouth landmark generation.
* Added spline-based mouth seam generation.
* Added procedural upper and lower lip surface generation.
* Added lip profile system.
* Added directional field system for lip deformation.
* Added procedural tissue pad calculations.
* Added geometry caching for runtime inspection.
* Added public MouthEngine API.
* Added MouthDebug system for visualizing procedural geometry.
* Began Face Inspector architecture.

### Changed

* Refactored mouth rendering into a dedicated engine.
* Removed debug rendering from MouthEngine.
* Moved all diagnostic overlays into MouthDebug.
* Standardized geometry access through engine getters.
* Simplified rendering pipeline.

### Architecture

* Established Geometry → Renderer → Debug separation.
* Introduced reusable engine pattern for future facial features.
* Mouth became the reference implementation for future Head, Eyes and Nose engines.

---

## [0.1.0] - Initial Foundation

### Added

* SVG face renderer.
* Procedural head generation.
* Eye rendering system.
* Initial procedural nose.
* Drawer-based customization UI.
* Slider-driven feature editing.
* Modular JavaScript organization.
* Face rendering pipeline.

### Changed

* Refactored project into feature-based modules.
* Improved separation between rendering and feature logic.

---

## Planned (0.4)

### Facial Feature Engines

* Head Engine 2.0
* Eye Engine 2.0
* Nose Engine 2.0
* Eyebrow system
* Face Inspector integration for remaining facial features
* Anatomical landmarks for head, eyes, nose and eyebrows
* Direct manipulation of facial features

### Core

* Selection Manager
* History / Undo
* Developer Mode
* Inspector property editing
* Improved project state management

---

## Planned (0.5)

### Expressions

* Smile
* Frown
* Sneer
* Surprise
* Anger

### Animation

* Blend shapes
* Pose interpolation
* Expression mixing
* Procedural facial deformation

---

## Planned (1.0)

* Complete procedural facial modeling engine.
* Save / Load projects.
* JSON export.
* SVG export.
* Facial presets.
* Procedural randomization.
* Interactive anatomical editing.
* Complete Face Inspector.
* Procedural expression system.
