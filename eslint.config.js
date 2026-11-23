import js from "@eslint/js";
import tseslint from "typescript-eslint";

export default tseslint.config(
  { ignores: ["dist/", ".astro/", "reports/", "print/", "node_modules/", ".claude/", "public/", "scripts/"] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ["tests/**/*.mjs"],
    languageOptions: { globals: { process: "readonly", console: "readonly", URL: "readonly" } },
  },
  {
    files: ["**/*.cjs"],
    languageOptions: { globals: { module: "writable" } },
  }
);
