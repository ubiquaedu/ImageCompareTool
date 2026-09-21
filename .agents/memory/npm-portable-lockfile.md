---
name: Portable npm lockfiles
description: Replit-generated npm lockfiles can contain internal package firewall URLs that fail on local Windows builds.
---

Replit package installs may write internal package-firewall URLs into package-lock.json. Do not ship that lockfile to a local Windows build environment; use the public npm registry configuration and let npm regenerate the lockfile locally.

**Why:** npm on Windows cannot resolve Replit's internal registry and fails with EALLOWREMOTE before Electron dependencies can be installed.

**How to apply:** When distributing this project outside Replit, include .npmrc with the public registry and instruct the user to run npm install in a fresh extracted directory.