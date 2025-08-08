import { createActorContext } from '@xstate/react';
import { projectParentMachine } from '@/lib/fs_machines/projectParentMachine';
import type { LoaderContext } from '@/lib/fs_machines/loaderMachine';
import type { FSEditContext } from '@/lib/fs_machines/fsEditMachine';
import type { RoiContext } from '@/lib/fs_machines/roiMachine';
import type { ChapterContext } from '@/lib/fs_machines/chapterMachine';

// Create the actor context for the project parent machine
export const ProjectParentMachineCtx = createActorContext(projectParentMachine);

// Export convenience hooks for accessing the parent machine
export const useProjectParentActorRef = ProjectParentMachineCtx.useActorRef;
export const useProjectParentSelector = ProjectParentMachineCtx.useSelector;

// Export convenience hooks for accessing child actors
export const useLoaderActorRef = () => {
  const actorRef = useProjectParentActorRef();
  return actorRef.getSnapshot().context.loaderActor;
};

export const useFsEditActorRef = () => {
  const actorRef = useProjectParentActorRef();
  return actorRef.getSnapshot().context.fsEditActor;
};

export const useRoiActorRef = () => {
  const actorRef = useProjectParentActorRef();
  return actorRef.getSnapshot().context.roiActor;
};

export const useChapterActorRef = () => {
  const actorRef = useProjectParentActorRef();
  return actorRef.getSnapshot().context.chapterActor;
};

export const useMotionActorRef = () => {
  const actorRef = useProjectParentActorRef();
  return actorRef.getSnapshot().context.motionActor;
};

export const useFsActionActorRef = () => {
  const actorRef = useProjectParentActorRef();
  return actorRef.getSnapshot().context.fsActionActor;
};

// Export convenience selectors for child actor states
export const useLoaderState = () => {
  const loaderActor = useLoaderActorRef();
  return loaderActor?.getSnapshot();
};

export const useFsEditState = () => {
  const fsEditActor = useFsEditActorRef();
  return fsEditActor?.getSnapshot();
};

export const useRoiState = () => {
  const roiActor = useRoiActorRef();
  return roiActor?.getSnapshot();
};

export const useChapterState = () => {
  const chapterActor = useChapterActorRef();
  return chapterActor?.getSnapshot();
};

export const useMotionState = () => {
  const motionActor = useMotionActorRef();
  return motionActor?.getSnapshot();
};

export const useFsActionState = () => {
  const fsActionActor = useFsActionActorRef();
  return fsActionActor?.getSnapshot();
};

// Export convenience selectors for child actor contexts
export const useLoaderContext = () => {
  const state = useLoaderState();
  return state?.context;
};

export const useFsEditContext = () => {
  const state = useFsEditState();
  return state?.context;
};

export const useRoiContext = () => {
  const state = useRoiState();
  return state?.context;
};

export const useChapterContext = () => {
  const state = useChapterState();
  return state?.context;
};

export const useZoomContext = () => {
  const state = useZoomState();
  return state?.context;
};

export const useMotionContext = () => {
  const state = useMotionState();
  return state?.context;
};

export const useFsActionContext = () => {
  const state = useFsActionState();
  return state?.context;
};

// Export convenience selectors that work like the old useEditSelector
// These are pre-loaded with the correct actor ref and return the full state
import { useSelector } from '@xstate/react';

/**
 * Selector for Loader machine state
 * @param selector Function that receives state with LoaderContext
 * @returns Selected value from Loader machine state
 */
export const useLoaderSelector = (selector: (state: any) => any) => {
  const loaderActor = useLoaderActorRef();
  return useSelector(loaderActor, selector);
};

/**
 * Selector for FSEdit machine state
 * @param selector Function that receives state with FSEditContext
 * @returns Selected value from FSEdit machine state
 */
export const useFsEditSelector = (selector: (state: any) => any) => {
  const fsEditActor = useFsEditActorRef();
  return useSelector(fsEditActor, selector);
};

/**
 * Selector for ROI machine state
 * @param selector Function that receives state with RoiContext
 * @returns Selected value from ROI machine state
 */
