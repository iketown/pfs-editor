import { assign } from 'xstate';
import invariant from 'tiny-invariant';
import { FSEditContext } from './fsEditMachine';
import { nanoid } from 'nanoid';
import { db } from '@/lib/db';

// Debounced save queue for actions
let saveQueue: Array<() => Promise<void>> = [];
let saveTimeout: NodeJS.Timeout | null = null;
const SAVE_DEBOUNCE_MS = 1000; // 1 second debounce

const flushSaveQueue = async () => {
    if (saveQueue.length === 0) return;

    const currentQueue = [...saveQueue];
    saveQueue = [];

    try {
        // If we have multiple saves, use batch update
        if (currentQueue.length > 1) {
            const projectId = currentQueue[0].toString().match(/projectId:\s*([^,]+)/)?.[1];
            if (projectId) {
                await db.batchUpdate({
                    projectId,
                    updates: {
                        actions: {
                            projectId,
                            actions: [], // Will be filled by individual saves
                            updatedAt: Date.now()
                        }
                    },
                    timestamp: Date.now()
                });
            }
        } else {
            // Single save, execute directly
            await currentQueue[0]();
        }
    } catch (error) {
        console.error('Failed to flush save queue:', error);
    }
};

const queueSave = (saveFn: () => Promise<void>) => {
    saveQueue.push(saveFn);

    if (saveTimeout) {
        clearTimeout(saveTimeout);
    }

    saveTimeout = setTimeout(flushSaveQueue, SAVE_DEBOUNCE_MS);
};

const updateVideoTime = assign(({ context, event }: any) => {
    invariant(event.type === 'VIDEO_TIME_UPDATE', 'updateVideoTime must be called with a VIDEO_TIME_UPDATE event');
    const videoTime = event.time;

    return { videoTime };
})

const loadVideo = assign(({ event }: any) => {
    if (
        event &&
        typeof event === 'object' &&
        'type' in event &&
        event.type === 'LOAD_VIDEO' &&
        'url' in event &&
        'file' in event
    ) {
        return { videoUrl: event.url, videoFile: event.file };
    }
    return {};
})

const setVideoDuration = assign(({ event }: any) => {
    if (
        event &&
        typeof event === 'object' &&
        'type' in event &&
        event.type === 'SET_VIDEO_DURATION' &&
        'duration' in event
    ) {
        return {
            videoDuration: event.duration,
            rangeStart: 0,
            rangeEnd: event.duration
        };
    }
    return {};
})

// Optimized save functions for different data types
const saveProjectChapters = async ({ context }: any) => {
    if (!context.projectId) {
        console.error('No project ID available in context');
        return;
    }

    try {
        await db.saveProjectChapters({
            projectId: context.projectId,
            chapters: context.fsChapters || {},
            updatedAt: Date.now()
        });
        console.log('Chapters auto-saved successfully');
    } catch (error) {
        console.error('Failed to auto-save chapters:', error);
    }
};

const saveProjectSettings = async ({ context }: any) => {
    if (!context.projectId) {
        console.error('No project ID available in context');
        return;
    }

    try {
        await db.saveProjectSettings({
            projectId: context.projectId,
            settings: {
                hideVideo: context.hideVideo,
                // Add other settings as needed
            },
            updatedAt: Date.now()
        });
        console.log('Settings auto-saved successfully');
    } catch (error) {
        console.error('Failed to auto-save settings:', error);
    }
};

const saveProjectActions = async ({ context }: any) => {
    if (!context.projectId || !context.funscript) {
        console.error('No project ID or funscript available in context');
        return;
    }

    try {
        await db.saveProjectActions({
            projectId: context.projectId,
            actions: context.funscript.actions || [],
            updatedAt: Date.now()
        });
        console.log('Actions auto-saved successfully');
    } catch (error) {
        console.error('Failed to auto-save actions:', error);
    }
};

// Debounced action save for frequent updates
const queueActionSave = async ({ context }: any) => {
    if (!context.projectId || !context.funscript) {
        console.error('No project ID or funscript available in context');
        return;
    }

    queueSave(async () => {
        try {
            await db.saveProjectActions({
                projectId: context.projectId,
                actions: context.funscript.actions || [],
                updatedAt: Date.now()
            });

            // Also save action event for history
            await db.saveActionEvent({
                id: nanoid(),
                projectId: context.projectId,
                type: 'BATCH_UPDATE',
                data: { actionCount: context.funscript.actions?.length || 0 },
                timestamp: Date.now()
            });

            console.log('Actions batch-saved successfully');
        } catch (error) {
            console.error('Failed to batch-save actions:', error);
        }
    });
};

