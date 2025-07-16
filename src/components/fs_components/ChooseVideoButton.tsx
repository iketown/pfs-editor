import { Button } from '@/components/ui/button';
import React from 'react';

export default function ChooseVideoButton({
  onVideoSelected,
  done = false,
  children
}: {
  onVideoSelected: (fs: string, file: File) => void;
  done?: boolean;
  children?: React.ReactNode;
}) {
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('video/')) {
      alert('Please upload a video file');
      return;
    }
    const url = URL.createObjectURL(file);
    onVideoSelected(url, file);
  };
  return (
    <Button asChild variant={done ? 'outline' : 'default'}>
      <label>
        {children}
        <input
          type='file'
          accept='video/*'
          style={{ display: 'none' }}
          onChange={handleFileChange}
        />
      </label>
    </Button>
  );
}
