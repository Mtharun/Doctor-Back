import "dotenv/config";
import app from "./app.js";

const PORT = process.env.PORT || 5000;

if (!process.env.JWT_SECRET || process.env.JWT_SECRET === "replace_with_a_long_random_secret") {
  console.warn(
    "[warning] JWT_SECRET is missing or using the example placeholder. " +
    "Set a real secret in .env before deploying to production."
  );
}

app.listen(PORT, () => {
  console.log(`Doctor-back API listening on http://localhost:${PORT}`);
});
