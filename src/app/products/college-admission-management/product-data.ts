export interface PricingPlan {
  id: string;
  name: string;
  badge?: string;
  isPopular?: boolean;
  targetAudience: string;
  proposedPositioning: string;
  monthlyPrice: number;
  annualPrice: number;
  isNegotiable?: boolean;
  currency: string;
  billingFrequencyTextMonthly: string;
  billingFrequencyTextAnnual: string;
  userLimit: string;
  includedFeatures: string[];
  excludedFeatures: string[];
  commercialStatus: 'Needs Confirmation' | 'Verified';
  supportLevel: string;
  ctaText: string;
}

export interface ComparisonRow {
  featureName: string;
  category: string;
  starter: boolean | string;
  professional: boolean | string;
  enterprise: boolean | string;
  commercialStatus?: 'Verified' | 'Needs Confirmation';
}

export interface ProductRole {
  id: string;
  name: string;
  title: string;
  badge: string;
  description: string;
  responsibilities: string[];
  keyTools: string[];
  mockupStats: { label: string; value: string; color?: string }[];
  mockupRows: { col1: string; col2: string; col3: string; status: string }[];
  notes?: string;
}

export interface WorkflowStage {
  step: number;
  name: string;
  title: string;
  actor: string;
  description: string;
  outcome: string;
}

export interface FeatureCategory {
  id: string;
  title: string;
  tagline: string;
  businessValue: string;
  description: string;
  capabilities: string[];
  previewMetrics: { label: string; value: string }[];
}

export interface FAQItem {
  question: string;
  answer: string;
  category: 'Platform & Scope' | 'Workflows & Features' | 'Career Guidance' | 'Pricing & Commercials' | 'Security & Tech';
}

// ==========================================
// CENTRAL CONFIGURABLE PRICING DATA
// ==========================================
export const pricingConfiguration = {
  currencySymbol: '₹',
  indicativeNotice: 'Indicative Business Proposal · Subject to Formal Scope & Institutional Agreement',
  whatsappNumber: '919989100000', // Configurable business WhatsApp
  contactEmail: 'contact@sriwebtech.com', // Configurable business contact email
};

export const pricingPlans: PricingPlan[] = [
  {
    id: 'solo',
    name: 'Field PRO Solo',
    badge: 'INDIVIDUAL FIELD AGENT',
    targetAudience: 'Independent PROs, field counselors, or solo admission executives',
    proposedPositioning: 'A structured digital workspace for individual field outreach without paper diaries.',
    monthlyPrice: 999,
    annualPrice: 9999,
    isNegotiable: false,
    currency: '₹',
    billingFrequencyTextMonthly: 'Billed monthly · ₹999 per person / month',
    billingFrequencyTextAnnual: 'Billed annually · ₹833/person/mo (Save ₹1,989/yr)',
    userLimit: 'Per Person / Month · 1 Dedicated Field PRO Login',
    commercialStatus: 'Needs Confirmation',
    includedFeatures: [
      'Mobile-first student lead capture & doorstep status',
      'Personal high school & headmaster contact diary',
      'Personal village visit and activity log',
      'Basic student follow-up reminders & status tracking',
      'Village relatives & personal reference directory',
      'Daily activity PDF report with native WhatsApp share',
    ],
    excludedFeatures: [
      'No multi-user coordination or team task assignment',
      'No AGM / Regional Manager supervision portal',
      'No centralized campus telecalling desk integration',
      'No institutional master admin or executive dashboard',
      'No 5-module career aptitude test engine for students',
      'No institutional lead vault (Personal scope only)',
    ],
    supportLevel: 'Standard Email & Ticket Support (24-48h response)',
    ctaText: 'Enquire About Solo',
  },
  {
    id: 'regional',
    name: 'AGM Regional Squad',
    badge: 'ZONAL ADMISSION TEAM',
    targetAudience: 'Area managers & regional teams coordinating field officers across districts',
    proposedPositioning: 'Coordinate field activity and track admission outreach across an entire regional team.',
    monthlyPrice: 0,
    annualPrice: 0,
    isNegotiable: true,
    currency: '₹',
    billingFrequencyTextMonthly: 'Per person / month model · Custom volume pricing',
    billingFrequencyTextAnnual: 'Annual contract discounts available on quotation',
    userLimit: 'Per Person / Month · Scalable Team (No Fixed Limit)',
    commercialStatus: 'Needs Confirmation',
    includedFeatures: [
      'Everything in Field PRO Solo plan',
      'Dedicated AGM / Zonal Team Leader workspace',
      'Daily field task assignment & completion verification',
      'Zonal high school & village coverage progress tracking',
      'PRO productivity comparison & daily lead volume review',
      'Village influencer & community elder directory',
      'Shared lead visibility within assigned territory scope',
      'Downloadable zonal summary reports & activity logs',
    ],
    excludedFeatures: [
      'No central telecalling call center module',
      'No college-wide master admin / chairman overview',
      'No official application number issuance workflow',
      'No institution-wide data lock (Restricted to zonal territory)',
    ],
    supportLevel: 'Priority WhatsApp Team Group + Email Support (12h response)',
    ctaText: 'Discuss Regional Pricing',
  },
  {
    id: 'institution',
    name: 'Whole College Suite',
    badge: '⭐ RECOMMENDED FOR INSTITUTIONS',
    isPopular: true,
    targetAudience: 'Colleges, institutes & educational groups requiring unified admission operations',
    proposedPositioning: 'The complete admission coordination platform for institutional teams.',
    monthlyPrice: 0,
    annualPrice: 0,
    isNegotiable: true,
    currency: '₹',
    billingFrequencyTextMonthly: 'Per person / month model · Campus volume subscription',
    billingFrequencyTextAnnual: 'Institutional annual licensing with dedicated onboarding',
    userLimit: 'Per Person / Month · Campus-Wide (No Fixed Limit)',
    commercialStatus: 'Needs Confirmation',
    includedFeatures: [
      'Central College Management Portal (Chairman / Principal / Dean)',
      'Multi-AGM regional hierarchy & scalable field PRO team structure',
      'Dedicated campus Telecaller Desk with 2-way live synchronization',
      'Real-time field-to-desk lead push within minutes',
      '5-Module Career Guidance & Aptitude Assessment engine',
      'Bilingual Telugu/English student diagnostic report generation',
      'Direct admission confirmation (`joinedCollegeId`) & application #',
      '100% Institutional Lead Vault (No data leakage on staff exit)',
      'Mandal-wise school strength intelligence & ROI heatmaps',
      'Automated daily encrypted Google Drive database backups',
      'Configurable course streams (MPC, BiPC, CEC, MEC, Polytechnic)',
    ],
    excludedFeatures: [],
    supportLevel: 'Dedicated Relationship Manager + Live Phone Support + Onboarding Training',
    ctaText: 'Request Institution Demo',
  },
];

