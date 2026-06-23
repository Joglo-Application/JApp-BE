export type UserRole =
  | 'admin'
  | 'kasir'
  | 'owner'
  | 'dapur'
  | 'supervisor'
  | 'gudang';

export interface AuthUser {
  userId: number;
  username: string;
  role: UserRole;
}

export interface AppVariables {
  requestId: string;
  user?: AuthUser;
}

export interface AppBindings {
  Variables: AppVariables;
}
