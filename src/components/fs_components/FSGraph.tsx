'use client';

import type { FunscriptObject } from '@/types/funscript';
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

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

export default function FSGraph({ funscript }: { funscript: FunscriptObject }) {
  // Calculate a dynamic width based on number of actions, but at least window width
  const minWidth = typeof window !== 'undefined' ? window.innerWidth : 800;
  const chartWidth = Math.max(minWidth, funscript.actions.length * 4);
  const chartData = {
    datasets: [
      {
        label: 'Position',
        data: funscript.actions.map((a) => ({ x: a.at, y: a.pos })),
        borderColor: 'rgb(75, 192, 192)',
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
        pointRadius: 0,
        borderWidth: 2,
        tension: 0.2
      }
    ]
  };
  const options = {
    responsive: false,
    maintainAspectRatio: false,
    scales: {
      x: {
        type: 'linear' as const,
        title: { display: true, text: 'Time (ms)' },
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
      title: { display: false }
    },
    elements: {
      line: { cubicInterpolationMode: 'monotone' as const }
    }
  };
  return (
    <div style={{ width: '100vw', overflowX: 'auto', height: 400 }}>
      <div style={{ width: chartWidth, height: 400 }}>
        <Line
          data={chartData}
          options={options}
          width={chartWidth}
          height={400}
        />
      </div>
    </div>
  );
}
