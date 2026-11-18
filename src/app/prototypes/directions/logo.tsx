// A small square image: an app's icon, a company's mark, a book's cover.
export function Logo({
  src,
  size,
  className,
}: {
  src: string;
  size: number;
  className?: string;
}) {
  return (
    // biome-ignore lint/performance/noImgElement: prototype thumbnails a few pixels wide; next/image would add a request per icon for nothing.
    <img
      className={className}
      src={src}
      alt=""
      width={size}
      height={size}
      loading="lazy"
      decoding="async"
    />
  );
}
