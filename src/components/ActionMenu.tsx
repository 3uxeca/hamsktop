// Floating action menu shown when the user clicks an opaque hamster pixel.
// For B.3 the actions just console.log + flash a colored halo on the sprite;
// real mood/growth effects land in Milestone C.
import ko from "../i18n/ko.json";

export type ActionKind = "feed" | "pet" | "play";

interface Props {
  open: boolean;
  onAction: (action: ActionKind) => void;
  onClose: () => void;
}

const ACTIONS: { kind: ActionKind; label: string }[] = [
  { kind: "feed", label: ko.actions.feed },
  { kind: "pet", label: ko.actions.pet },
  { kind: "play", label: ko.actions.play },
];

export function ActionMenu({ open, onAction, onClose }: Props) {
  if (!open) return null;
  return (
    <div className="action-menu" role="menu" onMouseLeave={onClose}>
      {ACTIONS.map(({ kind, label }) => (
        <button
          key={kind}
          type="button"
          className="action-menu__btn"
          onClick={() => {
            onAction(kind);
          }}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
