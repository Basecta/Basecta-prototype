'use client';

import dynamic from 'next/dynamic';

const InteractiveMap = dynamic(() => import('./InteractiveMap'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[450px] flex items-center justify-center bg-gray-100 rounded-lg">
      <div className="flex flex-col items-center gap-3">
        <div className="w-10 h-10 border-4 border-gray-300 border-t-blue-500 rounded-full animate-spin"></div>
        <span className="text-gray-600">Loading map...</span>
      </div>
    </div>
  ),
});

interface MapWrapperProps {
  tiffUrl?: string; // Legacy prop, not used
  imageUrl?: string;
  boundsUrl?: string;
  className?: string;
}

export default function MapWrapper({ imageUrl, boundsUrl, className }: MapWrapperProps) {
  return <InteractiveMap imageUrl={imageUrl} boundsUrl={boundsUrl} className={className} />;
}
