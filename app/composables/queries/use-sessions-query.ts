import type { TastingSession } from "../../domain/session/types";
import { useLiveQuery } from "../use-live-query";

export function useSessionsQuery() {
  return useLiveQuery<TastingSession[]>(async (db) => {
    const items = await db.sessions.toArray();
    return items
      .filter((item) => item.meta.removedAt === undefined)
      .sort((a, b) => b.meta.startedAt.localeCompare(a.meta.startedAt));
  }, []);
}
