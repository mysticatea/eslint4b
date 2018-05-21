/**
 * @author Toru Nagashima <https://github.com/mysticatea>
 * See LICENSE file in root directory for full license.
 */
"use strict"

const cp = require("child_process")
const pEvent = require("p-event")

module.exports = async (command, ...args) => {
    const exitCode = await pEvent(
        cp.spawn(command, args, { shell: true, stdio: "inherit" }),
        "close"
    )
    if (exitCode) {
        throw new Error(`Failed to run: ${command} ${args.join(" ")}`)
    }
}
