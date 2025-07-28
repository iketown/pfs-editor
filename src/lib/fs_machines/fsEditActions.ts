import { assign } from 'xstate';
import invariant from 'tiny-invariant';
import { FSEditContext } from './fsEditMachine';
import { nanoid } from 'nanoid';
const updateVideoTime = assign(({ event }: any) => {
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

const loadFunScript = assign(({ event }: any) => {
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

        // Create fsChapters object from funscript chapters
        const fsChapters: { [chapter_id: string]: { startTime: number; endTime: number; title: string; color: string; } } = {};

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

        return { funscript, fsChapters };
    }
    return {};
})

const updateChapter = assign(({ context, event }: any) => {
    if (
        event &&
        typeof event === 'object' &&
        'type' in event &&
        event.type === 'UPDATE_CHAPTER' &&
        'chapterId' in event
    ) {
        const { chapterId, startTime, endTime, title } = event;
        const updatedChapters = { ...context.fsChapters };

        if (updatedChapters[chapterId]) {
            if (startTime !== undefined) updatedChapters[chapterId].startTime = startTime;
            if (endTime !== undefined) updatedChapters[chapterId].endTime = endTime;
            if (title !== undefined) updatedChapters[chapterId].title = title;
        }

        return { fsChapters: updatedChapters };
    }
    return {};
});


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
        playerRef.current.currentTime = event.time;
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

export const fsEditActions = {
    updateVideoTime,
    loadVideo,
    setVideoDuration,
    loadFunScript,
    updateChapter,
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
    switchEditMode
}; 