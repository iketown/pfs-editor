import { createMachine, assign } from 'xstate';
import { ChartJSOrUndefined } from 'react-chartjs-2/dist/types';
import type { ROI } from '@/types/roi-types';
import { roiActions } from './roiMachineActions';
import { db } from '@/lib/db';

export type RoiContext = {
    playerRef: React.RefObject<HTMLVideoElement> | null;
    chartRef: React.RefObject<ChartJSOrUndefined<'line', { x: number; y: number }[], unknown>> | null;
    selectedROIid: string | null; // the currently selected ROI (for editing)
    activeROIid: string | null; // the currently active ROI at this time
    rois: { [roi_id: string]: ROI };
    videoFps: number | null;
    projectId: string | null; // Add project ID for saving ROIs
};

export type RoiEvent =
    | { type: 'SET_PLAYER_REF'; playerRef: React.RefObject<HTMLVideoElement> }
    | { type: 'SET_CHART_REF'; chartRef: React.RefObject<ChartJSOrUndefined<'line', { x: number; y: number }[], unknown>> }
    | { type: 'SET_ACTIVE_ROI'; roiId: string | null }
    | { type: 'SELECT_ROI'; roiId: string | null }
    | { type: 'ADD_ROI'; roi: ROI }
    | { type: 'UPDATE_ROI'; roi: ROI }
    | { type: 'UPDATE_ROI_AND_SAVE'; roi: ROI }
    | { type: 'REMOVE_ROI'; roiId: string }
    | { type: 'VIDEO_TIME_UPDATE'; time: number }
    | { type: 'SET_VIDEO_FPS'; fps: number }
    | { type: 'SET_PROJECT_ID'; projectId: string }
    | { type: 'LOAD_ROIS'; rois: { [roi_id: string]: ROI } }
    | { type: 'TOGGLE_ROI_ZOOM'; roiId?: string } // Toggle zoom for specific ROI or active ROI
    | { type: 'SET_ROI_ZOOM'; roiId: string; zoomed: boolean }; // Set zoom state for specific ROI

const initialROI: ROI = { x: 0, y: 0, w: 100, h: 100, id: 'default', timeStart: 0 };


export const roiMachine = createMachine({
    id: 'roi',
    initial: 'idle',
    context: {
        playerRef: null,
        chartRef: null,
        activeROIid: null,
        selectedROIid: null,
        rois: {
            [initialROI.id]: initialROI,

        },
        videoFps: null,
        projectId: null // Add projectId to initial context
    },
    on: {
        VIDEO_TIME_UPDATE: {
            actions: ['updateActiveROI']
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
        SET_PROJECT_ID: {
            actions: assign({
                projectId: ({ event }) => event.projectId
            })
        },
        LOAD_ROIS: {
            actions: assign({
                rois: ({ event }) => event.rois
            })
        }
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
                        SET_ACTIVE_ROI: {
                            actions: assign({
                                activeROIid: (_args: any, event: any) => event?.roiId ?? null
                            })
                        },
                        SELECT_ROI: {
                            actions: ['selectRoi', 'setActvieROItoSelectedROI']
                        },
                        ADD_ROI: { actions: ['addRoi', 'saveRois'] }, // Add saveRois action
                        UPDATE_ROI: {
                            actions: ['updateRoi']
                        },
                        UPDATE_ROI_AND_SAVE: {
                            actions: ['updateRoi', 'saveRois']
                        },
                        REMOVE_ROI: {
                            actions: [
                                'removeRoi',
                                'saveRois' // Add saveRois action after removing ROI
                            ]
                        },
                        TOGGLE_ROI_ZOOM: {
                            actions: ['toggleRoiZoom', 'saveRois']
                        },
                        SET_ROI_ZOOM: {
                            actions: ['setRoiZoom', 'saveRois']
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
        ...roiActions
    } as any
});
