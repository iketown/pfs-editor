import { createActorContext } from '@xstate/react';
import { motionMachine } from '@/lib/fs_machines/motionMachine';

export const MotionActorContext = createActorContext(motionMachine);
export const useMotionActorRef = MotionActorContext.useActorRef;
export const useMotionSelector = MotionActorContext.useSelector;
