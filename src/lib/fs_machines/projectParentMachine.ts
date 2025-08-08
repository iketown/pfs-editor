import { createMachine, assign, sendParent, sendTo } from 'xstate';
import { ChartJSOrUndefined } from 'react-chartjs-2/dist/types';
import { fsEditMachine } from './fsEditMachine';
import { roiMachine } from './roiMachine';
import { loaderMachine } from './loaderMachine';
import { chapterMachine } from './chapterMachine';
import type { FunscriptObject } from '@/types/funscript-types';
import type { ROI } from '@/types/roi-types';

// Context for the project parent machine
export interface ProjectParentContext {
    // Shared resources
    playerRef: React.RefObject<HTMLVideoElement> | null;
    chartRef: React.RefObject<ChartJSOrUndefined<'line', { x: number; y: number }[], unknown>> | null;
    currentTime: number;
    videoDuration: number;
    videoFps: number | null;
    projectId: string | null;
    rangeStart: number;
    rangeEnd: number;
    // Child actors
    loaderActor: any;
    fsEditActor: any;
    roiActor: any;
    chapterActor: any; // Future: chapterMachine
    motionActor: any; // Future: motionMachine
    fsActionActor: any; // Future: fsActionMachine
}

// Events for the project parent machine
export type ProjectParentEvent =
    // Shared resource events
    | { type: 'SET_PLAYER_REF'; playerRef: React.RefObject<HTMLVideoElement> }
    | { type: 'SET_CHART_REF'; chartRef: React.RefObject<ChartJSOrUndefined<'line', { x: number; y: number }[], unknown>> }
    | { type: 'VIDEO_TIME_UPDATE'; time: number }
    | { type: 'VIDEO_SEEK'; time: number }
    | { type: 'SET_VIDEO_DURATION'; duration: number }
    | { type: 'SET_VIDEO_FPS'; fps: number }
    | { type: 'SET_PROJECT_ID'; projectId: string }
    | { type: 'SET_VIDEO_RANGE'; rangeStart: number; rangeEnd: number }
    // Mode switching events
    | { type: 'SWITCH_TO_PLAYING' }
    | { type: 'SWITCH_TO_CHAPTERS_EDITING' }
    | { type: 'SWITCH_TO_ROI_EDITING' }
    | { type: 'SWITCH_TO_MOTION_EDITING' }
    | { type: 'SWITCH_TO_FSACTION_EDITING' }

    // Project management events
    | { type: 'LOAD_PROJECT'; projectId: string }
    | { type: 'SAVE_PROJECT' }
    | { type: 'RESET_PROJECT' }

    // Forwarded events to child machines
    | { type: 'FORWARD_TO_LOADER'; event: any }
    | { type: 'FORWARD_TO_FSEDIT'; event: any }
    | { type: 'FORWARD_TO_ROI'; event: any }
    | { type: 'FORWARD_TO_CHAPTER'; event: any }
    | { type: 'FORWARD_TO_MOTION'; event: any }
    | { type: 'FORWARD_TO_FSACTION'; event: any };

