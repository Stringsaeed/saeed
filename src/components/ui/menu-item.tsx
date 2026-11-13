"use client";

import {
  createContext,
  useContext,
  useRef,
  useEffect,
  forwardRef,
  type HTMLAttributes,
  type ReactElement,
  type ReactNode,
} from "react";
import type { IconComponent } from "@/lib/icon-context";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { fontWeights } from "@/lib/font-weight";
import { shapeMap } from "@/lib/shape-context";
import { useSize } from "@/lib/size-context";

// MenuItem is only used inside Dropdown, which opts out of the global pill
// shape — see dropdown.tsx for the rationale.
const shape = shapeMap.rounded;

// ---------------------------------------------------------------------------
// Dropdown context — the single shared context for every Dropdown build.
//
// It lives here rather than in the dropdown module so that (a) MenuItem stays
// primitive-free and self-contained, and (b) dropdowns built on different
// primitives (Radix, Base UI) can render side by side — each provides this
// same context object, so MenuItem resolves whichever provider actually
// wraps it. The dropdown module re-exports useDropdown from here, keeping
// its public API unchanged.
// ---------------------------------------------------------------------------

/** What MenuItem hands to the popup's primitive wrapper. `element` is the
 *  styled row div (visuals + proximity registration, no children); `children`
 *  is the row content (icon, label, check). The dropdown wraps them in its
 *  own Item / RadioItem primitive, so MenuItem itself stays primitive-free. */
export interface MenuItemRenderOptions {
  /** Radio-style option (boolean `checked` on MenuItem) vs plain action item. */
  radio: boolean;
  /** The item's index — doubles as the radio value. */
  value: number;
  disabled?: boolean;
  label: string;
  closeOnClick: boolean;
  /** Row element, or a render function that receives the primitive's props.
   *  The function form lets those props (roving tabIndex, keyboard activation)
   *  win over the row's own fallbacks. */
  element:
    | ReactElement
    | ((props: React.ComponentPropsWithRef<"div">) => ReactElement);
  children: ReactNode;
}

export interface DropdownContextValue {
  registerItem: (index: number, element: HTMLElement | null) => void;
  activeIndex: number | null;
  checkedIndex?: number;
  /** True when items render inside a Menu popup (DropdownContent), where the
   *  primitive's Item / RadioItem own roles, roving highlight, typeahead,
   *  and activation. MenuItem switches its rendering accordingly. */
  inMenu?: boolean;
  /** Popup-only: wraps a MenuItem's styled div in the dropdown's menu-item
   *  primitive. Absent in the inline Dropdown panel, where MenuItem renders
   *  its own ARIA menuitem div. */
  renderMenuItem?: (opts: MenuItemRenderOptions) => ReactElement;
}

export const DropdownContext = createContext<DropdownContextValue | null>(null);

export function useDropdown() {
  const ctx = useContext(DropdownContext);
  if (!ctx) throw new Error("useDropdown must be used within a Dropdown");
  return ctx;
}

/** Null-safe context read for callers that render outside a provider. */
export function useDropdownMaybe() {
  return useContext(DropdownContext);
}

interface MenuItemProps extends HTMLAttributes<HTMLDivElement> {
  /** Optional leading icon. When omitted, the row renders text-only with no
   *  reserved icon column. */
  icon?: IconComponent;
  label: string;
  index: number;
  /** When a boolean, the item is a radio-style option (role="menuitemradio"
   *  with aria-checked). When undefined, it is a plain action item
   *  (role="menuitem", no checked state announced). */
  checked?: boolean;
  onSelect?: () => void;
  disabled?: boolean;
  /** Popup-only (inside DropdownContent): whether activating the item closes
   *  the menu. Ignored in the inline Dropdown panel. @default true */
  closeOnClick?: boolean;
}

