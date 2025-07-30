import { ROI } from '@/types/roi-types';
import { MotionContext, MotionEvent } from './motionMachine'
import { assign, AssignAction } from 'xstate';
import invariant from 'tiny-invariant';

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

const updateActiveROI: MotionAssignAction = assign({
    activeROIid: ({ context, event }) => {
        invariant(event.type === 'VIDEO_TIME_UPDATE', 'updateActiveROI action must be called with a VIDEO_TIME_UPDATE event');
        const currentTime = event.time; // Video time is already in seconds
        const { rois } = context;

        // Find the ROI with the closest timeStart that is before or equal to current time
        const roiEntries = Object.entries(rois);
        if (roiEntries.length === 0) return null;

        // Filter ROIs that start before or at current time, then find the latest one
        const validROIs = roiEntries
            .filter(([_, roi]) => (roi as ROI).timeStart <= currentTime)
            .sort(([_, a], [__, b]) => (b as ROI).timeStart - (a as ROI).timeStart); // Sort by timeStart descending

        return validROIs.length > 0 ? validROIs[0][0] : null;
    }
})

const selectRoi: MotionAssignAction = assign({
    selectedROIid: ({ context, event }) => {
        invariant(event.type === 'SELECT_ROI', 'selectRoi action must be called with a SELECT_ROI event');
        return event.roiId;
    }
})

export const motionActions = {
    updateRoi, updateActiveROI, selectRoi
}