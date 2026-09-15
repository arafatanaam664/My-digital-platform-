// Row shapes for the data layer (mirrors Prisma model names).

export interface User {
  id: number;
  email: string;
  name: string;
  passwordHash: string;
  role: string;
  isActive: boolean;
  lastLoginAt: Date | null;
  createdAt: Date;
}

export interface Section {
  id: number;
  slug: string;
  name: string;
  description: string | null;
  icon: string;
  order: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  subsections?: Subsection[];
  items?: ContentItem[];
}

export interface Subsection {
  id: number;
  slug: string;
  sectionId: number;
  name: string;
  description: string | null;
  type: string;
  order: number;
  isActive: boolean;
  createdAt: Date;
  section?: Section;
  items?: ContentItem[];
}

export interface ContentItem {
  id: number;
  slug: string;
  type: string;
  title: string;
  excerpt: string | null;
  body: string;
  toolKey: string | null;
  sectionId: number;
  subsectionId: number;
  metaTitle: string | null;
  metaDescription: string | null;
  featuredImage: string | null;
  tags: string | null;
  status: string;
  publishedAt: Date | null;
  views: number;
  order: number;
  createdAt: Date;
  updatedAt: Date;
  section?: Section;
  subsection?: Subsection;
}

export interface PageView {
  id: number;
  contentId: number | null;
  path: string;
  sectionId: number | null;
  type: string;
  referrer: string | null;
  userAgent: string | null;
  device: string | null;
  browser: string | null;
  sessionId: string | null;
  createdAt: Date;
}

export interface Setting {
  key: string;
  value: string | null;
}
