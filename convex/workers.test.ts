import { convexTest } from "convex-test";
import { describe, expect, it, vi } from "vitest";
import { api } from "./_generated/api";
import schema from "./schema";
import { startWorkerMachine } from "./workers";

describe("startWorkerMachine", () => {
  it("works", async () => {
    // fetchMocker.mockIf(`https://mikecann.co.uk/rss.xml`, mikeCannRss2);
    //
    // const convex = convexTest(schema);
    //
    // const resp = await convex.action(api.feeds.findFeedToSubscribeTo, {
    //   url: `https://mikecann.co.uk/rss.xml`,
    // });
    //
    // expect(resp.items.length).toBe(10);
    // expect(resp.totalItems).toBe(602);
    // expect(resp.items[0]).toStrictEqual({
    //   description: "...",
    //   link: "https://mikecann.co.uk/posts/10-years-in-oz",
    //   ogImage: "https://mikecann.co.uk/posts/10-years-in-oz/header.jpg",
    //   title: "10 Years in Oz",
    // });
  });
});
