"use strict"

const { configs, utils } = require("@mysticatea/eslint-plugin")

module.exports = {
    extends: "plugin:@mysticatea/es2015",
    parserOptions: {
        ecmaVersion: 2017,
    },
    overrides: [
        utils.merge(
            {
                files: "**/shim/*.js",
                rules: {
                    "@mysticatea/node/no-unsupported-features/es-syntax": [
                        "error",
                        { ignores: ["modules"] },
                    ],
                },
            },
            configs["+modules"]
        ),
    ],
}
