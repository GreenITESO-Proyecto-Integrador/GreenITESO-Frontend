interface ColorPaletteProps {
  title: string;
  colorPrefix: 'primary' | 'secondary';
  borderClass: string;
}

export function ColorPalette({ title, colorPrefix, borderClass }: ColorPaletteProps) {
  return (
    <section>
      <h2 className="text-2xl font-bold text-secondary-500 mb-6">{title}</h2>
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {[50, 100, 200, 300, 400, 500, 600, 700, 800, 900].map(shade => (
          <div key={shade} className="text-center">
            <div
              className={`h-20 rounded-lg mb-2 ${borderClass} shadow-sm`}
              style={{ backgroundColor: `var(--color-${colorPrefix}-${shade})` }}
            />
            <p className="text-xs font-semibold text-secondary-500">-{shade}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
