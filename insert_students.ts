import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

const studentsData = [
  // 10-C
  { studentName: 'ANGIREDDY GOWTHAM VENKATA SAI', phone: '9951503189' },
  { studentName: 'ATTHILI PAVANI DURGA', phone: '8297591039' },
  { studentName: 'BANGARU ARPITHA', phone: '8886566270' },
  { studentName: 'BANGARU PREETHI', phone: '8508170109' },
  { studentName: 'BHEEMADA ROHITHA', phone: '9492231056' },
  { studentName: 'BOBBILI SASIKALA', phone: '6305809818' },
  { studentName: 'BUDATHA KULASEKHAR', phone: 'NO_PHONE_1' },
  { studentName: 'DASARI CHARAN', phone: 'NO_PHONE_2' },
  { studentName: 'GANDHAM VENKATESH', phone: '8074931767' },
  { studentName: 'KASIPALLI ANANDKUMAR', phone: '7659098422' },
  { studentName: 'KORRA HARI', phone: '8332011519' },
  { studentName: 'KORUKONDA AVINASH', phone: '9505623088' },
  { studentName: 'KOVELA NAGA VENKATA SURYA MADHU', phone: 'NO_PHONE_3' },
  { studentName: 'MAJJI SURYA PRATHAP', phone: '8555098787' },
  { studentName: 'MERUGU GEETHA', phone: '9573186383' },
  { studentName: 'MERUGU VARUN KUMAR', phone: 'NO_PHONE_4' },
  { studentName: 'MUTYALA MADHU LATHA', phone: '9391357357' },
  { studentName: 'NAKAM NAVEEN', phone: '9542621279' },
  { studentName: 'PAL GAUTAM', phone: 'NO_PHONE_5' },
  { studentName: 'PANGI ARUN SANDESH', phone: 'NO_PHONE_6' },
  { studentName: 'PANGI ESWAR RAO', phone: '9014496514' },
  { studentName: 'PANGI RISHI', phone: '6303367300' },
  { studentName: 'PANGI SANDEEP', phone: '8074037719' },
  { studentName: 'PAPPALA VISWANADH', phone: '9885712553' },
  { studentName: 'PAPPU SARATH', phone: '8184857319' },
  { studentName: 'PASILA ESWAR', phone: '9398755820' },
  { studentName: 'PENTREDDY LOHITH', phone: '9912964400' },
  { studentName: 'RAGINI SANTHIRAJU', phone: '9652396595' },
  { studentName: 'RAMBUDDI JAHNAVI', phone: 'NO_PHONE_7' },
  { studentName: 'SAKALA MANESH DORA', phone: '6304346404' },
  { studentName: 'SALAPU INDU', phone: '9553831743' },
  { studentName: 'SANABANI SATISH', phone: 'NO_PHONE_8' },
  { studentName: 'SIRISAPALLI YAMINI VEGENESWARI', phone: '9666020414' },
  { studentName: 'SOLAM PRAVEEN KUMAR', phone: '7799564181' },
  { studentName: 'SUNKARI SANDHYA', phone: '9951099321' },
  { studentName: 'TALARI NAVYA PRASANNA', phone: 'NO_PHONE_9' }, 
  { studentName: 'TAMARLA AMRUT VISWASAGAR', phone: '7981028832' },
  { studentName: 'THADI DURGA', phone: '9985676574' },
  { studentName: 'VADAPUREDDY RAKESH', phone: '7997243630' },
  { studentName: 'VARADI DHARANI', phone: '8309296594' },
  { studentName: 'VARADI NIRAMALA', phone: '7989306053' },
  { studentName: 'VATTAKU NAGARAJU', phone: 'NO_PHONE_10' },
  { studentName: 'VELUGULA YASWANTH', phone: 'NO_PHONE_11' },
  { studentName: 'VEPADA POORNA', phone: '9705335436' },
  { studentName: 'VISSARAPU BHARGAVA', phone: '8919903491' },
  { studentName: 'YANNAMSETTI DIVYA SHREE', phone: '8096423408' },
  
  // 10-A
  { studentName: 'ADAPA MOUNIKA', phone: '7386757699' },
  { studentName: 'ALAMANDA INDHU', phone: 'NO_PHONE_12' },
  { studentName: 'ANKAM SRAVANI', phone: '9885701708' },
  { studentName: 'BANDI LOKESH KUMAR', phone: '8886568339' },
  { studentName: 'BANTU KUSUMA', phone: '9705302694' },
  { studentName: 'BARISINGI BHARATH', phone: '7330870252' },
  { studentName: 'BATTULA LOKENDRA', phone: '9966690173' },
  { studentName: 'BAVISETTI MEGHANA', phone: '8886528389' },
  { studentName: 'BOBBILI MOHAN', phone: '9177416338' },
  { studentName: 'BOGADI THANU SRI', phone: '8790104105' },
  { studentName: 'BYNA HARSHAD', phone: '9704960623' },
  { studentName: 'CHALAPUREDDY DURGA PRASAD', phone: '7286956059' },
  { studentName: 'CHALLA NANI BABU', phone: '6302971117' },
  { studentName: 'CHALLA POORNADURGAGANESH', phone: '6304997988' },
  { studentName: 'DALAI SRIVALLI', phone: '9703685934' },
  { studentName: 'DASARI ROHINI', phone: '9912327939' },
  { studentName: 'DEVEJU REVANTH', phone: '6301085015' },
  { studentName: 'ELLAGANTHULA DURGA ESWARI', phone: '8790179511' },
  { studentName: 'GANIVADA GAYATRI', phone: '9676751295' },
  { studentName: 'GARIKIPATI PAVAN KUMAR', phone: 'NO_PHONE_13' },
  { studentName: 'GOLLORI SAI KIRAN', phone: 'NO_PHONE_14' },
  { studentName: 'GUDEPU DURGA DANUSH DORA', phone: '8897451259' },
  { studentName: 'GUMPANA DIVYA', phone: '9502576197' },
  { studentName: 'KALLA DHARANI', phone: '8019694330' },
  { studentName: 'KALLA PAVAN MAHALAXMI NAIDU', phone: '9494669352' },
  { studentName: 'KANITHI JAHNAVI', phone: '9398856354' },
  { studentName: 'KILLU MANOHAR VARAPRASAD', phone: '8985511832' },
  { studentName: 'NAMMI RAJYA LAKSHMI', phone: '9390358872' },
  { studentName: 'PADALA MADHU', phone: '9160987278' },
  { studentName: 'PADALA MAHESH', phone: '9966763659' },
  { studentName: 'PANGI ANWESH', phone: '8639573246' },
  { studentName: 'PASILA NAVYA DEEPTHI', phone: '8688882227' },
  { studentName: 'PEDIREDLA RAMU KUMAR', phone: 'NO_PHONE_15' },
  { studentName: 'PEMME DHARANI', phone: '9542589487' },
  { studentName: 'PINAPOLU UMA LATHA', phone: '9492153639' },
  { studentName: 'REMIDI ESWARAPRASAD', phone: 'NO_PHONE_16' },
  { studentName: 'SAYYAPUREDDY VEYASANTH', phone: '9398949223' },
  { studentName: 'SHAIK BILAL', phone: 'NO_PHONE_17' },
  { studentName: 'SUNKARI LASHYA', phone: '9542909434' },
  { studentName: 'THUNGALA KEERTHI', phone: 'NO_PHONE_18' },
  { studentName: 'TURIBILLI VARAPRASAD', phone: '7731020562' },
  { studentName: 'VELUGULA LAKSHMI NARAYANA', phone: 'NO_PHONE_19' },
  { studentName: 'VEPADA SYAM KUMAR', phone: '9640153597' },
  { studentName: 'YALAMANCHILI JAGAN KUMARI', phone: '8179311720' },
  { studentName: 'YALAMANCHILI RENUKA', phone: '6309164559' },
  { studentName: 'YELISETTY PRASANTH', phone: '8367346528' }
];

