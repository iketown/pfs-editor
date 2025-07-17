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
import { FsEditActorContext, useEditSelector } from './FsEditActorContext';
import { useMotionSelector } from './MotionActorContext';

export default function ContextView() {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState('edit');
  const editContext = FsEditActorContext.useSelector((state) => state.context);
  const editState = useEditSelector((state) => state);
  const motionContext = useMotionSelector((s) => s?.context);
  const motionState = useMotionSelector((state) =>
    state?.value ? String(state.value) : 'no state'
  );

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
                  <TabsTrigger value='edit'>Edit Context</TabsTrigger>
                  <TabsTrigger value='motion'>Motion Context</TabsTrigger>
                </TabsList>
              </DialogHeader>
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
              <TabsContent value='motion'>
                <div className='mb-2'>
                  <span className='bg-accent text-accent-foreground inline-block rounded px-3 py-1 text-xs font-semibold'>
                    state: {motionState}
                  </span>
                </div>
                <div className='bg-muted max-h-[60vh] overflow-auto rounded p-2'>
                  <JSONTree data={motionContext} hideRoot={true} />
                </div>
              </TabsContent>
            </Tabs>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
