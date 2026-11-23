import type { EntityMeta, SessionMeta } from "./meta";

export function createEntityMeta(authorId?: string): EntityMeta {
  const now = new Date().toISOString();
  return {
    id: crypto.randomUUID(),
    authorId,
    createdAt: now,
    updatedAt: now,
    removedAt: undefined,
    revision: 0,
    syncStatus: "pending",
  };
}

export function createSessionMeta(authorId?: string): SessionMeta {
  const base = createEntityMeta(authorId);
  return {
    ...base,
    startedAt: base.createdAt,
  };
}
