export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative min-h-screen w-full flex items-center justify-center overflow-hidden">
      {/* Dynamic Background with Gradient and Orbs */}
      <div className="absolute inset-0 z-0 bg-gradient-to-br from-[#1A153A] via-[#1c153c] to-[#2C0B52]"></div>

      {/* Abstract Orbs for Depth */}
      <div className="absolute top-[-10%] left-[-5%] w-[600px] h-[600px] rounded-full bg-primary/20 blur-[120px] pointer-events-none animate-pulse"></div>
      <div className="absolute bottom-[-10%] right-[-5%] w-[500px] h-[500px] rounded-full bg-cyan-500/10 blur-[100px] pointer-events-none"></div>
      <div className="absolute top-[40%] left-[60%] w-[300px] h-[300px] rounded-full bg-purple-500/10 blur-[80px] pointer-events-none"></div>

      {/* Main Content Container */}
      <div className="relative z-10 w-full max-w-[1200px] px-4 flex flex-col md:flex-row items-center justify-center gap-12">
        {/* Left Side: Visual/Context */}
        <div className="hidden lg:flex flex-col max-w-md gap-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-primary to-purple-400 flex items-center justify-center shadow-lg shadow-primary/20">
              <span className="material-symbols-outlined text-white text-3xl">
                monitoring
              </span>
            </div>
            <span className="text-2xl font-bold tracking-tight">
              Nexus Analytics
            </span>
          </div>

          <h2 className="text-5xl font-extrabold leading-tight tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-white to-white/60">
            Real-time insights for decision makers.
          </h2>

          <p className="text-lg text-white/60 font-medium">
            Secure access for Directors and Administrators to monitor global
            sales performance.
          </p>

          {/* Abstract Map/Data representation */}
          <div className="mt-8 relative h-48 w-full rounded-2xl overflow-hidden border border-white/10 bg-white/5 backdrop-blur-sm group">
            <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=1000&auto=format&fit=crop')] bg-cover bg-center opacity-40 mix-blend-overlay transition-transform duration-700 group-hover:scale-105"></div>
            <div className="absolute bottom-4 left-4 flex items-center gap-2">
              <span className="flex h-2 w-2 rounded-full bg-green-400"></span>
              <span className="text-xs font-mono text-green-300">
                SYSTEM ONLINE
              </span>
            </div>
          </div>
        </div>

        {/* Right Side: Auth Content */}
        {children}
      </div>
    </div>
  );
}
