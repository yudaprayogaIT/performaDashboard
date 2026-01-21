"use client";

export default function Header() {
    return (
        <header className="sticky top-0 z-30 h-16 bg-background-dark/80 backdrop-blur-xl border-b border-white/10">
            <div className="flex h-full items-center justify-between px-6">
                {/* Search */}
                <div className="flex items-center gap-4">
                    <div className="relative">
                        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-white/40 text-[20px]">search</span>
                        <input
                            type="text"
                            placeholder="Search..."
                            className="w-80 h-10 pl-10 pr-4 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/40 text-sm focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-all"
                        />
                    </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-4">
                    {/* Notifications */}
                    <button className="relative p-2 rounded-xl hover:bg-white/5 transition-colors">
                        <span className="material-symbols-outlined text-white/60 hover:text-white transition-colors">notifications</span>
                        <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
                    </button>

                    {/* Theme Toggle */}
                    <button className="p-2 rounded-xl hover:bg-white/5 transition-colors">
                        <span className="material-symbols-outlined text-white/60 hover:text-white transition-colors">dark_mode</span>
                    </button>
                </div>
            </div>
        </header>
    );
}