// Create the project parent machine
export const projectParentMachine = createMachine({
    id: 'projectParent',
    initial: 'idle',
    context: {
        playerRef: null,
        chartRef: null,
        currentTime: 0,
        videoDuration: 0,
        rangeStart: 0,
        rangeEnd: 0,
        videoFps: null,
        projectId: null,
        loaderActor: null,
        fsEditActor: null,
        roiActor: null,
        chapterActor: null,
        motionActor: null,
        fsActionActor: null,
    } as ProjectParentContext,

    types: {} as {
        context: ProjectParentContext;
        events: ProjectParentEvent;
    },

    on: {
        // Shared resource events
        SET_PLAYER_REF: {
            actions: [
                assign({
                    playerRef: ({ event }) => event.playerRef
                }),
                // Forward to existing child actors only
                sendTo(({ context }) => context.fsEditActor, ({ event }) => event),
                sendTo(({ context }) => context.roiActor, ({ event }) => event),
                // sendTo(({ context }) => context.chapterActor, ({ event }) => event), // Not spawned yet
                // sendTo(({ context }) => context.motionActor, ({ event }) => event),  // Not spawned yet
                // sendTo(({ context }) => context.fsActionActor, ({ event }) => event), // Not spawned yet
            ]
        },

        SET_CHART_REF: {
            actions: [
                assign({
                    chartRef: ({ event }) => event.chartRef
                }),
                // Forward to relevant child actors
                sendTo(({ context }) => context.fsEditActor, ({ event }) => event),
                sendTo(({ context }) => context.roiActor, ({ event }) => event),
                sendTo(({ context }) => context.chapterActor, ({ event }) => event),
                sendTo(({ context }) => context.fsActionActor, ({ event }) => event),
            ]
        },

        VIDEO_TIME_UPDATE: {
            actions: [
                assign({
                    currentTime: ({ event }) => {
                        return event.time;
                    }
                }),
                // Forward to existing child actors only
                // sendTo(({ context }) => context.fsEditActor, ({ event }) => event),
                // sendTo(({ context }) => context.roiActor, ({ event }) => event),
                // sendTo(({ context }) => context.chapterActor, ({ event }) => event),
                // sendTo(({ context }) => context.motionActor, ({ event }) => event),  // Not spawned yet
                // sendTo(({ context }) => context.fsActionActor, ({ event }) => event), // Not spawned yet
            ]
        },

        VIDEO_SEEK: {
            actions: [
                assign(({ context, event }) => {
                    const { playerRef } = context;
                    console.log('VIDEO_SEEK', event, playerRef?.current);
                    if (playerRef) {
                        playerRef.current.currentTime = event.time;
                    }
                    return { currentTime: event.time };
                }),
            ]
        },

        SET_VIDEO_DURATION: {
            actions: [
                assign({
                    videoDuration: ({ event }) => event.duration,
                    rangeStart: ({ event }) => 0,
                    rangeEnd: ({ event }) => event.duration
                }),
                sendTo(({ context }) => context.fsEditActor, ({ event }) => event),
                sendTo(({ context }) => context.chapterActor, ({ event }) => event),
                // sendTo(({ context }) => context.fsActionActor, ({ event }) => event), // Not spawned yet
            ]
        },

        SET_VIDEO_RANGE: {
            actions: [
                assign({
                    rangeStart: ({ event }) => event.rangeStart,
                    rangeEnd: ({ event }) => event.rangeEnd
                }),
            ]
        },

        SET_VIDEO_FPS: {
            actions: [
                assign({
                    videoFps: ({ event }) => event.fps
                }),
                sendTo(({ context }) => context.fsEditActor, ({ event }) => event),
                sendTo(({ context }) => context.roiActor, ({ event }) => event),
                // sendTo(({ context }) => context.motionActor, ({ event }) => event), // Not spawned yet
            ]
        },

        SET_PROJECT_ID: {
            actions: [
                assign({
                    projectId: ({ event }) => {
                        return event.projectId;
                    }
                }),
                sendTo(({ context }) => context.fsEditActor, ({ event }) => event),
                sendTo(({ context }) => context.roiActor, ({ event }) => event),
                sendTo(({ context }) => context.chapterActor, ({ event }) => event),
                // sendTo(({ context }) => context.motionActor, ({ event }) => event),
                // sendTo(({ context }) => context.fsActionActor, ({ event }) => event),
            ]
        },

        // Forwarded events
        FORWARD_TO_LOADER: {
            actions: sendTo(({ context }) => context.loaderActor, ({ event }) => event.event)
        },

        FORWARD_TO_FSEDIT: {
            actions: sendTo(({ context }) => context.fsEditActor, ({ event }) => event.event)
        },

        FORWARD_TO_ROI: {
            actions: sendTo(({ context }) => context.roiActor, ({ event }) => event.event)
        },

        FORWARD_TO_CHAPTER: {
            actions: sendTo(({ context }) => context.chapterActor, ({ event }) => event.event)
        },

        FORWARD_TO_MOTION: {
            actions: sendTo(({ context }) => context.motionActor, ({ event }) => event.event)
        },

        FORWARD_TO_FSACTION: {
            actions: sendTo(({ context }) => context.fsActionActor, ({ event }) => event.event)
        },
    },

    states: {
        idle: {
            description: 'Initial state, waiting for project to load',
            entry: [
                assign({
                    loaderActor: ({ spawn }) => spawn(loaderMachine, { id: 'loader' }),
                    fsEditActor: ({ spawn }) => spawn(fsEditMachine, { id: 'fsEdit' }),
                    roiActor: ({ spawn }) => spawn(roiMachine, { id: 'roi' }),
                    chapterActor: ({ spawn }) => spawn(chapterMachine, { id: 'chapter' }),
                    // Future: spawn other machines when they're created
                    // motionActor: ({ spawn }) => spawn(motionMachine, { id: 'motion' }),
                    // fsActionActor: ({ spawn }) => spawn(fsActionMachine, { id: 'fsAction' }),
                })
            ],
            always: [
                {
                    guard: ({ context }) => context.playerRef !== null && context.projectId !== null,
                    target: 'ready'
                }
            ]
        },

        ready: {
            description: 'Project is ready, can switch between editing modes',
            initial: 'playing',
            states: {
                playing: {
                    description: 'Video playback mode (no editing)',
                    on: {
                        SWITCH_TO_CHAPTERS_EDITING: 'chapters_editing',
                        SWITCH_TO_ROI_EDITING: 'roi_editing',
                        SWITCH_TO_MOTION_EDITING: 'motion_editing',
                        SWITCH_TO_FSACTION_EDITING: 'fsaction_editing',
                    }
                },

                chapters_editing: {
                    description: 'Chapter editing mode',
                    on: {
                        SWITCH_TO_PLAYING: 'playing',
                        SWITCH_TO_ROI_EDITING: 'roi_editing',
                        SWITCH_TO_MOTION_EDITING: 'motion_editing',
                        SWITCH_TO_FSACTION_EDITING: 'fsaction_editing',
                    }
                },

                roi_editing: {
                    description: 'ROI editing mode',
                    on: {
                        SWITCH_TO_PLAYING: 'playing',
                        SWITCH_TO_CHAPTERS_EDITING: 'chapters_editing',
                        SWITCH_TO_MOTION_EDITING: 'motion_editing',
                        SWITCH_TO_FSACTION_EDITING: 'fsaction_editing',
                    }
                },

                motion_editing: {
                    description: 'Motion capture mode',
                    on: {
                        SWITCH_TO_PLAYING: 'playing',
                        SWITCH_TO_CHAPTERS_EDITING: 'chapters_editing',
                        SWITCH_TO_ROI_EDITING: 'roi_editing',
                        SWITCH_TO_FSACTION_EDITING: 'fsaction_editing',
                    }
                },

                fsaction_editing: {
                    description: 'Funscript action editing mode',
                    on: {
                        SWITCH_TO_PLAYING: 'playing',
                        SWITCH_TO_CHAPTERS_EDITING: 'chapters_editing',
                        SWITCH_TO_ROI_EDITING: 'roi_editing',
                        SWITCH_TO_MOTION_EDITING: 'motion_editing',
                    }
                }
            }
        },

        error: {
            description: 'Error state',
            on: {
                RESET_PROJECT: 'idle'
            }
        }
    }
}, {
    actions: {
        // Custom actions can be added here
    },

    guards: {
        // Custom guards can be added here
    }
}); 