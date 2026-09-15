import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/db';
import ContentPage, { contentMetadata } from '@/components/ContentPage';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const item = await prisma.contentItem.findUnique({
    where: { slug: params.slug },
    include: { section: true, subsection: true },
  });
  if (!item) return {};
  return contentMetadata(item);
}

export default async function ArticlePage({ params }: { params: { slug: string } }) {
  const item = await prisma.contentItem.findUnique({
    where: { slug: params.slug },
    include: { section: true, subsection: true },
  });
  if (!item || item.type !== 'article') notFound();
  return <ContentPage item={item} path={`/articles/${params.slug}`} />;
}
