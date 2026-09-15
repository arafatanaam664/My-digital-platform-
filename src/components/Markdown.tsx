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
