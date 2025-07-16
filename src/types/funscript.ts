// types.ts
export interface FunscriptAction {
    id: string; // unique string id, e.g. "00001"
    at: number;   // timestamp in ms
    pos: number;  // 0–100 position
}

export interface FunscriptMetadata {
    version?: string;    // e.g. "1.0"
    inverted?: boolean;  // optional, default false
    range?: number;      // optional, default 90
    [extra: string]: any; // for metadata like "metadata" block
}

export interface FunscriptObject {
    actions: FunscriptAction[];
    version?: string;
    inverted?: boolean;
    range?: number;
    metadata?: any;
}