export const useRoiSelector = (selector: (state: any) => any) => {
  const roiActor = useRoiActorRef();
  return useSelector(roiActor, selector);
};

/**
 * Selector for Chapter machine state
 * @param selector Function that receives state with ChapterContext
 * @returns Selected value from Chapter machine state
 */
export const useChapterSelector = (selector: (state: any) => any) => {
  const chapterActor = useChapterActorRef();
  return useSelector(chapterActor, selector);
};

/**
 * Selector for Motion machine state
 * @param selector Function that receives state with MotionContext
 * @returns Selected value from Motion machine state
 */
export const useMotionSelector = (selector: (state: any) => any) => {
  const motionActor = useMotionActorRef();
  return useSelector(motionActor, selector);
};

/**
 * Selector for FSAction machine state
 * @param selector Function that receives state with FSActionContext
 * @returns Selected value from FSAction machine state
 */
export const useFsActionSelector = (selector: (state: any) => any) => {
  const fsActionActor = useFsActionActorRef();
  return useSelector(fsActionActor, selector);
};

// Export convenience hooks for sending events to child actors
export const useSendToLoader = () => {
  const actorRef = useProjectParentActorRef();
  return (event: any) => {
    actorRef.send({ type: 'FORWARD_TO_LOADER', event });
  };
};

export const useSendToFsEdit = () => {
  const actorRef = useProjectParentActorRef();
  return (event: any) => {
    actorRef.send({ type: 'FORWARD_TO_FSEDIT', event });
  };
};

export const useSendToRoi = () => {
  const actorRef = useProjectParentActorRef();
  return (event: any) => {
    actorRef.send({ type: 'FORWARD_TO_ROI', event });
  };
};

export const useSendToChapter = () => {
  const actorRef = useProjectParentActorRef();
  return (event: any) => {
    actorRef.send({ type: 'FORWARD_TO_CHAPTER', event });
  };
};

export const useSendToZoom = () => {
  const actorRef = useProjectParentActorRef();
  return (event: any) => {
    actorRef.send({ type: 'FORWARD_TO_ZOOM', event });
  };
};

export const useSendToMotion = () => {
  const actorRef = useProjectParentActorRef();
  return (event: any) => {
    actorRef.send({ type: 'FORWARD_TO_MOTION', event });
  };
};

export const useSendToFsAction = () => {
  const actorRef = useProjectParentActorRef();
  return (event: any) => {
    actorRef.send({ type: 'FORWARD_TO_FSACTION', event });
  };
};

// Export convenience hooks for mode switching
export const useSwitchMode = () => {
  const actorRef = useProjectParentActorRef();
  return {
    switchToPlaying: () => actorRef.send({ type: 'SWITCH_TO_PLAYING' }),
    switchToChaptersEditing: () =>
      actorRef.send({ type: 'SWITCH_TO_CHAPTERS_EDITING' }),
    switchToRoiEditing: () => actorRef.send({ type: 'SWITCH_TO_ROI_EDITING' }),
    switchToZoomEditing: () =>
      actorRef.send({ type: 'SWITCH_TO_ZOOM_EDITING' }),
    switchToMotionEditing: () =>
      actorRef.send({ type: 'SWITCH_TO_MOTION_EDITING' }),
    switchToFsActionEditing: () =>
      actorRef.send({ type: 'SWITCH_TO_FSACTION_EDITING' })
  };
};

// Export convenience hook for current mode
export const useCurrentMode = () => {
  return useProjectParentSelector((state) => {
    if (state.matches('ready.playing')) return 'playing';
    if (state.matches('ready.chapters_editing')) return 'chapters_editing';
    if (state.matches('ready.roi_editing')) return 'roi_editing';
    if (state.matches('ready.zoom_editing')) return 'zoom_editing';
    if (state.matches('ready.motion_editing')) return 'motion_editing';
    if (state.matches('ready.fsaction_editing')) return 'fsaction_editing';
    return 'idle';
  });
};

// Export convenience hook for project state
export const useProjectState = () => {
  return useProjectParentSelector((state) => {
    if (state.matches('idle')) return 'idle';
    if (state.matches('ready')) return 'ready';
    if (state.matches('error')) return 'error';
    return 'unknown';
  });
};
