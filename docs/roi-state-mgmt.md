# ROI State Management Architecture

## Overview

This document outlines the hybrid state management approach for Regions of Interest (ROI) in the PFS Editor, using **XState** for complex state logic and **Zustand** for UI interactions. This pattern will also be applied to future motion tracking features.

## Architecture Decision

### Why Hybrid State Management?

We chose a hybrid approach because each state management system has distinct strengths that complement each other:

#### XState Strengths
- **Complex State Logic**: Handles ROI lifecycle, time-based activation, and project persistence
- **Predictable Transitions**: Clear state machines for ROI creation, editing, and deletion
- **Project Integration**: Seamless integration with existing project storage system
- **Time-based Logic**: Efficient handling of video timeline synchronization
- **Debugging**: Excellent dev tools for complex state debugging

#### Zustand Strengths
- **Performance**: Fast updates for UI interactions like dragging and hovering
- **Simplicity**: Minimal boilerplate for simple state updates
- **Granular Subscriptions**: Components can subscribe to specific state slices
- **Real-time Updates**: Immediate UI feedback without complex state transitions
- **Bundle Size**: Lightweight for UI-specific state

## State Separation Strategy

### XState Handles (Persistent State)
```typescript
// Core ROI data and business logic
interface ROIState {
  rois: ROI[];                    // All ROIs in the project
  selectedROIId: string | null;   // Currently selected ROI
  activeROIIds: string[];         // ROIs active at current video time
  videoTime: number;              // Current video playback time
  projectId: string | null;       // Associated project
}

// Complex state transitions
type ROIEvent = 
  | { type: 'ROI_CREATED'; roi: ROI }
  | { type: 'ROI_UPDATED'; roi: ROI }
  | { type: 'ROI_DELETED'; roiId: string }
  | { type: 'VIDEO_TIME_UPDATE'; time: number }
  | { type: 'PROJECT_LOADED'; projectId: string };
```

### Zustand Handles (UI State)
```typescript
// UI interactions and temporary states
interface ROIUIState {
  dragState: ROIDragState | null;     // Current drag operation
  hoverROIId: string | null;          // ROI being hovered
  editMode: 'select' | 'create' | 'edit';
  tempROI: Partial<ROI> | null;       // Temporary ROI being created
  isDragging: boolean;                // Global drag state
  selectionBox: SelectionBox | null;  // Multi-select box
}
```

## Integration Patterns

### 1. Custom Hooks for Unified Access

```typescript
// hooks/useROIState.ts
export const useROIState = () => {
  // XState for persistent state
  const rois = useMotionSelector(state => state.context.rois);
  const selectedROIId = useMotionSelector(state => state.context.selectedROIId);
  const activeROIIds = useMotionSelector(state => state.context.activeROIIds);
  
  // Zustand for UI state
  const uiState = useRoiUIStore();
  
  return {
    // Persistent state (XState)
    rois,
    selectedROIId,
    activeROIIds,
    
    // UI state (Zustand)
    dragState: uiState.dragState,
    hoverROIId: uiState.hoverROIId,
    editMode: uiState.editMode,
    
    // Computed state
    selectedROI: rois.find(r => r.id === selectedROIId),
    activeROIs: rois.filter(r => activeROIIds.includes(r.id)),
  };
};
```

### 2. Coordinated Actions

```typescript
// hooks/useROIActions.ts
export const useROIActions = () => {
  const motionActor = useMotionActorRef();
  const uiStore = useRoiUIStore();
  
  const createROI = useCallback((roiData: Omit<ROI, 'id'>) => {
    const newROI = { ...roiData, id: nanoid(5) };
    
    // Update XState (persistence)
    motionActor.send({ type: 'ROI_CREATED', roi: newROI });
    
    // Clear UI state
    uiStore.clearTempROI();
    uiStore.setEditMode('select');
  }, [motionActor, uiStore]);
  
  const startDrag = useCallback((roiId: string, dragType: 'move' | 'resize') => {
    // Update UI state immediately (Zustand)
    uiStore.setDragState({ roiId, type: dragType, startPos: getMousePos() });
    
    // Select ROI in XState if not already selected
    motionActor.send({ type: 'ROI_SELECTED', roiId });
  }, [uiStore, motionActor]);
  
  return { createROI, startDrag, /* ... other actions */ };
};
```

### 3. State Synchronization

