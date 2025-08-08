import { assign } from 'xstate';
import invariant from 'tiny-invariant';
import { ChapterContext } from './chapterMachine';
import { db } from '@/lib/db';
import { nanoid } from 'nanoid';

// Helper function to parse time strings in format "HH:MM:SS.mmm" to seconds
const parseTimeString = (timeString: string): number => {
    // Handle if it's already a number
    if (typeof timeString === 'number') {
        return timeString;
    }

    // Handle if it's a string number
    if (!isNaN(Number(timeString))) {
        return Number(timeString);
    }

    // Parse time string in format "HH:MM:SS.mmm" or "MM:SS.mmm"
    const timeRegex = /^(\d{1,2}):(\d{2}):(\d{2})\.(\d{3})$/;
    const shortTimeRegex = /^(\d{1,2}):(\d{2})\.(\d{3})$/;

    let match = timeString.match(timeRegex);
    if (match) {
        const [, hours, minutes, seconds, milliseconds] = match;
        return (
            parseInt(hours) * 3600 +
            parseInt(minutes) * 60 +
            parseInt(seconds) +
            parseInt(milliseconds) / 1000
        );
    }

    match = timeString.match(shortTimeRegex);
    if (match) {
        const [, minutes, seconds, milliseconds] = match;
        return (
            parseInt(minutes) * 60 +
            parseInt(seconds) +
            parseInt(milliseconds) / 1000
        );
    }

    console.warn(`Could not parse time string: ${timeString}`);
    return 0;
};

// Chapter management actions
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

const importFsChapters = assign(({ context, event }: any) => {
    invariant(event.type === 'IMPORT_FS_CHAPTERS', 'importFsChapters must be called with a IMPORT_FS_CHAPTERS event');

    const { funscriptData } = event;
    if (!funscriptData?.metadata?.chapters) {
        console.warn('No chapters found in funscript data');
        return {};
    }

    const importedChapters: { [chapter_id: string]: { startTime: number; endTime: number; title: string; color: string; id: string; } } = {};

    funscriptData.metadata.chapters.forEach((chapter: any, index: number) => {
        const chapterId = nanoid(8); // Generate unique ID

        // Parse time strings to seconds
        const startTime = parseTimeString(chapter.startTime);
        const endTime = parseTimeString(chapter.endTime);

        // Generate a color based on index if not provided
        const colors = [
            '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
            '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9'
        ];
        const color = chapter.color || colors[index % colors.length];

        importedChapters[chapterId] = {
            startTime,
            endTime,
            title: chapter.name || `Chapter ${index + 1}`,
            color,
            id: chapterId
        };

        console.log(`Imported chapter "${chapter.name}": ${startTime}s - ${endTime}s`);
    });

    console.log('Imported chapters:', importedChapters);
    return { fsChapters: importedChapters };
});

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

// Video state actions
const updateVideoTime = assign(({ context, event }: any) => {
    invariant(event.type === 'VIDEO_TIME_UPDATE', 'updateVideoTime must be called with a VIDEO_TIME_UPDATE event');
    const videoTime = event.time;

    return { videoTime };
});

const seekVideo = assign(({ context, event }: { context: ChapterContext, event: { type: 'SEEK_VIDEO', time: number } }) => {
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
});

// Reference actions
const setPlayerRef = assign(({ event }: any) => {
    return { playerRef: event.playerRef };
});

const setChartRef = assign(({ event }: any) => {
    return { chartRef: event.chartRef };
});

// Project actions
const setProjectId = assign(({ event }: any) => {
    invariant(event.type === 'SET_PROJECT_ID', 'setProjectId must be called with a SET_PROJECT_ID event');
    return { projectId: event.projectId };
});

// Save actions
const saveProject = async ({ context }: any) => {
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

export const chapterActions = {
    loadFsChapters,
    importFsChapters,
    updateChapter,
    selectChapter,
    seekToChapterStart,
    updateVideoTime,
    seekVideo,
    setVideoDuration,
    setPlayerRef,
    setChartRef,
    setProjectId,
    saveProject
}; 