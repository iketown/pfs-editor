import { assign, AssignAction } from 'xstate';
import { ProjectContext, ProjectEvent } from './projectMachine'
import { db } from '@/lib/db';

type ProjectMachineAssignAction = AssignAction<ProjectContext, any, any, ProjectEvent, any>

const selectVideo: ProjectMachineAssignAction = assign({
    currentProject: ({ context, event }) => ({
        ...context.currentProject!,
        videoFile: {
            name: event.videoFile.name,
            size: event.videoFile.size,
            type: event.videoFile.type,
            lastModified: event.videoFile.lastModified
        },
        updatedAt: Date.now()
    }),
    videoBlobUrl: ({ event }) => event.blobUrl,
    error: null
})

const selectFunscript: ProjectMachineAssignAction = assign({
    currentProject: ({ context, event }) => {
        return ({
            ...context.currentProject!,
            funscriptData: event.funscriptData,
            updatedAt: Date.now()
        })
    },
    error: null
})

// Action to save the current project to the database
const saveProject = async ({ context }: { context: ProjectContext }) => {
    console.log('Saving project', context.currentProject);
    if (context.currentProject) {
        try {
            await db.saveProject(context.currentProject);
        } catch (error) {
            console.error('Failed to save project:', error);
            // Note: We don't set error here as it's an entry action
            // The error handling should be done in the component
        }
    }
}

export const projectMachineActions = {
    selectVideo,
    selectFunscript,
    saveProject
}