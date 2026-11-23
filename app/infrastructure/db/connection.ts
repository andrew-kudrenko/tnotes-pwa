import { TeaTastingDatabase } from "./schema";

const LOCAL_DB_NAME = "tea_tasting_local";
const USER_DB_PREFIX = "tea_tasting_user_";

const activeDatabase: ShallowRef<TeaTastingDatabase | null> = shallowRef(null);
let activeAuthorId: string | undefined = undefined;

export function resolveDatabaseName(authorId?: string): string {
  return authorId ? `${USER_DB_PREFIX}${authorId}` : LOCAL_DB_NAME;
}

export function connectDatabase(authorId?: string): TeaTastingDatabase {
  const targetName = resolveDatabaseName(authorId);

  if (activeDatabase.value && activeDatabase.value.name === targetName) {
    return activeDatabase.value;
  }

  if (activeDatabase.value) {
    activeDatabase.value.close();
  }

  activeAuthorId = authorId;
  const instance = new TeaTastingDatabase(targetName);
  activeDatabase.value = instance;
  return instance;
}

export function getActiveDatabase(): TeaTastingDatabase {
  if (!activeDatabase.value) {
    return connectDatabase(activeAuthorId);
  }
  return activeDatabase.value;
}

export function useActiveDatabase(): ShallowRef<TeaTastingDatabase | null> {
  if (!activeDatabase.value) {
    connectDatabase(activeAuthorId);
  }
  return activeDatabase;
}

export async function dropProfileDatabase(authorId?: string): Promise<void> {
  const targetName = resolveDatabaseName(authorId);

  if (activeDatabase.value && activeDatabase.value.name === targetName) {
    activeDatabase.value.close();
    activeDatabase.value = null;
  }

  await TeaTastingDatabase.delete(targetName);
}
