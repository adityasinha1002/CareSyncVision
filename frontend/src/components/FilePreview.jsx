import React from 'react';
import { File, Image } from 'lucide-react';

export default function FilePreview({ file }) {
  if (!file) {
    return (
      <div className="border-2 border-dashed border-[#2a2a2a] rounded-lg p-8 text-center bg-[#0d0d0d] hover:border-primary/30 transition-colors">
        <File className="w-12 h-12 text-gray-700 mx-auto mb-3" />
        <p className="text-gray-500 font-medium">No file selected</p>
        <p className="text-sm text-gray-700 mt-1">Upload an image or document to preview</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 p-4 bg-primary/5 rounded-lg border border-primary/20">
        {file.type.startsWith('image/') ? (
          <Image className="w-6 h-6 text-primary" />
        ) : (
          <File className="w-6 h-6 text-primary" />
        )}
        <div className="flex-1">
          <p className="font-semibold text-white text-sm">{file.name}</p>
          <p className="text-xs text-gray-500 font-mono">{(file.size / 1024).toFixed(2)} KB</p>
        </div>
      </div>

      {file.type.startsWith('image/') && (
        <div className="rounded-lg overflow-hidden border border-[#2a2a2a]">
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
