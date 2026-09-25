'use client';

import React, { useState } from 'react';
import { MessageCircle, Send, PhoneCall, User, Mail, HelpCircle } from 'lucide-react';

export default function AskExpertPage() {
  const [question, setQuestion] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (question.trim().length > 0) {
      // Logic to submit the question to backend goes here
      setSubmitted(true);
      setQuestion('');
      
      // Auto reset after 3 seconds
      setTimeout(() => setSubmitted(false), 3000);
    }
  };

  return (
    <div style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto', minHeight: '100vh', fontFamily: "'Outfit', sans-serif", color: '#1e293b' }}>
      <div style={{ marginBottom: '2.5rem', textAlign: 'center' }}>
        <div style={{ display: 'inline-flex', background: '#eff6ff', padding: '1rem', borderRadius: '50%', marginBottom: '1rem' }}>
          <MessageCircle size={40} color="#2563eb" />
        </div>
        <h1 style={{ fontSize: '2.5rem', fontWeight: 700, margin: '0 0 0.5rem 0', color: '#0f172a' }}>Ask an Expert (సందేహాలు అడగండి)</h1>
        <p style={{ color: '#64748b', fontSize: '1.1rem', maxWidth: '600px', margin: '0 auto' }}>
          మీ కెరీర్ గురించి లేదా చదువు గురించి ఏదైనా గైడెన్స్ కావాలంటే ఇక్కడ అడగండి. మా కౌన్సెలర్ లేదా ఎక్స్పర్ట్ మీకు త్వరలో జవాబు ఇస్తారు.
        </p>
      </div>

      <div style={{ background: 'white', borderRadius: '24px', padding: '2rem', boxShadow: '0 10px 30px -10px rgba(0, 0, 0, 0.05)', border: '1px solid #f1f5f9' }}>
        
        {submitted ? (
          <div style={{ textAlign: 'center', padding: '3rem 1rem', animation: 'fadeIn 0.5s ease' }}>
            <div style={{ background: '#dcfce7', width: '64px', height: '64px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem auto' }}>
              <Send size={32} color="#16a34a" />
            </div>
            <h2 style={{ fontSize: '1.5rem', color: '#16a34a', marginBottom: '0.5rem' }}>ప్రశ్న పంపబడింది! (Sent Successfully)</h2>
            <p style={{ color: '#64748b' }}>మా ఎక్స్పర్ట్ త్వరలో మిమ్మల్ని సంప్రదిస్తారు.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            
            <div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600, color: '#334155', marginBottom: '0.75rem' }}>
                <HelpCircle size={18} color="#64748b" /> మీ ప్రశ్న లేదా సందేహం (Your Question):
              </label>
              <textarea
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="ఉదాహరణకు: నేను 10th లో మంచి మార్కులు తెచ్చుకున్నాను, నాకు స్కాలర్షిప్ ఎలా వస్తుంది?"
                rows={5}
                required
                style={{
                  width: '100%',
                  padding: '1rem',
                  borderRadius: '12px',
                  border: '1px solid #cbd5e1',
                  background: '#f8fafc',
                  fontSize: '1rem',
                  fontFamily: 'inherit',
                  resize: 'vertical',
                  outline: 'none',
                  transition: 'border-color 0.2s'
                }}
                onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                onBlur={(e) => e.target.style.borderColor = '#cbd5e1'}
              />
            </div>

            <div style={{ background: '#eff6ff', padding: '1rem', borderRadius: '12px', display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
              <PhoneCall size={20} color="#2563eb" style={{ flexShrink: 0, marginTop: '2px' }} />
              <p style={{ margin: 0, fontSize: '0.9rem', color: '#1e3a8a', lineHeight: 1.5 }}>
                మీరు ప్రశ్న పంపిన తర్వాత, మీరు రిజిస్టర్ చేసుకున్న మొబైల్ నెంబర్ కి మా టీమ్ నుండి కాల్ వస్తుంది. దయచేసి కాల్ లిఫ్ట్ చేసి మాట్లాడగలరు.
              </p>
            </div>

            <button
              type="submit"
              disabled={question.trim().length === 0}
              style={{
                background: question.trim().length === 0 ? '#94a3b8' : 'linear-gradient(135deg, #2563eb, #4f46e5)',
                color: 'white',
                padding: '1rem 2rem',
                borderRadius: '12px',
                border: 'none',
                fontSize: '1.1rem',
                fontWeight: 600,
                cursor: question.trim().length === 0 ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                transition: 'all 0.3s ease',
                marginTop: '1rem',
                boxShadow: question.trim().length > 0 ? '0 10px 15px -3px rgba(37, 99, 235, 0.3)' : 'none'
              }}
            >
              పంపించండి (Submit) <Send size={18} />
            </button>
          </form>
        )}
      </div>

      <style dangerouslySetInnerHTML={{__html: `
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}} />
    </div>
  );
}
