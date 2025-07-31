import React, { createContext, useContext, useCallback, useState } from 'react';

type SharedMachineContextType = {
  // Shared state
  videoTime: number;
  playerRef: React.RefObject<HTMLVideoElement> | null;
  chartRef: any;
  projectId: string | null;

  // Shared actions
  setVideoTime: (time: number) => void;
  setPlayerRef: (ref: React.RefObject<HTMLVideoElement>) => void;
  setChartRef: (ref: any) => void;
  setProjectId: (id: string) => void;

  // Cross-machine communication
  notifyFsEdit: (event: string, data?: any) => void;
  notifyMotion: (event: string, data?: any) => void;

  // Event listeners
  addFsEditListener: (
    listener: (event: string, data?: any) => void
  ) => () => void;
  addMotionListener: (
    listener: (event: string, data?: any) => void
  ) => () => void;
};

const SharedMachineContext = createContext<SharedMachineContextType | null>(
  null
);

export const useSharedMachineContext = () => {
  const context = useContext(SharedMachineContext);
  if (!context) {
    throw new Error(
      'useSharedMachineContext must be used within SharedMachineProvider'
    );
  }
  return context;
};

export const SharedMachineProvider: React.FC<{ children: React.ReactNode }> = ({
  children
}) => {
  const [videoTime, setVideoTimeState] = useState(0);
  const [playerRef, setPlayerRefState] =
    useState<React.RefObject<HTMLVideoElement> | null>(null);
  const [chartRef, setChartRefState] = useState<any>(null);
  const [projectId, setProjectIdState] = useState<string | null>(null);

  const [projectListeners, setFsEditListeners] = useState<
    Array<(event: string, data?: any) => void>
  >([]);
  const [motionListeners, setMotionListeners] = useState<
    Array<(event: string, data?: any) => void>
  >([]);

  const setVideoTime = useCallback((time: number) => {
    setVideoTimeState(time);
  }, []);

  const setPlayerRef = useCallback((ref: React.RefObject<HTMLVideoElement>) => {
    setPlayerRefState(ref);
  }, []);

  const setChartRef = useCallback((ref: any) => {
    setChartRefState(ref);
  }, []);

  const setProjectId = useCallback((id: string) => {
    setProjectIdState(id);
  }, []);

  const notifyFsEdit = useCallback(
    (event: string, data?: any) => {
      projectListeners.forEach((listener) => listener(event, data));
    },
    [projectListeners]
  );

  const notifyMotion = useCallback(
    (event: string, data?: any) => {
      motionListeners.forEach((listener) => listener(event, data));
    },
    [motionListeners]
  );

  const addFsEditListener = useCallback(
    (listener: (event: string, data?: any) => void) => {
      setFsEditListeners((prev) => [...prev, listener]);
      return () => {
        setFsEditListeners((prev) => prev.filter((l) => l !== listener));
      };
    },
    []
  );

  const addMotionListener = useCallback(
    (listener: (event: string, data?: any) => void) => {
      setMotionListeners((prev) => [...prev, listener]);
      return () => {
        setMotionListeners((prev) => prev.filter((l) => l !== listener));
      };
    },
    []
  );

  const value: SharedMachineContextType = {
    videoTime,
    playerRef,
    chartRef,
    projectId,
    setVideoTime,
    setPlayerRef,
    setChartRef,
    setProjectId,
    notifyFsEdit,
    notifyMotion,
    addFsEditListener,
    addMotionListener
  };

  return (
    <SharedMachineContext.Provider value={value}>
      {children}
    </SharedMachineContext.Provider>
  );
};
