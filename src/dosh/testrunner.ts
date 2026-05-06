class TestRunner {
  private passed = 0;
  private failed = 0;

  test(name: string, fn: () => void): void {
    try {
      fn();
      console.log(`\x1b[32m✓\x1b[0m ${name}`);
      this.passed++;
    } catch (error) {
      console.error(`\x1b[31m✗\x1b[0m ${name}`);
      console.error(`  ${error}`);
      this.failed++;
    }
  }

  assert(condition: boolean, message: string): void {
    if (!condition) {
      throw new Error(message);
    }
  }

  assertEqual(actual: any, expected: any, message?: string): void {
    if (actual !== expected) {
      throw new Error(`${message || ""} Expected ${expected}, got ${actual}`);
    }
  }

  report(): void {
    console.log(`\n${this.passed} passed, ${this.failed} failed`);
    process.exit(this.failed > 0 ? 1 : 0);
  }
}

export { TestRunner };
