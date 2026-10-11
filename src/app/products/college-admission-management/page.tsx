'use client';

import React, { useState, useEffect, useId, useRef } from 'react';
import Link from 'next/link';
import {
  Building2,
  Users,
  TrendingUp,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  PhoneCall,
  Smartphone,
  BarChart3,
  Calendar,
  Compass,
  FileText,
  Sparkles,
  ArrowRight,
  GraduationCap,
  ChevronDown,
  ChevronRight,
  HelpCircle,
  Sliders,
  Send,
  Lock,
  Check,
  Database,
  Menu,
  X,
  Phone,
  Mail,
  FileSpreadsheet,
  AlertCircle,
  Layers,
  Search,
  Activity,
  Clock,
  Target,
  Briefcase,
  School,
  MapPin,
  RotateCcw,
  FileCheck,
  Laptop,
  Zap,
  CheckCheck,
  Star,
  SlidersHorizontal,
  Share2,
  Play,
  CheckSquare,
} from 'lucide-react';
import {
  pricingConfiguration,
  pricingPlans,
  comparisonRows,
  comparisonCategories,
  coreProductCapabilities,
  productRoles,
  admissionWorkflow,
  faqList,
} from './product-data';

export default function CollegeAdmissionManagementProductPage() {
  // Navigation & Mobile Menu
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Billing Cycle Toggle (Monthly vs Annual)
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('annual');

  // Hero Preview Role View Switcher ('management' | 'pro' | 'telecaller')
  const [heroActiveTab, setHeroActiveTab] = useState<'management' | 'pro' | 'telecaller'>('management');

  // Interactive Live Hero Lead Simulation State
  const [simulatedLeadsCount, setSimulatedLeadsCount] = useState<number>(4850);
  const [hasSimulatedLead, setHasSimulatedLead] = useState<boolean>(false);

  // Feature Explorer State & Filters
  const [selectedFeatureId, setSelectedFeatureId] = useState<string>('enquiry');
  const [activeFeatureFilter, setActiveFeatureFilter] = useState<'all' | 'star' | 'doorstep'>('all');
  const [testPhoneNumber, setTestPhoneNumber] = useState<string>('9989100000');
  const [phoneCheckStatus, setPhoneCheckStatus] = useState<'unique' | 'duplicate'>('unique');

  // Admission Workflow Interactive Step (1 to 6)
  const [activeWorkflowStep, setActiveWorkflowStep] = useState<number>(2);

  // Role Explorer State (Default: 'management')
  const [selectedRoleId, setSelectedRoleId] = useState<string>('management');

  // Collapsible Comparison Matrix
  const [comparisonExpanded, setComparisonExpanded] = useState<boolean>(false);

  // FAQs Filter and Accordion
  const [faqCategoryFilter, setFaqCategoryFilter] = useState<string>('All');
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);
  const [showAllFaqs, setShowAllFaqs] = useState<boolean>(false);

  // Demo Form State
  const [showAdvancedFormFields, setShowAdvancedFormFields] = useState<boolean>(false);
  const [selectedPlanForDemo, setSelectedPlanForDemo] = useState<string>('Whole College Suite');
  const [selectedCapabilities, setSelectedCapabilities] = useState<string[]>([
    'Field Mobile App (PRO)',
    'Telecalling Conversion Desk',
  ]);
  const [formData, setFormData] = useState({
    institutionName: '',
    contactName: '',
    phoneOrEmail: '',
    institutionType: 'Junior / Intermediate College',
    teamSize: '5–15 Team Members',
    requirements: '',
  });

  const institutionNameId = useId();
  const contactNameId = useId();
  const phoneOrEmailId = useId();
  const institutionTypeId = useId();
  const teamSizeId = useId();
  const selectedPlanId = useId();
  const requirementsId = useId();

  const [formFeedback, setFormFeedback] = useState<{
    show: boolean;
    whatsappUrl?: string;
    mailToUrl?: string;
  }>({ show: false });

  // Floating Sticky Mobile Bar Visibility Observer
  const [isFormInView, setIsFormInView] = useState(false);
  const formRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsFormInView(entry.isIntersecting);
      },
      { threshold: 0.1 }
    );

    if (formRef.current) {
      observer.observe(formRef.current);
    }

    return () => observer.disconnect();
  }, []);

  // Filter operational capabilities
  const operationalCapabilities = coreProductCapabilities.filter((c) => c.id !== 'guidance');
  const selectedFeature = operationalCapabilities.find((c) => c.id === selectedFeatureId) || operationalCapabilities[0];
  const selectedRole = productRoles.find((r) => r.id === selectedRoleId) || productRoles[0];
  const activeWorkflowItem = admissionWorkflow.find((w) => w.step === activeWorkflowStep) || admissionWorkflow[1];

  const handlePlanSelectForDemo = (planName: string) => {
    setSelectedPlanForDemo(planName);
    const formSection = document.getElementById('enquiry-form-section');
    if (formSection) {
      formSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleSimulateNewLead = () => {
    setSimulatedLeadsCount((prev) => prev + 1);
    setHasSimulatedLead(true);
    setTimeout(() => setHasSimulatedLead(false), 3500);
  };

  const toggleCapability = (cap: string) => {
    if (selectedCapabilities.includes(cap)) {
      setSelectedCapabilities(selectedCapabilities.filter((c) => c !== cap));
    } else {
      setSelectedCapabilities([...selectedCapabilities, cap]);
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.institutionName.trim() || !formData.contactName.trim() || !formData.phoneOrEmail.trim()) {
      alert('Please fill in your Institution Name, Contact Person, and Phone or Email.');
      return;
    }

    const messageLines = [
      `*SriWeb Technologies — Admission Platform Demo Request*`,
      `• Institution: ${formData.institutionName}`,
      `• Contact Person: ${formData.contactName}`,
      `• Contact Details: ${formData.phoneOrEmail}`,
      `• Selected Plan: ${selectedPlanForDemo}`,
      showAdvancedFormFields ? `• Institution Type: ${formData.institutionType}` : '',
      showAdvancedFormFields ? `• Team Size: ${formData.teamSize}` : '',
      showAdvancedFormFields && selectedCapabilities.length > 0 ? `• Capabilities: ${selectedCapabilities.join(', ')}` : '',
      formData.requirements ? `• Requirements: ${formData.requirements}` : '',
    ].filter(Boolean);

    const fullMessage = messageLines.join('\n');
    const encodedMessage = encodeURIComponent(fullMessage);

    const whatsappUrl = `https://wa.me/${pricingConfiguration.whatsappNumber}?text=${encodedMessage}`;
    const mailToUrl = `mailto:${pricingConfiguration.contactEmail}?subject=${encodeURIComponent(
      `Demo Request: ${formData.institutionName}`
    )}&body=${encodedMessage}`;

    setFormFeedback({
      show: true,
      whatsappUrl,
      mailToUrl,
    });
  };

  const filteredFaqs = faqList.filter((faq) => {
    if (faqCategoryFilter === 'All') return true;
    return faq.category === faqCategoryFilter;
  });

  const displayedFaqs = showAllFaqs ? filteredFaqs : filteredFaqs.slice(0, 6);

  return (
    <div className="min-h-screen bg-[#060B16] text-slate-100 font-sans selection:bg-blue-600 selection:text-white pb-16 lg:pb-0 overflow-x-hidden">
      
      {/* =========================================================================
          MOTION & INTERACTION SYSTEM STYLES
          ========================================================================= */}
      <style dangerouslySetInnerHTML={{ __html: `
        /* Atmospheric Tech Dot Matrix Grid */
        .hero-tech-grid {
          background-image: radial-gradient(rgba(59, 130, 246, 0.18) 1.5px, transparent 1.5px);
          background-size: 28px 28px;
        }

        /* 1. Page Opening Entrance Keyframes */
        @keyframes pageFadeUp {
          0% {
            opacity: 0;
            transform: translateY(28px);
          }
          100% {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes pageFadeScale {
          0% {
            opacity: 0;
            transform: scale(0.95) translateY(20px);
          }
          100% {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }

        /* 2. Tab Switching Transitions — Crisp, unmistakable, tactile */
        @keyframes tabSwitchEntrance {
          0% {
            opacity: 0;
            transform: translateY(14px) scale(0.985);
          }
          100% {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        @keyframes tabSwitchHorizontal {
          0% {
            opacity: 0;
            transform: translateX(-16px);
          }
          100% {
            opacity: 1;
            transform: translateX(0);
          }
        }

        /* 3. Ambient & Continuous Micro-animations */
        @keyframes ambientPulseGlow {
          0%, 100% { opacity: 0.35; transform: scale(1); }
          50% { opacity: 0.7; transform: scale(1.06); }
        }

        @keyframes floatCard1 {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-8px); }
        }

        @keyframes floatCard2 {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(8px); }
        }

        @keyframes pulseBorder {
          0%, 100% { border-color: rgba(59, 130, 246, 0.4); box-shadow: 0 0 35px -8px rgba(37,99,235,0.35); }
          50% { border-color: rgba(6, 182, 212, 0.85); box-shadow: 0 0 55px -4px rgba(6,182,212,0.45); }
        }

        @keyframes popIn {
          0% { transform: scale(0.85); opacity: 0; }
          70% { transform: scale(1.05); }
          100% { transform: scale(1); opacity: 1; }
        }

        /* Animation Utility Classes */
        .anim-fade-up {
          animation: pageFadeUp 0.75s cubic-bezier(0.16, 1, 0.3, 1) both;
        }

        .anim-fade-scale {
          animation: pageFadeScale 0.85s cubic-bezier(0.16, 1, 0.3, 1) both;
        }

        .anim-tab-content {
          animation: tabSwitchEntrance 0.35s cubic-bezier(0.16, 1, 0.3, 1) both;
        }

        .anim-tab-slide {
          animation: tabSwitchHorizontal 0.35s cubic-bezier(0.16, 1, 0.3, 1) both;
        }

        .anim-pop {
          animation: popIn 0.35s cubic-bezier(0.175, 0.885, 0.32, 1.275) both;
        }

        .anim-ambient-glow {
          animation: ambientPulseGlow 6s ease-in-out infinite;
        }

        .anim-float-1 {
          animation: floatCard1 5s ease-in-out infinite;
        }

        .anim-float-2 {
          animation: floatCard2 5.5s ease-in-out infinite;
        }

        .anim-pulse-border {
          animation: pulseBorder 3.5s ease-in-out infinite;
        }

        /* Stagger Delays */
        .delay-100 { animation-delay: 100ms !important; }
        .delay-150 { animation-delay: 150ms !important; }
        .delay-200 { animation-delay: 200ms !important; }
        .delay-250 { animation-delay: 250ms !important; }
        .delay-300 { animation-delay: 300ms !important; }
        .delay-400 { animation-delay: 400ms !important; }
        .delay-500 { animation-delay: 500ms !important; }
        .delay-600 { animation-delay: 600ms !important; }

        /* Respect Reduced Motion */
        @media (prefers-reduced-motion: reduce) {
          .anim-ambient-glow,
          .anim-float-1,
          .anim-float-2,
          .anim-pulse-border,
          .anim-fade-up,
          .anim-fade-scale,
          .anim-tab-content,
          .anim-tab-slide,
          .anim-pop {
            animation: none !important;
            transform: none !important;
          }
        }
      `}} />

      {/* =========================================================================
          GLOBAL SRIWEB TECHNOLOGIES HEADER
          ========================================================================= */}
      <header className="sticky top-0 z-50 bg-[#070D1C]/90 backdrop-blur-md border-b border-slate-800/80 transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 sm:h-18">
            
            <Link href="/" className="flex items-center gap-2.5 sm:gap-3 group">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-tr from-blue-700 via-blue-600 to-indigo-500 flex items-center justify-center text-white shadow-lg shadow-blue-600/30 group-hover:scale-105 transition-transform">
                <Building2 className="w-5 h-5" />
              </div>
              <div>
                <div className="text-base sm:text-lg font-extrabold tracking-tight text-white flex items-center gap-1.5">
                  SriWeb <span className="text-blue-400 font-semibold">Technologies</span>
                </div>
                <div className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold hidden sm:block">
                  Software, Mobile & SaaS Solutions
                </div>
              </div>
            </Link>

            <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-300">
              <Link href="/" className="hover:text-white transition">Home</Link>
              <div className="relative group py-2">
                <span className="flex items-center gap-1 text-blue-400 font-semibold cursor-pointer">
                  Products <ChevronDown className="w-3.5 h-3.5" />
                </span>
                <div className="absolute top-full left-0 w-72 bg-slate-900 border border-slate-800 rounded-xl p-2 shadow-2xl opacity-0 group-hover:opacity-100 pointer-events-none group-hover:pointer-events-auto transition-all translate-y-2 group-hover:translate-y-0">
                  <div className="p-3 rounded-lg bg-blue-950/80 border border-blue-800/60">
                    <div className="text-xs font-bold text-blue-300 flex items-center gap-1.5">
                      <GraduationCap className="w-3.5 h-3.5 text-blue-400" /> College Admission Platform
                    </div>
                    <div className="text-[11px] text-slate-400 mt-1 leading-snug">
                      Closed-Loop Admission CRM & PRO Field Suite
                    </div>
                  </div>
                </div>
              </div>
              <Link href="/services" className="hover:text-white transition">Services</Link>
              <Link href="/about" className="hover:text-white transition">About Us</Link>
              <Link href="/contact" className="hover:text-white transition">Contact</Link>
            </nav>

            <div className="hidden lg:flex items-center gap-3">
              <Link
                href="/login"
                className="text-xs font-semibold text-slate-300 hover:text-white px-3.5 py-2 rounded-lg border border-slate-800 hover:border-slate-700 transition active:scale-95"
              >
                Portal Login
              </Link>
              <a
                href="#enquiry-form-section"
                className="text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white px-4 py-2.5 rounded-lg shadow-md shadow-blue-600/30 transition flex items-center gap-1.5 active:scale-95"
              >
                Request a Demo <ArrowRight className="w-3.5 h-3.5" />
              </a>
            </div>

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-slate-400 hover:text-white focus:outline-none"
              aria-label="Toggle Navigation"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {mobileMenuOpen && (
          <div className="md:hidden bg-slate-950 border-b border-slate-800 px-4 pt-3 pb-5 space-y-2.5 text-sm">
            <Link href="/" className="block py-1.5 text-slate-300 hover:text-white">Home</Link>
            <div className="py-1.5 text-blue-400 font-semibold border-b border-slate-800 text-xs flex items-center gap-1.5">
              <GraduationCap className="w-3.5 h-3.5" /> College Admission Platform (Active)
            </div>
            <Link href="/services" className="block py-1.5 text-slate-300 hover:text-white">Services</Link>
            <Link href="/about" className="block py-1.5 text-slate-300 hover:text-white">About Us</Link>
            <Link href="/contact" className="block py-1.5 text-slate-300 hover:text-white">Contact</Link>
            <div className="pt-2 flex gap-2">
              <Link href="/login" className="flex-1 text-center py-2 rounded-lg border border-slate-700 text-xs font-semibold text-slate-200">
                Portal Login
              </Link>
              <a href="#enquiry-form-section" onClick={() => setMobileMenuOpen(false)} className="flex-1 text-center py-2 rounded-lg bg-blue-600 text-xs font-bold text-white">
                Request a Demo
              </a>
            </div>
          </div>
        )}
      </header>

      {/* =========================================================================
          SECONDARY PRODUCT SUB-NAV (STICKY & TOUCH-FRIENDLY)
          ========================================================================= */}
      <div className="sticky top-[64px] sm:top-[72px] z-40 bg-[#070D1C]/95 backdrop-blur-md border-b border-slate-800/80 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-2 gap-4 overflow-x-auto no-scrollbar">
            
            <div className="flex items-center gap-2 flex-shrink-0">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span className="text-xs font-bold text-white tracking-wide uppercase">
                Admission Platform
              </span>
            </div>

            <div className="flex items-center gap-1 text-xs font-medium text-slate-300 flex-shrink-0">
              <a href="#overview" className="px-2.5 py-1 rounded-md hover:bg-slate-800 hover:text-white transition">Overview</a>
              <a href="#transformation" className="px-2.5 py-1 rounded-md hover:bg-slate-800 hover:text-white transition">Why SriWeb</a>
              <a href="#capabilities" className="px-2.5 py-1 rounded-md hover:bg-slate-800 hover:text-white transition">Capabilities</a>
              <a href="#workflow" className="px-2.5 py-1 rounded-md hover:bg-slate-800 hover:text-white transition">Workflow</a>
              <a href="#workspaces" className="px-2.5 py-1 rounded-md hover:bg-slate-800 hover:text-white transition">Roles</a>
              <a href="#analytics" className="px-2.5 py-1 rounded-md hover:bg-slate-800 hover:text-white transition">Analytics</a>
              <a href="#pricing" className="px-2.5 py-1 rounded-md hover:bg-slate-800 hover:text-white transition">Pricing</a>
              <a href="#faqs" className="px-2.5 py-1 rounded-md hover:bg-slate-800 hover:text-white transition">FAQs</a>
            </div>

            <div className="flex items-center gap-2 flex-shrink-0">
              <a
                href="#pricing"
                className="hidden sm:inline-flex text-xs font-semibold text-slate-300 hover:text-white px-2.5 py-1 rounded-md hover:bg-slate-800 transition"
              >
                View Pricing
              </a>
              <a
                href="#enquiry-form-section"
                className="text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white px-3 py-1 rounded-md transition shadow-sm active:scale-95"
              >
                Request a Demo
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* =========================================================================
          SECTION 1: ULTRA-CREATIVE SIGNATURE HERO (THE ADMISSION COMMAND CENTER)
          ========================================================================= */}
      <section id="overview" className="relative pt-10 pb-16 sm:pt-20 sm:pb-24 overflow-hidden bg-gradient-to-b from-[#060B16] via-[#091122] to-[#060B16]">
        
        {/* Layer A — Atmospheric Background: Glowing Tech Dot Grid & Dual Radial Color Orbs */}
        <div className="absolute inset-0 hero-tech-grid opacity-35 pointer-events-none" />
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-[700px] sm:w-[1000px] h-[550px] bg-gradient-to-tr from-blue-600/30 via-indigo-600/20 to-cyan-400/15 blur-[120px] pointer-events-none anim-ambient-glow" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
            
            {/* Left Column: Headline, Copy & Conversion CTAs */}
            <div className="lg:col-span-6 space-y-5 text-center lg:text-left">
              
              {/* Eyebrow with Pulsing Cyan Indicator */}
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-950/90 border border-blue-700/60 text-blue-300 text-[11px] font-bold tracking-wider uppercase shadow-lg shadow-blue-900/20 anim-fade-up">
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping"></span>
                <span>SRIWEB TECHNOLOGIES · EDUCATION SAAS</span>
              </div>

              {/* Signature Headline */}
              <h1 className="text-3xl sm:text-5xl lg:text-[3.4rem] font-black tracking-tight text-white leading-[1.12] anim-fade-up delay-100">
                Every Admission Enquiry.{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-cyan-300 to-indigo-300 drop-shadow-[0_0_35px_rgba(56,189,248,0.4)]">
                  One Connected Platform.
                </span>
              </h1>

              {/* Supporting Text */}
              <p className="text-sm sm:text-base lg:text-lg text-slate-300 max-w-xl mx-auto lg:mx-0 leading-relaxed font-normal anim-fade-up delay-200">
                Bring field PROs, telecallers, and college management together. Capture student enquiries, coordinate follow-ups, and track admission progress in one organized workflow.
              </p>

              {/* Primary & Secondary CTAs */}
              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3.5 pt-2 anim-fade-up delay-300">
                <a
                  href="#enquiry-form-section"
                  className="w-full sm:w-auto px-7 py-3.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-extrabold text-sm tracking-wide shadow-xl shadow-blue-600/40 transition flex items-center justify-center gap-2 group active:scale-95"
                >
                  Request a Product Demo
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1.5 transition-transform" />
                </a>
                <a
                  href="#capabilities"
                  className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-slate-200 font-bold text-sm border border-slate-700/80 transition flex items-center justify-center active:scale-95 shadow-md"
                >
                  Explore Features
                </a>
              </div>

              {/* Value Badges with High Contrast */}
              <div className="pt-2 flex flex-wrap items-center justify-center lg:justify-start gap-4 text-xs text-slate-300 anim-fade-up delay-400">
                <div className="flex items-center gap-1.5 bg-slate-900/70 px-2.5 py-1 rounded-lg border border-slate-800">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>100% Institutional Lead Vault</span>
                </div>
                <div className="flex items-center gap-1.5 bg-slate-900/70 px-2.5 py-1 rounded-lg border border-slate-800">
                  <Smartphone className="w-4 h-4 text-blue-400" />
                  <span>Mobile PWA & Android Ready</span>
                </div>
                <div className="flex items-center gap-1.5 bg-slate-900/70 px-2.5 py-1 rounded-lg border border-slate-800">
                  <Zap className="w-4 h-4 text-amber-400" />
                  <span>5-Min Field-to-Desk Push</span>
                </div>
              </div>
            </div>

            {/* Right Column: Layer B (Main Dashboard Surface) + Layer C (Floating Contextual Panels) */}
            <div className="lg:col-span-6 relative anim-fade-scale delay-200">
              
              {/* Layer C: Floating Contextual Glass Panel 1 (Top-Right on Desktop) */}
              <div className="hidden xl:flex absolute -top-6 -right-6 z-20 items-center gap-2.5 bg-slate-900/95 backdrop-blur-xl px-4 py-2.5 rounded-2xl border-2 border-cyan-500/50 text-[11px] font-bold text-white shadow-2xl shadow-cyan-900/30 anim-float-1 anim-fade-up delay-300">
                <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping"></span>
                <div>
                  <div className="text-[10px] text-cyan-400 font-mono tracking-wider uppercase">⚡ INBOUND FIELD ENQUIRY</div>
                  <div className="text-white text-xs font-bold">Ch. Sai Ram (M.P.C) · Tenali Mandal</div>
                  <div className="text-[9px] text-slate-400">Auto-routed to Desk in 3m</div>
                </div>
              </div>

              {/* Layer C: Floating Contextual Glass Panel 2 (Bottom-Left on Desktop) */}
              <div className="hidden xl:flex absolute -bottom-6 -left-6 z-20 items-center gap-2.5 bg-slate-900/95 backdrop-blur-xl px-4 py-2.5 rounded-2xl border-2 border-emerald-500/50 text-[11px] font-bold text-emerald-300 shadow-2xl shadow-emerald-900/30 anim-float-2 anim-fade-up delay-400">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                <div>
                  <div className="text-[10px] text-emerald-400 font-mono tracking-wider uppercase">✓ DOORSTEP VERIFIED</div>
                  <div className="text-white text-xs font-bold">PRO Suresh · ZPHS Miryalaguda</div>
                  <div className="text-[9px] text-slate-400">Parent met · Admission token booked</div>
                </div>
              </div>

              {/* Layer B: Main Admission Command Center Dashboard Surface */}
              <div className="relative rounded-2xl sm:rounded-3xl bg-[#091122]/95 backdrop-blur-xl p-2.5 sm:p-4 border-2 border-blue-500/40 shadow-[0_0_50px_-10px_rgba(37,99,235,0.35)] overflow-hidden anim-pulse-border transition-all">
                
                {/* Window Chrome Header & Interactive Role Switcher */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between px-3 py-2 border-b border-slate-800 gap-2.5">
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
                      <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                    </div>
                    <span className="font-mono text-[10px] text-slate-400 font-bold hidden sm:inline">
                      ● LIVE ADMISSION COMMAND CENTER
                    </span>
                  </div>

                  {/* 3-Way Role Switcher with Animated Tabs */}
                  <div
                    role="tablist"
                    aria-label="Hero role dashboard selector"
                    className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800 self-start sm:self-auto shadow-inner gap-1"
                  >
                    <button
                      role="tab"
                      aria-selected={heroActiveTab === 'management'}
                      onClick={() => setHeroActiveTab('management')}
                      className={`px-3 py-1.5 text-[11px] font-bold rounded-lg transition-all duration-200 transform active:scale-95 ${
                        heroActiveTab === 'management'
                          ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-600/40 scale-[1.03]'
                          : 'text-slate-400 hover:text-white hover:bg-slate-900/60'
                      }`}
                    >
                      👑 Executive Overview
                    </button>
                    <button
                      role="tab"
                      aria-selected={heroActiveTab === 'pro'}
                      onClick={() => setHeroActiveTab('pro')}
                      className={`px-3 py-1.5 text-[11px] font-bold rounded-lg transition-all duration-200 transform active:scale-95 ${
                        heroActiveTab === 'pro'
                          ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-600/40 scale-[1.03]'
                          : 'text-slate-400 hover:text-white hover:bg-slate-900/60'
                      }`}
                    >
                      📱 Field PRO
                    </button>
                    <button
                      role="tab"
                      aria-selected={heroActiveTab === 'telecaller'}
                      onClick={() => setHeroActiveTab('telecaller')}
                      className={`px-3 py-1.5 text-[11px] font-bold rounded-lg transition-all duration-200 transform active:scale-95 ${
                        heroActiveTab === 'telecaller'
                          ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-600/40 scale-[1.03]'
                          : 'text-slate-400 hover:text-white hover:bg-slate-900/60'
                      }`}
                    >
                      🎧 Telecaller Desk
                    </button>
                  </div>
                </div>

                {/* Switchable Dashboard Canvas with Keyed Entrance Animation */}
                <div key={heroActiveTab} className="p-3 sm:p-4 bg-slate-950/70 rounded-xl space-y-3.5 anim-tab-content">
                  
                  {/* ROLE VIEW 1: EXECUTIVE COMMAND (CHAIRMAN / PRINCIPAL) */}
                  {heroActiveTab === 'management' && (
                    <div className="space-y-3">
                      {/* Top Bar with Live Simulation Action */}
                      <div className="flex items-center justify-between bg-slate-900/80 p-2.5 rounded-xl border border-slate-800">
                        <div className="flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
                          <span className="text-xs font-bold text-white">Hyderabad Central Campus · AY 2026-27</span>
                        </div>
                        <button
                          onClick={handleSimulateNewLead}
                          className="px-2.5 py-1 rounded-lg bg-blue-600/90 hover:bg-blue-500 text-white font-bold text-[10px] flex items-center gap-1.5 shadow-sm active:scale-95 transition"
                          title="Click to test live pipeline reaction"
                        >
                          <Play className="w-3 h-3 text-cyan-300" /> Simulate Lead +1
                        </button>
                      </div>

                      {hasSimulatedLead && (
                        <div className="p-2 rounded-lg bg-emerald-950/80 border border-emerald-500 text-emerald-300 text-xs font-bold flex items-center justify-between anim-pop shadow-lg shadow-emerald-950/40">
                          <span>🎉 Inbound Lead Injected: K. Vamshi (BiPC) · Verified Phone Number</span>
                          <span className="text-[10px] text-emerald-400 font-mono">Dispatched to Telecaller Queue</span>
                        </div>
                      )}

                      {/* 4 Metric Tiles */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        <div className="bg-slate-900 p-2.5 rounded-xl border border-slate-800">
                          <div className="text-[10px] text-slate-400 font-medium">Total Enquiries</div>
                          <div className="text-lg sm:text-xl font-extrabold text-white">
                            {simulatedLeadsCount.toLocaleString()}
                          </div>
                          <div className="text-[9px] text-emerald-400 flex items-center gap-0.5 font-bold">
                            <TrendingUp className="w-2.5 h-2.5" /> +14.2% Velocity
                          </div>
                        </div>
                        <div className="bg-slate-900 p-2.5 rounded-xl border border-slate-800">
                          <div className="text-[10px] text-slate-400 font-medium">New Today</div>
                          <div className="text-lg sm:text-xl font-extrabold text-blue-400">42 Leads</div>
                          <div className="text-[9px] text-blue-300 font-medium">14 High Schools</div>
                        </div>
                        <div className="bg-slate-900 p-2.5 rounded-xl border border-slate-800">
                          <div className="text-[10px] text-slate-400 font-medium">Follow-ups Due</div>
                          <div className="text-lg sm:text-xl font-extrabold text-amber-400">48 Active</div>
                          <div className="text-[9px] text-amber-300 font-medium">8 Desks Dialing</div>
                        </div>
                        <div className="bg-slate-900 p-2.5 rounded-xl border border-slate-800">
                          <div className="text-[10px] text-slate-400 font-medium">Confirmed Seats</div>
                          <div className="text-lg sm:text-xl font-extrabold text-emerald-400">624</div>
                          <div className="text-[9px] text-emerald-300 font-bold">78% Quota Filled</div>
                        </div>
                      </div>

                      {/* Stream Quota Intake Progress */}
                      <div className="bg-slate-900/90 p-3 rounded-xl border border-slate-800 space-y-2">
                        <div className="flex items-center justify-between text-[11px] font-bold text-slate-200">
                          <span>Stream Seat Allocation Velocity</span>
                          <span className="text-cyan-400 font-mono text-[10px]">Campus Cap: 800 Seats</span>
                        </div>
                        <div className="space-y-1.5 text-[10px]">
                          <div>
                            <div className="flex justify-between text-slate-300 pb-0.5">
                              <span>MPC (Maths, Physics, Chem)</span>
                              <span className="font-semibold text-emerald-400">280 / 300 (93%)</span>
                            </div>
                            <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                              <div className="bg-emerald-500 h-full w-[93%]" />
                            </div>
                          </div>
                          <div>
                            <div className="flex justify-between text-slate-300 pb-0.5">
                              <span>BiPC (Biology & Medicine)</span>
                              <span className="font-semibold text-blue-400">194 / 220 (88%)</span>
                            </div>
                            <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                              <div className="bg-blue-500 h-full w-[88%]" />
                            </div>
                          </div>
                          <div>
                            <div className="flex justify-between text-slate-300 pb-0.5">
                              <span>CEC & MEC (Commerce & Math)</span>
                              <span className="font-semibold text-indigo-400">150 / 180 (83%)</span>
                            </div>
                            <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                              <div className="bg-indigo-500 h-full w-[83%]" />
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Recent Student Pipeline Activity */}
                      <div className="bg-slate-900/90 rounded-xl border border-slate-800 divide-y divide-slate-800/80 text-xs">
                        <div className="p-2.5 flex items-center justify-between">
                          <div>
                            <div className="font-bold text-white text-[11px]">Sai Teja Reddy (MPC Stream)</div>
                            <div className="text-[10px] text-slate-400">ZPHS Miryalaguda · PRO: Suresh · App #APP-2026-891</div>
                          </div>
                          <span className="px-2.5 py-0.5 text-[10px] font-bold rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800">
                            Admitted
                          </span>
                        </div>
                        <div className="p-2.5 flex items-center justify-between">
                          <div>
                            <div className="font-bold text-white text-[11px]">Anusha Bhavani (BiPC Stream)</div>
                            <div className="text-[10px] text-slate-400">Telecaller: Divya · Campus Visit Scheduled Saturday</div>
                          </div>
                          <span className="px-2.5 py-0.5 text-[10px] font-bold rounded-full bg-blue-950 text-cyan-300 border border-blue-800">
                            Visit Booked
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* ROLE VIEW 2: FIELD PRO MOBILE APP */}
                  {heroActiveTab === 'pro' && (
                    <div className="space-y-3">
                      <div className="bg-slate-900 p-3 rounded-xl border border-slate-800 flex items-center justify-between">
                        <div>
                          <div className="text-[10px] font-bold text-cyan-400 uppercase">Field Officer Login</div>
                          <div className="text-sm font-extrabold text-white">K. Suresh (Miryalaguda Mandal)</div>
                        </div>
                        <span className="px-2.5 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800 text-[10px] font-bold">
                          ● GPS Online
                        </span>
                      </div>

                      <div className="grid grid-cols-3 gap-2 text-center">
                        <div className="bg-slate-900 p-2.5 rounded-xl border border-slate-800">
                          <div className="text-[9px] text-slate-400 font-medium">Today Visits</div>
                          <div className="text-base font-bold text-white">14 / 16</div>
                        </div>
                        <div className="bg-slate-900 p-2.5 rounded-xl border border-slate-800">
                          <div className="text-[9px] text-slate-400 font-medium">Doorsteps Done</div>
                          <div className="text-base font-bold text-emerald-400">9 Homes</div>
                        </div>
                        <div className="bg-slate-900 p-2.5 rounded-xl border border-slate-800">
                          <div className="text-[9px] text-slate-400 font-medium">Leads Logged</div>
                          <div className="text-base font-bold text-blue-400">28 Today</div>
                        </div>
                      </div>

                      {/* PRO Action Card Mockup */}
                      <div className="bg-slate-900 p-3 rounded-xl border border-slate-800 space-y-2 text-xs">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-white text-[12px]">ZPHS High School, Alwal</span>
                          <span className="text-[9px] text-amber-300 bg-amber-950/90 px-2 py-0.5 rounded-full border border-amber-800 font-bold">
                            Grade A+ (140 Std)
                          </span>
                        </div>
                        <div className="text-[10px] text-slate-300">
                          Headmaster: S. Rama Rao · Met at 11:30 AM · Distributed College Prospectus & Admission Kits
                        </div>
                        <div className="flex items-center gap-2 pt-1">
                          <span className="text-[10px] text-emerald-400 font-bold bg-emerald-950 px-2.5 py-1 rounded-lg border border-emerald-800 flex items-center gap-1">
                            <Check className="w-3 h-3" /> Doorstep Verified
                          </span>
                          <span className="text-[10px] text-cyan-300 font-bold bg-blue-950 px-2.5 py-1 rounded-lg border border-blue-800 flex items-center gap-1">
                            <Share2 className="w-3 h-3" /> 1-Click WhatsApp PDF
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* ROLE VIEW 3: TELECALLER CONVERSION DESK */}
                  {heroActiveTab === 'telecaller' && (
                    <div className="space-y-3">
                      <div className="bg-slate-900 p-3 rounded-xl border border-slate-800 flex items-center justify-between">
                        <div>
                          <div className="text-[10px] font-bold text-cyan-400 uppercase">Counseling Desk #04</div>
                          <div className="text-sm font-extrabold text-white">Counselor: Anjali Sharma</div>
                        </div>
                        <span className="px-2.5 py-0.5 rounded-full bg-blue-950 text-blue-300 border border-blue-800 text-[10px] font-bold">
                          Queue: 18 Callbacks
                        </span>
                      </div>

                      <div className="grid grid-cols-3 gap-2 text-center">
                        <div className="bg-slate-900 p-2.5 rounded-xl border border-slate-800">
                          <div className="text-[9px] text-slate-400 font-medium">Dials Today</div>
                          <div className="text-base font-bold text-white">86 Calls</div>
                        </div>
                        <div className="bg-slate-900 p-2.5 rounded-xl border border-slate-800">
                          <div className="text-[9px] text-slate-400 font-medium">Interested</div>
                          <div className="text-base font-bold text-emerald-400">34 Leads</div>
                        </div>
                        <div className="bg-slate-900 p-2.5 rounded-xl border border-slate-800">
                          <div className="text-[9px] text-slate-400 font-medium">Visits Booked</div>
                          <div className="text-base font-bold text-cyan-400">7 Campus Visits</div>
                        </div>
                      </div>

                      {/* Active Lead Call Box */}
                      <div className="bg-slate-900 p-3 rounded-xl border border-slate-800 space-y-2 text-xs">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-white text-[12px]">Lead: P. Bhavani (MPC Stream)</span>
                          <span className="text-[9px] text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded-full border border-emerald-800 font-bold">
                            PRO Synced 12m Ago
                          </span>
                        </div>
                        <div className="text-[10px] text-slate-300">
                          Father: P. Krishna (Farmer) · Marks: 9.4 GPA · PRO Note: Father interested in campus hostel facility
                        </div>
                        <div className="flex items-center justify-between pt-1">
                          <span className="text-[10px] text-amber-300 font-medium">Callback Alarm: Today 4:30 PM</span>
                          <button className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-[11px] font-bold flex items-center gap-1 active:scale-95 shadow-md">
                            <PhoneCall className="w-3.5 h-3.5" /> Dial Now
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  <p className="text-[9px] text-slate-500 italic text-center pt-1">
                    * Illustrative demonstration preview of platform models and workflows.
                  </p>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* =========================================================================
          SECTION 2: THE REALITY / TRANSFORMATION (BEFORE VS AFTER)
          ========================================================================= */}
      <section id="transformation" className="py-14 sm:py-20 bg-[#070D1C] border-t border-slate-800 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-2xl mx-auto mb-12 space-y-2.5">
            <span className="text-xs uppercase font-extrabold tracking-widest text-blue-400 bg-blue-950/80 px-3.5 py-1 rounded-full border border-blue-900">
              OPERATIONAL REALITY CHECK
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
              Why Disorganized Admission Campaigns Lose Seats.
            </h2>
            <p className="text-xs sm:text-sm text-slate-400">
              Traditional admission drives rely on paper notebooks, delayed calls, and unverified travel. SriWeb replaces field friction with closed-loop certainty.
            </p>
          </div>

          {/* High-Contrast Split Comparison */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-7 items-stretch">
            
            {/* The Old Way: Disorganized Manual Chaos */}
            <div className="bg-slate-950/90 rounded-2xl border-2 border-rose-900/60 p-6 sm:p-8 space-y-4 shadow-xl flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 text-rose-400 font-bold text-xs uppercase tracking-wider mb-2">
                  <XCircle className="w-4 h-4 text-rose-500" /> Traditional Manual Chaos
                </div>
                <h3 className="text-xl font-bold text-white mb-2">
                  Paper Diaries, Cold Leads & Staff Lead Theft
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed mb-4">
                  Field officers record student names in personal paper notebooks. By the time lists reach campus telecallers weeks later, rival colleges have already enrolled the student.
                </p>

                <div className="space-y-3">
                  <div className="flex items-start gap-2.5 text-xs text-slate-300 bg-rose-950/30 p-3 rounded-xl border border-rose-900/40">
                    <X className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
                    <span><strong>Lead Data Theft:</strong> When a PRO resigns, they walk away with student diaries and headmaster contacts.</span>
                  </div>
                  <div className="flex items-start gap-2.5 text-xs text-slate-300 bg-rose-950/30 p-3 rounded-xl border border-rose-900/40">
                    <X className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
                    <span><strong>Cold Outreach:</strong> Rural leads take 2 to 3 weeks to reach office telecallers.</span>
                  </div>
                  <div className="flex items-start gap-2.5 text-xs text-slate-300 bg-rose-950/30 p-3 rounded-xl border border-rose-900/40">
                    <X className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
                    <span><strong>Headmaster Resistance:</strong> Schools reject commercial college reps trying to sell seats.</span>
                  </div>
                  <div className="flex items-start gap-2.5 text-xs text-slate-300 bg-rose-950/30 p-3 rounded-xl border border-rose-900/40">
                    <X className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
                    <span><strong>Blind Management:</strong> Directors only learn of enrollment deficits in late June when it is too late.</span>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-rose-900/40 text-[11px] text-rose-300 font-mono">
                Result: Lost market share, wasted marketing expenditure, zero institutional continuity.
              </div>
            </div>

            {/* The SriWeb Way: Complete Operational Control */}
            <div className="bg-gradient-to-b from-[#0B1A3A] via-[#09152E] to-[#070E22] rounded-2xl border-2 border-blue-500 p-6 sm:p-8 space-y-4 shadow-[0_0_40px_rgba(37,99,235,0.25)] flex flex-col justify-between relative overflow-hidden">
              <div className="absolute top-0 right-0 w-40 h-40 bg-blue-500/15 rounded-full blur-3xl pointer-events-none" />
              
              <div>
                <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs uppercase tracking-wider mb-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" /> The SriWeb Closed-Loop Advantage
                </div>
                <h3 className="text-xl font-bold text-white mb-2">
                  100% Institutional Lead Vault & Real-Time Sync
                </h3>
                <p className="text-xs text-slate-200 leading-relaxed mb-4">
                  Every contact belongs to your encrypted institutional vault. The moment a PRO speaks with a student, the campus telecaller receives an instant notification to follow up.
                </p>

                <div className="space-y-3">
                  <div className="flex items-start gap-2.5 text-xs text-slate-100 bg-slate-950/80 p-3 rounded-xl border border-blue-700/60 shadow-md">
                    <Check className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5 font-bold" />
                    <span><strong>Institutional Data Vault:</strong> 100% data lock. Staff turnover never wipes your historical contacts.</span>
                  </div>
                  <div className="flex items-start gap-2.5 text-xs text-slate-100 bg-slate-950/80 p-3 rounded-xl border border-blue-700/60 shadow-md">
                    <Check className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5 font-bold" />
                    <span><strong>5-Minute Dispatch:</strong> Leads captured on the field trigger desk callbacks while parents are still warm.</span>
                  </div>
                  <div className="flex items-start gap-2.5 text-xs text-slate-100 bg-slate-950/80 p-3 rounded-xl border border-blue-700/60 shadow-md">
                    <Check className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5 font-bold" />
                    <span><strong>Doorstep Verification:</strong> GPS-stamped PRO visit records with photo proof and direct parent consent.</span>
                  </div>
                  <div className="flex items-start gap-2.5 text-xs text-slate-100 bg-slate-950/80 p-3 rounded-xl border border-blue-700/60 shadow-md">
                    <Check className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5 font-bold" />
                    <span><strong>Live Intake Funnel:</strong> Real-time quota gauges for MPC, BiPC, CEC with spot application numbering.</span>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-blue-700/50 text-[11px] text-blue-200 font-mono flex items-center justify-between">
                <span>Result: Predictable seat fulfillment and higher admission conversion velocity.</span>
                <span className="text-emerald-400 font-bold">100% Verified</span>
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* =========================================================================
          SECTION 3: CORE CAPABILITIES (ASYMMETRIC INTERACTIVE EXPLORER)
          ========================================================================= */}
      <section id="capabilities" className="py-14 sm:py-20 bg-[#060B16] border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-2xl mx-auto mb-12 space-y-2.5">
            <span className="text-xs uppercase font-extrabold tracking-widest text-blue-400 bg-blue-950/80 px-3.5 py-1 rounded-full border border-blue-900">
              ASYMMETRIC FEATURE EXPLORER
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
              Explore Real Operational Capabilities.
            </h2>
            <p className="text-xs sm:text-sm text-slate-400">
              Select an operational engine to inspect its actual workflows, realistic interfaces, and business impact.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            
            {/* Left 4 Cols: Category Navigation Pills */}
            <div
              role="tablist"
              aria-label="Operational Capabilities Categories"
              className="lg:col-span-4 space-y-2.5"
            >
              {operationalCapabilities.map((cap) => {
                const isSelected = selectedFeatureId === cap.id;
                return (
                  <button
                    key={cap.id}
                    role="tab"
                    aria-selected={isSelected}
                    onClick={() => setSelectedFeatureId(cap.id)}
                    className={`w-full text-left p-4 rounded-xl border transition-all duration-200 flex items-start justify-between gap-3 active:scale-[0.98] ${
                      isSelected
                        ? 'bg-blue-600/20 border-blue-500 shadow-lg shadow-blue-600/25 scale-[1.02]'
                        : 'bg-slate-900/80 border-slate-800 hover:bg-slate-850 hover:border-slate-700'
                    }`}
                  >
                    <div>
                      <div className={`text-sm font-bold ${isSelected ? 'text-cyan-300' : 'text-white'}`}>
                        {cap.title}
                      </div>
                      <div className="text-[11px] text-slate-400 line-clamp-1 mt-0.5 font-normal">
                        {cap.tagline}
                      </div>
                    </div>
                    <ChevronRight className={`w-4 h-4 flex-shrink-0 transition-transform ${isSelected ? 'translate-x-1 text-cyan-300' : 'text-slate-600'}`} />
                  </button>
                );
              })}
            </div>

            {/* Right 8 Cols: Interactive Realistic Mockup Surface */}
            <div
              key={selectedFeatureId}
              role="tabpanel"
              className="lg:col-span-8 bg-slate-900/90 rounded-2xl border border-slate-800 p-5 sm:p-7 shadow-xl space-y-5 anim-tab-content"
            >
              
              {/* Header of selected category */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
                <div>
                  <h3 className="text-xl sm:text-2xl font-black text-white">
                    {selectedFeature.title}
                  </h3>
                  <p className="text-xs text-cyan-300 font-medium mt-0.5">
                    &ldquo;{selectedFeature.tagline}&rdquo;
                  </p>
                </div>
                <span className="text-[10px] uppercase font-bold text-emerald-400 bg-emerald-950/80 px-2.5 py-1 rounded-full border border-emerald-800 self-start sm:self-auto">
                  Verified Engine
                </span>
              </div>

              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                {selectedFeature.description}
              </p>

              {/* Simulated Live Table / Interaction */}
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-2.5">
                  <div className="flex items-center gap-2 text-xs font-bold text-white">
                    <Database className="w-3.5 h-3.5 text-blue-400" />
                    <span>Interactive Preview: {selectedFeature.title}</span>
                  </div>
                  
                  {/* Filter Pills */}
                  <div className="flex items-center gap-1 text-[10px]">
                    <button
                      onClick={() => setActiveFeatureFilter('all')}
                      className={`px-2.5 py-1 rounded-lg transition ${
                        activeFeatureFilter === 'all' ? 'bg-blue-600 text-white font-bold' : 'bg-slate-900 text-slate-400'
                      }`}
                    >
                      All Records
                    </button>
                    <button
                      onClick={() => setActiveFeatureFilter('star')}
                      className={`px-2.5 py-1 rounded-lg transition ${
                        activeFeatureFilter === 'star' ? 'bg-amber-600 text-white font-bold' : 'bg-slate-900 text-slate-400'
                      }`}
                    >
                      ★ Star Leads
                    </button>
                    <button
                      onClick={() => setActiveFeatureFilter('doorstep')}
                      className={`px-2.5 py-1 rounded-lg transition ${
                        activeFeatureFilter === 'doorstep' ? 'bg-emerald-600 text-white font-bold' : 'bg-slate-900 text-slate-400'
                      }`}
                    >
                      ✓ Doorstep Done
                    </button>
                  </div>
                </div>

                {/* Data Rows Preview */}
                <div className="space-y-2 text-xs">
                  {selectedFeatureId === 'enquiry' && (
                    <>
                      <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-between">
                        <div>
                          <div className="font-bold text-white text-[12px] flex items-center gap-1.5">
                            Ch. Sai Ram <span className="text-[9px] text-amber-300 bg-amber-950 px-1.5 py-0.5 rounded font-bold">★ Star Lead</span>
                          </div>
                          <div className="text-[10px] text-slate-400">Father: Ch. Venkatesh (Business) · Tenali Mandal · Stream: MPC</div>
                        </div>
                        <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950 px-2.5 py-1 rounded-lg border border-emerald-800">
                          Doorstep Verified
                        </span>
                      </div>
                      <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-between">
                        <div>
                          <div className="font-bold text-white text-[12px]">K. Manisha (BiPC Stream)</div>
                          <div className="text-[10px] text-slate-400">Father: K. Srinivasa Rao (Farmer) · Repalle Mandal · Phone Checked ✓</div>
                        </div>
                        <span className="text-[10px] font-bold text-cyan-300 bg-blue-950 px-2.5 py-1 rounded-lg border border-blue-800">
                          Follow-up Scheduled
                        </span>
                      </div>
                    </>
                  )}

                  {selectedFeatureId === 'pro' && (
                    <>
                      <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-between">
                        <div>
                          <div className="font-bold text-white text-[12px]">ZPHS High School (Miryalaguda)</div>
                          <div className="text-[10px] text-slate-400">HM: B. Narayana (Ph: +91 98480...) · Grade A+ (120 Tenth Students)</div>
                        </div>
                        <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950 px-2.5 py-1 rounded-lg border border-emerald-800">
                          Visited 11:30 AM
                        </span>
                      </div>
                      <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-between">
                        <div>
                          <div className="font-bold text-white text-[12px]">Village Elder: Sarpanch K. Reddy</div>
                          <div className="text-[10px] text-slate-400">Village: Chinthapalli · Key Influencer for 35 Local Families</div>
                        </div>
                        <span className="text-[10px] font-bold text-indigo-300 bg-indigo-950 px-2.5 py-1 rounded-lg border border-indigo-800">
                          Influencer Mapped
                        </span>
                      </div>
                    </>
                  )}

                  {selectedFeatureId === 'telecaller' && (
                    <>
                      <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-between">
                        <div>
                          <div className="font-bold text-white text-[12px]">Callback: M. Tarun (MPC)</div>
                          <div className="text-[10px] text-slate-400">Scheduled: 4:30 PM Today · Note: Parent requested hostel fee concession details</div>
                        </div>
                        <span className="text-[10px] font-bold text-amber-300 bg-amber-950 px-2.5 py-1 rounded-lg border border-amber-800">
                          Alarm Pending
                        </span>
                      </div>
                      <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-between">
                        <div>
                          <div className="font-bold text-white text-[12px]">Campus Visit: G. Anusha (BiPC)</div>
                          <div className="text-[10px] text-slate-400">Slot: Saturday 10:30 AM · Counselor: Divya · Transport Coordinated</div>
                        </div>
                        <span className="text-[10px] font-bold text-cyan-300 bg-blue-950 px-2.5 py-1 rounded-lg border border-blue-800">
                          Visit Confirmed
                        </span>
                      </div>
                    </>
                  )}

                  {selectedFeatureId === 'pipeline' && (
                    <>
                      <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-between">
                        <div>
                          <div className="font-bold text-white text-[12px]">App #APP-2026-419 · Sai Charan</div>
                          <div className="text-[10px] text-slate-400">Stream: MPC · Spot Token Issued · Fee Status: Paid Application Fee</div>
                        </div>
                        <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950 px-2.5 py-1 rounded-lg border border-emerald-800">
                          Seat Locked
                        </span>
                      </div>
                      <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-between">
                        <div>
                          <div className="font-bold text-white text-[12px]">Capacity Alert: BiPC Stream (Medical)</div>
                          <div className="text-[10px] text-slate-400">194 / 220 Seats Filled · Remaining: 26 Seats before waitlisting</div>
                        </div>
                        <span className="text-[10px] font-bold text-amber-300 bg-amber-950 px-2.5 py-1 rounded-lg border border-amber-800">
                          88% Full
                        </span>
                      </div>
                    </>
                  )}

                  {selectedFeatureId === 'territory' && (
                    <>
                      <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-between">
                        <div>
                          <div className="font-bold text-white text-[12px]">Mandal: Huzurnagar (18 High Schools)</div>
                          <div className="text-[10px] text-slate-400">Visited: 16 Schools · Target Leads: 240 · Captured: 218 Leads</div>
                        </div>
                        <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950 px-2.5 py-1 rounded-lg border border-emerald-800">
                          91% Penetration
                        </span>
                      </div>
                      <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-between">
                        <div>
                          <div className="font-bold text-white text-[12px]">Mandal: Kodad (14 High Schools)</div>
                          <div className="text-[10px] text-slate-400">Visited: 9 Schools · 5 Unvisited High-Yield Grade A+ Campuses</div>
                        </div>
                        <span className="text-[10px] font-bold text-rose-400 bg-rose-950 px-2.5 py-1 rounded-lg border border-rose-800">
                          Coverage Needed
                        </span>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* 4 Feature Bullet Points */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                {selectedFeature.capabilities.slice(0, 4).map((cap, idx) => (
                  <div key={idx} className="flex items-start gap-2 text-xs text-slate-200 bg-slate-950/70 p-3 rounded-xl border border-slate-800">
                    <Check className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5 font-bold" />
                    <span>{cap}</span>
                  </div>
                ))}
              </div>

              {/* Business Value Highlight */}
              <div className="p-3.5 rounded-xl bg-blue-950/60 border border-blue-900 text-xs text-blue-200 flex items-center justify-between gap-3 shadow-md">
                <span className="flex items-center gap-1.5 font-medium">
                  <Sparkles className="w-4 h-4 text-cyan-300 flex-shrink-0" />
                  <strong>Business ROI:</strong> {selectedFeature.businessValue}
                </span>
                <a
                  href="#enquiry-form-section"
                  className="text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 px-3.5 py-2 rounded-xl transition whitespace-nowrap active:scale-95 shadow-md"
                >
                  Request Demo &rarr;
                </a>
              </div>

            </div>

          </div>

        </div>
      </section>

      {/* =========================================================================
          SECTION 4: CONNECTED INTERACTIVE ADMISSION WORKFLOW
          ========================================================================= */}
      <section id="workflow" className="py-14 sm:py-20 bg-[#070D1C] border-t border-slate-800 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-2xl mx-auto mb-12 space-y-2.5">
            <span className="text-xs uppercase font-extrabold tracking-widest text-blue-400 bg-blue-950/80 px-3.5 py-1 rounded-full border border-blue-900">
              CLOSED-LOOP ADMISSION LIFECYCLE
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
              The 6-Stage Admission Coordination Pipeline.
            </h2>
            <p className="text-xs sm:text-sm text-slate-400">
              Tap any step below to trace how prospective student data flows seamlessly between field officers, phone counselors, and registrars.
            </p>
          </div>

          {/* Stepper Bar */}
          <div
            role="tablist"
            aria-label="6-Stage Admission Timeline"
            className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 mb-7"
          >
            {admissionWorkflow.map((stage) => {
              const isActive = activeWorkflowStep === stage.step;
              return (
                <button
                  key={stage.step}
                  role="tab"
                  aria-selected={isActive}
                  onClick={() => setActiveWorkflowStep(stage.step)}
                  className={`p-3.5 rounded-xl border text-left transition-all flex flex-col justify-between active:scale-[0.98] ${
                    isActive
                      ? 'bg-gradient-to-b from-blue-600 to-indigo-600 text-white border-blue-400 shadow-xl shadow-blue-600/30'
                      : 'bg-slate-950 text-slate-300 border-slate-800 hover:bg-slate-850 hover:text-white'
                  }`}
                >
                  <div className="flex items-center justify-between w-full text-[10px] font-bold pb-1">
                    <span className={`w-5 h-5 rounded-full flex items-center justify-center font-extrabold ${isActive ? 'bg-white text-blue-700' : 'bg-slate-800 text-slate-300'}`}>
                      {stage.step}
                    </span>
                    <span className={`uppercase text-[9px] font-bold ${isActive ? 'text-blue-100' : 'text-slate-500'}`}>
                      {stage.actor}
                    </span>
                  </div>
                  <div>
                    <div className="text-xs font-black mt-1">{stage.name}</div>
                    <div className={`text-[10px] line-clamp-1 ${isActive ? 'text-blue-100' : 'text-slate-400'}`}>
                      {stage.title}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Detailed Active Stage Inspector Panel */}
          <div
            key={activeWorkflowStep}
            role="tabpanel"
            className="bg-slate-950 rounded-2xl border-2 border-blue-700/60 p-6 sm:p-8 shadow-2xl space-y-4 anim-tab-content"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3.5">
              <div>
                <span className="text-[10px] uppercase font-bold text-cyan-400 tracking-wider">
                  Stage {activeWorkflowItem.step} of 6 · Primary Actor: {activeWorkflowItem.actor}
                </span>
                <h3 className="text-xl sm:text-2xl font-black text-white mt-0.5">
                  {activeWorkflowItem.name}: {activeWorkflowItem.title}
                </h3>
              </div>
              <span className="text-xs font-bold text-emerald-400 bg-emerald-950 px-3.5 py-1.5 rounded-full border border-emerald-800 self-start sm:self-auto flex items-center gap-1.5 shadow-sm">
                <Check className="w-4 h-4 font-bold" /> Outcome Verified
              </span>
            </div>

            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-3xl">
              {activeWorkflowItem.description}
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
              <div className="p-3.5 bg-slate-900 rounded-xl border border-slate-800 space-y-1">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Operational Milestone:
                </div>
                <div className="text-xs font-semibold text-white flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  {activeWorkflowItem.outcome}
                </div>
              </div>

              <div className="p-3.5 bg-slate-900 rounded-xl border border-slate-800 space-y-1">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Closed-Loop Feedback:
                </div>
                <div className="text-xs font-semibold text-cyan-300 flex items-center gap-1.5">
                  <Zap className="w-4 h-4 text-cyan-400 flex-shrink-0" />
                  2-Way sync updates mobile badge & desk queues instantly
                </div>
              </div>
            </div>

            <div className="pt-3 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400 border-t border-slate-850">
              <span>Next Step: Step {activeWorkflowStep === 6 ? 1 : activeWorkflowStep + 1} ({admissionWorkflow[activeWorkflowStep === 6 ? 0 : activeWorkflowStep].name})</span>
              <button
                onClick={() => setActiveWorkflowStep(activeWorkflowStep === 6 ? 1 : activeWorkflowStep + 1)}
                className="text-cyan-400 hover:text-cyan-300 font-bold underline"
              >
                Advance Timeline &rarr;
              </button>
            </div>
          </div>

        </div>
      </section>

      {/* =========================================================================
          SECTION 5: ROLE-BASED WORKSPACES
          ========================================================================= */}
      <section id="workspaces" className="py-14 sm:py-20 bg-[#060B16] border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-2xl mx-auto mb-12 space-y-2.5">
            <span className="text-xs uppercase font-extrabold tracking-widest text-blue-400 bg-blue-950/80 px-3.5 py-1 rounded-full border border-blue-900">
              ROLE-BASED WORKSPACES
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
              Tailored Portals for Every Admission Stakeholder.
            </h2>
            <p className="text-xs sm:text-sm text-slate-400">
              Each user sees only the tools and data relevant to their role with strict institutional permission boundaries.
            </p>
          </div>

          {/* Role Tabs */}
          <div
            role="tablist"
            aria-label="Stakeholder Roles"
            className="flex items-center gap-2 overflow-x-auto pb-2 mb-7 no-scrollbar"
          >
            {productRoles.map((role) => {
              const isSelected = selectedRoleId === role.id;
              return (
                <button
                  key={role.id}
                  role="tab"
                  aria-selected={isSelected}
                  onClick={() => setSelectedRoleId(role.id)}
                  className={`px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all duration-200 border active:scale-[0.98] ${
                    isSelected
                      ? 'bg-blue-600 text-white border-blue-400 shadow-lg shadow-blue-600/30 scale-[1.03]'
                      : 'bg-slate-900 text-slate-300 border-slate-800 hover:text-white hover:border-slate-700'
                  }`}
                >
                  {role.name}
                </button>
              );
            })}
          </div>

          {/* Selected Role Workspace Showcase */}
          <div
            key={selectedRoleId}
            role="tabpanel"
            className="bg-slate-900/90 rounded-2xl border border-slate-800 p-6 sm:p-8 shadow-xl space-y-5 anim-tab-content"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3.5">
              <div>
                <span className="text-[10px] uppercase font-bold text-cyan-400 tracking-wider">
                  {selectedRole.badge}
                </span>
                <h3 className="text-xl sm:text-2xl font-bold text-white mt-0.5">{selectedRole.name}</h3>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {selectedRole.keyTools.map((tool) => (
                  <span key={tool} className="text-[10px] font-semibold bg-slate-950 text-slate-300 px-3 py-1 rounded-lg border border-slate-800">
                    {tool}
                  </span>
                ))}
              </div>
            </div>

            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              {selectedRole.description}
            </p>

            {/* Quick Metrics */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {selectedRole.mockupStats.map((st) => (
                <div key={st.label} className="bg-slate-950 p-3.5 rounded-xl border border-slate-800">
                  <div className="text-[10px] text-slate-400">{st.label}</div>
                  <div className="text-base sm:text-lg font-bold mt-0.5" style={{ color: st.color || '#38bdf8' }}>
                    {st.value}
                  </div>
                </div>
              ))}
            </div>

            {/* Responsibilities */}
            <div className="space-y-2">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Key Responsibilities & Permissions:
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {selectedRole.responsibilities.slice(0, 4).map((resp, i) => (
                  <div key={i} className="flex items-start gap-2 text-xs text-slate-300 bg-slate-950/80 p-3 rounded-xl border border-slate-800">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                    <span>{resp}</span>
                  </div>
                ))}
              </div>
            </div>

            {selectedRole.notes && (
              <div className="p-3.5 rounded-xl bg-amber-950/40 border border-amber-900/60 text-xs text-amber-300 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{selectedRole.notes}</span>
              </div>
            )}
          </div>

        </div>
      </section>

      {/* =========================================================================
          SECTION 7: IMMERSIVE REPORTING & TERRITORY INTELLIGENCE
          ========================================================================= */}
      <section id="analytics" className="py-14 sm:py-20 bg-[#060B16] border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-2xl mx-auto mb-12 space-y-2.5">
            <span className="text-xs uppercase font-extrabold tracking-widest text-blue-400 bg-blue-950/80 px-3.5 py-1 rounded-full border border-blue-900">
              TERRITORY INTELLIGENCE & HEATMAPS
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
              Data-Driven Field Command for Management.
            </h2>
            <p className="text-xs sm:text-sm text-slate-400">
              Eliminate unvisited high schools and territorial blind spots with mandal-by-mandal coverage grids and board-ready PDF reports.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Card 1: Mandal School Coverage Grid */}
            <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-6 space-y-3.5 shadow-xl">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                <span className="text-xs font-bold text-white flex items-center gap-1.5">
                  <BarChart3 className="w-4 h-4 text-emerald-400" /> Mandal School Heatmap
                </span>
                <span className="text-[10px] font-mono text-emerald-400 font-bold">14 Mandals</span>
              </div>

              <div className="space-y-2.5 text-xs">
                <div>
                  <div className="flex justify-between text-slate-300 pb-0.5">
                    <span>Miryalaguda Mandal</span>
                    <span className="text-emerald-400 font-bold">18 / 18 Schools (100%)</span>
                  </div>
                  <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div className="bg-emerald-500 h-full w-full" />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-slate-300 pb-0.5">
                    <span>Huzurnagar Mandal</span>
                    <span className="text-cyan-400 font-bold">16 / 18 Schools (88%)</span>
                  </div>
                  <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div className="bg-cyan-500 h-full w-[88%]" />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-slate-300 pb-0.5">
                    <span>Kodad Mandal</span>
                    <span className="text-amber-400 font-bold">9 / 14 Schools (64%)</span>
                  </div>
                  <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div className="bg-amber-500 h-full w-[64%]" />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-slate-300 pb-0.5">
                    <span>Suryapet Rural</span>
                    <span className="text-indigo-400 font-bold">14 / 16 Schools (87%)</span>
                  </div>
                  <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div className="bg-indigo-500 h-full w-[87%]" />
                  </div>
                </div>
              </div>

              <p className="text-[10px] text-slate-400 pt-1">
                Pinpoints unvisited Grade A+ high schools so AGMs can re-route PROs before rivals enter.
              </p>
            </div>

            {/* Card 2: 1-Click Board Summary PDFs */}
            <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-6 space-y-3.5 shadow-xl">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                <span className="text-xs font-bold text-white flex items-center gap-1.5">
                  <FileSpreadsheet className="w-4 h-4 text-cyan-400" /> Board Summary Reports
                </span>
                <span className="text-[10px] font-mono text-cyan-400 font-bold">PDF Generator</span>
              </div>

              <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-800 space-y-2 text-xs">
                <div className="font-bold text-white text-[11px]">Compiled Report Preview</div>
                <div className="text-[10px] text-slate-300 leading-relaxed">
                  • 184 High Schools Mapped with HM Contact Numbers<br />
                  • 14,200 Tenth Students Identified in Target Territory<br />
                  • Daily PRO Kilometer & Village Visit Timesheets<br />
                  • Instant WhatsApp sharing directly to Director groups
                </div>
                <div className="pt-1">
                  <span className="text-[9px] font-bold text-cyan-400 bg-blue-950 px-2.5 py-0.5 rounded border border-blue-900">
                    Executive Ready
                  </span>
                </div>
              </div>

              <p className="text-[10px] text-slate-400 pt-1">
                Eliminates late-night Excel compiling. Generate board-ready admission summaries in 1 click.
              </p>
            </div>

            {/* Card 3: 100% Institutional Lead Vault */}
            <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-6 space-y-3.5 shadow-xl">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                <span className="text-xs font-bold text-white flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-purple-400" /> Institutional Lead Vault
                </span>
                <span className="text-[10px] font-mono text-purple-400 font-bold">Zero Data Leakage</span>
              </div>

              <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-800 space-y-2 text-xs">
                <div className="font-bold text-white text-[11px]">Data Continuity Guarantee</div>
                <div className="text-[10px] text-slate-300 leading-relaxed">
                  • When a PRO resigns, revoke mobile login in 1 click<br />
                  • Every student lead, doorstep note, and contact stays intact<br />
                  • Historical phone contacts cannot be deleted without Super Admin authorization<br />
                  • Automated daily encrypted cloud backups
                </div>
              </div>

              <p className="text-[10px] text-slate-400 pt-1">
                Guarantees your admissions investment remains a permanent institutional asset year after year.
              </p>
            </div>

          </div>

        </div>
      </section>

      {/* =========================================================================
          SECTION 8: SUBSCRIPTION PRICING WITH PERSONALITY & INTERACTION
          ========================================================================= */}
      <section id="pricing" className="py-14 sm:py-22 bg-[#070D1C] border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-2xl mx-auto mb-12 space-y-2.5">
            <span className="text-xs uppercase font-extrabold tracking-widest text-blue-400 bg-blue-950/80 px-3.5 py-1 rounded-full border border-blue-900">
              SUBSCRIPTION TIERS
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
              Transparent, Configurable Subscription Plans.
            </h2>
            <p className="text-xs sm:text-sm text-slate-400">
              Select the plan that matches your admission fleet. Selecting a plan carries your choice into the demo request form.
            </p>

            {/* Monthly / Annual Toggle */}
            <div className="pt-2 flex items-center justify-center gap-3">
              <span className={`text-xs font-semibold ${billingCycle === 'monthly' ? 'text-white font-bold' : 'text-slate-400'}`}>
                Monthly Billing
              </span>
              <button
                onClick={() => setBillingCycle(billingCycle === 'monthly' ? 'annual' : 'monthly')}
                className="w-12 h-7 bg-blue-600 rounded-full p-1 relative transition-colors focus:outline-none"
                aria-label="Toggle Billing Frequency"
              >
                <div
                  className={`w-5 h-5 bg-white rounded-full transition-transform ${
                    billingCycle === 'annual' ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
              <div className="flex items-center gap-1.5">
                <span className={`text-xs font-semibold ${billingCycle === 'annual' ? 'text-white font-bold' : 'text-slate-400'}`}>
                  Annual Billing
                </span>
                <span className="bg-emerald-500/20 text-emerald-300 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-500/40">
                  Save up to 21%
                </span>
              </div>
            </div>

            <div className="text-[10px] text-amber-300/90 bg-amber-950/40 border border-amber-900/50 py-1 px-3 rounded-lg inline-block">
              {pricingConfiguration.indicativeNotice}
            </div>
          </div>

          {/* 3 Pricing Cards with Keyed Transition */}
          <div key={billingCycle} className="grid grid-cols-1 lg:grid-cols-3 gap-7 items-stretch mb-8 anim-tab-content">
            {pricingPlans.map((plan) => {
              const displayPrice = billingCycle === 'annual' ? plan.annualPrice : plan.monthlyPrice;
              const formattedPrice = displayPrice.toLocaleString('en-IN');
              const isSelectedInForm = selectedPlanForDemo === plan.name;
              // Accurate per-plan annual savings percentage
              const annualSavingsPct = plan.monthlyPrice > 0 ? Math.round((plan.monthlyPrice * 12 - plan.annualPrice) / (plan.monthlyPrice * 12) * 100) : 0;
              const annualSavingsAmount = plan.monthlyPrice > 0 ? (plan.monthlyPrice * 12 - plan.annualPrice).toLocaleString('en-IN') : '0';

              return (
                <div
                  key={plan.id}
                  className={`rounded-2xl p-6 sm:p-7 flex flex-col justify-between transition-all duration-300 relative hover:-translate-y-1.5 hover:shadow-2xl ${
                    plan.isPopular
                      ? 'bg-gradient-to-b from-[#0B1E45] via-[#091735] to-[#071126] border-2 border-blue-500 shadow-2xl shadow-blue-600/30 ring-1 ring-blue-500/50 hover:shadow-blue-500/40'
                      : 'bg-slate-950/90 border border-slate-800 hover:border-slate-700 hover:shadow-slate-800/40'
                  }`}
                >
                  {/* Plan Badge Row */}
                  <div className="flex items-center justify-between mb-3">
                    {plan.badge && (
                      <span className={`text-[9px] font-black uppercase tracking-wider px-3 py-1 rounded-full ${
                        plan.isPopular ? 'bg-blue-600 text-white shadow-md' : 'bg-slate-800 text-slate-300 border border-slate-700'
                      }`}>
                        {plan.badge}
                      </span>
                    )}
                    {billingCycle === 'annual' && !plan.isNegotiable && (
                      <span className="text-[9px] font-black text-emerald-300 bg-emerald-950/60 border border-emerald-800/50 px-2 py-0.5 rounded-full ml-auto">
                        Save {annualSavingsPct}%
                      </span>
                    )}
                    {plan.isNegotiable && (
                      <span className="text-[9px] font-bold text-cyan-300 bg-cyan-950/70 border border-cyan-800/60 px-2.5 py-0.5 rounded-full ml-auto">
                        Negotiable Quote
                      </span>
                    )}
                  </div>

                  <div className="space-y-4">
                    <div>
                      <h3 className="text-xl sm:text-2xl font-bold text-white">{plan.name}</h3>
                      <p className="text-xs text-slate-400 mt-1 leading-relaxed">{plan.targetAudience}</p>
                    </div>

                    <div className="border-t border-b border-slate-800 py-3.5">
                      {plan.isNegotiable ? (
                        <div className="space-y-1">
                          <div className="flex items-baseline gap-2">
                            <span className="text-3xl font-extrabold text-white">
                              Negotiable
                            </span>
                            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-300 bg-amber-950/60 border border-amber-800/50 px-2 py-0.5 rounded-md">
                              Custom Quote
                            </span>
                          </div>
                          <div className="text-[11px] text-cyan-300 font-semibold mt-1">
                            Per Person / Per Month Model
                          </div>
                          <div className="text-[10px] text-slate-400 mt-0.5">
                            {billingCycle === 'annual'
                              ? 'Annual commitment with negotiated volume pricing'
                              : 'Flexible per-user monthly billing based on squad size'}
                          </div>
                        </div>
                      ) : (
                        <div>
                          <div className="flex items-baseline gap-1">
                            <span className="text-3xl font-extrabold text-white">
                              {plan.currency}{formattedPrice}
                            </span>
                            <span className="text-xs text-slate-400">
                              {billingCycle === 'annual' ? '/ year' : '/ month'}
                            </span>
                          </div>
                          <div className="text-[11px] text-cyan-300 font-semibold mt-0.5">
                            Per Person / Per Month
                          </div>
                          {billingCycle === 'annual' && (
                            <div className="text-[10px] text-emerald-400 mt-0.5 font-semibold">
                              Save ₹{annualSavingsAmount} vs monthly billing
                            </div>
                          )}
                          {billingCycle === 'monthly' && (
                            <div className="text-[10px] text-slate-400 mt-0.5">
                              {plan.billingFrequencyTextMonthly}
                            </div>
                          )}
                        </div>
                      )}
                      <div className="text-xs text-slate-200 font-semibold mt-3 flex items-center gap-1.5 bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-800">
                        <Users className="w-3.5 h-3.5 text-cyan-400 flex-shrink-0" />
                        <span>{plan.userLimit}</span>
                      </div>
                    </div>

                    {/* Key Inclusions */}
                    <div className="space-y-2 text-xs">
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        Key Inclusions:
                      </div>
                      <ul className="space-y-2 text-slate-200">
                        {plan.includedFeatures.slice(0, 5).map((feat) => (
                          <li key={feat} className="flex items-start gap-2">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0 mt-0.5" />
                            <span>{feat}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Exclusions (collapsed to just count for non-institution plans) */}
                    {plan.excludedFeatures.length > 0 && (
                      <div className="text-[10px] text-slate-500 pt-1 border-t border-slate-800">
                        <span className="text-slate-600">Not included:</span>{' '}
                        {plan.excludedFeatures.slice(0, 2).map((f, i) => (
                          <span key={f}>{i > 0 && ' · '}{f.replace(/^No /, '')}</span>
                        ))}
                        {plan.excludedFeatures.length > 2 && (
                          <span className="text-slate-600"> +{plan.excludedFeatures.length - 2} more</span>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="mt-6 pt-4 border-t border-slate-800 space-y-2.5">
                    <button
                      onClick={() => handlePlanSelectForDemo(plan.name)}
                      className={`w-full py-3.5 px-4 rounded-xl font-bold text-xs tracking-wide transition shadow-lg flex items-center justify-center gap-1.5 active:scale-95 ${
                        plan.isPopular
                          ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-600/40'
                          : 'bg-slate-900 hover:bg-slate-800 text-white border border-slate-700'
                      }`}
                    >
                      {isSelectedInForm ? (
                        <><Check className="w-3.5 h-3.5" /> Selected in Form Below</>
                      ) : (
                        <>{plan.ctaText} →</>
                      )}
                    </button>
                    {isSelectedInForm && (
                      <p className="text-[10px] text-center text-cyan-400 animate-pulse">
                        Scroll down to complete your demo request ↓
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Expandable Comparison Matrix Accordion */}
          <div className="bg-slate-950 rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
            <button
              onClick={() => setComparisonExpanded(!comparisonExpanded)}
              className="w-full p-4 sm:p-5 text-left flex items-center justify-between text-xs sm:text-sm font-bold text-white hover:bg-slate-900 transition"
            >
              <span className="flex items-center gap-2">
                <Sliders className="w-4 h-4 text-cyan-400" />
                Compare All Features & Limits Side-by-Side ({comparisonExpanded ? 'Tap to Collapse' : 'Tap to Expand'})
              </span>
              <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${comparisonExpanded ? 'rotate-180 text-cyan-400' : ''}`} />
            </button>

            {comparisonExpanded && (
              <div className="p-4 sm:p-6 border-t border-slate-800 overflow-x-auto anim-slide-in">
                <table className="w-full text-left border-collapse min-w-[640px] text-xs">
                  <thead>
                    <tr className="border-b border-slate-800 text-[11px] text-slate-400">
                      <th className="p-3 font-bold text-white">Feature</th>
                      <th className="p-3 font-bold text-center">Solo</th>
                      <th className="p-3 font-bold text-center">Regional Squad</th>
                      <th className="p-3 font-bold text-center text-cyan-300 bg-blue-950/40">Whole College Suite ⭐</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-850 text-xs">
                    {comparisonCategories.map((category) => {
                      const rows = comparisonRows.filter((r) => r.category === category);
                      return (
                        <React.Fragment key={category}>
                          <tr className="bg-slate-900/80">
                            <td colSpan={4} className="p-2.5 text-[10px] font-bold uppercase tracking-wider text-cyan-400">
                              {category}
                            </td>
                          </tr>
                          {rows.map((row) => (
                            <tr key={row.featureName} className="hover:bg-slate-900/40 transition">
                              <td className="p-2.5 text-slate-300">{row.featureName}</td>
                              <td className="p-2.5 text-center text-slate-400">
                                {typeof row.starter === 'boolean' ? (
                                  row.starter ? <Check className="w-3.5 h-3.5 text-emerald-400 mx-auto" /> : <X className="w-3.5 h-3.5 text-slate-600 mx-auto" />
                                ) : (
                                  <span>{row.starter}</span>
                                )}
                              </td>
                              <td className="p-2.5 text-center text-slate-400">
                                {typeof row.professional === 'boolean' ? (
                                  row.professional ? <Check className="w-3.5 h-3.5 text-emerald-400 mx-auto" /> : <X className="w-3.5 h-3.5 text-slate-600 mx-auto" />
                                ) : (
                                  <span>{row.professional}</span>
                                )}
                              </td>
                              <td className="p-2.5 text-center text-white bg-blue-950/20 font-semibold">
                                {typeof row.enterprise === 'boolean' ? (
                                  row.enterprise ? <Check className="w-3.5 h-3.5 text-emerald-400 mx-auto font-bold" /> : <X className="w-3.5 h-3.5 text-slate-600 mx-auto" />
                                ) : (
                                  <span className="text-cyan-300 font-bold">{row.enterprise}</span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </React.Fragment>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

        </div>
      </section>

      {/* =========================================================================
          SECTION 8.5: THREE INSTITUTIONAL VALUE PROPOSITIONS
          ========================================================================= */}
      <section id="value-propositions" className="py-16 sm:py-24 bg-[#060B16] border-t border-slate-800/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-20">

          {/* Header */}
          <div className="text-center max-w-2xl mx-auto space-y-2.5">
            <span className="text-xs uppercase font-extrabold tracking-widest text-blue-400 bg-blue-950/80 px-3.5 py-1 rounded-full border border-blue-900">
              WHY INSTITUTIONS CHOOSE THIS PLATFORM
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
              Three Core Advantages That Protect Your Admission ROI.
            </h2>
            <p className="text-xs sm:text-sm text-slate-400">
              Purpose-built for the operational reality of Indian junior colleges — not adapted from a generic CRM template.
            </p>
          </div>

          {/* ── VP 1: Data Ownership ── */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-5 order-2 lg:order-1">
              <span className="inline-flex items-center gap-2 text-xs font-extrabold uppercase tracking-widest text-purple-400 bg-purple-950/60 px-3.5 py-1.5 rounded-full border border-purple-900/60">
                <ShieldCheck className="w-3.5 h-3.5" /> Data Ownership &amp; Lead Vault
              </span>
              <h3 className="text-xl sm:text-2xl font-extrabold text-white leading-tight">
                Your Student Data Is a Permanent Institutional Asset — Not a Staff Benefit.
              </h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                When a field officer resigns or a telecaller leaves, every student contact, doorstep note, and follow-up log stays with the institution — not the employee&apos;s personal device. One click revokes mobile access while the entire data history remains fully intact.
              </p>
              <ul className="space-y-2.5">
                {[
                  'Revoke any staff member\'s mobile login in under 60 seconds',
                  'All leads, contacts & visit notes remain 100% institution-owned',
                  'Historical records protected from deletion without Super Admin authorization',
                  'Automated daily encrypted Google Drive backups — zero manual effort required',
                ].map((pt) => (
                  <li key={pt} className="flex items-start gap-2.5 text-sm text-slate-300">
                    <CheckCircle2 className="w-4 h-4 text-purple-400 flex-shrink-0 mt-0.5" />
                    <span>{pt}</span>
                  </li>
                ))}
              </ul>
              <div className="p-4 rounded-xl bg-purple-950/30 border border-purple-900/50">
                <div className="text-xs font-bold text-purple-300 mb-1">The Zero Leakage Guarantee</div>
                <div className="text-xs text-slate-400 leading-relaxed">
                  Student data captured in the field belongs to the college — not to the PRO who captured it. When a PRO resigns mid-season, their replacement picks up every lead, note, and contact immediately.
                </div>
              </div>
            </div>
            <div className="order-1 lg:order-2">
              <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-5 shadow-2xl shadow-purple-950/20 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <span className="text-xs font-bold text-white flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-purple-400" /> Institutional Lead Vault
                  </span>
                  <span className="text-[10px] font-mono text-purple-400 bg-purple-950/50 px-2 py-0.5 rounded border border-purple-900 font-bold">Zero Leakage</span>
                </div>
                <div className="space-y-2.5">
                  {[
                    { name: 'Ravi Kumar — Field PRO', status: 'Staff Status: Resigned', action: 'Login Revoked ✓', textColor: 'text-red-400', bg: 'bg-red-950/30 border-red-900/40' },
                    { name: 'Student Leads Captured', status: '2,847 student records', action: 'Institution Owned', textColor: 'text-emerald-400', bg: 'bg-emerald-950/30 border-emerald-900/40' },
                    { name: 'Doorstep Visit Logs', status: '1,204 notes preserved', action: 'Fully Intact ✓', textColor: 'text-cyan-400', bg: 'bg-cyan-950/30 border-cyan-900/40' },
                    { name: 'Auto Cloud Backup', status: 'Today 02:00 AM IST', action: 'Encrypted ✓', textColor: 'text-purple-400', bg: 'bg-purple-950/30 border-purple-900/40' },
                  ].map((row) => (
                    <div key={row.name} className={`flex items-center justify-between p-3 rounded-xl border text-xs ${row.bg}`}>
                      <div>
                        <div className="text-white font-semibold">{row.name}</div>
                        <div className="text-slate-400 text-[10px]">{row.status}</div>
                      </div>
                      <span className={`text-[10px] font-bold ${row.textColor}`}>{row.action}</span>
                    </div>
                  ))}
                </div>
                <div className="text-[10px] text-slate-500 pt-1 border-t border-slate-800/60">
                  Field staff accounts cannot export or permanently delete institutional lead records.
                </div>
              </div>
            </div>
          </div>

          <div className="border-t border-slate-800/40" />

          {/* ── VP 2: Field-to-Desk Workflow ── */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="order-1 lg:order-1">
              <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-5 shadow-2xl shadow-blue-950/20 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <span className="text-xs font-bold text-white flex items-center gap-2">
                    <Zap className="w-4 h-4 text-cyan-400" /> Live Lead Pipeline
                  </span>
                  <span className="text-[10px] font-mono text-cyan-400 font-bold">Field ⟶ Desk in &lt; 5 min</span>
                </div>
                <div className="space-y-0">
                  {[
                    { step: 1, label: 'PRO Captures Lead', desc: 'At student\'s doorstep — 60-second mobile entry', color: 'bg-blue-500', textColor: 'text-blue-300', line: true },
                    { step: 2, label: 'Lead Auto-Synced to Desk', desc: 'Reaches telecaller queue in under 5 minutes', color: 'bg-cyan-500', textColor: 'text-cyan-300', line: true },
                    { step: 3, label: 'Telecaller Calls Parent', desc: 'Using full context notes from the field PRO', color: 'bg-violet-500', textColor: 'text-violet-300', line: true },
                    { step: 4, label: 'Campus Visit Confirmed', desc: 'Student scheduled; AGM sees it in real time', color: 'bg-emerald-500', textColor: 'text-emerald-300', line: false },
                  ].map((s) => (
                    <div key={s.step} className="flex items-start gap-3">
                      <div className="flex flex-col items-center">
                        <div className={`w-7 h-7 rounded-full ${s.color} flex items-center justify-center text-[11px] font-black text-white shadow-lg flex-shrink-0`}>{s.step}</div>
                        {s.line && <div className="w-0.5 h-8 bg-slate-700 mt-1" />}
                      </div>
                      <div className="pb-4">
                        <div className={`text-xs font-bold ${s.textColor}`}>{s.label}</div>
                        <div className="text-[10px] text-slate-400 mt-0.5">{s.desc}</div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-3 gap-2 pt-1 border-t border-slate-800/60">
                  {[
                    { label: 'Field-to-Desk Sync', value: '< 5 min' },
                    { label: 'Follow-up On-Time', value: '94%' },
                    { label: 'Lead Decay', value: '≈ 0%' },
                  ].map((stat) => (
                    <div key={stat.label} className="text-center bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                      <div className="text-sm font-black text-cyan-400">{stat.value}</div>
                      <div className="text-[9px] text-slate-400 mt-0.5">{stat.label}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="space-y-5 order-2 lg:order-2">
              <span className="inline-flex items-center gap-2 text-xs font-extrabold uppercase tracking-widest text-cyan-400 bg-cyan-950/60 px-3.5 py-1.5 rounded-full border border-cyan-900/60">
                <Zap className="w-3.5 h-3.5" /> Field-to-Desk Workflow
              </span>
              <h3 className="text-xl sm:text-2xl font-extrabold text-white leading-tight">
                A Student Met at 10 AM Is on the Telecaller&apos;s Queue by 10:05 AM.
              </h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                Two-way synchronization closes the critical gap between field outreach and phone counseling. Telecaller notes update the PRO&apos;s mobile notification badge in real time — creating a unified conversation around each student rather than separate data silos.
              </p>
              <ul className="space-y-2.5">
                {[
                  '2-way live sync: PRO mobile notes ⟷ Telecaller desk in real time',
                  'Call disposition logs feed directly into AGM performance dashboards',
                  'Zero duplicate data entry — one student record, multiple role-based views',
                  'Exam result triggers auto-elevate high-score leads for priority callback',
                ].map((pt) => (
                  <li key={pt} className="flex items-start gap-2.5 text-sm text-slate-300">
                    <CheckCircle2 className="w-4 h-4 text-cyan-400 flex-shrink-0 mt-0.5" />
                    <span>{pt}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="border-t border-slate-800/40" />

          {/* ── VP 3: Career Guidance Engine ── */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-5 order-2 lg:order-1">
              <span className="inline-flex items-center gap-2 text-xs font-extrabold uppercase tracking-widest text-emerald-400 bg-emerald-950/60 px-3.5 py-1.5 rounded-full border border-emerald-900/60">
                <GraduationCap className="w-3.5 h-3.5" /> Career Guidance Engine
              </span>
              <h3 className="text-xl sm:text-2xl font-extrabold text-white leading-tight">
                Turn Free Student Guidance Into Ethical, Verified Admission Leads.
              </h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                The Career Guidance module is a strategic lead magnet. PROs conduct free 25-question career assessments inside high school campuses. Headmasters welcome them — and students receive personalized bilingual reports while your team receives verified, willing leads.
              </p>
              <ul className="space-y-2.5">
                {[
                  '25-question, 5-module career aptitude assessment for 10th-grade students',
                  'Instant bilingual Telugu & English diagnostic PDF report per student',
                  'Stream recommendation (MPC / BiPC / CEC) based on individual aptitude scores',
                  '96%+ headmaster approval rate — free student value opens school gates ethically',
                ].map((pt) => (
                  <li key={pt} className="flex items-start gap-2.5 text-sm text-slate-300">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                    <span>{pt}</span>
                  </li>
                ))}
              </ul>
              <div className="p-4 rounded-xl bg-emerald-950/30 border border-emerald-900/50">
                <div className="text-xs font-bold text-emerald-300 mb-1">The &ldquo;Trojan Horse&rdquo; for School Access</div>
                <div className="text-xs text-slate-400 leading-relaxed">
                  PROs are welcomed into classrooms to deliver free career assessments. When headmasters see genuine student engagement, they become natural advocates — generating verified leads from ethical value delivery rather than cold pitching.
                </div>
              </div>
            </div>
            <div className="order-1 lg:order-2">
              <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-5 shadow-2xl shadow-emerald-950/10 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <span className="text-xs font-bold text-white flex items-center gap-2">
                    <GraduationCap className="w-4 h-4 text-emerald-400" /> Career Assessment Report
                  </span>
                  <span className="text-[10px] font-mono text-emerald-400 font-bold">Telugu / English</span>
                </div>
                <div className="bg-slate-950 rounded-xl border border-slate-800 p-4 space-y-3">
                  <div>
                    <div className="text-[10px] text-slate-400">Student Name</div>
                    <div className="text-sm font-bold text-white">K. Suresh Babu</div>
                    <div className="text-[10px] text-slate-400">Sri Vivekananda High School · Class X-B · Suryapet</div>
                  </div>
                  <div className="text-[10px] font-bold text-emerald-400 uppercase tracking-wide">5-Module Aptitude Scores</div>
                  <div className="space-y-2.5">
                    {[
                      { label: 'Group & Stream Clarity', score: 8, color: 'bg-emerald-500', pct: '80%' },
                      { label: 'Study Discipline', score: 7, color: 'bg-cyan-500', pct: '70%' },
                      { label: 'Screen Time Management', score: 6, color: 'bg-blue-500', pct: '60%' },
                      { label: 'Family Attitude & Support', score: 9, color: 'bg-violet-500', pct: '90%' },
                      { label: 'Career Readiness', score: 7, color: 'bg-amber-500', pct: '70%' },
                    ].map((m) => (
                      <div key={m.label}>
                        <div className="flex justify-between text-[10px] mb-1">
                          <span className="text-slate-300">{m.label}</span>
                          <span className="text-white font-bold">{m.score}/10</span>
                        </div>
                        <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                          <div className={`${m.color} h-full rounded-full`} style={{ width: m.pct }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="text-[10px] text-slate-400">Recommended Stream</div>
                  <span className="text-xs font-black text-emerald-400 bg-emerald-950/60 border border-emerald-900 px-2.5 py-1 rounded-full">MPC — Mathematics, Physics &amp; Chemistry</span>
                </div>
                <div className="grid grid-cols-3 gap-2 pt-1 border-t border-slate-800/60">
                  {[
                    { label: 'Tests Completed', value: '2,140' },
                    { label: 'Telugu Reports', value: '1,980' },
                    { label: 'HM Approval', value: '96%' },
                  ].map((stat) => (
                    <div key={stat.label} className="text-center bg-slate-950 p-2 rounded-xl border border-slate-800">
                      <div className="text-sm font-black text-emerald-400">{stat.value}</div>
                      <div className="text-[9px] text-slate-400 mt-0.5">{stat.label}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* =========================================================================
          SECTION 9: FREQUENTLY ASKED QUESTIONS
          ========================================================================= */}
      <section id="faqs" className="py-14 sm:py-20 bg-[#060B16] border-t border-slate-800">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center space-y-2.5 mb-10">
            <span className="text-xs uppercase font-extrabold tracking-widest text-blue-400 bg-blue-950/80 px-3.5 py-1 rounded-full border border-blue-900">
              FREQUENTLY ASKED QUESTIONS
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
              Questions & Commercial Details.
            </h2>
            <p className="text-xs sm:text-sm text-slate-400">
              Clear operational and technical clarifications regarding deployment, permissions, and features.
            </p>

            {/* Category Filter Pills */}
            <div className="pt-3 flex flex-wrap items-center justify-center gap-2 text-xs">
              {['All', 'Platform & Scope', 'Workflows & Features', 'Pricing & Commercials', 'Security & Tech'].map((cat) => (
                <button
                  key={cat}
                  onClick={() => setFaqCategoryFilter(cat)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 active:scale-95 ${
                    faqCategoryFilter === cat
                      ? 'bg-blue-600 text-white shadow-md scale-105'
                      : 'bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-850'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          <div key={faqCategoryFilter} className="space-y-3 anim-tab-content">
            {displayedFaqs.map((faq, idx) => {
              const isOpen = openFaqIndex === idx;
              return (
                <div
                  key={faq.question}
                  className="bg-slate-900/90 rounded-xl border border-slate-800 overflow-hidden transition"
                >
                  <button
                    onClick={() => setOpenFaqIndex(isOpen ? null : idx)}
                    className="w-full text-left p-4 sm:p-5 flex items-center justify-between gap-3 font-semibold text-xs sm:text-sm text-white hover:text-cyan-300 transition"
                  >
                    <span className="flex items-center gap-2.5">
                      <HelpCircle className="w-4 h-4 text-cyan-400 flex-shrink-0" />
                      {faq.question}
                    </span>
                    <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${isOpen ? 'rotate-180 text-cyan-400' : ''}`} />
                  </button>
                  {isOpen && (
                    <div className="px-5 pb-5 pt-1 text-xs text-slate-300 leading-relaxed border-t border-slate-850 anim-tab-content">
                      {faq.answer}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {!showAllFaqs && filteredFaqs.length > 6 && (
            <div className="text-center pt-5">
              <button
                onClick={() => setShowAllFaqs(true)}
                className="text-xs text-cyan-400 hover:text-cyan-300 font-bold underline"
              >
                View all {filteredFaqs.length} questions in this category &rarr;
              </button>
            </div>
          )}

        </div>
      </section>

      {/* =========================================================================
          SECTION 10: SIMPLIFIED HIGH-CONVERSION ENQUIRY FORM
          ========================================================================= */}
      <section
        id="enquiry-form-section"
        ref={formRef}
        className="py-14 sm:py-22 bg-gradient-to-b from-[#09152E] to-[#060B16] border-t border-slate-800 relative scroll-mt-20"
      >
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center space-y-2.5 mb-10">
            <span className="text-xs uppercase font-extrabold tracking-widest text-blue-400 bg-blue-950/80 px-3.5 py-1 rounded-full border border-blue-900">
              SCHEDULE A DEMO
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
              Request Your Personalized Campus Demo.
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 max-w-lg mx-auto">
              Fill in your essential details to schedule an interactive walkthrough tailored to your institution.
            </p>
          </div>

          <div className="bg-slate-950 border-2 border-blue-700/60 rounded-2xl p-6 sm:p-9 shadow-2xl">
            {formFeedback.show ? (
              <div className="text-center py-6 space-y-4 anim-slide-in">
                <div className="w-14 h-14 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800 flex items-center justify-center mx-auto shadow-lg">
                  <CheckCircle2 className="w-7 h-7" />
                </div>
                <h3 className="text-xl font-bold text-white">Demo Request Prepared</h3>
                <p className="text-xs text-slate-300 max-w-md mx-auto leading-relaxed">
                  To complete sending your inquiry for <strong>{formData.institutionName}</strong>, tap below to open your preferred channel with your prefilled details:
                </p>

                <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
                  {formFeedback.whatsappUrl && (
                    <a
                      href={formFeedback.whatsappUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs tracking-wide shadow-lg transition flex items-center justify-center gap-2 active:scale-95"
                    >
                      <PhoneCall className="w-4 h-4" /> Send via WhatsApp
                    </a>
                  )}
                  {formFeedback.mailToUrl && (
                    <a
                      href={formFeedback.mailToUrl}
                      className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs tracking-wide shadow-lg transition flex items-center justify-center gap-2 active:scale-95"
                    >
                      <Mail className="w-4 h-4" /> Send via Email
                    </a>
                  )}
                </div>

                <div className="pt-2">
                  <button
                    onClick={() => setFormFeedback({ show: false })}
                    className="text-xs text-slate-400 underline hover:text-white"
                  >
                    Edit details
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleFormSubmit} className="space-y-4">
                
                {/* Selected Plan Banner with Change Option */}
                <div className="p-3.5 bg-blue-950/80 border border-blue-700/80 rounded-xl flex items-center justify-between text-xs shadow-md">
                  <div>
                    <span className="text-[10px] text-cyan-300 font-semibold block uppercase">Selected Tier:</span>
                    <span className="font-bold text-white text-sm">{selectedPlanForDemo}</span>
                  </div>
                  <a href="#pricing" className="text-cyan-400 hover:text-cyan-300 font-bold text-[11px] underline">
                    Change Plan
                  </a>
                </div>

                {/* 1. Institution Name (Required) */}
                <div>
                  <label htmlFor={institutionNameId} className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                    Institution / College Name *
                  </label>
                  <input
                    id={institutionNameId}
                    type="text"
                    required
                    placeholder="e.g. Sri Vaatsalya Junior College"
                    value={formData.institutionName}
                    onChange={(e) => setFormData({ ...formData, institutionName: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition"
                  />
                </div>

                {/* 2. Contact Person (Required) */}
                <div>
                  <label htmlFor={contactNameId} className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                    Contact Person & Designation *
                  </label>
                  <input
                    id={contactNameId}
                    type="text"
                    required
                    placeholder="e.g. Dr. K. Prasad (Principal / Director)"
                    value={formData.contactName}
                    onChange={(e) => setFormData({ ...formData, contactName: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition"
                  />
                </div>

                {/* 3. Phone Number or Email (Required) */}
                <div>
                  <label htmlFor={phoneOrEmailId} className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                    Phone Number or Email Address *
                  </label>
                  <input
                    id={phoneOrEmailId}
                    type="text"
                    required
                    placeholder="e.g. +91 99891 00000 or admissions@college.edu.in"
                    value={formData.phoneOrEmail}
                    onChange={(e) => setFormData({ ...formData, phoneOrEmail: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition"
                  />
                </div>

                {/* 4. Interested Plan Dropdown */}
                <div>
                  <label htmlFor={selectedPlanId} className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                    Interested Subscription Tier
                  </label>
                  <select
                    id={selectedPlanId}
                    value={selectedPlanForDemo}
                    onChange={(e) => setSelectedPlanForDemo(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-cyan-300 font-bold focus:outline-none focus:border-blue-500 transition"
                  >
                    <option>Field PRO Solo</option>
                    <option>AGM Regional Squad</option>
                    <option>Whole College Suite</option>
                    <option>Custom Requirements</option>
                    <option>Not Sure Yet</option>
                  </select>
                </div>

                {/* Progressive Disclosure Toggle */}
                <div className="pt-1">
                  <button
                    type="button"
                    onClick={() => setShowAdvancedFormFields(!showAdvancedFormFields)}
                    className="text-xs text-cyan-400 hover:text-cyan-300 font-semibold flex items-center gap-1 focus:outline-none"
                  >
                    <span>{showAdvancedFormFields ? '− Hide additional options' : '+ Add more details (Optional)'}</span>
                  </button>
                </div>

                {/* Advanced Optional Fields */}
                {showAdvancedFormFields && (
                  <div className="space-y-3 pt-2 border-t border-slate-850 anim-slide-in">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label htmlFor={institutionTypeId} className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                          Institution Type
                        </label>
                        <select
                          id={institutionTypeId}
                          value={formData.institutionType}
                          onChange={(e) => setFormData({ ...formData, institutionType: e.target.value })}
                          className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500 transition"
                        >
                          <option>Junior / Intermediate College</option>
                          <option>Degree College</option>
                          <option>Polytechnic / ITI</option>
                          <option>Residential / Specialized Academy</option>
                          <option>Multi-Campus Educational Group</option>
                          <option>Other</option>
                        </select>
                      </div>

                      <div>
                        <label htmlFor={teamSizeId} className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                          Team Size
                        </label>
                        <select
                          id={teamSizeId}
                          value={formData.teamSize}
                          onChange={(e) => setFormData({ ...formData, teamSize: e.target.value })}
                          className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500 transition"
                        >
                          <option>1–4 Field Officers</option>
                          <option>5–15 Team Members</option>
                          <option>16–40 Members</option>
                          <option>40+ Members (Large Group)</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <div className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                        Specific Capabilities Needed:
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        {[
                          'Field Mobile App (PRO)',
                          'Telecalling Conversion Desk',
                          'Merit & Quota Seat Allocation',
                          'Mandal Territory Intel',
                        ].map((cap) => {
                          const isChecked = selectedCapabilities.includes(cap);
                          return (
                            <button
                              type="button"
                              key={cap}
                              onClick={() => toggleCapability(cap)}
                              className={`p-2.5 rounded-xl border text-left transition flex items-center justify-between active:scale-[0.98] ${
                                isChecked
                                  ? 'bg-blue-950 border-cyan-400 text-white font-semibold'
                                  : 'bg-slate-900 border-slate-800 text-slate-400'
                              }`}
                            >
                              <span className="text-[11px]">{cap}</span>
                              {isChecked && <Check className="w-3 h-3 text-cyan-400 flex-shrink-0" />}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div>
                      <label htmlFor={requirementsId} className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                        Specific Notes (Optional)
                      </label>
                      <textarea
                        id={requirementsId}
                        rows={2}
                        placeholder="e.g. We have 12 PROs across 4 mandals and want to start next week."
                        value={formData.requirements}
                        onChange={(e) => setFormData({ ...formData, requirements: e.target.value })}
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-blue-500 transition"
                      />
                    </div>
                  </div>
                )}

                <div className="pt-2">
                  <button
                    type="submit"
                    className="w-full py-4 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-extrabold text-sm tracking-wide shadow-xl shadow-blue-600/40 transition flex items-center justify-center gap-2 active:scale-95"
                  >
                    <Send className="w-4 h-4" /> Request a Product Demo
                  </button>
                  <p className="text-[10px] text-slate-500 text-center mt-3">
                    🔒 Static website privacy assurance: No automated marketing spam. Tap to review and initiate your inquiry via WhatsApp or Email.
                  </p>
                </div>

              </form>
            )}
          </div>

        </div>
      </section>

      {/* =========================================================================
          STICKY COMPACT MOBILE BOTTOM ACTION BAR
          ========================================================================= */}
      {!isFormInView && (
        <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#070D1C]/95 backdrop-blur-md border-t border-slate-800 p-2.5 flex items-center justify-between gap-3 shadow-2xl safe-area-bottom">
          <div className="text-left flex-1 pl-1">
            <div className="text-[11px] font-bold text-white leading-tight">College Admission Platform</div>
            <div className="text-[10px] text-cyan-400">By SriWeb Technologies</div>
          </div>
          <a
            href={`https://wa.me/${pricingConfiguration.whatsappNumber}?text=${encodeURIComponent('Hi SriWeb Technologies, I would like to request a demo for the College Admission Management Platform.')}`}
            target="_blank"
            rel="noreferrer"
            className="p-2.5 rounded-lg bg-emerald-600 text-white font-bold text-xs flex items-center justify-center shadow-sm active:scale-95"
            aria-label="WhatsApp Contact"
          >
            <PhoneCall className="w-4 h-4" />
          </a>
          <a
            href="#enquiry-form-section"
            className="px-4 py-2.5 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold text-xs shadow-md shadow-blue-600/30 active:scale-95"
          >
            Request a Demo
          </a>
        </div>
      )}

      {/* =========================================================================
          GLOBAL SRIWEB TECHNOLOGIES FOOTER
          ========================================================================= */}
      <footer className="bg-slate-950 border-t border-slate-800 py-12 text-slate-400 text-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            
            <div className="space-y-3 md:col-span-1">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold">
                  <Building2 className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-sm font-bold text-white">SriWeb Technologies</div>
                  <div className="text-[10px] text-slate-400">Software & Enterprise Products</div>
                </div>
              </div>
              <p className="text-slate-400 text-[11px] leading-relaxed">
                SriWeb Technologies is a technology solutions company offering websites, custom web applications, mobile applications, SaaS platforms, and custom business software.
              </p>
              <div className="text-[11px] text-slate-400 space-y-1">
                <div className="flex items-center gap-2"><Mail className="w-3.5 h-3.5 text-cyan-400" /> {pricingConfiguration.contactEmail}</div>
                <div className="flex items-center gap-2"><Phone className="w-3.5 h-3.5 text-cyan-400" /> +91 {pricingConfiguration.whatsappNumber.slice(2)}</div>
              </div>
            </div>

            <div className="space-y-2.5">
              <div className="text-xs font-bold text-white uppercase tracking-wider">Solutions & Platforms</div>
              <ul className="space-y-1.5 text-[11px]">
                <li><Link href="/products/college-admission-management" className="text-cyan-400 hover:text-cyan-300 font-medium">College Admission Management Platform</Link></li>
                <li><Link href="/products/crm-management" className="hover:text-white transition">CRM & Lead Management</Link></li>
                <li><Link href="/products/inventory-management" className="hover:text-white transition">Inventory & Stock System</Link></li>
                <li><Link href="/products" className="text-slate-500 hover:text-slate-300 transition">All Software Solutions &rarr;</Link></li>
              </ul>
            </div>

            <div className="space-y-2.5">
              <div className="text-xs font-bold text-white uppercase tracking-wider">Engineering Services</div>
              <ul className="space-y-1.5 text-[11px]">
                <li><Link href="/services/website-development" className="hover:text-white transition">Website Development</Link></li>
                <li><Link href="/services/web-application-development" className="hover:text-white transition">Web Application Development</Link></li>
                <li><Link href="/services/mobile-app-development" className="hover:text-white transition">Mobile App Development</Link></li>
                <li><Link href="/services/saas-development" className="hover:text-white transition">SaaS Product Development</Link></li>
                <li><Link href="/services" className="text-slate-500 hover:text-slate-300 transition">All 9 Services &rarr;</Link></li>
              </ul>
            </div>

            <div className="space-y-2.5">
              <div className="text-xs font-bold text-white uppercase tracking-wider">Institutional Continuity</div>
              <p className="text-slate-400 text-[11px] leading-relaxed">
                All client databases are deployed on high-availability cloud architecture with daily automated Google Drive snapshots and role-isolated access.
              </p>
              <div className="inline-flex items-center gap-2 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-lg text-emerald-400 font-medium text-[10px]">
                <ShieldCheck className="w-3.5 h-3.5" /> Institutional Data Vault Guaranteed
              </div>
            </div>

          </div>

          <div className="pt-6 border-t border-slate-900 flex flex-col sm:flex-row items-center justify-between gap-4 text-slate-500 text-[10px]">
            <div>
              &copy; {new Date().getFullYear()} SriWeb Technologies. All rights reserved. Built for Indian educational institutions.
            </div>
            <div className="flex gap-4">
              <Link href="/terms" className="hover:text-slate-400 transition">Terms of Service</Link>
              <Link href="/privacy-policy" className="hover:text-slate-400 transition">Privacy Policy</Link>
              <Link href="/login" className="text-cyan-400 hover:underline">Institutional Login</Link>
            </div>
          </div>

        </div>
      </footer>

    </div>
  );
}
