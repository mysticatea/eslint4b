/*eslint-env node */
"use strict"

process.env.CHROME_BIN = require("puppeteer").executablePath() //eslint-disable-line no-process-env

module.exports = function(config) {
    config.set({
        browsers: ["MyHeadlessChrome"],
        customLaunchers: {
            MyHeadlessChrome: {
                base: "ChromeHeadless",
                flags: [
                    "--disable-extensions",
                    "--disable-translate",
                    "--no-sandbox",
                ],
            },
        },
        files: [{ pattern: "test/*.js", watched: false }],
        frameworks: ["mocha"],
        preprocessors: {
            "test/*.js": ["webpack", "sourcemap"],
        },
        webpack: {
            mode: "development",
            devtool: "inline-source-map",
        },
    })
}
