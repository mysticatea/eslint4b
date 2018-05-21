/**
 * @author Toru Nagashima <https://github.com/mysticatea>
 * See LICENSE file in root directory for full license.
 */
"use strict"

const path = require("path")
const log = require("fancy-log")
const fs = require("fs-extra")
const rollup = require("rollup")
const babel = require("rollup-plugin-babel")
const commonjs = require("rollup-plugin-commonjs")
const json = require("rollup-plugin-json")
const modify = require("rollup-plugin-re")
const sourcemaps = require("rollup-plugin-sourcemaps")
const exec = require("./lib/exec")
const replace = require("./rollup-plugin/replace")
const resolve = require("./rollup-plugin/resolve")

// Main.
;(async () => {
    //--------------------------------------------------------------------------
    log.info("Remove 'dist'.")

    await fs.remove("dist")

    //--------------------------------------------------------------------------
    log.info("Update 'scripts/shim/core-rules.js'.")

    const ruleFiles = await fs.readdir(
        path.resolve("node_modules/eslint/lib/rules")
    )
    const ruleIds = ruleFiles
        .filter(filename => /^[a-z].+\.js$/.test(filename))
        .map(filename => path.basename(filename, ".js"))
    const importDecls = ruleIds
        .map(
            (ruleId, index) =>
                `import _${index} from "eslint/lib/rules/${ruleId}"`
        )
        .join("\n")
    const exportDecls = ruleIds
        .map((ruleId, index) => `    "${ruleId}": _${index},`)
        .join("\n")

    await fs.writeFile(
        "scripts/shim/core-rules.js",
        `${importDecls}\nexport default {\n${exportDecls}\n}\n`
    )

    //--------------------------------------------------------------------------
    log.info("Create a bundle.")

    const dependencySet = new Set()
    const bundle = await rollup.rollup({
        experimentalCodeSplitting: true,
        input: [
            "scripts/shim/linter.js",
            "scripts/shim/core-rules.js",
            "scripts/shim/index.js",
        ],
        onwarn(w) {
            if (w.code === "UNRESOLVED_IMPORT") {
                dependencySet.add(w.source.split("/")[0])
                return
            }
            log.warn(w.code, w.message)
        },
        plugins: [
            replace({
                fs: "./scripts/shim/empty.js",
                debug: "./scripts/shim/debug.js",
                "eslint/lib/load-rules.js": "./scripts/shim/load-rules.js",
            }),
            resolve(),
            modify({
                patterns: [
                    // Remove a dynamic import for parsers.
                    {
                        match: /eslint(\/|\\)lib(\/|\\)linter\.js$/,
                        test: /require\(parserName\)/,
                        replace:
                            //eslint-disable-next-line no-template-curly-in-string
                            '(parserName === "espree" ? require("espree") : (() => { throw new Error(`Cannot find module \'${parserName}\'`) })())',
                    },
                    // Remove a dynamic import for rules (I suspect this is a dead code).
                    {
                        match: /eslint(\/|\\)lib(\/|\\)rules\.js$/,
                        test: /normalizeRule\(require\(this\._rules\[ruleId\]\)\)/,
                        replace: "createMissingRule(ruleId)",
                    },
                ],
            }),
            babel({
                babelrc: false,
                include: "**/*.js",
                plugins: [
                    [
                        "transform-inline-environment-variables",
                        { include: ["NODE_ENV", "TIMING"] },
                    ],
                ],
                presets: ["minify"],
                sourceMaps: true,
            }),
            json({ preferConst: true }),
            commonjs(),
            sourcemaps(),
        ],
    })

    //--------------------------------------------------------------------------
    log.info("Write files.")

    await bundle.write({
        dir: "dist",
        format: "cjs",
        sourcemap: true,
    })

    //--------------------------------------------------------------------------
    log.info("Check version.")

    const eslintPkg = await fs.readJSON(require.resolve("eslint/package.json"))
    const pkg = await fs.readJSON("package.json")

    if (pkg.version === eslintPkg.version) {
        log.info("Up to date: %s", pkg.version)
    } else {
        log.info("Update was found: %s → %s", pkg.version, eslintPkg.version)
        log.info("Update dependencies.")

        pkg.version = eslintPkg.version
        pkg.dependencies = {}

        for (const id of Array.from(dependencySet).sort()) {
            if (eslintPkg.dependencies[id]) {
                pkg.dependencies[id] = eslintPkg.dependencies[id]
            }
        }

        await fs.writeJSON("package.json", pkg, { spaces: 2 })

        await exec("npm", "install")
        await exec("git", "diff", "--color-words", "--", "package.json")
    }

    //--------------------------------------------------------------------------
    log.info("Completed!")
})().catch(error => {
    log.error(error.stack)
    process.exitCode = 1
})
