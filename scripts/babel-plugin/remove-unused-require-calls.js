/**
 * @author Toru Nagashima <https://github.com/mysticatea>
 * See LICENSE file in root directory for full license.
 */
"use strict"

module.exports = ({ types: t }) => ({
    name: "remove-unused-require-calls",
    visitor: {
        ExpressionStatement(path) {
            const isRequireCall =
                t.isCallExpression(path.node.expression) &&
                t.isIdentifier(path.node.expression.callee, { name: "require" })

            if (isRequireCall) {
                path.remove()
            }
        },
    },
})
