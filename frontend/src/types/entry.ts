export type Resource = {
  id: number;
  type: "TEXT" | "LINK" | "MEDIA";
  title?: string | null;
  textContent?: string | null;
  url?: string | null;
  storageKey?: string | null;
  fileName?: string | null;
  mimeType?: string | null;
  createDate: string;
};

export type Entry = {
  id: number;
  title: string;
  resources: Resource[];
  createDate: string;
  updateDate: string;
};

export type CreateEntryInput = {
  title?: string;
  userId: number;
  textResources?: string[];
  linkResources?: string[];
  mediaFiles?: File[];
};

export type CreateNoteInput = {
  title?: string;
  content: string;
  userId: number;
};
