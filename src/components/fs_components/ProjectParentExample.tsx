import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  ProjectParentMachineCtx,
  useCurrentMode,
  useProjectState,
  useSwitchMode,
  useSendToFsEdit,
  useSendToRoi,
  useFsEditContext,
  useRoiContext,
  useProjectParentSelector
} from './ProjectParentMachineCtx';

export default function ProjectParentExample() {
  const currentMode = useCurrentMode();
  const projectState = useProjectState();
  const switchMode = useSwitchMode();
  const sendToFsEdit = useSendToFsEdit();
  const sendToRoi = useSendToRoi();
  const fsEditContext = useFsEditContext();
  const roiContext = useRoiContext();
  const currentTime = useProjectParentSelector(
    (state) => state.context.currentTime
  );

  const handleSetProjectId = () => {
    sendToFsEdit({ type: 'SET_PROJECT_ID', projectId: 'example-project-123' });
    sendToRoi({ type: 'SET_PROJECT_ID', projectId: 'example-project-123' });
  };

  const handleSetPlayerRef = () => {
    // This would typically be called with an actual video ref
    console.log('Setting player ref...');
  };

  return (
    <div className='space-y-6 p-6'>
      <Card>
        <CardHeader>
          <CardTitle>Project Parent Machine Example</CardTitle>
        </CardHeader>
        <CardContent className='space-y-4'>
          <div className='flex items-center gap-2'>
            <span className='text-sm font-medium'>Project State:</span>
            <Badge variant={projectState === 'ready' ? 'default' : 'secondary'}>
              {projectState}
            </Badge>
          </div>

          <div className='flex items-center gap-2'>
            <span className='text-sm font-medium'>Current Mode:</span>
            <Badge variant='outline'>{currentMode}</Badge>
          </div>

          <div className='space-y-2'>
            <h4 className='text-sm font-medium'>Mode Switching:</h4>
            <div className='flex flex-wrap gap-2'>
              <Button
                size='sm'
                variant={currentMode === 'playing' ? 'default' : 'outline'}
                onClick={switchMode.switchToPlaying}
              >
                Playing
              </Button>
              <Button
                size='sm'
                variant={
                  currentMode === 'chapters_editing' ? 'default' : 'outline'
                }
                onClick={switchMode.switchToChaptersEditing}
              >
                Chapters
              </Button>
              <Button
                size='sm'
                variant={currentMode === 'roi_editing' ? 'default' : 'outline'}
                onClick={switchMode.switchToRoiEditing}
              >
                ROI
              </Button>
              <Button
                size='sm'
                variant={currentMode === 'zoom_editing' ? 'default' : 'outline'}
                onClick={switchMode.switchToZoomEditing}
              >
                Zoom
              </Button>
              <Button
                size='sm'
                variant={
                  currentMode === 'motion_editing' ? 'default' : 'outline'
                }
                onClick={switchMode.switchToMotionEditing}
              >
                Motion
              </Button>
              <Button
                size='sm'
                variant={
                  currentMode === 'fsaction_editing' ? 'default' : 'outline'
                }
                onClick={switchMode.switchToFsActionEditing}
              >
                FS Actions
              </Button>
            </div>
          </div>

          <div className='space-y-2'>
            <h4 className='text-sm font-medium'>Actions:</h4>
            <div className='flex flex-wrap gap-2'>
              <Button size='sm' onClick={handleSetProjectId}>
                Set Project ID
              </Button>
              <Button size='sm' onClick={handleSetPlayerRef}>
                Set Player Ref
              </Button>
            </div>
          </div>

          <div className='grid grid-cols-2 gap-4'>
            <Card>
              <CardHeader>
                <CardTitle className='text-sm'>FS Edit Context</CardTitle>
              </CardHeader>
              <CardContent>
                <div className='space-y-1 text-xs'>
                  <div>Project ID: {fsEditContext?.projectId || 'null'}</div>
                  <div>Current Time: {currentTime || 0}</div>
                  <div>Video Duration: {fsEditContext?.videoDuration || 0}</div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className='text-sm'>ROI Context</CardTitle>
              </CardHeader>
              <CardContent>
                <div className='space-y-1 text-xs'>
                  <div>Project ID: {roiContext?.projectId || 'null'}</div>
                  <div>Selected ROI: {roiContext?.selectedROIid || 'null'}</div>
                  <div>Active ROI: {roiContext?.activeROIid || 'null'}</div>
                </div>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
