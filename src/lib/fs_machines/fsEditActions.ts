import { assign } from 'xstate';

export const fsEditActions = {
    testAction: assign(({ context, event }) => {
        console.log('testAction', event);
        return {};
    }),
    loadVideo: assign(({ context, event }) => {
        console.log('loadingVideo', context, event);
        if (
            event &&
            typeof event === 'object' &&
            'type' in event &&
            (event.type === 'LOAD_VIDEO' || event.type === 'REPLACE_VIDEO') &&
            'url' in event &&
            'file' in event
        ) {
            return { videoUrl: event.url, videoFile: event.file };
        }
        return {};
    }),
    loadFunScript: assign(({ context, event }) => {
        if (
            event &&
            typeof event === 'object' &&
            'type' in event &&
            (event.type === 'LOAD_FUNSCRIPT' || event.type === 'REPLACE_FUNSCRIPT') &&
            'funscript' in event
        ) {
            return { funscript: event.funscript };
        }
        return {};
    }),
    replaceVideo: assign(({ context, event }) => {
        if (
            event &&
            typeof event === 'object' &&
            'type' in event &&
            event.type === 'REPLACE_VIDEO' &&
            'url' in event &&
            'file' in event
        ) {
            return { videoUrl: event.url, videoFile: event.file };
        }
        return {};
    }),
    replaceFunScript: assign(({ context, event }) => {
        if (
            event &&
            typeof event === 'object' &&
            'type' in event &&
            event.type === 'REPLACE_FUNSCRIPT' &&
            'funscript' in event
        ) {
            return { funscript: event.funscript };
        }
        return {};
    })
}; 