import type { Teaware } from "../../domain/teaware/types";
import { createRepository } from "./create-repository";

export const teawareRepository = createRepository<Teaware>({
  entityType: "teaware",
  getTable: (db) => db.teawares,
});
