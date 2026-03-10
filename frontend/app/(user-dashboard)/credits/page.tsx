'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { uploadFile } from '@/lib/api';
import { useData } from '@/lib/DataContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { UploadIcon, CheckCircleIcon, XCircleIcon, LoaderIcon } from 'lucide-react';

type UploadStatus = 'idle' | 'uploading' | 'success' | 'error';

interface UploadState {
  status: UploadStatus;
  fileName?: string;
  error?: string;
}

export default function DataUploadPage() {
  const router = useRouter();
  const { triggerCategoryUpload } = useData();
  const [user, setUser] = useState<any>(null);
  const [uploadStates, setUploadStates] = useState<{
    hedgerows: UploadState;
    waterways: UploadState;
    soil: UploadState;
  }>({
    hedgerows: { status: 'idle' },
    waterways: { status: 'idle' },
    soil: { status: 'idle' },
  });

  const [dragDepth, setDragDepth] = useState<{
    hedgerows: number;
    waterways: number;
    soil: number;
  }>({
    hedgerows: 0,
    waterways: 0,
    soil: 0,
  });

  const fileInputRefs = {
    hedgerows: useRef<HTMLInputElement>(null),
    waterways: useRef<HTMLInputElement>(null),
    soil: useRef<HTMLInputElement>(null),
  };

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');

    if (!token || !userData) {
      router.push('/login');
      return;
    }

    setUser(JSON.parse(userData));
  }, [router]);

  const handleFileSelect = async (file: File, category: 'hedgerows' | 'waterways' | 'soil') => {
    if (!file.name.endsWith('.csv')) {
      setUploadStates(prev => ({
        ...prev,
        [category]: { status: 'error', error: 'Only CSV files are allowed' }
      }));
      setTimeout(() => {
        setUploadStates(prev => ({ ...prev, [category]: { status: 'idle' } }));
      }, 3000);
      return;
    }

    setUploadStates(prev => ({
      ...prev,
      [category]: { status: 'uploading', fileName: file.name }
    }));

    try {
      await uploadFile(file, category);
      triggerCategoryUpload(category);
      setUploadStates(prev => ({
        ...prev,
        [category]: { status: 'success', fileName: file.name }
      }));
      setTimeout(() => {
        setUploadStates(prev => ({ ...prev, [category]: { status: 'idle' } }));
      }, 3000);
    } catch (error: any) {
      setUploadStates(prev => ({
        ...prev,
        [category]: { status: 'error', error: error.message, fileName: file.name }
      }));
      setTimeout(() => {
        setUploadStates(prev => ({ ...prev, [category]: { status: 'idle' } }));
      }, 3000);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>, category: 'hedgerows' | 'waterways' | 'soil') => {
    e.preventDefault();
    e.stopPropagation();
    setDragDepth(prev => ({ ...prev, [category]: 0 }));
    const files = e.dataTransfer.files;
    if (files && files[0]) {
      handleFileSelect(files[0], category);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>, category: 'hedgerows' | 'waterways' | 'soil') => {
    e.preventDefault();
    e.stopPropagation();
    setDragDepth(prev => ({ ...prev, [category]: prev[category] + 1 }));
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>, category: 'hedgerows' | 'waterways' | 'soil') => {
    e.preventDefault();
    e.stopPropagation();
    setDragDepth(prev => ({
      ...prev,
      [category]: Math.max(0, prev[category] - 1)
    }));
  };

  const handleClick = (category: 'hedgerows' | 'waterways' | 'soil') => {
    fileInputRefs[category].current?.click();
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>, category: 'hedgerows' | 'waterways' | 'soil') => {
    const files = e.target.files;
    if (files && files[0]) {
      handleFileSelect(files[0], category);
    }
    e.target.value = '';
  };

  const renderUploadBox = (category: 'hedgerows' | 'waterways' | 'soil', title: string) => {
    const state = uploadStates[category];
    const isDragHover = dragDepth[category] > 0;

    return (
      <Card key={category}>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <div
            className={`border-2 border-dashed rounded-lg p-8 flex flex-col items-center justify-center min-h-[200px] transition-all cursor-pointer
              ${state.status === 'idle' && !isDragHover ? 'border-muted-foreground/25 hover:border-primary/50 hover:bg-accent' : ''}
              ${state.status === 'idle' && isDragHover ? 'border-primary bg-accent' : ''}
              ${state.status === 'uploading' ? 'border-primary bg-accent' : ''}
              ${state.status === 'success' ? 'border-green-500 bg-green-50 dark:bg-green-950/20' : ''}
              ${state.status === 'error' ? 'border-destructive bg-red-50 dark:bg-red-950/20' : ''}
            `}
            onDrop={(e) => handleDrop(e, category)}
            onDragOver={handleDragOver}
            onDragEnter={(e) => handleDragEnter(e, category)}
            onDragLeave={(e) => handleDragLeave(e, category)}
            onClick={() => state.status === 'idle' && handleClick(category)}
          >
            <input
              ref={fileInputRefs[category]}
              type="file"
              accept=".csv"
              onChange={(e) => handleFileInputChange(e, category)}
              className="hidden"
            />

            {state.status === 'idle' && (
              <>
                <UploadIcon className="size-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground text-sm">Drag & drop or click to upload</p>
                <p className="text-muted-foreground/60 text-xs mt-2">CSV files only</p>
              </>
            )}

            {state.status === 'uploading' && (
              <>
                <LoaderIcon className="size-12 text-primary mb-4 animate-spin" />
                <p className="text-primary text-sm font-semibold">Uploading...</p>
                <p className="text-muted-foreground text-xs mt-2">{state.fileName}</p>
              </>
            )}

            {state.status === 'success' && (
              <>
                <CheckCircleIcon className="size-12 text-green-500 mb-4" />
                <p className="text-green-600 text-sm font-semibold">Upload Successful!</p>
                <p className="text-muted-foreground text-xs mt-2">{state.fileName}</p>
              </>
            )}

            {state.status === 'error' && (
              <>
                <XCircleIcon className="size-12 text-destructive mb-4" />
                <p className="text-destructive text-sm font-semibold">Upload Failed</p>
                <p className="text-muted-foreground text-xs mt-2">{state.error}</p>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 px-4 lg:px-6 @xl/main:grid-cols-3">
      {renderUploadBox('hedgerows', 'Hedgerows')}
      {renderUploadBox('waterways', 'Waterways')}
      {renderUploadBox('soil', 'Soil')}
    </div>
  );
}
