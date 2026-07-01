import React, { useRef } from "react";
import { useMutation } from "@tanstack/react-query";
import { Upload } from "lucide-react";
import { api } from "../../api/base";

interface ExcelUploadButtonProps {
  apiUrl: string;
  payloadKey?: string; // The form-data key the backend expects (usually 'file')
  className?: string;
  iconSize?: number;
  onSuccess?: (data: any) => void;
  onError?: (error: any) => void;
}

export const ExcelUploadButton: React.FC<ExcelUploadButtonProps> = ({
  apiUrl,
  payloadKey = "file",
  className = "",
  iconSize = 20,
  onSuccess,
  onError,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      // Multipart/form-data is required for uploading physical files
      const formData = new FormData();
      formData.append(payloadKey, file);

      const response = await api.post(apiUrl, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      return response.data;
    },
    onSuccess: (data) => {
      if (onSuccess) onSuccess(data);
      // Reset the input value so the same file can be uploaded again if needed
      if (fileInputRef.current) fileInputRef.current.value = "";
    },
    onError: (error) => {
      console.error("Failed to upload Excel file:", error);
      if (onError) onError(error);
      if (fileInputRef.current) fileInputRef.current.value = "";
    },
  });

  const handleButtonClick = () => {
    // Programmatically trigger the hidden file input
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Optional: Front-end validation to ensure it's an Excel file
    const isExcel =
      file.type ===
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||
      file.type === "application/vnd.ms-excel";

    if (!isExcel) {
      alert("Please upload a valid Excel file (.xlsx or .xls)");
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    // Trigger the TanStack mutation
    uploadMutation.mutate(file);
  };

  return (
    <>
      {/* Hidden native file input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept=".xlsx, .xls"
        style={{ display: "none" }}
      />

      {/* Styled action button */}
      <button
        type="button"
        onClick={handleButtonClick}
        disabled={uploadMutation.isPending}
        className={`upload-icon-btn ${className}`}
        style={{
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: uploadMutation.isPending ? "not-allowed" : "pointer",
          opacity: uploadMutation.isPending ? 0.5 : 1,
          border: "none",
          background: "transparent",
          padding: "8px",
        }}
        title={uploadMutation.isPending ? "Uploading Excel..." : "Upload Excel"}
        aria-label="Upload Excel File"
      >
        <Upload
          size={iconSize}
          className={uploadMutation.isPending ? "animate-pulse" : ""}
        />
      </button>
    </>
  );
};
