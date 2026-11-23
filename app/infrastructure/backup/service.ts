import type { Table } from "dexie";
import type { EntityMeta, HasMeta } from "../../domain/shared/meta";
import { getActiveDatabase } from "../db/connection";
import type { TeaTastingDatabase } from "../db/schema";
import type { OutboxRecord, SyncEntityType } from "../sync/types";
import type { BackupEnvelope, BackupPayload, ImportStrategy } from "./types";
import { validateBackupEnvelope } from "./validator";

export interface ImportStats {
  inserted: number;
  updated: number;
  skipped: number;
}

export async function exportDatabaseToEnvelope(
  includeRemoved = true,
): Promise<BackupEnvelope> {
  const db = getActiveDatabase();

  const [sessions, teas, waters, teawares, customDescriptors] =
    await Promise.all([
      db.sessions.toArray(),
      db.teas.toArray(),
      db.waters.toArray(),
      db.teawares.toArray(),
      db.customDescriptors.toArray(),
    ]);

  const filterRemoved = <T extends HasMeta<EntityMeta>>(items: T[]): T[] =>
    includeRemoved
      ? items
      : items.filter((item) => item.meta.removedAt === undefined);

  return {
    format: "tea-tasting-backup",
    schemaVersion: 1,
    exportedAt: new Date().toISOString(),
    payload: {
      sessions: filterRemoved(sessions),
      teas: filterRemoved(teas),
      waters: filterRemoved(waters),
      teawares: filterRemoved(teawares),
      customDescriptors: filterRemoved(customDescriptors),
    },
  };
}

export async function exportDatabaseToJsonString(
  includeRemoved = true,
  pretty = true,
): Promise<string> {
  const envelope = await exportDatabaseToEnvelope(includeRemoved);
  return JSON.stringify(envelope, null, pretty ? 2 : 0);
}

async function importCollection<T extends HasMeta<EntityMeta>>(
  table: Table<T, string>,
  outboxTable: Table<OutboxRecord, string>,
  entityType: SyncEntityType,
  incoming: T[],
  strategy: ImportStrategy,
  stats: ImportStats,
  now: string,
): Promise<void> {
  for (const item of incoming) {
    const existing = await table.get(item.meta.id);

    if (existing) {
      if (strategy === "skipExisting") {
        stats.skipped += 1;
        continue;
      }

      if (strategy === "merge") {
        const existingTime = Date.parse(existing.meta.updatedAt);
        const incomingTime = Date.parse(item.meta.updatedAt);
        if (
          !Number.isNaN(existingTime) &&
          !Number.isNaN(incomingTime) &&
          incomingTime <= existingTime
        ) {
          stats.skipped += 1;
          continue;
        }
      }
    }

    const baseRevision = existing ? existing.meta.revision : 0;
    const prepared: T = {
      ...item,
      meta: {
        ...item.meta,
        revision: baseRevision + 1,
        syncStatus: "pending",
      },
    };

    await table.put(prepared);

    const existingOutbox = await outboxTable
      .where("[entityType+entityId]")
      .equals([entityType, prepared.meta.id])
      .first();

    const operation =
      prepared.meta.removedAt !== undefined ? "delete" : "upsert";

    if (existingOutbox) {
      await outboxTable.update(existingOutbox.id, {
        operation,
        payload: prepared,
        createdAt: now,
      });
    } else {
      await outboxTable.add({
        id: crypto.randomUUID(),
        entityType,
        entityId: prepared.meta.id,
        operation,
        payload: prepared,
        baseRevision,
        createdAt: now,
        retryCount: 0,
        lastError: undefined,
      });
    }

    if (existing) {
      stats.updated += 1;
    } else {
      stats.inserted += 1;
    }
  }
}

export async function importPayloadToDatabase(
  db: TeaTastingDatabase,
  payload: BackupPayload,
  strategy: ImportStrategy = "merge",
): Promise<ImportStats> {
  const stats: ImportStats = {
    inserted: 0,
    updated: 0,
    skipped: 0,
  };
  const now = new Date().toISOString();

  await db.transaction(
    "rw",
    [
      db.sessions,
      db.teas,
      db.waters,
      db.teawares,
      db.customDescriptors,
      db.outbox,
    ],
    async () => {
      if (strategy === "replace") {
        await Promise.all([
          db.sessions.clear(),
          db.teas.clear(),
          db.waters.clear(),
          db.teawares.clear(),
          db.customDescriptors.clear(),
          db.outbox.clear(),
        ]);
      }

      await importCollection(
        db.teas,
        db.outbox,
        "tea",
        payload.teas,
        strategy,
        stats,
        now,
      );
      await importCollection(
        db.waters,
        db.outbox,
        "water",
        payload.waters,
        strategy,
        stats,
        now,
      );
      await importCollection(
        db.teawares,
        db.outbox,
        "teaware",
        payload.teawares,
        strategy,
        stats,
        now,
      );
      await importCollection(
        db.customDescriptors,
        db.outbox,
        "customDescriptor",
        payload.customDescriptors,
        strategy,
        stats,
        now,
      );
      await importCollection(
        db.sessions,
        db.outbox,
        "session",
        payload.sessions,
        strategy,
        stats,
        now,
      );
    },
  );

  return stats;
}

export async function importFromJsonString(
  jsonText: string,
  strategy: ImportStrategy = "merge",
): Promise<ImportStats> {
  const parsed: unknown = JSON.parse(jsonText);
  const envelope = validateBackupEnvelope(parsed);
  const db = getActiveDatabase();
  return await importPayloadToDatabase(db, envelope.payload, strategy);
}
