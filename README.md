# Liongard MCP Server

An MCP (Model Context Protocol) server for interacting with the [Liongard](https://www.liongard.com/) platform. Provides AI assistants with tools to manage inspectors, systems, metrics, alerts, users, and more through Liongard's API.

## Features

- Decision-tree tool architecture — starts with a navigation tool, then exposes domain-specific tools on demand
- 25 tools across inspectors, systems, metrics, alerts, users, groups, environments, and integrations
- Dual API version support (v1 and v2)
- 118 tests

## Installation

```bash
npm install
```

## Configuration

Set the following environment variables:

| Variable | Description |
|----------|-------------|
| `LIONGARD_URL` | Your Liongard instance URL |
| `LIONGARD_ACCESS_KEY` | API access key |
| `LIONGARD_ACCESS_SECRET` | API access secret |

## Usage

```bash
npm start
```

## Development

```bash
npm run build       # Build the project
npm run test        # Run tests
npm run lint        # Run linter
npm run typecheck   # Type-check
```

## License

[Apache-2.0](LICENSE)
