import React from 'react';

// OLD WAY (any-typed)
// import { useRoiSelector } from './ProjectParentMachineCtx';
// const selectedRoiId = useRoiSelector((state: any) => state.context.selectedROIid);

// NEW WAY (properly typed)
import { useRoiSelector } from './typedSelectors';
const selectedRoiId = useRoiSelector((state) => state.context.selectedROIid);
//                                                                    ^^^^ Full IntelliSense here!

export const MigrationExample: React.FC = () => {
  return (
    <div>
      <h3>Migration Guide</h3>

      <h4>Before (any-typed):</h4>
      <pre>{`
import { useRoiSelector } from './ProjectParentMachineCtx';
const selectedRoiId = useRoiSelector((state: any) => state.context.selectedROIid);
      `}</pre>

      <h4>After (properly typed):</h4>
      <pre>{`
import { useRoiSelector } from './typedSelectors';
const selectedRoiId = useRoiSelector((state) => state.context.selectedROIid);
      `}</pre>

      <p>
        <strong>Benefits:</strong>
      </p>
      <ul>
        <li>✅ Full IntelliSense and autocomplete</li>
        <li>✅ Type checking for context properties</li>
        <li>✅ No more `any` types</li>
        <li>✅ Same function names, just change the import</li>
      </ul>
    </div>
  );
};
