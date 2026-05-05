/**
 * useOfflineFormSubmit Hook
 *
 * Provides a unified interface for form submission that automatically handles
 * online/offline scenarios with image compression and queue management.
 *
 * **Validates: Requirements 2.1, 2.2, 2.3, 3.1, 3.2**
 */

"use client";

import { useState, useCallback } from "react";
import { useOfflineSync } from "./useOfflineSync";
import { addPendingItem, type PendingItemType } from "@/libs/offlineQueue";
import { compressImage } from "@/libs/imageCompression";
import { uploadToCloudinary } from "@/libs/cloudinary";
import { graphqlAction } from "@/libs/graphql/actions";
import { SIMPAN_PROGRES, KIRIM_HASIL } from "@/libs/graphql/mutations";
import { showToast, showErrorToast } from "@/libs/toast";
import type { IWorkOrderMutationResponse } from "@/types/workOrder";

interface SimpanProgresResponse {
  simpanProgres: IWorkOrderMutationResponse;
}

interface KirimHasilResponse {
  kirimHasil: IWorkOrderMutationResponse;
}

export interface OfflineFormSubmitOptions {
  workOrderId: string;
  jenisPekerjaan: string;
  type: PendingItemType;
  onSuccess?: () => void;
  onError?: (error: Error) => void;
}

export interface ImageToSubmit {
  fieldKey: string;
  file: File;
}

export interface OfflineFormSubmitState {
  submit: (
    payload: Record<string, unknown>,
    images: ImageToSubmit[],
  ) => Promise<void>;
  isSubmitting: boolean;
}

/**
 * Get Cloudinary folder based on jenis pekerjaan
 */
function getCloudinaryFolder(jenisPekerjaan: string): string {
  const normalized = jenisPekerjaan.toLowerCase().replace(/\s+/g, "_");
  return `floein/work_orders/${normalized}`;
}

/**
 * Hook for offline-first form submission with automatic image compression and queue management
 *
 * Features:
 * - Automatic online/offline detection
 * - Image compression before storage/upload (>2MB)
 * - Direct submission when online
 * - Queue for later sync when offline
 * - Progress tracking and toast notifications
 * - Error handling with callbacks
 *
 * @param options - Configuration for form submission
 * @returns Object with submit function and isSubmitting state
 *
 * @example
 * ```tsx
 * const { submit, isSubmitting } = useOfflineFormSubmit({
 *   workOrderId: 'wo-123',
 *   jenisPekerjaan: 'Pemasangan Baru',
 *   type: 'simpan_progres',
 *   onSuccess: () => router.push('/success'),
 *   onError: (error) => console.error(error)
 * });
 *
 * await submit(
 *   { status: 'In Progress', notes: 'Working on it' },
 *   [{ fieldKey: 'urlJaringan', file: imageFile }]
 * );
 * ```
 */
export function useOfflineFormSubmit(
  options: OfflineFormSubmitOptions,
): OfflineFormSubmitState {
  const { isOnline, refreshCount } = useOfflineSync();
  const [isSubmitting, setIsSubmitting] = useState(false);

  /**
   * Submit form directly when online
   * Uploads images to Cloudinary first, then calls GraphQL mutation
   */
  const submitDirectly = useCallback(
    async (
      payload: Record<string, unknown>,
      compressedImages: Array<{
        fieldKey: string;
        file: File;
        cloudinaryFolder: string;
        tags: string[];
      }>,
    ) => {
      // 1. Upload all images to Cloudinary
      const resolvedUrls = new Map<string, string>();

      for (const image of compressedImages) {
        const result = await uploadToCloudinary(image.file, {
          folder: image.cloudinaryFolder,
          resourceType: "image",
          tags: image.tags,
        });

        resolvedUrls.set(image.fieldKey, result.secure_url);
      }

      // 2. Apply URLs to payload
      const finalPayload = { ...payload };
      for (const [fieldKey, url] of resolvedUrls) {
        if (fieldKey.startsWith("urlGambar_")) {
          const idx = parseInt(fieldKey.replace("urlGambar_", ""), 10);
          if (!Array.isArray(finalPayload.urlGambar)) {
            finalPayload.urlGambar = [];
          }
          (finalPayload.urlGambar as string[])[idx] = url;
        } else {
          finalPayload[fieldKey] = url;
        }
      }

      // 3. Call simpanProgres mutation
      const simpanInput = {
        workOrderId: options.workOrderId,
        data: JSON.stringify(finalPayload),
      };

      await graphqlAction<SimpanProgresResponse>(
        SIMPAN_PROGRES,
        { input: simpanInput },
        simpanInput,
      );

      // 4. If type is kirim_hasil, also call kirimHasil mutation
      if (options.type === "kirim_hasil") {
        const kirimInput = { workOrderId: options.workOrderId };
        await graphqlAction<KirimHasilResponse>(
          KIRIM_HASIL,
          { input: kirimInput },
          kirimInput,
        );
      }
    },
    [options.workOrderId, options.type],
  );

  /**
   * Main submit function that handles both online and offline scenarios
   *
   * **Validates: Requirements 2.1, 2.2, 2.3, 3.1, 3.2**
   */
  const submit = useCallback(
    async (payload: Record<string, unknown>, images: ImageToSubmit[]) => {
      setIsSubmitting(true);

      try {
        // Compress large images (>2MB) before storage/upload
        // **Validates: Requirement 3.6**
        const compressedImages = await Promise.all(
          images.map(async ({ fieldKey, file }) => {
            const compressed =
              file.size > 2 * 1024 * 1024 ? await compressImage(file, 2) : file;

            return {
              fieldKey,
              file: compressed,
              cloudinaryFolder: getCloudinaryFolder(options.jenisPekerjaan),
              tags: [options.workOrderId, options.jenisPekerjaan],
            };
          }),
        );

        if (isOnline) {
          // Online: direct submission
          await submitDirectly(payload, compressedImages);
          showToast.success("Data berhasil disimpan");
          options.onSuccess?.();
        } else {
          // Offline: queue for later
          // **Validates: Requirements 2.1, 2.2, 3.1, 3.2**
          await addPendingItem({
            workOrderId: options.workOrderId,
            jenisPekerjaan: options.jenisPekerjaan,
            progresPayload: payload,
            pendingImages: compressedImages,
            type: options.type,
          });

          await refreshCount();

          // **Validates: Requirement 2.3**
          showToast.info(
            "Data disimpan offline, akan disinkronkan saat online",
          );
          options.onSuccess?.();
        }
      } catch (error) {
        const err = error instanceof Error ? error : new Error("Submit failed");
        options.onError?.(err);
        showErrorToast(error);
      } finally {
        setIsSubmitting(false);
      }
    },
    [
      isOnline,
      options.workOrderId,
      options.jenisPekerjaan,
      options.type,
      options.onSuccess,
      options.onError,
      submitDirectly,
      refreshCount,
    ],
  );

  return { submit, isSubmitting };
}