// ==========================================
// FEATURE COMPARISON TABLE DATA
// ==========================================
export const comparisonCategories = [
  'User Access & Architecture',
  'Field PRO Mobile Operations',
  'Telecalling & Counseling Loop',
  'Student Career Assessment (USP)',
  'Admission Pipeline & Intake',
  'Territory Intelligence & High Schools',
  'Data Governance & Lead Protection',
  'Executive Reporting & Analytics',
  'Support & Implementation Scope',
];

export const comparisonRows: ComparisonRow[] = [
  // User Access & Architecture
  {
    category: 'User Access & Architecture',
    featureName: 'PRO Mobile Field Login',
    starter: '1 Dedicated User (₹999/mo)',
    professional: 'Per Person / Mo (Scalable Squad)',
    enterprise: 'Per Person / Mo (Campus Team)',
    commercialStatus: 'Verified',
  },
  {
    category: 'User Access & Architecture',
    featureName: 'AGM / Regional Manager Workspace',
    starter: false,
    professional: '1 Zonal Lead',
    enterprise: 'Multi-AGM Supported',
    commercialStatus: 'Verified',
  },
  {
    category: 'User Access & Architecture',
    featureName: 'Central Telecalling & Counseling Desk',
    starter: false,
    professional: false,
    enterprise: true,
    commercialStatus: 'Verified',
  },
  {
    category: 'User Access & Architecture',
    featureName: 'College Master Management Portal (Principal / Director)',
    starter: false,
    professional: false,
    enterprise: true,
    commercialStatus: 'Verified',
  },
  {
    category: 'User Access & Architecture',
    featureName: 'Role-Based Access Control (RBAC Boundaries)',
    starter: 'Basic Personal',
    professional: 'Zonal Territory Scope',
    enterprise: 'Complete Enterprise RBAC',
    commercialStatus: 'Verified',
  },

  // Field PRO Mobile Operations
  {
    category: 'Field PRO Mobile Operations',
    featureName: 'Mobile-First Lead Entry (Doorstep & Visits)',
    starter: true,
    professional: true,
    enterprise: true,
    commercialStatus: 'Verified',
  },
  {
    category: 'Field PRO Mobile Operations',
    featureName: 'Duplicate Phone Number Checking (Real-time)',
    starter: true,
    professional: true,
    enterprise: true,
    commercialStatus: 'Verified',
  },
  {
    category: 'Field PRO Mobile Operations',
    featureName: 'Doorstep Verification Tracking (`doorstepCompleted`)',
    starter: true,
    professional: true,
    enterprise: true,
    commercialStatus: 'Verified',
  },
  {
    category: 'Field PRO Mobile Operations',
    featureName: 'Daily Field Task Assignment & Status Tracking',
    starter: false,
    professional: true,
    enterprise: true,
    commercialStatus: 'Verified',
  },
  {
    category: 'Field PRO Mobile Operations',
    featureName: 'Village Relatives & Influencer Directory',
    starter: 'Personal Log',
    professional: 'Zonal Shared',
    enterprise: 'Master Central Asset',
    commercialStatus: 'Verified',
  },
  {
    category: 'Field PRO Mobile Operations',
    featureName: '1-Click WhatsApp Daily PDF Report Share',
    starter: true,
    professional: true,
    enterprise: true,
    commercialStatus: 'Verified',
  },

  // Telecalling & Counseling Loop
  {
    category: 'Telecalling & Counseling Loop',
    featureName: 'Instant Field-to-Desk Lead Dispatch',
    starter: false,
    professional: false,
    enterprise: true,
    commercialStatus: 'Verified',
  },
  {
    category: 'Telecalling & Counseling Loop',
    featureName: 'Daily Follow-up Reminders & Scheduled Call Queue',
    starter: 'Self reminders only',
    professional: 'Zonal callbacks',
    enterprise: 'Central Automated Queue',
    commercialStatus: 'Verified',
  },
  {
    category: 'Telecalling & Counseling Loop',
    featureName: '2-Way Field PRO ⟷ Telecaller Notes Synchronization',
    starter: false,
    professional: false,
    enterprise: true,
    commercialStatus: 'Verified',
  },
  {
    category: 'Telecalling & Counseling Loop',
    featureName: 'Call Disposition Logging (Interested, Visit, Joined)',
    starter: false,
    professional: false,
    enterprise: true,
    commercialStatus: 'Verified',
  },
  {
    category: 'Telecalling & Counseling Loop',
    featureName: 'Direct Headmaster & Key-Person Calling Shortcuts',
    starter: false,
    professional: false,
    enterprise: true,
    commercialStatus: 'Verified',
  },

  // Student Career Assessment (USP)
  {
    category: 'Student Career Assessment (USP)',
    featureName: 'Student Self-Service Portal & Auto-Linking',
    starter: true,
    professional: true,
    enterprise: true,
    commercialStatus: 'Verified',
  },
  {
    category: 'Student Career Assessment (USP)',
    featureName: '5-Module Career Clarity & Aptitude Test Engine',
    starter: false,
    professional: false,
    enterprise: true,
    commercialStatus: 'Verified',
  },
  {
    category: 'Student Career Assessment (USP)',
    featureName: 'Bilingual Telugu & English Diagnostic Report PDF',
    starter: false,
    professional: false,
    enterprise: true,
    commercialStatus: 'Verified',
  },
  {
    category: 'Student Career Assessment (USP)',
    featureName: 'Digital Study Books & Curated Guidance Videos',
    starter: false,
    professional: false,
    enterprise: true,
    commercialStatus: 'Verified',
  },
  {
    category: 'Student Career Assessment (USP)',
    featureName: 'Ask an Expert Student Inquiry Interface',
    starter: false,
    professional: false,
    enterprise: 'Client Preview (Roadmap)',
    commercialStatus: 'Needs Confirmation',
  },

  // Admission Pipeline & Intake
  {
    category: 'Admission Pipeline & Intake',
    featureName: 'Spot Application Number Issuance',
    starter: false,
    professional: false,
    enterprise: true,
    commercialStatus: 'Verified',
  },
  {
    category: 'Admission Pipeline & Intake',
    featureName: 'Direct Admission Status Confirmation (`joinedCollegeId`)',
    starter: false,
    professional: false,
    enterprise: true,
    commercialStatus: 'Verified',
  },
  {
    category: 'Admission Pipeline & Intake',
    featureName: 'Course & Stream Quota Allocation (MPC/BiPC/CEC)',
    starter: false,
    professional: false,
    enterprise: true,
    commercialStatus: 'Verified',
  },

  // Territory Intelligence & High Schools
  {
    category: 'Territory Intelligence & High Schools',
    featureName: 'Master High School Directory (HMs, Strengths, Grades)',
    starter: 'Personal Log',
    professional: 'Zonal Shared',
    enterprise: 'Master Institutional Bank',
    commercialStatus: 'Verified',
  },
  {
    category: 'Territory Intelligence & High Schools',
    featureName: 'Mandal-by-Mandal Coverage Progress & Target Heatmap',
    starter: false,
    professional: true,
    enterprise: true,
    commercialStatus: 'Verified',
  },

  // Data Governance & Lead Protection
  {
    category: 'Data Governance & Lead Protection',
    featureName: 'Institutional Lead Vault (Zero loss on staff turnover)',
    starter: 'Personal ownership',
    professional: 'Zonal scope',
    enterprise: '100% Institution Vault',
    commercialStatus: 'Needs Confirmation',
  },
  {
    category: 'Data Governance & Lead Protection',
    featureName: 'Multi-Campus / Multi-Branch Geographic Isolation',
    starter: false,
    professional: false,
    enterprise: true,
    commercialStatus: 'Verified',
  },
  {
    category: 'Data Governance & Lead Protection',
    featureName: 'Automated Google Drive Cloud Database Backups',
    starter: false,
    professional: 'Weekly Export',
    enterprise: 'Automated Daily Cron',
    commercialStatus: 'Verified',
  },

  // Executive Reporting & Analytics
  {
    category: 'Executive Reporting & Analytics',
    featureName: 'Personal Daily Visit Activity Log',
    starter: true,
    professional: true,
    enterprise: true,
    commercialStatus: 'Verified',
  },
  {
    category: 'Executive Reporting & Analytics',
    featureName: 'Zonal Target vs Achievement Leaderboard',
    starter: false,
    professional: true,
    enterprise: true,
    commercialStatus: 'Verified',
  },
  {
    category: 'Executive Reporting & Analytics',
    featureName: 'Real-Time Executive Admission Intake Funnel',
    starter: false,
    professional: false,
    enterprise: true,
    commercialStatus: 'Verified',
  },
  {
    category: 'Executive Reporting & Analytics',
    featureName: 'Board-Ready School Strength PDF Generator',
    starter: false,
    professional: 'Zonal Export',
    enterprise: 'Full Institutional Generator',
    commercialStatus: 'Verified',
  },

  // Support & Implementation Scope
  {
    category: 'Support & Implementation Scope',
    featureName: 'Support Service Level Agreement',
    starter: 'Email (48h)',
    professional: 'WhatsApp Group (12h)',
    enterprise: 'Dedicated RM & Phone',
    commercialStatus: 'Needs Confirmation',
  },
  {
    category: 'Support & Implementation Scope',
    featureName: 'Staff Orientation & Onboarding Sessions',
    starter: 'Self-Serve Video',
    professional: '1 Virtual Session',
    enterprise: 'Complete Hands-on Training',
    commercialStatus: 'Needs Confirmation',
  },
];

