'use client';

import React from 'react';
import { useMotionSelector } from './MotionActorContext';
import ROIRangeSlider from './ROIRangeSlider';

const VideoCustomControls: React.FC = () => {
  // Get selected ROI from motion machine
  const selectedROIid = useMotionSelector(
    (state) => state.context.selectedROIid
  );
  const roisObject = useMotionSelector((state) => state.context.rois);

  // Get the selected ROI object
  const selectedROI = selectedROIid ? roisObject[selectedROIid] : null;

  return (
    <div className='w-full'>
      {selectedROI && <ROIRangeSlider roi={selectedROI} />}
    </div>
  );
};

export default VideoCustomControls;
