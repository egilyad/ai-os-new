# ADR-005: MCP Integration

**Status**: Accepted (v3.0)  
**Date**: 2026-06-28  
**Deciders**: Architecture Team

## Context

The agent system needs to connect to external tools and data sources (files, web, calculators, APIs). A plugin-like architecture was needed that allows adding new capabilities without modifying agent code.

## Decision

Use the Model Context Protocol (MCP) as the tool integration standard:

1. MCP servers expose capabilities via SSE (remote) transport — stdio is part of the MCP spec but only applicable to Node.js clients, not to browser-based applications like SuperAgents OS
2. Each MCP connection is wrapped in `MCPService` with health checks and auto-reconnect
3. Tools are discovered via `tools/list` and executed via `tools/call`
4. MCP servers are configured in the system settings (name, command, args, env)
5. Failed MCP connections are degraded but don't crash the system

## Consequences

- Agents can use any tool without code changes — just install an MCP server
- MCP standard means compatibility with a growing ecosystem of tools
- SSE transport for remote capabilities (databases, cloud APIs) — stdio transport is not available in browser environments
- SSE transport enables remote capabilities (databases, cloud APIs)
- Connection failures are isolated — one broken server doesn't affect others

## Related

- `src/kernel/services/mcp-service.ts` — MCP connection manager
- `src/components/MCPPanel/` — MCP configuration UI
- `src/kernel/contracts/tool-types.ts` — tool interfaces
