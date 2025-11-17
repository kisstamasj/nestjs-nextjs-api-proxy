# File Upload & Download Guide

## Overview

The API proxy now supports file uploads and downloads with streaming to handle large files efficiently. This guide shows you how to use these features.

---

## What Changed in the Proxy

### New Features Added:

1. **Streaming Request Forwarding** - For file uploads (multipart/form-data)
2. **Streaming Response Forwarding** - For file downloads (binary data)
3. **Automatic Content-Type Detection** - Handles binary vs text responses
4. **Memory Efficient** - Streams files instead of loading into memory

### How It Works:

```typescript
// The proxy now detects file uploads by content-type
const isFileUpload = contentType.includes('multipart/form-data');

if (isFileUpload) {
  // Stream the request body directly without caching
  response = await forwardRequestStreaming(request, fullPath, accessToken);
}

// For responses, detect binary content
const isBinaryResponse = 
  responseContentType.includes('application/octet-stream') ||
  responseContentType.includes('image/') ||
  responseContentType.includes('video/') ||
  response.headers.get('content-disposition')?.includes('attachment');

if (isBinaryResponse) {
  // Stream the response directly
  return createStreamingResponse(response);
}
```

---

## File Upload Examples

### 1. Simple File Upload (Frontend)

```typescript
'use client';

export function FileUpload() {
  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);
    formData.append('description', 'My file');

    const response = await fetch('/api/files/upload', {
      method: 'POST',
      body: formData,
      // ⚠️ Don't set Content-Type header - browser sets it automatically
    });

    if (response.ok) {
      const result = await response.json();
      console.log('Uploaded:', result);
    }
  };

  return <input type="file" onChange={handleUpload} />;
}
```

### 2. Backend Endpoint (NestJS)

```typescript
// backend/src/files/files.controller.ts
import { Controller, Post, UseInterceptors, UploadedFile } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';

@Controller('files')
export class FilesController {
  @Post('upload')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './uploads',
        filename: (req, file, cb) => {
          const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
          cb(null, `${uniqueSuffix}-${file.originalname}`);
        },
      }),
      limits: {
        fileSize: 10 * 1024 * 1024, // 10MB
      },
    }),
  )
  uploadFile(@UploadedFile() file: Express.Multer.File) {
    return {
      filename: file.filename,
      originalname: file.originalname,
      size: file.size,
      mimetype: file.mimetype,
      path: file.path,
    };
  }
}
```

### 3. Multiple File Upload

```typescript
// Frontend
const formData = new FormData();
Array.from(files).forEach((file) => {
  formData.append('files', file);
});

await fetch('/api/files/upload-multiple', {
  method: 'POST',
  body: formData,
});

// Backend
@Post('upload-multiple')
@UseInterceptors(FilesInterceptor('files', 10)) // max 10 files
uploadMultiple(@UploadedFiles() files: Express.Multer.File[]) {
  return {
    count: files.length,
    files: files.map(f => ({
      filename: f.filename,
      size: f.size,
    })),
  };
}
```

### 4. Image Upload with Validation

```typescript
// Frontend
const handleImageUpload = async (file: File) => {
  // Validate on client
  if (!file.type.startsWith('image/')) {
    alert('Please select an image');
    return;
  }

  if (file.size > 5 * 1024 * 1024) {
    alert('Image must be less than 5MB');
    return;
  }

  const formData = new FormData();
  formData.append('image', file);

  await fetch('/api/images/upload', {
    method: 'POST',
    body: formData,
  });
};

// Backend
@Post('upload')
@UseInterceptors(
  FileInterceptor('image', {
    fileFilter: (req, file, cb) => {
      if (!file.mimetype.startsWith('image/')) {
        return cb(new Error('Only images allowed'), false);
      }
      cb(null, true);
    },
    limits: {
      fileSize: 5 * 1024 * 1024,
    },
  }),
)
uploadImage(@UploadedFile() file: Express.Multer.File) {
  // Process image (resize, optimize, etc.)
  return { url: `/uploads/${file.filename}` };
}
```

---

