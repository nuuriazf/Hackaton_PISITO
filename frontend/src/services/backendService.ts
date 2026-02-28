import { api } from "../api/client";
import type { Entry, CreateEntryInput } from "../types/entry";

export function getEntries() {
  return api<Entry[]>("/entries", {
    method: "GET"
  });
}

export function getEntry(id: number) {
  return api<Entry>(`/entries/${id}`, {
    method: "GET"
  });
}

export function createEntry(input: CreateEntryInput) {
  const formData = new FormData();
  formData.append("title", input.title);
  formData.append("userId", input.userId.toString());

  if (input.textResources) {
    input.textResources.forEach((text) => {
      formData.append("textResources", text);
    });
  }

  if (input.linkResources) {
    input.linkResources.forEach((url) => {
      formData.append("linkResources", url);
    });
  }

  if (input.mediaFiles) {
    input.mediaFiles.forEach((file) => {
      formData.append("mediaFiles", file);
    });
  }

  return api<Entry>("/entries", {
    method: "POST",
    body: formData
  });
}

export function deleteEntry(id: number) {
  return api<void>(`/entries/${id}`, {
    method: "DELETE"
  });
}

export function deleteResource(entryId: number, resourceId: number) {
  return api<void>(`/entries/${entryId}/resources/${resourceId}`, {
    method: "DELETE"
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