const MenuItem = forwardRef<HTMLDivElement, MenuItemProps>(
  (
    {
      icon: Icon,
      label,
      index,
      checked,
      onSelect,
      disabled,
      closeOnClick,
      className,
      onClick,
      onKeyDown: onKeyDownProp,
      ...props
    },
    ref
  ) => {
    const internalRef = useRef<HTMLDivElement>(null);
    const hasMounted = useRef(false);
    const { registerItem, activeIndex, checkedIndex, renderMenuItem } =
      useDropdown();

    useEffect(() => {
      registerItem(index, internalRef.current);
      return () => registerItem(index, null);
    }, [index, registerItem]);

    useEffect(() => {
      hasMounted.current = true;
    }, []);

    const isActive = activeIndex === index;
    const skipAnimation = !hasMounted.current;
    const sizeClasses = useSize();

    const mergeRef = (node: HTMLDivElement | null) => {
      (internalRef as React.MutableRefObject<HTMLDivElement | null>).current = node;
      if (typeof ref === "function") ref(node);
      else if (ref) (ref as React.MutableRefObject<HTMLDivElement | null>).current = node;
    };

    const handleActivate = disabled
      ? undefined
      : (e: React.MouseEvent<HTMLDivElement>) => {
          onClick?.(e);
          onSelect?.();
        };

    const itemClassName = cn(
      // Fixed height (was py-2 around a 19.5px line box ≈ 35.5px) so the
      // text-box trim on the label doesn't shrink the row. shrink-0 because
      // menu popups are max-height flex columns — without it a long list
      // compresses rows to fit instead of scrolling.
      `relative z-10 flex ${sizeClasses.control} shrink-0 items-center ${sizeClasses.gap} ${shape.item} ${sizeClasses.itemPx} cursor-pointer outline-none`,
      disabled && "opacity-50 pointer-events-none",
      className
    );

    const content = (
      <>
        {Icon && (
          <span className="inline-grid">
            <span className="col-start-1 row-start-1 invisible">
              <Icon size={sizeClasses.icon} strokeWidth={2} />
            </span>
            <Icon
              size={sizeClasses.icon}
              strokeWidth={isActive || checked ? 2 : 1.5}
              className={cn(
                "col-start-1 row-start-1 transition-[color,stroke-width] duration-80",
                isActive || checked
                  ? "text-foreground"
                  : "text-muted-foreground"
              )}
            />
          </span>
        )}
        {/* Both stacked spans carry the text-box trim so the invisible bold
            sizer and the visible label keep identical boxes. */}
        <span className={cn("inline-grid flex-1", sizeClasses.text)}>
          <span
            className="col-start-1 row-start-1 invisible [text-box:trim-both_cap_alphabetic]"
            style={{ fontVariationSettings: fontWeights.semibold }}
            aria-hidden="true"
          >
            {label}
          </span>
          <span
            className={cn(
              "col-start-1 row-start-1 transition-[color,font-variation-settings] duration-80 [text-box:trim-both_cap_alphabetic]",
              isActive || checked
                ? "text-foreground"
                : "text-muted-foreground"
            )}
            style={{
              fontVariationSettings: checked
                ? fontWeights.semibold
                : fontWeights.normal,
            }}
          >
            {label}
          </span>
        </span>
        <AnimatePresence>
          {checked && (
            <motion.svg
              key="check"
              width={sizeClasses.icon}
              height={sizeClasses.icon}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-foreground shrink-0"
              initial={{ opacity: 1 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 1 }}
            >
              <motion.path
                d="M4 12L9 17L20 6"
                initial={{ pathLength: skipAnimation ? 1 : 0 }}
                animate={{
                  pathLength: 1,
                  transition: { duration: 0.08, ease: "easeOut" },
                }}
                exit={{
                  pathLength: 0,
                  transition: { duration: 0.04, ease: "easeIn" },
                }}
              />
            </motion.svg>
          )}
        </AnimatePresence>
      </>
    );

    // Render function so the menu primitive's props are applied on the DOM
    // node. tabIndex={-1} is only the fallback the linter can see; the
    // primitive's roving tabIndex is spread over it. Enter and Space stay
    // the primitive's job (it clicks the row). Our click handler selects,
    // then calls the primitive's.
    const attachPopupRef = (
      baseProps: React.ComponentPropsWithRef<"div">,
      node: HTMLDivElement | null,
    ) => {
      if (typeof baseProps.ref === "function") baseProps.ref(node);
      else if (baseProps.ref) baseProps.ref.current = node;
      mergeRef(node);
    };

    if (renderMenuItem) {
      const popupClassName = (baseProps: React.ComponentPropsWithRef<"div">) =>
        cn(itemClassName, baseProps.className);
      const onPopupClick =
        (baseProps: React.ComponentPropsWithRef<"div">) =>
        (event: React.MouseEvent<HTMLDivElement>) => {
          handleActivate?.(event);
          baseProps.onClick?.(event);
        };
      const onPopupKeyDown =
        (baseProps: React.ComponentPropsWithRef<"div">) =>
        (event: React.KeyboardEvent<HTMLDivElement>) => {
          onKeyDownProp?.(event);
          baseProps.onKeyDown?.(event);
        };
      return renderMenuItem({
        radio: typeof checked === "boolean",
        value: index,
        disabled,
        label,
        closeOnClick: closeOnClick ?? true,
        element:
          typeof checked === "boolean"
            ? (baseProps) => (
                <div
                  tabIndex={-1}
                  role="menuitemradio"
                  aria-checked={checked}
                  {...props}
                  {...baseProps}
                  ref={(node) => attachPopupRef(baseProps, node)}
                  data-proximity-index={index}
                  aria-disabled={disabled || undefined}
                  aria-label={label}
                  onClick={onPopupClick(baseProps)}
                  onKeyDown={onPopupKeyDown(baseProps)}
                  className={popupClassName(baseProps)}
                >
                  {baseProps.children}
                </div>
              )
            : (baseProps) => (
                <div
                  tabIndex={-1}
                  role="menuitem"
                  {...props}
                  {...baseProps}
                  ref={(node) => attachPopupRef(baseProps, node)}
                  data-proximity-index={index}
                  aria-disabled={disabled || undefined}
                  aria-label={label}
                  onClick={onPopupClick(baseProps)}
                  onKeyDown={onPopupKeyDown(baseProps)}
                  className={popupClassName(baseProps)}
                >
                  {baseProps.children}
                </div>
              ),
        children: content,
      });
    }

    const rowTabIndex = !disabled && index === (checkedIndex ?? 0) ? 0 : -1;
    const onInlineKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
      onKeyDownProp?.(event);
      if (disabled || event.defaultPrevented) return;
      if (event.key === " " || event.key === "Enter") {
        event.preventDefault();
        onSelect?.();
      }
    };
    const inlineProps = {
      ref: mergeRef,
      "data-proximity-index": index,
      "aria-disabled": disabled || undefined,
      "aria-label": label,
      onClick: handleActivate,
      onKeyDown: onInlineKeyDown,
      className: itemClassName,
      ...props,
    };

    if (typeof checked === "boolean") {
      return (
        <div
          {...inlineProps}
          tabIndex={rowTabIndex}
          role="menuitemradio"
          aria-checked={checked}
        >
          {content}
        </div>
      );
    }

    return (
      <div {...inlineProps} tabIndex={rowTabIndex} role="menuitem">
        {content}
      </div>
    );
  }
);

MenuItem.displayName = "MenuItem";

export { MenuItem };
export default MenuItem;
