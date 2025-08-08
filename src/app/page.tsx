'use client';

import ProjectWorkflowXState from '@/components/ProjectWorkflowXState';
import LoaderContextView from '@/components/fs_components/LoaderContextView';
import { LoaderActorContext } from '@/components/fs_components/LoaderActorContext';

export default function Home() {
  return (
    <LoaderActorContext.Provider>
      <main className='flex min-h-screen flex-col items-center justify-between p-24'>
        <div className='w-full'>
          <ProjectWorkflowXState />
        </div>
        <LoaderContextView />
      </main>
    </LoaderActorContext.Provider>
  );
}
