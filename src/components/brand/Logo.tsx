import Image from "next/image";
import Link from "next/link";

/**
 * The Urban Firm logo.
 *
 * The SVGs in /public/brand are the supplied originals and are rendered
 * untouched — never recoloured, stretched or filtered, per the brand rules.
 * Clear space is enforced here as padding equal to the height of the green
 * block (1/7 of the mark's height), so callers cannot crowd it by accident.
 */

export type LogoVariant = "default" | "on-dark" | "mono";

const SOURCES: Record<LogoVariant, string> = {
  default: "/brand/the-urban-firm-logo.svg",
  "on-dark": "/brand/the-urban-firm-logo-on-dark.svg",
  mono: "/brand/the-urban-firm-logo-mono-black.svg",
};

/** Lockup aspect ratio is 296x64 from the source artwork. */
const RATIO = 296 / 64;

export function Logo({
  variant = "default",
  height = 32,
  className,
  priority = false,
}: {
  variant?: LogoVariant;
  height?: number;
  className?: string;
  priority?: boolean;
}) {
  return (
    <Image
      src={SOURCES[variant]}
      alt="The Urban Firm"
      width={Math.round(height * RATIO)}
      height={height}
      priority={priority}
      className={className}
      style={{ height, width: "auto" }}
    />
  );
}

/** Square mark on its own — app icon, avatar, tight spaces. */
export function LogoMark({
  green = false,
  size = 32,
  className,
}: {
  green?: boolean;
  size?: number;
  className?: string;
}) {
  return (
    <Image
      src={green ? "/brand/the-urban-firm-icon-green.svg" : "/brand/the-urban-firm-icon.svg"}
      alt="The Urban Firm"
      width={size}
      height={size}
      className={className}
    />
  );
}

/**
 * The logo as a link home, with the required clear space already applied.
 * This is what headers and footers should use.
 */
export function LogoLink({
  variant = "default",
  height = 32,
  priority = false,
}: {
  variant?: LogoVariant;
  height?: number;
  priority?: boolean;
}) {
  // Clear space = height of the green block = 9/64 of the mark height.
  const clear = Math.round((height * 9) / 64);
  return (
    <Link
      href="/"
      aria-label="The Urban Firm — home"
      className="inline-flex shrink-0 items-center"
      style={{ padding: clear }}
    >
      <Logo variant={variant} height={height} priority={priority} />
    </Link>
  );
}
