import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { isBootstrapAdmin, isPlatformAdminOpenToSignedIn, isPlatformOperator } from "./bootstrap";

describe("isPlatformAdminOpenToSignedIn", () => {
  it("stays closed in production until operators are listed or explicitly opened", () => {
    assert.equal(isPlatformAdminOpenToSignedIn({ NODE_ENV: "production" }), false);
  });

  it("defaults to open outside production so local development still works", () => {
    assert.equal(isPlatformAdminOpenToSignedIn({ NODE_ENV: "test" }), true);
  });

  it("can be locked with PLATFORM_ADMIN_OPEN=false", () => {
    assert.equal(isPlatformAdminOpenToSignedIn({ NODE_ENV: "test", PLATFORM_ADMIN_OPEN: "false" }), false);
  });

  it("can be opened explicitly in production", () => {
    assert.equal(isPlatformAdminOpenToSignedIn({ NODE_ENV: "production", PLATFORM_ADMIN_OPEN: "true" }), true);
  });
});

describe("isPlatformOperator", () => {
  it("treats a listed handle as an operator even when the temporary gate is off", () => {
    const previousOpen = process.env.PLATFORM_ADMIN_OPEN;
    const previousHandles = process.env.PLATFORM_ADMIN_HANDLES;
    process.env.PLATFORM_ADMIN_OPEN = "false";
    process.env.PLATFORM_ADMIN_HANDLES = "devtester";
    try {
      assert.equal(isBootstrapAdmin({ userId: "u1", handle: "DevTester" }), true);
      assert.equal(isPlatformOperator({ userId: "u1", handle: "DevTester" }), true);
      assert.equal(isPlatformOperator({ userId: "u2", handle: "someone-else" }), false);
    } finally {
      if (previousOpen === undefined) delete process.env.PLATFORM_ADMIN_OPEN;
      else process.env.PLATFORM_ADMIN_OPEN = previousOpen;
      if (previousHandles === undefined) delete process.env.PLATFORM_ADMIN_HANDLES;
      else process.env.PLATFORM_ADMIN_HANDLES = previousHandles;
    }
  });
});
