import { createActorContext } from '@xstate/react';
import { loaderMachine } from '@/lib/fs_machines/loaderMachine';

export const LoaderActorContext = createActorContext(loaderMachine);
export const useLoaderActorRef = LoaderActorContext.useActorRef;
export const useLoaderSelector = LoaderActorContext.useSelector;
