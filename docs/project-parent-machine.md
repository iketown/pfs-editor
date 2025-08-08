# Project Parent Machine

## Overview

The `projectParentMachine` is the root state machine that orchestrates all child actor machines in the PFS Editor. It manages shared resources, coordinates mode switching, and provides a centralized interface for accessing all child actors.

## Architecture

```
projectParentMachine (Root)
├── loaderActor → loaderMachine
├── fsEditActor → fsEditMachine  
├── roiActor → roiMachine
├── chapterActor → chapterMachine (Future)
├── zoomActor → zoomMachine (Future)
├── motionActor → motionMachine (Future)
└── fsActionActor → fsActionMachine (Future)
```

## Key Features

### Shared Resource Management
- **Video Player Reference**: Centralized management of the video element reference
- **Chart Reference**: Shared chart.js reference for graph interactions
- **Video Time**: Current playback time synchronized across all machines
- **Video Duration**: Total video duration shared with child machines
- **Video FPS**: Frame rate information for timing calculations
- **Project ID**: Current project identifier for data persistence

### Mode Switching
The parent machine manages transitions between different editing modes:
- `playing`: Video playback mode (no editing)
- `chapters_editing`: Chapter editing mode
- `roi_editing`: ROI editing mode
- `zoom_editing`: Zoom/pan editing mode
- `motion_editing`: Motion capture mode
- `fsaction_editing`: Funscript action editing mode

### Event Forwarding
All shared resource events are automatically forwarded to relevant child actors:
- `SET_PLAYER_REF` → All child actors
- `SET_CHART_REF` → FS Edit, ROI, Zoom, FS Action actors
- `VIDEO_TIME_UPDATE` → All child actors
- `SET_VIDEO_DURATION` → FS Edit, Chapter, Zoom, FS Action actors
- `SET_VIDEO_FPS` → FS Edit, ROI, Motion actors
- `SET_PROJECT_ID` → All child actors

## Usage

### Basic Setup

```tsx
import { ProjectParentMachineCtx } from '@/components/fs_components/ProjectParentMachineCtx';

function App() {
  return (
    <ProjectParentMachineCtx.Provider>
      <YourAppContent />
    </ProjectParentMachineCtx.Provider>
  );
}
```

### Accessing the Parent Machine

```tsx
import { 
  useProjectParentActorRef, 
  useProjectParentSelector 
} from '@/components/fs_components/ProjectParentMachineCtx';

function MyComponent() {
  const actorRef = useProjectParentActorRef();
  const context = useProjectParentSelector(state => state.context);
  
  // Send events directly to parent machine
  const handleSetPlayerRef = (playerRef) => {
    actorRef.send({ type: 'SET_PLAYER_REF', playerRef });
  };
}
```

### Accessing Child Actors

```tsx
import { 
  useFsEditActorRef,
  useRoiActorRef,
  useFsEditContext,
  useRoiContext 
} from '@/components/fs_components/ProjectParentMachineCtx';

function MyComponent() {
  // Get actor references
  const fsEditActor = useFsEditActorRef();
  const roiActor = useRoiActorRef();
  
  // Get contexts
  const fsEditContext = useFsEditContext();
  const roiContext = useRoiContext();
  
  // Send events to child actors
  const handleLoadVideo = (url, file) => {
    fsEditActor.send({ type: 'LOAD_VIDEO', url, file });
  };
  
  const handleAddRoi = (roi) => {
    roiActor.send({ type: 'ADD_ROI', roi });
  };
}
```

### Mode Switching

```tsx
import { useSwitchMode, useCurrentMode } from '@/components/fs_components/ProjectParentMachineCtx';

function ModeSwitcher() {
  const currentMode = useCurrentMode();
  const switchMode = useSwitchMode();
  
  return (
    <div>
      <button 
        onClick={switchMode.switchToRoiEditing}
        disabled={currentMode === 'roi_editing'}
      >
        Switch to ROI Editing
      </button>
      
      <button 
        onClick={switchMode.switchToPlaying}
        disabled={currentMode === 'playing'}
      >
        Switch to Playing
      </button>
    </div>
  );
}
```

### Sending Events to Child Actors

```tsx
import { 
  useSendToFsEdit, 
  useSendToRoi 
} from '@/components/fs_components/ProjectParentMachineCtx';

function MyComponent() {
  const sendToFsEdit = useSendToFsEdit();
  const sendToRoi = useSendToRoi();
  
  const handleSetProjectId = (projectId) => {
    // Send to multiple child actors
    sendToFsEdit({ type: 'SET_PROJECT_ID', projectId });
    sendToRoi({ type: 'SET_PROJECT_ID', projectId });
  };
}
```

### State Monitoring

```tsx
import { 
  useProjectState, 
  useCurrentMode,
  useFsEditState,
  useRoiState 
} from '@/components/fs_components/ProjectParentMachineCtx';

function StatusDisplay() {
  const projectState = useProjectState(); // 'idle' | 'ready' | 'error'
  const currentMode = useCurrentMode(); // Current editing mode
  const fsEditState = useFsEditState(); // FS Edit machine state
  const roiState = useRoiState(); // ROI machine state
  
  return (
    <div>
      <div>Project: {projectState}</div>
      <div>Mode: {currentMode}</div>
      <div>FS Edit: {fsEditState?.value}</div>
      <div>ROI: {roiState?.value}</div>
    </div>
  );
}
```

## Machine States

### Parent Machine States
- `idle`: Initial state, waiting for project to load
- `ready`: Project is ready, can switch between editing modes
  - `playing`: Video playback mode
  - `chapters_editing`: Chapter editing mode
  - `roi_editing`: ROI editing mode
  - `zoom_editing`: Zoom/pan editing mode
  - `motion_editing`: Motion capture mode
  - `fsaction_editing`: Funscript action editing mode
- `error`: Error state

### State Transitions
- `idle` → `ready`: When playerRef and projectId are set
- `ready.*` → `ready.*`: Mode switching between editing modes
- Any state → `error`: When errors occur
- `error` → `idle`: When project is reset

## Events

### Parent Machine Events
- **Shared Resources**: `SET_PLAYER_REF`, `SET_CHART_REF`, `VIDEO_TIME_UPDATE`, etc.
- **Mode Switching**: `SWITCH_TO_PLAYING`, `SWITCH_TO_ROI_EDITING`, etc.
- **Project Management**: `LOAD_PROJECT`, `SAVE_PROJECT`, `RESET_PROJECT`
- **Event Forwarding**: `FORWARD_TO_LOADER`, `FORWARD_TO_FSEDIT`, etc.

### Child Actor Events
All child actor events are forwarded through the parent machine using the `FORWARD_TO_*` events.

## Benefits

1. **Centralized State Management**: All shared resources managed in one place
2. **Automatic Event Forwarding**: Shared events automatically sent to relevant child actors
3. **Mode Coordination**: Clean switching between editing modes
4. **Easy Testing**: Each machine can be tested independently
5. **Scalable Architecture**: Easy to add new child machines
6. **Type Safety**: Full TypeScript support with proper event and context types

## Future Enhancements

- **Chapter Machine**: Dedicated machine for chapter management
- **Zoom Machine**: Dedicated machine for zoom/pan functionality
- **Motion Machine**: Dedicated machine for motion capture
- **FS Action Machine**: Dedicated machine for funscript action editing
- **Persistence Layer**: Integration with Supabase for data persistence
- **Undo/Redo**: Project-level undo/redo functionality
- **Collaboration**: Real-time collaboration features 