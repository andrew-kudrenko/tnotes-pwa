import Dexie, { type Table } from "dexie";

import type { CustomDescriptor } from "../../domain/lexicon/types";
import type { TastingSession } from "../../domain/session/types";
import type { Tea } from "../../domain/tea/types";
import type { Teaware } from "../../domain/teaware/types";
import type { Water } from "../../domain/water/types";
import type { OutboxRecord, SyncStateRecord } from "../sync/types";

export class TeaTastingDatabase extends Dexie {
  sessions!: Table<TastingSession, string>;
  teas!: Table<Tea, string>;
  waters!: Table<Water, string>;
  teawares!: Table<Teaware, string>;
  customDescriptors!: Table<CustomDescriptor, string>;
  outbox!: Table<OutboxRecord, string>;
  syncState!: Table<SyncStateRecord, string>;

  constructor(databaseName: string) {
    super(databaseName);

    this.version(1).stores({
      sessions:
        "meta.id, meta.startedAt, meta.updatedAt, meta.removedAt, meta.syncStatus, setup.teaId",
      teas: "meta.id, identity.name, identity.category, meta.updatedAt, meta.removedAt, meta.syncStatus",
      waters:
        "meta.id, identity.name, meta.updatedAt, meta.removedAt, meta.syncStatus",
      teawares:
        "meta.id, identity.name, identity.type, meta.updatedAt, meta.removedAt, meta.syncStatus",
      customDescriptors:
        "meta.id, code, parentCode, *searchTokens, meta.updatedAt, meta.removedAt, meta.syncStatus",
      outbox: "id, [entityType+entityId], createdAt",
      syncState: "key",
    });
  }
}
