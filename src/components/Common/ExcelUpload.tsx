import React, { useRef } from "react";
import { useMutation } from "@tanstack/react-query";
import { Upload } from "lucide-react";
import { api } from "../../api/base";

interface ExcelUploadButtonProps {
  apiUrl: string;
  payloadKey?: string;
  additionalData?: Record<string, string | number>;
  className?: string;
  iconSize?: number;
  onSuccess?: (data: any) => void;
  onError?: (error: any) => void;
}

export const ExcelUploadButton: React.FC<ExcelUploadButtonProps> = ({
  apiUrl,
  payloadKey = "file",
  additionalData,
  className = "",
  iconSize = 20,
  onSuccess,
  onError,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  console.log("additional data", additionalData);
  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();

      // Add Excel file
      formData.append(payloadKey, file);

      // Add additional form-data fields
      Object.entries(additionalData ?? {}).forEach(([key, value]) => {
        formData.append(key, String(value));
      });

      console.log("form data", formData);
      console.log("tenant_id being sent:", formData.get("tenant_id"));
      console.log("file being sent:", formData.get("file"));

      const response = await api.post(apiUrl, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      return response.data;
    },

    onSuccess: (data) => {
      if (onSuccess) onSuccess(data);

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    },

    onError: (error) => {
      console.error("Failed to upload Excel file:", error);

      if (onError) onError(error);

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    },
  });

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (!file) return;

    const isExcel =
      file.type ===
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||
      file.type === "application/vnd.ms-excel";

    if (!isExcel) {
      alert("Please upload a valid Excel file (.xlsx or .xls)");

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }

      return;
    }

    uploadMutation.mutate(file);
  };

  return (
    <>
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept=".xlsx, .xls"
        style={{ display: "none" }}
      />

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