async function main() {
  const employeeId = '9010737882';
  console.log('Fetching details for inserting students...');
  
  const mandal = await prisma.configValue.findFirst({ where: { type: 'MANDAL', value: { contains: 'Butchayyapeta', mode: 'insensitive' } } });
  const village = await prisma.configValue.findFirst({ where: { type: 'VILLAGE', value: { contains: 'Vaddadi', mode: 'insensitive' } } });
  const school = await prisma.configValue.findFirst({ where: { type: 'SCHOOL', value: { contains: 'ZPHS School Vaddadi', mode: 'insensitive' } } });
  const group = await prisma.configValue.findFirst({ where: { type: 'GROUP', value: 'No Clarity' } });

  if (!mandal || !village || !school || !group) {
    console.error('Missing config values!', { mandal, village, school, group });
    return;
  }

  let inserted = 0;
  for (const s of studentsData) {
    try {
      // Check if phone already exists in DB to prevent unique phone error in app logic later?
      // Since some have fake numbers NO_PHONE_x, we don't care if they clash later but we made them unique here.
      // If a real number already exists in DB, it will be skipped by finding first.
      const existing = await prisma.student.findFirst({ where: { phone: s.phone } });
      if (existing) {
        console.log(`Skipping ${s.studentName} (${s.phone}) - Phone already exists.`);
        continue;
      }

      await prisma.student.create({
        data: {
          employeeId: employeeId,
          studentName: s.studentName,
          phone: s.phone,
          mandal: mandal.id,
          village: village.id,
          schoolName: school.id,
          group: group.id,
          doorstepCompleted: false
        }
      });
      inserted++;
    } catch (e) {
      console.error(`Failed to insert ${s.studentName} (${s.phone}):`, e);
    }
  }
  
  console.log(`Successfully inserted ${inserted} new students!`);
}

main().finally(() => prisma.$disconnect());
