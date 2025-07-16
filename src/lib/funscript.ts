// parser.ts
import type { FunscriptObject } from '@/types/funscript';

export function parseFunscript(jsonString: string): FunscriptObject {
    let obj: any;
    try {
        obj = JSON.parse(jsonString);
    } catch (err) {
        throw new Error('Invalid JSON: ' + (err as Error).message);
    }

    if (!Array.isArray(obj.actions)) {
        throw new Error('Missing or invalid "actions" array');
    }
    let actionsCount = 0;
    const actions = obj.actions.map((a: any, i: number) => {
        if (typeof a.at !== 'number' || typeof a.pos !== 'number') {
            throw new Error(`Invalid action at index ${i}`);
        }
        actionsCount++;
        // Add id as zero-padded string (e.g., '00001')
        const id = (i + 1).toString().padStart(5, '0');
        return { id, at: a.at, pos: a.pos };
    });

    const { version, inverted, range, ...rest } = obj;
    const metadata = rest.metadata ? rest.metadata : undefined;
    console.log('actionsCount', actionsCount);
    return { version, inverted, range, metadata, actions };
}


export function stringifyFunscript(script: FunscriptObject, pretty = false): string {
    const out: any = {};

    if (script.version !== undefined) out.version = script.version;
    if (script.inverted !== undefined) out.inverted = script.inverted;
    if (script.range !== undefined) out.range = script.range;
    if (script.metadata !== undefined) out.metadata = script.metadata;

    // Remove id field from each action
    out.actions = script.actions.map(a => ({ at: a.at, pos: a.pos }));

    return pretty ? JSON.stringify(out, null, 2) : JSON.stringify(out);
}