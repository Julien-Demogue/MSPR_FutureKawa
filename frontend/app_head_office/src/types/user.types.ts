export interface Role {
  id: number;
  uuid: string;
  label: string;
}

/** Forme renvoyée par l'API en lecture (GET /users, GET /users/me, etc.) */
export interface User {
  id: number;
  uuid: string;
  email: string;
  first_name: string;
  last_name: string;
  role: Role;
}

/** Payload attendu par POST /users */
export interface CreateUserPayload {
  first_name?: string;
  last_name?: string;
  email: string;
  password: string;
  role_label: string;
}

/** Payload attendu par PATCH /users (tous les champs optionnels) */
export type UpdateUserPayload = Partial<CreateUserPayload>;