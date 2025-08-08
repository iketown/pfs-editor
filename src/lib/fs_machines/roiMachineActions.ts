import { ROI } from '@/types/roi-types';
import { RoiContext, RoiEvent } from './roiMachine'
import { assign, AssignAction } from 'xstate';
import invariant from 'tiny-invariant';
import { db } from '@/lib/db';

type RoiAssignAction = AssignAction<RoiContext, RoiEvent, any, any, any>

const updateRoi: RoiAssignAction = assign({
    rois: ({ context, event }) => {
        invariant(event.type === 'UPDATE_ROI' || event.type === 'UPDATE_ROI_AND_SAVE', 'updateRoi action must be called with an UPDATE_ROI event');
        invariant(event.roi?.id, 'updateRoi action must be called with a roi.id');
        return {
            ...context.rois,
            [event.roi.id]: event.roi
        };
    },
})

const updateActiveROI: RoiAssignAction = assign({
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

const selectRoi: RoiAssignAction = assign({
    selectedROIid: ({ context, event }) => {
        invariant(event.type === 'SELECT_ROI', 'selectRoi action must be called with a SELECT_ROI event');
        return event.roiId;
    },

})

const setActvieROItoSelectedROI: RoiAssignAction = assign({
    activeROIid: ({ context, event }) => {
        invariant(event.type === 'SELECT_ROI', 'selectRoi action must be called with a SELECT_ROI event');
        return event.roiId;
    }
})



const addRoi: RoiAssignAction = assign({
    rois: ({ context, event }) => {
        console.log('adding roi', event)
        invariant(event.type === 'ADD_ROI', 'addRoi action must be called with an ADD_ROI event');
        return {
            ...context.rois,
            [event.roi.id]: event.roi
        };
    }
})

const saveRois: RoiAssignAction = assign({
    // This action doesn't modify the context, it just saves to the database
    // We use assign to make it compatible with XState, but return the same context
    rois: ({ context }) => {
        console.log('saving rois', context.rois, context)
        // Only save if we have a project ID
        if (context.projectId) {
            const projectROIs = {
                projectId: context.projectId,
                rois: context.rois,
                updatedAt: Date.now()
            };

            // Save to database asynchronously
            db.saveProjectROIs(projectROIs).catch(error => {
                console.error('Failed to save ROIs:', error);
            });
        }

        return context.rois;
    }
})

const removeRoi: RoiAssignAction = assign({
    rois: ({ context, event }) => {
        invariant(event.type === 'REMOVE_ROI', 'removeRoi action must be called with a REMOVE_ROI event');
        const { [event?.roiId]: removed, ...remaining } = context.rois;
        return remaining;
    }
})

export const roiActions = {
    updateRoi,
    updateActiveROI,
    selectRoi,
    addRoi,
    setActvieROItoSelectedROI,
    saveRois,
    removeRoi
}