'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { uploadFile } from '@/lib/api';
import { useData } from '@/lib/DataContext';
import { Navbar } from '../components/Navbar';
import { PageLayout } from '../components/PageLayout';
import { FileUploadBox } from '../components/FileUploadBox';
import { LoadingScreen } from '../components/LoadingScreen';

type UploadStatus = 'idle' | 'uploading' | 'success' | 'error';

interface UploadState {
  status: UploadStatus;
  fileName?: string;
  error?: string;
}

type Category = 'hedgerows' | 'waterways' | 'soil';

export default function DataUploadPage() {
  const router = useRouter();
  const { triggerCategoryUpload } = useData();
  const [user, setUser] = useState<any>(null);
  const [uploadStates, setUploadStates] = useState<Record<Category, UploadState>>({
    hedgerows: { status: 'idle' },
    waterways: { status: 'idle' },
    soil: { status: 'idle' },
  });

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    if (!token || !userData) {
      router.push('/login');
      return;
    }
    setUser(JSON.parse(userData));
  }, [router]);

  const handleFileSelect = async (file: File, category: Category) => {
    if (!file.name.endsWith('.csv')) {
      setUploadStates((prev) => ({ ...prev, [category]: { status: 'error', error: 'Only CSV files are allowed' } }));
      setTimeout(() => setUploadStates((prev) => ({ ...prev, [category]: { status: 'idle' } })), 3000);
      return;
    }

    setUploadStates((prev) => ({ ...prev, [category]: { status: 'uploading', fileName: file.name } }));

    try {
      await uploadFile(file, category);
      triggerCategoryUpload(category);
      setUploadStates((prev) => ({ ...prev, [category]: { status: 'success', fileName: file.name } }));
    } catch (err: any) {
      setUploadStates((prev) => ({ ...prev, [category]: { status: 'error', error: err.message, fileName: file.name } }));
    } finally {
      setTimeout(() => setUploadStates((prev) => ({ ...prev, [category]: { status: 'idle' } })), 3000);
    }
  };

  if (!user) return <LoadingScreen />;

  return (
    <PageLayout>
      <Navbar title="Data Upload" backHref="/dashboard" />

      <div className="max-w-7xl mx-auto px-8 py-8">
        <div className="grid grid-cols-3 gap-6">
          {(['hedgerows', 'waterways', 'soil'] as Category[]).map((cat) => (
            <FileUploadBox
              key={cat}
              title={cat.charAt(0).toUpperCase() + cat.slice(1)}
              status={uploadStates[cat].status}
              fileName={uploadStates[cat].fileName}
              error={uploadStates[cat].error}
              onFileSelect={(file) => handleFileSelect(file, cat)}
            />
          ))}
        </div>
      </div>
    </PageLayout>
  );
}
