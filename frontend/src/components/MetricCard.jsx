export default function MetricCard({ label, value, hint, icon: Icon, tone = "primary" }) {
  const tones = {
    primary: { bg: "bg-primary/15 text-[#7fb2ff]", ring: "border-primary/30" },
    red: { bg: "bg-danger/15 text-[#ff8f97]", ring: "border-danger/30" },
    green: { bg: "bg-emerald-500/15 text-emerald-300", ring: "border-emerald-500/30" },
    gold: { bg: "bg-amber-400/15 text-amber-300", ring: "border-amber-400/30" }
  };
  const t = tones[tone] || tones.primary;

  return (
    <button className="card flex w-full flex-col gap-4 p-5 text-left">
      <div className="flex items-center justify-between">
        <span className="kicker">{label}</span>
        <span className={`flex h-10 w-10 items-center justify-center rounded-xl border ${t.bg} ${t.ring}`}>
          <Icon className="h-5 w-5" />
        </span>
      </div>
      <div>
        <p className="font-display text-3xl font-bold text-white">{value}</p>
        {hint ? <p className="mt-1 text-sm text-muted">{hint}</p> : null}
      </div>
    </button>
  );
}
