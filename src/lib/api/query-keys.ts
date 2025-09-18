// TanStack Query key factories for consistent cache keys across features

export const eventsKeys = {
  all: () => ["events"] as const,
  lists: () => [...eventsKeys.all(), "list"] as const,
  list: (params: unknown) => [...eventsKeys.lists(), params] as const,
  details: () => [...eventsKeys.all(), "detail"] as const,
  detail: (id: string) => [...eventsKeys.details(), id] as const,
  participants: (id: string) => [...eventsKeys.detail(id), "participants"] as const,
};

export const usersKeys = {
  all: () => ["users"] as const,
  lists: () => [...usersKeys.all(), "list"] as const,
  list: (params: unknown) => [...usersKeys.lists(), params] as const,
  details: () => [...usersKeys.all(), "detail"] as const,
  detail: (id: string) => [...usersKeys.details(), id] as const,
};

export const bankAccountsKeys = {
  all: () => ["bank-accounts"] as const,
  lists: () => [...bankAccountsKeys.all(), "list"] as const,
  list: (params: unknown) => [...bankAccountsKeys.lists(), params] as const,
  details: () => [...bankAccountsKeys.all(), "detail"] as const,
  detail: (id: string) => [...bankAccountsKeys.details(), id] as const,
};

export const rolesKeys = {
  all: () => ["roles"] as const,
  lists: () => [...rolesKeys.all(), "list"] as const,
  list: (params?: unknown) => [...rolesKeys.lists(), params ?? {}] as const,
};

export const registrationsKeys = {
  all: () => ["registrations"] as const,
  lists: () => [...registrationsKeys.all(), "list"] as const,
  list: (params?: unknown) => [...registrationsKeys.lists(), params ?? {}] as const,
  details: () => [...registrationsKeys.all(), "detail"] as const,
  detail: (id: string) => [...registrationsKeys.details(), id] as const,
};
