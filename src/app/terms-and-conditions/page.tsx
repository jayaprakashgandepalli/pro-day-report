import React from 'react';
import Link from 'next/link';
import { ArrowLeft, ShieldCheck } from 'lucide-react';
import '../student/student.css'; // Re-use styling if needed, or use inline styles

export default function TermsAndConditionsPage() {
  return (
    <div style={{ minHeight: '100vh', background: '#0f172a', padding: '2rem 1rem', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <div style={{ width: '100%', maxWidth: '800px' }}>
        <Link 
          href="/student/register" 
          style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', color: '#94a3b8', textDecoration: 'none', marginBottom: '2rem', fontSize: '1rem', transition: 'color 0.2s' }}
        >
          <ArrowLeft size={20} /> Back to Registration
        </Link>
        
        <div style={{ background: '#1e293b', borderRadius: '24px', padding: '3rem', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)', border: '1px solid rgba(255,255,255,0.05)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '2rem' }}>
            <div style={{ background: 'linear-gradient(135deg, #8b5cf6, #ec4899)', padding: '1rem', borderRadius: '16px' }}>
              <ShieldCheck size={32} color="#fff" />
            </div>
            <div>
              <h1 style={{ color: '#f8fafc', fontSize: '2rem', margin: '0 0 0.5rem 0' }}>Terms and Conditions</h1>
              <p style={{ color: '#94a3b8', margin: 0, fontSize: '1.1rem' }}>Data Privacy & Usage</p>
            </div>
          </div>
          
          <div style={{ color: '#cbd5e1', fontSize: '1.1rem', lineHeight: '1.8' }}>
            <p style={{ marginBottom: '1.5rem' }}>
              Welcome to our Student Portal. By registering and using our services, you agree to the following terms and conditions regarding the usage of your data.
            </p>
            
            <div style={{ background: 'rgba(139, 92, 246, 0.1)', borderLeft: '4px solid #8b5cf6', padding: '1.5rem', borderRadius: '0 12px 12px 0', marginBottom: '2rem' }}>
              <h3 style={{ color: '#fff', fontSize: '1.25rem', marginTop: 0, marginBottom: '1rem' }}>Data Usage Policy</h3>
              <p style={{ margin: 0, color: '#e2e8f0', fontSize: '1.15rem', lineHeight: '1.8' }}>
                The contact information you provide during registration, including your phone number, name, and other details, may be used by college representatives to <strong>contact you for the purpose of providing relevant career guidance and information regarding admissions</strong> in various colleges.
              </p>
            </div>

            <h3 style={{ color: '#f8fafc', fontSize: '1.3rem', marginBottom: '1rem' }}>Information Collection & Use</h3>
            <p style={{ marginBottom: '1.5rem' }}>
              The contact information you provide during registration (including but not limited to your name, phone number, and current educational details) may be shared with our partnered educational institutions and colleges. These institutions may use this information to reach out to you regarding career counseling, course offerings, and admission processes.
            </p>

            <h3 style={{ color: '#f8fafc', fontSize: '1.3rem', marginBottom: '1rem' }}>Disclaimer: Career Test Recommendations</h3>
            <p style={{ marginBottom: '1.5rem' }}>
              The group recommendations and career paths suggested based on our test are intended solely for general awareness and guidance. They do not constitute definitive career advice. We strongly advise students to consult with their teachers, school counselors, or higher education experts before making any important educational or career decisions.
            </p>

            <h3 style={{ color: '#f8fafc', fontSize: '1.3rem', marginBottom: '1rem' }}>Content Source & Accuracy</h3>
            <p style={{ marginBottom: '1.5rem' }}>
              The study materials, book recommendations, mind power improvement techniques, and other educational content provided on our platform are curated from various published books and publicly available online sources. While we strive to provide helpful information for personal development, it is intended strictly for general educational purposes.
            </p>

            <h3 style={{ color: '#f8fafc', fontSize: '1.3rem', marginBottom: '1rem' }}>Your Consent</h3>
            <p style={{ marginBottom: '0' }}>
              By checking the "I agree to the Terms and Conditions" box during registration, you explicitly consent to the collection, storage, and sharing of your contact information for the educational purposes stated above.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
