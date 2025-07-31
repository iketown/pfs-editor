import React, { useEffect } from 'react';
import { useSharedMachineContext } from './SharedMachineContext';
import { useEditActorRef } from './FsEditActorContext';
import { useMotionActorRef } from './MotionActorContext';

export const MachineCommunicationExample: React.FC = () => {
  const shared = useSharedMachineContext();
  const fsEditActor = useEditActorRef();
  const motionActor = useMotionActorRef();

  // Listen for events from fsEdit machine
  useEffect(() => {
    const unsubscribe = shared.addFsEditListener((event, data) => {
      console.log('Motion machine received fsEdit event:', event, data);

      // Handle specific events from fsEdit machine
      switch (event) {
        case 'VIDEO_TIME_UPDATE':
          motionActor.send({ type: 'VIDEO_TIME_UPDATE', time: data.time });
          break;
        case 'SET_PLAYER_REF':
          motionActor.send({
            type: 'SET_PLAYER_REF',
            playerRef: data.playerRef
          });
          break;
        case 'SET_CHART_REF':
          motionActor.send({ type: 'SET_CHART_REF', chartRef: data.chartRef });
          break;
        case 'SET_PROJECT_ID':
          motionActor.send({
            type: 'SET_PROJECT_ID',
            projectId: data.projectId
          });
          break;
      }
    });

    return unsubscribe;
  }, [shared, motionActor]);

  // Listen for events from motion machine
  useEffect(() => {
    const unsubscribe = shared.addMotionListener((event, data) => {
      console.log('FsEdit machine received motion event:', event, data);

      // Handle specific events from motion machine
      switch (event) {
        case 'ROI_SELECTED':
          // Update fsEdit machine when ROI is selected
          fsEditActor.send({ type: 'SELECT_NODE', actionId: data.roiId });
          break;
        case 'ROI_UPDATED':
          // Notify fsEdit machine of ROI changes
          console.log('ROI updated:', data);
          break;
      }
    });

    return unsubscribe;
  }, [shared, fsEditActor]);

  // Example: Send event from fsEdit to motion machine
  const handleFsEditToMotion = () => {
    shared.notifyMotion('FS_EDIT_EVENT', {
      type: 'VIDEO_TIME_UPDATE',
      time: shared.videoTime
    });
  };

  // Example: Send event from motion to fsEdit machine
  const handleMotionToFsEdit = () => {
    shared.notifyFsEdit('MOTION_EVENT', {
      type: 'ROI_SELECTED',
      roiId: 'example-roi-id'
    });
  };

  return (
    <div className='rounded border p-4'>
      <h3 className='mb-4 text-lg font-semibold'>
        Machine Communication Example
      </h3>

      <div className='space-y-2'>
        <button
          onClick={handleFsEditToMotion}
          className='rounded bg-blue-500 px-4 py-2 text-white'
        >
          Send FsEdit → Motion Event
        </button>

        <button
          onClick={handleMotionToFsEdit}
          className='rounded bg-green-500 px-4 py-2 text-white'
        >
          Send Motion → FsEdit Event
        </button>
      </div>

      <div className='mt-4 text-sm text-gray-600'>
        <p>Current video time: {shared.videoTime}</p>
        <p>Project ID: {shared.projectId || 'None'}</p>
      </div>
    </div>
  );
};
