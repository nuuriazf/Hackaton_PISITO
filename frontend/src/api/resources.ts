import { api } from "./client";
import type {
  CreateEntryInput,
  CreateLinkResourceInput,
  CreateMediaResourceInput,
  CreateTextResourceInput,
  EntryItem,
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

export function createTextResource(entryId: number, input: CreateTextResourceInput) {
  return api<ResourceItem>(`/entries/${entryId}/resources/text`, {
    method: "POST",
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
