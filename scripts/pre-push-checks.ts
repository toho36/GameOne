#!/usr/bin/env bun
/* eslint-disable no-console */

/**
 * Comprehensive Pre-Push Checks Script
 *
 * This script runs all quality checks in the correct order:
 * 1. TypeScript type checking
 * 2. ESLint code quality
 * 3. Prettier code formatting
 * 4. Project structure validation
 * 5. Database schema validation (if changed)
 * 6. Test execution
 *
 * Usage:
 * - bun run pre-push        # Run all checks
 * - bun run pre-push --fix  # Auto-fix what can be fixed
 */

import { spawn } from "child_process";

interface CheckResult {
  name: string;
  passed: boolean;
  duration: number;
  error?: string;
  warning?: string;
}

class PrePushChecker {
  private results: CheckResult[] = [];
  private autoFix: boolean = false;

  constructor(autoFix = false) {
    this.autoFix = autoFix;
  }

  async runAllChecks(): Promise<boolean> {
    console.log("🚀 Running comprehensive pre-push checks...\n");

    const checks = [
      { name: "TypeScript Type Check", command: "type-check", canFix: false },
      { name: "ESLint Code Quality", command: "lint", canFix: true, fixCommand: "lint:fix" },
      { name: "Prettier Formatting", command: "format:check", canFix: true, fixCommand: "format" },
      { name: "Project Structure", command: "validate-structure", canFix: false },
      { name: "Database Schema", command: "db:verify", canFix: false, optional: true },
      { name: "Unit Tests", command: "test --run", canFix: false, optional: false },
    ];

    let allPassed = true;

    for (const check of checks) {
      const result = await this.runCheck(check);
      this.results.push(result);

      if (!result.passed) {
        allPassed = false;

        if (this.autoFix && check.canFix && check.fixCommand) {
          console.log(`🔧 Attempting to auto-fix ${check.name}...`);
          const fixResult = await this.runCommand(`bun run ${check.fixCommand}`);

          if (fixResult.success) {
            console.log(`✅ Auto-fix successful for ${check.name}`);
            // Re-run the check to verify fix
            const recheck = await this.runCheck(check);
            if (recheck.passed) {
              result.passed = true;
              allPassed = true;
              console.log(`✅ ${check.name} now passes after auto-fix`);
            }
          } else {
            console.log(`❌ Auto-fix failed for ${check.name}`);
          }
        }

        if (!result.passed && !check.optional) {
          break; // Stop on first critical failure
        }
      }
    }

    this.printSummary();
    return allPassed;
  }

  private async runCheck(check: {
    name: string;
    command: string;
    canFix?: boolean;
    fixCommand?: string;
    optional?: boolean;
  }): Promise<CheckResult> {
    const startTime = Date.now();
    console.log(`🔍 Running ${check.name}...`);

    try {
      const result = await this.runCommand(`bun run ${check.command}`);
      const duration = Date.now() - startTime;

      if (result.success) {
        console.log(`✅ ${check.name} passed (${duration}ms)`);
        return {
          name: check.name,
          passed: true,
          duration,
        };
      } else {
        const errorMsg = result.error || "Check failed";
        console.log(`❌ ${check.name} failed (${duration}ms)`);
        if (result.output) {
          console.log(`   Error: ${result.output.slice(0, 200)}...`);
        }

        return {
          name: check.name,
          passed: false,
          duration,
          error: errorMsg,
        };
      }
    } catch (error) {
      const duration = Date.now() - startTime;
      const errorMsg = error instanceof Error ? error.message : "Unknown error";

      console.log(`❌ ${check.name} failed (${duration}ms): ${errorMsg}`);

      return {
        name: check.name,
        passed: false,
        duration,
        error: errorMsg,
      };
    }
  }

  private runCommand(
    command: string
  ): Promise<{ success: boolean; output?: string; error?: string }> {
    return new Promise((resolve) => {
      const parts = command.split(" ");
      const cmd = parts[0]!;
      const args = parts.slice(1);

      const child = spawn(cmd, args, {
        stdio: ["pipe", "pipe", "pipe"],
        shell: true,
      });

      let output = "";
      let error = "";

      child.stdout?.on("data", (data: Buffer) => {
        output += data.toString();
      });

      child.stderr?.on("data", (data: Buffer) => {
        error += data.toString();
      });

      child.on("close", (code: number | null) => {
        resolve({
          success: code === 0,
          output: output.trim(),
          error: error.trim(),
        });
      });

      child.on("error", (err: Error) => {
        resolve({
          success: false,
          error: err.message,
        });
      });
    });
  }

