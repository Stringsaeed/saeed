/**
 * Points the tab's SVG favicon at `href`. Next emits the static icon links
 * (ICO, SVG, apple-touch) from the files in `src/app`; this only retargets
 * the SVG one, so browsers that ignore SVG favicons keep the ICO and
 * apple-touch icons exactly as before. Setting the same href twice is a
 * no-op, so callers can run it on every render they like.
 */
export function setFavicon(href: string) {
  let link = document.querySelector<HTMLLinkElement>(
    'link[rel="icon"][type="image/svg+xml"]',
  );
  if (!link) {
    link = document.createElement("link");
    link.rel = "icon";
    link.type = "image/svg+xml";
    link.sizes.add("any");
    document.head.append(link);
  }
  if (link.getAttribute("href") !== href) link.href = href;
}
