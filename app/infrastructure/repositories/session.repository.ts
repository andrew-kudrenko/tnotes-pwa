import type { TastingSession } from "../../domain/session/types";
import type { SessionMeta } from "../../domain/shared/meta";
import { getActiveDatabase } from "../db/connection";
import { createRepository } from "./create-repository";

const baseSessionRepository = createRepository<TastingSession, SessionMeta>({
  entityType: "session",
  getTable: (db) => db.sessions,
});

export const sessionRepository = {
  ...baseSessionRepository,
  async listByTeaId(teaId: string): Promise<TastingSession[]> {
    const db = getActiveDatabase();
    const items = await db.sessions
      .where("setup.teaId")
      .equals(teaId)
      .toArray();

    return items.filter((item) => item.meta.removedAt === undefined);
  },
};
