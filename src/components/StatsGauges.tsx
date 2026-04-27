// Three thin horizontal gauges shown beneath the hamster:
//   배고픔 (hunger), 행복감 (happiness), 친밀도 (affinity).
// Updated immediately on action clicks via useHamsterStore.bumpStat. Real
// time-decay (-N/min while active, etc.) lands in milestone C alongside the
// mood/lifecycle system.
import { useHamsterStore, type StatKey } from "../store/useHamsterStore";

const ROWS: { key: StatKey; label: string; color: string }[] = [
  { key: "hunger", label: "배고픔", color: "#f5b942" },
  { key: "happiness", label: "행복감", color: "#ff7eb3" },
  { key: "affinity", label: "친밀도", color: "#7eb8ff" },
];

export function StatsGauges() {
  const stats = useHamsterStore((s) => ({
    hunger: s.hunger,
    happiness: s.happiness,
    affinity: s.affinity,
  }));

  return (
    <div className="stats-gauges">
      {ROWS.map(({ key, label, color }) => {
        const value = stats[key];
        return (
          <div className="gauge" key={key}>
            <span className="gauge__label">{label}</span>
            <div className="gauge__track">
              <div
                className="gauge__fill"
                style={{ width: `${value}%`, background: color }}
              />
            </div>
            <span className="gauge__value">{value}</span>
          </div>
        );
      })}
    </div>
  );
}
