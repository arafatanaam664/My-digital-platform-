import Link from 'next/link';
import SearchForm from '@/components/SearchForm';

export default function NotFound() {
  return (
    <div className="mx-auto flex max-w-2xl flex-col items-center px-4 py-24 text-center">
      <div className="text-6xl"></div>
      <h1 className="mt-6 text-2xl font-extrabold text-slate-900">الصفحة غير موجودة</h1>
      <p className="mt-3 text-sm leading-7 text-slate-500">
        ربما تم نقل الصفحة أو حذفها. جرّب البحث عن ما تحتاجه أو تصفح الأقسام من الرئيسية.
      </p>
      <SearchForm className="mt-6 w-full max-w-md" placeholder="ابحث في المنصة..." />
      <Link href="/" className="mt-5 rounded-xl bg-indigo-600 px-6 py-2.5 text-sm font-bold text-white hover:bg-indigo-700">
        العودة إلى الرئيسية
      </Link>
    </div>
  );
}
