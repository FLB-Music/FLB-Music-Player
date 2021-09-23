const defaultRules = {
  'arrow-parens': ['error', 'as-needed'],
  'brace-style': [
    'error',
    '1tbs',
    {
      allowSingleLine: true
    }
  ],
  'comma-dangle': ['error', 'never'],
  'eqeqeq': 'warn',
  'func-names': 0,
  'import/no-named-as-default': 0,
  indent: 'off',
  'indent-legacy': [
    'error',
    2,
    {
      SwitchCase: 1
    }
  ],
  'linebreak-style': ['error', 'unix'],
  'max-len': 'off',
  'no-alert': 0,
  'no-bitwise': 0,
  'no-console': 0,
  'no-debuger': 0,
  'no-duplicate-imports': 'error',
  'no-empty': [
    'error',
    {
      allowEmptyCatch: true
    }
  ],
  'no-extend-native': 'error',
  'no-lone-blocks': 'error',
  'no-lonely-if': 'error',
  'no-multi-spaces': 'error',
  'no-multiple-empty-lines': [
    'error',
    {
      max: 2,
      maxBOF: 0,
      maxEOF: 1
    }
  ],
  'no-template-curly-in-string': 'error',
  'no-unused-vars': [
    1,
    {
      argsIgnorePattern: '^err',
      ignoreRestSiblings: true
    }
  ],
  'no-shadow': 0,
  'no-var': 'error',
  'object-shorthand': 'error',
  'prefer-const': [
    'error',
    {
      destructuring: 'all'
    }
  ],
  quotes: [
    'error',
    'single',
    {
      allowTemplateLiterals: true,
      avoidEscape: true
    }
  ],
  semi: 'error',
  'sort-imports': [
    'error',
    {
      ignoreCase: true,
      ignoreDeclarationSort: true
    }
  ],
  'space-before-blocks': 'error',
  'space-before-function-paren': 'error',
  'space-in-parens': 'error',
  'space-infix-ops': 'error',
  'space-unary-ops': 'error',
  'spaced-comment': 'error',
  'template-curly-spacing': 'error'
}
const rules = {
  ...defaultRules,
  '@typescript-eslint/explicit-module-boundary-types': 'off',
  '@typescript-eslint/no-explicit-any': 'off'
}
const vueRules = {
  ...defaultRules,
  'global-require': 0,
  'vue/component-name-in-template-casing': ['error', 'kebab-case', {
    registeredComponentsOnly: false
  }],
  'vue/order-in-components': 'off',
  'vue/require-default-prop': 'off'
};

module.exports = {
  env: {
    node: true
  },
  extends: [
    'eslint:recommended',
    'plugin:import/errors',
    'plugin:import/warnings',
    'plugin:@typescript-eslint/recommended'
  ],
  // config for Vue components
  overrides: [
    {
      env: {
        browser: true
      },
      extends: [
        '@vue/airbnb',
        'plugin:vue/essential',
        'plugin:vue/recommended'
      ],
      files: ['*.vue'],
      parser: 'vue-eslint-parser',
      plugins: ['vue'],
      rules: vueRules
    }
  ],
  // end config for Vue components
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 2020
  },
  plugins: ['@typescript-eslint', 'import'],
  root: true,
  rules,
  settings: {
    'import/resolver': {
      typescript: {
        alwaysTryTypes: true
      }
    },
    'import/parsers': {
      '@typescript-eslint/parser': ['.ts', '.tsx']
    }
  }
};
