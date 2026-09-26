import { describe, expect, it } from "vitest";
import { mount } from "@vue/test-utils";

import CloudflareLogo from "../src/cloudflare-logo/CloudflareLogo.vue";
import PoweredByCloudflare from "../src/cloudflare-logo/PoweredByCloudflare.vue";
import { generateCloudflareLogoSvg } from "../src/cloudflare-logo/logo.js";

describe("CloudflareLogo", () => {
  it("renders the full logo by default with an accessible name", () => {
    const wrapper = mount(CloudflareLogo);
    expect(wrapper.attributes("role")).toBe("img");
    expect(wrapper.attributes("aria-label")).toBe("Cloudflare logo");
    expect(wrapper.attributes("viewBox")).toBe("0 0 425.6 143.63");
    expect(wrapper.findAll("path")).toHaveLength(12);
    expect(wrapper.classes()).toContain("kv-cloudflare-logo--wordmark");
  });

  it("renders the glyph alone in brand colours", () => {
    const wrapper = mount(CloudflareLogo, { props: { variant: "glyph" } });
    const fills = wrapper.findAll("path").map((p) => p.attributes("fill"));
    expect(wrapper.attributes("viewBox")).toBe("0 0 49 22");
    expect(fills).toEqual(["#F48120", "#FAAD3F"]);
  });

  it("fills with currentColor for the solid colours", () => {
    const wrapper = mount(CloudflareLogo, { props: { color: "white" } });
    expect(wrapper.classes()).toContain("kv-cloudflare-logo--white");
    expect(wrapper.findAll("path").every((p) => p.attributes("fill") === "currentColor")).toBe(true);
  });

  it("lets the accessible name be overridden", () => {
    const wrapper = mount(CloudflareLogo, { attrs: { "aria-label": "Home" } });
    expect(wrapper.attributes("aria-label")).toBe("Home");
  });
});

describe("PoweredByCloudflare", () => {
  it("links to cloudflare.com in a new tab", () => {
    const wrapper = mount(PoweredByCloudflare);
    expect(wrapper.element.tagName).toBe("A");
    expect(wrapper.attributes("href")).toBe("https://www.cloudflare.com");
    expect(wrapper.attributes("target")).toBe("_blank");
    expect(wrapper.attributes("rel")).toBe("noopener noreferrer");
    expect(wrapper.text()).toBe("Powered by Cloudflare");
  });

  it("passes its colour to the glyph", () => {
    const wrapper = mount(PoweredByCloudflare, { props: { color: "black", href: "/x" } });
    expect(wrapper.classes()).toContain("kv-powered-by-cloudflare--black");
    expect(wrapper.attributes("href")).toBe("/x");
    expect(wrapper.find("svg").classes()).toContain("kv-cloudflare-logo--black");
  });
});

describe("generateCloudflareLogoSvg", () => {
  it("uses the brand colours and the grey wordmark by default", () => {
    const svg = generateCloudflareLogoSvg();
    expect(svg).toContain('viewBox="0 0 425.6 143.63"');
    expect(svg).toContain('fill="#F48120"');
    expect(svg).toContain('fill="#404041"');
  });

  it("fills every path with the solid colour", () => {
    const svg = generateCloudflareLogoSvg({ variant: "glyph", color: "black" });
    expect(svg.match(/fill="black"/g)).toHaveLength(2);
  });
});
