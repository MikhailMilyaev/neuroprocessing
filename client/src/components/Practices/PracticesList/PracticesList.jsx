import PracticeCard from "../PracticeCard/PracticeCard";

export default function PracticesList({ runs, onOpen, onOpenActions }) {
  return (
    <div style={{ display: "grid", gap: 12, marginTop: 16 }}>
      {runs.map((r) => (
        <PracticeCard
          key={r.id}
          run={r}
          onOpen={() => onOpen(r)}
          onOpenActions={() => onOpenActions(r)}
        />
      ))}
    </div>
  );
}
