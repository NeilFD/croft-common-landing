import { Link, useLocation } from "react-router-dom";

const labelFor = (seg: string) =>
  seg
    .replace(/-/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());

const CBBreadcrumb = () => {
  const { pathname } = useLocation();
  const segments = pathname.split("/").filter(Boolean);
  if (segments.length < 2) return null;

  const crumbs = segments.map((seg, i) => ({
    label: labelFor(seg),
    href: "/" + segments.slice(0, i + 1).join("/"),
  }));

  return (
    <nav
      aria-label="Breadcrumb"
      className="mx-auto max-w-3xl px-6 pt-6 text-foreground"
    >
      <ol className="flex flex-wrap items-center gap-2 font-cb-sans text-[11px] tracking-[0.2em] uppercase opacity-70">
        <li>
          <Link to="/" className="hover:opacity-100 hover:underline">Home</Link>
        </li>
        {crumbs.map((c, i) => (
          <li key={c.href} className="flex items-center gap-2">
            <span aria-hidden="true">/</span>
            {i === crumbs.length - 1 ? (
              <span className="opacity-100">{c.label}</span>
            ) : (
              <Link to={c.href} className="hover:opacity-100 hover:underline">
                {c.label}
              </Link>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
};

export default CBBreadcrumb;
