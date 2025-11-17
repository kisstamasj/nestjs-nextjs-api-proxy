/**
 * File Upload and Download Examples
 * 
 * This file demonstrates how to use the API proxy for file operations
 */

'use client';

import { useState } from 'react';

// ==========================================
// EXAMPLE 1: File Upload (Single File)
// ==========================================
export function FileUploadSingle() {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setProgress(0);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('description', 'My uploaded file');

      const response = await fetch('/api/files/upload', {
        method: 'POST',
        body: formData, // Don't set Content-Type, browser sets it with boundary
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Upload failed');
      }

      const result = await response.json();
      console.log('Upload successful:', result);
      alert(`File uploaded: ${result.filename}`);
    } catch (error) {
      console.error('Upload error:', error);
      alert('Upload failed: ' + (error as Error).message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="p-4 border rounded">
      <h3 className="text-lg font-bold mb-2">Single File Upload</h3>
      <input
        type="file"
        onChange={handleFileUpload}
        disabled={uploading}
        className="mb-2"
      />
      {uploading && <p>Uploading... {progress}%</p>}
    </div>
  );
}

// ==========================================
// EXAMPLE 2: File Upload (Multiple Files)
// ==========================================
export function FileUploadMultiple() {
  const [uploading, setUploading] = useState(false);

  const handleMultipleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);

    try {
      const formData = new FormData();
      
      // Append multiple files
      Array.from(files).forEach((file, index) => {
        formData.append(`files`, file); // or `file${index}` depending on backend
      });

      formData.append('folder', 'uploads/2024');

      const response = await fetch('/api/files/upload-multiple', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      const result = await response.json();
      console.log('Upload successful:', result);
      alert(`${result.count} files uploaded`);
    } catch (error) {
      console.error('Upload error:', error);
      alert('Upload failed');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="p-4 border rounded">
      <h3 className="text-lg font-bold mb-2">Multiple Files Upload</h3>
      <input
        type="file"
        multiple
        onChange={handleMultipleFileUpload}
        disabled={uploading}
        className="mb-2"
      />
      {uploading && <p>Uploading...</p>}
    </div>
  );
}

// ==========================================
// EXAMPLE 3: File Upload with Progress
// ==========================================
export function FileUploadWithProgress() {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  const handleFileUploadWithProgress = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setProgress(0);

    try {
      const formData = new FormData();
      formData.append('file', file);

      // Using XMLHttpRequest for progress tracking
      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest();

        xhr.upload.addEventListener('progress', (e) => {
          if (e.lengthComputable) {
            const percentComplete = Math.round((e.loaded / e.total) * 100);
            setProgress(percentComplete);
          }
        });

        xhr.addEventListener('load', () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve();
          } else {
            reject(new Error(`Upload failed with status ${xhr.status}`));
          }
        });

        xhr.addEventListener('error', () => reject(new Error('Upload failed')));
        xhr.addEventListener('abort', () => reject(new Error('Upload cancelled')));

        xhr.open('POST', '/api/files/upload');
        xhr.send(formData);
      });

      alert('Upload complete!');
    } catch (error) {
      console.error('Upload error:', error);
      alert('Upload failed');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="p-4 border rounded">
      <h3 className="text-lg font-bold mb-2">Upload with Progress</h3>
      <input
        type="file"
        onChange={handleFileUploadWithProgress}
        disabled={uploading}
        className="mb-2"
      />
      {uploading && (
        <div className="w-full bg-gray-200 rounded">
          <div
            className="bg-blue-600 text-xs font-medium text-blue-100 text-center p-0.5 leading-none rounded"
            style={{ width: `${progress}%` }}
          >
            {progress}%
          </div>
        </div>
      )}
    </div>
  );
}

// ==========================================
// EXAMPLE 4: Image Upload with Preview
// ==========================================
export function ImageUploadWithPreview() {
  const [preview, setPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      alert('File size must be less than 5MB');
      return;
    }

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result as string);
    };
    reader.readAsDataURL(file);

    setUploading(true);

    try {
      const formData = new FormData();
      formData.append('image', file);
      formData.append('type', 'profile-picture');

      const response = await fetch('/api/images/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      const result = await response.json();
      console.log('Image uploaded:', result);
      alert(`Image uploaded: ${result.url}`);
    } catch (error) {
      console.error('Upload error:', error);
      alert('Upload failed');
      setPreview(null);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="p-4 border rounded">
      <h3 className="text-lg font-bold mb-2">Image Upload with Preview</h3>
      <input
        type="file"
        accept="image/*"
        onChange={handleImageUpload}
        disabled={uploading}
        className="mb-2"
      />
      {preview && (
        <div className="mt-2">
          <img src={preview} alt="Preview" className="max-w-xs rounded" />
        </div>
      )}
      {uploading && <p className="mt-2">Uploading...</p>}
    </div>
  );
}

