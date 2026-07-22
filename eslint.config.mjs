import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    rules: {
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/no-unused-vars": "warn",
      "@typescript-eslint/no-require-imports": "warn",
      "prefer-const": "warn",
      "react/no-unescaped-entities": "warn",
      // Existing client data-load effects are safe but require a dedicated
      // refactor before adopting the stricter React compiler rule as blocking.
      "react-hooks/set-state-in-effect": "warn",
    }
  },
  // Generated artifacts are validated by Prisma/TypeScript, not linted as source.
  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    "src/generated/prisma/**",
  ]),
]);

export default eslintConfig;
