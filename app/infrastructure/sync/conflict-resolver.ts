import type { Table } from "dexie";
import type { EntityMeta, HasMeta } from "../../domain/shared/meta";
import { getActiveDatabase } from "../db/connection";
import type { TeaTastingDatabase } from "../db/schema";
import { syncEngine } from "./engine";
import type { SyncEntityType } from "./types";

export interface SyncConflictItem {
  entityType: SyncEntityType;
  entityId: string;
  localEntity: HasMeta<EntityMeta>;
  serverEntity: HasMeta<EntityMeta> | undefined;
}

function getTable(
  db: TeaTastingDatabase,
  entityType: SyncEntityType,
): Table<HasMeta<EntityMeta>, string> {
  switch (entityType) {
    case "session":
      return db.sessions as unknown as Table<HasMeta<EntityMeta>, string>;
    case "tea":
      return db.teas as unknown as Table<HasMeta<EntityMeta>, string>;
    case "water":
      return db.waters as unknown as Table<HasMeta<EntityMeta>, string>;
    case "teaware":
      return db.teawares as unknown as Table<HasMeta<EntityMeta>, string>;
    case "customDescriptor":
      return db.customDescriptors as unknown as Table<
        HasMeta<EntityMeta>,
        string
      >;
  }
}

export async function listActiveConflicts(): Promise<SyncConflictItem[]> {
  const db = getActiveDatabase();
  const types: SyncEntityType[] = [
    "session",
    "tea",
    "water",
    "teaware",
    "customDescriptor",
  ];
  const conflicts: SyncConflictItem[] = [];

  for (const entityType of types) {
    const table = getTable(db, entityType);
    const items = await table.toArray();
    for (const item of items) {
      if (item.meta.syncStatus !== "conflict") {
        continue;
      }
      const stateRow = await db.syncState.get(
        `conflict:${entityType}:${item.meta.id}`,
      );
      let serverEntity: HasMeta<EntityMeta> | undefined;
      if (stateRow) {
        try {
          serverEntity = JSON.parse(stateRow.value) as HasMeta<EntityMeta>;
        } catch {
          serverEntity = undefined;
        }
      }
      conflicts.push({
        entityType,
        entityId: item.meta.id,
        localEntity: item,
        serverEntity,
      });
    }
  }

  return conflicts;
}

export async function resolveConflict(
  conflict: SyncConflictItem,
  choice: "keepLocal" | "acceptServer",
): Promise<void> {
  const db = getActiveDatabase();
  const table = getTable(db, conflict.entityType);
  const now = new Date().toISOString();
  const conflictKey = `conflict:${conflict.entityType}:${conflict.entityId}`;

  await db.transaction("rw", [table, db.outbox, db.syncState], async () => {
    if (choice === "acceptServer" && conflict.serverEntity) {
      await table.put({
        ...conflict.serverEntity,
        meta: {
          ...conflict.serverEntity.meta,
          syncStatus: "synced",
        },
      });
    } else {
      const serverRev =
        conflict.serverEntity?.meta.revision ??
        conflict.localEntity.meta.revision;
      const updatedLocal: HasMeta<EntityMeta> = {
        ...conflict.localEntity,
        meta: {
          ...conflict.localEntity.meta,
          updatedAt: now,
          revision: serverRev + 1,
          syncStatus: "pending",
        },
      };
      await table.put(updatedLocal);
      await db.outbox.add({
        id: crypto.randomUUID(),
        entityType: conflict.entityType,
        entityId: conflict.entityId,
        operation:
          updatedLocal.meta.removedAt !== undefined ? "delete" : "upsert",
        payload: updatedLocal,
        baseRevision: serverRev,
        createdAt: now,
        retryCount: 0,
        lastError: undefined,
      });
    }

    await db.syncState.delete(conflictKey);
  });

  if (choice === "keepLocal") {
    await syncEngine.syncNow();
  }
}
