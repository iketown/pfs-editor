'use client';

import { ProjectWorkflow } from '@/components/ProjectWorkflow';

export default function Home() {
  return (
    <main className='flex min-h-screen flex-col items-center justify-between p-24'>
      <div className='w-full'>
        <ProjectWorkflow />
      </div>
    </main>
  );
}
