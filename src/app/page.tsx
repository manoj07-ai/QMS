import Header from '@/shared/components/layout/Header';
import ComplaintForm from '@/features/complaint/components/ComplaintForm';
import AIAssistantPanel from '@/features/ai-assistant/components/AIAssistantPanel';
import styles from './page.module.css';

export default function HomePage() {
  return (
    <div className={styles.page}>
      <Header />

      <main className={styles.main}>
        <div className={styles.layout}>
          {/* ─── Left Panel — Complaint Form ───────────────── */}
          <div className={styles.leftPanel}>
            <ComplaintForm />
          </div>

          {/* ─── Right Panel — AI Intake & AI Chat ──────────── */}
          <div className={styles.rightPanel}>
            <AIAssistantPanel />
          </div>
        </div>
      </main>
    </div>
  );
}
