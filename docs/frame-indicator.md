# Frame Indicator Feature

## Overview

The Frame Indicator is a new feature that provides precise frame-by-frame navigation in the video timeline. It appears as a row of small vertical lines above the chart when you zoom in enough to see individual frames.

## How it Works

1. **FPS Detection**: The system automatically detects the video's frame rate (FPS) when the video loads. By default, it uses 30fps as a fallback.

2. **Manual FPS Setting**: You can manually adjust the FPS using the input field in the button row above the chart. This is useful if the automatic detection isn't accurate.

3. **Frame Display**: When you zoom in to show less than 5 seconds of video, the frame indicator appears showing individual frame markers.

4. **Current Frame Highlighting**: The current frame is highlighted in red to show your current position in the video.

5. **Frame Navigation**: Click on any frame marker to seek to that exact frame in the video.

## Features

- **Automatic FPS Detection**: Attempts to detect video frame rate on load
- **Manual FPS Override**: Input field to set custom FPS (1-120 range)
- **Smart Display**: Only shows when zoomed in enough (< 5 seconds visible)
- **Performance Optimized**: Limits display to 200 frames maximum to prevent lag
- **Current Frame Indicator**: Red highlight shows current video position
- **Hover Effects**: Frame markers expand and brighten on hover
- **Tooltips**: Show frame number and exact time on hover

## Usage

1. Load a video and funscript
2. Zoom in on the chart to show less than 5 seconds
3. The frame indicator will appear above the chart
4. Click on any frame marker to seek to that frame
5. Adjust FPS if needed using the input field in the button row

## Technical Details

- Frame duration = 1000ms / FPS
- Frame markers are positioned using percentage-based layout
- Current frame detection uses half-frame tolerance
- Chart zoom events trigger frame indicator updates
- Maximum 200 frames displayed to maintain performance

## Files Modified

- `src/components/fs_components/FrameIndicator.tsx` - New component
- `src/components/fs_components/FSGraph.tsx` - Integration
- `src/components/fs_components/FSGraphButtons.tsx` - FPS input
- `src/components/fs_components/VideoPlayer.tsx` - FPS detection
- `src/lib/fs_machines/projectMachine.ts` - State management
- `src/lib/fs_machines/roiMachine.ts` - State management
- `src/lib/fs_machines/projectActions.ts` - Actions 