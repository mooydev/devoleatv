import { updateDb } from "./updateDb.js";

(async () => {
  await updateDb();
  console.log("Scraping + updateDb finalizado ✅");
  process.exit(0); // 👈 asegura que Render lo dé por terminado
})();
