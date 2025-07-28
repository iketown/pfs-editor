import { useEffect } from 'react';
import { useEditActorRef, useEditSelector } from '@/components/fs_components/FsEditActorContext';
import * as videoFileHandler from '@/lib/video-file-handler';
import { db } from '@/lib/db';

export const useVideoFileManager = (projectId: string) => {
    const { send: editSend } = useEditActorRef();

    // Get current state from context
    const videoUrl = useEditSelector((state) => state.context.videoUrl);
    const videoPrompt = useEditSelector((state) => state.context.videoPrompt);
    const videoFile = useEditSelector((state) => state.context.videoFile);

    // Restore video file on mount
    useEffect(() => {
        const restoreVideo = async () => {
            try {
                let foundVideo = false;
                let url: string | null = null;

                if (videoFileHandler.isChromium()) {
                    // Try to restore from IndexedDB
                    const entry = await videoFileHandler.loadVideoHandleFromIndexedDB(projectId);
                    if (entry && entry.handle) {
                        try {
                            const file = await entry.handle.getFile();
                            url = URL.createObjectURL(file);
                            foundVideo = true;
                            editSend({ type: 'SET_VIDEO_URL', url });
                        } catch (e) {
                            // Permission revoked or file missing
                            const prompt = 'Please re-select your video file: ' + (entry.metadata?.fileName || '');
                            editSend({ type: 'SET_VIDEO_PROMPT', prompt });
                            await videoFileHandler.removeVideoHandleFromIndexedDB(projectId);
                        }
                    }
                }

                if (!foundVideo && videoFile) {
                    // Try to use in-memory videoFile (if present)
                    try {
                        // If videoFile is a File object (from session), create URL
                        if (videoFile && typeof videoFile === 'object' && 'name' in videoFile) {
                            url = URL.createObjectURL(videoFile as File);
                            foundVideo = true;
                            editSend({ type: 'SET_VIDEO_URL', url });
                        }
                    } catch (e) {
                        // Not a File object or error
                    }
                }

                if (!foundVideo) {
                    const fileName = videoFile && typeof videoFile === 'object' && 'name' in videoFile
                        ? (videoFile as any).name
                        : '';
                    const prompt = 'Please select your video file: ' + fileName;
                    editSend({ type: 'SET_VIDEO_PROMPT', prompt });
                } else {
                    editSend({ type: 'SET_VIDEO_PROMPT', prompt: null });
                }
            } catch (err) {
                console.error('Failed to restore video file:', err);
                editSend({ type: 'SET_VIDEO_PROMPT', prompt: 'Failed to restore video file' });
            }
        };

        if (projectId) {
            restoreVideo();
        }
    }, [projectId, editSend]);

    // Handler for user selecting/re-linking video file
    const handleSelectVideo = async () => {
        try {
            const result = await videoFileHandler.promptForVideoFile();
            if (result.file) {
                const url = URL.createObjectURL(result.file);
                editSend({ type: 'SET_VIDEO_URL', url });
                editSend({ type: 'SET_VIDEO_PROMPT', prompt: null });

                // Save handle/metadata for Chromium
                if (videoFileHandler.isChromium() && result.handle) {
                    await videoFileHandler.saveVideoHandleToIndexedDB(projectId, result.handle, result.metadata);
                }

                // Update project with new video file
                const project = await db.getProject(projectId);
                if (project) {
                    await db.saveProject({
                        ...project,
                        videoFile: result.file
                    });
                }
            }
        } catch (e) {
            editSend({ type: 'SET_VIDEO_PROMPT', prompt: 'Failed to load video file. Please try again.' });
        }
    };

    return {
        videoUrl,
        videoPrompt,
        handleSelectVideo
    };
}; 