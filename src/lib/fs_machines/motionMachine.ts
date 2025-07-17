import { createMachine, assign } from 'xstate';
import { ChartJSOrUndefined } from 'react-chartjs-2/dist/types';
import type { ROI } from '@/components/fs_components/VideoROIWrapper';

export type MotionContext = {
    playerRef: React.RefObject<HTMLVideoElement> | null;
    chartRef: React.RefObject<ChartJSOrUndefined<'line', { x: number; y: number }[], unknown>> | null;
    currentROI: ROI;
    selectedROIid: string | null;
    rois: ROI[];
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

const initialROI: ROI = { x: 0, y: 0, width: 100, height: 100, id: 'default', timeStart: 0 };
const test5s = { ...initialROI, id: 'test5s', timeStart: 5000 }
const test10s = { ...initialROI, id: 'test10s', timeStart: 10000 }

export const motionMachine = createMachine({
    id: 'motion',
    initial: 'idle',
    context: {
        playerRef: null,
        chartRef: null,
        currentROI: initialROI,
        selectedROIid: null,
        rois: [initialROI, test5s, test10s]
    },
    on: {
        VIDEO_TIME_UPDATE: {
            actions: assign({
                currentROI: ({ context, event }) => {
                    const { rois, currentROI } = context;
                    const currentTime = event.time;
                    const sorted = rois
                        .filter((roi) => roi.timeStart <= currentTime)
                        .sort((a, b) => b.timeStart - a.timeStart);
                    const newROI = sorted[0] || currentROI;
                    // Only update if different
                    if (currentROI && newROI && currentROI.id === newROI.id) {
                        console.log('currentROI same', newROI);
                        return currentROI;
                    } else {
                        console.log('newROI different', newROI);
                    }
                    return newROI;
                }
            })
        },
    },
    states: {
        ready: {
            initial: 'playing',
            states: {
                playing: {
                    on: {
                        SET_CURRENT_ROI: {
                            actions: assign({
                                currentROI: (_args, event: any) => event?.roi ?? initialROI
                            })
                        },
                        SELECT_ROI: {
                            actions: assign({
                                selectedROIid: (_args, event: any) => event?.roiId ?? null
                            })
                        },
                        ADD_ROI: {
                            actions: assign({
                                rois: ({ context }, event: any) => [...context.rois, event?.roi]
                            })
                        },
                        UPDATE_ROI: {
                            actions: assign({
                                rois: ({ context }, event: any) => context.rois.map((roi: ROI) =>
                                    roi.id === event?.roi?.id ? event.roi : roi
                                ),
                                currentROI: ({ context }, event: any) =>
                                    context.currentROI.id === event?.roi?.id ? event.roi : context.currentROI
                            })
                        },
                        REMOVE_ROI: {
                            actions: assign({
                                rois: ({ context }, event: any) => context.rois.filter((roi: ROI) => roi.id !== event?.roiId),
                                currentROI: ({ context }, event: any) =>
                                    context.currentROI.id === event?.roiId ? initialROI : context.currentROI,
                                selectedROIid: ({ context }, event: any) =>
                                    context.selectedROIid === event?.roiId ? null : context.selectedROIid
                            })
                        },
                    }
                },
                editingROI: {},
            }
        },
        idle: {
            always: [{ target: 'ready', guard: ({ context }) => Boolean(context.playerRef && context.chartRef) }],
            on: {
                SET_PLAYER_REF: {
                    actions: assign({
                        playerRef: ({ event }) => event?.playerRef ?? null
                    })
                },
                SET_CHART_REF: {
                    actions: assign(({ event }) => {
                        console.log('SET_CHART_REF', event);
                        return {
                            chartRef: event?.chartRef ?? null
                        }
                    })
                },
            }
        }

    }
});
