import { useCMSAssets } from "@/hooks/useCMSAssets";

interface Props {
  /** CMS page namespace, e.g. "whats-on" or "town/food/bnb". */
  page: string;
  /** Vertical focal point (object-position Y), e.g. "0%", "center", "30%". */
  focalY?: string;
  /** Overlay tint over the image. Defaults to a 55% black for legibility. */
  overlayClassName?: string;
  /** Only use bundled defaults; skip CMS lookup. */
  defaultsOnly?: boolean;
}

/**
 * Full-bleed hero background image for dark Crazy Bear hero sections.
 * Reads the single published hero image from cms_images, falling back to
 * the bundled default registered in cmsImageRegistry. Renders nothing when
 * no image is available.
 *
 * Parent section must be `relative` and ideally `overflow-hidden`. Place
 * actual hero content (nav, copy) inside a sibling with `relative z-10`.
 */
const CBHeroBackdrop = ({
  page,
  focalY = "center",
  overlayClassName = "bg-black/55",
  defaultsOnly = false,
}: Props) => {
  const { assets } = useCMSAssets(page, "hero");
  const asset = !defaultsOnly ? assets[0] : undefined;
  if (!asset?.src) return null;

  return (
    <>
      <img
        src={asset.src}
        alt={asset.alt ?? ""}
        aria-hidden={!asset.alt}
        className="absolute inset-0 h-full w-full object-cover"
        style={{ objectPosition: `center ${focalY}` }}
        loading="eager"
        decoding="async"
      />
      <div className={`absolute inset-0 ${overlayClassName}`} aria-hidden />
    </>
  );
};

export default CBHeroBackdrop;
