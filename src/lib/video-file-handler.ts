// src/lib/video-file-handler.ts

/**
 * Utility for browser-specific video file handling.
 * Supports persistent file handles in Chromium and file input fallback for others.
 */

export type VideoFileMetadata = {
    fileName: string;
    fileSize: number;
    fileType: string;
    duration?: number;
    lastModified?: number;
    videoHash?: string;
};

export function isChromium(): boolean {
    // Detect Chromium browsers (Chrome, Edge, Opera)
    // This is a simple check; can be improved for edge cases
    return (
        !!window.showOpenFilePicker &&
        /Chrome|Edg|Opera/.test(navigator.userAgent)
    );
}

/**
 * Prompts the user to select a video file. Returns the File and metadata.
 * For Chromium, also returns the FileSystemFileHandle.
 */
export async function promptForVideoFile(): Promise<{
    file: File;
    metadata: VideoFileMetadata;
    handle?: FileSystemFileHandle;
}> {
    if (isChromium()) {
        // Chromium: use File System Access API
        const [handle] = await (window as any).showOpenFilePicker({
            types: [
                {
                    description: 'Video Files',
                    accept: { 'video/*': ['.mp4', '.webm', '.mov'] },
                },
            ],
            excludeAcceptAllOption: true,
            multiple: false,
        });
        const file = await handle.getFile();
        const metadata = await getVideoFileMetadata(file);
        return { file, metadata, handle };
    } else {
        // Fallback: use file input
        return new Promise((resolve, reject) => {
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = 'video/*';
            input.onchange = async (e: any) => {
                const file = e.target.files[0];
                if (!file) return reject('No file selected');
                const metadata = await getVideoFileMetadata(file);
                resolve({ file, metadata });
            };
            input.click();
        });
    }
}

/**
 * Extracts metadata from a File object, including optional hash.
 */
export async function getVideoFileMetadata(file: File): Promise<VideoFileMetadata> {
    const { name: fileName, size: fileSize, type: fileType, lastModified } = file;
    // Optionally, compute hash of first 10MB
    const videoHash = await hashFile(file);
    return { fileName, fileSize, fileType, lastModified, videoHash };
}

/**
 * Hashes the first 10MB of a file using SHA-1.
 */
export async function hashFile(file: File): Promise<string> {
    const chunk = await file.slice(0, 10_000_000).arrayBuffer();
    const hashBuffer = await crypto.subtle.digest('SHA-1', chunk);
    return Array.from(new Uint8Array(hashBuffer))
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('');
}

// IndexedDB helpers (Chromium only)
// Use idb-keyval for simplicity (or implement minimal wrappers)

let idb: any = null;
async function getIDB() {
    if (!idb) {
        idb = await import('idb-keyval');
    }
    return idb;
}

/**
 * Save a FileSystemFileHandle and metadata for a project (Chromium only).
 */
export async function saveVideoHandleToIndexedDB(projectId: string, handle: FileSystemFileHandle, metadata: VideoFileMetadata) {
    const { set } = await getIDB();
    await set(`video-handle-${projectId}`, { handle, metadata });
}

/**
 * Load a FileSystemFileHandle and metadata for a project (Chromium only).
 */
export async function loadVideoHandleFromIndexedDB(projectId: string): Promise<{ handle: FileSystemFileHandle; metadata: VideoFileMetadata } | null> {
    const { get } = await getIDB();
    return (await get(`video-handle-${projectId}`)) || null;
}

/**
 * Remove a FileSystemFileHandle for a project (Chromium only).
 */
export async function removeVideoHandleFromIndexedDB(projectId: string) {
    const { del } = await getIDB();
    await del(`video-handle-${projectId}`);
}



/**
 * Utility function to extract video duration from a file
 * @param file - Video file
 * @returns Promise that resolves to video duration in seconds
 */
export const getVideoDuration = (file: File): Promise<number> => {
    return new Promise((resolve) => {
        const video = document.createElement('video');
        video.preload = 'metadata';

        video.onloadedmetadata = () => {
            resolve(video.duration);
        };

        video.onerror = () => {
            console.warn('Could not load video metadata, using default duration');
            resolve(60); // Default 1 minute
        };

        video.src = URL.createObjectURL(file);
    });
};