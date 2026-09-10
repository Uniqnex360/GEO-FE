import { useEffect, useState } from "react";

import type { Product as ProductType } from "../../api/product";
import { streamApi } from "../Chat/Chat";

export type AnalysisStatus = {
  loading: boolean;
  message: string;
};

type QueueItem = {
  product: ProductType;
  tenantId: number;
};

const queue: QueueItem[] = [];

const statuses: Record<number, AnalysisStatus> = {};

const listeners = new Set<(statuses: Record<number, AnalysisStatus>) => void>();

let isProcessing = false;

const notify = () => {
  const snapshot = { ...statuses };

  listeners.forEach((listener) => {
    listener(snapshot);
  });
};

const setStatus = (productId: number, status: AnalysisStatus) => {
  statuses[productId] = status;
  notify();
};

const removeStatus = (productId: number) => {
  delete statuses[productId];
  notify();
};

const isAlreadyQueued = (productId: number) => {
  return queue.some((item) => item.product.id === productId);
};

const getWebsite = (product: ProductType) => {
  const productData = product as any;

  if (productData?.website) {
    return String(productData.website).trim();
  }

  if (productData?.brand_website) {
    return String(productData.brand_website).trim();
  }

  if (productData?.site_url) {
    return String(productData.site_url).trim();
  }

  const productUrl = productData?.product_url || productData?.url || "";

  if (!productUrl) {
    return "";
  }

  try {
    return new URL(productUrl).origin;
  } catch {
    return "";
  }
};

const runAnalysis = async (
  item: QueueItem,
  invalidateProducts: () => Promise<unknown>,
) => {
  const { product, tenantId } = item;

  const productData = product as any;

  const productUrl = productData?.product_url || productData?.url || "";

  const website = getWebsite(product);

  if (!website || (!product.name && !productUrl)) {
    throw new Error("Website and product information are required.");
  }

  setStatus(product.id, {
    loading: true,
    message: "Analyze started",
  });

  await streamApi<any>(
    "api/v1/chat/v2/init_llm_analyzes/",
    {
      product_name: product.name?.trim() || null,
      website: website || null,
      product_url: productUrl?.trim() || null,
      sku: product.sku?.trim() || null,
      mpn: productData?.mpn?.trim() || null,
      ean: productData?.ean?.trim() || null,
      upc: productData?.upc?.trim() || null,
      extra_context: productData?.extra_context || "",
      countries: productData?.countries || [],
      tenant_id: tenantId,
    },

    (event: any) => {
      if (event.type === "status") {
        setStatus(product.id, {
          loading: true,
          message: event.message || "Analyzing...",
        });
      }

      if (event.type === "result") {
        setStatus(product.id, {
          loading: false,
          message: "Analysis completed",
        });
      }

      if (event.type === "error") {
        setStatus(product.id, {
          loading: false,
          message: event.message || "Analysis failed",
        });
      }
    },
  );

  await invalidateProducts();

  setStatus(product.id, {
    loading: false,
    message: "Analysis completed",
  });

  /*
   * Keep the completed message visible briefly.
   */
  setTimeout(() => {
    removeStatus(product.id);
  }, 2000);
};

const processQueue = async (
  invalidateProducts: () => Promise<unknown>,
  showError: (message: string) => void,
) => {
  if (isProcessing) {
    return;
  }

  isProcessing = true;

  try {
    while (queue.length > 0) {
      const item = queue.shift();

      if (!item) {
        continue;
      }

      try {
        await runAnalysis(item, invalidateProducts);
      } catch (error: any) {
        console.error(`Analysis failed for product ${item.product.id}:`, error);

        const message = error?.message || "Analysis failed";

        setStatus(item.product.id, {
          loading: false,
          message,
        });

        showError(`${item.product.name || "Product"}: ${message}`);

        setTimeout(() => {
          removeStatus(item.product.id);
        }, 3000);
      }
    }
  } finally {
    isProcessing = false;

    /*
     * If something was added while the previous item
     * was finishing, continue processing.
     */
    if (queue.length > 0) {
      void processQueue(invalidateProducts, showError);
    }
  }
};

export function useProductAnalysisQueue(
  tenantId: number,
  invalidateProducts: () => Promise<unknown>,
  showError: (message: string) => void,
) {
  const [analysisStatus, setAnalysisStatus] = useState<
    Record<number, AnalysisStatus>
  >({
    ...statuses,
  });

  useEffect(() => {
    const listener = (nextStatuses: Record<number, AnalysisStatus>) => {
      setAnalysisStatus(nextStatuses);
    };

    listeners.add(listener);

    /*
     * Get the latest status immediately when the
     * Product page mounts again.
     */
    listener({ ...statuses });

    return () => {
      listeners.delete(listener);
    };
  }, []);

  const handleAnalyze = (product: ProductType) => {
    /*
     * Already running.
     */
    if (statuses[product.id]?.loading) {
      return;
    }

    /*
     * Already waiting in queue.
     */
    if (isAlreadyQueued(product.id)) {
      return;
    }

    queue.push({
      product,
      tenantId,
    });

    setStatus(product.id, {
      loading: true,
      message: isProcessing ? "Queued for analysis" : "Analyze started",
    });

    /*
     * Do not await.
     *
     * The queue runs in the background.
     */
    void processQueue(invalidateProducts, showError);
  };

  return {
    analysisStatus,
    handleAnalyze,
  };
}
