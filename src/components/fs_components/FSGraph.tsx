'use client';

import type { FunscriptObject } from '@/types/funscript-types';
import {
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LinearScale,
  LineElement,
  PointElement,
  Title,
  Tooltip
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import dragDataPlugin from 'chartjs-plugin-dragdata';

import React, { useRef, useState, useEffect, useMemo } from 'react';
import zoomPlugin from 'chartjs-plugin-zoom';
import ButtonRow from './FSGraphButtons';
import FrameIndicator from './FrameIndicator';
import { ChartJSOrUndefined } from 'react-chartjs-2/dist/types';
import {
  FsEditActorContext,
  useEditActorRef,
  useEditSelector
} from './FsEditActorContext';
import { useMotionActorRef } from './MotionActorContext';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  zoomPlugin,
  dragDataPlugin,
  Title,
  Tooltip,
  Legend
);

export default function FSGraph({ funscript }: { funscript: FunscriptObject }) {
  const actor = FsEditActorContext.useActorRef();
  const send = actor.send;
  const selectedActionIds = useEditSelector(
    (state) => state.context.selectedActionIds
  ) as string[];
  const videoFps = useEditSelector((state) => state.context.videoFps) as
    | number
    | null;
  const videoTime = useEditSelector(
    (state) => state.context.videoTime
  ) as number;
  const { send: motionSend } = useMotionActorRef();
  const { send: editSend } = useEditActorRef();
  const chartRef =
    useRef<ChartJSOrUndefined<'line', { x: number; y: number }[], unknown>>(
      null
    );
  useEffect(() => {
    motionSend({ type: 'SET_CHART_REF', chartRef });
    editSend({ type: 'SET_CHART_REF', chartRef });
  }, [chartRef, motionSend, editSend]);

  const handleChartClick = (event: any) => {
    const chart = chartRef?.current;
    if (!chart) return;

    // Get the canvas coordinates from the click event
    const canvasPosition = chart.canvas.getBoundingClientRect();
    const x = event.nativeEvent.clientX - canvasPosition.left;
    const y = event.nativeEvent.clientY - canvasPosition.top;

    // Convert canvas coordinates to data coordinates
    const xScale = chart.scales.x;
    const clickedTime = xScale.getValueForPixel(x);

    // Check if we clicked on a data point
    const points = chart.getElementsAtEventForMode(
      event.nativeEvent,
      'nearest',
      { intersect: true },
      true
    );

    if (points.length > 0) {
      // Clicked on a data point
      const idx = points[0].index;
      const action = funscript.actions[idx];
      const { id, at, pos } = action;
      send({ type: 'SEEK_VIDEO', time: at / 1000 });
      const actionId = id;
      if (event.metaKey) {
        send({ type: 'TOGGLE_SELECTED_NODE', actionId });
      } else {
        send({ type: 'SELECT_NODE', actionId });
      }
      send({ type: 'SET_NODE_IDX', nodeIdx: idx });
    } else if (clickedTime !== undefined) {
      // Clicked on empty space - seek to the clicked time
      console.log('Clicked at time:', clickedTime, 'ms');
      send({ type: 'SEEK_VIDEO', time: clickedTime / 1000 });
      send({ type: 'CLEAR_SELECTED_NODES' });
    }
  };

  const handleFrameClick = (timeMs: number) => {
    console.log('Frame clicked at:', timeMs, 'ms');
    send({ type: 'SEEK_VIDEO', time: timeMs / 1000 });
    send({ type: 'CLEAR_SELECTED_NODES' });
  };
  // Track current node index for navigation

  // Expose chart instance for debugging
  // useEffect(() => {
  //   if (typeof window !== 'undefined' && chartRef.current) {
  //     // @ts-ignore
  //     window.chart = chartRef.current;
  //   }
  // }, [chartRef.current]);

  const chartData = useMemo(
    () => ({
      datasets: [
        {
          label: 'Position',
          data: funscript.actions.map((a) => ({ x: a.at, y: a.pos })),
          borderColor: 'rgb(75, 192, 192)',
          backgroundColor: 'rgba(75, 192, 192, 0.2)',
          pointRadius: 5,
          pointHoverRadius: 8,
          pointBackgroundColor: funscript.actions.map((a) =>
            selectedActionIds.includes(a.id) ? 'purple' : 'rgb(75, 192, 192)'
          ),
          borderWidth: 2,
          tension: 0.2
        }
      ]
    }),
    [funscript.actions, selectedActionIds]
  );

  const options = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        x: {
          type: 'linear' as const,
          title: { display: true, text: 'Time (ms)' },
          min: 0,
          max: 5000,
          ticks: { autoSkip: true, maxTicksLimit: 20 }
        },
        y: {
          min: 0,
          max: 100,
          title: { display: true, text: 'Position' }
        }
      },
      plugins: {
        legend: { display: false },
        tooltip: { enabled: true },
        title: { display: false },
        dragData: {
          showTooltip: true,
          dragX: true,
          dragY: true,
          onDragEnd: (
            e: any,
            datasetIndex: number,
            index: number,
            value: any
          ) => {
            // You can update your funscript/actions here
            console.log('Dragged point', { e, datasetIndex, index, value });
          }
        },
        zoom: {
          pan: {
            enabled: true,
            mode: 'x' as const
          },
          zoom: {
            wheel: {
              enabled: true
            },
            pinch: {
              enabled: true
            },
            mode: 'x' as const,
            limits: {
              x: { minRange: 3000, maxRange: 10000 } // 3s to 10s
            },
            onZoom: ({ chart }: { chart: any }) => {
              // const min = chart.scales.x.min;
              // const max = chart.scales.x.max;
              // const visibleMs = max - min;
              // console.log('Zoom changed:', { min, max, visibleMs });
            }
          }
        }
      },
      elements: {
        line: { cubicInterpolationMode: 'monotone' as const }
      }
    }),
    []
  );

  return (
    <>
      <ButtonRow />
      <div style={{ width: '80vw', height: 430 }}>
        {videoFps && (
          <FrameIndicator
            chartRef={chartRef}
            fps={videoFps}
            currentTimeMs={videoTime}
            onFrameClick={handleFrameClick}
            height={30}
          />
        )}
        <div style={{ height: 400 }}>
          <Line
            ref={chartRef}
            onLoadedData={(arg) => {
              console.log('onLoadedData', arg);
            }}
            data={chartData}
            options={options}
            height={400}
            onClick={handleChartClick}
          />
        </div>
      </div>
    </>
  );
}
