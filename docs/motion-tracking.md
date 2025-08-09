# Motion Tracking System — `motionMachine` (XState) Spec

A comprehensive spec for building the ROI‑based motion tracker that converts tracked motion into funscript data. The machine orchestrates UI modes, OpenCV.js processing, coordinate conversions, and data persistence.

---

## Goals

* Let users define **ROI** and **manual track points** (click‑to‑track) inside the ROI.
* Track points **forward or backward** between ROI segments/time boundaries.
* Review, mute/solo, and **trim** tracks; **select** segments to use for funscript.
* Compute a **vector** per selected segment to map motion → normalized **pos (0–100)**.
* Export stable **funscript** actions.

---

## Coordinate Space Mapping

Your app deals with two coordinate systems:

| Term              | Meaning                                                                                                                     |
| ----------------- | --------------------------------------------------------------------------------------------------------------------------- |
| **Video space**   | Pixel coordinates from the original source frame (`vidWidth`, `vidHeight`) — this is what OpenCV works with.                |
| **Display space** | Pixel coordinates as rendered in the DOM (`displayWidth`, `displayHeight`) — this is what the user sees and interacts with. |

**ROI Conversion (display → video)**

```ts
function displayToVideo(roiDisplay, vidWidth, vidHeight, displayWidth, displayHeight) {
  const scaleX = vidWidth / displayWidth;
  const scaleY = vidHeight / displayHeight;
  return {
    x: roiDisplay.x * scaleX,
    y: roiDisplay.y * scaleY,
    width: roiDisplay.width * scaleX,
    height: roiDisplay.height * scaleY
  };
}
```

**Points Conversion (display → video)**

```ts
function pointDisplayToVideo(pt, vidWidth, vidHeight, displayWidth, displayHeight) {
  return {
    x: pt.x * (vidWidth / displayWidth),
    y: pt.y * (vidHeight / displayHeight)
  };
}
```

**Video → Display (for overlay rendering)**

```ts
function videoToDisplay(pt, vidWidth, vidHeight, displayWidth, displayHeight) {
  return {
    x: pt.x * (displayWidth / vidWidth),
    y: pt.y * (displayHeight / vidHeight)
  };
}
```

**Why This Matters**

* ROI cropping inside OpenCV must match what the user sees.
* Store `{time, x, y}` in **video space** so resizing doesn’t invalidate data.
* Always convert between spaces when drawing or interpreting clicks.

---

## Zoom View & Transforms (ROI-as-Viewport)

When **zoomed**, the player is wrapped in a container that applies a CSS transform so the ROI effectively fills the viewport. This changes how you convert pointer positions to video coordinates.

### Transform the children

Your component sets:

```ts
const scale = Math.min(containerRect.width / roiWidth, containerRect.height / roiHeight);
const translateX = -roiX * scale + (containerRect.width - roiWidth * scale) / 2;
const translateY = -roiY * scale + (containerRect.height - roiHeight * scale) / 2;

// Applied to a wrapper around the <video>
style = {
  transform: `scale(${scale}) translate(${translateX / scale}px, ${translateY / scale}px)`,
  transformOrigin: 'top left'
};
```

This means the mapping from **container/display space → video space** in zoom mode is:

```ts
// pointer is a point relative to the container's top-left (e.g., from getBoundingClientRect math)
function displayToVideoZoom(pointer: {x: number; y: number}, scale: number, translateX: number, translateY: number) {
  // Inverse of: v' = scale * v + [translateX, translateY]
  const x = (pointer.x - translateX) / scale;
  const y = (pointer.y - translateY) / scale;
  return { x, y }; // in video pixels
}
```

### Practical notes

* **Clicks while zoomed**: capture pointer in container coords, then call `displayToVideoZoom(...)` to get **video-space** coords before emitting `POINT.ADD`.
* **Bounds**: in zoom mode, only accept points if they’re inside the current **ROI (video space)** because the viewport may show only that portion.
* **Overlay rendering**: your current code hides the SVG/Moveable when `zoomed`. If you later render overlays while zoomed, draw them in **video space** and let the CSS transform position them automatically (they should be children of the same transformed wrapper), or convert to container space with the **forward** transform:

  ```ts
  function videoToDisplayZoom(pt: {x:number;y:number}, scale:number, translateX:number, translateY:number) {
    return { x: pt.x * scale + translateX, y: pt.y * scale + translateY };
  }
  ```
* **OpenCV**: still operates in **video space**. The zoom transform is purely visual and should not change the inputs you pass to LK optical flow (`calcOpticalFlowPyrLK`).
* **Storage**: continue storing all `{time,x,y}` in video pixels. Zoom/resizes won’t affect persisted data.

\----------------- | --------------------------------------------------------------------------------------------------------------------------- |
\| **Video space**   | Pixel coordinates from the original source frame (`vidWidth`, `vidHeight`) — this is what OpenCV works with.                |
\| **Display space** | Pixel coordinates as rendered in the DOM (`displayWidth`, `displayHeight`) — this is what the user sees and interacts with. |

**ROI Conversion (display → video)**

```ts
function displayToVideo(roiDisplay, vidWidth, vidHeight, displayWidth, displayHeight) {
  const scaleX = vidWidth / displayWidth;
  const scaleY = vidHeight / displayHeight;
  return {
    x: roiDisplay.x * scaleX,
    y: roiDisplay.y * scaleY,
    width: roiDisplay.width * scaleX,
    height: roiDisplay.height * scaleY
  };
}
```

