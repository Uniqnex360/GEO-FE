import React from "react";
import { useMutation } from "@tanstack/react-query";
import { Download } from "lucide-react";
import { api } from "../../api/base";

interface ExcelDownloadButtonProps {
  apiUrl: string;
  filename?: string;
  className?: string;
  iconSize?: number;
  onSuccess?: () => void;
  onError?: (error: any) => void;
}

export const ExcelDownloadButton: React.FC<ExcelDownloadButtonProps> = ({
  apiUrl,
  filename = "template.xlsx",
  className = "",
  iconSize = 20,
  onSuccess,
  onError,
}) => {
  const downloadMutation = useMutation({
    mutationFn: async () => {
      // responseType: "blob" is required for file streams
      const response = await api.get(apiUrl, {
        responseType: "blob",
      });
      return response.data;
    },
    onSuccess: (data) => {
      const url = window.URL.createObjectURL(new Blob([data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", filename);

      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
      window.URL.revokeObjectURL(url);

      if (onSuccess) onSuccess();
    },
    onError: (error) => {
      console.error("Failed to download Excel file:", error);
      if (onError) onError(error);
    },
  });

  return (
    <button
      onClick={() => downloadMutation.mutate()}
      disabled={downloadMutation.isPending}
      className={`download-icon-btn ${className}`}
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        cursor: downloadMutation.isPending ? "not-allowed" : "pointer",
        opacity: downloadMutation.isPending ? 0.5 : 1,
        border: "none",
        background: "transparent",
        padding: "8px",
      }}
      title={
        downloadMutation.isPending ? "Generating Excel..." : "Download Excel"
      }
      aria-label="Download Excel File"
    >
      <Download
        size={iconSize}
        className={downloadMutation.isPending ? "animate-pulse" : ""}
      />
    </button>
  );
};
