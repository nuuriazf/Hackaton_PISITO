import { api } from "./client";
import type { CreateResourceInput, ResourceType, SavedResource } from "../types/resource";

export function fetchResources() {
  return api<SavedResource[]>("/resources");
}

export function createResource(input: CreateResourceInput) {
  return api<SavedResource>("/resources", {
    method: "POST",
    body: JSON.stringify(input)
  });
}

export function uploadResourceFile(type: ResourceType, file: File, title?: string) {
  const form = new FormData();
  form.append("type", type);
  form.append("file", file);
  if (title?.trim()) {
    form.append("title", title.trim());
  }

  return api<SavedResource>("/resources/upload", {
    method: "POST",
    body: form
  });
}

export function deleteResource(id: number) {
  return api<void>(`/resources/${id}`, {
    method: "DELETE"
  });
}

