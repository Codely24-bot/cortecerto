export const weekDays = [
  { label: "Seg", date: "15/09" },
  { label: "Ter", date: "16/09" },
  { label: "Qua", date: "17/09" },
  { label: "Qui", date: "18/09" },
  { label: "Sex", date: "19/09" },
  { label: "Sáb", date: "20/09" },
  { label: "Dom", date: "21/09" }
];

export const scheduleSlots = [
  { time: "08:00", corte: [], barba: [], combo: [] },
  { time: "09:00", corte: [{ name: "Carlos Silva", barbeiro: "Rafael" }], barba: [], combo: [] },
  { time: "09:30", corte: [], barba: [{ name: "Bruno Santos", barbeiro: "Lucas" }], combo: [] },
  { time: "10:00", corte: [{ name: "Felipe Costa", barbeiro: "Rafael" }], barba: [], combo: [] },
  { time: "10:30", corte: [], barba: [], combo: [{ name: "Gabriel Lima", barbeiro: "Lucas" }] },
  { time: "11:00", corte: [], barba: [], combo: [] },
  { time: "12:00", corte: [{ name: "Daniel Rocha", barbeiro: "Rafael" }], barba: [], combo: [] },
  { time: "13:00", corte: [], barba: [], combo: [] },
  { time: "14:00", corte: [], barba: [{ name: "Pedro Alves", barbeiro: "Lucas" }], combo: [] },
  { time: "15:00", corte: [{ name: "Marcos Vinícius", barbeiro: "Rafael" }], barba: [], combo: [] },
  { time: "16:00", corte: [], barba: [], combo: [{ name: "Tiago Nunes", barbeiro: "Lucas" }] },
  { time: "17:00", corte: [], barba: [], combo: [] },
  { time: "18:00", corte: [{ name: "Ricardo Faria", barbeiro: "Rafael" }], barba: [], combo: [] },
  { time: "19:00", corte: [], barba: [], combo: [] }
];

export const upcoming = [
  { time: "09:00", name: "Carlos Silva", service: "Corte", barber: "Rafael" },
  { time: "09:30", name: "Bruno Santos", service: "Barba", barber: "Lucas" },
  { time: "10:00", name: "Felipe Costa", service: "Corte", barber: "Rafael" },
  { time: "10:30", name: "Gabriel Lima", service: "Corte + Barba", barber: "Lucas" }
];

export const revenueWeek = [
  { day: "Seg", value: 1200 },
  { day: "Ter", value: 1450 },
  { day: "Qua", value: 1680 },
  { day: "Qui", value: 1320 },
  { day: "Sex", value: 1780 },
  { day: "Sáb", value: 1950 },
  { day: "Dom", value: 1100 }
];

export const clients = [
  { name: "Carlos Silva", phone: "(11) 99999-1234", visits: 24, last: "20/09/2026", value: "R$ 1.560" },
  { name: "Bruno Santos", phone: "(11) 98888-2211", visits: 18, last: "19/09/2026", value: "R$ 980" },
  { name: "Felipe Costa", phone: "(11) 97777-3344", visits: 31, last: "20/09/2026", value: "R$ 2.140" },
  { name: "Gabriel Lima", phone: "(11) 96666-4455", visits: 12, last: "18/09/2026", value: "R$ 720" },
  { name: "Daniel Rocha", phone: "(11) 95555-5566", visits: 9, last: "15/09/2026", value: "R$ 540" },
  { name: "Pedro Alves", phone: "(11) 94444-6677", visits: 40, last: "21/09/2026", value: "R$ 3.100" }
];

export const caixaItems = [
  { date: "20/09", client: "Carlos Silva", service: "Corte", method: "Pix", value: "R$ 40,00", status: "Pago" },
  { date: "20/09", client: "Felipe Costa", service: "Corte + Barba", method: "Cartão", value: "R$ 90,00", status: "Pago" },
  { date: "19/09", client: "Bruno Santos", service: "Barba", method: "Dinheiro", value: "R$ 25,00", status: "Pago" },
  { date: "18/09", client: "Gabriel Lima", service: "Corte + Barba", method: "Pix", value: "R$ 90,00", status: "Pendente" },
  { date: "17/09", client: "Daniel Rocha", service: "Corte", method: "Cartão", value: "R$ 40,00", status: "Pago" }
];
