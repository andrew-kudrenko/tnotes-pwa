import type { CustomDescriptor } from "../../domain/lexicon/types";
import { useLiveQuery } from "../use-live-query";

export function useCustomDescriptorsQuery() {
  return useLiveQuery<CustomDescriptor[]>(async (db) => {
    const items = await db.customDescriptors.toArray();
    return items.filter((item) => item.meta.removedAt === undefined);
  }, []);
}
