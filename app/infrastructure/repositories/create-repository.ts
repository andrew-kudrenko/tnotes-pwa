import type { Table } from "dexie";

import type { EntityMeta, HasMeta } from "../../domain/shared/meta";
import { getActiveDatabase } from "../db/connection";
import type { TeaTastingDatabase } from "../db/schema";
import type { SyncEntityType } from "../sync/types";

export interface RepositoryConfig<
  TEntity extends HasMeta<TMeta>,
  TMeta extends EntityMeta = EntityMeta,
> {
  entityType: SyncEntityType;
  getTable: (db: TeaTastingDatabase) => Table<TEntity, string>;
  resolveDatabase?: () => TeaTastingDatabase;
}

export interface Repository<
  TEntity extends HasMeta<TMeta>,
  TMeta extends EntityMeta = EntityMeta,
> {
  getById: (id: string) => Promise<TEntity | undefined>;
  listActive: () => Promise<TEntity[]>;
  listAllIncludingRemoved: () => Promise<TEntity[]>;
  upsert: (entity: TEntity) => Promise<TEntity>;
  softDelete: (id: string) => Promise<void>;
}

export function createRepository<
  TEntity extends HasMeta<TMeta>,
  TMeta extends EntityMeta = EntityMeta,
>(config: RepositoryConfig<TEntity, TMeta>): Repository<TEntity, TMeta> {
  const resolveDb = config.resolveDatabase ?? getActiveDatabase;

  async function getById(id: string): Promise<TEntity | undefined> {
    const db = resolveDb();
    return await config.getTable(db).get(id);
  }

  async function listActive(): Promise<TEntity[]> {
    const db = resolveDb();
    const all = await config.getTable(db).toArray();
    return all.filter((item) => item.meta.removedAt === undefined);
  }

  async function listAllIncludingRemoved(): Promise<TEntity[]> {
    const db = resolveDb();
    return await config.getTable(db).toArray();
  }

  async function upsert(entity: TEntity): Promise<TEntity> {
    const db = resolveDb();
    const table = config.getTable(db);
    const now = new Date().toISOString();

    return await db.transaction("rw", [table, db.outbox], async () => {
      const existing = await table.get(entity.meta.id);
      const baseRevision = existing ? existing.meta.revision : 0;

      const plainEntity = JSON.parse(JSON.stringify(entity)) as TEntity;

      const updated: TEntity = {
        ...plainEntity,
        meta: {
          ...plainEntity.meta,
          createdAt: existing
            ? existing.meta.createdAt
            : plainEntity.meta.createdAt || now,
          updatedAt: now,
          revision: baseRevision + 1,
          syncStatus: "pending",
        },
      };

      await table.put(updated);

      const existingOutbox = await db.outbox
        .where("[entityType+entityId]")
        .equals([config.entityType, updated.meta.id])
        .first();

      if (existingOutbox) {
        await db.outbox.update(existingOutbox.id, {
          operation: "upsert",
          payload: updated,
          createdAt: now,
        });
      } else {
        await db.outbox.add({
          id: crypto.randomUUID(),
          entityType: config.entityType,
          entityId: updated.meta.id,
          operation: "upsert",
          payload: updated,
          baseRevision,
          createdAt: now,
          retryCount: 0,
          lastError: undefined,
        });
      }

      return updated;
    });
  }

  async function softDelete(id: string): Promise<void> {
    const db = resolveDb();
    const table = config.getTable(db);
    const now = new Date().toISOString();

    await db.transaction("rw", [table, db.outbox], async () => {
      const existing = await table.get(id);
      if (!existing || existing.meta.removedAt !== undefined) {
        return;
      }

      const baseRevision = existing.meta.revision;
      const removed: TEntity = {
        ...existing,
        meta: {
          ...existing.meta,
          updatedAt: now,
          removedAt: now,
          revision: baseRevision + 1,
          syncStatus: "pending",
        },
      };

      await table.put(removed);

      const existingOutbox = await db.outbox
        .where("[entityType+entityId]")
        .equals([config.entityType, id])
        .first();

      if (existingOutbox) {
        await db.outbox.update(existingOutbox.id, {
          operation: "delete",
          payload: removed,
          createdAt: now,
        });
      } else {
        await db.outbox.add({
          id: crypto.randomUUID(),
          entityType: config.entityType,
          entityId: id,
          operation: "delete",
          payload: removed,
          baseRevision,
          createdAt: now,
          retryCount: 0,
          lastError: undefined,
        });
      }
    });
  }

  return {
    getById,
    listActive,
    listAllIncludingRemoved,
    upsert,
    softDelete,
  };
}
