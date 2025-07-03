import { beforeEach, expect } from "vitest";
import * as matchers from "@testing-library/jest-dom/matchers";

// Extend vitest's expect with jest-dom matchers
expect.extend(matchers);

beforeEach(() => {
  // Clear the DOM before each test
  document.head.innerHTML = "";
  document.body.innerHTML = "";
});
