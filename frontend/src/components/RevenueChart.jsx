import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceArea } from "recharts";
import { formatBRL } from "../api.js";

function CustomDot(props) {
  const { cx, cy, payload } = props;
  return (
    <g>
      <text x={cx} y={cy - 14} textAnchor="middle" fill="#e8eefb" fontSize="11" fontWeight="700">
        {payload?.value ? `R$ ${(payload.value / 1000).toFixed(1).replace(".", ",")}k` : ""}
      </text>
      <circle cx={cx} cy={cy} r={4} fill="#3b82f6" stroke="#071a33" strokeWidth={2} />
    </g>
  );
}

export default function RevenueChart({ data = [], title = "Faturamento semanal", subtitle = "Financeiro" }) {
  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="kicker">{subtitle}</p>
          <h3 className="mt-1 font-display text-lg font-semibold text-white">{title}</h3>
        </div>
        <div className="flex items-center gap-1 rounded-lg border border-white/10 bg-white/5 p-1">
          <button className="btn btn-primary px-3 py-1.5 text-xs">Esta semana</button>
          <button className="btn btn-ghost px-3 py-1.5 text-xs">Semana passada</button>
        </div>
      </div>

      <div className="h-[240px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 24, right: 16, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="lineGrad" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#3b82f6" />
                <stop offset="100%" stopColor="#7fb2ff" />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" vertical={false} />
            <XAxis dataKey="label" stroke="#8494ad" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
            <YAxis hide />
            <Tooltip
              formatter={(v) => formatBRL(Number(v))}
              labelFormatter={(l) => l}
              contentStyle={{
                background: "#0b2447",
                border: "1px solid rgba(255,255,255,0.12)",
                borderRadius: 12,
                color: "#fff"
              }}
            />
            <Line
              type="monotone"
              dataKey="value"
              stroke="url(#lineGrad)"
              strokeWidth={3}
              dot={<CustomDot />}
              activeDot={{ r: 6, fill: "#3b82f6" }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
