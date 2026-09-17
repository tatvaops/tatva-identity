import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { CAREERS_PATH, careerJobPath } from "./career-routes";

describe("career routes", () => {
  it("creates stable shareable job links", () => {
    assert.equal(CAREERS_PATH, "/careers");
    assert.equal(careerJobPath("job-123"), "/careers/job-123");
  });
});
