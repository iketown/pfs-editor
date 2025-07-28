import { useEditSelector } from '@/components/fs_components/FsEditActorContext';

export const useEditState = () => {
  return useEditSelector((state) => {
    if (state.matches('editing')) {
      if (state.matches('editing.fsaction_editing')) return 'fsaction_editing';
      if (state.matches('editing.chapters_editing')) return 'chapters_editing';
      if (state.matches('editing.zoom_editing')) return 'zoom_editing';
      if (state.matches('editing.roi_editing')) return 'roi_editing';
      if (state.matches('editing.motion_editing')) return 'motion_editing';
      return 'playing';
    }
    return 'playing';
  });
};
