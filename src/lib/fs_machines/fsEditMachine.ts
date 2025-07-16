import { createMachine } from 'xstate';
import { fsEditActions } from './fsEditActions';
import type { FunscriptObject } from '@/types/funscript';

export type FSEditContext = {
    videoUrl: string | null;
    videoFile: File | null;
    funscript: FunscriptObject | null;
};

export type FSEditEvent =
    | { type: 'LOAD_VIDEO'; url: string; file: File }
    | { type: 'LOAD_FUNSCRIPT'; funscript: FunscriptObject }
    | { type: 'REPLACE_VIDEO'; url: string; file: File }
    | { type: 'REPLACE_FUNSCRIPT'; funscript: FunscriptObject }
    | { type: 'TEST_ACTION' };

export const fsEditMachine = createMachine(
    {
        id: 'fsEdit',
        initial: 'loading',
        context: {
            videoUrl: null,
            videoFile: null,
            funscript: null
        },
        states: {
            loading: {
                always: [{ target: 'editing', guard: ({ context }) => Boolean(context.videoUrl && context.funscript) }],
                on: {

                    LOAD_VIDEO: {
                        actions: 'loadVideo'
                    },
                    LOAD_FUNSCRIPT: {
                        actions: 'loadFunScript'
                    },
                    REPLACE_VIDEO: {
                        actions: 'replaceVideo'
                    },
                    REPLACE_FUNSCRIPT: {
                        actions: 'replaceFunScript'
                    }
                }
            },
            init: {
                on: {

                    LOAD_VIDEO: {
                        target: 'loading',
                        actions: 'loadVideo'
                    },
                    LOAD_FUNSCRIPT: {
                        target: 'loading',
                        actions: 'loadFunScript'
                    }
                }
            },
            editing: {
                on: {
                    REPLACE_VIDEO: {
                        target: 'loading',
                        actions: 'replaceVideo'
                    },
                    REPLACE_FUNSCRIPT: {
                        target: 'loading',
                        actions: 'replaceFunScript'
                    }
                }
            }
        }
    },
    {
        actions: fsEditActions
    }
);
