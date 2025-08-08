import React from 'react';
import {
  useRoiSelector,
  useFsEditSelector,
  useLoaderSelector
} from './typedSelectors';

// Example component showing the typed selectors
export const SelectorExamples: React.FC = () => {
  // Typed selectors with full IntelliSense!
  const selectedRoiId = useRoiSelector((state) => state.context.selectedROIid);
  const videoUrl = useFsEditSelector((state) => state.context.videoUrl);
  const currentProject = useLoaderSelector(
    (state) => state.context.currentProject
  );

  return (
    <div>
      <h3>Typed Selector Examples</h3>

      <p>Selected ROI ID: {selectedRoiId}</p>
      <p>Video URL: {videoUrl}</p>
      <p>Current Project: {currentProject?.name}</p>
    </div>
  );
};

// Example of creating a custom hook with typed selectors
export const useTypedRoiData = () => {
  return {
    selectedRoiId: useRoiSelector((state) => state.context.selectedROIid),
    activeRoiId: useRoiSelector((state) => state.context.activeROIid),
    rois: useRoiSelector((state) => state.context.rois),
    videoFps: useRoiSelector((state) => state.context.videoFps)
  };
};

// Example of creating a custom hook with typed FSEdit selectors
export const useTypedFsEditData = () => {
  return {
    videoUrl: useFsEditSelector((state) => state.context.videoUrl),
    videoTime: useFsEditSelector((state) => state.context.videoTime),
    videoDuration: useFsEditSelector((state) => state.context.videoDuration),
    selectedActionIds: useFsEditSelector(
      (state) => state.context.selectedActionIds
    ),
    rangeStart: useFsEditSelector((state) => state.context.rangeStart),
    rangeEnd: useFsEditSelector((state) => state.context.rangeEnd)
  };
};
