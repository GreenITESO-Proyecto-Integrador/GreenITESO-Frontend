import { BrandLogo } from '@/components/custom/BrandLogo';

const SIZES = [
  { label: 'Navbar', className: 'h-9' },
  { label: 'Login', className: 'h-16' },
  { label: 'Home', className: 'h-28' },
];

export function LogoShowcase() {
  return (
    <section>
      <h2 className="text-2xl font-bold text-secondary-500 mb-6">Logo</h2>
      <div className="flex flex-wrap items-end gap-8 rounded-2xl border border-border bg-card p-6">
        {SIZES.map(({ label, className }) => (
          <div key={label} className="text-center">
            <BrandLogo className={`${className} mx-auto mb-2`} />
            <p className="text-xs font-semibold text-secondary-500">
              {label} · <code>{className}</code>
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
