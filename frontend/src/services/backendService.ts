import { api } from "../api/client";
import type { Entry } from "../types/entry";

export function fetchEntries() {
  return api<Entry[]>("/entries", {
    method: "GET"
  });
}

export function uploadDocument(file: File) {
  const formData = new FormData();
  formData.append("file", file);

  return api("/upload", {
    method: "POST",
    body: formData
  });
}
