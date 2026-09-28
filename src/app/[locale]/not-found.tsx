import Link from "next/link";

export default function NotFound() {
  return (
    <div className="container section text-center">
      <p className="eyebrow">404</p>
      <h1 className="display text-3xl mt-3">页面不存在 · Page not found</h1>
      <p className="mt-6"><Link href="/" className="text-leo underline">LeoMath</Link></p>
    </div>
  );
}
