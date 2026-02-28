import { api } from "../api/client";
import type { Entry, CreateNoteInput } from "../types/entry";

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

export function createEntry(input: CreateNoteInput) {
  return api<Entry>("/entries", {
    method: "POST",
    body: JSON.stringify(input)
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

