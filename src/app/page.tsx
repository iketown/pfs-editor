'use client';

import ProjectWorkflowXState from '@/components/ProjectWorkflowXState';
import ProjectContextView from '@/components/fs_components/ProjectContextView';
import { ProjectActorContext } from '@/components/fs_components/ProjectActorContext';

export default function Home() {
  return (
    <ProjectActorContext.Provider>
      <main className='flex min-h-screen flex-col items-center justify-between p-24'>
        <div className='w-full'>
          <ProjectWorkflowXState />
        </div>
        <ProjectContextView />
      </main>
    </ProjectActorContext.Provider>
  );
}
