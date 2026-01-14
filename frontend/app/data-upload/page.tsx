'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function DataUploadPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    // Check if user is logged in
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');

    if (!token || !userData) {
      router.push('/login');
      return;
    }

    setUser(JSON.parse(userData));
  }, [router]);

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
          {/* Upload Card X */}
          <div className="bg-white rounded-lg shadow-lg p-8 h-80 flex flex-col">
            <h3 className="text-2xl font-bold text-gray-700 mb-4">Hedgerows</h3>
            <div className="flex-1 flex items-center justify-center">
              <div className="border-4 border-dashed border-gray-300 rounded-lg p-12 flex flex-col items-center justify-center hover:border-blue-400 hover:bg-blue-50 transition-all cursor-pointer w-full h-full">
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
              </div>
            </div>
          </div>

          {/* Upload Card Y */}
          <div className="bg-white rounded-lg shadow-lg p-8 h-80 flex flex-col">
            <h3 className="text-2xl font-bold text-gray-700 mb-4">Waterways</h3>
            <div className="flex-1 flex items-center justify-center">
              <div className="border-4 border-dashed border-gray-300 rounded-lg p-12 flex flex-col items-center justify-center hover:border-blue-400 hover:bg-blue-50 transition-all cursor-pointer w-full h-full">
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
              </div>
            </div>
          </div>

          {/* Upload Card Z */}
          <div className="bg-white rounded-lg shadow-lg p-8 h-80 flex flex-col">
            <h3 className="text-2xl font-bold text-gray-700 mb-4">Soil Quality</h3>
            <div className="flex-1 flex items-center justify-center">
              <div className="border-4 border-dashed border-gray-300 rounded-lg p-12 flex flex-col items-center justify-center hover:border-blue-400 hover:bg-blue-50 transition-all cursor-pointer w-full h-full">
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
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}