# Security Policy

## Supported versions

This project follows [semver](https://semver.org/). Security fixes are
backported to the latest minor release on the `develop` branch. Older
minor releases may receive fixes at the maintainers' discretion.

| Version | Supported          |
| ------- | ------------------ |
| latest  | :white_check_mark: |
| older   | :x:                |

## Reporting a vulnerability

**Please do not file a public issue for security bugs.**

Use [GitHub Security Advisories → Private vulnerability reporting][adv]
on this repository. This routes the report to the maintainers privately
and lets us coordinate a fix and a disclosure timeline before any
public detail is shared.

[adv]: https://github.com/caorteam/iwinv-alimtalk-cli/security/advisories/new

If you cannot use the GitHub interface, open a regular issue with the
title prefixed `[SECURITY]` and **without** exploit details. The
maintainers will convert it into a private advisory.

## What to include

- A clear description of the vulnerability and its impact
- Reproduction steps or a minimal proof-of-concept
- The affected version(s) and commit SHA(s) if known
- Any known mitigations or workarounds

## Response timeline

Maintainers aim to acknowledge new reports within **5 business days**.
A fix or a coordinated disclosure plan follows once the report is
triaged.

## Secrets handling

This CLI never stores the API key. Users provide it via `--api-key` or
the `IWINV_ALIMTALK_API_KEY` environment variable; treat the value as
a secret. Base64 is an encoding, not a hash — see
[README.md → Live API Safety](./README.md#live-api-safety) for the
recommended handling.

## Reporting dependency issues

The runtime has **no production dependencies** by design (see
[AGENTS.md](./AGENTS.md)). The only `devDependencies` are `typescript`
and `@types/node`, both pinned via Dependabot. Supply-chain concerns
specific to those packages should still go through the private channel
above.
