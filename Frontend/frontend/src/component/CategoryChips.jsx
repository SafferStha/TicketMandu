export default function CategoryChips({ categories, selected, onSelect }) {
  return (
    <div style={styles.wrapper}>
      {categories.map(cat => {
        const isSelected = selected === cat.id;
        return (
          <button
            key={cat.id}
            onClick={() => onSelect(cat.id)}
            style={{
              ...styles.chip,
              background: isSelected ? '#1565c0' : '#ffffff',
              color: isSelected ? '#ffffff' : '#1565c0',
              border: isSelected ? '2px solid #1565c0' : '2px solid #1565c0',
              boxShadow: isSelected ? '0 2px 8px rgba(21,101,192,0.3)' : 'none',
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
    display: 'flex',
    gap: '10px',
    flexWrap: 'wrap',
    padding: '4px 0',
  },
  chip: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '8px 16px',
    borderRadius: '9999px',
    fontSize: '13px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.2s',
    fontFamily: 'inherit',
    whiteSpace: 'nowrap',
  },
  icon: {
    fontSize: '15px',
    lineHeight: 1,
  },
  label: {
    lineHeight: 1,
  },
};
