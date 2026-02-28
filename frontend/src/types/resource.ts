export type ResourceType = "TEXT" | "LINK" | "MEDIA";

export type ResourceItem = {
  id: number;
  type: ResourceType;
  title: string | null;
  textContent: string | null;
  url: string | null;
  storageKey: string | null;
  fileName: string | null;
  mimeType: string | null;
  createdAt: string;
};

export type EntryItem = {
  id: number;
  title: string;
  resources: ResourceItem[];
  createdAt: string;
  updatedAt: string;
};

export type CreateEntryResourceInput = {
  type: ResourceType;
  title?: string;
  textContent?: string;
  url?: string;
  storageKey?: string;
  fileName?: string;
  mimeType?: string;
};

export type CreateEntryInput = {
  title: string;
  resources?: CreateEntryResourceInput[];
};

export type CreateTextResourceInput = {
  title?: string;
  textContent: string;
};

export type CreateLinkResourceInput = {
  title?: string;
  url: string;
};

export type CreateMediaResourceInput = {
  title?: string;
  storageKey: string;
  fileName?: string;
  mimeType?: string;
};
