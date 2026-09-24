'use client';

import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Save, X, HelpCircle, Check } from 'lucide-react';

interface Option {
  id?: string;
  text: string;
  traitPoints: string;
}

interface Question {
  id: string;
  text: string;
  order: number;
  isActive: boolean;
  module: string;
  options: Option[];
}

export default function ManageQuestionsPage() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  
  const [currentQuestion, setCurrentQuestion] = useState<Partial<Question>>({
    text: '',
    order: 1,
    isActive: true,
    module: '1',
    options: [
      { text: '', traitPoints: 'SCIENCE' },
      { text: '', traitPoints: 'COMMERCE' },
      { text: '', traitPoints: 'ARTS' },
      { text: '', traitPoints: 'TECH' }
    ]
  });

  const fetchQuestions = async () => {
    try {
      const res = await fetch('/api/admin/questions');
      const data = await res.json();
      setQuestions(data.questions || []);
    } catch (error) {
      console.error('Failed to fetch questions:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchQuestions();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const method = currentQuestion.id ? 'PUT' : 'POST';
      const url = currentQuestion.id ? `/api/admin/questions/${currentQuestion.id}` : '/api/admin/questions';
      
      await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(currentQuestion)
      });
      
      setIsEditing(false);
      fetchQuestions();
    } catch (error) {
      console.error('Failed to save question:', error);
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this question?')) return;
    try {
      await fetch(`/api/admin/questions/${id}`, { method: 'DELETE' });
      fetchQuestions();
    } catch (error) {
      console.error('Failed to delete:', error);
    }
  };

  const handleOptionChange = (index: number, field: keyof Option, value: string) => {
    const newOptions = [...(currentQuestion.options || [])];
    newOptions[index] = { ...newOptions[index], [field]: value };
    setCurrentQuestion({ ...currentQuestion, options: newOptions });
  };

  const addOption = () => {
    setCurrentQuestion({
      ...currentQuestion,
      options: [...(currentQuestion.options || []), { text: '', traitPoints: 'SCIENCE' }]
    });
  };

  const removeOption = (index: number) => {
    const newOptions = [...(currentQuestion.options || [])];
    newOptions.splice(index, 1);
    setCurrentQuestion({ ...currentQuestion, options: newOptions });
  };

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', paddingBottom: '3rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: '#0f172a', margin: '0 0 0.5rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <HelpCircle size={28} color="#3b82f6" /> Manage Career Questions
          </h1>
          <p style={{ color: '#64748b', margin: 0 }}>Add or update questions for the student career assessment.</p>
        </div>
        {!isEditing && (
          <button 
            onClick={() => {
              setCurrentQuestion({
                text: '', order: questions.length + 1, isActive: true, module: '1',
                options: [
                  { text: '', traitPoints: 'SCIENCE' }, { text: '', traitPoints: 'COMMERCE' },
                  { text: '', traitPoints: 'ARTS' }, { text: '', traitPoints: 'TECH' }
                ]
              });
              setIsEditing(true);
            }}
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#3b82f6', color: 'white', padding: '0.75rem 1.5rem', borderRadius: '8px', border: 'none', fontWeight: 600, cursor: 'pointer' }}
          >
            <Plus size={20} /> Add New Question
          </button>
        )}
      </div>

      {isEditing ? (
        <form onSubmit={handleSave} style={{ background: 'white', padding: '2rem', borderRadius: '16px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)', border: '1px solid #e2e8f0', marginBottom: '2rem' }}>
          <h2 style={{ margin: '0 0 1.5rem 0', fontSize: '1.25rem', color: '#1e293b' }}>
            {currentQuestion.id ? 'Edit Question' : 'Add New Question'}
          </h2>
          
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, color: '#475569' }}>Question Text *</label>
            <textarea 
              required
              value={currentQuestion.text}
              onChange={(e) => setCurrentQuestion({...currentQuestion, text: e.target.value})}
              style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none', minHeight: '80px', fontFamily: 'inherit' }}
              placeholder="e.g., Which of these activities do you enjoy the most?"
            />
          </div>

          <div style={{ display: 'flex', gap: '1.5rem', marginBottom: '2rem' }}>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, color: '#475569' }}>Module / Section *</label>
              <select 
                required
                value={currentQuestion.module}
                onChange={(e) => setCurrentQuestion({...currentQuestion, module: e.target.value})}
                style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none', background: 'white' }}
              >
                <option value="1">Module 1: Group Clarity</option>
                <option value="2">Module 2: Study Discipline</option>
                <option value="3">Module 3: Screen Time & Bad Habits</option>
                <option value="4">Module 4: Family Attitude</option>
                <option value="5">Module 5: Career Readiness</option>
              </select>
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, color: '#475569' }}>Display Order</label>
              <input 
                type="number" required
                value={currentQuestion.order}
                onChange={(e) => setCurrentQuestion({...currentQuestion, order: parseInt(e.target.value)})}
                style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none' }}
              />
            </div>
            <div style={{ flex: 1, display: 'flex', alignItems: 'flex-end', paddingBottom: '0.5rem' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontWeight: 600, color: '#475569' }}>
                <input 
                  type="checkbox" 
                  checked={currentQuestion.isActive}
                  onChange={(e) => setCurrentQuestion({...currentQuestion, isActive: e.target.checked})}
                  style={{ width: '20px', height: '20px' }}
                />
                Active (Visible)
              </label>
            </div>
          </div>

          <div style={{ marginBottom: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.5rem' }}>
              <label style={{ fontWeight: 600, color: '#1e293b' }}>Answer Options</label>
              <button type="button" onClick={addOption} style={{ background: 'transparent', border: 'none', color: '#3b82f6', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                <Plus size={16} /> Add Option
              </button>
            </div>

            {currentQuestion.options?.map((opt, idx) => (
              <div key={idx} style={{ display: 'flex', gap: '1rem', marginBottom: '1rem', alignItems: 'flex-start' }}>
                <div style={{ flex: 2 }}>
                  <input 
                    type="text" required placeholder={`Option ${idx + 1}`}
                    value={opt.text}
                    onChange={(e) => handleOptionChange(idx, 'text', e.target.value)}
                    style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none' }}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <select 
                    value={opt.traitPoints}
                    onChange={(e) => handleOptionChange(idx, 'traitPoints', e.target.value)}
                    style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none', background: 'white' }}
                  >
                    {currentQuestion.module === '1' ? (
                      <>
                        <option value="SCIENCE">Science / MPC / BiPC</option>
                        <option value="COMMERCE">Commerce / MEC / CEC</option>
                        <option value="ARTS">Arts / HEC</option>
                        <option value="TECH">Tech / Polytechnic</option>
                        <option value="NEUTRAL">Neutral</option>
                      </>
                    ) : (
                      <>
                        <option value="3">Positive / Excellent (3 Points)</option>
                        <option value="2">Average / Okay (2 Points)</option>
                        <option value="1">Negative / Danger (1 Point)</option>
                        <option value="0">Critical Risk (0 Points)</option>
                      </>
                    )}
                  </select>
                </div>
                <button type="button" onClick={() => removeOption(idx)} style={{ padding: '0.75rem', background: '#fee2e2', color: '#ef4444', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>
                  <Trash2 size={20} />
                </button>
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
            <button type="button" onClick={() => setIsEditing(false)} style={{ padding: '0.75rem 1.5rem', background: 'white', border: '1px solid #cbd5e1', borderRadius: '8px', color: '#475569', fontWeight: 600, cursor: 'pointer' }}>
              Cancel
            </button>
            <button type="submit" disabled={isLoading} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 1.5rem', background: '#10b981', border: 'none', borderRadius: '8px', color: 'white', fontWeight: 600, cursor: 'pointer' }}>
              <Save size={20} /> {isLoading ? 'Saving...' : 'Save Question'}
            </button>
          </div>
        </form>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {isLoading ? (
            <p>Loading questions...</p>
          ) : questions.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem', background: 'white', borderRadius: '16px', border: '1px dashed #cbd5e1' }}>
              <HelpCircle size={48} color="#94a3b8" style={{ marginBottom: '1rem' }} />
              <p style={{ color: '#64748b', fontSize: '1.1rem' }}>No questions added yet.</p>
            </div>
          ) : (
            questions.sort((a, b) => a.order - b.order).map((q) => (
              <div key={q.id} style={{ background: 'white', padding: '1.5rem', borderRadius: '16px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0', display: 'flex', gap: '1.5rem' }}>
                <div style={{ background: '#f1f5f9', color: '#475569', width: '40px', height: '40px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, flexShrink: 0 }}>
                  {q.order}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.1rem', color: '#1e293b', lineHeight: '1.5' }}>
                      {q.text}
                      {!q.isActive && <span style={{ marginLeft: '0.5rem', fontSize: '0.75rem', background: '#fee2e2', color: '#ef4444', padding: '0.2rem 0.5rem', borderRadius: '4px' }}>Inactive</span>}
                    </h3>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button onClick={() => { setCurrentQuestion(q); setIsEditing(true); window.scrollTo(0, 0); }} style={{ padding: '0.5rem', background: '#eff6ff', color: '#3b82f6', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>
                        <Edit2 size={18} />
                      </button>
                      <button onClick={() => handleDelete(q.id)} style={{ padding: '0.5rem', background: '#fee2e2', color: '#ef4444', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.5rem' }}>
                    {q.options.map(opt => (
                      <div key={opt.id} style={{ background: '#f8fafc', padding: '0.75rem', borderRadius: '8px', border: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '0.9rem', color: '#475569' }}>{opt.text}</span>
                        <span style={{ fontSize: '0.7rem', fontWeight: 700, background: '#e2e8f0', color: '#475569', padding: '0.2rem 0.4rem', borderRadius: '4px' }}>
                          {opt.traitPoints}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
