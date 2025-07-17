import { createActorContext } from '@xstate/react';
import { fsEditMachine } from '@/lib/fs_machines/fsEditMachine';

export const FsEditActorContext = createActorContext(fsEditMachine);
export const useEditActorRef = FsEditActorContext.useActorRef;
export const useEditSelector = FsEditActorContext.useSelector;
