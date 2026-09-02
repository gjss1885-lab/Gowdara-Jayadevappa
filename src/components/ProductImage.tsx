import { Crown, Flower2, Gem, Leaf, Sparkles, Wind } from "lucide-react";
import clsx from "clsx";

type IconComponent = React.ComponentType<{ className?: string; strokeWidth?: number }>;

const CATEGORY_STYLE: Record<string, { gradient: string; icon: IconComponent }> = {
  "kanjivaram-silk": {
    gradient: "from-maroon via-maroon-light to-gold",
    icon: Gem,
  },
  "banarasi-silk": {
    gradient: "from-maroon-dark via-maroon to-gold-light",
    icon: Sparkles,
  },
  "mysore-silk": {
    gradient: "from-gold via-gold-light to-cream-dark",
    icon: Flower2,
  },
  "cotton-sarees": {
    gradient: "from-cream-dark via-gold-light to-gold",
    icon: Leaf,
  },
  "chiffon-georgette": {
    gradient: "from-maroon-light via-gold-light to-cream",
    icon: Wind,
  },
  "bridal-collection": {
    gradient: "from-maroon-dark via-maroon to-maroon-light",
    icon: Crown,
  },
};

export function ProductImage({
  category,
  name,
  imageUrl,
  className,
  iconClassName,
  hideLabel,
  zoomOnHover,
}: {
  category: string;
  name: string;
  // A real uploaded photo, if one exists (see admin ProductForm). Falls
  // back to a styled gradient placeholder when there isn't one.
  imageUrl?: string | null;
  className?: string;
  iconClassName?: string;
  hideLabel?: boolean;
  // Scales the photo up slightly on hover and eases back on mouse-out.
  // Opt-in (rather than always-on) because it only reads as intentional in
  // a browsing grid (shop, home, related products) -- it would just be
  // distracting on a small cart-line or dropdown thumbnail. Relies on the
  // nearest ancestor having Tailwind's `group` class.
  zoomOnHover?: boolean;
}) {
  const style = CATEGORY_STYLE[category] ?? {
    gradient: "from-maroon via-maroon-light to-gold",
    icon: Sparkles,
  };
  const Icon = style.icon;

  return (
    <div
      className={clsx(
        "relative flex aspect-[3/4] w-full items-center justify-center overflow-hidden rounded-md bg-gradient-to-br",
        style.gradient,
        className
      )}
      role="img"
      aria-label={name}
    >
      {imageUrl ? (
        // Uploaded product photos can come from Supabase Storage or, in
        // local demo mode, /public/uploads -- either way it's a plain URL,
        // so next/image's remote-domain allowlisting isn't worth the extra
        // config for a small shop's admin-uploaded photos.
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={imageUrl}
          alt={name}
          className={clsx(
            "absolute inset-0 h-full w-full object-cover",
            zoomOnHover && "transition-transform duration-300 ease-out group-hover:scale-110"
          )}
        />
      ) : (
        <div
          className={clsx(
            "absolute inset-0 flex items-center justify-center",
            zoomOnHover && "transition-transform duration-300 ease-out group-hover:scale-110"
          )}
        >
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.25),transparent_55%)]" />
          <Icon className={clsx("relative h-10 w-10 text-white/90 drop-shadow", iconClassName)} strokeWidth={1.5} />
        </div>
      )}
      {!hideLabel && (
        <div className="absolute inset-x-3 bottom-3 rounded bg-black/25 px-2 py-1 text-center text-[12px] font-medium leading-tight text-white backdrop-blur-sm">
          {name}
        </div>
      )}
    </div>
  );
}
