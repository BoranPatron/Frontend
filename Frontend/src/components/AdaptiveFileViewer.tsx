import React from 'react';
import InlineFileViewer from './InlineFileViewer';
import MobileInlineFileViewer from './MobileInlineFileViewer';
import { useResponsiveViewer } from '../hooks/useResponsiveViewer';

interface AdaptiveFileViewerProps {
  fileUrl: string;
  fileName?: string;
  title?: string;
  onClose: () => void;
}

const AdaptiveFileViewer: React.FC<AdaptiveFileViewerProps> = (props) => {
  const { viewerType } = useResponsiveViewer();

  if (viewerType === 'mobile') {
    return <MobileInlineFileViewer {...props} />;
  }

  return <InlineFileViewer {...props} />;
};

export default AdaptiveFileViewer;