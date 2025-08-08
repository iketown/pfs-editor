export type ROI = {
    x: number;
    y: number;
    w: number; // width
    h: number; // height
    id: string;
    title?: string;
    timeStart: number; // start time in seconds
    zoomed?: boolean; // whether this ROI is currently zoomed in
};
