/*eslint-env node */
"use strict"

const assert = require("assert")
const rules = require("../dist/core-rules")

describe("core-rules.js", () => {
    it("includes 'no-undef' rule", () => {
        const noUndef = rules["no-undef"]

        assert(noUndef)
        assert.strictEqual(typeof noUndef.create, "function")
    })
})
