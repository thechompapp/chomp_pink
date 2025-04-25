// /doof-backend/.eslintrc.js
module.exports = {
    env: {
        commonjs: true,
        es2021: true,
        node: true,
    },
    extends: [
        'eslint:recommended',
        'prettier' // Add prettier last to disable conflicting rules
    ],
    // Optionally add prettier plugin:
    // plugins: ['prettier'],
    parserOptions: {
        ecmaVersion: 12,
    },
    rules: {
        // Add any backend-specific rules here
        // "prettier/prettier": "error" // If using eslint-plugin-prettier
    },
};