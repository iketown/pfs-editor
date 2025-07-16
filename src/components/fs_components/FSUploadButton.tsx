'use client';

import { Button } from '@/components/ui/button';
import { parseFunscript } from '@/lib/funscript';
import type { FunscriptObject } from '@/types/funscript';
import React from 'react';

export default function FunscriptUploadButton({
  onFSParsed,
  done = false,
  children
}: {
  onFSParsed: (fs: FunscriptObject) => void;
  done?: boolean;
  children?: React.ReactNode;
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
    <Button asChild variant={done ? 'outline' : 'default'}>
      <label>
        {children}
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