// Legacy full project save (for backward compatibility)
const saveProject = async ({ event, context }: any) => {
    if (!context.projectId) {
        console.error('No project ID available in context');
        return;
    }

    try {
        const project = await db.getProject(context.projectId);
        if (project) {
            const updatedProject = {
                ...project,
                fsChapters: context.fsChapters,
                settings: {
                    ...project.settings,
                    hideVideo: context.hideVideo
                },
                updatedAt: Date.now()
            };
            await db.saveProject(updatedProject);
            console.log('Project auto-saved successfully');
        }
    } catch (error) {
        console.error('Failed to auto-save project:', error);
    }
};

/**
 * Converts a time string in format "HH:MM:SS.mmm" to milliseconds
 * @param timeString - Time string like "00:08:52.733"
 * @returns Time in milliseconds
 */
const minSecToMS = (timeString: string): number => {
    const parts = timeString.split(':');
    if (parts.length !== 3) {
        console.warn('Invalid time format:', timeString);
        return 0;
    }

    const hours = parseInt(parts[0], 10);
    const minutes = parseInt(parts[1], 10);

    // Split seconds and milliseconds
    const secondsParts = parts[2].split('.');
    const seconds = parseInt(secondsParts[0], 10);
    const milliseconds = secondsParts.length > 1 ? parseInt(secondsParts[1], 10) : 0;

    return Math.round((hours * 3600 + minutes * 60 + seconds) * 1000 + milliseconds);
};

// New action to load fsChapters directly from project data
const loadFsChapters = assign(({ event }: any) => {
    if (
        event &&
        typeof event === 'object' &&
        'type' in event &&
        event.type === 'LOAD_FS_CHAPTERS' &&
        'fsChapters' in event
    ) {
        return { fsChapters: event.fsChapters };
    }
    return {};
});

const loadFunScript = assign(({ event, context }: any) => {
    if (
        event &&
        typeof event === 'object' &&
        'type' in event &&
        event.type === 'LOAD_FUNSCRIPT' &&
        'funscript' in event
    ) {
        const funscript = event.funscript;

        // Convert chapter times from strings to milliseconds
        if (funscript.metadata?.chapters) {
            funscript.metadata.chapters = funscript.metadata.chapters.map((chapter: any) => ({
                ...chapter,
                startTime: typeof chapter.startTime === 'string'
                    ? minSecToMS(chapter.startTime) / 1000 // Convert to seconds for consistency
                    : chapter.startTime,
                endTime: typeof chapter.endTime === 'string'
                    ? minSecToMS(chapter.endTime) / 1000 // Convert to seconds for consistency
                    : chapter.endTime
            }));
        }

        // Only generate fsChapters if they don't already exist
        let fsChapters = context.fsChapters;
        if (!fsChapters || Object.keys(fsChapters).length === 0) {
            // Create fsChapters object from funscript chapters
            fsChapters = {};

            // 6 equidistant colors on the color wheel (60 degrees apart)
            const chapterColors = [
                'bg-red-500',    // 0° - Red
                'bg-yellow-500', // 60° - Yellow
                'bg-green-500',  // 120° - Green
                'bg-cyan-500',   // 180° - Cyan
                'bg-blue-500',   // 240° - Blue
                'bg-purple-500'  // 300° - Purple
            ];

            if (funscript.metadata?.chapters) {
                funscript.metadata.chapters.forEach((chapter: any, index: number) => {
                    const chapterId = nanoid(6);
                    const colorIndex = index % chapterColors.length; // Cycle through colors if more than 6 chapters
                    fsChapters[chapterId] = {
                        startTime: typeof chapter.startTime === 'string' ? parseFloat(chapter.startTime) : chapter.startTime,
                        endTime: typeof chapter.endTime === 'string' ? parseFloat(chapter.endTime) : chapter.endTime,
                        title: chapter.name || `Chapter ${index + 1}`,
                        color: chapterColors[colorIndex],
                        id: chapterId
                    };
                });
            }
        }

        return { funscript, fsChapters };
    }
    return {};
})

const updateChapter = assign(({ context, event }: any) => {
    invariant(['UPDATE_CHAPTER', "UPDATE_CHAPTER_AND_SAVE"].includes(event.type), 'updateChapter must be called with a UPDATE_CHAPTER event');

    const { chapterId, startTime, endTime, title } = event;
    const updatedChapters = { ...context.fsChapters };

    if (updatedChapters[chapterId]) {
        if (startTime !== undefined) updatedChapters[chapterId].startTime = startTime;
        if (endTime !== undefined) updatedChapters[chapterId].endTime = endTime;
        if (title !== undefined) updatedChapters[chapterId].title = title;
    }

    return { fsChapters: updatedChapters };
});



