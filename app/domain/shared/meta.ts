import type { SyncStatus } from "./enums";

export interface EntityMeta {
  id: string;
  authorId: string | undefined;

  createdAt: string;
  updatedAt: string;
  removedAt: string | undefined;

  revision: number;
  syncStatus: SyncStatus;
}

export interface SessionMeta extends EntityMeta {
  startedAt: string;
}

export interface HasMeta<M extends EntityMeta = EntityMeta> {
  meta: M;
}
