export default function CategoryChips({ categories, selected, onSelect }) {
  return (
    <div style={styles.wrapper}>
      {categories.map((cat) => {
        const isSelected = selected === cat.id;
        return (
          <button
            key={cat.id}
            onClick={() => onSelect(cat.id)}
            style={{
              ...styles.chip,
              background: isSelected ? "var(--blue-btn)" : "var(--card-bg)",
              color: isSelected ? "#ffffff" : "var(--blue-btn)",
              border: isSelected
                ? "2px solid var(--blue-btn)"
                : "2px solid color-mix(in srgb, var(--blue-btn) 55%, var(--border-color))",
              boxShadow: isSelected ? "0 2px 8px rgba(21,101,192,0.3)" : "none",
            }}
          >
            <span style={styles.icon}>{cat.icon}</span>
            <span style={styles.label}>{cat.name}</span>
          </button>
        );
      })}
    </div>
  );
}

const styles = {
  wrapper: {
    display: "flex",
    gap: "10px",
    flexWrap: "wrap",
    padding: "4px 0",
  },
  chip: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    padding: "8px 16px",
    borderRadius: "9999px",
    fontSize: "13px",
    fontWeight: "600",
    cursor: "pointer",
    transition: "all 0.2s",
    fontFamily: "inherit",
    whiteSpace: "nowrap",
  },
  icon: { fontSize: "15px", lineHeight: 1 },
  label: { lineHeight: 1 },
};
