import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { publicMediaUrl, remapBrokenMediaUrl } from "./public-url";

describe("remapBrokenMediaUrl", () => {
  it("replaces retired Unsplash covers with working photos", () => {
    assert.equal(
      remapBrokenMediaUrl(
        "https://images.unsplash.com/photo-1615971677499-5467cb89d40f?auto=format&fit=crop&w=1400&q=80",
      ),
      "https://images.unsplash.com/photo-1615873968403-89e068629265?auto=format&fit=crop&w=1400&q=80",
    );
    assert.equal(
      remapBrokenMediaUrl(
        "https://images.unsplash.com/photo-1504307651254-35680f356988?auto=format&fit=crop&w=900&q=80",
      ),
      "https://images.unsplash.com/photo-1541888946425-d81bb19240f5?auto=format&fit=crop&w=1400&q=80",
    );
  });

  it("leaves working URLs unchanged", () => {
    const url = "https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=1400&q=80";
    assert.equal(remapBrokenMediaUrl(url), url);
  });
});

describe("publicMediaUrl", () => {
  it("returns null for empty paths", () => {
    assert.equal(publicMediaUrl(null), null);
    assert.equal(publicMediaUrl("   "), null);
  });

  it("passes through and remaps http covers", () => {
    assert.equal(
      publicMediaUrl("https://images.unsplash.com/photo-1615971677499-5467cb89d40f?auto=format&fit=crop&w=1400&q=80"),
      "https://images.unsplash.com/photo-1615873968403-89e068629265?auto=format&fit=crop&w=1400&q=80",
    );
  });
});
