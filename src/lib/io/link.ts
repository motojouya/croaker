import { JSDOM } from 'jsdom';

export type Ogp = {
  url?: string,
  title?: string,
  image?: string,
  summary?: string,
  type?: string;
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

type FetchOgp = (links: string[]) => Promise<Ogp[]>;
const fetchOgp: FetchOgp = async (links) => {

  const requests = links.map(link => new Promise(async (resolve) => {
    try {
      const res = fetch(link);
      if (!res) {
        resolve(null);
      }

      const contentType = res.headers.get('Content-Type');
      if (!contentType) {
        resolve(null);
      }

      if (contentType.startWith('image/')) {
        resolve({ image: link, source: link, type: contentType });
      }

      if (!contentType.startWith('text/')) {
        resolve(null);
      }

      const dom = new JSDOM(res.data);
      if (!dom) {
        resolve(null);
      }

      const ogp = getOgp(dom);
      if (!ogp) {
        resolve(null);
      }

      resolve({
        ...ogp,
        type: contentType,
        source: link,
      });

    } catch(e) {
      resolve(null);
    }
  }));

  const results = await Promise.allSettled(requests);
  return results.filter(result => !!result).map(({ title, image, description, type, source }) => ({
    title,
    image,
    type,
    summary: description,
    url: source,
  }));
};

export type Fetcher = {
  fetchOgp: FetchOgp;
};
export type GetFetcher = () => Fetcher;
export const getFetcher: GetFetcher = () => ({ fetchOgp });
