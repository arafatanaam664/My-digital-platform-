/** يُدرج كائن بيانات منظمة (Schema.org) داخل وسم script ld+json — SEO */
export function JsonLd({ data }: { data: Record<string, unknown> }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
