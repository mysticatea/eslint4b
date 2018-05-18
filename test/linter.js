/*eslint-env node */
"use strict"

const assert = require("assert")
const Linter = require("../dist/linter")

describe("linter.js", () => {
    it("linter.getRules() is empty map.", () => {
        const linter = new Linter()
        const rules = linter.getRules()

        assert.strictEqual(rules.size, 0)
    })

    it("linter.verify() does linting.", () => {
        const linter = new Linter()

        linter.defineRule("test", context => ({
            VariableDeclarator(node) {
                context.report({
                    node,
                    message: "it's {{name}}",
                    data: node.id,
                })
            },
        }))
        const messages = linter.verify("var foo = 0", {
            rules: { test: 2 },
        })

        assert.strictEqual(messages.length, 1)
        assert.strictEqual(messages[0].message, "it's foo")
    })

    it("linter.verifyAndFix() does fixing.", () => {
        const linter = new Linter()

        linter.defineRule("test", context => ({
            VariableDeclarator(node) {
                if (node.id.name === "foo") {
                    context.report({
                        node,
                        message: "it's {{name}}",
                        data: node.id,
                        fix: fixer => fixer.replaceText(node.id, "bar"),
                    })
                }
            },
        }))
        const { output, messages } = linter.verifyAndFix("var foo = 0", {
            rules: { test: 2 },
        })

        assert.strictEqual(output, "var bar = 0")
        assert.strictEqual(messages.length, 0)
    })
})
