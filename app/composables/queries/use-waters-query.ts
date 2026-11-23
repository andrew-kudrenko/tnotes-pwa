import type { Water } from "../../domain/water/types";
import { useLiveQuery } from "../use-live-query";

export function useWatersQuery() {
  return useLiveQuery<Water[]>(async (db) => {
    const items = await db.waters.toArray();
    return items
      .filter((item) => item.meta.removedAt === undefined)
      .sort((a, b) => a.identity.name.localeCompare(b.identity.name, "ru"));
  }, []);
}
