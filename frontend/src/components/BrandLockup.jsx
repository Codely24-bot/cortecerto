export default function BrandLockup({
  compact = false,
  showTagline = true,
  className = ""
}) {
  return (
    <div className={`flex items-center gap-3 ${className}`.trim()}>
      <img
        src="/brand/icon.png"
        alt="Icone MESTRE DA NAVALHA"
        className={`${compact ? "h-11 w-11 rounded-2xl" : "h-14 w-14 rounded-3xl"} brand-frame shrink-0 object-cover`}
      />
      <div className="min-w-0">
        <p className="brand-wordmark text-lg font-semibold tracking-[0.34em] text-white">
          MESTRE
        </p>
        <p className="section-kicker mt-1 tracking-[0.28em]">DA NAVALHA</p>
        {showTagline ? (
          <p className="mt-2 text-xs text-soft">
            Web app premium para operacao e crescimento de barbearias.
          </p>
        ) : null}
      </div>
    </div>
  );
}
