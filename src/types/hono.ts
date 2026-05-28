export interface AuthUser {
  userId: number;
  username: string;
  role: 'admin' | 'kasir' | 'owner';
}

export interface AppVariables {
  requestId: string;
  user?: AuthUser;
}

export interface AppBindings {
  Variables: AppVariables;
}
