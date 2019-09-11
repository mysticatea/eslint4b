# eslint4b

[![npm version](https://img.shields.io/npm/v/eslint4b.svg)](https://www.npmjs.com/package/eslint4b)
[![Downloads/month](https://img.shields.io/npm/dm/eslint4b.svg)](http://www.npmtrends.com/eslint4b)
[![Build Status](https://github.com/mysticatea/eslint4b/workflows/CI/badge.svg)](https://github.com/mysticatea/eslint4b/actions)
[![Dependency Status](https://david-dm.org/mysticatea/eslint4b.svg)](https://david-dm.org/mysticatea/eslint4b)

ESLint which works in browsers.

## 🏁 Goal

ESLint doesn't support browsers officially, but we can use it similar to [the official online demo](https://eslint.org/demo/).
This package provides the [Linter] class which is modified to work in browsers.

- Eliminate the dependency to `fs`.
- Eliminate the dynamic `require()`s.

This package is kept latest with cron jobs GitHub Actions provide.

## 💿 Installation

Use [npm](https://www.npmjs.com/) to install.

```
npm install eslint4b
```

## 📖 Usage

Use a bundler such as [Webpack]. The `eslint4b` must be able to be bundled.

```js
const Linter = require("eslint4b") // import Linter from "eslint4b"
const linter = new Linter();

// Verify a code.
// See the official document of the Linter class.
const messages = linter.verify(
    "var foo = 0",
    {
        rules: {
            semi: "error"
        }
    },
    { filename: "foo.js" }
);
```

Also, you can use the [Linter] class which doesn't include any core rules.
It's lightweight than the full set.

```js
// This Linter doesn't include any core rules.
const Linter = require("eslint4b/dist/linter")

// You can load core rules individually.
const { indent, quotes, semi } = require("eslint4b/dist/core-rules")
const linter = new Linter()
linter.defineRule("indent", indent)
linter.defineRule("quotes", quotes)
linter.defineRule("semi", semi)
```

## 📰 Changelog

See [GitHub releases](https://github.com/mysticatea/eslint4b/releases).

If no description, it's the build of ESLint in the same version.
It doesn't have any notable change.

## ❤️ Contributing

Contributing is welcome.

Please use GitHub issues/PRs.

### Development tools

- `npm test` runs tests.
- `npm run build` build ESLint which works in browsers.

[Linter]: https://eslint.org/docs/developer-guide/nodejs-api#linter
[Webpack]: https://webpack.js.org/
