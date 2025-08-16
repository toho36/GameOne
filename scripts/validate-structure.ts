#!/usr/bin/env bun
/* eslint-disable no-console */

/**
 * Project Structure Validation Script
 *
 * This script validates that the project follows the established
 * file structure and naming conventions defined in:
 * - .cursor/rules/project-structure.mdc
 * - .claude/agents/project-structure.md
 */

import { readdir, stat, readFile } from "fs/promises";
import { join, extname, relative } from "path";

interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

interface FileInfo {
  path: string;
  relativePath: string;
  name: string;
  extension: string;
  isDirectory: boolean;
}

class ProjectStructureValidator {
  private projectRoot: string;
  private errors: string[] = [];
  private warnings: string[] = [];

  constructor(projectRoot: string = process.cwd()) {
    this.projectRoot = projectRoot;
  }

  async validate(): Promise<ValidationResult> {
    console.log("🔍 Validating project structure...\n");

    await this.validateDirectoryStructure();
    await this.validateFileNaming();
    await this.validateImportPaths();
    await this.validateComponentOrganization();
    await this.validateApiRoutes();
    await this.validateTypeOrganization();

    return {
      valid: this.errors.length === 0,
      errors: this.errors,
      warnings: this.warnings,
    };
  }

  private async validateDirectoryStructure(): Promise<void> {
    console.log("📁 Checking directory structure...");

    const requiredDirectories = [
      "src/app",
      "src/components/ui",
      "src/hooks",
      "src/lib",
      "src/i18n",
      "prisma",
      ".claude/agents",
      ".cursor/rules",
    ];

    for (const dir of requiredDirectories) {
      const fullPath = join(this.projectRoot, dir);
      try {
        const stats = await stat(fullPath);
        if (!stats.isDirectory()) {
          this.errors.push(`Required directory is not a directory: ${dir}`);
        }
      } catch {
        this.errors.push(`Missing required directory: ${dir}`);
      }
    }
  }

  private async validateFileNaming(): Promise<void> {
    console.log("🏷️  Checking file naming conventions...");

    const srcFiles = await this.getAllFiles(join(this.projectRoot, "src"));

    for (const file of srcFiles) {
      if (file.isDirectory) continue;

      // Check naming conventions based on file type and location
      if (this.isComponentFile(file)) {
        this.validateComponentNaming(file);
      } else if (this.isHookFile(file)) {
        this.validateHookNaming(file);
      } else if (this.isUtilityFile(file)) {
        this.validateUtilityNaming(file);
      } else if (this.isTypeFile(file)) {
        this.validateTypeNaming(file);
      } else if (this.isPageFile(file)) {
        this.validatePageNaming(file);
      } else if (this.isApiRouteFile(file)) {
        this.validateApiRouteNaming(file);
      }
    }
  }

  private async validateImportPaths(): Promise<void> {
    console.log("🔗 Checking import paths...");

    const tsFiles = await this.getAllFiles(join(this.projectRoot, "src"), [".ts", ".tsx"]);

    for (const file of tsFiles) {
      if (file.isDirectory) continue;

      try {
        const fileContent = await readFile(file.path, "utf-8");
        this.validateImportsInFile(file, fileContent);
      } catch {
        this.warnings.push(`Could not read file for import validation: ${file.relativePath}`);
      }
    }
  }

  private async validateComponentOrganization(): Promise<void> {
    console.log("🧩 Checking component organization...");

    const componentFiles = await this.getAllFiles(join(this.projectRoot, "src/components"), [
      ".tsx",
    ]);

    for (const file of componentFiles) {
      if (file.isDirectory) continue;

      const pathParts = file.relativePath.split("/");

      if (pathParts.includes("ui")) {
        // UI components are good
      } else if (pathParts.includes("features")) {
        // Feature components are good
      } else if (pathParts.includes("layout")) {
        // Layout components are good
      } else if (pathParts.includes("auth")) {
        // Auth components are acceptable (feature-specific organization)
      } else {
        // All other components should be in organized subdirectories
        this.warnings.push(
          `Component not in organized subdirectory: ${file.relativePath}. ` +
            "Should be in ui/, features/, layout/, or a feature-specific directory like auth/"
        );
      }
    }
  }

