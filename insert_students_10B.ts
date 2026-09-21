import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

const studentsData10B = [
  { studentName: 'AKULA NIHARIKA', phone: '6301694662' },
  { studentName: 'BALIBOYINA YASASWINI', phone: '6309946082' },
  { studentName: 'BANDI PRAVEEN KUMAR', phone: '7386292934' },
  { studentName: 'BANGARI SANTOSH', phone: '7702481406' },
  { studentName: 'BHUPATHI DHANALAXMI', phone: 'NO_PHONE_10B_1' },
  { studentName: 'BOGADI MOHAN SIVA KUMAR', phone: '9492212599' },
  { studentName: 'BYANA BALA BINDHU MADHAVI', phone: '7732036479' },
  { studentName: 'DOLA KARUN KUMAR', phone: '9603163767' },
  { studentName: 'DWARAPUREDDY SATYA DHIKSHITH', phone: '9959157588' },
  { studentName: 'GANDEM THARUN', phone: '9398951118' },
  { studentName: 'GODA CHARAN', phone: 'NO_PHONE_10B_2' },
  { studentName: 'GULLALA KRANTHI KUMAR', phone: '8978456372' },
  { studentName: 'GUNDALA MOUNIKA', phone: '9704497268' },
  { studentName: 'KANTAM REDDY DILLEP', phone: 'NO_PHONE_10B_3' },
  { studentName: 'KANURU POWRNAMI', phone: 'NO_PHONE_10B_4' },
  { studentName: 'KARRI DHANA SREE', phone: '9441311382' },
  { studentName: 'KARRI LASYA', phone: '9381073605' },
  { studentName: 'KONA TEJARAMU', phone: '9705004165' },
  { studentName: 'KONA UTTEL', phone: '7386414812' },
  { studentName: 'KONDLA DELHI GANESH', phone: '9392833613' },
  { studentName: 'KORRA SURESH KUMAR', phone: '9391025418' },
  { studentName: 'KOVELA SANDEEP VENKATA SWARUP', phone: 'NO_PHONE_10B_5' },
  { studentName: 'LANKA CHETAN SWAROOP', phone: 'NO_PHONE_10B_6' },
  { studentName: 'LOLLI JHANSI', phone: '8179169409' },
  { studentName: 'MOLLI KARTHIK', phone: 'NO_PHONE_10B_7' },
  { studentName: 'MOLLI PRAVEENA', phone: '9573561690' },
  { studentName: 'MUTYALA CHANDANA', phone: '8367043102' },
  { studentName: 'MUTYALA GANESH', phone: '6302307887' },
  { studentName: 'MUTYALA KARUNYA', phone: '7799043135' },
  { studentName: 'MUTYALA SAI KRISHNA', phone: '6303085740' },
  { studentName: 'MYCHARLA BALU', phone: '7337376901' },
  { studentName: 'NAMMI RAMANA', phone: '6300037848' },
  { studentName: 'NEKKALA THARUN', phone: '9553610505' },
  { studentName: 'PALLALA DEEPIKA', phone: '6303787194' },
  { studentName: 'PARSA POORNA CHANDU', phone: '9642568136' },
  { studentName: 'PINAPALA NAVEEN', phone: 'NO_PHONE_10B_8' },
  { studentName: 'PINAPARTHI PAVAN', phone: '6281388346' },
  { studentName: 'POTHU BANUPRASAD', phone: '9032490061' },
  { studentName: 'POTHU PAVAN KUMAR', phone: '9704682097' },
  { studentName: 'POTNURI MADHU SRI', phone: '7702216899' },
  { studentName: 'ROTTA MONALISHA', phone: '9398488252' },
  { studentName: 'SEERA GEETHA MADHURI', phone: '8367046343' },
  { studentName: 'SIMMA ASHWINI', phone: '9954058673' },
  { studentName: 'SUNKARI MANILU', phone: 'NO_PHONE_10B_9' },
  { studentName: 'TEPPALA DHANASRI', phone: '9618426529' },
  { studentName: 'THAKASI SRI SURYA', phone: '9666306604' }
];

async function main() {
  const employeeId = '9010737882';
  console.log('Fetching details for inserting 10-B students...');
  
  const employee = await prisma.user.findUnique({ where: { employeeId } });
  if (!employee) return console.error('Employee not found!');

  const mandal = await prisma.configValue.findFirst({ where: { type: 'MANDAL', value: { contains: 'Butchayyapeta', mode: 'insensitive' } } });
  const village = await prisma.configValue.findFirst({ where: { type: 'VILLAGE', value: { contains: 'Vaddadi', mode: 'insensitive' } } });
  const school = await prisma.configValue.findFirst({ where: { type: 'SCHOOL', value: { contains: 'ZPHS School Vaddadi', mode: 'insensitive' } } });
  const group = await prisma.configValue.findFirst({ where: { type: 'GROUP', value: 'No Clarity' } });

  if (!mandal || !village || !school || !group) {
    console.error('Missing config values!');
    return;
  }

  let inserted = 0;
  for (const s of studentsData10B) {
    try {
      const existing = await prisma.student.findFirst({ where: { phone: s.phone } });
      if (existing) {
        console.log(`Skipping ${s.studentName} (${s.phone}) - Phone already exists.`);
        continue;
      }

      await prisma.student.create({
        data: {
          employeeId: employee.employeeId,
          studentName: s.studentName,
          phone: s.phone,
          mandal: mandal.id,
          village: village.id,
          schoolName: school.value, // Using string value this time to avoid UI bugs!
          group: group.id,
          doorstepCompleted: false
        }
      });
      inserted++;
    } catch (e) {
      console.error(`Failed to insert ${s.studentName} (${s.phone}):`, e);
    }
  }
  
  console.log(`Successfully inserted ${inserted} students from 10-B!`);
}

main().finally(() => prisma.$disconnect());
