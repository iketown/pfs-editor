declare module 'react-video-timelines-slider' {
    import React from 'react';

    interface TimeRangeProps {
        timelineInterval: [number, number];
        selectedInterval: [number, number];
        disabledIntervals?: Array<{ start: number; end: number }>;
        onChangeCallback?: (selectedInterval: [number, number]) => void;
        onUpdateCallback?: ({ error }: { error: boolean }) => void;
        formatTick?: (ms: number) => string;
        formatTooltip?: (ms: number) => string;
        showTooltip?: boolean;
        showTimelineError?: boolean;
        step?: number;
        ticksNumber?: number;
        mode?: number;
        containerClassName?: string;
        error?: boolean;
        style?: React.CSSProperties;
    }

    const TimeRange: React.FC<TimeRangeProps>;
    export default TimeRange;
} 