import * as fs from "fs";
import * as path from "path";
import "reflect-metadata";

/**
 * Documentation generator for FynixJS
 */
export class DocumentationGenerator {
  private controllers: any[] = [];
  private services: any[] = [];

  /**
   * Add controller for documentation
   */
  addController(controllerClass: any, basePath: string): this {
    this.controllers.push({ controllerClass, basePath });
    return this;
  }

  /**
   * Add service for documentation
   */
  addService(serviceClass: any): this {
    this.services.push(serviceClass);
    return this;
  }

  /**
   * Generate markdown documentation
   */
  generateMarkdown(): string {
    let markdown = `# API Documentation\n\n`;
    markdown += `Generated on: ${new Date().toISOString()}\n\n`;
    markdown += `---\n\n`;

    // Table of contents
    markdown += `## Table of Contents\n\n`;
    for (const { controllerClass } of this.controllers) {
      const name = controllerClass.name;
      markdown += `- [${name}](#${name.toLowerCase()})\n`;
    }
    markdown += `\n---\n\n`;

    // Controllers documentation
    markdown += `## Controllers\n\n`;

    for (const { controllerClass, basePath } of this.controllers) {
      markdown += this.generateControllerDocs(controllerClass, basePath);
    }

    return markdown;
  }

  /**
   * Generate controller documentation
   */
  private generateControllerDocs(
    controllerClass: any,
    basePath: string
  ): string {
    let docs = `### ${controllerClass.name}\n\n`;
    docs += `**Base Path:** \`${basePath}\`\n\n`;

    const methods = Object.getOwnPropertyNames(
      controllerClass.prototype
    ).filter((m) => m !== "constructor");

    for (const method of methods) {
      const httpMethod = this.getHttpMethod(controllerClass.prototype, method);
      if (!httpMethod) continue;

      const route = this.getRoute(controllerClass.prototype, method);
      const fullPath = `${basePath}${route}`;

      docs += `#### ${httpMethod.toUpperCase()} ${fullPath}\n\n`;

      // Get OpenAPI metadata if available
      const OPENAPI_OPERATION = Symbol.for("operation");
      const operation = Reflect.getMetadata(
        OPENAPI_OPERATION,
        controllerClass.prototype,
        method
      );

      if (operation?.summary) {
        docs += `**Summary:** ${operation.summary}\n\n`;
      }

      if (operation?.description) {
        docs += `${operation.description}\n\n`;
      }

      // Parameters
      const params = this.getParameters(controllerClass.prototype, method);
      if (params.length > 0) {
        docs += `**Parameters:**\n\n`;
        for (const param of params) {
          docs += `- \`${param.name}\` (${param.type}): ${
            param.description || "No description"
          }\n`;
        }
        docs += `\n`;
      }

      // Response
      const OPENAPI_RESPONSE = Symbol.for("response");
      const responses = Reflect.getMetadata(
        OPENAPI_RESPONSE,
        controllerClass.prototype,
        method
      );

      if (responses && responses.length > 0) {
        docs += `**Responses:**\n\n`;
        for (const response of responses) {
          docs += `- \`${response.status}\`: ${response.description}\n`;
        }
        docs += `\n`;
      }

      docs += `---\n\n`;
    }

    return docs;
  }

  /**
   * Get HTTP method
   */
  private getHttpMethod(prototype: any, methodName: string): string | null {
    const HTTP_METHOD_KEY = "http:method";
    const method = Reflect.getMetadata(HTTP_METHOD_KEY, prototype, methodName);
    return method || null;
  }

  /**
   * Get route
   */
  private getRoute(prototype: any, methodName: string): string {
    const HTTP_PATH_KEY = "http:path";
    const route = Reflect.getMetadata(HTTP_PATH_KEY, prototype, methodName);
    return route || "/";
  }

  /**
   * Get parameters
   */
  private getParameters(prototype: any, methodName: string): any[] {
    const OPENAPI_PARAMETER = Symbol.for("parameter");
    return Reflect.getMetadata(OPENAPI_PARAMETER, prototype, methodName) || [];
  }

  /**
   * Generate HTML documentation
   */
  generateHTML(): string {
    const markdown = this.generateMarkdown();

    return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>API Documentation</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      background: #f5f5f5;
    }

