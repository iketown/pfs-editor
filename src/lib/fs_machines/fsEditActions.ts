import { assign } from 'xstate';
import invariant from 'tiny-invariant';
import { FSEditContext } from './fsEditMachine';

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
const loadFunScript = assign(({ event }: any) => {
    if (
        event &&
        typeof event === 'object' &&
        'type' in event &&
        event.type === 'LOAD_FUNSCRIPT' &&
        'funscript' in event
    ) {
        return { funscript: event.funscript };
    }
    return {};
})


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

export const fsEditActions = {
    updateVideoTime,
    loadVideo,
    loadFunScript,
    selectNode,
    toggleSelectedNode,
    clearSelectedNodes,
    setNodeIdx,
    seekVideo,
    setPlayerRef,
    setChartRef
}; 