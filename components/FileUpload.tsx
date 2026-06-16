"use client";

import { ImageKitProvider, Image, Video, upload } from "@imagekit/next";
import config from "@/lib/config";
import { useRef, useState, ChangeEvent } from "react";
import NextImage from "next/image";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const {
  env: {
    imagekit: { publicKey, urlEndpoint },
  },
} = config;

const authenticator = async () => {
  try {
    const response = await fetch(`${config.env.apiEndpoint}/api/auth/imagekit`);

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `Request failed with status ${response.status}: ${errorText}`,
      );
    }

    const data = await response.json();
    const { signature, expire, token } = data;

    return { token, expire, signature };
  } catch (error: unknown) {
    // Narrow down the type safely using instanceof
    const errorMessage =
      error instanceof Error ? error.message : "An unknown error occurred";
    throw new Error(`Authentication request failed: ${errorMessage}`);
  }
};

interface Props {
  type: "image" | "video";
  accept: string;
  placeholder: string;
  folder: string;
  variant: "dark" | "light";
  onFileChange: (filePath: string) => void;
  value?: string;
}

const FileUpload = ({
  type,
  accept,
  placeholder,
  folder,
  variant,
  onFileChange,
  value,
}: Props) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<{ filePath: string | null }>({
    filePath: value ?? null,
  });
  const [progress, setProgress] = useState(0);

  const styles = {
    button:
      variant === "dark"
        ? "bg-dark-300"
        : "bg-light-600 border-gray-100 border",
    placeholder: variant === "dark" ? "text-light-100" : "text-slate-500",
    text: variant === "dark" ? "text-light-100" : "text-dark-400",
  };

  const onValidate = (selectedFile: File) => {
    if (type === "image") {
      if (selectedFile.size > 20 * 1024 * 1024) {
        toast.error("File size too large", {
          description: "Please upload a file that is less than 20MB in size",
        });
        return false;
      }
    } else if (type === "video") {
      if (selectedFile.size > 50 * 1024 * 1024) {
        toast.error("File size too large", {
          description: "Please upload a file that is less than 50MB in size",
        });
        return false;
      }
    }
    return true;
  };

  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    // Run custom frontend verification
    const isValid = onValidate(selectedFile);
    if (!isValid) return;

    setProgress(0);

    try {
      // 1. Get authentication parameters from your API endpoint
      const authParams = await authenticator();

      // 2. Ensure publicKey is definitely a string to prevent undefined compilation errors
      const ikPublicKey = publicKey || "";

      // 3. Use ImageKit's modular upload utility
      const result = await upload({
        file: selectedFile,
        fileName: selectedFile.name,
        useUniqueFileName: true,
        folder: folder,
        publicKey: ikPublicKey,
        token: authParams.token,
        expire: authParams.expire,
        signature: authParams.signature,
        onProgress: (progressEvent) => {
          const percent = Math.round(
            (progressEvent.loaded / progressEvent.total) * 100,
          );
          setProgress(percent);
        },
      });

      // Handle Success
      const uploadedPath = result.filePath || "";
      setFile({ filePath: uploadedPath });
      onFileChange(uploadedPath);

      // ✅ Swapped to Sonner success format
      toast.success(`${type} uploaded successfully`, {
        description: `${uploadedPath} uploaded successfully!`,
      });
    } catch (error: unknown) {
      // Handle Error safely without using 'any'
      console.error(error);
      const errorMessage =
        error instanceof Error ? error.message : "An unknown error occurred";

      // ✅ Swapped to Sonner error format
      toast.error(`${type} upload failed`, {
        description:
          errorMessage ||
          `Your ${type} could not be uploaded. Please try again.`,
      });
    }
  };

  return (
    <ImageKitProvider urlEndpoint={urlEndpoint}>
      {/* Native input replaces IKUpload component */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept={accept}
        className="hidden"
      />

      <button
        className={cn(
          "upload-btn flex h-14 w-full items-center justify-center gap-2 rounded-md bg-[#1e2230] px-4 text-white border border-transparent transition-all hover:bg-[#252a3b]",
          styles.button,
        )}
        onClick={(e) => {
          e.preventDefault();
          fileInputRef.current?.click();
        }}
      >
        <NextImage
          src="/icons/upload.svg"
          alt="upload-icon"
          width={20}
          height={20}
          className="object-contain inverted-icon-color" // Optional: ensures icon brightness matches target
        />

        <p
          className={cn(
            "text-base font-medium text-slate-300",
            styles.placeholder,
          )}
        >
          {placeholder || "Upload a File"}
        </p>

        {file.filePath && (
          <p
            className={cn(
              "upload-filename ml-2 text-sm text-slate-400",
              styles.text,
            )}
          >
            {file.filePath}
          </p>
        )}
      </button>

      {progress > 0 && progress !== 100 && (
        <div className="w-full rounded-full bg-green-200">
          <div className="progress" style={{ width: `${progress}%` }}>
            {progress}%
          </div>
        </div>
      )}

      {file.filePath &&
        (type === "image" ? (
          <Image
            alt={file.filePath}
            src={file.filePath}
            width={500}
            height={300}
          />
        ) : type === "video" ? (
          <Video
            src={file.filePath} 
            controls={true}
            className="h-96 w-full rounded-xl"
          />
        ) : null)}
    </ImageKitProvider>
  );
};

export default FileUpload;
