import { JSDOM } from 'jsdom';

export type Ogp = {
  source: string,
  url?: string,
  type?: string;
  title?: string,
  description?: string,
  site_name?: string,
  image?: string,
};

type GetOgp = (dom: JSDOM) => Record<string, string>;
const getOgp: GetOgp = (dom) => {
  const meta = dom.window.document.querySelectorAll("head > meta");
  return Array.from(meta)
    .filter((element) => element.hasAttribute("property"))
    .reduce((acc, ogp) => {
      const prop = ogp.getAttribute("property").trim().replace("og:", "");
      const content = ogp.getAttribute("content");
      if (prop && content) {
        return {
          ...acc,
          [prop]: content
        };
      } else {
        return acc;
      }
    }, {});
}

type FetchOgp = (link: string) => Promise<Ogp>;
const fetchOgp: FetchOgp = async (link) => {

  try {
    const res = fetch(link);
    if (!res) {
      return { source: link };
    }

    const contentType = res.headers.get('Content-Type');
    if (!contentType) {
      return { source: link };
    }

    if (contentType.startWith('image/')) {
      return {
        source: link,
        url: link,
        type: contentType,
        image: link,
      };
    }

    if (!contentType.startWith('text/')) {
      return { source: link };
    }

    const dom = new JSDOM(res.data);
    if (!dom) {
      return { source: link };
    }

    const ogp = getOgp(dom);
    if (!ogp) {
      return { source: link };
    }

    const { url, type, ...rest } = ogp;
    return {
      ...rest,
      type: type || contentType,
      url: url || link,
      summary: description,
      source: link,
    };

  } catch(e) {
    return { source: link };
  }
};

export type Fetcher = {
  fetchOgp: FetchOgp;
};
export type GetFetcher = () => Fetcher;
export const getFetcher: GetFetcher = () => ({ fetchOgp });
