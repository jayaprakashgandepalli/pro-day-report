'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Check, ArrowRight, ArrowLeft, AlertCircle, Sparkles, Brain, Target, ShieldAlert, Users, Compass } from 'lucide-react';
import Link from 'next/link';
import { Player } from '@lottiefiles/react-lottie-player';

interface Option {
  id: string;
  text: string;
}

interface Question {
  id: string;
  text: string;
  module: string;
  options: Option[];
}

const MODULE_INFO: Record<string, { title: string, icon: any, color: string }> = {
  '1': { title: 'Section 1: Group Clarity', icon: Brain, color: '#3b82f6' },
  '2': { title: 'Section 2: Study Discipline', icon: Target, color: '#10b981' },
  '3': { title: 'Section 3: Screen Time & Habits', icon: ShieldAlert, color: '#ef4444' },
  '4': { title: 'Section 4: Family Attitude', icon: Users, color: '#8b5cf6' },
  '5': { title: 'Section 5: Career Readiness', icon: Compass, color: '#f59e0b' }
};

export default function CareerTestPage() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [profileIncomplete, setProfileIncomplete] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        const res = await fetch('/api/student/test/questions');
        const data = await res.json();
        
        if (data.profileIncomplete) {
          setProfileIncomplete(true);
          setIsLoading(false);
          return;
        }

        if (data.alreadyTaken) {
          router.push('/student/dashboard/report');
          return;
        }

        if (data.error) {
          setError(data.error);
          setIsLoading(false);
          return;
        }

        if (data.questions) {
          setQuestions(data.questions);
        }
      } catch (err) {
        setError('Failed to load questions.');
      } finally {
        setIsLoading(false);
      }
    };
    fetchQuestions();
  }, [router]);

  const handleSelectOption = (questionId: string, optionId: string) => {
    setAnswers({ ...answers, [questionId]: optionId });
    
    if (currentIndex < questions.length - 1) {
      setTimeout(() => {
        setCurrentIndex(prev => prev + 1);
      }, 400);
    }
  };

  const handleSubmit = async () => {
    if (Object.keys(answers).length < questions.length) {
      setError('Please answer all questions before submitting.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/student/test/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answers }),
      });

      if (res.ok) {
        // Delay navigation slightly so they can see the animation for at least 3 seconds
        setTimeout(() => {
          router.push('/student/dashboard/report');
        }, 3000);
      } else {
        const data = await res.json();
        setError(data.error || 'Failed to submit test.');
        setIsSubmitting(false);
      }
    } catch (err) {
      setError('An error occurred during submission.');
      setIsSubmitting(false);
    }
  };

  if (isLoading) return <div style={{ padding: '3rem', textAlign: 'center', color: '#64748b' }}>Loading Assessment...</div>;

  if (profileIncomplete) {
    return (
      <div style={{ maxWidth: '600px', margin: '2rem auto', textAlign: 'center', background: 'white', padding: '3rem', borderRadius: '24px', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.05)' }}>
        <div style={{ width: '80px', height: '80px', background: '#fef2f2', borderRadius: '50%', margin: '0 auto 1.5rem auto', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <AlertCircle size={40} color="#ef4444" />
        </div>
        <h2 style={{ fontSize: '1.75rem', color: '#0f172a', marginBottom: '1rem' }}>Profile Incomplete</h2>
        <p style={{ color: '#64748b', marginBottom: '2rem', lineHeight: '1.6' }}>
          Before taking the career assessment, we need a few more details about you (like your District and School Name) to give you the most accurate recommendations.
        </p>
        <Link 
          href="/student/dashboard/profile"
          style={{ display: 'inline-flex', background: 'linear-gradient(135deg, #6366f1, #a855f7)', color: 'white', padding: '1rem 2rem', borderRadius: '12px', textDecoration: 'none', fontWeight: 600, boxShadow: '0 4px 10px rgba(99, 102, 241, 0.3)' }}
        >
          Complete Profile Now
        </Link>
      </div>
    );
  }

  if (questions.length === 0) return <div style={{ padding: '3rem', textAlign: 'center' }}>No questions available at the moment.</div>;

  const currentQ = questions[currentIndex];
  const progress = ((currentIndex) / questions.length) * 100;
  const moduleInfo = MODULE_INFO[currentQ.module] || { title: 'Career Assessment', icon: Sparkles, color: '#6366f1' };
  const ModuleIcon = moduleInfo.icon;

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', minHeight: '80vh', display: 'flex', flexDirection: 'column', position: 'relative' }}>
      
      {/* Full-screen Loading Overlay */}
      {isSubmitting && (
        <div style={{ 
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, 
          background: 'rgba(255,255,255,0.95)', zIndex: 9999, 
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' 
        }}>
          <div style={{ width: '400px', height: '400px', maxWidth: '90%' }}>
            <Player src="/assets/animations/loading-result.json" loop={false} autoplay={true} style={{ width: '100%', height: '100%' }} />
          </div>
          <h2 style={{ color: '#1e1b4b', fontSize: '1.8rem', marginTop: '1rem', fontWeight: 700 }}>
            Analyzing Your Responses...
          </h2>
          <p style={{ color: '#64748b', fontSize: '1.1rem', marginTop: '0.5rem' }}>
            Generating your personalized career report
          </p>
        </div>
      )}

      {/* Header & Progress */}
      <header style={{ marginBottom: '3rem', position: 'relative' }}>
        <div style={{ position: 'absolute', top: '-2rem', right: '0' }}>
           <button 
             onClick={() => {
               const dummyAnswers: Record<string, string> = {};
               questions.forEach(q => {
                 if (q.options.length > 0) dummyAnswers[q.id] = q.options[0].id;
               });
               setAnswers(dummyAnswers);
               setCurrentIndex(questions.length - 1);
             }}
             style={{ background: '#f59e0b', color: 'white', padding: '0.25rem 0.5rem', borderRadius: '4px', border: 'none', cursor: 'pointer', fontSize: '0.8rem' }}
           >
             ⚡ Auto-Fill (Dev Only)
           </button>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: `${moduleInfo.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ModuleIcon color={moduleInfo.color} size={24} />
            </div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#1e1b4b', margin: 0 }}>
              {moduleInfo.title}
            </h1>
          </div>
          <span style={{ fontWeight: 600, color: '#64748b', fontSize: '0.9rem' }}>
            Q: {currentIndex + 1} of {questions.length}
          </span>
        </div>
        <div style={{ width: '100%', height: '8px', background: '#e2e8f0', borderRadius: '4px', overflow: 'hidden' }}>
          <div style={{ width: `${progress}%`, height: '100%', background: moduleInfo.color, transition: 'width 0.4s ease-out, background-color 0.4s ease' }}></div>
        </div>
      </header>

      {/* Question Card */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        {error && <div style={{ background: '#fef2f2', color: '#ef4444', padding: '1rem', borderRadius: '8px', marginBottom: '1.5rem', textAlign: 'center' }}>{error}</div>}
        
        <h2 style={{ fontSize: '2rem', color: '#0f172a', fontWeight: 700, lineHeight: '1.4', marginBottom: '2.5rem' }}>
          {currentQ.text}
        </h2>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {currentQ.options.map((opt, index) => {
            const isSelected = answers[currentQ.id] === opt.id;
            return (
              <button
                key={opt.id}
                onClick={() => handleSelectOption(currentQ.id, opt.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '1rem',
                  padding: '1.25rem 1.5rem',
                  borderRadius: '16px',
                  background: isSelected ? `${moduleInfo.color}0a` : 'white',
                  border: isSelected ? `2px solid ${moduleInfo.color}` : '2px solid #e2e8f0',
                  color: isSelected ? moduleInfo.color : '#334155',
                  fontSize: '1.1rem',
                  fontWeight: 500,
                  textAlign: 'left',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  boxShadow: isSelected ? `0 4px 15px ${moduleInfo.color}20` : '0 4px 6px rgba(0,0,0,0.02)',
                }}
                className="quiz-option"
              >
                <div style={{ 
                  width: '32px', height: '32px', borderRadius: '8px', 
                  background: isSelected ? moduleInfo.color : '#f1f5f9', 
                  color: isSelected ? 'white' : '#64748b',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600, fontSize: '0.9rem' 
                }}>
                  {String.fromCharCode(65 + index)}
                </div>
                <span style={{ flex: 1 }}>{opt.text}</span>
                {isSelected && <Check size={20} color={moduleInfo.color} />}
              </button>
            );
          })}
        </div>
      </div>

      {/* Navigation Footer */}
      <footer style={{ marginTop: '3rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #e2e8f0', paddingTop: '1.5rem' }}>
        <button 
          onClick={() => setCurrentIndex(prev => Math.max(0, prev - 1))}
          disabled={currentIndex === 0}
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'transparent', border: 'none', color: currentIndex === 0 ? '#cbd5e1' : '#64748b', cursor: currentIndex === 0 ? 'not-allowed' : 'pointer', fontWeight: 600, padding: '0.5rem' }}
        >
          <ArrowLeft size={20} /> Previous
        </button>

        {currentIndex === questions.length - 1 ? (
          <button 
            onClick={handleSubmit}
            disabled={isSubmitting || !answers[currentQ.id]}
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: (!answers[currentQ.id] || isSubmitting) ? '#cbd5e1' : moduleInfo.color, color: 'white', border: 'none', padding: '0.75rem 2rem', borderRadius: '12px', fontWeight: 600, cursor: (!answers[currentQ.id] || isSubmitting) ? 'not-allowed' : 'pointer', transition: 'all 0.2s' }}
          >
            {isSubmitting ? 'Submitting...' : 'Submit Test'} <Check size={20} />
          </button>
        ) : (
          <button 
            onClick={() => setCurrentIndex(prev => Math.min(questions.length - 1, prev + 1))}
            disabled={!answers[currentQ.id]}
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: !answers[currentQ.id] ? '#f1f5f9' : moduleInfo.color, color: !answers[currentQ.id] ? '#94a3b8' : 'white', border: 'none', padding: '0.75rem 2rem', borderRadius: '12px', fontWeight: 600, cursor: !answers[currentQ.id] ? 'not-allowed' : 'pointer', transition: 'all 0.2s' }}
          >
            Next <ArrowRight size={20} />
          </button>
        )}
      </footer>

      <style dangerouslySetInnerHTML={{__html: `
        .quiz-option:hover {
          border-color: #cbd5e1;
          transform: translateY(-2px);
        }
      `}} />
    </div>
  );
}
