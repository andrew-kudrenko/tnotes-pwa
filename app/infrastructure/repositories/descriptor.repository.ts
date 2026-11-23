import type { CustomDescriptor } from "../../domain/lexicon/types";
import { createRepository } from "./create-repository";

export const descriptorRepository = createRepository<CustomDescriptor>({
  entityType: "customDescriptor",
  getTable: (db) => db.customDescriptors,
});
