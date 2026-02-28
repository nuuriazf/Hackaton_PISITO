export type Entry = {
  id?: number | string;
  title?: string | null;
  createdAt?: string | null;
  [key: string]: unknown;
};
