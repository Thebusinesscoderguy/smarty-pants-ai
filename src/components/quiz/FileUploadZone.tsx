import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Upload, File, X, FileText, Image } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FileUploadZoneProps {
  onFileUpload: (file: File) => void;
  onFileRemove: () => void;
  uploadedFile: File | null;
  acceptedFileTypes?: string[];
  maxFileSize?: number;
  disabled?: boolean;
}

export const FileUploadZone = ({
  onFileUpload,
  onFileRemove,
  uploadedFile,
  acceptedFileTypes = ['.pdf', '.doc', '.docx', '.txt', '.jpg', '.jpeg', '.png'],
  maxFileSize = 100 * 1024 * 1024, // 100MB
  disabled = false
}: FileUploadZoneProps) => {
  const [uploadError, setUploadError] = useState<string | null>(null);

  const onDrop = useCallback((acceptedFiles: File[], rejectedFiles: any[]) => {
    setUploadError(null);
    
    if (rejectedFiles.length > 0) {
      const error = rejectedFiles[0].errors[0];
      if (error.code === 'file-too-large') {
        setUploadError(`File is too large. Maximum size is ${maxFileSize / (1024 * 1024)}MB`);
      } else if (error.code === 'file-invalid-type') {
        setUploadError(`Invalid file type. Accepted types: ${acceptedFileTypes.join(', ')}`);
      } else {
        setUploadError('File upload failed. Please try again.');
      }
      return;
    }

    if (acceptedFiles.length > 0) {
      onFileUpload(acceptedFiles[0]);
    }
  }, [onFileUpload, acceptedFileTypes, maxFileSize]);

  // Build proper MIME type accept object for react-dropzone
  const acceptMimeTypes = {
    'application/pdf': ['.pdf'],
    'application/msword': ['.doc'],
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
    'text/plain': ['.txt'],
    'image/jpeg': ['.jpg', '.jpeg'],
    'image/png': ['.png'],
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: acceptMimeTypes,
    maxSize: maxFileSize,
    multiple: false,
    disabled
  });

  const getFileIcon = (fileName: string) => {
    const extension = fileName.toLowerCase().split('.').pop();
    switch (extension) {
      case 'pdf':
      case 'doc':
      case 'docx':
      case 'txt':
        return <FileText className="h-6 w-6" />;
      case 'jpg':
      case 'jpeg':
      case 'png':
        return <Image className="h-6 w-6" />;
      default:
        return <File className="h-6 w-6" />;
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (uploadedFile) {
    return (
      <Card className="border-dashed border-2 border-muted">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="text-muted-foreground">
                {getFileIcon(uploadedFile.name)}
              </div>
              <div>
                <p className="text-sm font-medium">{uploadedFile.name}</p>
                <p className="text-xs text-muted-foreground">
                  {formatFileSize(uploadedFile.size)}
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onFileRemove}
              disabled={disabled}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn(
      "border-dashed border-2 transition-colors",
      isDragActive ? "border-primary bg-primary/5" : "border-muted",
      disabled && "opacity-50 cursor-not-allowed"
    )}>
      <CardContent className="p-6">
        <div
          {...getRootProps()}
          className={cn(
            "text-center cursor-pointer transition-colors",
            disabled && "cursor-not-allowed"
          )}
        >
          <input {...getInputProps()} />
          <div className="flex flex-col items-center space-y-2">
            <Upload className={cn(
              "h-8 w-8 text-muted-foreground",
              isDragActive && "text-primary"
            )} />
            <div>
              <p className="text-sm font-medium">
                {isDragActive ? "Drop your file here" : "Upload a file"}
              </p>
              <p className="text-xs text-muted-foreground">
                Drag & drop or click to browse
              </p>
            </div>
            <p className="text-xs text-muted-foreground">
              Supported: {acceptedFileTypes.join(', ')} (max {maxFileSize / (1024 * 1024)}MB)
            </p>
          </div>
        </div>
        {uploadError && (
          <div className="mt-3 p-2 bg-destructive/10 border border-destructive/20 rounded text-xs text-destructive">
            {uploadError}
          </div>
        )}
      </CardContent>
    </Card>
  );
};