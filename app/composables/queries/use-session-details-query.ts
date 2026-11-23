import { toValue, type MaybeRefOrGetter } from "vue";

import type { TastingSession } from "../../domain/session/types";
import type { Tea } from "../../domain/tea/types";
import type { Teaware } from "../../domain/teaware/types";
import type { Water } from "../../domain/water/types";
import { useLiveQuery } from "../use-live-query";

export interface SessionDetails {
  session: TastingSession | undefined;
  tea: Tea | undefined;
  water: Water | undefined;
  teaware: Teaware | undefined;
}

export function useSessionDetailsQuery(sessionId: MaybeRefOrGetter<string>) {
  return useLiveQuery<SessionDetails>(
    async (db) => {
      const id = toValue(sessionId);
      const session = await db.sessions.get(id);

      if (!session || session.meta.removedAt !== undefined) {
        return {
          session: undefined,
          tea: undefined,
          water: undefined,
          teaware: undefined,
        };
      }

      const [tea, water, teaware] = await Promise.all([
        session.setup.teaId ? db.teas.get(session.setup.teaId) : undefined,
        session.setup.waterId
          ? db.waters.get(session.setup.waterId)
          : undefined,
        session.setup.teawareId
          ? db.teawares.get(session.setup.teawareId)
          : undefined,
      ]);

      return {
        session,
        tea,
        water,
        teaware,
      };
    },
    {
      session: undefined,
      tea: undefined,
      water: undefined,
      teaware: undefined,
    },
  );
}
