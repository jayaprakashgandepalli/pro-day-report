import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getStudentSession } from '@/lib/session';

export async function POST(req: Request) {
  try {
    const session = await getStudentSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { answers } = await req.json();

    if (!answers || Object.keys(answers).length === 0) {
      return NextResponse.json({ error: 'No answers provided' }, { status: 400 });
    }

    const optionIds = Object.values(answers) as string[];
    const chosenOptions = await prisma.option.findMany({
      where: { id: { in: optionIds } },
      include: { question: true }
    });

    for (const [qId, oId] of Object.entries(answers)) {
      await prisma.studentTestResponse.upsert({
        where: { studentId_questionId: { studentId: session.id, questionId: qId } },
        update: { optionId: oId as string },
        create: { studentId: session.id, questionId: qId, optionId: oId as string }
      });
    }

    let scienceScore = 0; let commerceScore = 0; let artsScore = 0; let techScore = 0;
    
    let m2Score = 0; let m2Max = 0; // Discipline
    let m3Score = 0; let m3Max = 0; // Screen Time
    let m4Score = 0; let m4Max = 0; // Family
    let m5Score = 0; let m5Max = 0; // Career Readiness

    chosenOptions.forEach(opt => {
      const module = opt.question.module;
      const points = opt.traitPoints || '';

      if (module === '1') {
        const tag = points.toUpperCase();
        if (tag === 'SCIENCE') scienceScore++;
        if (tag === 'COMMERCE') commerceScore++;
        if (tag === 'ARTS') artsScore++;
        if (tag === 'TECH') techScore++;
      } else {
        const numVal = parseInt(points) || 0;
        if (module === '2') { m2Score += numVal; m2Max += 3; }
        if (module === '3') { m3Score += numVal; m3Max += 3; }
        if (module === '4') { m4Score += numVal; m4Max += 3; }
        if (module === '5') { m5Score += numVal; m5Max += 3; }
      }
    });

    // Determine Group Winner
    const groupScores = { SCIENCE: scienceScore, COMMERCE: commerceScore, ARTS: artsScore, TECH: techScore };
    let winningTag = 'SCIENCE'; // fallback
    if (Object.values(groupScores).reduce((a,b)=>a+b, 0) > 0) {
       winningTag = Object.keys(groupScores).reduce((a, b) => groupScores[a as keyof typeof groupScores] > groupScores[b as keyof typeof groupScores] ? a : b);
    }

    let recommendedGroup = ''; let recommendedJobs = ''; let dailyActivities = '';

    switch(winningTag) {
      case 'SCIENCE':
        recommendedGroup = 'MPC or BiPC';
        recommendedJobs = 'Doctor, Scientist, Engineer, Healthcare Professional';
        dailyActivities = '1. Spend 1 hour daily on Math/Science puzzles.\n2. Watch educational documentaries.';
        break;
      case 'COMMERCE':
        recommendedGroup = 'MEC or CEC';
        recommendedJobs = 'Chartered Accountant (CA), Business Manager, Banker';
        dailyActivities = '1. Read the business news daily.\n2. Practice financial calculations or tracking expenses.';
        break;
      case 'TECH':
        recommendedGroup = 'MPC or Polytechnic (CS)';
        recommendedJobs = 'Software Engineer, Data Analyst, App Developer';
        dailyActivities = '1. Learn coding for 30 minutes daily.\n2. Follow tech blogs.';
        break;
      case 'ARTS':
      default:
        recommendedGroup = 'HEC or Arts & Humanities';
        recommendedJobs = 'Designer, Writer, Lawyer, IAS Officer';
        dailyActivities = '1. Read books/novels to improve vocabulary.\n2. Practice debate or creative writing.';
        break;
    }

    // Convert scores to 10-point scale
    const calcOut10 = (score: number, max: number) => max > 0 ? Math.round((score / max) * 10) : 0;
    const disciplineScore = calcOut10(m2Score, m2Max);
    const screenTimeScore = calcOut10(m3Score, m3Max);
    const familyAttitudeScore = calcOut10(m4Score, m4Max);
    const careerClarityScore = calcOut10(m5Score, m5Max);

    // Generate highly detailed analysis based on scores (0-10 scale)
    const flawsArr = [];
    const adviceArr = [];

    // 1. Study Discipline Analysis
    if (disciplineScore >= 8) {
      adviceArr.push('📚 స్టడీ ఫోకస్ (Excellent): చదువు పట్ల మీకు అద్భుతమైన క్రమశిక్షణ ఉంది. మీరు అనుకున్న టార్గెట్స్ ని కరెక్ట్ గా ఫినిష్ చేస్తున్నారు. ఇదే ఫోకస్ తో వెళ్తే మీకు తిరుగుండదు. కష్టమైన సబ్జెక్ట్స్ ని కూడా ప్లాన్ చేసుకుని చదవడం మీ బలం.');
    } else if (disciplineScore >= 5) {
      flawsArr.push('📚 స్టడీ ఫోకస్ (Average): మీరు చదువుతున్నారు కానీ, అప్పుడప్పుడూ మీ ఏకాగ్రత దెబ్బతింటోంది. కొన్నిసార్లు బద్ధకం వల్ల పనులు వాయిదా వేస్తున్నారు.');
      adviceArr.push('📚 స్టడీ ఫోకస్: చదివేటప్పుడు పక్కన ఎలాంటి డిస్టర్బెన్స్ లేకుండా చూసుకోండి. రోజూ ఒక చిన్న టైమ్ టేబుల్ వేసుకుని దాన్ని 100% ఫాలో అవ్వడానికి ట్రై చేయండి.');
    } else {
      flawsArr.push('📚 స్టడీ ఫోకస్ (Poor): చదువు విషయంలో మీలో చాలా నిర్లక్ష్యం కనిపిస్తోంది. హోంవర్క్స్ ఎప్పటికప్పుడు చేయకపోవడం, ఎగ్జామ్స్ ముందు మాత్రమే హడావిడిగా చదవడం వల్ల మీకు నష్టం జరుగుతుంది.');
      adviceArr.push('📚 స్టడీ ఫోకస్: ముందుగా చదువుపై భయం, విసుగు వదిలేయండి. రోజూ కేవలం 1 గంట పాటు కదలకుండా ఒకే చోట కూర్చుని చదివే అలవాటును ఇవాల్టి నుంచే ప్రారంభించండి.');
    }

    // 2. Screen Time Analysis
    if (screenTimeScore >= 8) {
      adviceArr.push('📱 స్క్రీన్ టైమ్ (Excellent): ఫోన్ వాడకం విషయంలో మీ కంట్రోల్ చాలా బాగుంది. కేవలం అవసరమైనప్పుడు మాత్రమే మొబైల్ వాడుతున్నారు, ఇది మీ కళ్లకు మరియు మెదడుకు చాలా మంచిది.');
    } else if (screenTimeScore >= 5) {
      flawsArr.push('📱 స్క్రీన్ టైమ్ (Average): ఫోన్ వాడకం మోతాదుకి మించుతోంది. భోజనం చేసేటప్పుడు లేదా పడుకునే ముందు ఫోన్ చూసే అలవాటును కంట్రోల్ చేసుకోవాలి.');
      adviceArr.push('📱 స్క్రీన్ టైమ్: సోషల్ మీడియా లేదా గేమ్స్ కి ఒక లిమిట్ పెట్టుకోండి. రోజులో కనీసం 1-2 గంటలు స్పోర్ట్స్ లేదా ఫిజికల్ యాక్టివిటీస్ కి కేటాయించండి.');
    } else {
      flawsArr.push('📱 స్క్రీన్ టైమ్ (Poor): మీరు ఫోన్ లేదా ఆన్లైన్ గేమ్స్ కి విపరీతంగా బానిస అయ్యారు. ఇది మీ చదువుని, మానసిక ఆరోగ్యాన్ని తీవ్రంగా దెబ్బతీస్తోంది. ఫోన్ లేకపోతే కోపం రావడం ప్రమాదకరం.');
      adviceArr.push('📱 స్క్రీన్ టైమ్: రాత్రి పడుకోవడానికి ఒక గంట ముందే ఫోన్ పక్కన పెట్టేయండి. పేరెంట్స్ కి మీ ఫోన్ ఇచ్చేసి, డిజిటల్ డిటాక్స్ (Digital Detox) మొదలుపెట్టండి.');
    }

    // 3. Family Attitude Analysis
    if (familyAttitudeScore >= 8) {
      adviceArr.push('👨‍👩‍👧 కుటుంబం (Excellent): పేరెంట్స్ కష్టాన్ని మీరు చాలా బాగా అర్థం చేసుకుంటున్నారు. వాళ్ళతో ఓపెన్ గా ప్రతిదీ షేర్ చేసుకోవడం మీలోని మంచి మెచ్యూరిటీని చూపిస్తోంది.');
    } else if (familyAttitudeScore >= 5) {
      flawsArr.push('👨‍👩‍👧 కుటుంబం (Average): పేరెంట్స్ తో బంధం బాగున్నా, కొన్నిసార్లు మీరు వాళ్ళ మాటను వ్యతిరేకిస్తున్నారు. వాళ్ళకి కొన్ని విషయాలు చెప్పకుండా దాయడం చేస్తున్నారు.');
      adviceArr.push('👨‍👩‍👧 కుటుంబం: పేరెంట్స్ కోపగించుకున్నా అది మీ మంచి కోసమే అని అర్థం చేసుకోండి. మీ ప్రతి బాధను వాళ్ళతో పంచుకోండి, వాళ్లే మీకు బెస్ట్ సపోర్ట్.');
    } else {
      flawsArr.push('👨‍👩‍👧 కుటుంబం (Poor): మీ తల్లిదండ్రుల పట్ల మీ ప్రవర్తన అస్సలు బాలేదు. వాళ్ళ కష్టాన్ని గుర్తించకపోవడం, వాదనకు దిగడం, అబద్ధాలు చెప్పడం మీ కెరీర్ కి మచ్చ తెస్తుంది.');
      adviceArr.push('👨‍👩‍👧 కుటుంబం: ఇప్పటికైనా మీ పేరెంట్స్ పడుతున్న కష్టాన్ని కళ్ళారా చూడండి. వాళ్ళతో మర్యాదగా మాట్లాడటం, ఇంటి పనుల్లో సహాయం చేయడం మొదలుపెట్టండి.');
    }

    // 4. Career Readiness Analysis
    if (careerClarityScore >= 8) {
      adviceArr.push('🎯 కెరీర్ క్లారిటీ (Excellent): మీ భవిష్యత్తుపై మీకు 100% క్లారిటీ ఉంది. ప్లాన్-A తో పాటు ప్లాన్-B కూడా రెడీగా ఉంచుకోవడం మీ అడ్వాన్స్డ్ థింకింగ్ కి నిదర్శనం. ఇలాగే ముందుకు వెళ్ళండి.');
    } else if (careerClarityScore >= 5) {
      flawsArr.push('🎯 కెరీర్ క్లారిటీ (Average): మీరు కెరీర్ గురించి ఆలోచిస్తున్నారు కానీ, పూర్తి స్పష్టత లేదు. ఏది ఎంచుకోవాలో అన్న కన్ఫ్యూజన్ ఇంకా మీలో ఉంది.');
      adviceArr.push('🎯 కెరీర్ క్లారిటీ: మీకు నచ్చిన 2-3 కెరీర్ ఆప్షన్స్ ని ఒక పేపర్ మీద రాసుకోండి. ఆ రంగంలో ఉన్న ఎక్స్పర్ట్స్ సలహాలు తీసుకుని ఒక ఫైనల్ డిసిషన్ కి రండి.');
    } else {
      flawsArr.push('🎯 కెరీర్ క్లారిటీ (Poor): పదో తరగతి/ఇంటర్ తర్వాత ఏం చేయాలి అనే దానిపై మీకు కనీస అవగాహన కూడా లేదు. మార్కెట్ గురించి, స్కిల్స్ గురించి మీకు ఏం తెలియకపోవడం పెద్ద మైనస్.');
      adviceArr.push('🎯 కెరీర్ క్లారిటీ: వెంటనే ఒక కెరీర్ కౌన్సిలర్ ని లేదా సీనియర్స్ ని కలవండి. ఏ జాబ్స్ కి డిమాండ్ ఉందో తెలుసుకోండి. మీ స్ట్రెంగ్త్స్ ఏంటో గుర్తించి ఒక గోల్ సెట్ చేసుకోండి.');
    }

    const identifiedFlaws = flawsArr.length > 0 ? flawsArr.join('\n\n') : 'మీ బిహేవియర్ లో ఎలాంటి ప్రధాన లోపాలు లేవు. మీరు పర్ఫెక్ట్ ట్రాక్ లో ఉన్నారు!';
    const advice = adviceArr.length > 0 ? adviceArr.join('\n\n') : 'ఇలాగే కష్టపడి చదవండి, మీ భవిష్యత్తు చాలా అద్భుతంగా ఉంటుంది.';

    await prisma.assessmentReport.upsert({
      where: { studentId: session.id },
      update: {
        recommendedGroup, recommendedJobs, dailyActivities,
        disciplineScore, screenTimeScore, familyAttitudeScore, careerClarityScore,
        advice, identifiedFlaws
      },
      create: {
        studentId: session.id,
        recommendedGroup, recommendedJobs, dailyActivities,
        disciplineScore, screenTimeScore, familyAttitudeScore, careerClarityScore,
        advice, identifiedFlaws
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Test Submission Error:', error);
    return NextResponse.json({ error: 'Failed to submit test' }, { status: 500 });
  }
}
