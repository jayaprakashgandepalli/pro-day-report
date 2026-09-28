"use client";

import React, { useState } from 'react';
import { BookOpen, Headphones, Eye, Mic, PenTool, Brain, TrendingUp, Target, Users, Lightbulb, Link as LinkIcon, Sparkles, ZoomIn, Smile, Wand2, BookMarked, Layers } from 'lucide-react';

export default function MemorySecrets() {
  const [activeTab, setActiveTab] = useState('chart');

  // Chart data
  const chartData = [
    { label: 'చదవడం ద్వారా (Reading)', percent: 10, color: '#f87171', icon: <BookOpen size={16} /> },
    { label: 'వినడం ద్వారా (Listening)', percent: 20, color: '#fb923c', icon: <Headphones size={16} /> },
    { label: 'చూడటం ద్వారా (Seeing)', percent: 30, color: '#fbbf24', icon: <Eye size={16} /> },
    { label: 'వినడం, చూడటం ద్వారా (Listen & See)', percent: 50, color: '#a3e635', icon: <Brain size={16} /> },
    { label: 'చెప్పడం, చర్చించడం ద్వారా (Say & Discuss)', percent: 70, color: '#3b82f6', icon: <Mic size={16} /> },
    { label: 'స్వయంగా చేయడం ద్వారా (Doing)', percent: 90, color: '#34d399', icon: <PenTool size={16} /> },
  ];

  // Stairs data
  const stairsData = [
    { level: 1, text: 'పది సార్లు పరధ్యానంగా చదవడం - ఒకసారి చూస్తూ చదవడానికి సమానం.', bg: '#fee2e2', border: '#f87171' },
    { level: 2, text: 'పది సార్లు చూస్తూ చదవడం - ఒకసారి చూడకుండా చదవడానికి సమానం.', bg: '#ffedd5', border: '#fb923c' },
    { level: 3, text: 'పది సార్లు చూడకుండా చదవడం - ఒకసారి చూస్తూ రాయడంతో సమానం', bg: '#fef3c7', border: '#f59e0b' },
    { level: 4, text: 'పది సార్లు చూస్తూ రాయడం - ఒకసారి చూడకుండా రాయడంతో సమానం.', bg: '#ecfccb', border: '#84cc16' },
    { level: 5, text: 'పది సార్లు చూడకుండా రాయడం - ఒకసారి చూస్తూ ఇతరులకి బోధించడంతో సమానం.', bg: '#d1fae5', border: '#10b981' },
    { level: 6, text: 'పది సార్లు చూస్తూ బోధించడం - ఒకసారి చూడకుండా బోధించడంతో సమానం.', bg: '#dbeafe', border: '#3b82f6' },
  ];

  // 7 Principles data with full detailed text from the book
  const principlesData = [
    { 
      id: 1, 
      title: 'ఊహించడం', 
      engTitle: 'Principle of Imagination', 
      desc: 'మనం నేర్చుకోవలసిన విషయానికి సంబంధించిన అంశాలను మనసులో కళ్లకు కట్టినట్లు ఊహించడం ద్వారా, ఆ సమాచారాన్ని మన మెదడులో సులభంగా గుర్తుంచుకోవచ్చు. ఊహాశక్తి ప్రభావం చాలా ఎక్కువ. ఉదాహరణకు, శ్వాసక్రియ జరిగే విధానాన్ని చదువుతున్నప్పుడు మనం పీల్చే గాలి (ఉచ్ఛ్వాసం), వదిలే గాలి (నిశ్వాసం) గురించి ఊపిరితిత్తుల కదలికలను మైండ్‌లో ఊహిస్తే ఆ అంశం మీ మదిలో ఎక్కువ కాలం గుర్తుంటుంది.', 
      icon: <Lightbulb size={24} color="#f59e0b" />, 
      bg: '#fffbeb' 
    },
    { 
      id: 2, 
      title: 'సినిమాలా చూడటం', 
      engTitle: 'Principle of Visualization', 
      desc: 'మనం ఏ విషయాన్నైతే నేర్చుకోవాలో దానికి సంబంధించిన అంశాలను కేవలం అక్షరాల్లా కాకుండా బొమ్మల రూపంలో లేదా సినిమా లాగా మన మనోఫలకంపై (మైండ్‌లో) ఊహిస్తూ చూడాలి. ఇలా మనసులో బొమ్మలు గీసుకోవడం వల్ల జ్ఞాపకశక్తి పెరుగుతుంది, ఆ విషయం ఎక్కువ కాలం గుర్తుంటుంది. ఉదాహరణకు సోషల్, తెలుగుకి సంబంధించిన పాఠాలను, అందులోని కథలను దృశ్యరూపంలో మన మనసుపై ముద్రించుకుంటూ చదివితే అవి ఎక్కువ కాలం మన మెదడులో ఉండిపోతాయి.', 
      icon: <Eye size={24} color="#3b82f6" />, 
      bg: '#eff6ff' 
    },
    { 
      id: 3, 
      title: 'లింక్ చేయడం', 
      engTitle: 'Principle of Association', 
      desc: 'నేర్చుకోవలసిన కొత్త అంశానికి సంబంధించిన వాటిని ఒక క్రమపద్ధతిలో, ఒక దానితో ఒకటి జోడిస్తూ (లింక్ చేస్తూ) ఒక గ్రూపుగా ఏర్పరచితే దీర్ఘకాలం గుర్తుంచుకోవడానికి అవకాశం ఉంటుంది. ఉదాహరణకు చరిత్ర (హిస్టరీ) చదివేటప్పుడు, ఒక యుద్ధం, దాని ఫలితంగా జరిగిన మీటింగ్, అందులోని తప్పుల వల్ల జరిగిన మరో పరిణామం.. ఇలా అన్నింటినీ ఒక దానితో ఒకటి లింక్ చేస్తూ చదివితే పరీక్షలలో చాలా ఈజీగా సమాధానాలు రాయవచ్చు.', 
      icon: <LinkIcon size={24} color="#10b981" />, 
      bg: '#ecfdf5' 
    },
    { 
      id: 4, 
      title: 'ఫీల్ అవ్వడం', 
      engTitle: 'Principle of Sensory Effects', 
      desc: 'మనం నేర్చుకునే అంశాలను మైండ్‌లో ఊహించడమే కాకుండా, వాటికి మన పంచేంద్రియాలకు సంబంధించిన లక్షణాలైన రంగు, వాసన, స్పర్శ, రుచి, శబ్దాలను జోడించాలి. ఇది కేవలం మన ఊహల్లో జరిగేదే అయినా, ఇలా ఫీల్ అవ్వడం వల్ల వాటిని చాలా కాలం గుర్తుంచుకోవచ్చు. ఉదాహరణకు సైన్స్‌లో (రసాయన శాస్త్రం) వివిధ మూలకాలను, వాటి గుణాలను గుర్తుంచుకునేటపుడు వాటిని రంగులతో, వాసనలతో ముడిపెట్టి గుర్తుంచుకోవాలి.', 
      icon: <Sparkles size={24} color="#8b5cf6" />, 
      bg: '#f5f3ff' 
    },
    { 
      id: 5, 
      title: 'వింతగా ఊహించడం', 
      engTitle: 'Principle of Illogic Thinking', 
      desc: 'నేర్చుకోవలసిన విషయాలను లాజిక్ లేకుండా (తర్కరహితంగా), విచిత్రంగా ఊహించడం వల్ల అవి ఎక్కువకాలం మదిలో ఉండిపోతాయి. కొన్ని పాఠాలకు సంబంధించిన విషయాలను మామూలుగా కాకుండా చాలా వింతగా ఉండే విధంగా ఊహించడం వల్ల ఎక్కువ కాలం గుర్తుంటాయి. ఉదాహరణకు కార్టూన్ నెట్‌వర్క్‌లో వచ్చే విచిత్రమైన కథలు పిల్లలకు ఎక్కువ కాలం గుర్తుండటానికి కారణం ఇదే!', 
      icon: <Brain size={24} color="#ec4899" />, 
      bg: '#fdf2f8' 
    },
    { 
      id: 6, 
      title: 'పెద్దదిగా చూడటం', 
      engTitle: 'Principle of Magnification', 
      desc: 'నేర్చుకోవలసిన విషయాలను ఊహించేటపుడు వాటిని మామూలు సైజు కన్నా చాలా పెద్ద, పెద్ద వాటిగా ఊహించాలి. మన మనస్సులో ఆశ్చర్యాన్ని కలిగించేవే ఎక్కువ కాలం గుర్తుంటాయి. ఉదాహరణకు మ్యాథ్స్ (గణితం) లో జ్యామితి (Geometry) కి సంబంధించిన గుర్తులను, చిత్రాలను చాలా పెద్దవిగా ఊహించుకుంటే అవి చాలా సులువుగా గుర్తుంటాయి.', 
      icon: <ZoomIn size={24} color="#06b6d4" />, 
      bg: '#ecfeff' 
    },
    { 
      id: 7, 
      title: 'ఫన్నీగా ఊహించడం', 
      engTitle: 'Principle of Ridicule', 
      desc: 'మనం నేర్చుకునే అంశాల గురించి ఊహించేటపుడు అది నవ్వు తెప్పించే విధంగా, ఫన్నీగా (హాస్యంగా) ఉండాలి. మనసుకు ఆనందాన్ని, ఉల్లాసాన్ని కలిగించే విషయాలే ఎక్కువ కాలం జ్ఞాపకం ఉంటాయి. ఈ ఏడు సూత్రాలను వాడుకుంటూ నేర్చుకునే విషయాలను మెదడులో ఫిక్స్ చేసుకోవాలి. విషయాలను గుర్తుంచుకోవడం అనేది ఒక అద్భుతమైన కళ. ప్రాక్టీస్ (అభ్యాసం) ద్వారా ఎవరైనా దీనిని అలవర్చుకోవచ్చు!', 
      icon: <Smile size={24} color="#f43f5e" />, 
      bg: '#fff1f2' 
    }
  ];

  // 9 Study Tips (అభ్యాసనలో ముఖ్యాంశాలు) - 100% Exact detailed text
  const studyTipsData = [
    {
      id: 1,
      title: 'అవగాహనతో కూడిన అభ్యాసన',
      engTitle: 'Learning with Understanding',
      desc: 'నేర్చుకుంటున్న విషయాన్ని ఏ మాత్రం అర్థం చేసుకోకుండా వల్లె వేసే పద్ధతిని ROT Learning Method లేదా బట్టీ అభ్యాసన పద్ధతి అంటారు. చిన్న పిల్లలతో ఎక్కాలు, రైమ్స్ ఈ విధంగానే బట్టీ పట్టిస్తారు. పూర్వకాలంలో వేదాభ్యాసం ఇలాగే జరిగేది. కానీ వేదాభ్యాసంలో అంశాలు కంఠతా వచ్చిన తర్వాత అర్థవంతమైన అభ్యాసనకు విద్యార్థిని సిద్ధం చేసేవారు. అర్థం కాకుండా చదివే విద్యార్థులను "యాస్కుడు" అనే మహర్షి "గంధం చెక్కలను మోసే గాడిదలతో" పోల్చాడు. అంతేకాక ప్రాచీన కాలంలో ప్రింటింగ్ ప్రెస్ (ముద్రణాయంత్రాలు) లేకపోవడం వలన పాఠాలను విద్యార్థులు తప్పనిసరిగా బట్టీ పట్టాల్సిఉండేది. ఇలా కాకుండా నేర్చుకుంటున్న ప్రతి విషయానికి పాత పరిజ్ఞానాన్ని జోడిస్తూ నేర్చుకోవడం వలన విషయాల మధ్య పరస్పర సంబంధం అర్థం చేసుకోవడానికి అవకాశం ఉంటుంది. అంతే కాకుండా విద్యార్థి ఎక్కువ కాలం గుర్తుంచుకునేందుకు వీలుంటుంది. అవగాహన లేకుండా బట్టీ పట్టినట్లైతే మధ్యలో ఏ మాత్రం మరచిపోయినా మొత్తం అంతా వృధా అయ్యే పరిస్థితి ఎదురవుతుంది.',
      bg: '#f0fdf4', border: '#4ade80'
    },
    {
      id: 2,
      title: 'విషయాల మధ్య పరస్పర సంబంధాలు',
      engTitle: 'Linking Subjects',
      desc: 'నేర్చుకోవడం అంటే ఇంతకుముందు తెలిసిన విషయానికి సంబంధించిన కొత్త విషయాన్ని జోడించడమే. ప్రాథమిక పరిజ్ఞానానికి కొత్త జ్ఞానాన్ని జోడించినట్లైతే ఆ విషయం బాగా గుర్తుండే అవకాశం ఉంటుంది. ఒక విషయాన్ని విపులంగా అర్థం చేసుకోవాలంటే పాత పరిజ్ఞానం తోడ్పడుతుంది. వాటి మధ్య సంబంధాన్ని సక్రమంగా అవగాహన చేసుకుంటే మొత్తం విషయం గుర్తుంటుంది. ప్రాథమిక విషయాలపై అవగాహన ఉన్న విద్యార్థి ఉన్నత చదువులు చదవడానికి ఎక్కువ అవకాశం ఉంటుంది. ఉదాహరణకు: కిరణజన్య సంయోగక్రియ, శ్వాసక్రియ రెండింటిమధ్య సంబంధాలు అర్థం చేసుకోవాలంటే నిర్మాణ క్రియలు, విచ్ఛిన్న క్రియలు అర్థం చేసుకొని ఉండాలి. నెపోలియన్ యుద్ధాలు, వియన్నా సమావేశం పట్ల అవగాహన ఇటలీ, జర్మనీ ఏకీకరణను అర్థం చేసుకోవడానికి తోడ్పడుతుంది. ఐక్యరాజ్యసమితి వైఫల్యానికి కారణాలపై అవగాహన, అది సమర్ధవంతంగా పనిచేయడానికి సూచనలు తెలియచేయడానికి దోహదపడుతుంది. అదేవిధంగా జ్యామెట్రీ విషయంలో సరళరేఖను అర్థం చేసుకోవడానికి బిందువు, చతురస్రాన్ని అర్థం చేసుకోడానికి సరళరేఖ, ఘనం (Cube) అర్థం చేసుకోడానికి చతురస్రం... ఇలా ఒక విషయానికి మరొక విషయానికి ఉన్న సంబంధాలు మొత్తం విషయ పరిజ్ఞానం అర్థం చేసుకోవడానికి, గుర్తుంచుకొనుటకు తోడ్పడతాయి.',
      bg: '#eff6ff', border: '#60a5fa'
    },
    {
      id: 3,
      title: 'జ్ఞాపకశక్తిపై నీకు గల నమ్మకం',
      engTitle: 'Self Belief',
      desc: '"నేను ఏ విషయాన్నైనా ఎక్కువకాలం గుర్తుంచుకోగలను. నా జ్ఞాపక శక్తి రోజు రోజుకూ పెరుగుతుంది. చదువు పట్ల నాకు రోజు రోజుకూ ఆసక్తి పెరుగుతోంది" అంటూ నీకు నీవుగా పలుమార్లు చెప్పుకోవడం ద్వారా నీపై నీకు గల నమ్మకం పెరుగుతుంది. ఏం చదివినా మరచిపోతాను అని అనేకసార్లు అనుకోవడం, జ్ఞాపకశక్తి గురించి తక్కువగా అంచనా వేసుకోవడం పరాజయాన్ని కొని తెచ్చుకోవడమే! ముందుగా చెప్పుకున్నట్లుగా స్వీయ సూచనలు మన మానసిక ఉప చేతన (Subconscious) స్థాయిపై తీవ్ర ప్రభావాన్ని చూపుతాయి. నీ స్నేహితులకు లేదా నీ తల్లిదండ్రులకు లేదా ఇతరులకు నీపై నమ్మకం ఉందా? లేదా? అన్నది ముఖ్యం కాదు. నీపై నీకు ఎంత నమ్మకం ఉంది? అనేదే ముఖ్యం. ఆత్మవిశ్వాసం ఉన్నవారే ఏదైనా సాధించగలరు.',
      bg: '#fef2f2', border: '#f87171'
    },
    {
      id: 4,
      title: 'రంగుల్లో ఊహించడం',
      engTitle: 'Imagining in Colors',
      desc: 'మనమంతా రకరకాల కలలు కంటాం. తీరని కోరికలే కలల రూపంలో వస్తాయని ఆధునిక మనస్తత్వ శాస్త్రపిత సిగ్మండ్ ఫ్రాయిడ్ అంటారు. పగటి కలలు కనేవారు విజయం సాధించడం తక్కువ. మీకు వచ్చిన కలలను జాగ్రత్తగా గుర్తుకు తెచ్చుకోగలరా? మీరు కనే కల ఏ రంగుల్లో వచ్చిందో గుర్తించగలరా? సాధారణంగా మనం కనే కలలన్నీ నలుపు, తెలుపు రంగుల్లో ఉంటాయి. వచ్చిన కలలను ఊహాశక్తి ద్వారా రంగుల్లో గుర్తుకు తెచ్చుకోడానికి ప్రయత్నించండి. దీని ద్వారా జ్ఞాపక శక్తి పెరుగుతుందని శాస్త్రవేత్తల అభిప్రాయం. మానసిక శాస్త్రవేత్తల పరిశోధనల ప్రకారం నూటికి 93 మంది నలుపు మరియు తెలుపు రంగుల్లో కలలు కంటారట. విజయం సాధించాలనే తీవ్ర కాంక్ష (కోరిక) కలిగిన 7% మంది మాత్రమే రంగులలో కలలు కంటారట. అందుకే మన మాజీ రాష్ట్రపతి అబ్దుల్ కలాం గారు "కలలు కనండి, వాటిని సాకారం చేసుకోండి" అనేవారు. నిద్రపోతే వచ్చేది కల కాదట. మనకు నిద్రలేకుండా చేసేదే కల అని ఆయన నిర్వచించారు.',
      bg: '#fdf4ff', border: '#e879f9'
    },
    {
      id: 5,
      title: 'కొండ గుర్తు పద్ధతి',
      engTitle: 'Landmark Method',
      desc: 'ఏదైనా విషయాలను మనం వేగంగా ఎక్కువకాలం ఉండేటట్లుగా గుర్తుంచుకోవాలంటే ఏదైనా ఒక గుర్తుతో పోల్చుకోవాలి. ఉదాహరణకు: నెహ్రూ గారిని గుర్తుంచుకొనుటకు పొడవైన ముక్కు (లేదా ఎర్ర గులాబీ), హిట్లర్‌ను గుర్తుంచుకోవడానికి చిన్న మీసం, చర్చిల్‌ను గుర్తుంచుకోవడానికి నోటిలో సిగార్, ఇందిరాగాంధీని గుర్తుంచుకోవడానికి తెల్లని జుట్టు, భగత్‌సింగ్‌ను గుర్తుంచుకోవడానికి కోరమీసం, కౌబాయ్ టోపీ ఇలా... ఇవన్నీ వారికి సహజంగా ఉన్న కొన్ని లక్షణాలను లేదా అలవాట్లను కొంచెం అతిశయించి (హైలైట్ చేసి) గుర్తుంచుకోవడం వలన మెదడు వెంటనే ఆ గుర్తుకు సంబంధించిన అంశాలను జ్ఞాపకం తెచ్చుకోగలుగుతుంది.',
      bg: '#fff7ed', border: '#fb923c'
    },
    {
      id: 6,
      title: 'బొమ్మలు',
      engTitle: 'Images',
      desc: 'ఏ వస్తువునైనా, వ్యక్తినైనా, విషయాన్నైనా గుర్తుకు తెచ్చుకోవాలనుకున్నపుడు వారి నడకను గాని, మాట్లాడే తీరును గాని, వాటి నిర్మాణాన్ని గాని గుర్తుకు తెచ్చే బొమ్మలను మనసులో ముద్రించుకోవడం వలన శాశ్వతంగా జ్ఞాపకం ఉండే అవకాశం ఎక్కువగా ఉంటుంది.',
      bg: '#f5f3ff', border: '#a78bfa'
    },
    {
      id: 7,
      title: 'చోద్యాలు - వింతలు',
      engTitle: 'Oddities',
      desc: 'ఏదైనా వింతైన విషయాలు, చోద్యాలు నవ్వుపుట్టించే అంశాలు మన మనస్సులో గాఢమైన ముద్రవేసి ఎక్కువ కాలం గుర్తుండటానికి అవకాశం ఉంటుంది. మనకు బాధ కలిగించే అంశాలు మనస్సు గుర్తుతెచ్చుకోవడానికి ఇష్టపడదు. నవ్వు పుట్టించే అంశాలు, మనసుకి ఆహ్లాదం కలిగించే అంశాలు ఎక్కువ కాలం జ్ఞాపకం ఉంటాయి. ఉదాహరణకు: మీరు ఎవరైనా వ్యక్తిని కలిసినపుడు అతనిలో చోద్యంగా భావించే అంశాలు, వస్త్రధారణ, నవ్వుపుట్టించే అంశం ఏదైనా గుర్తుంచుకుంటే వారిని ఎక్కువ కాలం జ్ఞాపకం ఉంచుకోవచ్చును.',
      bg: '#fefce8', border: '#facc15'
    },
    {
      id: 8,
      title: 'దృశ్యీకరణ',
      engTitle: 'Visualization',
      desc: 'ఏవైనా అమూర్త ఆలోచనలు (కంటికి కనిపించనివి), లేదా ఒక ప్రయోగ విధానం లేదా కొన్ని కొత్త పదాలు, వాటిని సూచించే బొమ్మలతో కలిసి మనో ఫలకం మీద గుర్తుంచుకుంటే ఆ విధానం గుర్తు ఉంటుంది. ఉదాహరణకు: కిరణజన్య సంయోగక్రియ జరుగునపుడు ఆక్సిజన్ వెలువడుతుంది. ఈ విధానాన్ని దృశ్యీకరణ ద్వారా (ఒక బొమ్మలా) గుర్తుంచుకుంటే శాశ్వతంగా మదిలో ఉండిపోతుంది. పార్లమెంట్ సమావేశంలో లేనపుడు రాష్ట్రపతి ఆర్డినెన్స్ జారీ చేస్తారు. ఈ విషయం గుర్తుంచుకోడానికి పార్లమెంట్ బొమ్మ దానికి పెద్ద తాళం వేసి ఉండటం గుర్తుంచుకుంటే ఆర్డినెన్స్ గురించి వెంటనే రాయవచ్చును.',
      bg: '#ecfeff', border: '#22d3ee'
    },
    {
      id: 9,
      title: 'అక్షర పదక్రమం',
      engTitle: 'Acronyms',
      desc: 'ఏ అంశాలనైతే గుర్తుంచుకోవాలో వాటి ముఖ్యాంశాలు వరుసగా రాసి వాటి మొదటి అక్షరాలను ఒక సముదాయంగా ఏర్పరచి వచ్చిన పదాన్ని గుర్తుంచుకుంటే ఆ పదాలను ACCRONYMS అంటారు. ఉన్నత విద్యాభ్యాసం చేసే విద్యార్థులు పెద్ద పెద్ద సమాధానాలను గుర్తుంచుకునేందుకు వాటిని భాగాలుగా విభజించి ప్రతి విభాగం యొక్క శీర్షిక (Heading) యొక్క మొదటి అక్షరాలన్నీ ఒక పదంగా మార్చి గుర్తుంచుకుంటారు. ఉదాహరణకు: Acquired Immuno Deficiency Syndrome దీనిని AIDS గా గుర్తుంచుకుంటాం. South Asian Association For Regional Co-Operation దీనిని SAARC గా గుర్తుంచుకుంటాం. ఐక్యరాజ్యసమితి భద్రతా సమితిలో శాశ్వత సభ్యత్వం గల దేశాలు: అమెరికా, బ్రిటన్, చైనా, ఫ్రాన్స్, రష్యా అనే దేశాల మొదటి అక్షరాలను ABCFR గా గుర్తుంచుకోవచ్చును. ఎముక విరుపుల్లో రకాలు ఎ.చా.జ.వి.తా.లే అనిగుర్తుంచుకోవచ్చును. అంటే... 1. ఎముక సామాన్య విరుపు 2. చాలా చోట్ల విరుపు 3. జటిలమైన విరుపు 4. విభండిత విరుపు 5. తాకిడి ప్రభావం 6. లేత ఎముక విరుపు. కాంతి విద్యుతయస్కాంత వికిరణంలో పట్టకం గుండా ప్రసరించే కాంతిలో గల రంగులు VIBGYOR, ఛందస్సులో గణవిభజనను ‘యమాతారాజభానస’ గాను గుర్తుంచుకునే పద్ధతి ఎప్పటి నుండో ఉన్నదే.',
      bg: '#f0f9ff', border: '#38bdf8'
    }
  ];

  // Popular Memory Techniques Data
  const techniquesData = [
    {
      id: 1,
      title: 'కథ పద్ధతి',
      engTitle: 'Story Method',
      desc: 'గుర్తుంచుకోవలసిన పదాలను గాని, కొన్ని పేర్లను కాని ఒక కథగా రూపకల్పన చేసి దానిని గుర్తుంచుకుంటే చాలా కాలం గుర్తుంటుంది. అయితే ఇది కొన్ని విషయాలలోనే సాధ్యపడుతుంది. కథల రూపంలో అభ్యసిస్తే క్రమం తప్పకుండా విషయాలను గుర్తుంచుకోవచ్చును.',
      bg: '#f5f3ff', border: '#a78bfa'
    },
    {
      id: 2,
      title: 'పెగ్ సిస్టమ్',
      engTitle: 'Peg System',
      desc: 'అంకెలను వాటి ఉచ్చారణకు దగ్గరగా ఉన్న పదాలను ముందుగా Pegs గా గుర్తుంచుకొని, ఏ విషయాలనైతే గుర్తుంచుకోవాలో వాటిని ఆ Peg పదాలకు జోడించి గుర్తుంచుకునే పద్ధతిని Peg System అంటారు. ఈ రకమైన శిక్షణ అనుభవజ్ఞుడైన Memory Trainer ద్వారా పొందవచ్చును.',
      bg: '#fff7ed', border: '#fb923c'
    },
    {
      id: 3,
      title: 'ఆకార పద్ధతి',
      engTitle: 'Shape Method',
      desc: 'ఈ పద్ధతిలో ఒకటి నుండి 20 అంకెల వరకు వాటి ఆకారానికి దగ్గరగా ఉన్న బొమ్మలను గుర్తుంచుకొని వాటికి నేర్చుకోవలసిన విషయాలను జోడించి గుర్తుంచుకోవడం జరుగుతుంది.',
      bg: '#ecfeff', border: '#22d3ee'
    },
    {
      id: 4,
      title: 'ప్రయాణ పద్ధతి',
      engTitle: 'Journey Method',
      desc: 'మీరు రోజు నడిచే మార్గంలో గల కొన్ని ముఖ్యమైన ప్రదేశాలను 10 లేదా 20 గుర్తుంచుకొని ఒక జాబితాగా గుర్తుంచుకోవాలి. నేర్చుకోవలసిన పదాలు గాని విషయాలు గాని వాటికి జోడిస్తూ గుర్తుంచుకునే పద్ధతిని Journey Method అంటారు.',
      bg: '#f0fdf4', border: '#4ade80'
    },
    {
      id: 5,
      title: 'లూసీ సిస్టమ్ (లోసీ పద్ధతి)',
      engTitle: 'Luci System',
      desc: 'ఇది ప్రాచీన కాలంలో రోమ్‌లో బాగా ప్రాచుర్యం పొందిన విధానం. ఈ పద్ధతిలో గదిలో ఉన్న వస్తువులను వరుసగా గుర్తుంచుకొని వాటికి నేర్చుకోవలసిన విషయాలను జోడించి గుర్తుంచుకోవడం జరుగుతుంది. పోలీసు శిక్షణలో భాగంగా ప్రదేశాలను గుర్తుంచుకోవడానికి, పరిశోధనలో ఈ విధానాన్ని ఇప్పటికీ అమలు చేయడం గమనార్హం.',
      bg: '#fef2f2', border: '#f87171'
    },
    {
      id: 6,
      title: 'ఆల్ఫాబెట్ పద్ధతి',
      engTitle: 'Alphabet Method',
      desc: 'ఈ పద్ధతిలో A నుండి Z వరకున్న అక్షరాలతో కొన్ని పదాలను తెలుసుకొని వాటికి నేర్చుకోవలసిన విషయాలను జోడించి గుర్తుంచుకోవడం జరుగుతుంది.',
      bg: '#fefce8', border: '#facc15'
    },
    {
      id: 7,
      title: 'ఫొనెటిక్ నంబర్ టెక్నిక్',
      engTitle: 'Phonetic Number Technique',
      desc: 'ఇది ప్రాచీన కాలంలో గ్రీకు దేశంలో తమ జ్ఞాపకశక్తితో రాజుల మెప్పు పొందేందుకు ఆస్థాన పండితులు కనుగొన్నారు. అచ్చుల, హల్లుల ఉచ్చారణకు ఒక్కొక్క అంకెను కేటాయించి వాటితో పెద్ద పెద్ద అంకెలను పదాలుగా గుర్తుంచుకొని ఆ అంకెలను వెంటనే ఏ క్రమంలో అడిగితే ఆ క్రమంలో చెప్పగలగడం ఈ పద్ధతి యొక్క విశేషం.',
      bg: '#eff6ff', border: '#60a5fa'
    }
  ];

  return (
    <div style={{
      background: 'white',
      borderRadius: '24px',
      padding: '1.5rem',
      boxShadow: '0 10px 25px -5px rgba(0,0,0,0.05), 0 8px 10px -6px rgba(0,0,0,0.01)',
      marginTop: '2rem',
      border: '1px solid #f1f5f9',
      overflow: 'hidden',
      width: '100%',
      boxSizing: 'border-box'
    }}>
      <h3 style={{ 
        fontSize: '1.5rem', 
        fontWeight: 800, 
        color: '#1e293b', 
        marginBottom: '1rem', 
        display: 'flex', 
        alignItems: 'center', 
        gap: '0.5rem',
        flexWrap: 'wrap' 
      }}>
        <Brain color="#8b5cf6" /> <span>జ్ఞాపకశక్తి సూత్రాలు <span style={{ fontSize: '1rem', color: '#64748b', fontWeight: 600 }}>(Memory Secrets)</span></span>
      </h3>
      
      {/* Tabs - Wrap on mobile to prevent cutting off */}
      <div style={{ 
        display: 'flex', 
        gap: '0.5rem', 
        marginBottom: '1.5rem', 
        flexWrap: 'wrap',
        paddingBottom: '0.5rem'
      }}>
        <button 
          onClick={() => setActiveTab('chart')}
          style={{ 
            padding: '0.5rem 1rem', 
            borderRadius: '20px', 
            border: 'none', 
            background: activeTab === 'chart' ? '#8b5cf6' : '#f1f5f9', 
            color: activeTab === 'chart' ? 'white' : '#64748b', 
            fontWeight: 600, 
            cursor: 'pointer', 
            display: 'flex', 
            alignItems: 'center', 
            gap: '0.5rem', 
            whiteSpace: 'nowrap',
            transition: 'all 0.2s'
          }}
        >
          <TrendingUp size={16} /> శాతం (Percentage)
        </button>
        <button 
          onClick={() => setActiveTab('stairs')}
          style={{ 
            padding: '0.5rem 1rem', 
            borderRadius: '20px', 
            border: 'none', 
            background: activeTab === 'stairs' ? '#8b5cf6' : '#f1f5f9', 
            color: activeTab === 'stairs' ? 'white' : '#64748b', 
            fontWeight: 600, 
            cursor: 'pointer', 
            display: 'flex', 
            alignItems: 'center', 
            gap: '0.5rem', 
            whiteSpace: 'nowrap',
            transition: 'all 0.2s'
          }}
        >
          <Target size={16} /> లెవల్ అప్ (Level Up)
        </button>
        <button 
          onClick={() => setActiveTab('rules')}
          style={{ 
            padding: '0.5rem 1rem', 
            borderRadius: '20px', 
            border: 'none', 
            background: activeTab === 'rules' ? '#8b5cf6' : '#f1f5f9', 
            color: activeTab === 'rules' ? 'white' : '#64748b', 
            fontWeight: 600, 
            cursor: 'pointer', 
            display: 'flex', 
            alignItems: 'center', 
            gap: '0.5rem', 
            whiteSpace: 'nowrap',
            transition: 'all 0.2s'
          }}
        >
          <Users size={16} /> గోల్డెన్ రూల్స్ (Rules)
        </button>
        <button 
          onClick={() => setActiveTab('principles')}
          style={{ 
            padding: '0.5rem 1rem', 
            borderRadius: '20px', 
            border: 'none', 
            background: activeTab === 'principles' ? '#8b5cf6' : '#f1f5f9', 
            color: activeTab === 'principles' ? 'white' : '#64748b', 
            fontWeight: 600, 
            cursor: 'pointer', 
            display: 'flex', 
            alignItems: 'center', 
            gap: '0.5rem', 
            whiteSpace: 'nowrap',
            transition: 'all 0.2s'
          }}
        >
          <Sparkles size={16} /> 7 సూత్రాలు (7 Principles)
        </button>
        <button 
          onClick={() => setActiveTab('story')}
          style={{ 
            padding: '0.5rem 1rem', 
            borderRadius: '20px', 
            border: 'none', 
            background: activeTab === 'story' ? '#8b5cf6' : '#f1f5f9', 
            color: activeTab === 'story' ? 'white' : '#64748b', 
            fontWeight: 600, 
            cursor: 'pointer', 
            display: 'flex', 
            alignItems: 'center', 
            gap: '0.5rem', 
            whiteSpace: 'nowrap',
            transition: 'all 0.2s'
          }}
        >
          <Wand2 size={16} /> మ్యాజిక్ స్టోరీ (Story Game)
        </button>
        <button 
          onClick={() => setActiveTab('studytips')}
          style={{ 
            padding: '0.5rem 1rem', 
            borderRadius: '20px', 
            border: 'none', 
            background: activeTab === 'studytips' ? '#8b5cf6' : '#f1f5f9', 
            color: activeTab === 'studytips' ? 'white' : '#64748b', 
            fontWeight: 600, 
            cursor: 'pointer', 
            display: 'flex', 
            alignItems: 'center', 
            gap: '0.5rem', 
            whiteSpace: 'nowrap',
            transition: 'all 0.2s'
          }}
        >
          <BookMarked size={16} /> అభ్యాసనలో ముఖ్యాంశాలు (Study Tips)
        </button>
        <button 
          onClick={() => setActiveTab('techniques')}
          style={{ 
            padding: '0.5rem 1rem', 
            borderRadius: '20px', 
            border: 'none', 
            background: activeTab === 'techniques' ? '#8b5cf6' : '#f1f5f9', 
            color: activeTab === 'techniques' ? 'white' : '#64748b', 
            fontWeight: 600, 
            cursor: 'pointer', 
            display: 'flex', 
            alignItems: 'center', 
            gap: '0.5rem', 
            whiteSpace: 'nowrap',
            transition: 'all 0.2s'
          }}
        >
          <Layers size={16} /> పాపులర్ మెమరీ టెక్నిక్స్
        </button>
      </div>

      {/* Content */}
      <div style={{ minHeight: '300px' }}>
        {activeTab === 'chart' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', animation: 'fadeIn 0.5s' }}>
            <p style={{ color: '#475569', fontSize: '0.95rem', marginBottom: '0.5rem', lineHeight: '1.5' }}>
              మనం నేర్చుకునేటప్పుడు జ్ఞానేంద్రియాలను ఎంత ఎక్కువగా ఉపయోగిస్తే, అంత బాగా గుర్తుంటుంది! (డా|| బ్రూనో ఫ్రాస్ట్)
            </p>
            {chartData.map((item, index) => (
              <div key={index} style={{ width: '100%' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.3rem', fontSize: '0.85rem', fontWeight: 600, color: '#334155' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>{item.icon} {item.label}</span>
                  <span>{item.percent}%</span>
                </div>
                <div style={{ width: '100%', height: '14px', background: '#f1f5f9', borderRadius: '7px', overflow: 'hidden' }}>
                  <div style={{ 
                    width: `${item.percent}%`, 
                    height: '100%', 
                    background: item.color, 
                    borderRadius: '7px', 
                    transition: 'width 1s cubic-bezier(0.4, 0, 0.2, 1)',
                    boxShadow: 'inset 0 2px 4px rgba(255,255,255,0.3)'
                  }}></div>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'stairs' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', animation: 'fadeIn 0.5s' }}>
             <p style={{ color: '#475569', fontSize: '0.95rem', marginBottom: '0.5rem', lineHeight: '1.5' }}>
               తాతయ్య చెప్పిన చదువు రహస్యాలు - ఈ స్టెప్స్ ఫాలో అయి మీ మెమరీ లెవల్ పెంచుకోండి!
             </p>
             {stairsData.map((item, index) => (
               <div key={index} style={{ 
                 background: item.bg, 
                 borderLeft: `5px solid ${item.border}`,
                 padding: '1rem',
                 borderRadius: '8px',
                 fontSize: '0.9rem',
                 fontWeight: 500,
                 color: '#1e293b',
                 display: 'flex',
                 gap: '1rem',
                 alignItems: 'center',
                 marginLeft: `${Math.min(index * 6, 30)}px`, // Responsive indenting limit
                 transition: 'transform 0.2s',
                 cursor: 'default',
                 boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
               }}
               onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.02)'}
               onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
               >
                 <div style={{ 
                   background: item.border, 
                   color: 'white', 
                   width: '32px', 
                   height: '32px', 
                   borderRadius: '50%', 
                   display: 'flex', 
                   alignItems: 'center', 
                   justifyContent: 'center', 
                   fontWeight: 'bold', 
                   flexShrink: 0,
                   boxShadow: '0 2px 5px rgba(0,0,0,0.2)'
                 }}>
                   {item.level}
                 </div>
                 <div style={{ lineHeight: '1.4' }}>{item.text}</div>
               </div>
             ))}
          </div>
        )}

        {activeTab === 'rules' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', animation: 'fadeIn 0.5s' }}>
            <div style={{ 
              background: 'linear-gradient(135deg, #fdf4ff 0%, #fae8ff 100%)', 
              padding: '1.5rem', 
              borderRadius: '16px', 
              border: '1px solid #f5d0fe',
              boxShadow: '0 4px 6px rgba(0,0,0,0.02)'
            }}>
              <h4 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#86198f', marginBottom: '1.2rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Target color="#c026d3" /> ఫైనల్ మెమరీ సూత్రాలు
              </h4>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <li style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                  <div style={{ background: 'white', padding: '0.6rem', borderRadius: '50%', color: '#d946ef', boxShadow: '0 2px 6px rgba(0,0,0,0.08)' }}><BookOpen size={20} /></div>
                  <div>
                    <strong style={{ color: '#4a044e', display: 'block', marginBottom: '0.25rem', fontSize: '1.05rem' }}>అవగాహన చేసుకోండి</strong>
                    <span style={{ color: '#701a75', fontSize: '0.95rem', lineHeight: '1.5', display: 'block' }}>చదవడం ఏదో మొక్కుబడిగా కాకుండా, అర్థం చేసుకుంటూ చదవాలి.</span>
                  </div>
                </li>
                <li style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                  <div style={{ background: 'white', padding: '0.6rem', borderRadius: '50%', color: '#d946ef', boxShadow: '0 2px 6px rgba(0,0,0,0.08)' }}><PenTool size={20} /></div>
                  <div>
                    <strong style={{ color: '#4a044e', display: 'block', marginBottom: '0.25rem', fontSize: '1.05rem' }}>చూడకుండా రాయండి</strong>
                    <span style={{ color: '#701a75', fontSize: '0.95rem', lineHeight: '1.5', display: 'block' }}>నేర్చుకున్నది ఎంతవరకు వచ్చిందో చూడకుండా రాసి చెక్ చేసుకోవాలి.</span>
                  </div>
                </li>
                <li style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                  <div style={{ background: 'white', padding: '0.6rem', borderRadius: '50%', color: '#d946ef', boxShadow: '0 2px 6px rgba(0,0,0,0.08)' }}><Users size={20} /></div>
                  <div>
                    <strong style={{ color: '#4a044e', display: 'block', marginBottom: '0.25rem', fontSize: '1.05rem' }}>స్నేహితులతో చర్చించండి</strong>
                    <span style={{ color: '#701a75', fontSize: '0.95rem', lineHeight: '1.5', display: 'block' }}>నేర్చుకున్నది స్నేహితులకు చెప్పడం లేదా చర్చించడం వల్ల దీర్ఘకాలం గుర్తుంటుంది.</span>
                  </div>
                </li>
              </ul>
            </div>
          </div>
        )}

        {activeTab === 'principles' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', animation: 'fadeIn 0.5s' }}>
            <p style={{ color: '#475569', fontSize: '0.95rem', marginBottom: '0.5rem', lineHeight: '1.5' }}>
              మెమరీ అనేది ఈ 7 మ్యాజిక్ సూత్రాలపై ఆధారపడి ఉంటుంది. వీటిని వాడితే ఏదైనా సులభంగా గుర్తుంటుంది!
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
              {principlesData.map((principle) => (
                <div key={principle.id} style={{
                  background: principle.bg,
                  padding: '1.25rem',
                  borderRadius: '16px',
                  display: 'flex',
                  gap: '1rem',
                  alignItems: 'flex-start',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.02)',
                  transition: 'transform 0.2s',
                  cursor: 'default'
                }}
                onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                >
                  <div style={{
                    background: 'white',
                    padding: '0.5rem',
                    borderRadius: '12px',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}>
                    {principle.icon}
                  </div>
                  <div>
                    <strong style={{ display: 'block', color: '#1e293b', fontSize: '1.1rem', marginBottom: '0.2rem' }}>
                      {principle.id}. {principle.title}
                    </strong>
                    <span style={{ display: 'block', color: '#64748b', fontSize: '0.8rem', marginBottom: '0.5rem', fontWeight: 600 }}>
                      {principle.engTitle}
                    </span>
                    <p style={{ margin: 0, color: '#475569', fontSize: '0.9rem', lineHeight: '1.5' }}>
                      {principle.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'story' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', animation: 'fadeIn 0.5s' }}>
            <div style={{ background: '#f8fafc', padding: '1.5rem', borderRadius: '16px', border: '1px dashed #cbd5e1' }}>
              <h4 style={{ fontSize: '1.25rem', color: '#334155', marginTop: 0, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Wand2 color="#6366f1" /> 20 పదాల మ్యాజిక్ స్టోరీ!
              </h4>
              <p style={{ color: '#475569', fontSize: '0.95rem', marginBottom: '1.5rem', lineHeight: '1.6' }}>
                కొత్త పదాలను నేర్చుకోవడానికి ఆ 7 సూత్రాలను ఎలా వాడాలో చూద్దాం. ఈ కింది కథను కళ్లు మూసుకుని ఒక సినిమా లాగా ఊహించండి. మీకే తెలియకుండా 20 పదాలు ఎలా గుర్తుండిపోతాయో చూడండి!
              </p>
              
              <div style={{ background: 'white', padding: '1.5rem', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.02)', fontSize: '1rem', lineHeight: '1.8', color: '#1e293b' }}>
                ఒక పెద్ద <strong style={{color: '#10b981', padding: '0 4px', background: '#ecfdf5', borderRadius: '4px'}}>1. Tree (చెట్టు)</strong> ఉంది. దానికి ఎర్రటి <strong style={{color: '#ef4444', padding: '0 4px', background: '#fef2f2', borderRadius: '4px'}}>2. Telephones (టెలిఫోన్లు)</strong> వేలాడుతున్నాయి. ఫోన్ చేద్దామని వెళ్తే అందులో అంకెలకు బదులు <strong style={{color: '#f59e0b', padding: '0 4px', background: '#fffbeb', borderRadius: '4px'}}>3. Typewriter (టైప్‌రైటర్)</strong> అక్షరాలు ఉన్నాయి. మీరు టైపు చేయగా, కాగితంపై అక్షరాలకు బదులుగా ఒక <strong style={{color: '#3b82f6', padding: '0 4px', background: '#eff6ff', borderRadius: '4px'}}>4. Pen (పెన్)</strong> కాగితం పై పడింది. అది ఎగిరి పక్కనే ఉన్న పసుపు రంగు <strong style={{color: '#eab308', padding: '0 4px', background: '#fefce8', borderRadius: '4px'}}>5. Bucket (బకెట్)</strong> లో పడింది. బకెట్ పక్కనే ఒక <strong style={{color: '#8b5cf6', padding: '0 4px', background: '#f5f3ff', borderRadius: '4px'}}>6. Chair (కుర్చీ)</strong> ఉంది. దానికి ఆనుకొని ఒక <strong style={{color: '#06b6d4', padding: '0 4px', background: '#ecfeff', borderRadius: '4px'}}>7. Table (టేబుల్)</strong> ఉంది. దానిపై ఒక పెద్ద <strong style={{color: '#ec4899', padding: '0 4px', background: '#fdf2f8', borderRadius: '4px'}}>8. T.V (టీవీ)</strong> ఉంది. టీవీకి రెండు <strong style={{color: '#14b8a6', padding: '0 4px', background: '#f0fdfa', borderRadius: '4px'}}>9. Doors (తలుపులు)</strong> ఉన్నాయి. అవి తెరిస్తే వెనుక ఒక <strong style={{color: '#f43f5e', padding: '0 4px', background: '#fff1f2', borderRadius: '4px'}}>10. Umbrella (గొడుగు)</strong> ఉంది. అది మామూలుగా కాకుండా ముదురు నీలం రంగు <strong style={{color: '#6366f1', padding: '0 4px', background: '#eef2ff', borderRadius: '4px'}}>11. Jeanpant (జీన్స్ ప్యాంట్)</strong> గుడ్డతో చేయబడింది! 
                <br/><br/>
                ఆ ప్యాంట్‌కి ఒక <strong style={{color: '#f59e0b', padding: '0 4px', background: '#fffbeb', borderRadius: '4px'}}>12. Pocket (జేబు)</strong> ఉంది. అందులో ఒక <strong style={{color: '#eab308', padding: '0 4px', background: '#fefce8', borderRadius: '4px'}}>13. Gold Coin (బంగారు నాణెం)</strong> దొరికింది. నాణెం పైన ఒక <strong style={{color: '#8b5cf6', padding: '0 4px', background: '#f5f3ff', borderRadius: '4px'}}>14. Elephant (ఏనుగు)</strong> బొమ్మ ఉంది. ఆ ఏనుగు ఒక <strong style={{color: '#3b82f6', padding: '0 4px', background: '#eff6ff', borderRadius: '4px'}}>15. Computer (కంప్యూటర్)</strong> ముందు కూర్చొని <strong style={{color: '#ef4444', padding: '0 4px', background: '#fef2f2', borderRadius: '4px'}}>16. Car Race (కార్ రేస్)</strong> ఆడుకుంటోంది! దాంట్లో ఒక ఎర్ర కారు నల్లటి <strong style={{color: '#10b981', padding: '0 4px', background: '#ecfdf5', borderRadius: '4px'}}>17. Road (రోడ్డు)</strong> పై వెళుతోంది. కారును ఆపి అక్కడ ఉన్న కొన్ని <strong style={{color: '#64748b', padding: '0 4px', background: '#f8fafc', borderRadius: '4px'}}>18. Papers (పేపర్లు)</strong> ఏరుకొని ఇంటికి తెచ్చి <strong style={{color: '#ec4899', padding: '0 4px', background: '#fdf2f8', borderRadius: '4px'}}>19. Cot (మంచం)</strong> మీద వేశారు. అవి అన్నీ <strong style={{color: '#f43f5e', padding: '0 4px', background: '#fff1f2', borderRadius: '4px'}}>20. Roses (గులాబీలు)</strong> గా మారిపోయాయి!
              </div>

              <div style={{ marginTop: '1.5rem', background: '#fffbeb', padding: '1rem', borderRadius: '8px', borderLeft: '4px solid #f59e0b', color: '#b45309', fontSize: '0.9rem', display: 'flex', gap: '0.5rem' }}>
                <Brain size={20} style={{ flexShrink: 0 }} />
                <span>ఈ కథలో మనం పెద్ద సైజులు (Magnification), రంగులు (Sensory), వింతైన విషయాలు (Illogic), ఒకదానికొకటి లింక్ చేయడం (Association) వాడాం కాబట్టే 20 పదాలు వరుసగా గుర్తుంటాయి!</span>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'studytips' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', animation: 'fadeIn 0.5s' }}>
             <p style={{ color: '#475569', fontSize: '1rem', marginBottom: '1rem', lineHeight: '1.5' }}>
               నేర్చుకున్న విషయాలను ఎక్కువ కాలం గుర్తుంచుకునేందుకు అవసరమయ్యే కొన్ని ముఖ్యమైన విషయాలను, పద్ధతులను పరిశీలిద్దాం!
             </p>
             <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
               {studyTipsData.map((tip) => (
                 <div key={tip.id} style={{ 
                   background: tip.bg, 
                   borderLeft: `5px solid ${tip.border}`,
                   padding: '1.5rem',
                   borderRadius: '12px',
                   boxShadow: '0 4px 6px rgba(0,0,0,0.02)',
                 }}>
                   <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
                     <div style={{ 
                       background: tip.border, 
                       color: 'white', 
                       width: '32px', 
                       height: '32px', 
                       borderRadius: '50%', 
                       display: 'flex', 
                       alignItems: 'center', 
                       justifyContent: 'center', 
                       fontWeight: 'bold',
                       fontSize: '1.1rem'
                     }}>
                       {tip.id}
                     </div>
                     <h4 style={{ margin: 0, fontSize: '1.2rem', color: '#1e293b', fontWeight: 700 }}>
                       {tip.title} <span style={{ fontSize: '0.9rem', color: '#64748b', fontWeight: 600 }}>({tip.engTitle})</span>
                     </h4>
                   </div>
                   <p style={{ margin: '0 0 0 2.75rem', color: '#334155', lineHeight: '1.7', fontSize: '0.95rem' }}>
                     {tip.desc}
                   </p>
                 </div>
               ))}
             </div>
          </div>
        )}

        {activeTab === 'techniques' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', animation: 'fadeIn 0.5s' }}>
             <p style={{ color: '#475569', fontSize: '1rem', marginBottom: '1rem', lineHeight: '1.5' }}>
               ప్రపంచవ్యాప్తంగా బాగా పాపులర్ అయిన కొన్ని మెమరీ టెక్నిక్స్ (Popular Memory Techniques) ఇక్కడ ఉన్నాయి.
             </p>
             <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem' }}>
               {techniquesData.map((tech) => (
                 <div key={tech.id} style={{ 
                   background: tech.bg, 
                   borderTop: `4px solid ${tech.border}`,
                   padding: '1.25rem',
                   borderRadius: '8px',
                   boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
                   flex: '1 1 calc(50% - 1rem)',
                   minWidth: '280px'
                 }}>
                   <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '1.1rem', color: '#1e293b', fontWeight: 700 }}>
                     {tech.id}. {tech.title} <span style={{ fontSize: '0.9rem', color: '#64748b', fontWeight: 600 }}>({tech.engTitle})</span>
                   </h4>
                   <p style={{ margin: 0, color: '#334155', lineHeight: '1.6', fontSize: '0.95rem' }}>
                     {tech.desc}
                   </p>
                 </div>
               ))}
             </div>

             <div style={{ marginTop: '2rem' }}>
               <p style={{ color: '#475569', lineHeight: '1.7', marginBottom: '1rem' }}>
                 ఈ విధానాలతో అనేక మంది జ్ఞాపక శక్తి ప్రదర్శనలు ఇస్తూ మానవ మెదడు యొక్క అద్భుత శక్తిని తెలియచేయడం అందరికీ తెలిసినదే. ఈ ప్రదర్శనల వలన ఏమిటి లాభం అనే సందేహం కొంతమంది మేధావులకు ఉన్నప్పటికీ తమకు తెలివితేటలు లేవు తాము సరిగా చదవలేమని ఆత్మన్యూనత భావంతో బాధపడే విద్యార్థులలో ఇటువంటి ప్రదర్శనలు మంచి ఆత్మవిశ్వాసం కలిగిస్తాయనడంలో ఏ మాత్రం అతిశయోక్తి లేదు.
               </p>
               <p style={{ color: '#475569', lineHeight: '1.7', marginBottom: '1rem' }}>
                 అన్నింటికన్నా జ్ఞాపకశక్తికి అత్యంత కీలకమైన విషయం ఏమిటంటే ఆ విషయం పట్ల ఒక వ్యక్తికి ఉన్న ఆసక్తి మరియు ప్రాధాన్యత. చాలా మంది డబ్బు విషయంలో గాని, ఇష్టమైన వారి పుట్టినరోజు విషయంలో గాని, తమ అభిమాన హీరో సినిమా వివరాల గురించి గాని, అభిమాన క్రికెటర్ల రికార్డుల గురించి గాని ఏ మాత్రం మరచిపోవడం ఉండదు. ఎందుకంటే వాటికి వారు అధిక ప్రాధాన్యత ఇస్తారు కాబట్టి. అలాగే చదువు కూడా అత్యంత ప్రాధాన్యతతో కూడిన విషయం అనే అవగాహన మరియు శ్రద్ధ వారికి కల్పిస్తే వాటికి సంబంధించిన విషయాలను వారు మరచిపోయే పరిస్థితి తలెత్తదు. బాల్యం యొక్క అమాయకత్వం వలన తల్లిదండ్రుల నిర్లక్ష్యం వలన వారు చదువు పట్ల ఆసక్తి కనబరచకపోవచ్చును.
               </p>
               <p style={{ color: '#475569', lineHeight: '1.7', marginBottom: '1rem' }}>
                 పై విషయాలన్నింటినీ చదివాక ఏమి అర్థం అవుతుంది. శారీరకంగా, పుట్టుకతో ప్రతి విద్యార్థికి ఒకే రకమైన మేధస్సు , సామర్థ్యం ఉంటుందని మానసిక శాస్త్రవేత్తలు ప్రయోగపూర్వకంగా తెలియచేసారు. పైన పేర్కొన్న అంశాలు చదివితే మీకూ అదే అనిపిస్తుంది కదా! ఈ మెదడు దాని సామర్థ్యం అందరికీ ఒకేలా ఉన్నప్పుడు మరి అందరి యొక్క పనితీరు, ఫలితాలు మరియు పెరఫార్మెన్స్ ఒకేలా ఎందుకు ఉండటం లేదు.
               </p>
               <p style={{ color: '#475569', lineHeight: '1.7', marginBottom: '1rem' }}>
                 కంప్యూటర్ పరిభాషలో చెప్పుకుంటే హార్డ్‌వేర్ అందరికీ ఒకేలా ఉంది కాని సాఫ్ట్‌వేర్ సరిగా తయారుచేయాల్సిన బాధ్యత అటు తల్లిదండ్రులది మరియు ఇటు ఉపాధ్యాయులదే. అన్నింటికన్నా ఒక విషయం బాగా గుర్తుండాలంటే ఆ విషయం అత్యంత ప్రాధాన్యత కలిగియుందని ఆ విద్యార్థి గ్రహించాలి.
               </p>
               <p style={{ color: '#475569', lineHeight: '1.7', marginBottom: '1rem' }}>
                 అందుకే శ్రద్ధ అంటే తెలుసుకోవాలనే ఉత్సుకత, తెలుసుకోడానికి సంసిద్ధత మరియు నేర్పుతున్నవారిపట్ల గౌరవభావం. అందువలనే శ్రద్ధవాన్ లభతే జ్ఞానం అన్నారు. నేర్చుకోవాలనే ఆసక్తిని కలిగించాల్సిన బాధ్యత తల్లిదండ్రులది మరియు ఆసక్తి కరంగా బోధించాల్సిన గురుతర బాధ్యత ఉపాధ్యాయులదే. .
               </p>
               <p style={{ color: '#475569', lineHeight: '1.7', marginBottom: 0 }}>
                 మరి వారి సహజ సామర్థ్యాలు మరుగునపడకుండా వారికి వారు సంపూర్ణంగా ఉపయోగపడే విధంగా తయారుచేయవలసిన గురుతర బాధ్యత అటు తల్లిదండ్రుల చేతిలో ఇటు ఉపాధ్యాయుల చేతిలో ఉంటుందనడం నిర్వివాదాంశం. మరి వారి సహజ సామర్థ్యాలు వారికి ఉపయోగపడటానికి తల్లిదండ్రులు ఏం చేయాలో చూద్దాం.
               </p>
             </div>
          </div>
        )}
      </div>
      
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        /* Hide scrollbar for tabs */
        div::-webkit-scrollbar {
          display: none;
        }
      `}} />
    </div>
  );
}
