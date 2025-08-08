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
import {
  ProjectParentMachineCtx,
  useProjectParentSelector,
  useCurrentMode,
  useProjectState,
  useFsEditSelector,
  useRoiSelector,
  useChapterSelector
} from './ProjectParentMachineCtx';

export default function ContextView() {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState('parent');
  const editContext = useFsEditSelector((state) => state.context);
  const editState = useFsEditSelector((state) => state);
  const roiContext = useRoiSelector((s) => s?.context);
  const roiState = useRoiSelector((state) => state);
  const chapterContext = useChapterSelector((s) => s?.context);
  const chapterState = useChapterSelector((state) => state);
  const projectParentContext = useProjectParentSelector(
    (state) => state.context
  );
  const projectParentState = useProjectParentSelector((state) => state);
  const currentMode = useCurrentMode();
  const projectState = useProjectState();

  return (
    <div>
      <div className='fixed top-6 right-6 z-50'>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <button
              className='bg-background hover:bg-accent flex items-center justify-center rounded-full border p-3 shadow-lg transition-colors'
              aria-label='Show XState Context'
            >
              <Icons.settings className='h-6 w-6' />
            </button>
          </DialogTrigger>
          <DialogContent className='min-h-[60vh] w-full max-w-3xl'>
            <Tabs value={tab} onValueChange={setTab}>
              <DialogHeader>
                {/* <DialogTitle>XState Context</DialogTitle> */}
                <TabsList>
                  <TabsTrigger value='parent'>Parent Context</TabsTrigger>
                  <TabsTrigger value='edit'>Edit Context</TabsTrigger>
                  <TabsTrigger value='roi'>Roi Context</TabsTrigger>
                  <TabsTrigger value='chapter'>Chapter Context</TabsTrigger>
                </TabsList>
              </DialogHeader>
              <TabsContent value='parent'>
                <div className='mb-2 space-y-2'>
                  <div className='flex gap-2'>
                    <span className='bg-accent text-accent-foreground inline-block rounded px-3 py-1 text-xs font-semibold'>
                      project state: {projectState}
                    </span>
                    <span className='bg-accent text-accent-foreground inline-block rounded px-3 py-1 text-xs font-semibold'>
                      current mode: {currentMode}
                    </span>
                  </div>
                  <div className='bg-accent text-accent-foreground inline-block rounded px-3 py-1 text-xs font-semibold'>
                    state: {JSON.stringify(projectParentState.value) as string}
                  </div>
                </div>
                <div className='bg-muted max-h-[60vh] overflow-auto rounded p-2'>
                  <JSONTree data={projectParentContext} hideRoot={true} />
                </div>
              </TabsContent>
              <TabsContent value='edit'>
                <div className='mb-2'>
                  <span className='bg-accent text-accent-foreground inline-block rounded px-3 py-1 text-xs font-semibold'>
                    state: {JSON.stringify(editState.value) as string}
                  </span>
                </div>
                <div className='bg-muted max-h-[60vh] overflow-auto rounded p-2'>
                  <JSONTree data={editContext} hideRoot={true} />
                </div>
              </TabsContent>
              <TabsContent value='roi'>
                <div className='mb-2'>
                  <span className='bg-accent text-accent-foreground inline-block rounded px-3 py-1 text-xs font-semibold'>
                    state: {JSON.stringify(roiState.value) as string}
                  </span>
                </div>
                <div className='bg-muted max-h-[60vh] overflow-auto rounded p-2'>
                  <JSONTree data={roiContext} hideRoot={true} />
                </div>
              </TabsContent>
              <TabsContent value='chapter'>
                <div className='mb-2'>
                  <span className='bg-accent text-accent-foreground inline-block rounded px-3 py-1 text-xs font-semibold'>
                    state: {JSON.stringify(chapterState.value) as string}
                  </span>
                </div>
                <div className='bg-muted max-h-[60vh] overflow-auto rounded p-2'>
                  <JSONTree data={chapterContext} hideRoot={true} />
                </div>
              </TabsContent>
            </Tabs>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
