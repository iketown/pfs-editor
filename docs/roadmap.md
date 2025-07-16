### Phase 1: Core Visualization

- [ ] Upload and parse `.funscript`
- [ ] Render chart with `react-chartjs-2`
- [ ] Upload video and sync playback
- [ ] Playhead visualization in real-time
- [ ] **Frame-accurate video control:**
  - Use native HTML5 `<video>` tag
  - Support arbitrary playback speeds (e.g., 1.2543x)
  - Access `video.currentTime` and `video.playbackRate`
  - Integrate `requestVideoFrameCallback()` for accurate sync
  - Allow frame-accurate scrubbing and seeking

---

## 🕓 Timeline Mapping System

Implement a custom system to support mapping between an internal **project timeline** and the actual **video timeline**, to support syncing, alignment, and interpolation.

### Requirements:
- [ ] Define project FPS (e.g., 30, 60, 120) and frame units
- [ ] Create mapping from project frames → video frames or time
  - Example: `projectFrame 321 = videoTime 304.56s`
- [ ] Allow remapping offsets for editing (e.g., video shift at markers)
- [ ] Sync funscript events to project timeline regardless of video changes
- [ ] Future: map beats/music events to project time for musical sync

### Features:
- Fine-grained scrub control for video & chart
- Playback rate customization (e.g. 0.75x, 1.2543x)
- Auto-update video currentTime when user drags project playhead
- Display current projectFrame, videoFrame, and sync delta

---

