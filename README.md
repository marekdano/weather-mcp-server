# weather-mcp-server


## Quick overview

- Entry source: `src/server.ts`
- Build output: `dist/server.js` (TypeScript -> `tsc`)
- App port (expected): `3000`

## Local (npm) commands

Install dependencies:

```sh
npm install
```

Build the project:

```sh
npm run build
```

Start the server (builds first):

```sh
npm run start
```

Run in development mode (no build step, uses `tsx`):

```sh
npm run dev
```

Project provides an MCP `inspector` to test the Weather MCP server. Run the MCP inspector:

```sh
npm run inspector
```

## Environment

- Put environment variable `WEATHER_API_KEY` in a `.env` file (this repo's `.gitignore` already ignores `.env`). The `WEATHER_API_KEY` is a API key of `openweathermap` service that it's used in this MCP server.

## Docker 

- Build the image:

```sh
docker build -t weather-mcp-server .
```

- Run MCP server locally with docker:

```sh
docker run --rm --env-file .env -p 3000:3000 weather-mcp-server
```


## Troubleshooting

- Make sure that node.js 18+ is used when `npm run inspector` runs.

