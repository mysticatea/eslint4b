/*eslint-env node */
"use strict"

process.env.CHROME_BIN = require("puppeteer").executablePath() //eslint-disable-line no-process-env

module.exports = function(config) {
    config.set({
        browserify: { debug: true },
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
        files: ["test/*.js"],
        frameworks: ["browserify", "mocha"],
        preprocessors: {
            "test/*.js": ["browserify"],
        },
    })
}