// ==========================================
// 6 CORE CAPABILITIES (DETAILED EXPLORER)
// ==========================================
export const coreProductCapabilities: FeatureCategory[] = [
  {
    id: 'enquiry',
    title: 'Student Enquiry Management',
    tagline: 'Give your admission team a more organized view of every prospective student.',
    businessValue:
      'Eliminates disorganized intake spreadsheets and duplicate records with a centralized, searchable student repository.',
    description:
      'Mobile-first student profile capture, debounced real-time duplicate phone checking, complete profile completeness meters, star prospect filtering, and automatic linking of organic student signups.',
    capabilities: [
      'Mobile-first student profile capture (Marks, Group, Parent Occupation, Village, Mandal)',
      'Debounced duplicate phone number verification (`/api/students/check-phone`)',
      'Star Leads filter: high admission likelihood & verified fee bearable capacity',
      'Doorstep physical visit verification toggle (`doorstepCompleted: true`)',
      'Automatic student pre-registration matching with existing field records',
      'Profile completeness indicator highlighting missing parent or location data',
    ],
    previewMetrics: [
      { label: 'Enquiries Captured', value: '4,850' },
      { label: 'Duplicate Blocked', value: '312' },
      { label: 'Doorsteps Verified', value: '1,420' },
    ],
  },
  {
    id: 'pro',
    title: 'Field PRO Management',
    tagline: 'Help field representatives record their work without depending on paper diaries.',
    businessValue:
      'Provides a lightweight, mobile-first field workspace designed for rural connectivity, travel logs, and instant reporting.',
    description:
      'Touch-optimized field workspace for Public Relations Officers conducting school and village visits. Captures student leads on the go, logs doorstep verification, tracks assigned manager tasks, and generates daily WhatsApp PDF reports.',
    capabilities: [
      'Responsive mobile workspace (PWA and Android APK packaging via Capacitor)',
      'Village visit log with date-stamped notes and target branch selection',
      'Village Key Influencers register (sarpanches, elders, coaching tutors)',
      'Relative contacts directory mapped across mandals and occupations',
      'Daily task manager with deadline tracking and completion sign-off',
      'One-click PDF Day Report generation with native WhatsApp group sharing',
    ],
    previewMetrics: [
      { label: 'Active Field PROs', value: '24' },
      { label: 'Schools Visited Today', value: '38' },
      { label: 'Daily Reports Filed', value: '100%' },
    ],
  },
  {
    id: 'telecaller',
    title: 'Telecaller & Counseling Desk',
    tagline: 'Give telecallers the context they need to follow up with prospective students and families.',
    businessValue:
      'Closes the critical gap between field outreach and phone counseling, ensuring zero lead decay and timely parent follow-up.',
    description:
      'Dedicated dialer workspace restricted to leads assigned by managers. Features daily call volume counters, scheduled callback queues with overdue badges, direct High School Headmaster calling shortcuts, and instant 2-way sync with field officers.',
    capabilities: [
      'Assigned lead calling queues restricted to designated counselors',
      'Daily call volume counter (`/api/telecaller/stats`) and follow-up metrics',
      'Scheduled callback queue with overdue badges and exam-triggered follow-ups',
      'Instant 2-way sync: Telecaller notes update the PRO mobile notification badge in real time',
      'Direct tele-counseling desk for High School Headmasters and Village Influencers',
      'Call outcome disposition logging (Interested, Campus Visit Scheduled, Joined, Not Interested)',
    ],
    previewMetrics: [
      { label: 'Calls Logged Today', value: '286' },
      { label: 'Follow-ups on Schedule', value: '94%' },
      { label: 'Campus Visits Booked', value: '38' },
    ],
  },
  {
    id: 'pipeline',
    title: 'Admission Pipeline & Intake',
    tagline: 'Understand where enquiries stand and which applicants need immediate attention.',
    businessValue:
      'Bridges the transition from prospective inquiry to enrolled student with spot application numbering and course quota management.',
    description:
      'Tracks applicants through distinct milestones: New Enquiry ➔ Telecaller Follow-Up ➔ Campus Visit ➔ Application Submission ➔ Confirmed Admission. Associating confirmed students directly with college branches and official application numbers.',
    capabilities: [
      'Multi-stage lead lifecycle (New, Interested, Campus Visit, Joined Other, Admitted)',
      'Direct admission status flipping (`/api/students/[id]/admit`) with campus branch assignment',
      'Spot official application number issuance (`applicationNumber`) upon seat booking',
      'Dynamic stream seat gauges tracking MPC, BiPC, CEC, MEC, and Polytechnic capacity',
      'Fee concession and parent payment capacity notes logging (`ableToBearFee`)',
      'Real-time admission velocity tracking against institutional targets',
    ],
    previewMetrics: [
      { label: 'Confirmed Admissions', value: '624' },
      { label: 'Campus Visits In-Flight', value: '148' },
      { label: 'Target Quota Filled', value: '78%' },
    ],
  },
  {
    id: 'territory',
    title: 'School & Territory Intelligence',
    tagline: 'Help regional managers and institutional leadership organize field coverage and review outreach.',
    businessValue:
      'Eliminates unvisited schools and territory blind spots through structured school registries and mandal coverage heatmaps.',
    description:
      'Master high school directory containing Headmaster names, contact numbers, 10th student strength, and school grade ratings (A+, A, B). Features mandal-level coverage progress grids, target vs collected lead counts, and board-ready PDF exports.',
    capabilities: [
      'Master High School Directory with Headmaster contact details and student strength',
      'School grade categorization (Grade A+, A, B) to prioritize high-yield outreach',
      'Mandal-by-mandal school progress grid (`/analytics`) showing unvisited campuses',
      'Zonal lead target-versus-collected ratios for regional managers',
      'One-click modal exporting institution-wide school targets and strength summaries',
      'Geographical boundary controls isolating campus branches by allowed mandals',
    ],
    previewMetrics: [
      { label: 'High Schools Mapped', value: '184' },
      { label: 'Mandals Covered', value: '14' },
      { label: '10th Pool Identified', value: '14,200' },
    ],
  },
  {
    id: 'guidance',
    title: 'Career Guidance & Student Resources (USP)',
    tagline: 'Give students useful educational guidance while creating an ethical introduction to your institution.',
    businessValue:
      'The "Trojan Horse" that unlocks high school gates: Headmasters welcome free student career counseling, generating verified leads ethically.',
    description:
      'A structured 25-question, 5-module digital student assessment covering Group Clarity, Study Discipline, Screen Time, Family Attitude, and Career Readiness. Generates personalized 10-point modular scores, bilingual Telugu/English diagnostic reports, stream recommendations (MPC/BiPC/CEC), digital study books, and guidance videos.',
    capabilities: [
      '5-Module Career Clarity & Aptitude Test (25 scientifically weighted questions)',
      'Instant 360° student diagnostic report calculating 10-point modular discipline scores',
      'Ideal stream recommendations (MPC, BiPC, CEC, MEC, HEC) based on aptitude',
      'Tailored behavioral action plans provided in bilingual Telugu and English text',
      'Cloud library of digital study materials and exam strategy videos',
      'Memory secrets & scientific revision scheduling module for 10th-grade board exams',
    ],
    previewMetrics: [
      { label: 'Tests Completed', value: '2,140' },
      { label: 'Telugu Reports Issued', value: '1,980' },
      { label: 'Headmaster Approval Rate', value: '96%' },
    ],
  },
];

