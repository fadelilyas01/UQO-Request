/**
 * Composant de chargement squelette (Skeleton Loader) professionnel.
 * Reproduit la forme des cartes et listes avec effet de brillance Tailwind fluide.
 */

export function RequestCardSkeleton() {
    return (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs animate-pulse space-y-4">
            <div className="flex items-center justify-between">
                <div className="h-6 w-24 bg-slate-200 dark:bg-slate-800 rounded-full" />
                <div className="h-5 w-16 bg-slate-200 dark:bg-slate-800 rounded-md" />
            </div>

            <div className="space-y-2">
                <div className="h-5 w-3/4 bg-slate-200 dark:bg-slate-800 rounded-md" />
                <div className="h-4 w-full bg-slate-100 dark:bg-slate-800/60 rounded-md" />
                <div className="h-4 w-5/6 bg-slate-100 dark:bg-slate-800/60 rounded-md" />
            </div>

            <div className="pt-3 border-t border-slate-100 dark:border-slate-800/60 flex items-center justify-between">
                <div className="h-4 w-32 bg-slate-200 dark:bg-slate-800 rounded-md" />
                <div className="h-4 w-20 bg-slate-200 dark:bg-slate-800 rounded-md" />
            </div>
        </div>
    );
}

export function StatsCardSkeleton() {
    return (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs animate-pulse space-y-3">
            <div className="flex items-center justify-between">
                <div className="h-4 w-24 bg-slate-200 dark:bg-slate-800 rounded-md" />
                <div className="h-8 w-8 bg-slate-200 dark:bg-slate-800 rounded-lg" />
            </div>
            <div className="h-8 w-16 bg-slate-200 dark:bg-slate-800 rounded-md" />
        </div>
    );
}

export function TableRowSkeleton() {
    return (
        <tr className="animate-pulse border-b border-slate-100 dark:border-slate-800/60">
            <td className="p-4"><div className="h-4 w-12 bg-slate-200 dark:bg-slate-800 rounded-md" /></td>
            <td className="p-4"><div className="h-4 w-40 bg-slate-200 dark:bg-slate-800 rounded-md" /></td>
            <td className="p-4"><div className="h-6 w-24 bg-slate-200 dark:bg-slate-800 rounded-full" /></td>
            <td className="p-4"><div className="h-4 w-20 bg-slate-200 dark:bg-slate-800 rounded-md" /></td>
            <td className="p-4"><div className="h-4 w-24 bg-slate-200 dark:bg-slate-800 rounded-md" /></td>
            <td className="p-4 text-right"><div className="h-8 w-20 bg-slate-200 dark:bg-slate-800 rounded-md ml-auto" /></td>
        </tr>
    );
}

export default function SkeletonLoader({ count = 3, type = 'card' }) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: count }).map((_, index) => (
                <RequestCardSkeleton key={index} />
            ))}
        </div>
    );
}
