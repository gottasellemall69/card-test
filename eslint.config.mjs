import js from "@eslint/js";
import nextPlugin from "@next/eslint-plugin-next";
import globals from "globals";
import tseslint from "typescript-eslint";

const sourceFiles = ["**/*.{js,jsx,ts,tsx}"];

export default [
  {
    ignores: [
      ".next/**",
      "build/**",
      "out/**",
      "node_modules/**",
      "public/**",
      ".sports-refresh-browser/**",
    ],
  },
  js.configs.recommended,
  {
    ...tseslint.configs.base,
    files: ["**/*.{ts,tsx}"],
  },
  {
    files: sourceFiles,
    plugins: {
      "@next/next": nextPlugin,
    },
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: {
        ...globals.browser,
        ...globals.node,
      },
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
      },
    },
    rules: {
      ...nextPlugin.configs.recommended.rules,
      ...nextPlugin.configs["core-web-vitals"].rules,
      "no-unused-vars": [
        "error",
        {
          args: "after-used",
          argsIgnorePattern: "^_",
          caughtErrors: "none",
          varsIgnorePattern: "^_",
        },
      ],
    },
  },
  {
    files: ["**/*.{ts,tsx}"],
    rules: {
      "no-undef": "off",
      "no-unused-vars": "off",
    },
  },
];