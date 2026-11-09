import { RiArrowRightSLine } from "@remixicon/react";
import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/utils";

// Grouped lists, the way both platforms set their settings screens: iOS as
// inset grouped cells with hairlines, Android as a tonal container with
// taller rows. The markup is the same; os.css does the dressing.

export function ListGroup({
  title,
  footer,
  children,
  className,
}: {
  title?: ReactNode;
  footer?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("os-group", className)}>
      {title ? <h2 className="os-group-title">{title}</h2> : null}
      <ul className="os-list">{children}</ul>
      {footer ? <p className="os-group-footer">{footer}</p> : null}
    </section>
  );
}

type RowContentProps = {
  leading?: ReactNode;
  title: ReactNode;
  subtitle?: ReactNode;
  clampSubtitle?: boolean;
  trailing?: ReactNode;
  /** Show a disclosure chevron (iOS only; Android hides it). */
  chevron?: boolean;
};

function RowContent({
  leading,
  title,
  subtitle,
  clampSubtitle,
  trailing,
  chevron,
}: RowContentProps) {
  return (
    <>
      {leading ? <span className="os-row-leading">{leading}</span> : null}
      <span className="os-row-main">
        <span className="os-row-title">{title}</span>
        {subtitle ? (
          <span className="os-row-sub" data-clamp={clampSubtitle || undefined}>
            {subtitle}
          </span>
        ) : null}
      </span>
      {trailing || chevron ? (
        <span className="os-row-trailing">
          {trailing}
          {chevron ? (
            <RiArrowRightSLine className="os-chevron" aria-hidden="true" />
          ) : null}
        </span>
      ) : null}
    </>
  );
}

type LinkRowProps = RowContentProps &
  Omit<ComponentProps<typeof Link>, "title"> & {
    external?: boolean;
  };

export function ListRow({
  leading,
  title,
  subtitle,
  clampSubtitle,
  trailing,
  chevron,
  external,
  className,
  ...props
}: LinkRowProps) {
  const content = (
    <RowContent
      leading={leading}
      title={title}
      subtitle={subtitle}
      clampSubtitle={clampSubtitle}
      trailing={trailing}
      chevron={chevron}
    />
  );
  const rowClass = cn("os-row", className);
  if (external) {
    return (
      <li>
        <a
          {...(props as ComponentProps<"a">)}
          href={String(props.href)}
          className={rowClass}
          data-leading={leading ? "" : undefined}
          target="_blank"
          rel="noopener noreferrer"
        >
          {content}
        </a>
      </li>
    );
  }
  return (
    <li>
      <Link
        {...props}
        className={rowClass}
        data-leading={leading ? "" : undefined}
      >
        {content}
      </Link>
    </li>
  );
}

export function StaticRow({
  className,
  ...props
}: RowContentProps & {
  className?: string;
}) {
  return (
    <li>
      <div
        className={cn("os-row", className)}
        data-leading={props.leading ? "" : undefined}
      >
        <RowContent {...props} />
      </div>
    </li>
  );
}

export function ButtonRow({
  className,
  onClick,
  ...props
}: RowContentProps & {
  className?: string;
  onClick: () => void;
}) {
  return (
    <li>
      <button
        type="button"
        className={cn("os-row", className)}
        data-leading={props.leading ? "" : undefined}
        onClick={onClick}
      >
        <RowContent {...props} />
      </button>
    </li>
  );
}