// ==========================================
// 5 CAREER GUIDANCE ASSESSMENT MODULES (USP)
// ==========================================
export interface CareerGuidanceModule {
  id: string;
  moduleNumber: string;
  name: string;
  nameTelugu: string;
  tagline: string;
  weighting: string;
  sampleQuestion: string;
  sampleOptions: string[];
  diagnosticScore: number;
  maxScore: number;
  recommendationEnglish: string;
  recommendationTelugu: string;
  badgeColor: string;
}

export const careerModulesData: CareerGuidanceModule[] = [
  {
    id: 'clarity',
    moduleNumber: '01',
    name: 'Group Clarity',
    nameTelugu: 'గ్రూప్ స్పష్టత',
    tagline: 'Stream Aptitude Assessment (MPC / BiPC / CEC / MEC)',
    weighting: '6 Questions · Scientific Stream Fit Index',
    sampleQuestion: 'When solving real-world challenges, which thinking pattern excites you the most?',
    sampleOptions: [
      'Mathematical formulas, logical proofs, and physics problems (MPC)',
      'Biological organisms, healthcare, botany, and medical sciences (BiPC)',
      'Commerce, accountancy, financial markets, and business logic (CEC/MEC)',
      'Practical engineering mechanics, circuits, and technical craftsmanship (Polytechnic)',
    ],
    diagnosticScore: 9.2,
    maxScore: 10,
    recommendationEnglish: 'Strong analytical aptitude identified. High alignment with MPC stream and engineering competitive preparation (JEE/EAMCET).',
    recommendationTelugu: 'గణితం మరియు భౌతిక శాస్త్రాలలో బలమైన విశ్లేషణాత్మక నైపుణ్యాలు గుర్తించబడ్డాయి. MPC గ్రూప్ అనుకూలంగా ఉంది.',
    badgeColor: '#2563EB',
  },
  {
    id: 'discipline',
    moduleNumber: '02',
    name: 'Study Discipline',
    nameTelugu: 'అధ్యయన క్రమశిక్షణ',
    tagline: 'Daily Revision Routine & Self-Study Consistency',
    weighting: '5 Questions · Time Allocation & Habit Index',
    sampleQuestion: 'How many dedicated hours do you consistently spend on independent self-study without distractions?',
    sampleOptions: [
      '3+ focused hours daily with a written subject schedule',
      '1 to 2 hours with occasional weekend revisions',
      'Only during unit tests and final examinations',
      'Irregular schedule, need guided mentoring',
    ],
    diagnosticScore: 7.4,
    maxScore: 10,
    recommendationEnglish: 'Moderate discipline observed. Recommend structured 90-minute evening study blocks and weekly formula revision sheets.',
    recommendationTelugu: 'మితమైన క్రమశిక్షణ ఉంది. ప్రతిరోజూ 2 గంటల పాటు స్వీయ అధ్యయనం చేయడం ద్వారా లక్ష్యాలను సాధించవచ్చు.',
    badgeColor: '#16A34A',
  },
  {
    id: 'screentime',
    moduleNumber: '03',
    name: 'Screen Habits',
    nameTelugu: 'డిజిటల్ అలవాట్లు',
    tagline: 'Smartphone Distraction & Digital Focus Analysis',
    weighting: '5 Questions · Focus Retention Score',
    sampleQuestion: 'How frequently does your phone or social media interrupt your study concentration?',
    sampleOptions: [
      'Phone is kept in another room during study hours',
      'Notifications checked hourly or between study breaks',
      'Phone remains active next to textbooks with frequent alerts',
      'High gaming and short-video consumption exceeding 3 hours daily',
    ],
    diagnosticScore: 5.6,
    maxScore: 10,
    recommendationEnglish: 'High screen distraction risk detected. Recommend enabling Focus Mode during study hours and removing notifications.',
    recommendationTelugu: 'డిజిటల్ దృష్టి మళ్లింపు ఎక్కువగా ఉంది. చదువుకునే సమయంలో ఫోన్ దూరంగా ఉంచడం అత్యవసరం.',
    badgeColor: '#D97706',
  },
  {
    id: 'family',
    moduleNumber: '04',
    name: 'Family Support',
    nameTelugu: 'కుటుంబ సహకారం',
    tagline: 'Parent Alignment & Educational Environment',
    weighting: '4 Questions · Parental Engagement Metric',
    sampleQuestion: 'Have you discussed your future higher education goals with your parents and mentors?',
    sampleOptions: [
      'Parents fully understand and support my chosen study pathway',
      'Parents want guidance from college counselors to understand career options',
      'Parental career preferences differ from my personal interest',
      'Parents need detailed financial and scholarship counseling',
    ],
    diagnosticScore: 8.5,
    maxScore: 10,
    recommendationEnglish: 'Positive parental enthusiasm. Provide parent with Telugu career handbook and scholarship breakdown.',
    recommendationTelugu: 'కుటుంబ సహకారం అనుకూలంగా ఉంది. తల్లిదండ్రులకు తెలుగు కెరీర్ గైడెన్స్ పుస్తకం అందించడం మేలు.',
    badgeColor: '#0F766E',
  },
  {
    id: 'readiness',
    moduleNumber: '05',
    name: 'Career Readiness',
    nameTelugu: 'కెరీర్ సన్నద్ధత',
    tagline: 'Entrance Exam Awareness & Long-Term Motivation',
    weighting: '5 Questions · Ambition & Resilience Index',
    sampleQuestion: 'How clear is your understanding of competitive entrance exams (EAMCET, JEE, NEET, CA Foundation)?',
    sampleOptions: [
      'Thoroughly researched syllabus, exam pattern, and college cutoffs',
      'Familiar with exam names but need coaching advice and curriculum plan',
      'Aware of career outcomes but uncertain about qualifying exams',
      'Need foundational orientation on modern degree vs vocational choices',
    ],
    diagnosticScore: 8.8,
    maxScore: 10,
    recommendationEnglish: 'High career ambition. Excellent candidate for specialized coaching batches with foundation test series.',
    recommendationTelugu: 'స్పష్టమైన కెరీర్ లక్ష్యం ఉంది. ఫౌండేషన్ మరియు కోచింగ్ బ్యాచ్‌లకు అనువైన అభ్యర్థి.',
    badgeColor: '#7C3AED',
  },
];

