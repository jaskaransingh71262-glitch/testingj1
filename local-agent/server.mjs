import { McpServer } from "@modelcontextprotocol/server";
import { serveStdio } from "@modelcontextprotocol/server/stdio";
import * as z from "zod/v4";
import fs from "node:fs/promises";
import path from "node:path";
import { spawn } from "node:child_process";

const WORKSPACE = path.resolve(
  process.env.AGENT_WORKSPACE || path.join(process.env.HOME || process.cwd(), "Projects", "testingj1")
);

const server = new McpServer({
  name: "jaskaran-local-agent",
  version: "0.1.0"
});

function resolveInsideWorkspace(relativePath = ".") {
  const target = path.resolve(WORKSPACE, relativePath);
  if (target !== WORKSPACE && !target.startsWith(WORKSPACE + path.sep)) {
    throw new Error("Path is outside the configured workspace.");
  }
  return target;
}

function textResult(text) {
  return { content: [{ type: "text", text }] };
}

server.registerTool(
  "workspace_info",
  {
    description: "Show the configured local workspace path.",
    inputSchema: {}
  },
  async () => textResult(WORKSPACE)
);

server.registerTool(
  "list_files",
  {
    description: "List files and directories inside the configured workspace.",
    inputSchema: {
      path: z.string().default(".").describe("Workspace-relative directory")
    }
  },
  async ({ path: relativePath }) => {
    const target = resolveInsideWorkspace(relativePath);
    const entries = await fs.readdir(target, { withFileTypes: true });
    const lines = entries
      .sort((a, b) => a.name.localeCompare(b.name))
      .map(e => (e.isDirectory() ? e.name + "/" : e.name));
    return textResult(lines.join("\n") || "(empty)");
  }
);

server.registerTool(
  "read_file",
  {
    description: "Read a UTF-8 text file inside the configured workspace.",
    inputSchema: {
      path: z.string().min(1).describe("Workspace-relative file path")
    }
  },
  async ({ path: relativePath }) => {
    const target = resolveInsideWorkspace(relativePath);
    const stat = await fs.stat(target);
    if (!stat.isFile()) throw new Error("Not a file.");
    const content = await fs.readFile(target, "utf8");
    return textResult(content);
  }
);

server.registerTool(
  "write_file",
  {
    description: "Create or replace a UTF-8 text file inside the configured workspace.",
    inputSchema: {
      path: z.string().min(1).describe("Workspace-relative file path"),
      content: z.string().describe("Complete file contents")
    }
  },
  async ({ path: relativePath, content }) => {
    const target = resolveInsideWorkspace(relativePath);
    await fs.mkdir(path.dirname(target), { recursive: true });
    await fs.writeFile(target, content, "utf8");
    return textResult("Wrote " + path.relative(WORKSPACE, target));
  }
);

server.registerTool(
  "delete_file",
  {
    description: "Delete one file inside the configured workspace. Directories are refused.",
    inputSchema: {
      path: z.string().min(1).describe("Workspace-relative file path")
    }
  },
  async ({ path: relativePath }) => {
    const target = resolveInsideWorkspace(relativePath);
    const stat = await fs.stat(target);
    if (!stat.isFile()) throw new Error("Only individual files can be deleted.");
    await fs.unlink(target);
    return textResult("Deleted " + path.relative(WORKSPACE, target));
  }
);

server.registerTool(
  "run_command",
  {
    description:
      "Run a development command with an argument array in the configured workspace. Shell interpretation is disabled. Commands that can modify or delete data require explicit allow_destructive=true.",
    inputSchema: {
      command: z.string().min(1).describe("Executable name, e.g. git, npm, dotnet"),
      args: z.array(z.string()).default([]).describe("Command arguments"),
      allow_destructive: z.boolean().default(false).describe("Explicitly allow destructive commands")
    }
  },
  async ({ command, args, allow_destructive }) => {
    const destructive = new Set([
      "rm", "rmdir", "mv", "chmod", "chown", "kill", "pkill", "sudo"
    ]);

    if (destructive.has(command) && !allow_destructive) {
      return textResult(
        "BLOCKED: " + command + " requires allow_destructive=true."
      );
    }

    const denied = new Set(["sudo", "launchctl", "diskutil", "shutdown", "reboot"]);
    if (denied.has(command)) {
      return textResult("BLOCKED: system-level command is not available.");
    }

    const output = await new Promise((resolve, reject) => {
      const child = spawn(command, args, {
        cwd: WORKSPACE,
        env: process.env,
        shell: false
      });

      let stdout = "";
      let stderr = "";

      child.stdout.on("data", d => { stdout += d.toString(); });
      child.stderr.on("data", d => { stderr += d.toString(); });

      child.on("error", reject);
      child.on("close", code => {
        resolve(
          JSON.stringify({
            command: [command, ...args],
            exitCode: code,
            stdout,
            stderr
          }, null, 2)
        );
      });
    });

    return textResult(output);
  }
);

server.registerTool(
  "git_status",
  {
    description: "Show git status for the configured workspace.",
    inputSchema: {}
  },
  async () => {
    const result = await new Promise((resolve, reject) => {
      const child = spawn("git", ["status", "--short", "--branch"], {
        cwd: WORKSPACE,
        env: process.env,
        shell: false
      });
      let out = "";
      let err = "";
      child.stdout.on("data", d => { out += d.toString(); });
      child.stderr.on("data", d => { err += d.toString(); });
      child.on("error", reject);
      child.on("close", code => resolve({ code, out, err }));
    });

    return textResult(JSON.stringify(result, null, 2));
  }
);

await serveStdio(() => server);
