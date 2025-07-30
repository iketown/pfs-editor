import { createMachine, assign } from 'xstate';
import { ChartJSOrUndefined } from 'react-chartjs-2/dist/types';
import type { ROI } from '@/types/roi-types';
import { motionActions } from './motionMachineActions';

export type MotionContext = {
    playerRef: React.RefObject<HTMLVideoElement> | null;
    chartRef: React.RefObject<ChartJSOrUndefined<'line', { x: number; y: number }[], unknown>> | null;
    selectedROIid: string | null; // the currently selected ROI (for editing)
    activeROIs: string[]; // at this time of video, which ROIs are active (not necessarily selected)
    rois: { [roi_id: string]: ROI };
    videoFps: number | null;
};

export type MotionEvent =
    | { type: 'SET_PLAYER_REF'; playerRef: React.RefObject<HTMLVideoElement> }
    | { type: 'SET_CHART_REF'; chartRef: React.RefObject<ChartJSOrUndefined<'line', { x: number; y: number }[], unknown>> }
    | { type: 'SET_CURRENT_ROI'; roi: ROI }
    | { type: 'SELECT_ROI'; roiId: string }
    | { type: 'ADD_ROI'; roi: ROI }
    | { type: 'UPDATE_ROI'; roi: ROI }
    | { type: 'REMOVE_ROI'; roiId: string }
    | { type: 'VIDEO_TIME_UPDATE'; time: number }
    | { type: 'SET_VIDEO_FPS'; fps: number }

const initialROI: ROI = { x: 0, y: 0, w: 100, h: 100, id: 'default', timeStart: 0, timeEnd: 5000 };
const test5s = { ...initialROI, id: 'test5s', timeStart: 5000, timeEnd: 10000 }
const test10s = { ...initialROI, id: 'test10s', timeStart: 10000, timeEnd: 15000 }

export const motionMachine = createMachine({
    id: 'motion',
    initial: 'idle',
    context: {
        playerRef: null,
        chartRef: null,
        activeROIs: [] as string[],
        selectedROIid: null,
        rois: {
            [initialROI.id]: initialROI,
            [test5s.id]: test5s,
            [test10s.id]: test10s
        },
        videoFps: null
    },
    on: {
        VIDEO_TIME_UPDATE: {
            actions: ['updateActiveROIs']
        },
        SET_VIDEO_FPS: {
            actions: assign({
                videoFps: ({ event }) => event.fps
            })
        },
        SET_PLAYER_REF: {
            actions: assign({
                playerRef: ({ event }) => event?.playerRef ?? null
            })
        },
        SET_CHART_REF: {
            actions: assign(({ event }) => {
                return {
                    chartRef: event?.chartRef ?? null
                }
            })
        },
    },
    states: {
        ready: {
            initial: 'editingROI',
            states: {
                playing: {
                    on: {

                    }
                },
                editingROI: {
                    on: {
                        SET_CURRENT_ROI: {
                            actions: assign({
                                selectedROIid: (_args: any, event: any) => event?.roi?.id ?? null
                            })
                        },
                        SELECT_ROI: {
                            actions: assign({
                                selectedROIid: (_args: any, event: any) => event?.roiId ?? null
                            })
                        },
                        ADD_ROI: {
                            actions: assign({
                                rois: ({ context }, event: any) => ({
                                    ...context.rois,
                                    [event?.roi?.id]: event?.roi
                                })
                            })
                        },
                        UPDATE_ROI: {
                            actions: ['updateRoi']
                        },
                        REMOVE_ROI: {
                            actions: assign({
                                rois: ({ context }, event: any) => {
                                    const { [event?.roiId]: removed, ...remaining } = context.rois;
                                    return remaining;
                                },
                                selectedROIid: ({ context }, event: any) =>
                                    context.selectedROIid === event?.roiId ? null : context.selectedROIid
                            })
                        },
                    }
                },
            }
        },
        idle: {
            always: {
                target: 'ready',
                guard: ({ context }) => !!context.playerRef
            }
        },
    }
}, {
    actions: {
        ...motionActions
    } as any
});
