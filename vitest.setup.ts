import { expect } from "vitest";
import * as matchers from "@testing-library/jest-dom/matchers";

// añade los matchers de jest-dom al expect de Vitest
expect.extend(matchers);
