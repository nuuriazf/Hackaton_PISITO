import { api } from "./client";
import type {
  CreateEntryInput,
  EntryFolderItem,
  CreateLinkResourceInput,
  CreateMediaResourceInput,
  CreateTextResourceInput,
  EntryItem,
  FolderItem,
  ResourceItem
} from "../types/resource";

export function fetchEntries() {
  return api<EntryItem[]>("/entries");
}

export function createEntry(input: string | CreateEntryInput) {
  const payload =
    typeof input === "string" ? { title: input, flag: "RAW" as const } : { ...input, flag: input.flag ?? ("RAW" as const) };
  return api<EntryItem>("/entries", {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export function updateEntryTitle(entryId: number, title: string) {
  return api<EntryItem>(`/entries/${entryId}`, {
    method: "PUT",
    body: JSON.stringify({ title })
  });
}

export function createTextResource(entryId: number, input: CreateTextResourceInput) {
  return api<ResourceItem>(`/entries/${entryId}/resources/text`, {
    method: "POST",
    body: JSON.stringify(input)
  });
}

export function updateTextResource(
  entryId: number,
  resourceId: number,
  input: CreateTextResourceInput
) {
  return api<ResourceItem>(`/entries/${entryId}/resources/${resourceId}/text`, {
    method: "PUT",
    body: JSON.stringify(input)
  });
}

export function createLinkResource(entryId: number, input: CreateLinkResourceInput) {
  return api<ResourceItem>(`/entries/${entryId}/resources/link`, {
    method: "POST",
    body: JSON.stringify(input)
  });
}

export function createMediaResource(entryId: number, input: CreateMediaResourceInput) {
  return api<ResourceItem>(`/entries/${entryId}/resources/media`, {
    method: "POST",
    body: JSON.stringify(input)
  });
}

export function deleteResource(entryId: number, resourceId: number) {
  return api<void>(`/entries/${entryId}/resources/${resourceId}`, {
    method: "DELETE"
  });
}

export function deleteEntry(entryId: number) {
  return api<void>(`/entries/${entryId}`, {
    method: "DELETE"
  });
}

export function fetchFolders() {
  return api<FolderItem[]>("/folders");
}

export function createFolder(title: string) {
  return api<FolderItem>("/folders", {
    method: "POST",
    body: JSON.stringify({ title })
  });
}

export function fetchEntryFolders(entryId: number) {
  return api<EntryFolderItem[]>(`/entries/${entryId}/folders`);
}

export function updateEntryFolderSelection(entryId: number, folderId: number, selected: boolean) {
  return api<EntryFolderItem[]>(`/entries/${entryId}/folders/${folderId}`, {
    method: "PUT",
    body: JSON.stringify({ selected })
  });
}
