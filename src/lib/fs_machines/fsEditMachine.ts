import { createMachine } from 'xstate';
import { fsEditActions } from './fsEditActions';
import type { FunscriptObject } from '@/types/funscript';
import { ChartJSOrUndefined } from 'react-chartjs-2/dist/types';

export type FSEditContext = {
    videoUrl: string | null;
    videoFile: File | null;
    funscript: FunscriptObject | null;
    videoTime: number;
    selectedActionIds: string[];
    currentNodeIdx: number;
    playerRef: React.RefObject<HTMLVideoElement> | null;
    chartRef: React.RefObject<ChartJSOrUndefined<'line', { x: number; y: number }[], unknown>> | null;
};

export type FSEditEvent =
    | { type: 'LOAD_VIDEO'; url: string; file: File }
    | { type: 'SET_PLAYER_REF'; playerRef: React.RefObject<HTMLVideoElement> }
    | { type: 'SET_CHART_REF'; chartRef: React.RefObject<ChartJSOrUndefined<'line', { x: number; y: number }[], unknown>> }
    | { type: 'SEEK_VIDEO'; time: number }
    | { type: 'LOAD_FUNSCRIPT'; funscript: FunscriptObject }
    | { type: 'TEST_ACTION' }
    | { type: 'SELECT_NODE'; actionId: string }
    | { type: 'SET_NODE_IDX'; nodeIdx: number }
    | { type: 'TOGGLE_SELECTED_NODE'; actionId: string }
    | { type: 'CLEAR_SELECTED_NODES' };

export const fsEditMachine = createMachine({
    id: 'fsEdit',
    initial: 'loading',
    context: {
        videoUrl: null,
        videoFile: null,
        funscript: null,
        videoTime: 0,
        selectedActionIds: [],
        currentNodeIdx: 0,
        playerRef: null,
        chartRef: null
    },
    on: {
        LOAD_FUNSCRIPT: {
            actions: 'loadFunScript'
        },
        SET_PLAYER_REF: {
            actions: 'setPlayerRef'
        },
        SET_CHART_REF: {
            actions: 'setChartRef'
        }
    },
    states: {
        loading: {
            always: [{ target: 'editing', guard: ({ context }: any) => Boolean(context.videoUrl && context.funscript) }],
            on: {
                LOAD_VIDEO: {
                    actions: 'loadVideo'
                },
                LOAD_FUNSCRIPT: {
                    actions: 'loadFunScript'
                }
            }
        },
        editing: {
            on: {

                SELECT_NODE: {
                    actions: 'selectNode'
                },
                SET_NODE_IDX: {
                    actions: 'setNodeIdx'
                },
                TOGGLE_SELECTED_NODE: {
                    actions: 'toggleSelectedNode'
                },
                CLEAR_SELECTED_NODES: {
                    actions: 'clearSelectedNodes'
                },
                SEEK_VIDEO: {
                    actions: 'seekVideo'
                }
            },
            initial: 'playing',
            states: {
                playing: {},
                editingROI: {}
            }
        }
    }
},
    {
        actions: {
            ...fsEditActions
        } as any
    }
);
