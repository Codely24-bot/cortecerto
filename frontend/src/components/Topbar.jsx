export default function Topbar({ title, subtitle, description }) {
  return (
    <div className="flex flex-col gap-3">
      <p className="section-kicker">{subtitle}</p>
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h2 className="font-display text-3xl font-semibold tracking-tight text-white md:text-4xl">
            {title}
          </h2>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-soft">
            {description ||
              "Uma visao refinada da operacao diaria com foco em agendamentos, clientes e crescimento da barbearia."}
          </p>
        </div>
      </div>
    </div>
  );
}
