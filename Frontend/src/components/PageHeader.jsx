export default function PageHeader({ title, subtitle, actions }) {
  return (
    <div style={styles.wrap}>
      <div>
        <h1 style={styles.title}>{title}</h1>
        {subtitle ? <p style={styles.subtitle}>{subtitle}</p> : null}
      </div>
      {actions ? <div style={styles.actions}>{actions}</div> : null}
    </div>
  );
}

const styles = {
  wrap: {
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: '16px',
    marginBottom: '24px',
    flexWrap: 'wrap',
  },
  title: { margin: 0, fontSize: '28px', fontWeight: 800, color: '#0f172a' },
  subtitle: { margin: '6px 0 0', color: '#64748b', maxWidth: '56ch' },
  actions: { display: 'flex', gap: '12px', flexWrap: 'wrap' },
};