// ==========================================
// 6 USER ROLES (INCLUDING STUDENT)
// ==========================================
export const productRoles: ProductRole[] = [
  {
    id: 'management',
    name: 'College Management / Principal',
    title: 'Executive Oversight & Intake Control',
    badge: 'CHAIRMAN & PRINCIPAL',
    description:
      'Provides College Chairmen, Principals, and Deans with real-time operational visibility into student admissions, stream distribution, and regional productivity.',
    responsibilities: [
      'Review real-time admission intake velocity against target seat quotas',
      'Monitor total enquiries, active follow-ups, and confirmed admissions across campuses',
      'Evaluate individual PRO and regional AGM productivity without waiting for paper reports',
      'Analyze school-wise and mandal-wise return on field marketing investments',
      'Generate one-click board-ready PDF school strength summaries and enrollment reports',
    ],
    keyTools: ['Real-Time Intake Funnel', 'Stream Quota Gauges', 'Mandal Progress Heatmap', 'Board PDF Summary Modal'],
    mockupStats: [
      { label: 'Total Enquiries', value: '4,850', color: '#2563EB' },
      { label: 'Admissions Confirmed', value: '624', color: '#16A34A' },
      { label: 'Pending Reviews', value: '1,120', color: '#D97706' },
      { label: 'Target Achievement', value: '78%', color: '#7C3AED' },
    ],
    mockupRows: [
      { col1: 'MPC Stream', col2: '280 / 300 Seats', col3: '₹42.0 L', status: 'Near Full' },
      { col1: 'BiPC Stream', col2: '194 / 220 Seats', col3: '₹29.1 L', status: 'On Track' },
      { col1: 'CEC Stream', col2: '150 / 180 Seats', col3: '₹18.0 L', status: 'Healthy' },
    ],
  },
  {
    id: 'agm',
    name: 'AGM / Regional Manager',
    title: 'Zonal Command & Field Supervision',
    badge: 'AREA MANAGER',
    description:
      'Empowers Area Managers to coordinate 5 to 10 field PROs across designated mandals, allocate village clusters, assign daily tasks, and inspect coverage.',
    responsibilities: [
      'Assign daily school visits and administrative tasks to field officers with deadlines',
      'Review daily visit logs and doorstep verifications across all assigned PROs',
      'Monitor high school coverage progress to prevent unvisited institutions in the zone',
      'Track PRO productivity, star prospect generation, and daily lead quotas',
      'Report regional admission forecasts and territory progress directly to college directors',
    ],
    keyTools: ['Zonal Team Board', 'Mandal Coverage Grid', 'PRO Leaderboard', 'Daily Task Dispatcher'],
    mockupStats: [
      { label: 'Active Field PROs', value: '7', color: '#2563EB' },
      { label: 'Schools Covered', value: '48 / 60', color: '#16A34A' },
      { label: 'Team Daily Leads', value: '184', color: '#0F766E' },
      { label: 'Zonal Target', value: '82%', color: '#7C3AED' },
    ],
    mockupRows: [
      { col1: 'PRO: K. Suresh', col2: 'Zone: Miryalaguda', col3: '38 Leads Logged', status: 'Top Performer' },
      { col1: 'PRO: V. Naresh', col2: 'Zone: Huzurnagar', col3: '24 Leads Logged', status: 'On Target' },
      { col1: 'PRO: B. Rajesh', col2: 'Zone: Kodad', col3: '16 Leads Logged', status: 'Review Needed' },
    ],
  },
  {
    id: 'pro',
    name: 'Field PRO / Admission Representative',
    title: 'Ground Force Mobile Workspace',
    badge: 'FIELD OFFICER',
    description:
      'Lightweight, touch-optimized mobile workspace built for Public Relations Officers visiting high schools, tuition centers, and student doorsteps.',
    responsibilities: [
      'Log student leads directly on mobile while speaking with parents (zero paperwork)',
      'Record doorstep visit verification flag (`doorstepCompleted: true`) upon home visits',
      'Catalog high school profiles: Headmaster contact, 10th student strength, and grade rating',
      'Map village key influencers (sarpanches) and relative contacts for local credibility',
      'Review updates logged by telecallers via red notification badges before knocking on doors',
      'Generate 1-click PDF Day Reports and share directly to institutional WhatsApp groups',
    ],
    keyTools: ['Mobile Quick-Add', 'Visit History Log', 'Doorstep Verification Toggle', '1-Click WhatsApp Share'],
    mockupStats: [
      { label: "Today's Visits", value: '14', color: '#2563EB' },
      { label: 'New Leads Logged', value: '28', color: '#16A34A' },
      { label: 'Doorsteps Verified', value: '9', color: '#0F766E' },
      { label: 'Tasks Due', value: '2', color: '#DC2626' },
    ],
    mockupRows: [
      { col1: 'ZPHS High School, Alwal', col2: 'HM: S. Rama Rao', col3: 'Grade A+ (140 Std)', status: 'Visited' },
      { col1: 'Student: R. Sai Kiran', col2: 'Father: R. Ramesh (Farmer)', col3: 'Doorstep Verified', status: 'Interested' },
      { col1: 'Key Person: K. Venkat Reddy', col2: 'Village Sarpanch', col3: 'Mandal Coordinator', status: 'Mapped' },
    ],
  },
  {
    id: 'telecaller',
    name: 'Telecaller & Desk Counselor',
    title: 'High-Velocity Conversion Desk',
    badge: 'PHONE COUNSELOR',
    description:
      'Streamlined calling desk tailored for phone counselors with daily activity counters, scheduled callback queues, and real-time synchronization with field PROs.',
    responsibilities: [
      'Call newly captured field leads within minutes of PRO submission while interest is fresh',
      'Update call dispositions (Interested, Campus Visit Scheduled, Joined, Not Interested)',
      'Schedule exact-time callbacks and exam-specific triggers (After Exams, After Results)',
      'Access prior PRO visit notes, parent occupation, and fee bearable status during the call',
      'Direct tele-counseling with High School Headmasters and village influencers',
    ],
    keyTools: ['Assigned Calling Queue', 'Daily Call Volume Counter', 'Scheduled Callback Alarms', '2-Way Notes Sync'],
    mockupStats: [
      { label: 'Calls Made Today', value: '86', color: '#2563EB' },
      { label: 'Interested Leads', value: '34', color: '#16A34A' },
      { label: 'Follow-ups Due Today', value: '18', color: '#D97706' },
      { label: 'Campus Visits Booked', value: '7', color: '#7C3AED' },
    ],
    mockupRows: [
      { col1: 'P. Bhavani (MPC)', col2: 'Father: P. Krishna', col3: 'Next Call: Today 4:30 PM', status: 'Follow-up' },
      { col1: 'M. Tarun (BiPC)', col2: 'Mother: M. Lakshmi', col3: 'Visiting Campus Saturday', status: 'Campus Visit' },
      { col1: 'K. Anusha (CEC)', col2: 'Father: K. Nagesh', col3: 'Paid Application Fee', status: 'Admitted' },
    ],
  },
  {
    id: 'superadmin',
    name: 'Super Admin / Registrar',
    title: 'System Governance & Data Security',
    badge: 'SYSTEM REGISTRAR',
    description:
      'Provides institutional registrars and IT administrators complete governance over user accounts, master dictionaries, career test questions, and automated backups.',
    responsibilities: [
      'Create and activate accounts for Principals, AGMs, PROs, and Telecallers',
      'Review organic student self-signups in the Pending Approvals Queue and assign to PROs',
      'Configure course categories, streams (MPC, BiPC, CEC), and geographical mandal masters',
      'Manage career guidance question bank, scoring formulas, and digital study resources',
      'Oversee automated database backup scripts compressing and uploading data to Google Drive',
    ],
    keyTools: ['Master User Directory', 'Pending Student Approvals', 'Master Dictionaries', 'Google Drive Backups'],
    mockupStats: [
      { label: 'Total Active Users', value: '38', color: '#2563EB' },
      { label: 'Configured Streams', value: '6', color: '#16A34A' },
      { label: 'Schools Mapped', value: '184', color: '#0F766E' },
      { label: 'Database Health', value: '100%', color: '#16A34A' },
    ],
    mockupRows: [
      { col1: 'Role: EMPLOYEE (PRO)', col2: '24 Accounts Active', col3: 'Last Login: 12m ago', status: 'Operational' },
      { col1: 'Role: TELECALLER', col2: '6 Desks Active', col3: 'Last Login: 3m ago', status: 'Operational' },
      { col1: 'Role: TEAM_LEADER (AGM)', col2: '4 Accounts Active', col3: 'Last Login: 25m ago', status: 'Operational' },
    ],
  },
  {
    id: 'student',
    name: 'Student / Prospective Applicant',
    title: 'Career Guidance & Assessment Portal',
    badge: 'STUDENT PORTAL',
    description:
      'Dedicated self-service portal where prospective 10th-grade students take the 5-module career test, explore streams, and access free board preparation resources.',
    responsibilities: [
      'Self-register or log in via phone number (auto-linked to existing PRO field records)',
      'Complete the 25-question, 5-module digital career clarity and study discipline assessment',
      'Review personalized 10-point modular scores, recommended streams, and Telugu action plans',
      'Download free digital study books and watch curated exam guidance videos',
      'Submit counseling questions via "Ask an Expert" (UI preview — backend roadmap)',
    ],
    keyTools: ['5-Module Test Engine', 'Telugu Diagnostic Report', 'Digital Books Library', 'Guidance Videos'],
    mockupStats: [
      { label: 'Aptitude Modules', value: '5', color: '#2563EB' },
      { label: 'Assessment Questions', value: '25', color: '#16A34A' },
      { label: 'Telugu Action Plan', value: 'Ready', color: '#0F766E' },
      { label: 'Study Resources', value: 'Free', color: '#7C3AED' },
    ],
    mockupRows: [
      { col1: 'Module 1: Group Clarity', col2: 'Score: 9 / 10', col3: 'Recommended: MPC Stream', status: 'High Fit' },
      { col1: 'Module 2: Study Discipline', col2: 'Score: 7 / 10', col3: 'Action: 2hr Daily Revision', status: 'Action Plan' },
      { col1: 'Module 3: Screen Time', col2: 'Score: 5 / 10', col3: 'Flag: High Gaming Usage', status: 'Guidance' },
    ],
    notes: 'The "Ask an Expert" submission interface is client-simulated in the current product and planned for full backend deployment.',
  },
];

