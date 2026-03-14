import {
  McpServer,
  ResourceTemplate,
} from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import {
  fetchClassDocumentation,
  fetchClassList,
  searchClasses,
  formatClassDocumentation,
} from "./juce-docs.js";

// Create an MCP server
const server = new McpServer({
  name: "JUCE Documentation Server",
  version: "1.0.0",
});

// Resource for getting documentation for a specific class
server.registerResource(
  "class-docs",
  new ResourceTemplate("juce://class/{className}", { list: undefined }),
  {},
  async (uri, { className }) => {
    console.error(`Fetching documentation for class: ${className}`);

    // Ensure className is a string
    const classNameStr = Array.isArray(className) ? className[0] : className;
    const doc = await fetchClassDocumentation(classNameStr);

    if (!doc) {
      return {
        contents: [
          {
            uri: uri.href,
            text: `Documentation for class '${classNameStr}' not found.`,
          },
        ],
      };
    }

    const markdown = formatClassDocumentation(doc);

    return {
      contents: [
        {
          uri: uri.href,
          text: markdown,
        },
      ],
    };
  },
);

// Resource for listing all available classes
server.registerResource("class-list", "juce://classes", {}, async (uri) => {
  console.error("Fetching list of all JUCE classes");

  const classes = await fetchClassList();
  const classLinks = classes.map((c) => `- [${c}](juce://class/${c})`).join("\n");

  return {
    contents: [
      {
        uri: uri.href,
        text: `# JUCE Classes\n\n${classLinks}`,
      },
    ],
  };
});

// Tool for searching classes
server.registerTool(
  "search-juce-classes",
  {
    // description added (Mandatory for Visual Studio support)
    description:
      "Searches for JUCE classes based on a query string. Use this to find specific components or classes in the JUCE framework.",
    inputSchema: z.object({ query: z.string() }),
  },
  async ({ query }) => {
    console.error(`Searching for classes matching: ${query}`);

    const results = await searchClasses(query);

    if (results.length === 0) {
      return {
        content: [
          {
            type: "text",
            text: `No classes found matching '${query}'.`,
          },
        ],
      };
    }

    const resultLinks = results.map((c) => `- [${c}](juce://class/${c})`).join("\n");
    const markdown = `# Search Results for '${query}'\n\n${resultLinks}`;

    return {
      content: [{ type: "text", text: markdown }],
    };
  },
);

// Tool for getting class documentation
server.registerTool(
  "get-juce-class-docs",
  {
    // description added (Mandatory for Visual Studio support)
    description:
      "Retrieves detailed documentation and member functions for a specific JUCE class name.",
    inputSchema: z.object({ className: z.string() }),
  },
  async ({ className }) => {
    console.error(`Fetching documentation for class: ${className}`);

    const doc = await fetchClassDocumentation(className);

    if (!doc) {
      return {
        content: [
          {
            type: "text",
            text: `Documentation for class '${className}' not found.`,
          },
        ],
      };
    }

    const markdown = formatClassDocumentation(doc);

    return {
      content: [{ type: "text", text: markdown }],
    };
  },
);

// Prompt for exploring JUCE documentation
server.registerPrompt(
  "explore-juce",
  { argsSchema: { topic: z.string().optional() } },
  ({ topic }) => ({
    messages: [
      {
        role: "user",
        content: {
          type: "text",
          text: topic
            ? `Please help me understand the JUCE ${topic} functionality. What classes should I look at?`
            : "Please help me explore the JUCE framework. What are the main components and classes I should know about?",
        },
      },
    ],
  }),
);

// Start the server
try {
  console.error("Starting JUCE Documentation MCP Server...");

  const transport = new StdioServerTransport();
  await server.connect(transport);

  console.error("Server connected and ready to receive requests.");
} catch (error) {
  console.error("Error starting server:", error);
  process.exit(1);
}
