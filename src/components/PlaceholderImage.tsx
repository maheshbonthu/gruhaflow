import Image from "next/image";
import { getPlaceholder } from "@/data/placeholders";

/**
 * Renders a registered placeholder photo and, in development only, stamps a
 * small "placeholder" tag on it. The tag is compiled out of production builds,
 * so these never ship looking like deliberate photography — but they also never
 * clutter a client preview.
 */
export default function PlaceholderImage({
  id,
  fill = true,
  width,
  height,
  sizes = "100vw",
  priority = false,
  className,
}: {
  id: string;
  fill?: boolean;
  width?: number;
  height?: number;
  sizes?: string;
  priority?: boolean;
  className?: string;
}) {
  const p = getPlaceholder(id);

  if (!p) {
    // An unregistered id is a mistake worth seeing rather than silently hiding.
    return (
      <div
        className={["grid place-items-center bg-ink-100 text-xs text-ink-500", className].join(" ")}
        role="img"
        aria-label={`Missing image: ${id}`}
      >
        Unregistered image “{id}”
      </div>
    );
  }

  const isDev = process.env.NODE_ENV === "development";

  return (
    <span className={["relative block overflow-hidden", className].join(" ")}>
      <Image
        src={p.src}
        alt={p.alt}
        {...(fill ? { fill: true } : { width: width ?? 1200, height: height ?? 800 })}
        sizes={sizes}
        priority={priority}
        className="h-full w-full object-cover"
      />
      {isDev && !p.replaced && (
        <span
          className="pointer-events-none absolute bottom-1 left-1 rounded bg-ink-950/80 px-1.5 py-0.5 text-[10px] font-medium text-white"
          title={`${p.source} · ${p.photographer} · ${p.sourceUrl}`}
        >
          placeholder
        </span>
      )}
    </span>
  );
}
