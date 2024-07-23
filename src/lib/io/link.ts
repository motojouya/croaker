import { JSDOM } from "jsdom";
import { FetchAccessFail } from "@/lib/io/linkFail";

export type Ogp = {
  source: string;
  url?: string;
  type?: string;
  title?: string;
  description?: string;
  site_name?: string;
  image?: string;
};

type GetOgp = (dom: JSDOM) => Record<string, string>;
const getOgp: GetOgp = (dom) => {
  const meta = dom.window.document.querySelectorAll("head > meta");
  return Array.from(meta)
    .filter((element) => element.hasAttribute("property"))
    .reduce((acc, ogp) => {
      const properties = ogp.getAttribute("property");
      if (!properties) {
        return acc;
      }

      const prop = properties.trim().replace("og:", "");
      const content = ogp.getAttribute("content");
      if (prop && content) {
        return {
          ...acc,
          [prop]: content,
        };
      }

      return acc;
    }, {});
};

type FetchOgp = (link: string) => Promise<Ogp | FetchAccessFail>;
const fetchOgp: FetchOgp = async (link) => {
  try {
    const res = await fetch(link);
    if (!res) {
      return { source: link };
    }

    const contentType = res.headers.get("Content-Type");
    if (!contentType) {
      return { source: link };
    }

    if (contentType.startsWith("image/")) {
      return {
        source: link,
        url: link,
        type: contentType,
        image: link,
      };
    }

    if (!contentType.startsWith("text/")) {
      return { source: link };
    }

    const html = await res.text();
    if (!html) {
      return { source: link };
    }

    const ogp = getOgp(new JSDOM(html));
    if (!ogp) {
      return { source: link };
    }

    const { url, type, ...rest } = ogp;
    return {
      ...rest,
      type: type || contentType,
      url: url || link,
      source: link,
    };
  } catch (e) {
    return new FetchAccessFail(link, `${link}へのアクセスに失敗しました`);
  }
};

export type Fetcher = {
  fetchOgp: FetchOgp;
};
export type GetFetcher = () => Fetcher;
export const getFetcher: GetFetcher = () => ({ fetchOgp });
