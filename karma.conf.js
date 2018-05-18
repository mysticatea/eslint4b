/*eslint-env node */
"use strict"

process.env.CHROME_BIN = require("puppeteer").executablePath() //eslint-disable-line no-process-env

module.exports = function(config) {
    config.set({
        browserify: { debug: true },
        browsers: ["ChromeHeadless"],
        files: ["test/*.js"],
        frameworks: ["browserify", "mocha"],
        preprocessors: {
            "test/*.js": ["browserify"],
        },
    })
}
