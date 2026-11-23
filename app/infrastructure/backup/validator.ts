import type { BackupEnvelope, BackupPayload } from "./types";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function hasValidMetaArray(items: unknown): boolean {
  if (!Array.isArray(items)) {
    return false;
  }
  return items.every(
    (item) =>
      isRecord(item) &&
      isRecord(item.meta) &&
      typeof item.meta.id === "string" &&
      typeof item.meta.updatedAt === "string",
  );
}

export function validateBackupEnvelope(raw: unknown): BackupEnvelope {
  if (!isRecord(raw)) {
    throw new Error("Invalid backup file: root must be an object");
  }

  if (raw.format !== "tea-tasting-backup") {
    throw new Error("Invalid backup file: unsupported format");
  }

  if (raw.schemaVersion !== 1) {
    throw new Error(
      `Unsupported backup schema version: ${String(raw.schemaVersion)}`,
    );
  }

  if (!isRecord(raw.payload)) {
    throw new Error("Invalid backup file: missing payload");
  }

  const payload = raw.payload;

  if (
    !hasValidMetaArray(payload.sessions) ||
    !hasValidMetaArray(payload.teas) ||
    !hasValidMetaArray(payload.waters) ||
    !hasValidMetaArray(payload.teawares) ||
    !hasValidMetaArray(payload.customDescriptors)
  ) {
    throw new Error("Invalid backup file: corrupted entity collections");
  }

  return raw as unknown as BackupEnvelope;
}

export function createEmptyBackupPayload(): BackupPayload {
  return {
    sessions: [],
    teas: [],
    waters: [],
    teawares: [],
    customDescriptors: [],
  };
}
