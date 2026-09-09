/*
 * Copyright (c) 2026 MetaclassMethod
 */

import stylistic from "@stylistic/eslint-plugin";
import header from "eslint-plugin-simple-header";
import simpleImportSort from "eslint-plugin-simple-import-sort";
import unusedImports from "eslint-plugin-unused-imports";
import tseslint from "typescript-eslint";

export default tseslint.config(
    { ignores: ["dist", "node_modules", "reference", "vencord-ref"] },
    {
        files: ["src/**/*.{ts,tsx,mts,js,jsx,mjs}", "*.mjs"],
        plugins: {
            "simple-header": header,
            "simple-import-sort": simpleImportSort,
            "unused-imports": unusedImports,
            "@stylistic": stylistic,
            "@typescript-eslint": tseslint.plugin
        },
        languageOptions: {
            parser: tseslint.parser,
            parserOptions: {
                ecmaFeatures: { jsx: true }
            }
        },
        settings: {
            react: { version: "18" }
        },
        rules: {
            "simple-header/header": ["error", { files: [".github/header.txt"] }],

            "simple-import-sort/imports": "error",
            "simple-import-sort/exports": "error",

            "unused-imports/no-unused-imports": "error",
            "@typescript-eslint/no-unused-vars": ["error", {
                args: "none",
                ignoreRestSiblings: true
            }],

            "@stylistic/semi": ["error", "always"],
            "@stylistic/quotes": ["error", "double", { avoidEscape: true }],
            "@stylistic/indent": ["error", 4, { SwitchCase: 1 }],
            "@stylistic/comma-dangle": ["error", "never"],
            "@stylistic/eol-last": ["error", "always"],
            "@stylistic/no-multiple-empty-lines": ["error", { max: 1, maxBOF: 0, maxEOF: 0 }],
            "@stylistic/no-trailing-spaces": "error",
            "@stylistic/arrow-parens": ["error", "as-needed"],
            "@stylistic/object-curly-spacing": ["error", "always"],

            "no-var": "error",
            "prefer-const": "error",
            eqeqeq: ["error", "always", { null: "ignore" }]
        }
    }
);
