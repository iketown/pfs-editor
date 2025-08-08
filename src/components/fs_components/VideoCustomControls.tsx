'use client';

import React from 'react';
import { useRoiSelector } from './ProjectParentMachineCtx';
import ROIRangeSlider from './ROIRangeSlider';

const VideoCustomControls: React.FC = () => {
  // Get selected ROI from roi machine
  const selectedROIid = useRoiSelector((state) => state.context.selectedROIid);
  const roisObject = useRoiSelector((state) => state.context.rois);

  // Get the selected ROI object
  const selectedROI = selectedROIid ? roisObject[selectedROIid] : null;

  return <div className='w-full'>{selectedROI && <ROIRangeSlider />}</div>;
};

export default VideoCustomControls;
