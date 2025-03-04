# `@kyosenergy/sentry-resolve-action`

[![GitHub Super-Linter](https://github.com/actions/typescript-action/actions/workflows/linter.yml/badge.svg)](https://github.com/super-linter/super-linter)
![CI](https://github.com/actions/typescript-action/actions/workflows/ci.yml/badge.svg)
[![Check dist/](https://github.com/actions/typescript-action/actions/workflows/check-dist.yml/badge.svg)](https://github.com/actions/typescript-action/actions/workflows/check-dist.yml)
[![CodeQL](https://github.com/actions/typescript-action/actions/workflows/codeql-analysis.yml/badge.svg)](https://github.com/actions/typescript-action/actions/workflows/codeql-analysis.yml)
[![Coverage](./badges/coverage.svg)](./badges/coverage.svg)

This action expands on Sentry's GitHub integration. Sentry's GitHub integration
typically creates issues on GitHub with a reference to the Sentry issue. This
action extracts the sentry issue links from GitHub issue's body, and sends a
request to Sentry's API to resolve the issue.

Features:

- Supports multi-line issue bodies and properly handles failures.
- Tested with Jest, including success and failure scenarios.

## Usage

To include the action in a workflow in another repository, you can use the
`uses` syntax with the `@` symbol to reference a specific branch, tag, or commit
hash.

```yaml
name: 'Resolve Sentry Issues on Issue Close'

on:
  issues:
    types: [closed]

jobs:
  resolve-sentry:
    runs-on: ubuntu-latest
    steps:
      - name: kyosenergy/sentry-resolve-action@v1
        with:
          # Sentry organization name
          org: evil-corp

          # Sentry User Auth Token with scopes: `event:read, event:write`.
          # It can be generated via https://{org}.sentry.io/settings/account/api/auth-tokens/
          token: ${{ secrets.SENTRY_TOKEN }}
```

## License

The scripts and documentation in this project are released under the
[MIT License](LICENSE)

## Contributing

1. :hammer_and_wrench: Install the dependencies

   ```bash
   npm install
   ```

2. :building_construction: Package the TypeScript for distribution

   ```bash
   npm run bundle
   ```

3. :white_check_mark: Run the tests

   ```bash
   $ npm test

   PASS __tests__/main.test.ts (5.12 s)
     Resolve Sentry Issues Action
      ✓ should log 'No Sentry issues found' when no issues are present (3 ms)
      ✓ should throw an error if Sentry token is missing
      ✓ should perform a PUT request against sentry service (109 ms)
      ...
   ```

4. (Optional) Test your action locally

   The [`@github/local-action`](https://github.com/github/local-action) utility
   can be used to test your action locally. It is a simple command-line tool
   that "stubs" (or simulates) the GitHub Actions Toolkit. This way, you can run
   your TypeScript action locally without having to commit and push your changes
   to a repository.

   The `local-action` utility can be run in the following ways:

   - Visual Studio Code Debugger

     Make sure to review and, if needed, update
     [`.vscode/launch.json`](./.vscode/launch.json)

   - Terminal/Command Prompt

     ```bash
     # npx @github/local-action . src/main.ts .env
     npm run local-action
     ```

   You can provide a `.env` file to the `local-action` CLI to set environment
   variables used by the GitHub Actions Toolkit. For example, setting inputs and
   event payload data used by your action. For more information, see the example
   file, [`.env.example`](./.env.example), and the
   [GitHub Actions Documentation](https://docs.github.com/en/actions/learn-github-actions/variables#default-environment-variables).
