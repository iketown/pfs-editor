import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog';
import { Icons } from '@/components/icons';
import { JSONTree } from 'react-json-tree';

export default function ContextView({
  context,
  state
}: {
  context: object;
  state: string;
}) {
  const [open, setOpen] = useState(false);
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
            <DialogHeader>
              <DialogTitle>XState Context</DialogTitle>
            </DialogHeader>
            <div className='mb-2'>
              <span className='bg-accent text-accent-foreground inline-block rounded px-3 py-1 text-xs font-semibold'>
                state: {state}
              </span>
            </div>
            <div className='bg-muted max-h-[60vh] overflow-auto rounded p-2'>
              <JSONTree data={context} hideRoot={true} />
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
