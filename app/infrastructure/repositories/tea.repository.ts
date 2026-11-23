import type { Tea } from "../../domain/tea/types";
import { createRepository } from "./create-repository";

export const teaRepository = createRepository<Tea>({
  entityType: "tea",
  getTable: (db) => db.teas,
});
