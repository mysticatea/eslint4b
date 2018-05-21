/**
 * @author Toru Nagashima <https://github.com/mysticatea>
 * See LICENSE file in root directory for full license.
 */
"use strict"

const log = require("fancy-log")
const fs = require("fs-extra")
const exec = require("./lib/exec")
const TOKEN = process.env.GITHUB_TOKEN

// Main.
;(async () => {
    const pkg = await fs.readJSON("package.json")

    //--------------------------------------------------------------------------
    log.info("Make a commit.")

    await exec("git", "add", ".")
    await exec("git", "commit", "-m", pkg.version)

    //--------------------------------------------------------------------------
    log.info("Make a tag.", pkg.version)
    await exec("git", "tag", pkg.version)

    //--------------------------------------------------------------------------
    log.info("Push those.", pkg.version)
    await exec(
        "git",
        "push",
        `https://mysticatea:${TOKEN}@github.com/mysticatea/eslint4b.git`,
        "master",
        pkg.version
    )

    //--------------------------------------------------------------------------
    log.info("Completed!")
})().catch(error => {
    log.error(error.stack)
    process.exitCode = 1
})
