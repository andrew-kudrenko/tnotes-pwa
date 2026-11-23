export type SyncEntityType =
  | "session"
  | "tea"
  | "water"
  | "teaware"
  | "customDescriptor";

export type OutboxOperation = "upsert" | "delete";

export interface OutboxRecord {
  id: string;
  entityType: SyncEntityType;
  entityId: string;
  operation: OutboxOperation;
  payload: unknown;
  baseRevision: number;
  createdAt: string;
  retryCount: number;
  lastError: string | undefined;
}

export interface SyncStateRecord {
  key: string;
  value: string;
}