```typescript
// Automatic synchronization between stores
useEffect(() => {
  // When XState ROI is selected, update UI state
  if (selectedROIId && !uiState.dragState) {
    uiStore.setEditMode('edit');
  }
}, [selectedROIId, uiState.dragState]);

useEffect(() => {
  // When drag ends, persist changes to XState
  if (!uiState.dragState && uiState.lastDragResult) {
    motionActor.send({ 
      type: 'ROI_UPDATED', 
      roi: uiState.lastDragResult 
    });
  }
}, [uiState.dragState]);
```

## Implementation Guidelines

### 1. Clear Boundaries

**XState handles:**
- ROI data persistence
- Time-based activation logic
- Project integration
- Complex state transitions
- Data validation and business rules

**Zustand handles:**
- Drag and drop operations
- Hover states and visual feedback
- Temporary UI states
- Real-time user interactions
- Edit modes and UI state

### 2. Performance Considerations

```typescript
// Use Zustand for frequent updates
const updateDragPosition = useCallback((pos: Position) => {
  // Fast UI update (Zustand)
  uiStore.updateDragPosition(pos);
  
  // Debounced persistence update (XState)
  debouncedPersistUpdate(pos);
}, [uiStore]);

// Debounce XState updates during drag operations
const debouncedPersistUpdate = useMemo(
  () => debounce((pos: Position) => {
    motionActor.send({ type: 'ROI_DRAG_UPDATE', position: pos });
  }, 100),
  [motionActor]
);
```

### 3. Error Handling

```typescript
// XState handles business logic errors
const createROI = useCallback((data: ROIData) => {
  try {
    const validatedROI = validateROIData(data);
    motionActor.send({ type: 'ROI_CREATED', roi: validatedROI });
  } catch (error) {
    // Handle validation errors
    showErrorToast(error.message);
  }
}, [motionActor]);

// Zustand handles UI errors
const startDrag = useCallback((roiId: string) => {
  try {
    uiStore.setDragState({ roiId, type: 'move' });
  } catch (error) {
    // Handle UI state errors
    console.error('Drag state error:', error);
  }
}, [uiStore]);
```

## Future Motion Tracking Implementation

This hybrid pattern will be extended for motion tracking features:

### Motion Tracking State Structure

```typescript
// XState (Persistent)
interface MotionTrackingState {
  trackingData: TrackingData[];     // Persistent tracking data
  currentFrame: number;             // Current video frame
  trackingMode: 'manual' | 'auto';  // Tracking mode
  projectId: string | null;
}

// Zustand (UI)
interface MotionTrackingUIState {
  isTracking: boolean;              // Active tracking state
  trackingPreview: PreviewData;     // Real-time preview
  selectionMode: 'point' | 'area';  // UI selection mode
  tempTrackingData: Partial<TrackingData> | null;
}
```

### Benefits for Motion Tracking

1. **Real-time Preview**: Zustand handles fast preview updates during tracking
2. **Persistent Data**: XState manages tracking data persistence and project integration
3. **Complex Logic**: XState handles tracking algorithms and frame processing
4. **UI Responsiveness**: Zustand ensures smooth UI during intensive tracking operations

## Best Practices

### 1. State Design
- Keep XState focused on business logic and persistence
- Use Zustand for UI interactions and temporary states
- Avoid duplicating state between systems
- Use computed state to derive values from both systems

### 2. Performance
- Debounce XState updates during frequent UI operations
- Use Zustand for real-time UI feedback
- Implement proper cleanup for subscriptions and effects
- Monitor bundle size and optimize imports

### 3. Testing
- Test XState and Zustand integration through custom hooks
- Mock both systems independently for unit tests
- Test state synchronization scenarios
- Validate performance with large datasets

### 4. Debugging
- Use XState dev tools for complex state debugging
- Use Zustand dev tools for UI state debugging
- Implement logging for state synchronization
- Create debugging utilities for hybrid state inspection

## Migration Strategy

### From Single ROI to Multi-ROI
1. Extend existing XState context to support arrays
2. Add new events while preserving existing ones
3. Implement backward compatibility for existing projects
4. Gradually migrate UI components to use hybrid hooks

### From ROI to Motion Tracking
1. Follow the same hybrid pattern established for ROIs
2. Reuse custom hook patterns and integration utilities
3. Extend XState for tracking-specific business logic
4. Use Zustand for tracking UI interactions

## Conclusion

The hybrid XState + Zustand approach provides the best of both worlds:
- **XState** handles complex business logic and persistence
- **Zustand** provides fast, responsive UI interactions
- **Custom hooks** abstract the complexity and provide a clean API
- **Clear separation** makes the codebase maintainable and testable

This pattern will scale well for future features like motion tracking while maintaining the performance and user experience benefits of each state management system. 