    .container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 2rem;
    }

    header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 3rem 0;
      margin-bottom: 2rem;
      border-radius: 8px;
    }

    header h1 {
      font-size: 2.5rem;
      margin-bottom: 0.5rem;
    }

    .content {
      background: white;
      padding: 2rem;
      border-radius: 8px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    }

    h2 {
      color: #667eea;
      margin-top: 2rem;
      margin-bottom: 1rem;
      padding-bottom: 0.5rem;
      border-bottom: 2px solid #667eea;
    }

    h3 {
      color: #764ba2;
      margin-top: 1.5rem;
      margin-bottom: 1rem;
    }

    h4 {
      color: #333;
      margin-top: 1rem;
      margin-bottom: 0.5rem;
      font-family: "Courier New", monospace;
      background: #f8f9fa;
      padding: 0.5rem;
      border-radius: 4px;
    }

    code {
      background: #f8f9fa;
      padding: 0.2rem 0.4rem;
      border-radius: 3px;
      font-family: "Courier New", monospace;
      color: #e83e8c;
    }

    ul {
      margin-left: 2rem;
      margin-bottom: 1rem;
    }

    li {
      margin-bottom: 0.5rem;
    }

    hr {
      margin: 2rem 0;
      border: none;
      border-top: 1px solid #e9ecef;
    }

    .method-get { color: #28a745; }
    .method-post { color: #007bff; }
    .method-put { color: #ffc107; }
    .method-delete { color: #dc3545; }
    .method-patch { color: #17a2b8; }

    @media (max-width: 768px) {
      .container {
        padding: 1rem;
      }

      header h1 {
        font-size: 2rem;
      }
    }
  </style>
</head>
<body>
  <div class="container">
    <header>
      <h1>🚀 API Documentation</h1>
      <p>Generated with FynixJS</p>
    </header>
    <div class="content">
      ${this.markdownToHTML(markdown)}
    </div>
  </div>
</body>
</html>
    `;
  }

  /**
   * Convert markdown to HTML (simple implementation)
   */
  private markdownToHTML(markdown: string): string {
    return markdown
      .replace(/^### (.*$)/gim, "<h3>$1</h3>")
      .replace(/^## (.*$)/gim, "<h2>$1</h2>")
      .replace(/^# (.*$)/gim, "<h1>$1</h1>")
      .replace(/^\*\*(.+?)\*\*:?/gim, "<strong>$1</strong>")
      .replace(/`([^`]+)`/g, "<code>$1</code>")
      .replace(/^- (.+$)/gim, "<li>$1</li>")
      .replace(/^---$/gim, "<hr>")
      .replace(/\n\n/g, "</p><p>")
      .replace(/^(.+)$/gim, "<p>$1</p>")
      .replace(/<\/p><p><li>/g, "<ul><li>")
      .replace(/<\/li><\/p>/g, "</li></ul>")
      .replace(/<p><hr><\/p>/g, "<hr>")
      .replace(/<p><\/p>/g, "")
      .replace(/GET/g, '<span class="method-get">GET</span>')
      .replace(/POST/g, '<span class="method-post">POST</span>')
      .replace(/PUT/g, '<span class="method-put">PUT</span>')
      .replace(/DELETE/g, '<span class="method-delete">DELETE</span>')
      .replace(/PATCH/g, '<span class="method-patch">PATCH</span>');
  }

  /**
   * Save documentation to file
   */
  saveToFile(
    outputPath: string,
    format: "markdown" | "html" = "markdown"
  ): void {
    const content =
      format === "markdown" ? this.generateMarkdown() : this.generateHTML();
    const extension = format === "markdown" ? ".md" : ".html";
    const filePath = outputPath.endsWith(extension)
      ? outputPath
      : `${outputPath}${extension}`;

    const directory = path.dirname(filePath);
    if (!fs.existsSync(directory)) {
      fs.mkdirSync(directory, { recursive: true });
    }

    fs.writeFileSync(filePath, content);
    console.log(`✓ Documentation saved to: ${filePath}`);
  }
}

/**
 * Create documentation generator
 */
export function createDocumentationGenerator(): DocumentationGenerator {
  return new DocumentationGenerator();
}
