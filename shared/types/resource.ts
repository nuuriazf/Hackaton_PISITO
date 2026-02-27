export type ResourceType = "TEXT" | "LINK" | "VIDEO" | "IMAGE" | "PHOTO" | "FILE";

export type SavedResource = {
  id: number;
  type: ResourceType;
  title: string | null;
  textContent: string | null;
  externalUrl: string | null;
  storageKey: string | null;
  fileName: string | null;
  mimeType: string | null;
  accessUrl: string | null;
  createdAt: string;
};

