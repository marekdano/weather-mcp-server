import 'dotenv/config';
import { McpServer, ResourceTemplate } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import express from 'express';
import * as z from 'zod/v4';
import fetch from 'node-fetch';

// Define schema
const WeatherApiSchema = z.object({
  coord: z.object({
    lon: z.number(),
    lat: z.number()
  }),
  weather: z.array(z.object({
    id: z.number(),
    main: z.string(),
    description: z.string(),
    icon: z.string()
  })),
  main: z.object({
    temp: z.number(),
    feels_like: z.number(),
    humidity: z.number()
  }),
  name: z.string()
});

type Weather = {
	city: string;
	temperature: number;
	description: string;
};

const WEATHER_API_KEY = process.env.WEATHER_API_KEY;

// Function to get weather data
async function getWeather(city: string): Promise<Weather> {
  if (!WEATHER_API_KEY) throw new Error("Missing WEATHER_API_KEY env variable");

  const url = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(
    city
  )}&units=metric&appid=${WEATHER_API_KEY}`;

  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Weather API error: ${res.statusText}`);
  }

  const data = await res.json();
	const apiData = WeatherApiSchema.parse(data);

  return {
    city: apiData.name,
    temperature: apiData.main.temp,
    description: apiData.weather[0].description,
  };
}


// Create an MCP server
const server = new McpServer({
  name: 'weather-mcp-server',
  version: '0.0.1'
});

// "add" tool
server.registerTool(
	'add',
	{
		title: 'Addition Tool',
		description: 'Add two numbers',
		inputSchema: { a: z.number(), b: z.number() },
		outputSchema: { result: z.number() }
	},
	async ({ a, b }) => {
		const output = { result: a + b };
		return {
			content: [{ type: 'text', text: JSON.stringify(output) }],
			structuredContent: output
		};
	}
);

// "getWeather" tool
server.registerTool(
	'getWeather',
	{
		title: 'city',
		description: 'get weather in a city',
		inputSchema: { city: z.string() },
		outputSchema: z.object({
			city: z.string(),
			temperature: z.number(),
			description: z.string()
		}) 
	},
	async ({ city }) => {
		const result: Weather = await getWeather(city);
		return { 
			content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
			structuredContent:  result  
		};
	}
);

// Add a dynamic greeting resource
server.registerResource(
	'greeting',
	new ResourceTemplate('greeting://{name}', { list: undefined }),
	{
		title: 'Greeting Resource', // Display name for UI
		description: 'Dynamic greeting generator'
	},
	async (uri, { name }) => ({
		contents: [
			{
				uri: uri.href,
				text: `Hello, ${name}!`
			}
		]
	})
);

// Set up Express and HTTP transport
const app = express();
app.use(express.json());

app.post('/mcp', async (req, res) => {
	// Create a new transport for each request to prevent request ID collisions
	const transport = new StreamableHTTPServerTransport({
		sessionIdGenerator: undefined,
		enableJsonResponse: true,
	});

	res.on('close', () => {
		transport.close();
	});

	await server.connect(transport);
	await transport.handleRequest(req, res, req.body);
});

const port = parseInt(process.env.PORT || '3000');
app.listen(port, () => {
  console.log(`MCP Server running on http://localhost:${port}/mcp`);
}).on('error', error => {
  console.error('Server error:', error);
  process.exit(1);
});
