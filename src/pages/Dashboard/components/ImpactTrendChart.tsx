import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { useTheme } from '@/hooks/use-theme';
import type { ImpactTrendPoint } from '@/types/profile';

interface ImpactTrendChartProps {
  points: ImpactTrendPoint[];
}

const dateFormatter = new Intl.DateTimeFormat('es-MX', { day: '2-digit', month: 'short' });
const numberFormatter = new Intl.NumberFormat('es-MX', { maximumFractionDigits: 1 });

interface SeriesConfig {
  key: 'co2Kg' | 'waterLiters' | 'plasticKg';
  label: string;
  unit: string;
  lineColor: { light: string; dark: string };
  tileClassName: string;
}

// Same colors as the current-totals tiles above (ActionCatalogCard's
// CO2/water/plastic coding) — one series per chart, so this is brand
// identity reuse, not a categorical palette needing CVD validation.
const SERIES: SeriesConfig[] = [
  {
    key: 'co2Kg',
    label: 'CO₂ evitado',
    unit: 'kg',
    lineColor: { light: '#619534', dark: '#89b661' },
    tileClassName:
      'border-primary-200 bg-primary-50 dark:border-primary-800 dark:bg-primary-900/30',
  },
  {
    key: 'waterLiters',
    label: 'Agua ahorrada',
    unit: 'L',
    lineColor: { light: '#0284c7', dark: '#38bdf8' },
    tileClassName: 'border-sky-200 bg-sky-50 dark:border-sky-800 dark:bg-sky-900/30',
  },
  {
    key: 'plasticKg',
    label: 'Plástico evitado',
    unit: 'kg',
    lineColor: { light: '#16a34a', dark: '#34d399' },
    tileClassName:
      'border-emerald-200 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-900/30',
  },
];

// Explicit theme-aware hex rather than currentColor: recharts renders ticks
// as SVG text with an inline fill, which is more reliable to drive directly
// than through a Tailwind className passthrough.
const CHROME_COLORS = {
  light: { grid: '#bac1bd', tick: '#6a7971', tooltipBg: '#ffffff', tooltipText: '#21372b' },
  dark: { grid: '#1e3227', tick: '#99a39d', tooltipBg: '#121e18', tooltipText: '#e9ebea' },
};

/**
 * One small-multiple line chart per metric (different units/scales, so no
 * shared y-axis) showing the last 4 weeks, oldest first.
 */
export function ImpactTrendChart({ points }: ImpactTrendChartProps) {
  const { resolvedTheme } = useTheme();
  const chrome = CHROME_COLORS[resolvedTheme];

  const chartData = points.map(point => ({
    label: dateFormatter.format(new Date(point.weekStart)),
    co2Kg: point.co2Kg,
    waterLiters: point.waterLiters,
    plasticKg: point.plasticKg,
  }));

  return (
    <section className="flex flex-col gap-4">
      <h2 className="text-xl font-bold text-foreground">Tendencia (últimas 4 semanas)</h2>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {SERIES.map(series => (
          <div key={series.key} className={`rounded-2xl border p-4 ${series.tileClassName}`}>
            <p className="mb-2 text-sm font-semibold text-foreground">{series.label}</p>
            <div className="h-40">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 4, right: 8, bottom: 0, left: -16 }}>
                  <CartesianGrid vertical={false} stroke={chrome.grid} />
                  <XAxis
                    dataKey="label"
                    tickLine={false}
                    axisLine={false}
                    tick={{ fontSize: 11, fill: chrome.tick }}
                  />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    width={32}
                    tick={{ fontSize: 11, fill: chrome.tick }}
                    tickFormatter={value => numberFormatter.format(value)}
                  />
                  <Tooltip
                    formatter={value => [
                      `${numberFormatter.format(Number(value))} ${series.unit}`,
                      series.label,
                    ]}
                    labelFormatter={label => `Semana del ${label}`}
                    contentStyle={{
                      borderRadius: 12,
                      border: `1px solid ${chrome.grid}`,
                      backgroundColor: chrome.tooltipBg,
                      color: chrome.tooltipText,
                      fontSize: 12,
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey={series.key}
                    stroke={
                      resolvedTheme === 'dark' ? series.lineColor.dark : series.lineColor.light
                    }
                    strokeWidth={2}
                    dot={{ r: 4 }}
                    activeDot={{ r: 5 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
