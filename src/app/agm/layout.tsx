import AgmSidebar from './AgmSidebar';

export const metadata = {
  title: 'AGM Portal | Operations & Team Oversight',
  description: 'Area General Manager command hub for monitoring field staff, telecallers, and admissions progress',
};

export default function AgmLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#F8FAFC' }}>
      <AgmSidebar />
      <main style={{ flex: 1, minWidth: 0, overflowY: 'auto' }}>
        {children}
      </main>
    </div>
  );
}
