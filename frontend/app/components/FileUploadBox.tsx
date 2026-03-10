'use client';

import { useRef, useState } from 'react';

type UploadStatus = 'idle' | 'uploading' | 'success' | 'error';

interface FileUploadBoxProps {
  title: string;
  status: UploadStatus;
  fileName?: string;
  error?: string;
  onFileSelect: (file: File) => void;
}

export function FileUploadBox({ title, status, fileName, error, onFileSelect }: FileUploadBoxProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragDepth, setDragDepth] = useState(0);

  const isDragHover = dragDepth > 0;

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragDepth(0);
    const file = e.dataTransfer.files?.[0];
    if (file) onFileSelect(file);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragDepth((d) => d + 1);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragDepth((d) => Math.max(0, d - 1));
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) onFileSelect(file);
    e.target.value = '';
  };

  const borderClass =
    status === 'success'
      ? 'border-green-400 bg-green-50'
      : status === 'error'
      ? 'border-red-400 bg-red-50'
      : status === 'uploading'
      ? 'border-blue-400 bg-blue-50'
      : isDragHover
      ? 'border-blue-400 bg-blue-50'
      : 'border-gray-300 hover:border-blue-400 hover:bg-blue-50';

  return (
    <div className="bg-white rounded-lg shadow-lg p-8 h-80 flex flex-col">
      <h3 className="text-2xl font-bold text-gray-700 mb-4">{title}</h3>
      <div className="flex-1 flex items-center justify-center">
        <div
          className={`border-4 border-dashed rounded-lg p-12 flex flex-col items-center justify-center w-full h-full transition-all cursor-pointer ${borderClass}`}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onClick={() => status === 'idle' && fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            onChange={handleFileInputChange}
            className="hidden"
          />

          {status === 'idle' && (
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
                <path d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              <p className="text-gray-500 text-sm">Drag & drop or click to upload</p>
              <p className="text-gray-400 text-xs mt-2">CSV files only</p>
            </>
          )}

          {status === 'uploading' && (
            <>
              <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-500 mb-4" />
              <p className="text-blue-600 text-sm font-semibold">Uploading...</p>
              <p className="text-gray-600 text-xs mt-2">{fileName}</p>
            </>
          )}

          {status === 'success' && (
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
                <path d="M5 13l4 4L19 7" />
              </svg>
              <p className="text-green-600 text-sm font-semibold">Upload Successful!</p>
              <p className="text-gray-600 text-xs mt-2">{fileName}</p>
            </>
          )}

          {status === 'error' && (
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
                <path d="M6 18L18 6M6 6l12 12" />
              </svg>
              <p className="text-red-600 text-sm font-semibold">Upload Failed</p>
              <p className="text-gray-600 text-xs mt-2">{error}</p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
