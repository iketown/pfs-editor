import { createActorContext } from '@xstate/react';
import { projectMachine } from '@/lib/fs_machines/projectMachine';

export const ProjectActorContext = createActorContext(projectMachine);
export const useProjectActorRef = ProjectActorContext.useActorRef;
export const useProjectSelector = ProjectActorContext.useSelector;
