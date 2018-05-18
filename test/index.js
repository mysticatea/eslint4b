/*eslint-env node */
"use strict"

const assert = require("assert")
const Linter = require("..")

describe("index.js", () => {
    it("linter.getRules() has core rules.", () => {
        const linter = new Linter()
        const rules = linter.getRules()

        assert.notStrictEqual(rules.size, 0)
    })

    it("linter.verify() does linting.", () => {
        const linter = new Linter()
        const messages = linter.verify("var foo = 0", {
            parserOptions: { ecmaVersion: 2015 },
            rules: { "no-var": 2 },
        })

        assert.strictEqual(messages.length, 1)
        assert.strictEqual(
            messages[0].message,
            "Unexpected var, use let or const instead."
        )
    })

    it("linter.verifyAndFix() does fixing.", () => {
        const linter = new Linter()

        const { fixed, output, messages } = linter.verifyAndFix(
            "function f() { var foo = 0 }",
            {
                parserOptions: { ecmaVersion: 2015 },
                rules: { "no-var": 2, "prefer-const": 2 },
            }
        )

        assert.strictEqual(fixed, true)
        assert.strictEqual(output, "function f() { const foo = 0 }")
        assert.strictEqual(messages.length, 0)
    })
})
