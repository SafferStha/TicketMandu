export default function StatCard({ label, value, helper, tone = 'default' }) {
  return (
    <div style={{ ...styles.card, ...(toneStyles[tone] || toneStyles.default) }}>
      <div style={styles.label}>{label}</div>
      <div style={styles.value}>{value}</div>
      {helper ? <div style={styles.helper}>{helper}</div> : null}
    </div>
  );
}

const styles = {
  card: {
    background: '#fff',
    borderRadius: '18px',
    padding: '18px',
    boxShadow: '0 10px 30px rgba(15,23,42,0.08)',
    border: '1px solid #e2e8f0',
  },
  label: { fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.12em', color: '#64748b' },
  value: { fontSize: '28px', fontWeight: 800, marginTop: '6px', color: '#0f172a' },
  helper: { marginTop: '6px', color: '#64748b', fontSize: '13px' },
};

const toneStyles = {
  default: {},
  blue: { borderColor: '#bfdbfe', background: 'linear-gradient(180deg, #fff 0%, #eff6ff 100%)' },
  green: { borderColor: '#bbf7d0', background: 'linear-gradient(180deg, #fff 0%, #f0fdf4 100%)' },
  amber: { borderColor: '#fde68a', background: 'linear-gradient(180deg, #fff 0%, #fffbeb 100%)' },
};
