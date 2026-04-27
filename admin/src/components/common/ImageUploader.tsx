import React, { useState, useCallback, useEffect } from "react";
import { useDropzone } from "react-dropzone";
import { UploadCloud, XCircle, Loader, Video } from "lucide-react";
import { cn } from "@/lib/utils";
import type { MediaType } from "@/types";

export interface MediaItem {
  media_url: string;
  media_type: MediaType;
}

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

  useEffect(() => {
    setFiles(initialMedia);
  }, [initialMedia]);

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      if (!acceptedFiles.length) return;

      setIsLoading(true);
      setError(null);

      const uploadPromises = acceptedFiles.map((file) => {
        const formData = new FormData();
        formData.append("file", file);
        formData.append(
          "upload_preset",
          import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET,
        );

        const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;

        return fetch(
          `https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`,
          { method: "POST", body: formData },
        ).then((res) => {
          if (!res.ok) throw new Error("Upload failed");
          return res.json();
        });
      });

      try {
        const results = await Promise.all(uploadPromises);

        const newMedia: MediaItem[] = results.map((r) => ({
          media_url: r.secure_url,
          media_type: r.resource_type === "video" ? "video" : "image",
        }));

        const updated = [...files, ...newMedia];
        setFiles(updated);
        onUploadSuccess(updated);
      } catch {
        setError("Some files failed to upload. Please try again.");
      } finally {
        setIsLoading(false);
      }
    },
    [files, onUploadSuccess],
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "image/*": [], "video/*": [] },
    multiple: true,
  });

  const removeFile = (url: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = files.filter((f) => f.media_url !== url);
    setFiles(updated);
    onUploadSuccess(updated);
  };

  return (
    <div>
      {/* LABEL */}
      <label className="block text-xs font-semibold text-gray-700 dark:text-zinc-400 mb-1">
        Product Images & Videos
      </label>

      {/* MEDIA GRID */}
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2 mb-2">
        {files.map((file) => (
          <div
            key={file.media_url}
            className="relative aspect-square rounded-lg overflow-hidden border border-gray-200 dark:border-zinc-700 bg-gray-100 dark:bg-zinc-800"
          >
            {file.media_type === "image" ? (
              <img
                src={file.media_url}
                alt="Preview"
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Video className="w-8 h-8 text-gray-500 dark:text-zinc-500" />
              </div>
            )}

            <button
              onClick={(e) => removeFile(file.media_url, e)}
              className="absolute top-1 right-1 bg-black/60 hover:bg-black/80 text-white rounded-full p-0.5 transition"
              title="Remove media"
            >
              <XCircle size={18} />
            </button>
          </div>
        ))}

        {isLoading && (
          <div className="aspect-square rounded-lg border border-gray-200 dark:border-zinc-700 bg-gray-100 dark:bg-zinc-800 flex items-center justify-center">
            <Loader className="animate-spin text-gray-500 dark:text-zinc-400" />
          </div>
        )}
      </div>

      {/* DROPZONE */}
      <div
        {...getRootProps()}
        className={cn(
          "border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition",
          "border-gray-300 dark:border-zinc-600",
          "hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-zinc-800/60",
          isDragActive && "border-blue-500 bg-blue-50 dark:bg-zinc-800/60",
        )}
      >
        <input {...getInputProps()} />

        <div className="flex flex-col items-center justify-center text-gray-600 dark:text-zinc-400">
          <UploadCloud size={24} />
          <p className="mt-2 text-sm font-semibold">
            Drag & drop files here, or click to select
          </p>
        </div>
      </div>

      {/* ERROR */}
      {error && (
        <p className="text-red-500 text-xs mt-1 font-semibold">{error}</p>
      )}
    </div>
  );
};
