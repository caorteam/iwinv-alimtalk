# Changelog

## [0.2.1](https://github.com/caorteam/iwinv-alimtalk/compare/v0.2.0...v0.2.1) (2026-06-29)


### Continuous Integration

* **publish:** add OIDC environment debug step ([7ab9bd7](https://github.com/caorteam/iwinv-alimtalk/commit/7ab9bd7e56187ecb87ae06d42b0fa62683f4c244))
* **publish:** add workflow_dispatch for manual trigger ([2a6c72d](https://github.com/caorteam/iwinv-alimtalk/commit/2a6c72dbf6aef2963af39fd28657c02ed44c6cab))
* **publish:** also listen to 'released' event so release-please triggers it ([6357691](https://github.com/caorteam/iwinv-alimtalk/commit/6357691021e974a74cca2f15c6be0b41a21a0480))
* **publish:** drop registry-url so npm uses OIDC for Trusted Publishing ([58a9761](https://github.com/caorteam/iwinv-alimtalk/commit/58a97614b7a3358f2247a2fc86f566ca650c7e40))
* **publish:** drop workflow_dispatch; npm Trusted Publishing requires release events ([77cc1ce](https://github.com/caorteam/iwinv-alimtalk/commit/77cc1cecf13aea9b6a59e4c8dc6850b929a64047))
* **publish:** enable verbose npm logging for debugging auth ([3b01847](https://github.com/caorteam/iwinv-alimtalk/commit/3b01847b0aa61985a3ee70ac48a420b58d83020e))
* **publish:** revert to [published] only; npm Trusted Publishing requires release events ([7cb8a79](https://github.com/caorteam/iwinv-alimtalk/commit/7cb8a79505d512772710902127e6b4b5bdc596f7))
* **publish:** switch to NPM_TOKEN authentication (granular, bypass 2fa) ([7046841](https://github.com/caorteam/iwinv-alimtalk/commit/704684124056ae5d994e88e223f921d2eae550a7))
* **publish:** unset NODE_AUTH_TOKEN so npm uses OIDC for Trusted Publishing ([d277295](https://github.com/caorteam/iwinv-alimtalk/commit/d2772955d1f046adac2b023d10183649577f60b5))
* **publish:** use npm OIDC Trusted Publishing (upgrade npm, drop token) ([5840989](https://github.com/caorteam/iwinv-alimtalk/commit/5840989c01f675209c44bdd0e8a2f9765c8a55a3))

## [0.2.0](https://github.com/caorteam/iwinv-alimtalk/compare/v0.1.0...v0.2.0) (2026-06-29)


### Features

* add LICENSE file and update package.json to specify MIT license ([97767fb](https://github.com/caorteam/iwinv-alimtalk/commit/97767fb78d7cf7bb202c75f492f1b8cce2c67d5d))
* add shared utility module (BODY_SOURCE_ERROR, toErrorMessage, FetchLike) ([1480854](https://github.com/caorteam/iwinv-alimtalk/commit/14808547a14bb143fa17cedeb3ae1f2a3752b1aa))
* add TypeScript iwinv Alimtalk CLI ([1425225](https://github.com/caorteam/iwinv-alimtalk/commit/142522579f9e8a8f5e48b9246308f70e82112fe4))
* **cli:** require --help to be used alone ([5bec6e4](https://github.com/caorteam/iwinv-alimtalk/commit/5bec6e4dcd798758b42874cce75e9937211e97c6))
* document automated release pipeline in AGENTS.md ([8593417](https://github.com/caorteam/iwinv-alimtalk/commit/8593417ababf8abfb6c139498251f6d91956e05a))
* nudge release-please to open 0.1.1 PR ([d7d6171](https://github.com/caorteam/iwinv-alimtalk/commit/d7d61711755231e6fa12f10508c8e33a55fbcbe5))
* nudge release-please to open 0.1.1 PR ([606f319](https://github.com/caorteam/iwinv-alimtalk/commit/606f3194792637bd6546cda4992523a76f541ded))
* trigger release-please with fresh state (no prior release) ([7f0c039](https://github.com/caorteam/iwinv-alimtalk/commit/7f0c0394e732b9c19cf7a30f0d20f0689d4708b5))
* update CLI entry point and enhance test coverage for argument parsing and input handling ([6f09d68](https://github.com/caorteam/iwinv-alimtalk/commit/6f09d6833248608ba3f0ce7c04cfa7c2daac5245))


### Bug Fixes

* **client:** correct fetch availability message to Node 22+ ([2629e75](https://github.com/caorteam/iwinv-alimtalk/commit/2629e7521fcdd79f44cc053b651106df5080e45d))
* **client:** use stable DRY_RUN_PLACEHOLDER for dry-run AUTH header ([813ee57](https://github.com/caorteam/iwinv-alimtalk/commit/813ee5723a9449b8cc0718c0512c973431c549eb))
* improve command line argument handling for script execution ([e990cf8](https://github.com/caorteam/iwinv-alimtalk/commit/e990cf82d130f22b170aa95c32c1294758df3c04))
* **lint:** align ESLint import-order group with AGENTS.md spec ([3f8927f](https://github.com/caorteam/iwinv-alimtalk/commit/3f8927f6054ed7b59f3862f3929cbcb7f2b47e53))
* update package.json for library structure and add index.ts file ([6d30f76](https://github.com/caorteam/iwinv-alimtalk/commit/6d30f76a5ca03bbcd82a2dfd0213250a5317fe14))
* use import.meta.filename and guard realpathSync against ENOENT ([05aeb2d](https://github.com/caorteam/iwinv-alimtalk/commit/05aeb2d4ba91e6a7c81b45a93b332e0406982692))
* use import.meta.filename and guard realpathSync against ENOENT ([#1](https://github.com/caorteam/iwinv-alimtalk/issues/1)) ([906158b](https://github.com/caorteam/iwinv-alimtalk/commit/906158bddfaae44dff3c2612a5b88b6252801861))


### Documentation

* add AGENTS.md with project-wide coding agent guidelines ([c700009](https://github.com/caorteam/iwinv-alimtalk/commit/c7000092578f2816f37a91a154ba547ee63c9d84))
* add English and Korean usage guides ([76e5d76](https://github.com/caorteam/iwinv-alimtalk/commit/76e5d769ea48e678810a71145ceacf7314528f40))
* add File Instructions for tests and HTTP client layer ([677f3fb](https://github.com/caorteam/iwinv-alimtalk/commit/677f3fb2879fd4203706b6dab366265c5a8fefdb))
* add PR template with project-invariant checklist ([feee2cb](https://github.com/caorteam/iwinv-alimtalk/commit/feee2cbba311d3f4866b92f171373619577e77ef))
* add SECURITY.md with private vulnerability reporting channel ([292c118](https://github.com/caorteam/iwinv-alimtalk/commit/292c118b75f0edf247ed4cb1e739dc7e3e9fb81a))
* codify import ordering rule in AGENTS.md ([9c959cd](https://github.com/caorteam/iwinv-alimtalk/commit/9c959cd5b0a10574d11714f441cdb85a182bffd3))
* document automated release and npm Trusted Publishing ([f0cda58](https://github.com/caorteam/iwinv-alimtalk/commit/f0cda58c24f702b7faa0264900d793ee1f100a7c))
* fix env var name in AGENTS.md to match source ([1a6e7fe](https://github.com/caorteam/iwinv-alimtalk/commit/1a6e7fec26dbbbdd9b724220623209f95f9c23c8))
* **instructions:** document dry-run key safety and fix env var name ([5b3ed69](https://github.com/caorteam/iwinv-alimtalk/commit/5b3ed69a731c8ca7c963bd96c3f78d3f037a8a56))
* mark Node 22+ fetch mismatch as resolved in AGENTS.md ([b6c211a](https://github.com/caorteam/iwinv-alimtalk/commit/b6c211acbbb51b6e341a75205e8dddcb1cd37d00))
* sync --help-alone and DRY_RUN_PLACEHOLDER contracts into root guidance ([a24e672](https://github.com/caorteam/iwinv-alimtalk/commit/a24e6728d5b8f1fe254901d58b608cfa482410a0))
* update installation instructions and enhance usage examples in README ([db88ece](https://github.com/caorteam/iwinv-alimtalk/commit/db88ece2a1a9890a5ded782e71173c4986ed2802))


### Code Refactoring

* **cli:** auto-generate help from endpoints, use shared utils, improve CliIo typing ([ed04e7d](https://github.com/caorteam/iwinv-alimtalk/commit/ed04e7d58e9d9765718bcedcdf5f1e7ccd528524))
* **client:** centralise FetchLike type, export MIN_NODE_VERSION, simplify buildDryRun ([e745695](https://github.com/caorteam/iwinv-alimtalk/commit/e745695ffba119f148863c95d2d98eb101a51270))
* drop redundant baseUrl fallback and clarify source count ([fca199b](https://github.com/caorteam/iwinv-alimtalk/commit/fca199b17beeee05ced11de9fb43d5d7a9469a48))
* **input:** use shared BODY_SOURCE_ERROR and toErrorMessage ([e6d9e2f](https://github.com/caorteam/iwinv-alimtalk/commit/e6d9e2f0075f87f6c8197d3c65016f8d33a1c4a2))


### Continuous Integration

* add GitHub Actions workflow for build, type-check, tests, coverage ([e5f6354](https://github.com/caorteam/iwinv-alimtalk/commit/e5f6354b02ee579df8eeeabae1f4b175b2a1887a))
* add JUnit XML report and update artifact uploads ([1b508d4](https://github.com/caorteam/iwinv-alimtalk/commit/1b508d4b8f899b66d592acc40ea0b28c292e1c85))
* add release-please and npm publish-with-provenance workflows ([75e1910](https://github.com/caorteam/iwinv-alimtalk/commit/75e19109d2244a172d05aabc5c9bb45978ac2e6c))
* enable Dependabot for devDependencies and GitHub Actions ([e0eccf4](https://github.com/caorteam/iwinv-alimtalk/commit/e0eccf4f841ca8f8104c93bb415e1239fc534a67))
* **release-please:** set tag-format to match v0.1.0 tag ([430f7b1](https://github.com/caorteam/iwinv-alimtalk/commit/430f7b1de8129983eed985effd31f3521a6dc091))
* **release-please:** wrap config in packages."" for non-monorepo ([888de1a](https://github.com/caorteam/iwinv-alimtalk/commit/888de1aa5dd9bdc8c042f25967266862c81aac60))


### Miscellaneous Chores

* add .editorconfig for cross-editor consistency ([21b330b](https://github.com/caorteam/iwinv-alimtalk/commit/21b330b5a82a577fe26b9ae5d5a84e9f5ed33ef0))
* add devDependencies for linting, formatting, hooks, and commitlint ([3a5c7bb](https://github.com/caorteam/iwinv-alimtalk/commit/3a5c7bb0359763d9cfd1250730dc55b25384661c))
* add ESLint, Prettier, commitlint, and husky configs ([1ec7d7e](https://github.com/caorteam/iwinv-alimtalk/commit/1ec7d7e4dad97f77e5b1f8a68d5e6451ec49db4f))
* lower Node engine requirement to &gt;=22 and sync metadata ([6093dc3](https://github.com/caorteam/iwinv-alimtalk/commit/6093dc30dbffb83acf5beafe1b53bb3a9d8e8717))
* pin Node version to lts/jod via .nvmrc ([6854f7d](https://github.com/caorteam/iwinv-alimtalk/commit/6854f7d1575eabb911171d6e3a8221ed2798393f))
* re-trigger release-please after GitHub Release v0.1.0 ([5231f97](https://github.com/caorteam/iwinv-alimtalk/commit/5231f97ab3077bd398d622a0cd72b47fc308a8fe))
* trigger release-please after bootstrap tag ([e978df8](https://github.com/caorteam/iwinv-alimtalk/commit/e978df8bd59be38f8a0dc41ca678d135ea773fdf))
