/**
 * @author Toru Nagashima <https://github.com/mysticatea>
 * See LICENSE file in root directory for full license.
 */
"use strict"

const path = require("path")
const babel = require("babel-core")
const log = require("fancy-log")
const fs = require("fs-extra")
const rollup = require("rollup")
const commonjs = require("rollup-plugin-commonjs")
const json = require("rollup-plugin-json")
const modify = require("rollup-plugin-re")
const sourcemaps = require("rollup-plugin-sourcemaps")
const removeUnusedRequireCalls = require("./babel-plugin/remove-unused-require-calls")
const exec = require("./lib/exec")
const replace = require("./rollup-plugin/replace")
const resolve = require("./rollup-plugin/resolve")

// Main.
;(async () => {
    //--------------------------------------------------------------------------
    log.info("Remove 'dist'.")

    await fs.remove("dist")
    await fs.ensureDir("dist")

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
    log.info("Parse the source files.")

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
            json({ preferConst: true }),
            commonjs(),
            sourcemaps(),
        ],
    })

    //--------------------------------------------------------------------------
    log.info("Generate file contents.")

    const contents = await bundle.generate({
        format: "cjs",
        sourcemap: true,
    })

    //--------------------------------------------------------------------------
    log.info("Minify file contents.")

    const promises = []

    for (const filename of Object.keys(contents)) {
        log.info("- %s", filename)

        const filePath = path.join("dist", filename)
        const raw = contents[filename]
        const { code, map } = babel.transform(raw.code, {
            ast: false,
            babelrc: false,
            comments: false,
            filename,
            filenameRelative: filePath,
            inputSourceMap: raw.map,
            minified: true,
            plugins: [
                [
                    "transform-inline-environment-variables",
                    { include: ["NODE_ENV", "TIMING"] },
                ],
                removeUnusedRequireCalls,
            ],
            presets: ["minify"],
            sourceMaps: true,
            sourceRoot: process.cwd(),
            sourceType: "script",
        })

        promises.push(
            fs.writeFile(
                filePath,
                `${code}//# sourceMappingURL=${filename}.map`
            ),
            fs.writeFile(`${filePath}.map`, JSON.stringify(map))
        )
    }

    await Promise.all(promises)

    //--------------------------------------------------------------------------
    log.info("Check version.")

    const eslintPkg = await fs.readJSON(require.resolve("eslint/package.json"))
    const pkg = await fs.readJSON("package.json")
    const expectedVar = `${eslintPkg.version}+web`
    const actualVar = pkg.version

    if (actualVar === expectedVar) {
        log.info("Up to date: %s", actualVar)
    } else {
        log.info("Update was found: %s → %s", actualVar, expectedVar)
        log.info("Update dependencies.")

        pkg.version = expectedVar
        pkg.dependencies = {}

        for (const id of Array.from(dependencySet).sort()) {
            if (eslintPkg.dependencies[id]) {
                pkg.dependencies[id] = eslintPkg.dependencies[id]
            }
        }

        await fs.writeJSON("package.json", pkg, { spaces: 2 })

        await exec("npm", "install")
        await exec("git", "diff", "--color-words", "-U1", "--", "package.json")
    }

    //--------------------------------------------------------------------------
    log.info("Completed!")
})().catch(error => {
    log.error(error.stack)
    process.exitCode = 1
})
