# PFS Editor State Machine Architecture

## Overview
This document outlines the XState machine architecture for the PFS Editor, organizing complex state management into focused, interconnected machines that handle specific domains of functionality.

## Machine Hierarchy

```
projectParentMachine (Root)
├── chapters_editing → chapterMachine
├── roi_editing → roiMachine
├── zoom_editing → zoomMachine
├── motion_editing → motionMachine
├── fsaction_editing → fsActionMachine
└── playing → (no child machine, direct control)
```

This machine outline provides a clear roadmap for organizing your state management. The architecture separates concerns while maintaining clear communication patterns between machines. Each machine has a focused responsibility, making the codebase more maintainable and testable.

The key benefits of this approach:
- **Clear boundaries** between different editing modes
- **Reusable patterns** for state management
- **Easy testing** of individual machines
- **Scalable architecture** for future features
- **Clean integration path** for Supabase

Would you like me to start implementing any specific machine, or would you like to discuss any modifications to this architecture?

## 1. projectParentMachine (Root Machine)

**Purpose**: Orchestrates the overall editing workflow and manages shared resources.

**Responsibilities**:
- Video player reference management
- Current video time tracking
- Mode switching between editing states
- Project-level state coordination
- Shared context for child machines
- Video-graph synchronization coordination

**Key Context**:
- `playerRef`: Video element reference
- `currentTime`: Current video playback time
- `videoDuration`: Total video duration
- `projectId`: Current project identifier


**States**:
- `idle`: Initial state, waiting for video to load
- `playing`: Video playback mode (no editing)
- `chapters_editing`: Chapter editing mode
- `roi_editing`: ROI editing mode
- `zoom_editing`: Zoom/pan editing mode
- `motion_editing`: Motion capture mode
- `fsaction_editing`: Funscript action editing mode

**Key Events**:
- `VIDEO_TIME_UPDATE`: Updates current time
- `SWITCH_TO_*`: Mode switching events
- `SET_PLAYER_REF`: Sets video player reference
- `SET_PROJECT_ID`: Sets current project

---

## 2. chapterMachine

**Purpose**: Manages video chapter creation, editing, and selection.

**Responsibilities**:
- Chapter CRUD operations (create, read, update, delete)
- Chapter selection and range calculation
- Chapter data persistence
- Chapter visualization state

**Key Context**:
- `chapters`: Map of chapter objects
- `selectedChapterId`: Currently selected chapter
- `rangeStart/End`: Calculated range based on selected chapter

**States**:
- `idle`: No chapter selected
- `editing`: Chapter editing mode
- `selecting`: Chapter selection mode

**Key Events**:
- `ADD_CHAPTER`: Create new chapter
- `UPDATE_CHAPTER`: Modify existing chapter
- `SELECT_CHAPTER`: Select chapter for editing
- `DELETE_CHAPTER`: Remove chapter
- `SAVE_CHAPTERS`: Persist chapter data

**Data Model**:
```typescript
interface Chapter {
  id: string;
  startTime: number;
  endTime: number;
  title: string;
  color: string;
}
```

---

## 3. roiMachine (Existing)

**Purpose**: Manages Region of Interest (ROI) tracking and editing.

**Responsibilities**:
- ROI creation and editing
- ROI selection and activation
- ROI data persistence
- ROI visualization state

**Key Context**:
- `rois`: Map of ROI objects
- `selectedROIid`: Currently selected ROI
- `activeROIid`: ROI active at current time

**States**:
- `idle`: Waiting for player reference
- `ready`: Ready for ROI operations
  - `editingROI`: ROI editing mode
  - `playing`: ROI playback mode

**Key Events**:
- `ADD_ROI`: Create new ROI
- `UPDATE_ROI`: Modify existing ROI
- `SELECT_ROI`: Select ROI for editing
- `REMOVE_ROI`: Delete ROI
- `SET_ACTIVE_ROI`: Set ROI active at current time

**Data Model**:
```typescript
interface ROI {
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
  timeStart: number;
}
```

---

## 4. zoomMachine

**Purpose**: Manages graph zoom, pan, and viewport controls.

**Responsibilities**:
- Zoom level management
- Pan position tracking
- Viewport calculations
- Zoom/pan state persistence
- Graph navigation coordination

**Key Context**:
- `zoomLevel`: Current zoom factor
- `panX/PanY`: Current pan position
- `viewportStart/End`: Visible time range
- `zoomHistory`: Stack of zoom states for undo

**States**:
- `idle`: Default zoom/pan state
- `zooming`: Active zoom operation
- `panning`: Active pan operation
- `selecting`: Zoom selection mode

**Key Events**:
- `ZOOM_IN`: Increase zoom level
- `ZOOM_OUT`: Decrease zoom level
- `PAN_TO`: Pan to specific position
- `RESET_VIEW`: Reset to default view
- `SELECT_ZOOM_RANGE`: Select range to zoom into

---

## 5. motionMachine

**Purpose**: Manages motion capture and tracking functionality.

