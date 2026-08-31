import React from "react";

const STATUS_COLOR = {
  "À faire": "#9AA3B5",
  "En cours": "#1D4E8F",
  "Terminé": "#2F855A",
  "En retard": "#C53030",
};

/**
 * Diagramme de Gantt léger, construit en CSS pur (pas de bibliothèque de
 * graphiques) : chaque activité devient une barre positionnée et
 * dimensionnée proportionnellement à sa place dans la plage de dates du
 * projet.
 */
export default function GanttChart({ activities }) {
  if (!activities || activities.length === 0) {
    return <div className="text-sm text-[#7A8399] p-5">Aucune activité à représenter.</div>;
  }

  const dates = activities.flatMap((a) => [new Date(a.startDate).getTime(), new Date(a.endDate).getTime()]);
  const rangeStart = Math.min(...dates);
  const rangeEnd = Math.max(...dates);
  const totalSpan = Math.max(rangeEnd - rangeStart, 1);

  const monthTicks = [];
  const cursor = new Date(rangeStart);
  cursor.setDate(1);
  while (cursor.getTime() <= rangeEnd) {
    monthTicks.push(new Date(cursor));
    cursor.setMonth(cursor.getMonth() + 1);
  }

  const pct = (t) => ((t - rangeStart) / totalSpan) * 100;
  const today = Date.now();
  const todayPct = today >= rangeStart && today <= rangeEnd ? pct(today) : null;

  return (
    <div className="bg-white border border-[#E4E7EE] rounded-sm overflow-x-auto">
      <div className="min-w-[700px]">
        <div className="relative h-8 border-b border-[#E4E7EE] px-4">
          {monthTicks.map((m, i) => (
            <div
              key={i}
              className="absolute top-0 h-full flex items-center text-[10px] text-[#9AA3B5] uppercase tracking-wide"
              style={{ left: `${pct(m.getTime())}%` }}
            >
              {m.toLocaleDateString("fr-FR", { month: "short", year: "2-digit" })}
            </div>
          ))}
        </div>

        <div className="relative px-4 py-3 space-y-3">
          {todayPct !== null && (
            <div className="absolute top-0 bottom-0 w-px bg-[#E8B564] z-10" style={{ left: `${todayPct}%` }} title="Aujourd'hui" />
          )}
          {activities.map((a) => {
            const start = new Date(a.startDate).getTime();
            const end = new Date(a.endDate).getTime();
            const left = pct(start);
            const width = Math.max(pct(end) - left, 1.5);
            const color = a.progressPct >= 100 ? STATUS_COLOR["Terminé"] : STATUS_COLOR[a.status] || STATUS_COLOR["À faire"];

            return (
              <div key={a.id} className="relative h-8">
                <div className="absolute -top-4 left-0 text-xs text-[#3D4761] truncate max-w-[240px]">{a.title}</div>
                <div
                  className="absolute top-1 h-5 rounded-sm flex items-center overflow-hidden"
                  style={{ left: `${left}%`, width: `${width}%`, backgroundColor: `${color}22`, border: `1px solid ${color}` }}
                  title={`${a.title} — ${new Date(a.startDate).toLocaleDateString("fr-FR")} au ${new Date(a.endDate).toLocaleDateString("fr-FR")}`}
                >
                  <div className="h-full rounded-sm" style={{ width: `${a.progressPct || 0}%`, backgroundColor: color }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
