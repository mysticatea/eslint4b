"use strict"

const fs = require("fs")
const core = require("@actions/core")
const { version: installed } = require("eslint/package.json")
const published = fs.readFileSync(".last-version", "utf8")

core.setOutput("installed", installed)
core.setOutput("published", published)
