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
  // Subscribe to each stat individually. Returning a new {} from a single
  // selector triggers an infinite re-render loop with zustand's default
  // Object.is comparison.
  const hunger = useHamsterStore((s) => s.hunger);
  const happiness = useHamsterStore((s) => s.happiness);
  const affinity = useHamsterStore((s) => s.affinity);
  const values: Record<StatKey, number> = { hunger, happiness, affinity };

  return (
    <div className="stats-gauges">
      {ROWS.map(({ key, label, color }) => {
        const value = values[key];
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