// ==========================================
// 6-STAGE ADMISSION WORKFLOW
// ==========================================
export const admissionWorkflow: WorkflowStage[] = [
  {
    step: 1,
    name: 'Discover',
    title: 'High School & Village Outreach',
    actor: 'Field PRO',
    description:
      'The PRO visits a rural high school or student doorstep, meets the Headmaster, and engages prospective 10th-grade students.',
    outcome: 'Initial physical connection established; trust built with school administration.',
  },
  {
    step: 2,
    name: 'Capture',
    title: 'Mobile-First Lead Entry',
    actor: 'PRO Mobile App',
    description:
      'PRO inputs student details, father occupation, fee bearable capacity, and toggles doorstep verification on their mobile device.',
    outcome: 'Student profile created; duplicate check prevents double-entry.',
  },
  {
    step: 3,
    name: 'Follow Up',
    title: 'Instant Field-to-Desk Push',
    actor: 'Campus Telecaller',
    description:
      'The lead immediately surfaces in the assigned Telecaller queue. Counselor dials the family within hours while interest is fresh.',
    outcome: 'Call disposition logged; scheduled callback or campus visit booked.',
  },
  {
    step: 4,
    name: 'Coordinate',
    title: '2-Way Bidirectional Sync',
    actor: 'PRO + Telecaller Loop',
    description:
      'Telecaller notes update the PRO mobile notification badge in real time. PRO visits the family again with complete conversation context.',
    outcome: 'Zero confusion; family experiences coordinated, professional attention.',
  },
  {
    step: 5,
    name: 'Track Application',
    title: 'Application & Seat Locking',
    actor: 'Admission Office',
    description:
      'The student selects their stream (MPC/BiPC/CEC). The registrar issues an official application number and confirms enrollment.',
    outcome: 'Status flipped to "Admitted" (`joinedCollegeId`); quota count increments.',
  },
  {
    step: 6,
    name: 'Monitor Progress',
    title: 'Executive Intake Analytics',
    actor: 'Management / Principal',
    description:
      'Leadership monitors live intake velocity, mandal school progress, and stream capacity across campuses on executive dashboards.',
    outcome: 'Complete operational visibility; data-driven decisions during peak weeks.',
  },
];

