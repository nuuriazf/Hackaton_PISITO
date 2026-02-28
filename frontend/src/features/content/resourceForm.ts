import type { ResourceType } from "../../types/resource";

export type ResourceFormValues = {
  selectedEntryId: number | "";
  type: ResourceType;
  title: string;
  textContent: string;
  url: string;
  storageKey: string;
  fileName: string;
  mimeType: string;
};

export const INITIAL_RESOURCE_FORM: ResourceFormValues = {
  selectedEntryId: "",
  type: "RAW",
  title: "",
  textContent: "",
  url: "",
  storageKey: "",
  fileName: "",
  mimeType: ""
};
