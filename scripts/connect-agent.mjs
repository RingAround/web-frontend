// One-time setup: lets the calling agent report progress to RingAround.
//
//   node --env-file=.env.local scripts/connect-agent.mjs            # dry run: show what would change
//   node --env-file=.env.local scripts/connect-agent.mjs --apply    # make the changes
//
// Needs CLAUDE_API_KEY, CLAUDE_AGENT_ID, CLAUDE_VAULT_ID and MCP_TOKEN (the same
// value as the MCP_TOKEN secret on the GitHub `prod` environment). Safe to run
// again: it updates what's already there instead of adding duplicates.
//
// It does three things, and nothing else:
//   1. stores MCP_TOKEN in the vault as a bearer credential for the endpoint URL;
//   2. adds the endpoint to the agent's MCP servers;
//   3. adds its toolset to the agent with `always_allow`, so reporting a call
//      never pauses the agent for approval (it's our own server, and the tool
//      only records status).
// The agent's model, system prompt and existing tools are left as they are.

import Anthropic from "@anthropic-ai/sdk";

const SERVER_NAME = "ringaround";
const SERVER_URL = process.env.RINGAROUND_MCP_URL ?? "https://ringaround.me/api/mcp";
const apply = process.argv.includes("--apply");

for (const name of ["CLAUDE_API_KEY", "CLAUDE_AGENT_ID", "CLAUDE_VAULT_ID", "MCP_TOKEN"]) {
  if (!process.env[name]) {
    console.error(`Missing ${name}. Add it to .env.local.`);
    process.exit(1);
  }
}

const client = new Anthropic({ apiKey: process.env.CLAUDE_API_KEY });
const agentId = process.env.CLAUDE_AGENT_ID;
const vaultId = process.env.CLAUDE_VAULT_ID;

const agent = await client.beta.agents.retrieve(agentId);
console.log(`Agent ${agent.id} "${agent.name}", version ${agent.version}`);
console.log(`  model: ${typeof agent.model === "string" ? agent.model : agent.model?.id}`);
console.log(`  MCP servers: ${agent.mcp_servers.map((s) => `${s.name} (${s.url})`).join(", ") || "none"}`);
console.log(`  tools: ${agent.tools.map((t) => (t.type === "mcp_toolset" ? `mcp_toolset:${t.mcp_server_name}` : t.type === "custom" ? `custom:${t.name}` : t.type)).join(", ") || "none"}`);
console.log(`  system prompt: ${agent.system ? `${agent.system.length} characters` : "none"}`);

// Existing tools and servers are sent back as they are; ours is added or replaced.
const mcpServers = [
  ...agent.mcp_servers.filter((server) => server.name !== SERVER_NAME).map(({ type, name, url }) => ({ type, name, url })),
  { type: "url", name: SERVER_NAME, url: SERVER_URL },
];
const tools = [
  ...agent.tools.filter((tool) => !(tool.type === "mcp_toolset" && tool.mcp_server_name === SERVER_NAME)),
  { type: "mcp_toolset", mcp_server_name: SERVER_NAME, default_config: { enabled: true, permission_policy: { type: "always_allow" } } },
];

const credentials = [];
for await (const credential of client.beta.vaults.credentials.list(vaultId)) credentials.push(credential);
const existing = credentials.find((c) => c.auth?.mcp_server_url?.replace(/\/$/, "") === SERVER_URL.replace(/\/$/, ""));

console.log(`\nWill ${existing ? `update the token on credential ${existing.id}` : "create a bearer credential"} in vault ${vaultId} for ${SERVER_URL}`);
console.log(`Will set MCP server "${SERVER_NAME}" -> ${SERVER_URL} and its toolset (always_allow) on the agent`);
if (!apply) {
  console.log("\nDry run: nothing changed. Re-run with --apply.");
  process.exit(0);
}

if (existing) {
  await client.beta.vaults.credentials.update(existing.id, {
    vault_id: vaultId,
    auth: { type: "static_bearer", token: process.env.MCP_TOKEN },
  });
} else {
  await client.beta.vaults.credentials.create(vaultId, {
    display_name: "RingAround call reporting",
    auth: { type: "static_bearer", mcp_server_url: SERVER_URL, token: process.env.MCP_TOKEN },
  });
}

// `version` makes this fail rather than overwrite if the agent changed since we read it.
const updated = await client.beta.agents.update(agentId, { version: agent.version, mcp_servers: mcpServers, tools });
console.log(`\nDone. Agent is now version ${updated.version}. New requests can report calls.`);
