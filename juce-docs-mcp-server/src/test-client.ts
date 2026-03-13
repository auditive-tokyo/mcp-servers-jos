import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { spawn } from "node:child_process";

try {
  console.log("Starting test client for JUCE Documentation MCP Server...");

  // Start the server process
  const serverProcess = spawn("node", ["dist/index.js"], {
    stdio: ["pipe", "pipe", process.stderr],
  });

  // Create a transport that communicates with the server process
  const transport = new StdioClientTransport({
    command: "node",
    args: ["dist/index.js"],
  });

  // Create an MCP client
  const client = new Client(
    {
      name: "JUCE Docs Test Client",
      version: "1.0.0",
    },
    {
      capabilities: {},
    },
  );

  // Connect to the server
  await client.connect(transport);
  console.log("Connected to server");

  // Test listing resources
  console.log("\nListing resources...");
  const resources = await client.listResources();
  console.log("Available resources:", resources);

  // Test listing tools
  console.log("\nListing tools...");
  const tools = await client.listTools();
  console.log("Available tools:", tools);

  // Test reading the class list resource
  console.log("\nReading class list...");
  const classList = await client.readResource({ uri: "juce://classes" });
  const classListItem = classList.contents[0];
  if (classList.contents && classListItem && "text" in classListItem) {
    console.log("Class list:", classListItem.text.substring(0, 200) + "...");
  }

  // Test reading a specific class resource
  console.log("\nReading ValueTree class documentation...");
  const valueTreeDocs = await client.readResource({
    uri: "juce://class/ValueTree",
  });
  const valueTreeItem = valueTreeDocs.contents[0];
  if (valueTreeDocs.contents && valueTreeItem && "text" in valueTreeItem) {
    console.log(
      "ValueTree docs:",
      valueTreeItem.text.substring(0, 200) + "...",
    );
  }

  // Test searching for classes
  console.log("\nSearching for 'Audio' classes...");
  const searchResult = await client.callTool({
    name: "search-classes",
    arguments: { query: "Audio" },
  });

  const content = searchResult.content as Array<{ type: string; text: string }>;
  if (content && content.length > 0) {
    console.log("Search results:", content[0].text.substring(0, 200) + "...");
  }

  // Test getting class documentation
  console.log("\nGetting AudioBuffer class documentation...");
  const audioDocs = await client.callTool({
    name: "get-class-docs",
    arguments: { className: "AudioBuffer" },
  });

  const audioContent = audioDocs.content as Array<{
    type: string;
    text: string;
  }>;
  if (audioContent && audioContent.length > 0) {
    console.log(
      "AudioBuffer docs:",
      audioContent[0].text.substring(0, 200) + "...",
    );
  }

  console.log("\nAll tests completed successfully!");

  // Clean up
  serverProcess.kill();
  process.exit(0);
} catch (error) {
  console.error("Error in test client:", error);
  process.exit(1);
}
