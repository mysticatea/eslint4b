import BaseLinter from "eslint/lib/linter"
import coreRules from "./core-rules.js"

/**
 * Linter with core rules.
 */
export default class Linter extends BaseLinter {
    /** Initialize this linter and define core rules. */
    constructor() {
        super()
        for (const ruleId of Object.keys(coreRules)) {
            this.defineRule(ruleId, coreRules[ruleId])
        }
    }
}
