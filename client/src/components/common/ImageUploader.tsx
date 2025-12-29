import React, { useState, useCallback, useEffect } from "react";
import { useDropzone } from "react-dropzone";
import { UploadCloud, XCircle, Loader, Video } from "lucide-react";
import { cn } from "@/lib/utils";
import type { MediaType } from "@/types"; // Import the MediaType type

// New type for a media item
export interface MediaItem {
  media_url: string;
  media_type: MediaType;
}

// Interface for the component's props
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

  // Update state if the initialMedia prop changes
  useEffect(() => {
    setFiles(initialMedia);
  }, [initialMedia]);

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      if (acceptedFiles.length === 0) return;

      setIsLoading(true);
      setError(null);

      // Create an array of upload promises for each file
      const uploadPromises = acceptedFiles.map((file) => {
        const formData = new FormData();
        formData.append("file", file);
        formData.append(
          "upload_preset",
          import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET
        );
        const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;

        // Return the fetch promise for this file
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
        // Wait for all uploads to complete
        const results = await Promise.all(uploadPromises);

        // Map Cloudinary results to our MediaItem format
        const newMediaItems: MediaItem[] = results.map((result) => ({
          media_url: result.secure_url,
          media_type: result.resource_type === "video" ? "video" : "image",
        }));

        // Combine old files with new ones
        const updatedFiles = [...files, ...newMediaItems];
        setFiles(updatedFiles);
        onUploadSuccess(updatedFiles); // Notify parent component
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
    accept: { "image/*": [], "video/*": [] }, // Will accept both images and videos
    multiple: true, // Allow multiple files
  });

  // Handles removing a specific media item from the list
  const removeFile = (urlToRemove: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent triggering the dropzone click
    const updatedFiles = files.filter((file) => file.media_url !== urlToRemove);
    setFiles(updatedFiles);
    onUploadSuccess(updatedFiles); // Notify parent component
  };

  return (
    <div>
      <label className="block text-xs font-medium text-zinc-400 mb-1">
        Product Images & Videos
      </label>
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2 mb-2">
        {/* Map over and display existing media files */}
        {files.map((file) => (
          <div
            key={file.media_url}
            className="relative aspect-square bg-zinc-800 rounded-lg overflow-hidden"
          >
            {/* Conditionally render image or video placeholder */}
            {file.media_type === "image" ? (
              <img
                src={file.media_url}
                alt="Preview"
                className="w-full h-full object-cover"
              />
            ) : (
              // Show a video icon for video files
              <div className="w-full h-full flex items-center justify-center">
                <Video className="w-8 h-8 text-zinc-500" />
              </div>
            )}
            {/* Remove button */}
            <button
              onClick={(e) => removeFile(file.media_url, e)}
              className="absolute top-1 right-1 bg-black/50 rounded-full p-0.5 text-white hover:bg-black/80"
              title="Remove media"
            >
              <XCircle size={18} />
            </button>
          </div>
        ))}
        {/* Show a loading spinner while uploading */}
        {isLoading && (
          <div className="relative aspect-square bg-zinc-800 rounded-lg flex items-center justify-center">
            <Loader className="animate-spin text-zinc-400" />
          </div>
        )}
      </div>

      {/* Dropzone area */}
      <div
        {...getRootProps()}
        className={cn(
          "border-2 border-dashed border-zinc-600 rounded-lg p-4 text-center cursor-pointer transition-colors",
          "hover:border-cyan-500 hover:bg-zinc-800/50",
          isDragActive && "border-cyan-500 bg-zinc-800/50" // Style when dragging a file over
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

      {/* Display upload errors */}
      {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
    </div>
  );
};