  private async validateApiRoutes(): Promise<void> {
    console.log("🌐 Checking API route structure...");

    const apiPath = join(this.projectRoot, "src/app/api");

    try {
      const apiFiles = await this.getAllFiles(apiPath, [".ts"]);

      for (const file of apiFiles) {
        if (file.isDirectory) continue;

        // Skip test files
        if (file.relativePath.includes("__tests__") || file.relativePath.includes(".test.")) {
          continue;
        }

        if (file.name !== "route.ts") {
          this.errors.push(
            `API file should be named 'route.ts': ${file.relativePath}. ` +
              "App Router requires API routes to be named 'route.ts'"
          );
        }
      }
    } catch {
      this.warnings.push("No API routes found - this might be expected for some projects");
    }
  }

  private async validateTypeOrganization(): Promise<void> {
    console.log("📝 Checking type organization...");

    const typesPath = join(this.projectRoot, "src/types");

    try {
      const typeFiles = await this.getAllFiles(typesPath, [".ts"]);

      for (const file of typeFiles) {
        if (file.isDirectory) continue;

        const pathParts = file.relativePath.split("/");
        const hasSubdirectory = pathParts.length > 2; // src/types/{subdirectory}/file.ts

        if (!hasSubdirectory) {
          this.warnings.push(
            `Type file not in organized subdirectory: ${file.relativePath}. ` +
              "Consider organizing in api/, features/, ui/, or global/"
          );
        }
      }
    } catch {
      this.warnings.push("No types directory found");
    }
  }

  private validateComponentNaming(file: FileInfo): void {
    const nameWithoutExt = file.name.replace(file.extension, "");

    // Skip test files
    if (nameWithoutExt.includes(".test") || file.relativePath.includes("__tests__")) {
      return;
    }

    if (!this.isKebabCase(nameWithoutExt)) {
      this.errors.push(`Component should use kebab-case: ${file.relativePath}`);
    }
  }

  private validateHookNaming(file: FileInfo): void {
    const nameWithoutExt = file.name.replace(file.extension, "");

    // Skip test files
    if (nameWithoutExt.includes(".test") || file.relativePath.includes("__tests__")) {
      return;
    }

    if (!nameWithoutExt.startsWith("use-")) {
      this.errors.push(`Hook should start with 'use-': ${file.relativePath}`);
    }

    if (!this.isKebabCase(nameWithoutExt)) {
      this.errors.push(`Hook should use kebab-case: ${file.relativePath}`);
    }
  }

  private validateUtilityNaming(file: FileInfo): void {
    const nameWithoutExt = file.name.replace(file.extension, "");

    // Skip test files
    if (nameWithoutExt.includes(".test") || file.relativePath.includes("__tests__")) {
      return;
    }

    if (!this.isKebabCase(nameWithoutExt)) {
      this.errors.push(`Utility file should use kebab-case: ${file.relativePath}`);
    }
  }

  private validateTypeNaming(file: FileInfo): void {
    const nameWithoutExt = file.name.replace(file.extension, "");

    if (!this.isKebabCase(nameWithoutExt)) {
      this.errors.push(`Type file should use kebab-case: ${file.relativePath}`);
    }
  }

  private validatePageNaming(file: FileInfo): void {
    // Allow both page.tsx and layout.tsx
    if (file.name !== "page.tsx" && file.name !== "layout.tsx") {
      this.errors.push(
        `Page file should be named 'page.tsx' or 'layout.tsx': ${file.relativePath}`
      );
    }
  }

  private validateApiRouteNaming(file: FileInfo): void {
    // Skip test files
    if (file.relativePath.includes("__tests__") || file.relativePath.includes(".test.")) {
      return;
    }

    if (file.name !== "route.ts") {
      this.errors.push(`API route file should be named 'route.ts': ${file.relativePath}`);
    }
  }

  private validateImportsInFile(file: FileInfo, content: string): void {
    const lines = content.split("\n");

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]?.trim();
      if (!line || !line.startsWith("import")) continue;