  private printSummary(): void {
    console.log("\n" + "=".repeat(60));
    console.log("📊 PRE-PUSH CHECK SUMMARY");
    console.log("=".repeat(60));

    const passed = this.results.filter((r) => r.passed);
    const failed = this.results.filter((r) => !r.passed);
    const totalTime = this.results.reduce((sum, r) => sum + r.duration, 0);

    console.log(`\n✅ Passed: ${passed.length}`);
    console.log(`❌ Failed: ${failed.length}`);
    console.log(`⏱️  Total time: ${totalTime}ms`);

    if (failed.length > 0) {
      console.log("\n❌ FAILED CHECKS:");
      failed.forEach((result) => {
        console.log(`  • ${result.name}`);
        if (result.error) {
          console.log(`    Error: ${result.error}`);
        }
      });
    }

    if (passed.length === this.results.length) {
      console.log("\n🎉 All checks passed! Your code is ready to push.");
      console.log("💡 You can now safely run: git push");
    } else {
      console.log("\n🚫 Some checks failed. Please fix the issues above before pushing.");
      console.log("\n💡 Helpful commands:");
      console.log("  bun run pre-push --fix    # Try to auto-fix issues");
      console.log("  bun run lint:fix          # Fix ESLint errors");
      console.log("  bun run format            # Fix formatting");
      console.log("  bun run type-check        # Check TypeScript");
      console.log("  bun run validate-structure # Check project structure");
    }

    console.log("\n📚 Documentation:");
    console.log("  • .cursor/rules/ - Development rules");
    console.log("  • .claude/agents/ - Agent guidelines");
    console.log("  • SETUP.md - Setup instructions");
  }
}

// Enhanced git integration
class GitIntegration {
  static async hasUncommittedChanges(): Promise<boolean> {
    try {
      const result = await new Promise<{ success: boolean; output: string }>((resolve) => {
        const child = spawn("git", ["status", "--porcelain"], {
          stdio: ["pipe", "pipe", "pipe"],
        });

        let output = "";
        child.stdout?.on("data", (data: Buffer) => {
          output += data.toString();
        });

        child.on("close", (code: number | null) => {
          resolve({ success: code === 0, output: output.trim() });
        });
      });

      return result.output.length > 0;
    } catch {
      return false;
    }
  }

  static async getCurrentBranch(): Promise<string> {
    try {
      const result = await new Promise<string>((resolve) => {
        const child = spawn("git", ["branch", "--show-current"], {
          stdio: ["pipe", "pipe", "pipe"],
        });

        let output = "";
        child.stdout?.on("data", (data: Buffer) => {
          output += data.toString();
        });

        child.on("close", () => {
          resolve(output.trim() || "unknown");
        });
      });

      return result;
    } catch {
      return "unknown";
    }
  }

  static async getChangedFiles(): Promise<string[]> {
    try {
      const result = await new Promise<string[]>((resolve) => {
        const child = spawn("git", ["diff", "--name-only", "HEAD"], {
          stdio: ["pipe", "pipe", "pipe"],
        });

        let output = "";
        child.stdout?.on("data", (data: Buffer) => {
          output += data.toString();
        });

        child.on("close", () => {
          const files = output
            .trim()
            .split("\n")
            .filter((f) => f.length > 0);
          resolve(files);
        });
      });

      return result;
    } catch {
      return [];
    }
  }
}

// Main execution
async function main() {
  const args = process.argv.slice(2);
  const autoFix = args.includes("--fix") || args.includes("-f");
  const skipGit = args.includes("--skip-git");

  // Git status check
  if (!skipGit) {
    console.log("📋 Checking git status...");

    const branch = await GitIntegration.getCurrentBranch();
    const hasChanges = await GitIntegration.hasUncommittedChanges();
    const changedFiles = await GitIntegration.getChangedFiles();

    console.log(`📌 Current branch: ${branch}`);
    console.log(`📝 Uncommitted changes: ${hasChanges ? "Yes" : "No"}`);

    if (changedFiles.length > 0) {
      console.log(`📁 Changed files: ${changedFiles.length}`);
      if (changedFiles.length <= 5) {
        changedFiles.forEach((file) => console.log(`   • ${file}`));
      } else {
        changedFiles.slice(0, 3).forEach((file) => console.log(`   • ${file}`));
        console.log(`   • ... and ${changedFiles.length - 3} more`);
      }
    }
    console.log();
  }

  // Run checks
  const checker = new PrePushChecker(autoFix);
  const success = await checker.runAllChecks();

  // Exit with appropriate code
  process.exit(success ? 0 : 1);
}

// Show help
function showHelp() {
  console.log(`
🚀 Pre-Push Checks Script

Usage:
  bun run pre-push                 # Run all checks
  bun run pre-push --fix           # Auto-fix what can be fixed
  bun run pre-push --skip-git      # Skip git status check

Checks performed:
  1. TypeScript type checking
  2. ESLint code quality
  3. Prettier code formatting  
  4. Project structure validation
  5. Database schema validation
  6. Unit tests

Auto-fixable checks:
  • ESLint errors (with --fix)
  • Prettier formatting (with --fix)

Examples:
  bun run pre-push                 # Standard check
  bun run pre-push --fix           # Fix and check
  bun run pre-push --help          # Show this help
`);
}

if (process.argv.includes("--help") || process.argv.includes("-h")) {
  showHelp();
  process.exit(0);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}
