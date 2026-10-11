import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'College Admission Management Software | SriWeb Technologies',
  description:
    'Coordinate field PROs, telecallers, and admission teams in one organized workflow. Track student enquiries, manage follow-ups, monitor school outreach, and keep admission progress visible to management.',
  keywords: [
    'College Admission Management Software',
    'Admission Management System for Colleges',
    'College Enquiry Management Software',
    'Student Lead Management Software',
    'Telecaller Management for Admissions',
    'College Admission Tracking Software',
    'PRO Field Management Software for Colleges',
    'SriWeb Technologies',
  ],
  authors: [{ name: 'SriWeb Technologies' }],
  openGraph: {
    title: 'College Admission Management Platform | SriWeb Technologies',
    description:
      'From First Student Enquiry to Admission — One Connected Platform. Coordinate field PROs, telecallers, and admission teams in one organized workflow.',
    url: 'https://sriwebtechnologies.com/products/college-admission-management',
    siteName: 'SriWeb Technologies',
    type: 'website',
  },
  alternates: {
    canonical: '/products/college-admission-management',
  },
};

export default function ProductLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'SoftwareApplication',
            name: 'College Admission Management Platform',
            applicationCategory: 'EducationalApplication',
            operatingSystem: 'Web, Android (Capacitor), iOS',
            creator: {
              '@type': 'Organization',
              name: 'SriWeb Technologies',
              url: 'https://sriwebtechnologies.com',
            },
            description:
              'A centralized admission management platform designed for colleges to organize prospective student enquiries, coordinate telecallers and admission representatives, track applications, and monitor admission progress.',
          }),
        }}
      />
      {children}
    </>
  );
}
