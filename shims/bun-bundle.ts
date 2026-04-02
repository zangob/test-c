// Runtime shim for bun:bundle - most feature flags return false
// (internal/ant-only features won't be available)
// BUDDY is enabled to allow companion functionality
export function feature(name: string): boolean {
  if (name === 'BUDDY') {
    return true;
  }
  return false;
}
