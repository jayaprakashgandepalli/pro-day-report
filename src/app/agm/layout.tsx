import AgmSidebar from './AgmSidebar';
import AgmBottomNav from '@/components/AgmBottomNav';

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
    <>
      <style dangerouslySetInnerHTML={{__html: `
        .agm-layout-root {
          display: flex;
          min-height: 100vh;
          background-color: #F8FAFC;
        }
        .agm-layout-main {
          flex: 1;
          min-width: 0;
          overflow-y: auto;
          -webkit-overflow-scrolling: touch;
        }
        @media (max-width: 767px) {
          .agm-layout-root {
            flex-direction: column;
          }
          .agm-layout-main {
            padding-bottom: 74px !important;
          }
        }
      `}} />

      <div className="agm-layout-root">
        <AgmSidebar />
        <main className="agm-layout-main">
          {children}
        </main>
        <AgmBottomNav />
      </div>
    </>
  );
}
