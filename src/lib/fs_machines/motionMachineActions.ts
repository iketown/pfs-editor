import { ROI } from '@/types/roi-types';
import { MotionContext, MotionEvent } from './motionMachine'
import { assign, AssignAction } from 'xstate';
import invariant from 'tiny-invariant';
import { isEqual } from 'lodash';
type MotionAssignAction = AssignAction<MotionContext, MotionEvent, any, any, any>

const updateRoi: MotionAssignAction = assign({
    rois: ({ context, event }) => {
        invariant(event.type === 'UPDATE_ROI', 'updateRoi action must be called with an UPDATE_ROI event');
        invariant(event.roi?.id, 'updateRoi action must be called with a roi.id');
        return {
            ...context.rois,
            [event.roi.id]: event.roi
        };
    },
})

const updateActiveROIs: MotionAssignAction = assign({
    activeROIs: ({ context, event }) => {
        invariant(event.type === 'VIDEO_TIME_UPDATE', 'updateActiveROIs action must be called with a VIDEO_TIME_UPDATE event');
        const currentTimeMs = event.time * 1000; // Convert video time from seconds to milliseconds
        const { rois, activeROIs } = context;
        const newActiveROIs = Object.entries(rois).filter(([_, roi]) => {
            return roi.timeStart <= currentTimeMs && roi.timeEnd >= currentTimeMs;
        }).map(([id]) => id);

        return isEqual(newActiveROIs, activeROIs) ? activeROIs : newActiveROIs;
    }
})

export const motionActions = {
    updateRoi, updateActiveROIs
}