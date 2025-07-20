import { Icons } from '@/components/icons';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTrigger
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useState } from 'react';
import { JSONTree } from 'react-json-tree';
import { ProjectActorContext, useProjectSelector } from './ProjectActorContext';

export default function ProjectContextView() {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState('project');
  const projectContext = ProjectActorContext.useSelector(
    (state) => state.context
  );
  const projectState = useProjectSelector((state) => state);

  return (
    <div>
      <div className='fixed top-6 right-6 z-50'>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <button
              className='bg-background hover:bg-accent flex items-center justify-center rounded-full border p-3 shadow-lg transition-colors'
              aria-label='Show Project XState Context'
            >
              <Icons.settings className='h-6 w-6' />
            </button>
          </DialogTrigger>
          <DialogContent className='min-h-[60vh] w-full max-w-3xl'>
            <Tabs value={tab} onValueChange={setTab}>
              <DialogHeader>
                <TabsList>
                  <TabsTrigger value='project'>Project Context</TabsTrigger>
                </TabsList>
              </DialogHeader>
              <TabsContent value='project'>
                <div className='mb-2'>
                  <span className='bg-accent text-accent-foreground inline-block rounded px-3 py-1 text-xs font-semibold'>
                    state: {JSON.stringify(projectState.value) as string}
                  </span>
                </div>
                <div className='bg-muted max-h-[60vh] overflow-auto rounded p-2'>
                  <JSONTree data={projectContext} hideRoot={true} />
                </div>
              </TabsContent>
            </Tabs>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