## File Download Examples

### 1. Simple File Download (Frontend)

```typescript
const handleDownload = async (fileId: string, filename: string) => {
  const response = await fetch(`/api/files/download/${fileId}`);
  
  if (!response.ok) {
    throw new Error('Download failed');
  }

  // Convert response to blob
  const blob = await response.blob();

  // Create download link
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  window.URL.revokeObjectURL(url);
  document.body.removeChild(a);
};
```

### 2. Backend Download Endpoint

```typescript
// backend/src/files/files.controller.ts
import { Controller, Get, Param, Res, StreamableFile } from '@nestjs/common';
import { createReadStream } from 'fs';
import { join } from 'path';
import type { Response } from 'express';

@Controller('files')
export class FilesController {
  @Get('download/:id')
  downloadFile(@Param('id') id: string, @Res({ passthrough: true }) res: Response) {
    // Get file info from database
    const file = this.filesService.findOne(id);
    
    // Set headers for download
    res.set({
      'Content-Type': file.mimetype,
      'Content-Disposition': `attachment; filename="${file.originalname}"`,
    });

    // Stream file
    const filePath = join(process.cwd(), 'uploads', file.filename);
    const stream = createReadStream(filePath);
    
    return new StreamableFile(stream);
  }
}
```

### 3. Display Image from API

```typescript
// Frontend - Just use the API URL directly
<img 
  src="/api/images/123" 
  alt="User avatar" 
  onError={(e) => {
    (e.target as HTMLImageElement).src = '/placeholder.png';
  }}
/>

// Backend
@Get(':id')
getImage(@Param('id') id: string, @Res({ passthrough: true }) res: Response) {
  const image = this.imagesService.findOne(id);
  
  res.set({
    'Content-Type': image.mimetype,
    'Cache-Control': 'public, max-age=86400', // Cache for 1 day
  });

  const filePath = join(process.cwd(), 'uploads', image.filename);
  const stream = createReadStream(filePath);
  
  return new StreamableFile(stream);
}
```

### 4. PDF Download/Display

```typescript
// Download PDF
const downloadPDF = async (reportId: string) => {
  const response = await fetch(`/api/reports/${reportId}/pdf`);
  const blob = await response.blob();
  
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `report-${reportId}.pdf`;
  a.click();
  window.URL.revokeObjectURL(url);
};

// Display PDF in iframe
<iframe 
  src="/api/reports/123/pdf" 
  width="100%" 
  height="600px"
  title="Report PDF"
/>
```

---

## Important Considerations

### ⚠️ Token Refresh Limitation for Uploads

When uploading files, if the token expires during the upload, **the proxy cannot retry** because the request body has already been consumed.

```typescript
// In the proxy code:
if (response.status === 401 && sessionPayload && refreshToken) {
  // Cannot retry file upload as body was already consumed
  return NextResponse.json(
    { error: "Authentication expired during upload. Please retry." },
    { status: 401 }
  );
}
```

**Solution:** Handle this on the frontend:

```typescript
const uploadFile = async (file: File) => {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch('/api/files/upload', {
    method: 'POST',
    body: formData,
  });

  if (response.status === 401) {
    // Token expired during upload - retry once
    const retryResponse = await fetch('/api/files/upload', {
      method: 'POST',
      body: formData, // FormData can be reused
    });
    return retryResponse;
  }

  return response;
};
```

---

## File Size Limits

### Current Limitations:

The proxy **does not enforce size limits** yet. You should add them:

```typescript
// In handleRequest, before streaming:
const MAX_UPLOAD_SIZE = 100 * 1024 * 1024; // 100MB

const contentLength = request.headers.get('content-length');
if (contentLength && parseInt(contentLength) > MAX_UPLOAD_SIZE) {
  return NextResponse.json(
    { error: 'File too large. Maximum size is 100MB.' },
    { status: 413 } // Payload Too Large
  );
}
```

### Backend Limits:

Also configure limits on your NestJS backend:

```typescript
// main.ts
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Set body size limit
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ limit: '50mb', extended: true }));
  
  await app.listen(3001);
}
```

