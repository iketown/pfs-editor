import { createMachine } from 'xstate';
import { chapterActions } from './chapterActions';
import type { FunscriptObject } from '@/types/funscript-types';
import { ChartJSOrUndefined } from 'react-chartjs-2/dist/types';
import invariant from 'tiny-invariant';

export type ChapterContext = {
    // Chapter data
    fsChapters: { [chapter_id: string]: { startTime: number; endTime: number; title: string; color: string; id: string; } };
    selectedChapterId: string | null;

    // Video state
    videoTime: number;
    videoDuration: number;

    // References
    playerRef: React.RefObject<HTMLVideoElement> | null;
    chartRef: React.RefObject<ChartJSOrUndefined<'line', { x: number; y: number }[], unknown>> | null;

    // Project state
    projectId: string | null;
};

export type ChapterEvent =
    // Chapter management events
    | { type: 'LOAD_FS_CHAPTERS'; fsChapters: { [chapter_id: string]: { startTime: number; endTime: number; title: string; color: string; id: string; } } }
    | { type: 'IMPORT_FS_CHAPTERS'; funscriptData: FunscriptObject }
    | { type: 'UPDATE_CHAPTER'; chapterId: string; startTime?: number; endTime?: number; title?: string }
    | { type: 'UPDATE_CHAPTER_AND_SAVE'; chapterId: string; startTime?: number; endTime?: number; title?: string }
    | { type: 'SELECT_CHAPTER'; chapterId: string | null }
    | { type: 'SAVE_PROJECT' }

    // Video state events
    | { type: 'VIDEO_TIME_UPDATE'; time: number }
    | { type: 'SEEK_VIDEO'; time: number }
    | { type: 'SET_VIDEO_DURATION'; duration: number }

    // Reference events
    | { type: 'SET_PLAYER_REF'; playerRef: React.RefObject<HTMLVideoElement> }
    | { type: 'SET_CHART_REF'; chartRef: React.RefObject<ChartJSOrUndefined<'line', { x: number; y: number }[], unknown>> }

    // Project events
    | { type: 'SET_PROJECT_ID'; projectId: string };

export const chapterMachine = createMachine({
    id: 'chapter',
    initial: 'idle',
    context: {
        fsChapters: {},
        selectedChapterId: null,
        videoTime: 0,
        videoDuration: 0,
        playerRef: null,
        chartRef: null,
        projectId: null
    },
    on: {
        LOAD_FS_CHAPTERS: {
            actions: 'loadFsChapters'
        },
        IMPORT_FS_CHAPTERS: {
            actions: ['importFsChapters', 'saveProject']
        },
        UPDATE_CHAPTER: {
            actions: ['updateChapter']
        },
        UPDATE_CHAPTER_AND_SAVE: {
            actions: ['updateChapter', 'saveProject']
        },
        SELECT_CHAPTER: {
            actions: ['selectChapter', 'seekToChapterStart']
        },
        SAVE_PROJECT: {
            actions: 'saveProject'
        },
        SET_PLAYER_REF: {
            actions: 'setPlayerRef'
        },
        SET_CHART_REF: {
            actions: 'setChartRef'
        },
        SET_VIDEO_DURATION: {
            actions: 'setVideoDuration'
        },
        VIDEO_TIME_UPDATE: {
            actions: 'updateVideoTime'
        },
        SEEK_VIDEO: {
            actions: 'seekVideo'
        },
        SET_PROJECT_ID: {
            actions: 'setProjectId'
        }
    },
    states: {
        idle: {
            description: 'Initial state, waiting for chapters to load',
            always: [
                {
                    guard: ({ context }) => Object.keys(context.fsChapters).length > 0,
                    target: 'ready'
                }
            ]
        },
        ready: {
            description: 'Chapters are loaded and ready for editing',
            initial: 'no_selection',
            states: {
                no_selection: {
                    description: 'No chapter is currently selected',
                    on: {
                        SELECT_CHAPTER: {
                            target: 'chapter_selected',
                            actions: ['selectChapter', 'seekToChapterStart']
                        }
                    }
                },
                chapter_selected: {
                    description: 'A chapter is currently selected',
                    on: {
                        SELECT_CHAPTER: [
                            {
                                guard: ({ event }) => event.chapterId === null,
                                target: 'no_selection',
                                actions: ['selectChapter', 'seekToChapterStart']
                            },
                            {
                                target: 'chapter_selected',
                                actions: ['selectChapter', 'seekToChapterStart']
                            }
                        ]
                    }
                }
            }
        }
    }
},
    {
        actions: {
            ...chapterActions
        } as any
    }
); 