/**
 * Example usage of useOfflineFormSubmit Hook
 *
 * This example demonstrates how to use the useOfflineFormSubmit hook
 * for offline-first form submission with image uploads.
 */

"use client";

import { useState } from "react";
import { useOfflineFormSubmit } from "./useOfflineFormSubmit";
import { useRouter } from "next/navigation";

interface WorkOrderFormData extends Record<string, unknown> {
  status: string;
  notes: string;
  location: string;
}

export function WorkOrderFormExample() {
  const router = useRouter();
  const [formData, setFormData] = useState<WorkOrderFormData>({
    status: "In Progress",
    notes: "",
    location: "",
  });
  const [selectedImages, setSelectedImages] = useState<File[]>([]);

  // Initialize the hook with configuration
  const { submit, isSubmitting } = useOfflineFormSubmit({
    workOrderId: "wo-123",
    jenisPekerjaan: "Pemasangan Baru",
    type: "simpan_progres",
    onSuccess: () => {
      // Navigate to success page or refresh data
      router.push("/pekerjaan/wo-123");
    },
    onError: (error) => {
      // Handle error (toast is already shown by the hook)
      console.error("Form submission failed:", error);
    },
  });

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setSelectedImages((prev) => [...prev, ...files]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Prepare images with field keys
    const images = selectedImages.map((file, index) => ({
      fieldKey: `urlGambar_${index}`,
      file,
    }));

    // Submit form with payload and images
    await submit(formData, images);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="status" className="block text-sm font-medium">
          Status
        </label>
        <select
          id="status"
          value={formData.status}
          onChange={(e) =>
            setFormData((prev) => ({ ...prev, status: e.target.value }))
          }
          className="mt-1 block w-full rounded-md border p-2"
        >
          <option value="In Progress">In Progress</option>
          <option value="Completed">Completed</option>
          <option value="Pending">Pending</option>
        </select>
      </div>

      <div>
        <label htmlFor="notes" className="block text-sm font-medium">
          Notes
        </label>
        <textarea
          id="notes"
          value={formData.notes}
          onChange={(e) =>
            setFormData((prev) => ({ ...prev, notes: e.target.value }))
          }
          className="mt-1 block w-full rounded-md border p-2"
          rows={4}
        />
      </div>

      <div>
        <label htmlFor="location" className="block text-sm font-medium">
          Location
        </label>
        <input
          id="location"
          type="text"
          value={formData.location}
          onChange={(e) =>
            setFormData((prev) => ({ ...prev, location: e.target.value }))
          }
          className="mt-1 block w-full rounded-md border p-2"
        />
      </div>

      <div>
        <label htmlFor="images" className="block text-sm font-medium">
          Upload Images
        </label>
        <input
          id="images"
          type="file"
          accept="image/*"
          multiple
          onChange={handleImageSelect}
          className="mt-1 block w-full"
        />
        {selectedImages.length > 0 && (
          <p className="mt-2 text-sm text-gray-600">
            {selectedImages.length} image(s) selected
          </p>
        )}
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:bg-gray-400"
      >
        {isSubmitting ? "Submitting..." : "Submit"}
      </button>
    </form>
  );
}

/**
 * Example: Submit with kirim_hasil type
 */
export function FinalSubmissionExample() {
  const router = useRouter();

  const { submit, isSubmitting } = useOfflineFormSubmit({
    workOrderId: "wo-456",
    jenisPekerjaan: "Maintenance",
    type: "kirim_hasil", // This will call both simpanProgres and kirimHasil
    onSuccess: () => {
      router.push("/pekerjaan");
    },
  });

  const handleFinalSubmit = async () => {
    const finalData = {
      status: "Completed",
      completionNotes: "Work completed successfully",
      completedAt: new Date().toISOString(),
    };

    // No images in this example
    await submit(finalData, []);
  };

  return (
    <button
      onClick={handleFinalSubmit}
      disabled={isSubmitting}
      className="rounded-md bg-green-600 px-4 py-2 text-white hover:bg-green-700 disabled:bg-gray-400"
    >
      {isSubmitting ? "Submitting..." : "Submit Final Result"}
    </button>
  );
}

/**
 * Example: Submit with single image field
 */
export function SingleImageSubmissionExample() {
  const [networkImage, setNetworkImage] = useState<File | null>(null);

  const { submit, isSubmitting } = useOfflineFormSubmit({
    workOrderId: "wo-789",
    jenisPekerjaan: "Pengawasan Jaringan",
    type: "simpan_progres",
  });

  const handleSubmit = async () => {
    if (!networkImage) {
      alert("Please select an image");
      return;
    }

    const payload = {
      inspectionDate: new Date().toISOString(),
      findings: "Network inspection completed",
    };

    // Single image with specific field key
    const images = [
      {
        fieldKey: "urlJaringan",
        file: networkImage,
      },
    ];

    await submit(payload, images);
  };

  return (
    <div className="space-y-4">
      <input
        type="file"
        accept="image/*"
        onChange={(e) => setNetworkImage(e.target.files?.[0] || null)}
      />
      <button
        onClick={handleSubmit}
        disabled={isSubmitting || !networkImage}
        className="rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:bg-gray-400"
      >
        {isSubmitting ? "Uploading..." : "Submit Inspection"}
      </button>
    </div>
  );
}

/**
 * Example: Handling large images (automatic compression)
 */
export function LargeImageSubmissionExample() {
  const [largeImages, setLargeImages] = useState<File[]>([]);

  const { submit, isSubmitting } = useOfflineFormSubmit({
    workOrderId: "wo-999",
    jenisPekerjaan: "Pemasangan Baru",
    type: "simpan_progres",
  });

  const handleSubmit = async () => {
    // Images larger than 2MB will be automatically compressed
    const images = largeImages.map((file, index) => ({
      fieldKey: `urlGambar_${index}`,
      file,
    }));

    await submit({ notes: "High-resolution photos attached" }, images);
  };

  return (
    <div className="space-y-4">
      <input
        type="file"
        accept="image/*"
        multiple
        onChange={(e) => setLargeImages(Array.from(e.target.files || []))}
      />
      {largeImages.length > 0 && (
        <div className="text-sm text-gray-600">
          <p>{largeImages.length} image(s) selected</p>
          <p>
            Total size:{" "}
            {(
              largeImages.reduce((sum, file) => sum + file.size, 0) /
              1024 /
              1024
            ).toFixed(2)}{" "}
            MB
          </p>
          <p className="text-xs text-gray-500">
            Images larger than 2MB will be automatically compressed
          </p>
        </div>
      )}
      <button
        onClick={handleSubmit}
        disabled={isSubmitting || largeImages.length === 0}
        className="rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:bg-gray-400"
      >
        {isSubmitting ? "Processing..." : "Submit"}
      </button>
    </div>
  );
}
