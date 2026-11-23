import type { Tea } from "../../domain/tea/types";
import { useLiveQuery } from "../use-live-query";

export function useTeasQuery() {
  return useLiveQuery<Tea[]>(async (db) => {
    const items = await db.teas.toArray();
    return items
      .filter((item) => item.meta.removedAt === undefined)
      .sort((a, b) => a.identity.name.localeCompare(b.identity.name, "ru"));
  }, []);
}
