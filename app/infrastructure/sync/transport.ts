import type { OutboxRecord, SyncEntityType } from "./types";

export interface PushItemResult {
  outboxId: string;
  status: "applied" | "conflict" | "error";
  serverRevision?: number;
  errorMessage?: string;
}

export interface PullChangeItem {
  entityType: SyncEntityType;
  entity: unknown;
}

export interface PullResponse {
  changes: PullChangeItem[];
  nextCursor: string;
}

export interface SyncTransport {
  readonly isRemoteEnabled: boolean;
  push: (records: OutboxRecord[]) => Promise<PushItemResult[]>;
  pull: (cursor: string | undefined) => Promise<PullResponse>;
}

export const localOnlySyncTransport: SyncTransport = {
  isRemoteEnabled: false,
  async push(): Promise<PushItemResult[]> {
    return [];
  },
  async pull(cursor: string | undefined): Promise<PullResponse> {
    return {
      changes: [],
      nextCursor: cursor ?? "",
    };
  },
};
