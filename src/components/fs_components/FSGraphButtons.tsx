import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useEditActorRef, useEditSelector } from './FsEditActorContext';
import { useMotionSelector } from './MotionActorContext';
import { useState } from 'react';

// ButtonRow component for graph controls
export default function ButtonRow({}: {}) {
  // Jump to a specific node index
  const { send } = useEditActorRef();
  const currentNodeIdx = useEditSelector(
    (state) => state.context.currentNodeIdx
  );
  const funscript = useEditSelector((state) => state.context.funscript) as any;
  const videoFps = useEditSelector((state) => state.context.videoFps) as
    | number
    | null;
  const chartRef = useMotionSelector(
    (state) => state.context.chartRef
  ) as React.RefObject<any> | null;
  const [fpsInput, setFpsInput] = useState(videoFps?.toString() || '30');
  // Helper to get current zoom window size

  function getCurrentWindowSize() {
    const chart = chartRef?.current;
    if (chart && typeof chart.getZoomedScaleBounds === 'function') {
      const bounds = chart.getZoomedScaleBounds();
      if (
        bounds &&
        bounds.x &&
        typeof bounds.x.min === 'number' &&
        typeof bounds.x.max === 'number'
      ) {
        return bounds.x.max - bounds.x.min;
      }
    }
    // Fallback to initial window size if not zoomed yet
    return 5000;
  }

  function jumpToNode(idx: number) {
    if (!funscript?.actions[idx]) {
      console.log('no action at idx', idx);
      return;
    }
    const chart = chartRef?.current;
    if (!chart) {
      console.log('no chart', chartRef?.current);
      return;
    }
    const thisAction = funscript?.actions[idx] || { at: 0, pos: 0 };
    const targetAt = thisAction.at;
    const windowSize = getCurrentWindowSize();
    const min = Math.max(0, targetAt - windowSize / 2);
    const max = min + windowSize;
    chart.zoomScale('x', { min, max });
    send({ type: 'SET_NODE_IDX', nodeIdx: idx });
    send({ type: 'SELECT_NODE', actionId: thisAction.id });
    send({ type: 'SEEK_VIDEO', time: targetAt / 1000 }); // Convert funscript ms to seconds
  }

  // Handlers for next/prev
  function handleNext() {
    if (currentNodeIdx < (funscript?.actions?.length || 0) - 1) {
      jumpToNode(currentNodeIdx + 1);
    }
  }
  function handlePrev() {
    if (currentNodeIdx > 0) {
      jumpToNode(currentNodeIdx - 1);
    }
  }

  function handleFpsChange() {
    const fps = parseInt(fpsInput);
    if (fps > 0 && fps <= 120) {
      send({ type: 'SET_VIDEO_FPS', fps });
    }
  }

  return (
    <div
      style={{
        width: '80vw',
        display: 'flex',
        flexDirection: 'row',
        justifyContent: 'flex-start',
        alignItems: 'center',
        gap: 8,
        marginBottom: 8
      }}
    >
      <Button
        type='button'
        onClick={handlePrev}
        style={{ padding: '4px 12px', fontSize: 14 }}
      >
        ← prev node
      </Button>
      <Button
        type='button'
        onClick={handleNext}
        style={{ padding: '4px 12px', fontSize: 14 }}
      >
        → next node
      </Button>
      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        <Label htmlFor='fps-input' style={{ fontSize: 12 }}>
          FPS:
        </Label>
        <Input
          id='fps-input'
          type='number'
          value={fpsInput}
          onChange={(e) => setFpsInput(e.target.value)}
          onBlur={handleFpsChange}
          onKeyDown={(e) => e.key === 'Enter' && handleFpsChange()}
          style={{ width: 60, height: 28, fontSize: 12 }}
          min='1'
          max='120'
        />
      </div>
    </div>
  );
}
