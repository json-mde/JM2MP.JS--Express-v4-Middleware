/**
 * @author Luis Maria CAMARA ROSSI
 * @copyright Universidad Nacional de Educación a Distancia (U.N.E.D.) 2026
 * @license BSD-3-Clause
 * @file ESLINT configuration file.
**/

/* ------------------------------------------------------------------ */
/* ------------------------------------------------------------------ */

import js from "@eslint/js";
import globals from "globals";
import json from "@eslint/json";
import markdown from "@eslint/markdown";
import css from "@eslint/css";
import { defineConfig } from "eslint/config";
import stylistic from '@stylistic/eslint-plugin'

/* ------------------------------------------------------------------ */
/* ------------------------------------------------------------------ */

/**
 * @description
 * ESLINT configuration file.
**/
export default defineConfig([
  {
    name:"JavaScript",
    files: ["**/*.{js,mjs,cjs}"],
    plugins: { js },
    extends: ["js/recommended"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: {...globals.browser, ...globals.node}
    }
  },
  {
    name: "JSON",
    files: ["**/*.json"],
    ignores: ["./package-lock.json", "./.vscode/launch.json"],
    plugins: { json },
    language: "json/json",
    extends: ["json/recommended"]
  },
  { name: "JSONC",    files: ["**/*.jsonc"], plugins: { json },     language: "json/jsonc",   extends: ["json/recommended"]     },
  { name: "JSON5",    files: ["**/*.json5"], plugins: { json },     language: "json/json5",   extends: ["json/recommended"]     },
  { name: "MarkDown", files: ["**/*.md"],    plugins: { markdown }, language: "markdown/gfm", extends: ["markdown/recommended"] },
  { name: "CSS",      files: ["**/*.css"],   plugins: { css },      language: "css/css",      extends: ["css/recommended"]      },
  {
    name: "linterOptions", 
    linterOptions: {
      reportUnusedInlineConfigs: "warn",
    },
  },
  stylistic.configs["disable-legacy"],
  /*
  stylistic.configs.customize({
    severity: "warn",
    semi: true,
    //quoteProps: "as-needed",
    quotes: "double",
    commaDangle: "only-multiline"
  }),
  */
]);

/* ------------------------------------------------------------------ */
/* ------------------------------------------------------------------ */
/* End of file: ${JM2MP.JS--Express-v4-Middleware}/eslint.config.js   */
