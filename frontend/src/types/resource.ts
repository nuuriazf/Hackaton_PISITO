export type TagItem = {
  id: number;
  name: string;
  createdAt: string;
};

export type ResourceType = "TEXT" | "RAW" | "LINK" | "MEDIA";
export type EntryFlag =
  | "RAW"
  | "YOUTUBE"
  | "LINK"
  | "SPOTIFY"
  | "TWITCH"
  | "TABLE"
  | "ENUMERATION"
  | "CHECKLIST";

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
  flag: EntryFlag | null;
  resources: ResourceItem[];
  tags: TagItem[];
  createdAt: string;
  updatedAt: string;
};

export type FolderItem = {
  id: number;
  title: string;
};

export type EntryFolderItem = {
  id: number;
  title: string;
  selected: boolean;
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
  title?: string;
  resources?: CreateEntryResourceInput[];
  flag?: EntryFlag;
  notification?: boolean;
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

export type UploadFileResult = {
  path: string;
  fileName: string;
  mimeType: string;
  size: number;
};
