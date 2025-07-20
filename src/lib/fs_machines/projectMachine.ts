import { createMachine, assign, and } from 'xstate';
import type { Project } from '@/lib/db/types';
import { projectMachineActions } from './projectMachineActions';
// Context for the project machine
export interface ProjectContext {
    currentProject: Project | null;
    videoBlobUrl: string | null;
    error: string | null;
    isLoading: boolean;
}

// Events for the project machine
export type ProjectEvent =
    | { type: 'SELECT_PROJECT'; project: Project }
    | { type: 'CREATE_PROJECT'; project: Project }
    | { type: 'SELECT_VIDEO'; videoFile: File; blobUrl: string }
    | { type: 'SELECT_FUNSCRIPT'; funscriptData: any }
    | { type: 'SAVE_PROJECT' }
    | { type: 'CLEAR_ERROR' }
    | { type: 'SET_ERROR'; error: string }
    | { type: 'CLEAR_LOADING' }
    | { type: 'RESET' }
    | { type: 'CANCEL' }

// Create the project machine
export const projectMachine = createMachine({
    id: 'project',
    initial: 'selectProject',
    context: {
        currentProject: null,
        videoBlobUrl: null,
        error: null,
        isLoading: false
    } as ProjectContext,
    types: {} as {
        context: ProjectContext;
        events: ProjectEvent;
    },
    states: {
        selectProject: {
            description: 'User needs to select or create a project',
            on: {
                SELECT_PROJECT: {
                    target: 'checkProject',
                    actions: assign({
                        currentProject: ({ event }) => event.project,
                        error: null
                    })
                },
                CREATE_PROJECT: {
                    target: 'checkProject',
                    actions: assign({
                        currentProject: ({ event }) => event.project,
                        error: null
                    })
                }
            }
        },
        checkProject: {
            description: 'Check what the project needs to be ready',
            always: [
                {
                    guard: and(['hasVideo', 'hasFunscript']),
                    target: 'ready'
                },
                {
                    guard: 'hasVideo',
                    target: 'selectFunscript'
                },
                {
                    guard: 'hasFunscript',
                    target: 'selectVideo'
                },
                {
                    target: 'selectVideo'
                }
            ]
        },
        selectVideo: {
            description: 'User needs to select a video file',
            on: {
                SELECT_VIDEO: {
                    target: 'checkProject',
                    actions: 'selectVideo'
                },
                CANCEL: {
                    target: 'checkProject'
                }
            }
        },
        selectFunscript: {
            description: 'User needs to select or create a funscript',
            on: {
                SELECT_FUNSCRIPT: {
                    target: 'checkProject',
                    actions: 'selectFunscript'
                },
                CANCEL: {
                    target: 'checkProject'
                }
            }
        },
        ready: {
            description: 'Project is ready for editing',
            entry: 'saveProject',
            on: {
                SAVE_PROJECT: {
                    target: 'ready',
                    actions: assign({
                        isLoading: true,
                        error: null
                    })
                },
                SELECT_FUNSCRIPT: {
                    target: 'checkProject',
                    actions: 'selectFunscript'
                },
                SELECT_VIDEO: {
                    target: 'checkProject',
                    actions: 'selectVideo'
                }
            }
        }
    },
    on: {
        CLEAR_ERROR: {
            actions: assign({
                error: null
            })
        },
        SET_ERROR: {
            actions: assign({
                error: ({ event }) => event.error
            })
        },
        CLEAR_LOADING: {
            actions: assign({
                isLoading: false
            })
        },
        RESET: {
            target: '.selectProject',
            actions: assign({
                currentProject: null,
                videoBlobUrl: null,
                error: null,
                isLoading: false
            })
        }
    }
}, {
    actions: projectMachineActions,
    guards: {
        hasVideo: ({ context }) => !!context.currentProject && !!context.currentProject.videoFile,
        hasFunscript: ({ context }) => !!context.currentProject && !!context.currentProject.funscriptData,
        hasProject: ({ context }) => !!context.currentProject,

    }
}); 