// ==========================================
// 5 TARGET AUDIENCES
// ==========================================
export const targetAudiences = [
  {
    title: 'Junior & Intermediate Colleges',
    badge: 'CLASS 11 & 12',
    description:
      'Specifically institutes offering MPC (Maths, Physics, Chemistry), BiPC (Biology), CEC (Commerce), and MEC streams where intense rural school outreach determines annual survival.',
    admissionChallenge: 'Intense seasonal competition (March–June); high school headmasters reject commercial sales reps.',
    productValue: '5-Module Career Guidance test & Study Books gain ethical school entry; instant Telugu/English reports win parent trust.',
  },
  {
    title: 'Degree & Higher Education Colleges',
    badge: 'UG & PG COLLEGES',
    description:
      'Higher education institutions offering B.Sc, B.Com, BBA, and BCA programs requiring multi-stream counseling and rural mandal outreach.',
    admissionChallenge: 'Difficulty tracking non-science stream leads across rural towns with scattered applicant interests.',
    productValue: 'Stream-specific quota tracking, village influencer directories, and parent occupation profiling.',
  },
  {
    title: 'Polytechnic & ITI Institutes',
    badge: 'TECHNICAL ACADEMIES',
    description:
      'Technical vocational institutions conducting rural student mobilization drives for engineering diplomas and practical trades.',
    admissionChallenge: 'Reaching students in remote villages who are unaware of technical diploma opportunities.',
    productValue: 'Mandal school progress grids, doorstep visit verifications, and career pathway guides.',
  },
  {
    title: 'Residential & Specialized Academies',
    badge: 'RESIDENTIAL CAMPUSES',
    description:
      'Institutes requiring high-touch doorstep counseling across distant districts where parents need deep reassurance before enrolling.',
    admissionChallenge: 'PROs travel hours to distant villages with zero accountability on whether home visits occurred.',
    productValue: 'Doorstep verification tracking, village relative contact mapping, and 1-click WhatsApp Day Report PDFs.',
  },
  {
    title: 'Multi-Campus Educational Groups',
    badge: 'ZONAL EDUCATIONAL GROUPS',
    description:
      'Societies managing multiple campus branches across districts with 20 to 50 field representatives and centralized telecalling desks.',
    admissionChallenge: 'Managing large field teams without lead theft, data overlap, or inter-branch disputes.',
    productValue: 'Role-based access boundaries (`allowedLocations`, `allowedGroups`), zonal hierarchy, and 100% Institutional Lead Vault.',
  },
];

// ==========================================
// 6-PHASE ONBOARDING ROADMAP
// ==========================================
export const implementationStages = [
  {
    step: 1,
    phase: 'Phase 1',
    name: 'Discovery & Workflow Alignment',
    timeline: 'Day 1–2',
    description: 'We assess your current admission structure, number of field PROs, telecalling desk capacity, and stream requirements.',
  },
  {
    step: 2,
    phase: 'Phase 2',
    name: 'Scope & Commercial Confirmation',
    timeline: 'Day 3',
    description: 'Agreement on user seats, campus boundaries, data migration requirements, and final commercial subscription terms.',
  },
  {
    step: 3,
    phase: 'Phase 3',
    name: 'Master System Configuration',
    timeline: 'Day 4–5',
    description: 'Provisioning of your secure cloud instance, course groups, mandal dictionaries, and high school master directory.',
  },
  {
    step: 4,
    phase: 'Phase 4',
    name: 'Team Account Setup & RBAC',
    timeline: 'Day 6',
    description: 'Creation of user accounts for Principals, AGMs, PROs, and Telecallers with appropriate permission boundaries.',
  },
  {
    step: 5,
    phase: 'Phase 5',
    name: 'Interactive Staff Orientation',
    timeline: 'Day 7–8',
    description: 'Hands-on training sessions for field officers (mobile app workflows) and telecallers (calling queues and notes).',
  },
  {
    step: 6,
    phase: 'Phase 6',
    name: 'Go-Live & Follow-Up Support',
    timeline: 'Day 9–10',
    description: 'Platform goes live for your admission campaign with dedicated WhatsApp and phone support during peak hours.',
  },
];

