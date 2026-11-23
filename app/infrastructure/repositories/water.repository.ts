import type { Water } from "../../domain/water/types";
import { createRepository } from "./create-repository";

export const waterRepository = createRepository<Water>({
  entityType: "water",
  getTable: (db) => db.waters,
});
