export type AuthMode = "login" | "register";

export type AuthCredentials = {
  username: string;
  password: string;
};

export type AuthUser = {
  id: number;
  username: string;
  createdAt: string;
  updatedAt: string;
  lastLoginAt: string | null;
  passwordUpdatedAt: string | null;
};

export type AuthTokenResponse = {
  tokenType: string;
  accessToken: string;
  expiresInSeconds: number;
  user: AuthUser;
};
