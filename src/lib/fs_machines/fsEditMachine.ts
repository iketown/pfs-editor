import { createMachine } from 'xstate';
import { fsEditActions } from './fsEditActions';
import type { FunscriptObject } from '@/types/funscript-types';
import { ChartJSOrUndefined } from 'react-chartjs-2/dist/types';
import invariant from 'tiny-invariant';

export type FSEditContext = {
    videoUrl: string | null;
    videoFile: File | null;
    videoPrompt: string | null;
    rangeStart: number;
    rangeEnd: number;
    funscript: FunscriptObject | null;
    fsChapters: { [chapter_id: string]: { startTime: number; endTime: number; title: string; color: string; } };
    selectedChapterId: string | null;
    videoTime: number;
    videoDuration: number;
    selectedActionIds: string[];
    currentNodeIdx: number;
    playerRef: React.RefObject<HTMLVideoElement> | null;
    chartRef: React.RefObject<ChartJSOrUndefined<'line', { x: number; y: number }[], unknown>> | null;
    videoFps: number | null;
    loopStart: number | null;
    loopEnd: number | null;
};

export type FSEditEvent =
    | { type: 'LOAD_VIDEO'; url: string; file: File }
    | { type: 'SET_VIDEO_URL'; url: string | null }
    | { type: 'SET_VIDEO_PROMPT'; prompt: string | null }
    | { type: 'RESTORE_VIDEO_FILE'; projectId: string }
    | { type: 'SELECT_VIDEO_FILE' }
    | { type: 'SET_PLAYER_REF'; playerRef: React.RefObject<HTMLVideoElement> }
    | { type: 'SET_CHART_REF'; chartRef: React.RefObject<ChartJSOrUndefined<'line', { x: number; y: number }[], unknown>> }
    | { type: 'SEEK_VIDEO'; time: number }
    | { type: 'LOAD_FUNSCRIPT'; funscript: FunscriptObject }
    | { type: 'UPDATE_CHAPTER'; chapterId: string; startTime?: number; endTime?: number; title?: string }
    | { type: 'SELECT_CHAPTER'; chapterId: string | null }
    | { type: 'TEST_ACTION' }
    | { type: 'SELECT_NODE'; actionId: string }
    | { type: 'SET_NODE_IDX'; nodeIdx: number }
    | { type: 'TOGGLE_SELECTED_NODE'; actionId: string }
    | { type: 'CLEAR_SELECTED_NODES' }
    | { type: 'SET_VIDEO_FPS'; fps: number }
    | { type: 'SET_VIDEO_DURATION'; duration: number }
    | { type: 'SET_LOOP_POINTS'; start: number; end: number }
    | { type: 'SET_RANGE_START'; start: number }
    | { type: 'SET_RANGE_END'; end: number }
    | { type: 'RESET_RANGE' }
    | { type: 'SWITCH_TO_FUNSCRIPT_EDITING' }
    | { type: 'SWITCH_TO_CHAPTERS_EDITING' }
    | { type: 'SWITCH_TO_ZOOM_EDITING' }
    | { type: 'SWITCH_TO_ROI_EDITING' }
    | { type: 'SWITCH_TO_MOTION_EDITING' }
    | { type: 'SWITCH_TO_PLAYING' };

export const fsEditMachine = createMachine({
    id: 'fsEdit',
    initial: 'loading',
    context: {
        videoUrl: null,
        videoFile: null,
        videoPrompt: null,
        rangeStart: 0,
        rangeEnd: 0,
        funscript: null,
        fsChapters: {},
        videoTime: 0,
        videoDuration: 0,
        selectedActionIds: [],
        selectedChapterId: null,
        currentNodeIdx: 0,
        playerRef: null,
        chartRef: null,
        videoFps: null,
        loopStart: null,
        loopEnd: null
    },
    on: {
        LOAD_FUNSCRIPT: {
            actions: 'loadFunScript'
        },
        UPDATE_CHAPTER: {
            actions: 'updateChapter'
        },
        SELECT_CHAPTER: {
            actions: 'selectChapter'
        },
        SET_VIDEO_URL: {
            actions: 'setVideoUrl'
        },
        SET_VIDEO_PROMPT: {
            actions: 'setVideoPrompt'
        },
        RESTORE_VIDEO_FILE: {
            actions: 'restoreVideoFile'
        },
        SELECT_VIDEO_FILE: {
            actions: 'selectVideoFile'
        },
        SET_PLAYER_REF: {
            actions: 'setPlayerRef'
        },
        SET_CHART_REF: {
            actions: 'setChartRef'
        },
        SET_VIDEO_FPS: {
            actions: 'setVideoFps'
        },
        SET_VIDEO_DURATION: {
            actions: 'setVideoDuration'
        },
        SET_LOOP_POINTS: {
            actions: 'setLoopPoints'
        },
        SET_RANGE_START: {
            actions: 'setRangeStart'
        },
        SET_RANGE_END: {
            actions: 'setRangeEnd'
        },
        RESET_RANGE: {
            actions: 'resetRange'
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
                },
                SWITCH_TO_FUNSCRIPT_EDITING: {
                    target: '.funscript_editing'
                },
                SWITCH_TO_CHAPTERS_EDITING: {
                    target: '.chapters_editing'
                },
                SWITCH_TO_ZOOM_EDITING: {
                    target: '.zoom_editing'
                },
                SWITCH_TO_ROI_EDITING: {
                    target: '.roi_editing'
                },
                SWITCH_TO_MOTION_EDITING: {
                    target: '.motion_editing'
                },
                SWITCH_TO_PLAYING: {
                    target: '.playing'
                }
            },
            initial: 'playing',
            states: {
                playing: {},
                funscript_editing: {},
                chapters_editing: {},
                zoom_editing: {},
                roi_editing: {},
                motion_editing: {}
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
