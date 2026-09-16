import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import Link from 'next/link';

const components = {
  a: ({ href, children, ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement>) => {
    const internal = typeof href === 'string' && (href.startsWith('/') || href.startsWith('#'));
    if (internal) {
      return (
        <Link href={href} className="font-semibold text-indigo-600 underline decoration-indigo-300 underline-offset-4 hover:text-indigo-800">
          {children}
        </Link>
      );
    }
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className="font-semibold text-indigo-600 underline decoration-indigo-300 underline-offset-4 hover:text-indigo-800" {...props}>
        {children}
      </a>
    );
  },
  // Google image best practices: intrinsic width/height (prevents CLS),
  // lazy loading + async decode, rounded presentation.
  img: ({ src, alt, node: _node, ...props }: React.ImgHTMLAttributes<HTMLImageElement> & { node?: unknown }) => {
    const m = typeof src === 'string' ? src.match(/(\d{2,5})x(\d{2,5})\.(?:webp|avif|jpe?g|png)/i) : null;
    const w = m ? parseInt(m[1], 10) : undefined;
    const h = m ? parseInt(m[2], 10) : undefined;
    return (
      <img
        src={src}
        alt={alt || ''}
        loading="lazy"
        decoding="async"
        width={w}
        height={h}
        className="my-6 w-full min-w-0 rounded-xl border border-slate-200 shadow-sm"
        style={w && h ? { aspectRatio: `${w} / ${h}`, height: 'auto' } : undefined}
        {...props}
      />
    );
  },
};

export default function Markdown({ children }: { children: string }) {
  return (
    <div dir="rtl" className="prose prose-slate max-w-none prose-headings:font-extrabold prose-a:no-underline prose-pre:bg-slate-900 prose-pre:text-slate-100">
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={components as never}>
        {children || '—'}
      </ReactMarkdown>
    </div>
  );
}
