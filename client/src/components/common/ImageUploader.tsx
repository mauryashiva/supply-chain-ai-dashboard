import React, { useState, useCallback, useEffect } from "react";
import { useDropzone } from "react-dropzone";
import { UploadCloud, XCircle, Loader, Video } from "lucide-react";
import { cn } from "@/lib/utils";
import type { MediaType } from "@/types"; // MediaType ko import karein

// Naya type media item ke liye
export interface MediaItem {
  media_url: string;
  media_type: MediaType;
}

// Component ke props ka interface
interface ImageUploaderProps {
  onUploadSuccess: (mediaItems: MediaItem[]) => void;
  initialMedia?: MediaItem[];
}

export const ImageUploader: React.FC<ImageUploaderProps> = ({
  onUploadSuccess,
  initialMedia = [],
}) => {
  const [files, setFiles] = useState<MediaItem[]>(initialMedia);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Jab initialMedia change ho to state update karein
  useEffect(() => {
    setFiles(initialMedia);
  }, [initialMedia]);

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      if (acceptedFiles.length === 0) return;

      setIsLoading(true);
      setError(null);

      const uploadPromises = acceptedFiles.map((file) => {
        const formData = new FormData();
        formData.append("file", file);
        formData.append(
          "upload_preset",
          import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET
        );
        const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;

        return fetch(
          `https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`,
          {
            method: "POST",
            body: formData,
          }
        ).then((response) => {
          if (!response.ok) throw new Error("Upload failed");
          return response.json();
        });
      });

      try {
        const results = await Promise.all(uploadPromises);
        const newMediaItems: MediaItem[] = results.map((result) => ({
          media_url: result.secure_url,
          media_type: result.resource_type === "video" ? "video" : "image",
        }));

        const updatedFiles = [...files, ...newMediaItems];
        setFiles(updatedFiles);
        onUploadSuccess(updatedFiles);
      } catch (err) {
        setError("Some files failed to upload. Please try again.");
      } finally {
        setIsLoading(false);
      }
    },
    [files, onUploadSuccess]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "image/*": [], "video/*": [] }, // Image aur video, dono accept karega
    multiple: true, // Multiple files allow karein
  });

  const removeFile = (urlToRemove: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updatedFiles = files.filter((file) => file.media_url !== urlToRemove);
    setFiles(updatedFiles);
    onUploadSuccess(updatedFiles);
  };

  return (
    <div>
      <label className="block text-xs font-medium text-zinc-400 mb-1">
        Product Images & Videos
      </label>
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2 mb-2">
        {files.map((file) => (
          <div
            key={file.media_url}
            className="relative aspect-square bg-zinc-800 rounded-lg overflow-hidden"
          >
            {file.media_type === "image" ? (
              <img
                src={file.media_url}
                alt="Preview"
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Video className="w-8 h-8 text-zinc-500" />
              </div>
            )}
            <button
              onClick={(e) => removeFile(file.media_url, e)}
              className="absolute top-1 right-1 bg-black/50 rounded-full p-0.5 text-white hover:bg-black/80"
              title="Remove media"
            >
              <XCircle size={18} />
            </button>
          </div>
        ))}
        {isLoading && (
          <div className="relative aspect-square bg-zinc-800 rounded-lg flex items-center justify-center">
            <Loader className="animate-spin text-zinc-400" />
          </div>
        )}
      </div>
      <div
        {...getRootProps()}
        className={cn(
          "border-2 border-dashed border-zinc-600 rounded-lg p-4 text-center cursor-pointer transition-colors",
          "hover:border-cyan-500 hover:bg-zinc-800/50",
          isDragActive && "border-cyan-500 bg-zinc-800/50"
        )}
      >
        <input {...getInputProps()} />
        <div className="flex flex-col items-center justify-center text-zinc-400">
          <UploadCloud size={24} />
          <p className="mt-2 text-sm">
            Drag & drop files here, or click to select
          </p>
        </div>
      </div>
      {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
    </div>
  );
};
