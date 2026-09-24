const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    console.log('Clearing old questions...');
    await prisma.question.deleteMany({});

    console.log('Seeding new telugu questions...');
    const seedData = [
      // MODULE 1: GROUP CLARITY
      {
        module: '1', order: 1,
        text: 'మీరు భవిష్యత్తులో ఏ రంగంలో స్థిరపడాలని కలలు కంటున్నారు?',
        options: {
          create: [
            { text: 'డాక్టర్, సైంటిస్ట్, అగ్రికల్చర్ (Doctor/Science)', traitPoints: 'SCIENCE' },
            { text: 'చార్టర్డ్ అకౌంటెంట్, వ్యాపారం, బ్యాంకింగ్ (CA/Business)', traitPoints: 'COMMERCE' },
            { text: 'లాయర్, IAS/IPS, జర్నలిజం, డిజైనింగ్ (Arts/Civil Services)', traitPoints: 'ARTS' },
            { text: 'సాఫ్ట్‌వేర్ ఇంజనీర్, రోబోటిక్స్, ఆర్కిటెక్ట్ (Tech/Engineering)', traitPoints: 'TECH' }
          ]
        }
      },
      {
        module: '1', order: 2,
        text: 'మీకు పాఠశాలలో ఏ సబ్జెక్టులు చదవడం ఎక్కువ ఆసక్తిగా అనిపిస్తుంది?',
        options: {
          create: [
            { text: 'బయాలజీ, ఫిజిక్స్ (Biology & Physics)', traitPoints: 'SCIENCE' },
            { text: 'లెక్కలు, ఎకనామిక్స్ (Maths & Economics)', traitPoints: 'COMMERCE' },
            { text: 'సోషల్ స్టడీస్, చరిత్ర, భాషలు (Social & Languages)', traitPoints: 'ARTS' },
            { text: 'కంప్యూటర్స్, కోడింగ్ (Computers & Logic)', traitPoints: 'TECH' }
          ]
        }
      },

      // MODULE 2: STUDY DISCIPLINE
      {
        module: '2', order: 1,
        text: 'మీరు రోజూ ఇంటి దగ్గర స్వయంగా (Self-Study) ఎంత సమయం చదువుతారు?',
        options: {
          create: [
            { text: '3-4 గంటలు పక్కాగా చదువుతాను', traitPoints: '3' },
            { text: '1-2 గంటలు చదువుతాను', traitPoints: '2' },
            { text: 'పరీక్షలు ఉన్నప్పుడు మాత్రమే చదువుతాను', traitPoints: '1' },
            { text: 'అసలు ఇంటిదగ్గర బుక్ తీయను', traitPoints: '0' }
          ]
        }
      },
      {
        module: '2', order: 2,
        text: 'క్లాసులో టీచర్ పాఠం చెప్తున్నప్పుడు మీ ఏకాగ్రత ఎలా ఉంటుంది?',
        options: {
          create: [
            { text: 'పూర్తిగా పాఠం పైనే శ్రద్ధ పెడతాను', traitPoints: '3' },
            { text: 'అప్పుడప్పుడూ వేరే ఆలోచనలు వస్తుంటాయి', traitPoints: '2' },
            { text: 'ఎక్కువ సమయం పక్కవాళ్ళతో మాట్లాడుతాను', traitPoints: '1' },
            { text: 'అసలు క్లాస్ వినబుద్ధి కాదు', traitPoints: '0' }
          ]
        }
      },

      // MODULE 3: SCREEN TIME
      {
        module: '3', order: 1,
        text: 'రోజులో మొబైల్/టీవీ/వీడియో గేమ్స్ కోసం ఎంత సమయం కేటాయిస్తారు?',
        options: {
          create: [
            { text: '1 గంట కంటే తక్కువే (కేవలం అవసరానికి)', traitPoints: '3' },
            { text: '1 నుండి 2 గంటలు', traitPoints: '2' },
            { text: '3 నుండి 4 గంటలు', traitPoints: '1' },
            { text: '5 గంటల కంటే ఎక్కువే (ఎప్పుడూ ఫోన్ లోనే)', traitPoints: '0' }
          ]
        }
      },
      {
        module: '3', order: 2,
        text: 'రాత్రి పడుకునే ముందు మొబైల్ చూసే అలవాటు ఉందా?',
        options: {
          create: [
            { text: 'లేదు, నిద్రపోవడానికి ఒక గంట ముందే ఫోన్ పక్కన పెడతాను', traitPoints: '3' },
            { text: 'అప్పుడప్పుడూ కొద్దిసేపు చూస్తాను', traitPoints: '2' },
            { text: 'రోజూ పడుకునే ముందు ఒక గంట చూస్తాను', traitPoints: '1' },
            { text: 'ఫోన్ చూస్తూనే నిద్రపోతాను', traitPoints: '0' }
          ]
        }
      },

      // MODULE 4: FAMILY ATTITUDE
      {
        module: '4', order: 1,
        text: 'మీ భవిష్యత్తు గురించి లేదా చదువు గురించి తల్లిదండ్రులతో చర్చిస్తారా?',
        options: {
          create: [
            { text: 'అవును, ప్రతి విషయం వారితో ఓపెన్ గా పంచుకుంటాను', traitPoints: '3' },
            { text: 'అప్పుడప్పుడూ మాత్రమే చెప్తాను', traitPoints: '2' },
            { text: 'వాళ్లు అడిగితేనే చెప్తాను', traitPoints: '1' },
            { text: 'వాళ్లకు చెప్పడం నాకు ఇష్టం ఉండదు', traitPoints: '0' }
          ]
        }
      },

      // MODULE 5: CAREER READINESS
      {
        module: '5', order: 1,
        text: 'పదవ తరగతి లేదా ఇంటర్ తర్వాత ఏం చేయాలనే దానిపై మీకు క్లారిటీ ఉందా?',
        options: {
          create: [
            { text: '100% క్లారిటీ ఉంది, నా లక్ష్యం ఫిక్స్', traitPoints: '3' },
            { text: 'ఒక రెండు మూడు ఆప్షన్స్ అనుకుంటున్నాను', traitPoints: '2' },
            { text: 'ఇంకా ఏమీ ఆలోచించలేదు', traitPoints: '1' },
            { text: 'ఫ్రెండ్స్ లేదా పేరెంట్స్ ఏది చెప్తే అది చేస్తాను', traitPoints: '0' }
          ]
        }
      }
    ];

    for (const q of seedData) {
      await prisma.question.create({ data: q });
    }

    console.log('Seed completed successfully!');
  } catch (error) {
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
