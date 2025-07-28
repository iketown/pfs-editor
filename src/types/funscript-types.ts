// types.ts
export interface FunscriptAction {
    id: string; // unique string id, e.g. "00001"
    at: number;   // timestamp in ms
    pos: number;  // 0–100 position
}


export interface FSChapter {
    name: string;
    startTime: string | number;
    endTime: string | number;
    id: string;
    color: string;
}

export interface FSBookmark {
    time: string;
    name: string;
}

export interface FunscriptMetadata {
    bookmarks?: FSBookmark[];
    chapters?: FSChapter[];
    creator?: string;
    description?: string;
    duration: number;
    license?: string;
    notes?: string;
    performers: string[];
    script_url: string;
    tags: string[];
    title: string;
    type: string; // 'basic'
    video_url: string;
    [extra: string]: any; // for metadata like "metadata" block
}

export interface FunscriptObject {
    version?: string;
    inverted?: boolean;
    range?: number;
    metadata?: FunscriptMetadata;
    actions: FunscriptAction[];
}
