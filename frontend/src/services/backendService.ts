import { api } from "../api/client";
import type { Entry } from "../types/entry";

export function getEntries() {
  return api<Entry[]>("/entries", {
    method: "GET"
  });
}

export function uploadFile(file: File) {
  const formData = new FormData();
  formData.append("file", file);

  return api("/upload", {
    method: "POST",
    body: formData
  });
}

