import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import {
  linkedinLogin,
  linkedinGetProfile,
  linkedinUpdateSummary,
  linkedinAddSkill,
  linkedinAddCertification,
  linkedinUpdateHeadline,
  linkedinCreateTextPost,
  linkedinCreateImagePost,
} from "./linkedin.js";

const server = new McpServer({
  name: "linkedin-mcp",
  version: "1.0.0",
});

server.tool("linkedin_login", "Open browser for manual LinkedIn login and save session", {}, async () => {
  const result = await linkedinLogin();
  return { content: [{ type: "text", text: result }] };
});

server.tool("linkedin_get_profile", "Fetch current LinkedIn profile info", {}, async () => {
  const result = await linkedinGetProfile();
  return { content: [{ type: "text", text: result }] };
});

server.tool(
  "linkedin_update_summary",
  "Update the About/Summary section on LinkedIn",
  { summary: z.string().describe("The new summary/about text") },
  async ({ summary }) => {
    const result = await linkedinUpdateSummary(summary);
    return { content: [{ type: "text", text: result }] };
  }
);

server.tool(
  "linkedin_update_headline",
  "Update the profile headline on LinkedIn",
  { headline: z.string().describe("The new headline text") },
  async ({ headline }) => {
    const result = await linkedinUpdateHeadline(headline);
    return { content: [{ type: "text", text: result }] };
  }
);

server.tool(
  "linkedin_add_skill",
  "Add a skill to the LinkedIn profile",
  { skill: z.string().describe("Skill name to add") },
  async ({ skill }) => {
    const result = await linkedinAddSkill(skill);
    return { content: [{ type: "text", text: result }] };
  }
);

server.tool(
  "linkedin_add_certification",
  "Add a certification to the LinkedIn profile",
  {
    name: z.string().describe("Certification name"),
    issuer: z.string().describe("Issuing organization"),
    issueDate: z.string().optional().describe("Issue date as MM/YYYY"),
    credentialId: z.string().optional().describe("Credential ID"),
    credentialUrl: z.string().optional().describe("Credential URL"),
  },
  async ({ name, issuer, issueDate, credentialId, credentialUrl }) => {
    const result = await linkedinAddCertification({
      name,
      issuer,
      issueDate,
      credentialId,
      credentialUrl,
    });
    return { content: [{ type: "text", text: result }] };
  }
);

server.tool(
  "linkedin_create_text_post",
  "Publish a plain text post on LinkedIn",
  { text: z.string().describe("The post content") },
  async ({ text }) => {
    const result = await linkedinCreateTextPost(text);
    return { content: [{ type: "text", text: result }] };
  }
);

server.tool(
  "linkedin_create_image_post",
  "Publish a LinkedIn post with a local image attachment",
  {
    text: z.string().describe("The post caption/text"),
    imagePath: z.string().describe("Absolute path to the local image file (jpg, png, gif)"),
  },
  async ({ text, imagePath }) => {
    const result = await linkedinCreateImagePost(text, imagePath);
    return { content: [{ type: "text", text: result }] };
  }
);

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("LinkedIn MCP server running on stdio");
}

main().catch(console.error);