**Points Conversion (display → video)**

```ts
function pointDisplayToVideo(pt, vidWidth, vidHeight, displayWidth, displayHeight) {
  return {
    x: pt.x * (vidWidth / displayWidth),
    y: pt.y * (vidHeight / displayHeight)
  };
}
```

**Video → Display (for overlay rendering)**

```ts
function videoToDisplay(pt, vidWidth, vidHeight, displayWidth, displayHeight) {
  return {
    x: pt.x * (displayWidth / vidWidth),
    y: pt.y * (displayHeight / vidHeight)
  };
}
```

**Why This Matters**

* ROI cropping inside OpenCV must match what the user sees.
* Store `{time, x, y}` in **video space** so resizing doesn’t invalidate data.
* Always convert between spaces when drawing or interpreting clicks.

---

## Data Model

```ts
export type ROI = { x: number; y: number; width: number; height: number };
export type TrackPoint = { time: number; x: number; y: number };
export type Track = TrackPoint[];
export type Vector = { bottomX: number; bottomY: number; topX: number; topY: number };
export type RawDots = Record<string, Track>;
export type SelectedSegment = { startTime: number; endTime: number; bottomX?: number; bottomY?: number; topX?: number; topY?: number };
export type SelectedTracks = Record<string, SelectedSegment[]>;
export type Visibility = Record<string, boolean>;
export type SoloState = { soloed?: string | null };
export type ROISegment = { startTime: number; endTime: number; roi: ROI };

export interface MotionContext {
  roi: ROI | null;
  roiTimeline: ROISegment[];
  raw_dots: RawDots;
  selected_tracks: SelectedTracks;
  visibility: Visibility;
  solo: SoloState;
  colorIndex: number;
  currentDirection: 'forward' | 'backward';
  isTracking: boolean;
}
```

---

## Event Model

```ts
type MotionEvent =
  | { type: 'MODE.CHOOSE' }
  | { type: 'MODE.TRACK_WRITE' }
  | { type: 'MODE.TRACK_EDIT' }
  | { type: 'MODE.TRACK_SELECT' }
  | { type: 'ROI.UPDATE'; roi: ROI }
  | { type: 'ROI.ADD_SEGMENT'; segment: ROISegment }
  | { type: 'POINT.ADD'; x: number; y: number; time: number }
  | { type: 'POINT.REMOVE_TRACK'; track: string }
  | { type: 'VISIBILITY.TOGGLE'; track: string }
  | { type: 'VISIBILITY.SOLO'; track: string | null }
  | { type: 'TRACK.START'; direction: 'forward' | 'backward' }
  | { type: 'TRACK.STOP' }
  | { type: 'TRACK.FRAME_BATCH'; batch: RawDots }
  | { type: 'TRACK.TRIM_BEFORE'; track: string; cutTime: number }
  | { type: 'TRACK.TRIM_AFTER'; track: string; cutTime: number }
  | { type: 'SELECT.ADD_SEGMENT'; track: string; startTime: number; endTime: number }
  | { type: 'SELECT.SET_VECTOR'; track: string; index: number; vector: Vector }
  | { type: 'SELECT.CLEAR'; track?: string }
  | { type: 'VIDEO.SEEK'; time: number }
  | { type: 'VIDEO.PAUSE' }
  | { type: 'VIDEO.PLAY' };
```

---

## States & Transitions

* **choose\_points**: click inside ROI to add colored dots.
* **track\_points.write**: OpenCV service runs, appending frame data.
* **track\_points.edit**: review and trim stored points.
* **track\_points.select**: choose segments, assign vectors.

Mode switching never deletes existing data.

---

## Actions

* `addPoint`: create track with color, seed initial point.
* `rotateColor`: advance color index.
* `mergeBatch`: merge incoming tracking points.
* `trimBefore` / `trimAfter`: splice points.
* `toggleVisibility` / `setSolo`: control dot visibility.
* `addSelectedSegment`: store selection window.
* `setVector`: assign motion vector.

---

## Guards

* `insideROI`: checks if point inside ROI.
* `validSegment`: ensures start < end.
* `hasVectorFields`: ensures vector is complete.

---

## Services

### `opencvTrackLoop(direction)`

* Reads video frames.
* Converts to grayscale.
* Crops to ROI (after converting display → video coords).
* Tracks active points with `calcOpticalFlowPyrLK`.
* Emits `TRACK.FRAME_BATCH` to update `raw_dots`.
* Stops on boundary or manual stop.

---

## Auto-Vector Suggestion

* **Heuristic**: max Y diff → vertical vector, else horizontal.
* **PCA**: principal component of displacements.

---

## Mapping to Funscript

* Project motion along vector.
* Normalize 0–100.
* Optional smoothing/resampling.
* Output `{ at, pos }[]`.

---

## To-Do (Milestones)

1. Scaffolding.
2. ROI overlay.
3. Choose points.
4. Tracking service.
5. Playback/review.
6. Trim tools.
7. Select segments.
8. Mapping → funscript.
9. Persistence.
10. Performance polish.
11. Quality tools.
12. Tests.
