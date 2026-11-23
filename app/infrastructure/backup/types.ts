import type { CustomDescriptor } from "../../domain/lexicon/types";
import type { TastingSession } from "../../domain/session/types";
import type { Tea } from "../../domain/tea/types";
import type { Teaware } from "../../domain/teaware/types";
import type { Water } from "../../domain/water/types";

export type ImportStrategy = "merge" | "skipExisting" | "replace";

export interface BackupPayload {
  sessions: TastingSession[];
  teas: Tea[];
  waters: Water[];
  teawares: Teaware[];
  customDescriptors: CustomDescriptor[];
}

export interface BackupEnvelope {
  format: "tea-tasting-backup";
  schemaVersion: 1;
  exportedAt: string;
  payload: BackupPayload;
}
