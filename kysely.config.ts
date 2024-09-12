import { defineConfig } from "kysely-ctl";
import { getKysely } from "./src/database/kysely";

export default defineConfig({
  kysely: getKysely(),
  migrations: {
    migrationFolder: 'src/database/migration',
  },
});
