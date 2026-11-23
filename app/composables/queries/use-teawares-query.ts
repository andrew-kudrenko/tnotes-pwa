import type { Teaware } from "../../domain/teaware/types";
import { useLiveQuery } from "../use-live-query";

export function useTeawaresQuery() {
  return useLiveQuery<Teaware[]>(async (db) => {
    const items = await db.teawares.toArray();
    return items
      .filter((item) => item.meta.removedAt === undefined)
      .sort((a, b) => a.identity.name.localeCompare(b.identity.name, "ru"));
  }, []);
}
