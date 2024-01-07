module.exports = {
    "env": {
        "browser": true,
        "es2021": true,
    },
    extends: [
        "eslint:recommended",
        "plugin:@typescript-eslint/recommended",
    ],
    rules: {
        "@typescript-eslint/no-namespace": "off"
    },
    "parserOptions": {
        "ecmaVersion": "latest",
        "sourceType": "module",
    },
}
