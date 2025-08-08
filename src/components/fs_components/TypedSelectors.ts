import { useSelector } from '@xstate/react';
import type { LoaderContext } from '@/lib/fs_machines/loaderMachine';
import type { FSEditContext } from '@/lib/fs_machines/fsEditMachine';
import type { RoiContext } from '@/lib/fs_machines/roiMachine';
import type { ChapterContext } from '@/lib/fs_machines/chapterMachine';
import {
    useLoaderActorRef,
    useFsEditActorRef,
    useRoiActorRef,
    useChapterActorRef,
    useZoomActorRef,
    useMotionActorRef,
    useFsActionActorRef
} from './ProjectParentMachineCtx';

// Type for machine state
type MachineState<TContext> = {
    context: TContext;
    value: any;
    event: any;
};

// Typed selector functions
export const useLoaderSelector = <T>(selector: (state: MachineState<LoaderContext>) => T): T => {
    const loaderActor = useLoaderActorRef();
    return useSelector(loaderActor, selector as any);
};

export const useFsEditSelector = <T>(selector: (state: MachineState<FSEditContext>) => T): T => {
    const fsEditActor = useFsEditActorRef();
    return useSelector(fsEditActor, selector as any);
};

export const useRoiSelector = <T>(selector: (state: MachineState<RoiContext>) => T): T => {
    const roiActor = useRoiActorRef();
    return useSelector(roiActor, selector as any);
};

export const useChapterSelector = <T>(selector: (state: MachineState<ChapterContext>) => T): T => {
    const chapterActor = useChapterActorRef();
    return useSelector(chapterActor, selector as any);
};

export const useZoomSelector = <T>(selector: (state: MachineState<any>) => T): T => {
    const zoomActor = useZoomActorRef();
    return useSelector(zoomActor, selector as any);
};

export const useMotionSelector = <T>(selector: (state: MachineState<any>) => T): T => {
    const motionActor = useMotionActorRef();
    return useSelector(motionActor, selector as any);
};

export const useFsActionSelector = <T>(selector: (state: MachineState<any>) => T): T => {
    const fsActionActor = useFsActionActorRef();
    return useSelector(fsActionActor, selector as any);
};
