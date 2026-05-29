# Publish @web-observer/sdk to npm

## One-time setup (manual)

1. Enable 2FA on npm (recommended, sometimes required for publish):
   https://www.npmjs.com/settings/~/security

2. Create a free npm organization named `web-observer`:
   https://www.npmjs.com/org/create
   - Plan: **Unlimited public packages** (free)
   - Organization name: `web-observer`

3. Log in from terminal:

```bash
npm login
```

Use the same npm account you registered in the browser.

4. Create an automation token (optional, for CI later):
   https://www.npmjs.com/settings/~/tokens
   - Type: **Granular Access Token** or **Classic Automation**
   - Scope: publish for `@web-observer`

## Publish (first release)

From repository root:

```bash
npm run publish:sdk
```

Or step by step:

```bash
npm run build -w @web-observer/sdk
npm publish -w @web-observer/sdk --access public
```

## Verify

```bash
npm view @web-observer/sdk
```

Install in any project:

```bash
npm install @web-observer/sdk
```

## Next releases

1. Bump version in `packages/sdk/package.json` (`0.1.0` -> `0.1.1`)
2. Commit and push to GitHub
3. Run `npm run publish:sdk`
