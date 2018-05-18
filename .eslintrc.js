"use strict"

const { configs, utils } = require("eslint-plugin-mysticatea")

module.exports = {
    extends: "plugin:mysticatea/es2015",
    parserOptions: {
        ecmaVersion: 2017,
    },
    overrides: [
        utils.merge(
            {
                files: "**/shim/*.js",
                rules: {
                    "mysticatea/node/no-unsupported-features": [
                        "error",
                        { ignores: ["modules"] },
                    ],
                },
            },
            configs["+modules"]
        ),
    ],
}
