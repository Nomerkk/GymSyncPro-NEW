import { httpFetch } from "@/services/api";

export const uploadsService = {
  async uploadImage(dataUrl: string): Promise<{ url: string }> {
    const res = await httpFetch<{ url: string }>("/api/admin/upload-image", { method: "POST", body: { dataUrl } });
    if (!res.json || !res.json.url) throw new Error("Upload gagal");
    return res.json;
  },
};
