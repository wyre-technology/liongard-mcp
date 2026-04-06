## [1.1.7](https://github.com/wyre-technology/liongard-mcp/compare/v1.1.6...v1.1.7) (2026-04-06)


### Bug Fixes

* allow unauthenticated tools/list in gateway mode ([c3eabdd](https://github.com/wyre-technology/liongard-mcp/commit/c3eabdd3aaf1a8f767d396730c53903c30f146cc))

## [1.1.6](https://github.com/wyre-technology/liongard-mcp/compare/v1.1.5...v1.1.6) (2026-03-26)


### Bug Fixes

* **tools:** list all domain tools upfront, remove lazy loading for remote MCP compatibility ([1b8b8c1](https://github.com/wyre-technology/liongard-mcp/commit/1b8b8c10b6a81fbc449c439dea4ea09327f3bc63))

## [1.1.5](https://github.com/wyre-technology/liongard-mcp/compare/v1.1.4...v1.1.5) (2026-03-26)


### Bug Fixes

* emit tools/list_changed notification after navigate ([2dfaf38](https://github.com/wyre-technology/liongard-mcp/commit/2dfaf38133660e5ce13e75e0432b00513f20daec)), closes [#1](https://github.com/wyre-technology/liongard-mcp/issues/1)

## [1.1.4](https://github.com/wyre-technology/liongard-mcp/compare/v1.1.3...v1.1.4) (2026-03-02)


### Bug Fixes

* **ci:** fix broken YAML in Discord notification step ([cb9ad1e](https://github.com/wyre-technology/liongard-mcp/commit/cb9ad1e68d438f4e478b011bd413d5f407defb9d))
* **ci:** move Discord notification into release workflow ([aa51620](https://github.com/wyre-technology/liongard-mcp/commit/aa51620a6ddf2a1e09390498a11c6e3b0800c1f4))

## [1.1.3](https://github.com/wyre-technology/liongard-mcp/compare/v1.1.2...v1.1.3) (2026-02-26)


### Bug Fixes

* correct Docker tag step reference from release-version to version ([340870e](https://github.com/wyre-technology/liongard-mcp/commit/340870e6865b5055ec3da02343043d293017c33e))
* rename pack-mcpb.js to .cjs to fix ESM require() error ([eed5713](https://github.com/wyre-technology/liongard-mcp/commit/eed571344ac9e3f096e721a8a50a4739c34e548a))

## [1.1.2](https://github.com/wyre-technology/liongard-mcp/compare/v1.1.1...v1.1.2) (2026-02-23)


### Bug Fixes

* quote MCPB bundle filename to prevent shell glob expansion failure ([dcb81ba](https://github.com/wyre-technology/liongard-mcp/commit/dcb81ba1d2aa2001699d82a1dbe7c83f30f03f54))
* rename duplicate step id 'version' to 'release-version' in docker job ([4c60af3](https://github.com/wyre-technology/liongard-mcp/commit/4c60af31795a1177f8e9d6ac34d977087f2173d4))

## [1.1.1](https://github.com/wyre-technology/liongard-mcp/compare/v1.1.0...v1.1.1) (2026-02-18)


### Bug Fixes

* **ci:** fix release workflow failures ([08506f1](https://github.com/wyre-technology/liongard-mcp/commit/08506f1ee96e27f8f9ff487a947770d3498f1dbe))

# [1.1.0](https://github.com/wyre-technology/liongard-mcp/compare/v1.0.1...v1.1.0) (2026-02-17)


### Features

* add MCPB bundle to release workflow ([e1d8d4c](https://github.com/wyre-technology/liongard-mcp/commit/e1d8d4cc3daefd876963272e2f7c4020f55db2ec))
* add MCPB manifest for desktop installation ([f686998](https://github.com/wyre-technology/liongard-mcp/commit/f68699831215cde89344a96f4640235efcd49498))
* add MCPB pack script ([562f1d8](https://github.com/wyre-technology/liongard-mcp/commit/562f1d8fdba3f8149cb985bd9e8894006a47cfee))
* add pack:mcpb script ([8f58c22](https://github.com/wyre-technology/liongard-mcp/commit/8f58c229b3ec790300edf6f1825e168324ff0a77))

## [1.0.1](https://github.com/wyre-technology/liongard-mcp/compare/v1.0.0...v1.0.1) (2026-02-17)


### Bug Fixes

* **docker:** drop arm64 platform to fix QEMU build failures ([48d0d91](https://github.com/wyre-technology/liongard-mcp/commit/48d0d91abaaba5c3975d4a065668e17919115a77))

# 1.0.0 (2026-02-16)


### Bug Fixes

* **ci:** add GitHub Packages auth token to Docker builds ([5a5bf80](https://github.com/wyre-technology/liongard-mcp/commit/5a5bf80c0f7d64bdfca72e2d44fa37a0bbcdac8d))
* **ci:** add missing semantic-release plugin dependencies ([21cec64](https://github.com/wyre-technology/liongard-mcp/commit/21cec6457d84cabd3402d52c76ab881bd0056582))
* **ci:** use Node 22 for semantic-release (requires ^22.14.0) ([9857ab9](https://github.com/wyre-technology/liongard-mcp/commit/9857ab9b60086d3b72cf7fc0335aa81e3a6ed128))


### Features

* initial liongard-mcp server with decision-tree architecture ([5fd3c02](https://github.com/wyre-technology/liongard-mcp/commit/5fd3c02f9fc77985b0b7212880ba619a8840f1f9))
