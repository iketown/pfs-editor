import { createActorContext } from '@xstate/react';
import { roiMachine } from '@/lib/fs_machines/roiMachine';

export const RoiActorContext = createActorContext(roiMachine);
export const useRoiActorRef = RoiActorContext.useActorRef;
export const useRoiSelector = RoiActorContext.useSelector;
