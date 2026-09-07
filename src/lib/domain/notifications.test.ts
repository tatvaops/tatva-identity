import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { notificationPrefForKind, shouldDeliverNotification } from "./notifications";

describe("notification preferences", () => {
  it("maps connection and follow events to the connections toggle", () => {
    assert.equal(notificationPrefForKind("connection"), "notifyConnections");
    assert.equal(notificationPrefForKind("follow"), "notifyConnections");
  });

  it("maps vendor enquiries to the messages toggle", () => {
    assert.equal(notificationPrefForKind("enquiry"), "notifyMessages");
    assert.equal(notificationPrefForKind("message"), "notifyMessages");
  });

  it("does not drop system events when a toggle is off", () => {
    assert.equal(shouldDeliverNotification("system", { notifySocial: false }), true);
  });

  it("suppresses social events when that preference is off", () => {
    assert.equal(
      shouldDeliverNotification("recommendation", { notifySocial: false }),
      false,
    );
    assert.equal(
      shouldDeliverNotification("recommendation", { notifySocial: true }),
      true,
    );
  });
});
