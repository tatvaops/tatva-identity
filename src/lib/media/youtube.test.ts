import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { youtubeEmbedUrl, youtubeVideoId } from "./youtube";

describe("youtubeVideoId", () => {
  it("accepts watch, short and embed URLs", () => {
    assert.equal(youtubeVideoId("https://www.youtube.com/watch?v=dQw4w9WgXcQ"), "dQw4w9WgXcQ");
    assert.equal(youtubeVideoId("https://youtu.be/dQw4w9WgXcQ"), "dQw4w9WgXcQ");
    assert.equal(youtubeVideoId("https://www.youtube.com/embed/dQw4w9WgXcQ"), "dQw4w9WgXcQ");
    assert.equal(youtubeVideoId("https://www.youtube.com/shorts/dQw4w9WgXcQ"), "dQw4w9WgXcQ");
  });

  it("rejects non-YouTube hosts", () => {
    assert.equal(youtubeVideoId("https://example.com/watch?v=dQw4w9WgXcQ"), null);
    assert.equal(youtubeVideoId("javascript:alert(1)"), null);
  });
});

describe("youtubeEmbedUrl", () => {
  it("uses the privacy-enhanced embed host", () => {
    assert.equal(
      youtubeEmbedUrl("https://youtu.be/dQw4w9WgXcQ"),
      "https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ",
    );
  });
});
