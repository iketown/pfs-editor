# Range Sliders for Video Time Control

## Overview

The VideoTimeSlider component implements a dual-slider system for precise video time control and chapter management. This system consists of two stacked sliders with different purposes and ranges.

## Slider Architecture

### Bottom Slider (Range Selector)
- **Purpose**: Sets the working range for the top slider
- **Range**: Always spans the entire video duration (0 → `ctx.videoDuration`)
- **Handles**: Two handles that define `ctx.rangeStart` and `ctx.rangeEnd`
- **Behavior**: 
  - Left handle sets the start of the working range
  - Right handle sets the end of the working range
  - The range between these handles becomes the domain for the top slider

### Top Slider (Chapter Editor)
- **Purpose**: Manages chapter start and end times within the selected range
- **Range**: Dynamic, based on bottom slider selection (`ctx.rangeStart` → `ctx.rangeEnd`)
- **Handles**: Multiple handles representing chapter boundaries
  - Each chapter has two handles: `startTime` and `endTime`
  - Only chapters within the selected range are displayed
  - Chapters outside the range are hidden to avoid clutter

## State Management

The component integrates with the XState context to manage:

```typescript
interface VideoSliderContext {
  videoDuration: number;    // Total video duration in seconds
  rangeStart: number;       // Start of working range (bottom slider left handle)
  rangeEnd: number;         // End of working range (bottom slider right handle)
  chapters: Chapter[];      // Array of chapter objects with startTime/endTime
}

interface Chapter {
  name?: string;
  startTime: number;        // Chapter start time in seconds
  endTime: number;          // Chapter end time in seconds
}
```

## User Interaction Flow

1. **Range Selection**: User adjusts bottom slider handles to set working range
2. **Chapter Visibility**: Top slider automatically filters to show only chapters within range
3. **Chapter Editing**: User can drag chapter handles on top slider to adjust timing
4. **Real-time Updates**: Changes are immediately reflected in the XState context

## Visual Design

- **Bottom Slider**: 
  - Full width, positioned at bottom
  - Two handles with clear visual distinction
  - Shows full video duration scale
  
- **Top Slider**:
  - Positioned above bottom slider
  - Multiple handles for chapter boundaries
  - Chapter labels overlaid at handle positions
  - Only visible within selected range

## Technical Implementation

### Slider Library
Uses `nouislider-react` for both sliders with different configurations:

- **Bottom Slider**: Simple range slider with two handles
- **Top Slider**: Multiple handles with chapter-specific styling

### Range Filtering Logic
```typescript
// Filter chapters to only show those within the selected range
const visibleChapters = chapters.filter(chapter => 
  chapter.startTime >= rangeStart && 
  chapter.endTime <= rangeEnd
);
```

### Handle Positioning
- Bottom slider handles: Direct time values (0 to videoDuration)
- Top slider handles: Normalized to range (0 to 100% of selected range)

## Benefits

1. **Precision**: Users can focus on specific video segments
2. **Clarity**: Reduces visual clutter by hiding irrelevant chapters
3. **Efficiency**: Faster editing of chapters within a specific time range
4. **Scalability**: Works well with videos of any duration and any number of chapters

## Future Enhancements

- Zoom controls for even more precise editing
- Keyboard shortcuts for handle adjustment
- Snap-to-frame functionality
- Visual indicators for chapter overlap warnings 