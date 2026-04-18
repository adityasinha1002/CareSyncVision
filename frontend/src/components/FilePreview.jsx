import React from 'react';
import { File, Image } from 'lucide-react';

export default function FilePreview({ file }) {
  if (!file) {
    return (
      <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center bg-gray-50">
        <File className="w-12 h-12 text-gray-400 mx-auto mb-3" />
        <p className="text-gray-600 font-medium">No file selected</p>
        <p className="text-sm text-gray-500">Upload an image or document to preview</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 p-4 bg-primary-50 rounded-lg border border-primary-200">
        {file.type.startsWith('image/') ? (
          <Image className="w-6 h-6 text-primary-600" />
        ) : (
          <File className="w-6 h-6 text-primary-600" />
        )}
        <div className="flex-1">
          <p className="font-semibold text-gray-900">{file.name}</p>
          <p className="text-sm text-gray-600">{(file.size / 1024).toFixed(2)} KB</p>
        </div>
      </div>

      {file.type.startsWith('image/') && (
        <div className="rounded-lg overflow-hidden border border-gray-200 shadow-soft">
          <img
            src={URL.createObjectURL(file)}
            alt={file.name}
            className="w-full h-auto"
          />
        </div>
      )}
    </div>
  );
}
