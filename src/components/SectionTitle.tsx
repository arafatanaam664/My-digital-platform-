import Link from 'next/link';

export default function SectionTitle({
  children,
  href,
  hrefLabel = 'عرض الكل',
}: {
  children: React.ReactNode;
  href?: string;
  hrefLabel?: string;
}) {
  return (
    <div className="mb-6 flex items-end justify-between gap-3">
      <h2 className="section-title">
        <span className="section-title-bar" aria-hidden />
        {children}
      </h2>
      {href && (
        <Link href={href} className="link-soft shrink-0">
          {hrefLabel} ←
        </Link>
      )}
    </div>
  );
}