---

## Supported Content Types

The proxy automatically handles these content types as **streaming/binary**:

### Uploads (Streaming):
- `multipart/form-data` - File uploads
- `application/octet-stream` - Binary data

### Downloads (Streaming):
- `application/octet-stream` - Generic binary
- `application/pdf` - PDF files
- `image/*` - All images (jpeg, png, gif, etc.)
- `video/*` - All videos
- `audio/*` - All audio
- `application/zip` - Zip files
- Any response with `Content-Disposition: attachment`

### Text Responses (Cached):
- `application/json` - JSON data
- `text/*` - Text, HTML, XML, etc.

---

## Advanced: Chunked Upload for Very Large Files

For files larger than 100MB, use chunked uploads:

### Frontend:
```typescript
const uploadLargeFile = async (file: File) => {
  const chunkSize = 5 * 1024 * 1024; // 5MB chunks
  const totalChunks = Math.ceil(file.size / chunkSize);
  
  // 1. Initialize upload
  const initRes = await fetch('/api/files/upload-init', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      filename: file.name,
      filesize: file.size,
      totalChunks,
    }),
  });
  
  const { uploadId } = await initRes.json();
  
  // 2. Upload chunks
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
  }
  
  // 3. Finalize
  await fetch('/api/files/upload-complete', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ uploadId }),
  });
};
```

### Backend:
```typescript
@Controller('files')
export class FilesController {
  @Post('upload-init')
  initUpload(@Body() dto: { filename: string; filesize: number; totalChunks: number }) {
    const uploadId = randomUUID();
    // Store upload metadata in database/cache
    return { uploadId };
  }

  @Post('upload-chunk')
  @UseInterceptors(FileInterceptor('chunk'))
  uploadChunk(
    @UploadedFile() chunk: Express.Multer.File,
    @Body() dto: { uploadId: string; chunkIndex: string }
  ) {
    // Save chunk to temporary location
    const chunkPath = `./temp/${dto.uploadId}-${dto.chunkIndex}`;
    fs.writeFileSync(chunkPath, chunk.buffer);
    return { success: true };
  }

  @Post('upload-complete')
  async completeUpload(@Body() dto: { uploadId: string }) {
    // Combine all chunks into final file
    const chunks = await this.getChunks(dto.uploadId);
    const finalPath = `./uploads/${dto.uploadId}`;
    
    const writeStream = fs.createWriteStream(finalPath);
    for (const chunkPath of chunks) {
      const chunkBuffer = fs.readFileSync(chunkPath);
      writeStream.write(chunkBuffer);
      fs.unlinkSync(chunkPath); // Delete chunk
    }
    writeStream.end();
    
    return { success: true, fileId: dto.uploadId };
  }
}
```

---

## Testing

### Test File Upload:
```bash
curl -X POST http://localhost:3000/api/files/upload \
  -H "Cookie: session_token=YOUR_TOKEN" \
  -F "file=@/path/to/file.pdf" \
  -F "description=Test upload"
```

### Test File Download:
```bash
curl -X GET http://localhost:3000/api/files/download/123 \
  -H "Cookie: session_token=YOUR_TOKEN" \
  --output downloaded-file.pdf
```

---

## Security Considerations

1. **Always validate file types** on backend
2. **Set file size limits** to prevent abuse
3. **Scan uploaded files** for viruses/malware
4. **Store files outside web root** to prevent direct access
5. **Use UUIDs for filenames** to prevent path traversal
6. **Validate file extensions** match content type
7. **Rate limit uploads** per user/IP

---

## Summary

✅ **File uploads work** - FormData automatically streamed  
✅ **File downloads work** - Binary responses streamed  
✅ **Images display** - Just use `/api/images/123` as src  
✅ **Memory efficient** - No buffering large files  
✅ **Token rotation** - Works for downloads, limited for uploads  
⚠️ **Size limits** - Should be added for security  
⚠️ **Upload retry** - Cannot retry if token expires during upload  

The proxy now handles files efficiently! Check `examples/file-upload-download.tsx` for working code examples.
