import BaseLinter from "eslint/lib/linter"
import coreRules from "./core-rules"

/**
 * Linter with core rules.
 */
export default class Linter extends BaseLinter {
    /** Initialize this linter and define core rules. */
    constructor() {
        super()
        this.defineRules(coreRules)
    }
}
