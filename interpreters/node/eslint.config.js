// @ts-check

import eslint from '@eslint/js';
import stylisticPlugin from '@stylistic/eslint-plugin';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  eslint.configs.recommended,
  ...tseslint.configs.strict,
  ...tseslint.configs.stylistic,
  {
    plugins: {
      '@stylistic': stylisticPlugin,
    },
    rules: {
      semi: ['error','always'],
      quotes: ['error','single'],
      indent: ['error', 2],
      '@stylistic/template-curly-spacing': 'error',
      '@stylistic/type-annotation-spacing': 'error',
      '@stylistic/object-curly-spacing': ['error', 'never'],
      '@stylistic/eol-last': ['error', 'always'],
      '@stylistic/no-multi-spaces': 'error',
      '@stylistic/no-whitespace-before-property': 'error',
      '@stylistic/no-floating-decimal': 'error',
      '@stylistic/no-multiple-empty-lines': ['error', {max: 1, maxEOF: 0}],
      '@stylistic/no-tabs': ['error', {allowIndentationTabs: false}],
      '@stylistic/no-trailing-spaces': ['error', {ignoreComments: true}],
      '@stylistic/nonblock-statement-body-position': ['error', 'beside'],
      '@stylistic/quote-props': ['error', 'as-needed'],
      '@typescript-eslint/explicit-function-return-type': ['error', {
        allowExpressions: true,
      }],
      '@typescript-eslint/no-unused-vars': ['error', {
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_',
        caughtErrorsIgnorePattern: '^_'
      }],
      'sort-imports': ['error', {
        ignoreCase: false,
        ignoreDeclarationSort: false,
        ignoreMemberSort: false,
        memberSyntaxSortOrder: ['none', 'all', 'multiple', 'single'],
        allowSeparatedGroups: false
      }]
    },
  },
);