// ==========================================
// EXAMPLE 5: File Download (Blob)
// ==========================================
export function FileDownload() {
  const [downloading, setDownloading] = useState(false);

  const handleDownload = async (fileId: string, filename: string) => {
    setDownloading(true);

    try {
      const response = await fetch(`/api/files/download/${fileId}`);

      if (!response.ok) {
        throw new Error('Download failed');
      }

      // Get the blob from response
      const blob = await response.blob();

      // Create a download link
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Download error:', error);
      alert('Download failed');
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="p-4 border rounded">
      <h3 className="text-lg font-bold mb-2">File Download</h3>
      <button
        onClick={() => handleDownload('file-123', 'document.pdf')}
        disabled={downloading}
        className="px-4 py-2 bg-blue-500 text-white rounded disabled:bg-gray-400"
      >
        {downloading ? 'Downloading...' : 'Download PDF'}
      </button>
    </div>
  );
}

// ==========================================
// EXAMPLE 6: File Download (Direct URL)
// ==========================================
export function FileDownloadDirect() {
  const handleDirectDownload = (fileId: string, filename: string) => {
    // For authenticated downloads, the proxy will handle the token
    const url = `/api/files/download/${fileId}`;
    
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.target = '_blank'; // Open in new tab if browser blocks download
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="p-4 border rounded">
      <h3 className="text-lg font-bold mb-2">Direct File Download</h3>
      <button
        onClick={() => handleDirectDownload('file-456', 'report.xlsx')}
        className="px-4 py-2 bg-green-500 text-white rounded"
      >
        Download Excel
      </button>
    </div>
  );
}

// ==========================================
// EXAMPLE 7: Image Download/Display
// ==========================================
export function ImageDisplay() {
  const imageId = 'image-789';
  const imageUrl = `/api/images/${imageId}`;

  return (
    <div className="p-4 border rounded">
      <h3 className="text-lg font-bold mb-2">Display Image from API</h3>
      <img
        src={imageUrl}
        alt="API Image"
        className="max-w-md rounded"
        onError={(e) => {
          console.error('Failed to load image');
          (e.target as HTMLImageElement).src = '/placeholder.png';
        }}
      />
    </div>
  );
}

// ==========================================
// EXAMPLE 8: Large File Upload (Chunked)
// ==========================================
export function LargeFileUploadChunked() {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  const handleLargeFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setProgress(0);

    const chunkSize = 1024 * 1024; // 1MB chunks
    const totalChunks = Math.ceil(file.size / chunkSize);

    try {
      // Initiate upload
      const initResponse = await fetch('/api/files/upload-init', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          filename: file.name,
          filesize: file.size,
          totalChunks,
        }),
      });

      const { uploadId } = await initResponse.json();

      // Upload chunks
      for (let i = 0; i < totalChunks; i++) {
        const start = i * chunkSize;
        const end = Math.min(start + chunkSize, file.size);
        const chunk = file.slice(start, end);

        const formData = new FormData();
        formData.append('chunk', chunk);
        formData.append('uploadId', uploadId);
        formData.append('chunkIndex', i.toString());

        await fetch('/api/files/upload-chunk', {
          method: 'POST',
          body: formData,
        });

        setProgress(Math.round(((i + 1) / totalChunks) * 100));
      }

      // Finalize upload
      await fetch('/api/files/upload-complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ uploadId }),
      });

      alert('Large file uploaded successfully!');
    } catch (error) {
      console.error('Upload error:', error);
      alert('Upload failed');
    } finally {
      setUploading(false);
      setProgress(0);
    }
  };

  return (
    <div className="p-4 border rounded">
      <h3 className="text-lg font-bold mb-2">Large File Upload (Chunked)</h3>
      <input
        type="file"
        onChange={handleLargeFileUpload}
        disabled={uploading}
        className="mb-2"
      />
      {uploading && (
        <div className="w-full bg-gray-200 rounded mt-2">
          <div
            className="bg-purple-600 text-xs font-medium text-white text-center p-0.5 leading-none rounded"
            style={{ width: `${progress}%` }}
          >
            {progress}%
          </div>
        </div>
      )}
    </div>
  );
}

// ==========================================
// EXAMPLE 9: Drag and Drop Upload
// ==========================================
export function DragDropUpload() {
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragging(false);

    const files = Array.from(e.dataTransfer.files);
    if (files.length === 0) return;

    setUploading(true);

    try {
      const formData = new FormData();
      files.forEach((file) => {
        formData.append('files', file);
      });

      const response = await fetch('/api/files/upload-multiple', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      alert('Files uploaded successfully!');
    } catch (error) {
      console.error('Upload error:', error);
      alert('Upload failed');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="p-4 border rounded">
      <h3 className="text-lg font-bold mb-2">Drag & Drop Upload</h3>
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        className={`border-2 border-dashed rounded p-8 text-center ${
          dragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
        }`}
      >
        {uploading ? (
          <p>Uploading...</p>
        ) : (
          <p>Drag and drop files here or click to select</p>
        )}
      </div>
    </div>
  );
}

// ==========================================
// Example Component showing all features
// ==========================================
export default function FileUploadDownloadExamples() {
  return (
    <div className="container mx-auto p-8 space-y-6">
      <h1 className="text-3xl font-bold mb-8">File Upload & Download Examples</h1>
      
      <FileUploadSingle />
      <FileUploadMultiple />
      <FileUploadWithProgress />
      <ImageUploadWithPreview />
      <FileDownload />
      <FileDownloadDirect />
      <ImageDisplay />
      <LargeFileUploadChunked />
      <DragDropUpload />
    </div>
  );
}
