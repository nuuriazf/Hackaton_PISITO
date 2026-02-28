export type TagItem = {
  id: number;
  name: string;
  createdAt: string;
};

export type ResourceType = "RAW" | "LINK" | "MEDIA";

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
  tags: TagItem[];
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
  flag?: "TEXT" | "SPOTIFY" | "YOUTUBE";
  notification?: boolean;
  tagIds?: number[];
};