const updateChapterAndSave = async ({ context, event }: any) => {
    if (
        event &&
        typeof event === 'object' &&
        'type' in event &&
        event.type === 'UPDATE_CHAPTER_AND_SAVE' &&
        'chapterId' in event
    ) {
        // First update the chapter
        const { chapterId, startTime, endTime, title } = event;
        const updatedChapters = { ...context.fsChapters };

        if (updatedChapters[chapterId]) {
            if (startTime !== undefined) updatedChapters[chapterId].startTime = startTime;
            if (endTime !== undefined) updatedChapters[chapterId].endTime = endTime;
            if (title !== undefined) updatedChapters[chapterId].title = title;
        }

        // Then save using granular operation
        if (!context.projectId) {
            console.error('No project ID available in context');
            return;
        }

        try {
            await db.saveProjectChapters({
                projectId: context.projectId,
                chapters: updatedChapters,
                updatedAt: Date.now()
            });
            console.log('Chapter updated and auto-saved successfully');
        } catch (error) {
            console.error('Failed to update chapter and save:', error);
        }
    }
};


const selectNode = assign(({ context, event }: any) => {
    invariant(event.type === 'SELECT_NODE', 'selectNode must be called with a SELECT_NODE event');
    return {
        ...context,
        selectedActionIds: [event.actionId]
    };
});

const toggleSelectedNode = assign(({ context, event }: any) => {
    invariant(event.type === 'TOGGLE_SELECTED_NODE', 'toggleSelectedNode must be called with a TOGGLE_SELECTED_NODE event');
    return ({
        selectedActionIds: context.selectedActionIds.includes(event.actionId)
            ? context.selectedActionIds.filter((id: any) => id !== event.actionId)
            : [...context.selectedActionIds, event.actionId]
    })
});

const clearSelectedNodes = assign(({ context }: any) => ({
    selectedActionIds: []
}));

const setNodeIdx = assign(({ context, event }: any) => {
    invariant(event.type === 'SET_NODE_IDX', 'setNodeIdx must be called with a SET_NODE_IDX event');
    return {
        currentNodeIdx: event.nodeIdx
    };
});

const seekVideo = assign(({ context, event }: { context: FSEditContext, event: { type: 'SEEK_VIDEO', time: number } }) => {
    invariant(event.type === 'SEEK_VIDEO', 'seekVideo must be called with a SEEK_VIDEO event');
    const { playerRef } = context;
    if (playerRef && playerRef.current) {
        // Set the video time directly without updating context to prevent infinite loops
        playerRef.current.currentTime = event.time;
        // Return the new time to update context, but this won't trigger another seek
        return { videoTime: event.time };
    }
    return {};
});

const setPlayerRef = assign(({ event }: any) => {
    return { playerRef: event.playerRef };
});

const setChartRef = assign(({ event }: any) => {
    return { chartRef: event.chartRef };
});

const setVideoFps = assign(({ event }: any) => {
    invariant(event.type === 'SET_VIDEO_FPS', 'setVideoFps must be called with a SET_VIDEO_FPS event');
    return { videoFps: event.fps };
});

const setVideoUrl = assign(({ event }: any) => {
    invariant(event.type === 'SET_VIDEO_URL', 'setVideoUrl must be called with a SET_VIDEO_URL event');
    return { videoUrl: event.url };
});

const setVideoPrompt = assign(({ event }: any) => {
    invariant(event.type === 'SET_VIDEO_PROMPT', 'setVideoPrompt must be called with a SET_VIDEO_PROMPT event');
    return { videoPrompt: event.prompt };
});

const restoreVideoFile = assign(({ context, event }: any) => {
    invariant(event.type === 'RESTORE_VIDEO_FILE', 'restoreVideoFile must be called with a RESTORE_VIDEO_FILE event');
    // This will be implemented in the hook to handle async operations
    return {};
});

const selectVideoFile = assign(({ context, event }: any) => {
    invariant(event.type === 'SELECT_VIDEO_FILE', 'selectVideoFile must be called with a SELECT_VIDEO_FILE event');
    // This will be implemented in the hook to handle async operations
    return {};
});

