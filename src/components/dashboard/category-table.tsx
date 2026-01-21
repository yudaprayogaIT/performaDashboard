import { formatCurrency, formatPercentage, cn } from "@/lib/utils";
import type { CategorySales } from "@/types/sales";

interface CategoryTableProps {
  categories: CategorySales[];
  className?: string;
}

export default function CategoryTable({
  categories,
  className,
}: CategoryTableProps) {
  const getPercentageColor = (percentage: number) => {
    if (percentage >= 100) return "text-green-400";
    if (percentage >= 75) return "text-primary";
    if (percentage >= 50) return "text-yellow-400";
    return "text-red-400";
  };

  return (
    <div
      className={cn(
        "rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm overflow-hidden",
        className,
      )}
    >
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/10 bg-white/5">
              <th className="px-4 py-4 text-left text-sm font-bold text-white uppercase tracking-wider min-w-[180px]">
                Kategori
              </th>
              <th
                colSpan={3}
                className="px-4 py-3 text-center text-sm font-bold text-green-400 uppercase tracking-wider border-x border-white/10 bg-green-500/5"
              >
                Sales Local
              </th>
              <th
                colSpan={3}
                className="px-4 py-3 text-center text-sm font-bold text-blue-400 uppercase tracking-wider border-r border-white/10 bg-blue-500/5"
              >
                Cabang
              </th>
              <th
                colSpan={3}
                className="px-4 py-3 text-center text-sm font-bold text-purple-400 uppercase tracking-wider bg-purple-500/5"
              >
                Total
              </th>
            </tr>
            <tr className="border-b border-white/10 bg-white/5 text-xs">
              <th className="px-4 py-2"></th>
              {/* Local */}
              <th className="px-4 py-2 text-center text-white/50 font-medium uppercase border-l border-white/10">
                Target
              </th>
              <th className="px-4 py-2 text-center text-white/50 font-medium uppercase">
                Omzet
              </th>
              <th className="px-4 py-2 text-center text-white/50 font-medium uppercase border-r border-white/10">
                Pencapaian
              </th>
              {/* Cabang */}
              <th className="px-4 py-2 text-center text-white/50 font-medium uppercase">
                Target
              </th>
              <th className="px-4 py-2 text-center text-white/50 font-medium uppercase">
                Omzet
              </th>
              <th className="px-4 py-2 text-center text-white/50 font-medium uppercase border-r border-white/10">
                Pencapaian
              </th>
              {/* Total */}
              <th className="px-4 py-2 text-center text-white/50 font-medium uppercase">
                Target
              </th>
              <th className="px-4 py-2 text-center text-white/50 font-medium uppercase">
                Omzet
              </th>
              <th className="px-4 py-2 text-center text-white/50 font-medium uppercase">
                Pencapaian
              </th>
            </tr>
          </thead>
          <tbody>
            {categories.map((category, idx) => (
              <tr
                key={category.id}
                className={cn(
                  "border-b border-white/5 hover:bg-white/5 transition-colors",
                  idx % 2 === 0 ? "bg-white/[0.02]" : "",
                )}
              >
                <td className="px-4 py-3 font-medium text-white text-sm">
                  {category.name}
                </td>
                {/* Local */}
                <td className="px-4 py-3 text-center text-white/70 text-sm font-mono border-l border-white/10">
                  {formatCurrency(category.local.target)}
                </td>
                <td className="px-4 py-3 text-center text-white text-sm font-mono font-medium">
                  {formatCurrency(category.local.omzet)}
                </td>
                <td
                  className={cn(
                    "px-4 py-3 text-center text-sm font-bold border-r border-white/10",
                    getPercentageColor(category.local.pencapaian),
                  )}
                >
                  {formatPercentage(category.local.pencapaian)}
                </td>
                {/* Cabang */}
                <td className="px-4 py-3 text-center text-white/70 text-sm font-mono">
                  {formatCurrency(category.cabang.target)}
                </td>
                <td className="px-4 py-3 text-center text-white text-sm font-mono font-medium">
                  {formatCurrency(category.cabang.omzet)}
                </td>
                <td
                  className={cn(
                    "px-4 py-3 text-center text-sm font-bold border-r border-white/10",
                    getPercentageColor(category.cabang.pencapaian),
                  )}
                >
                  {formatPercentage(category.cabang.pencapaian)}
                </td>
                {/* Total */}
                <td className="px-4 py-3 text-center text-white/70 text-sm font-mono">
                  {formatCurrency(category.total.target)}
                </td>
                <td className="px-4 py-3 text-center text-white text-sm font-mono font-medium">
                  {formatCurrency(category.total.omzet)}
                </td>
                <td
                  className={cn(
                    "px-4 py-3 text-center text-sm font-bold",
                    getPercentageColor(category.total.pencapaian),
                  )}
                >
                  {formatPercentage(category.total.pencapaian)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
