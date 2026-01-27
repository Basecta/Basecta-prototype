'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { uploadFile } from '@/lib/api';
import { useData } from '@/lib/DataContext';

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
    // Validate CSV
    if (!file.name.endsWith('.csv')) {
      setUploadStates(prev => ({
        ...prev,
        [category]: { status: 'error', error: 'Only CSV files are allowed' }
      }));
      setTimeout(() => {
        setUploadStates(prev => ({
          ...prev,
          [category]: { status: 'idle' }
        }));
      }, 3000);
      return;
    }

    // Set uploading status
    setUploadStates(prev => ({
      ...prev,
      [category]: { status: 'uploading', fileName: file.name }
    }));

    try {
      await uploadFile(file, category);

      // Trigger the data update for this specific category
      triggerCategoryUpload(category);

      // Set success status
      setUploadStates(prev => ({
        ...prev,
        [category]: { status: 'success', fileName: file.name }
      }));

      // Reset after 3 seconds
      setTimeout(() => {
        setUploadStates(prev => ({
          ...prev,
          [category]: { status: 'idle' }
        }));
      }, 3000);
    } catch (error: any) {
      setUploadStates(prev => ({
        ...prev,
        [category]: { status: 'error', error: error.message, fileName: file.name }
      }));

      // Reset after 3 seconds
      setTimeout(() => {
        setUploadStates(prev => ({
          ...prev,
          [category]: { status: 'idle' }
        }));
      }, 3000);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>, category: 'hedgerows' | 'waterways' | 'soil') => {
    e.preventDefault();
    e.stopPropagation();

    // Reset drag depth
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
    // Reset input so the same file can be uploaded again
    e.target.value = '';
  };

  const renderUploadBox = (category: 'hedgerows' | 'waterways' | 'soil', title: string) => {
    const state = uploadStates[category];
    const isDragHover = dragDepth[category] > 0;

    return (
      <div className="bg-white rounded-lg shadow-lg p-8 h-80 flex flex-col">
        <h3 className="text-2xl font-bold text-gray-700 mb-4">{title}</h3>
        <div className="flex-1 flex items-center justify-center">
          <div
            className={`border-4 border-dashed rounded-lg p-12 flex flex-col items-center justify-center w-full h-full transition-all cursor-pointer
              ${state.status === 'idle' && !isDragHover ? 'border-gray-300 hover:border-blue-400 hover:bg-blue-50' : ''}
              ${state.status === 'idle' && isDragHover ? 'border-blue-400 bg-blue-50' : ''}
              ${state.status === 'uploading' ? 'border-blue-400 bg-blue-50' : ''}
              ${state.status === 'success' ? 'border-green-400 bg-green-50' : ''}
              ${state.status === 'error' ? 'border-red-400 bg-red-50' : ''}
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
                <svg
                  className="w-16 h-16 text-gray-400 mb-4"
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path>
                </svg>
                <p className="text-gray-500 text-sm">Drag & drop or click to upload</p>
                <p className="text-gray-400 text-xs mt-2">CSV files only</p>
              </>
            )}

            {state.status === 'uploading' && (
              <>
                <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-500 mb-4"></div>
                <p className="text-blue-600 text-sm font-semibold">Uploading...</p>
                <p className="text-gray-600 text-xs mt-2">{state.fileName}</p>
              </>
            )}

            {state.status === 'success' && (
              <>
                <svg
                  className="w-16 h-16 text-green-500 mb-4"
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path d="M5 13l4 4L19 7"></path>
                </svg>
                <p className="text-green-600 text-sm font-semibold">Upload Successful!</p>
                <p className="text-gray-600 text-xs mt-2">{state.fileName}</p>
              </>
            )}

            {state.status === 'error' && (
              <>
                <svg
                  className="w-16 h-16 text-red-500 mb-4"
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path d="M6 18L18 6M6 6l12 12"></path>
                </svg>
                <p className="text-red-600 text-sm font-semibold">Upload Failed</p>
                <p className="text-gray-600 text-xs mt-2">{state.error}</p>
              </>
            )}
          </div>
        </div>
      </div>
    );
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <nav className="bg-white shadow-md">
        <div className="w-full px-4 py-4">
          <div className="flex items-center justify-center relative">
            <Link href="/dashboard" className="absolute left-0 text-blue-500 hover:text-blue-700">
              ← Back to Dashboard
            </Link>
            <h1 className="text-2xl font-bold text-gray-800">Data Upload</h1>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-3 gap-6">
          {renderUploadBox('hedgerows', 'Hedgerows')}
          {renderUploadBox('waterways', 'Waterways')}
          {renderUploadBox('soil', 'Soil')}
        </div>
      </div>
    </div>
  );
}