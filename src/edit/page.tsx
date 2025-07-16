import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { parseFunscript } from '@/lib/funscript';
import type { FunscriptObject } from '@/types/funscript';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  LineElement,
  PointElement,
  LinearScale,
  Title,
  Tooltip,
  Legend,
  CategoryScale
} from 'chart.js';

ChartJS.register(
  LineElement,
  PointElement,
  LinearScale,
  Title,
  Tooltip,
  Legend,
  CategoryScale
);

function FunscriptUploadButton({
  onFSParsed
}: {
  onFSParsed: (fs: FunscriptObject) => void;
}) {
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.name.endsWith('.funscript')) {
      alert('Please upload a .funscript file');
      return;
    }
    try {
      const text = await file.text();
      const parsed = parseFunscript(text);
      onFSParsed(parsed);
    } catch (err: any) {
      alert('Failed to parse funscript: ' + err.message);
    }
  };
  return (
    <Button asChild>
      <label>
        Upload Funscript
        <input
          type='file'
          accept='.funscript,application/json'
          style={{ display: 'none' }}
          onChange={handleFileChange}
        />
      </label>
    </Button>
  );
}

function FunscriptChart({ funscript }: { funscript: FunscriptObject }) {
  const data = {
    labels: funscript.actions.map((a) => a.at),
    datasets: [
      {
        label: 'Position',
        data: funscript.actions.map((a) => a.pos),
        borderColor: 'rgb(75, 192, 192)',
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
        pointRadius: 0,
        borderWidth: 2,
        tension: 0.2
      }
    ]
  };
  const options = {
    responsive: true,
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
  // Chart.js expects x/y pairs for linear x axis
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
  return (
    <div
      style={{
        width: '100%',
        minHeight: 300,
        maxHeight: 400,
        overflowX: 'auto'
      }}
    >
      <div style={{ width: Math.max(600, funscript.actions.length * 4) }}>
        <Line data={chartData} options={options} height={350} />
      </div>
    </div>
  );
}

export default function EditPage() {
  const [funscript, setFunscript] = useState<FunscriptObject | null>(null);
  return (
    <div className='flex min-h-screen flex-col items-center justify-center p-8'>
      <Card className='w-full max-w-xl'>
        <CardHeader>
          <CardTitle>Funscript Upload Demo</CardTitle>
        </CardHeader>
        <CardContent className='flex flex-col gap-4'>
          <FunscriptUploadButton onFSParsed={setFunscript} />
          {funscript && (
            <>
              <pre className='bg-muted max-h-96 overflow-x-auto rounded p-4 text-xs'>
                {JSON.stringify(funscript, null, 2)}
              </pre>
              <FunscriptChart funscript={funscript} />
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