// ==========================================
// 19 FREQUENTLY ASKED QUESTIONS
// ==========================================
export const faqList: FAQItem[] = [
  {
    category: 'Platform & Scope',
    question: '1. What is the College Admission Management Platform by SriWeb Technologies?',
    answer:
      'It is a specialized B2B education SaaS platform engineered to unify college leadership, regional area managers (AGMs), field representatives (PROs), and central telecallers into one synchronized, real-time admission pipeline.',
  },
  {
    category: 'Platform & Scope',
    question: '2. Which educational institutions is this platform designed for?',
    answer:
      'It is optimized for Junior and Intermediate Colleges (Class 11 & 12), Degree Colleges, Polytechnic and ITI Institutes, Residential Academies, and Multi-Campus Educational Groups that rely on active field marketing and telecalling.',
  },
  {
    category: 'Workflows & Features',
    question: '3. How does the PRO and telecaller workflow work together?',
    answer:
      'The moment an on-ground PRO submits a student lead in a school or village, it surfaces immediately in the campus telecaller queue. When the telecaller logs call feedback, a notification badge alerts the PRO on mobile before they conduct a follow-up home visit.',
  },
  {
    category: 'Workflows & Features',
    question: '4. What is the difference between the AGM and PRO roles?',
    answer:
      'The PRO is a field officer who visits high schools and student homes. The AGM (Assistant General Manager / Area Manager) supervises a regional squad of 5 to 10 PROs, assigns daily tasks, monitors school coverage, and reviews zonal targets.',
  },
  {
    category: 'Workflows & Features',
    question: '5. Can college management track real-time admission progress?',
    answer:
      'Yes. College Chairmen and Principals have an executive dashboard showing total enquiries, active phone follow-ups, confirmed admissions (`joinedCollegeId`), stream quota breakdowns, and downloadable board-ready PDF summaries.',
  },
  {
    category: 'Career Guidance',
    question: '6. Does the platform include a student career assessment?',
    answer:
      'Yes. It includes a 25-question, 5-module digital aptitude test covering Group Clarity, Study Discipline, Screen Time, Family Attitude, and Career Readiness. It calculates modular scores and provides stream recommendations (MPC, BiPC, CEC).',
  },
  {
    category: 'Career Guidance',
    question: '7. Is the student guidance available in Telugu?',
    answer:
      'Yes. The 360° student diagnostic report features personalized behavioral action plans and study guidance written in bilingual Telugu and English, making it accessible and trustworthy for rural parents.',
  },
  {
    category: 'Security & Tech',
    question: '8. Does the platform work smoothly on mobile phones for field officers?',
    answer:
      'Yes. The PRO interface is mobile-first, responsive, and touch-optimized. Officers can log visits, verify student doorsteps, view school headmaster contacts, and record leads directly from any smartphone browser.',
  },
  {
    category: 'Security & Tech',
    question: '9. Is an Android application available for download?',
    answer:
      'The platform is packaged for Android via Capacitor (`com.prodayreport.app`) alongside a responsive Progressive Web App (PWA). Native APK distribution is provided during institutional onboarding where requested.',
  },
  {
    category: 'Security & Tech',
    question: '10. Does it support multiple college campuses or branches?',
    answer:
      'Yes. Campus accounts are governed by geographical and stream boundaries (`allowedGroups` and `allowedLocations`), ensuring branch staff only see student data designated for their specific institution.',
  },
  {
    category: 'Security & Tech',
    question: '11. How are user roles and permissions managed?',
    answer:
      'The application implements granular Role-Based Access Control (RBAC). Super Admins create and manage accounts with specific roles: Super Admin, College Management, Team Leader (AGM), Employee (PRO), Telecaller, and Student.',
  },
  {
    category: 'Platform & Scope',
    question: '12. Does the software include classroom attendance or student biometrics?',
    answer:
      'No. The software is hyper-focused on the pre-admission lifecycle (enquiries, field logs, telecalling, and conversions). It tracks field doorstep visits, not daily classroom lecture attendance.',
  },
  {
    category: 'Platform & Scope',
    question: '13. Does it include full college fee accounting or online payment gateways?',
    answer:
      'No. The platform qualifies parent fee-paying capacity (`ableToBearFee`) and logs official application numbers. It does not process online semester fee payments or manage institutional balance sheets.',
  },
  {
    category: 'Pricing & Commercials',
    question: '14. What is included in each subscription plan?',
    answer:
      'All plans follow a per-person-per-month subscription model without rigid staff limits. Plan A (Solo) is fixed at ₹999/person/month for independent field officers. Plan B (Regional Squad) and Plan C (Whole College Suite) feature negotiable per-person/month pricing tailored to your squad size and institutional campus requirements.',
  },
  {
    category: 'Pricing & Commercials',
    question: '15. Are setup and onboarding charges applicable?',
    answer:
      'Standard onboarding, master configuration, and remote staff training are typically included in the annual Whole College Suite contract. Custom legacy Excel migrations or custom workflows are evaluated upon discovery.',
  },
  {
    category: 'Pricing & Commercials',
    question: '16. Can existing student lead records from Excel be migrated?',
    answer:
      'Yes. Our engineering team provides structured data migration templates to import your historical school databases, headmaster contacts, and student lists during setup.',
  },
  {
    category: 'Security & Tech',
    question: '17. Is staff training or ongoing support available during admission season?',
    answer:
      'Yes. We provide interactive orientation for field staff and telecallers, supported by a dedicated WhatsApp team group and direct telephone assistance during peak admission weeks.',
  },
  {
    category: 'Pricing & Commercials',
    question: '18. How can an institution request a product demo?',
    answer:
      'You can submit the enquiry form on this page or connect via our configured business WhatsApp shortcut. We will schedule a personalized walkthrough tailored to your campus intake goals.',
  },
  {
    category: 'Pricing & Commercials',
    question: '19. What happens after submitting an enquiry?',
    answer:
      'Our solutions team reviews your institution type, admission team size, and requirements. We connect via phone or WhatsApp within 4 business hours to arrange an interactive screen share.',
  },
];
