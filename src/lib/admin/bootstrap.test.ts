import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { isBootstrapAdmin, isPlatformAdminOpenToSignedIn, isPlatformOperator } from "./bootstrap";

describe("isPlatformAdminOpenToSignedIn", () => {
  it("stays closed in production until operators are listed or explicitly opened", () => {
    const previousOpen = process.env.PLATFORM_ADMIN_OPEN;
    const previousEnv = process.env.NODE_ENV;
    delete process.env.PLATFORM_ADMIN_OPEN;
    process.env.NODE_ENV = "production";
    try {
      assert.equal(isPlatformAdminOpenToSignedIn(), false);
    } finally {
      if (previousOpen === undefined) delete process.env.PLATFORM_ADMIN_OPEN;
      else process.env.PLATFORM_ADMIN_OPEN = previousOpen;
      process.env.NODE_ENV = previousEnv;
    }
  });

  it("defaults to open outside production so local development still works", () => {
    const previousOpen = process.env.PLATFORM_ADMIN_OPEN;
    const previousEnv = process.env.NODE_ENV;
    delete process.env.PLATFORM_ADMIN_OPEN;
    process.env.NODE_ENV = "test";
    try {
      assert.equal(isPlatformAdminOpenToSignedIn(), true);
    } finally {
      if (previousOpen === undefined) delete process.env.PLATFORM_ADMIN_OPEN;
      else process.env.PLATFORM_ADMIN_OPEN = previousOpen;
      process.env.NODE_ENV = previousEnv;
    }
  });

  it("can be locked with PLATFORM_ADMIN_OPEN=false", () => {
    const previous = process.env.PLATFORM_ADMIN_OPEN;
    process.env.PLATFORM_ADMIN_OPEN = "false";
    try {
      assert.equal(isPlatformAdminOpenToSignedIn(), false);
    } finally {
      if (previous === undefined) delete process.env.PLATFORM_ADMIN_OPEN;
      else process.env.PLATFORM_ADMIN_OPEN = previous;
    }
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
