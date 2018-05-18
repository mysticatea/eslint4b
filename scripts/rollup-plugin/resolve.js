/**
 * @author Toru Nagashima <https://github.com/mysticatea>
 * See LICENSE file in root directory for full license.
 */
"use strict"

const path = require("path")

module.exports = () => ({
    resolveId(id, importerId) {
        if (id.startsWith("eslint/")) {
            return require.resolve(id)
        }
        if (id.startsWith(".")) {
            return require.resolve(path.resolve(path.dirname(importerId), id))
        }
        return null
    },
})