**Responsibilities**:
- Motion detection initialization
- Motion path tracking
- Motion data processing
- Motion-to-funscript conversion
- Motion visualization state

**Key Context**:
- `motionPaths`: Array of detected motion paths
- `selectedPathId`: Currently selected motion path
- `detectionSettings`: Motion detection parameters
- `processingState`: Current processing status

**States**:
- `idle`: No motion detection active
- `detecting`: Motion detection in progress
- `processing`: Processing detected motion
- `editing`: Motion path editing mode
- `converting`: Converting motion to funscript

**Key Events**:
- `START_DETECTION`: Begin motion detection
- `STOP_DETECTION`: Stop motion detection
- `PROCESS_MOTION`: Process detected motion data
- `SELECT_PATH`: Select motion path for editing
- `CONVERT_TO_FUNSCRIPT`: Convert motion to funscript actions

**Data Model**:
```typescript
interface MotionPath {
  id: string;
  points: Array<{x: number, y: number, time: number}>;
  bounds: {min: number, max: number};
  settings: MotionDetectionSettings;
}
```

---

## 6. fsActionMachine

**Purpose**: Manages Funscript action editing and manipulation.

**Responsibilities**:
- Action point creation and editing
- Multi-point selection
- Action data manipulation
- Undo/redo for action changes
- Action data persistence

**Key Context**:
- `actions`: Array of funscript actions
- `selectedActionIds`: Array of selected action IDs
- `currentNodeIdx`: Current action index
- `undoStack`: Stack for undo operations
- `redoStack`: Stack for redo operations
- `chartRef`: Chart.js reference for graph interactions

**States**:
- `idle`: No editing active
- `selecting`: Action selection mode
- `editing`: Action editing mode
- `bulkEditing`: Multi-action editing mode

**Key Events**:
- `ADD_ACTION`: Add new action point
- `UPDATE_ACTION`: Modify existing action
- `SELECT_ACTION`: Select action for editing
- `DELETE_ACTION`: Remove action
- `BULK_UPDATE`: Update multiple actions
- `UNDO`: Undo last operation
- `REDO`: Redo last operation

**Data Model**:
```typescript
interface FunscriptAction {
  at: number; // timestamp in milliseconds
  pos: number; // position (0-100)
}
```

---

## 7. loaderMachine (Existing)

**Purpose**: Manages file loading and project initialization.

**Responsibilities**:
- Video file loading
- Funscript file parsing
- Project data restoration
- Loading state management
- Error handling for file operations

**Key Context**:
- `loadingState`: Current loading status
- `loadedFiles`: Map of loaded file data
- `errorState`: Error information if loading fails

**States**:
- `idle`: No loading in progress
- `loadingVideo`: Video file loading
- `loadingFunscript`: Funscript file loading
- `loadingProject`: Project data loading
- `error`: Loading error state

**Key Events**:
- `LOAD_VIDEO`: Load video file
- `LOAD_FUNSCRIPT`: Load funscript file
- `LOAD_PROJECT`: Load project data
- `RESET`: Reset loading state

---

## Communication Patterns

### Parent-Child Communication
- **Events**: Parent sends events to child machines via `send` action
- **Context**: Parent provides shared context (playerRef, currentTime, etc.)
- **State**: Child machines report state changes via `sendParent` action

### Cross-Machine Communication
- **Shared Context**: Common data shared via parent machine context
- **Event Broadcasting**: Parent machine broadcasts relevant events to all children
- **State Coordination**: Parent machine coordinates state transitions between children

### Data Flow
1. **User Input** → Component → Parent Machine → Child Machine
2. **Child Machine** → Parent Machine → Database → UI Update
3. **Video Time** → Parent Machine → All Child Machines → UI Update

## State Persistence Strategy

### Per-Machine Persistence
- Each machine handles its own data persistence
- Use debounced saves to avoid excessive database calls
- Implement optimistic updates for better UX

### Project-Level Persistence
- Parent machine coordinates project-wide saves
- Batch updates for related data changes
- Event sourcing for undo/redo functionality

## Migration from Current Architecture

### Phase 1: Extract chapterMachine
- Move chapter-related code from fsEditMachine
- Create chapterMachine with focused responsibilities
- Update parent machine to invoke chapterMachine

### Phase 2: Create zoomMachine
- Extract zoom/pan functionality
- Implement viewport management
- Add zoom state persistence

### Phase 3: Create motionMachine
- Implement motion detection state management
- Add motion processing workflows
- Integrate with OpenCV functionality

### Phase 4: Create fsActionMachine
- Extract action editing from fsEditMachine
- Implement undo/redo functionality
- Add bulk editing capabilities

### Phase 5: Refactor projectParentMachine
- Consolidate shared functionality
- Implement mode switching logic
- Add comprehensive state coordination

## Benefits of This Architecture

1. **Separation of Concerns**: Each machine handles one domain
2. **Testability**: Machines can be tested independently
3. **Maintainability**: Changes to one domain don't affect others
4. **Scalability**: Easy to add new editing modes
5. **Performance**: Only relevant machines are active
6. **Supabase Integration**: Clean separation for backend integration
