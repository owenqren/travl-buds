import { afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';

// @testing-library/react normally wires this up itself by detecting a global
// afterEach, but test.globals is off (so eslint doesn't need to know about
// vitest's globals), so it never sees one. Without this, each render() leaks
// its DOM into the next test.
afterEach(() => {
    cleanup();
});
