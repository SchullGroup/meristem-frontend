// Uploads any image/file to object storage (Huawei OBS) via the backend and returns its public URL.
// Kept as GetImageUrl(file, folderName) with a { type, result } return shape for backwards
// compatibility with every existing caller. `folderName` becomes the OBS key folder.
// (Previously POSTed base64 to an external AWS Lambda; now goes through our own /files/upload.)
import api from "@/services/api";

const MAX_UPLOAD_BYTES = 50_000_000; // 50MB — matches the backend multipart limit

export const GetImageUrl = async (file: File, folderName: string) => {
  if (!file) return { type: "error", result: "No file provided." };
  if (file.size > MAX_UPLOAD_BYTES) {
    return { type: "error", result: "File too large — maximum 50MB." };
  }
  try {
    const form = new FormData();
    form.append("file", file);
    if (folderName) form.append("folder", folderName);
    const res = await api.post(`/files/upload`, form, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return { type: "success", result: (res.data?.data?.url ?? "") as string };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Upload failed.";
    return { type: "error", result: message };
  }
};
