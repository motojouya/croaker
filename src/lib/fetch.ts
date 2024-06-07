import { JSDOM } from 'jsdom';

export const URL_REG_EXP = new RegExp('^https:\/\/\S+$');

export type GetLinks = (lines: string[]) => string[];
export const getLinks = (lines) => lines.filter(line => URL_REG_EXP.test(line));

type LinkInformation = {
  url?: string,
  title?: string,
  image?: string,
  summary?: string,
};

const getOgp = (dom: JSDOM) => {
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

export type CreateLinks = (links: string[]) => Promise<LinkInformation[]>;
export const createLinks = async (links) => {

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
        resolve({ image: link });
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
        source: link,
      });

    } catch(e) {
      resolve(null);
    }
  }));

  const results = await Promise.allSettled(requests);
  return results.filter(result => !!result).map(({ title, image, description, source }) => ({
    title,
    image,
    summary: description,
    url: source,
  }));
};