      // Check for relative imports (should use @/ aliases instead)
      // Exception: JSON imports in test files can use relative paths due to Vitest limitations
      if (line.includes("../")) {
        const isJsonImport = line.includes(".json");
        const isTestFile =
          file.relativePath.includes("__tests__") || file.relativePath.includes(".test.");

        if (!(isJsonImport && isTestFile)) {
          this.errors.push(
            `Use @/ path alias instead of relative import in ${file.relativePath}:${i + 1}: ${line}`
          );
        }
      }

      // Check for process.env without bracket notation
      if (line.includes("process.env.") && !line.includes("process.env[")) {
        this.errors.push(
          `Use bracket notation for environment variables in ${file.relativePath}:${i + 1}: ${line}`
        );
      }
    }
  }

  private isComponentFile(file: FileInfo): boolean {
    return file.extension === ".tsx" && file.relativePath.includes("components");
  }

  private isHookFile(file: FileInfo): boolean {
    return file.extension === ".ts" && file.relativePath.includes("hooks");
  }

  private isUtilityFile(file: FileInfo): boolean {
    return file.extension === ".ts" && file.relativePath.includes("lib");
  }

  private isTypeFile(file: FileInfo): boolean {
    return file.extension === ".ts" && file.relativePath.includes("types");
  }

  private isPageFile(file: FileInfo): boolean {
    return (
      file.extension === ".tsx" &&
      file.relativePath.includes("app") &&
      !file.relativePath.includes("api") &&
      (file.name === "page.tsx" || file.name === "layout.tsx")
    );
  }

  private isApiRouteFile(file: FileInfo): boolean {
    return file.extension === ".ts" && file.relativePath.includes("app/api");
  }

  private isKebabCase(str: string): boolean {
    return /^[a-z][a-z0-9]*(-[a-z0-9]+)*$/.test(str);
  }

  private async getAllFiles(dirPath: string, extensions?: string[]): Promise<FileInfo[]> {
    const files: FileInfo[] = [];

    try {
      const entries = await readdir(dirPath);

      for (const entry of entries) {
        const fullPath = join(dirPath, entry);
        const stats = await stat(fullPath);
        const relativePath = relative(this.projectRoot, fullPath);

        if (stats.isDirectory()) {
          files.push({
            path: fullPath,
            relativePath,
            name: entry,
            extension: "",
            isDirectory: true,
          });

          // Recursively get files from subdirectories
          const subFiles = await this.getAllFiles(fullPath, extensions);
          files.push(...subFiles);
        } else {
          const extension = extname(entry);

          if (!extensions || extensions.includes(extension)) {
            files.push({
              path: fullPath,
              relativePath,
              name: entry,
              extension,
              isDirectory: false,
            });
          }
        }
      }
    } catch {
      // Directory doesn't exist or can't be read
    }

    return files;
  }
}

// Run validation
async function main() {
  const validator = new ProjectStructureValidator();
  const result = await validator.validate();

  console.log("\n" + "=".repeat(50));
  console.log("📊 VALIDATION RESULTS");
  console.log("=".repeat(50));

  if (result.errors.length > 0) {
    console.log("\n❌ ERRORS:");
    result.errors.forEach((error) => console.log(`  • ${error}`));
  }

  if (result.warnings.length > 0) {
    console.log("\n⚠️  WARNINGS:");
    result.warnings.forEach((warning) => console.log(`  • ${warning}`));
  }

  if (result.valid) {
    console.log("\n✅ Project structure validation passed!");
    console.log("🎉 All files follow the established conventions.");
  } else {
    console.log(`\n❌ Project structure validation failed!`);
    console.log(`📝 Found ${result.errors.length} errors and ${result.warnings.length} warnings.`);
    console.log("\n💡 Please fix the errors above and re-run validation.");
  }

  console.log("\n📚 For structure guidelines, see:");
  console.log("  • .cursor/rules/project-structure.mdc");
  console.log("  • .claude/agents/project-structure.md");

  process.exit(result.valid ? 0 : 1);
}

// Check if this script is being run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}