const setLoopPoints = assign(({ event }: any) => {
    invariant(event.type === 'SET_LOOP_POINTS', 'setLoopPoints must be called with a SET_LOOP_POINTS event');
    return {
        loopStart: event.start,
        loopEnd: event.end
    };
});

const setRangeStart = assign(({ event }: any) => {
    invariant(event.type === 'SET_RANGE_START', 'setRangeStart must be called with a SET_RANGE_START event');
    return { rangeStart: event.start };
});

const setRangeEnd = assign(({ event }: any) => {
    invariant(event.type === 'SET_RANGE_END', 'setRangeEnd must be called with a SET_RANGE_END event');
    return { rangeEnd: event.end };
});

const resetRange = assign(({ context }: any) => {
    return {
        rangeStart: 0,
        rangeEnd: context.videoDuration
    };
});

const selectChapter = assign(({ context, event }: any) => {
    invariant(event.type === 'SELECT_CHAPTER', 'selectChapter must be called with a SELECT_CHAPTER event');

    const { chapterId } = event;

    // If no chapter is selected, clear the selection and reset range to full video
    if (!chapterId) {
        return {
            selectedChapterId: null,
            rangeStart: 0,
            rangeEnd: context.videoDuration
        };
    }

    // Get the chapter data
    const chapter = context.fsChapters[chapterId];
    if (!chapter) {
        return {
            selectedChapterId: null,
            rangeStart: 0,
            rangeEnd: context.videoDuration
        };
    }

    // Calculate the range: chapter takes up middle 3/5, with 1/5 margin on each side
    const chapterDuration = chapter.endTime - chapter.startTime;
    const margin = chapterDuration / 3; // 1/5 of total range = 1/3 of chapter duration

    const newRangeStart = Math.max(0, chapter.startTime - margin);
    const newRangeEnd = Math.min(context.videoDuration, chapter.endTime + margin);

    return {
        selectedChapterId: chapterId,
        rangeStart: newRangeStart,
        rangeEnd: newRangeEnd
    };
});

const switchEditMode = assign(({ event }: any) => {
    invariant(event.type === 'SWITCH_EDIT_MODE', 'switchEditMode must be called with a SWITCH_EDIT_MODE event');
    return { editMode: event.mode };
});

const seekToChapterStart = assign(({ context, event }: any) => {
    invariant(event.type === 'SELECT_CHAPTER', 'seekToChapterStart must be called with a SELECT_CHAPTER event');

    const { chapterId } = event;

    // If no chapter is selected (toggling OFF), don't seek
    if (!chapterId) {
        return {};
    }

    // Get the chapter data
    const chapter = context.fsChapters[chapterId];
    if (!chapter) {
        return {};
    }

    // Seek to the beginning of the chapter
    const { playerRef } = context;
    if (playerRef && playerRef.current) {
        playerRef.current.currentTime = chapter.startTime;
    }

    return {};
});

const showHideVideo = assign(({ context, event }: any) => {
    invariant(event.type === 'SHOW_HIDE_VIDEO', 'showHideVideo must be called with a SHOW_HIDE_VIDEO event');
    return { hideVideo: event.hideVideo };
});




const loadProjectSettings = assign(({ event }: any) => {
    if (
        event &&
        typeof event === 'object' &&
        'type' in event &&
        event.type === 'LOAD_PROJECT_SETTINGS' &&
        'settings' in event
    ) {
        const settings = event.settings || {};
        return {
            hideVideo: settings.hideVideo ?? false // Default to false if not set
        };
    }
    return {};
});

const setProjectId = assign(({ event }: any) => {
    invariant(event.type === 'SET_PROJECT_ID', 'setProjectId must be called with a SET_PROJECT_ID event');
    return { projectId: event.projectId };
});

export const fsEditActions = {
    updateVideoTime,
    loadVideo,
    setVideoDuration,
    loadFsChapters,
    loadFunScript,
    updateChapter,
    updateChapterAndSave,
    selectNode,
    toggleSelectedNode,
    clearSelectedNodes,
    setNodeIdx,
    seekVideo,
    setPlayerRef,
    setChartRef,
    setVideoFps,
    setVideoUrl,
    setVideoPrompt,
    restoreVideoFile,
    selectVideoFile,
    setLoopPoints,
    setRangeStart,
    setRangeEnd,
    resetRange,
    selectChapter,
    switchEditMode,
    seekToChapterStart,
    saveProject,
    saveProjectChapters,
    saveProjectSettings,
    saveProjectActions,
    queueActionSave,
    showHideVideo,
    loadProjectSettings,
    setProjectId
}; 