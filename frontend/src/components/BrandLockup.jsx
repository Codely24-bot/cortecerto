import { Scissors } from "lucide-react";

export default function BrandLockup({
  compact = false,
  showTagline = true,
  className = ""
}) {
  const iconClass = compact ? "h-11 w-11 rounded-2xl" : "h-14 w-14 rounded-3xl";
  return (
    <div className={`flex items-center gap-3 ${className}`.trim()}>
      <div
        className={`${iconClass} flex shrink-0 items-center justify-center bg-gradient-to-br from-primary to-primaryLight shadow-[0_10px_24px_rgba(17,85,204,0.45)]`}
      >
        <Scissors className={compact ? "h-5 w-5 text-white" : "h-7 w-7 text-white"} />
      </div>
      <div className="min-w-0 leading-tight">
        <p className="font-display text-xl font-bold text-white">Corte Certo</p>
        {showTagline ? (
          <p className="mt-1 text-sm text-muted">Gestão para barbearias</p>
        ) : (
          <p className="mt-0.5 text-xs text-muted">Painel de barbearia</p>
        )}
      </div>
    </div>
  );
}
