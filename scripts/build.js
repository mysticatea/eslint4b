/**
 * @author Toru Nagashima <https://github.com/mysticatea>
 * See LICENSE file in root directory for full license.
 */
"use strict"

const path = require("path")
const babel = require("@babel/core")
const { builtinRules } = require("eslint/use-at-your-own-risk");
const log = require("fancy-log")
const fs = require("fs-extra")
const rollup = require("rollup")
const commonjs = require("rollup-plugin-commonjs")
const json = require("rollup-plugin-json")
const modify = require("rollup-plugin-re")
const sourcemaps = require("rollup-plugin-sourcemaps")
const semver = require("semver")
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

    const exportDecls = [...builtinRules.keys()]
        .map((ruleId) => `    "${ruleId}": builtinRules.get("${ruleId}"),`)
        .join("\n")

    await fs.writeFile(
        "scripts/shim/core-rules.js",
        `const { builtinRules } = require("eslint/use-at-your-own-risk")\nexport default {\n${exportDecls}\n}\n`,
    )

    //--------------------------------------------------------------------------
    log.info("Parse the source files.")

    const dependencySet = new Set()
    const input = [
        "scripts/shim/linter.js",
        "scripts/shim/core-rules.js",
        "scripts/shim/index.js",
    ]
    const bundle = await rollup.rollup({
        external(filePath) {
            const id = filePath.replace(/\\/gu, "/").split("/")[0]
            if (
                id === "" ||
                id === "." ||
                id === ".." ||
                id.endsWith(":") ||
                id === "eslint" ||
                input.includes(filePath)
            ) {
                return false
            }
            dependencySet.add(id)
            return true
        },
        input,
        plugins: [
            replace({
                debug: "./scripts/shim/debug.js",
            }),
            resolve(),
            modify({
                patterns: [
                    // Remove a dynamic import for rules (I suspect this is a dead code).
                    {
                        match: /eslint(\/|\\)lib(\/|\\)linter(\/|\\)rules\.js$/u,
                        test: /require\(this\._rules\[ruleId\]\)/u,
                        replace: "null",
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

    const { output } = await bundle.generate({
        format: "cjs",
        sourcemap: true,
    })

    //--------------------------------------------------------------------------
    log.info("Minify file contents.")

    process.env.NODE_ENV = ""
    process.env.TIMING = ""
    const promises = []

    for (const { code: rawCode, fileName, map: rawMap } of output) {
        log.info("- %s", fileName)

        const filePath = path.join("dist", fileName)
        let code = rawCode
        let map = rawMap
        for (const plugin of [
            removeUnusedRequireCalls,
            [
                "transform-inline-environment-variables",
                { include: ["NODE_ENV", "TIMING"] },
            ],
            "babel-plugin-minify-constant-folding",
            "babel-plugin-minify-dead-code-elimination",
        ]) {
            ;({ code, map } = babel.transform(code, {
                ast: false,
                babelrc: false,
                comments: false,
                compact: false,
                filename: fileName,
                inputSourceMap: map,
                plugins: [plugin],
                sourceMaps: true,
                sourceType: "script",
            }))
        }

        promises.push(
            fs.writeFile(
                filePath,
                `${code}\n//# sourceMappingURL=${fileName}.map`,
            ),
            fs.writeFile(`${filePath}.map`, JSON.stringify(map)),
        )
    }

    await Promise.all(promises)

    //--------------------------------------------------------------------------
    log.info("Check version.")

    const eslintPkg = await fs.readJSON(require.resolve("eslint/package.json"))
    const pkg = await fs.readJSON("package.json")
    const lastVer = await fs.readFile(".last-version", "utf8")
    const expectedVer = eslintPkg.version

    if (expectedVer === lastVer) {
        log.info("Up to date: %s", expectedVer)
    } else {
        log.info("Update was found: %s → %s", lastVer, expectedVer)

        //----------------------------------------------------------------------
        if (semver.lt(pkg.version, expectedVer)) {
            pkg.version = expectedVer
        } else {
            // For some reason, this package version is larger than the original version.
            // Increment this package version.
            pkg.version = semver.inc(pkg.version, "patch")
            log.info("The new version is '%s' for some reason.", pkg.version)
        }
        pkg.engines = eslintPkg.engines

        //----------------------------------------------------------------------
        log.info("Update dependencies.")

        pkg.dependencies = {}
        for (const id of Array.from(dependencySet).sort()) {
            if (eslintPkg.dependencies[id]) {
                pkg.dependencies[id] = eslintPkg.dependencies[id]
            }
        }

        await fs.writeJSON("package.json", pkg, { spaces: 2 })
        await fs.writeFile(".last-version", expectedVer)
        await exec("npm", "install")
        await exec("git", "diff", "--color-words", "-U1", "--", "package.json")
    }

    //--------------------------------------------------------------------------
    log.info("Completed!")
})().catch(error => {
    log.error(error.stack)
    process.exitCode = 1
})
