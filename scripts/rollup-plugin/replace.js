/**
 * @author Toru Nagashima <https://github.com/mysticatea>
 * See LICENSE file in root directory for full license.
 */
const path = require("path")
const Module = require("module")

/**
 * Convert a given moduleId to an absolute path.
 * @param {string} id The moduleId to normalize.
 * @returns {string} The normalized path.
 */
function toAbsolute(id) {
    return id.startsWith("./") ? path.resolve(id) : require.resolve(id)
}

module.exports = mapping => {
    const map = new Map()
    for (const key of Object.keys(mapping)) {
        const from = toAbsolute(key)
        const to = toAbsolute(mapping[key])

        map.set(key, to)
        map.set(from, to)
    }

    return {
        resolveId(id, importerPath) {
            const importeePath =
                id.startsWith("./") || id.startsWith("../")
                    ? Module.createRequireFromPath(importerPath).resolve(id)
                    : id

            return map.get(importeePath) || null
        },
    }
}
