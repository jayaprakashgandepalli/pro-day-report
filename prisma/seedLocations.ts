import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const data = {
  "Madugula": ["Anukuru", "Avuruvada", "Bhagavathula Agraharam", "China Gorrigedda", "China Kurmam", "China Sarada", "Chintaluru", "Degalapalem", "Gadirai", "Goppulapalem", "Gotivada Agraharam", "Jalampalle", "Jammadevipeta", "Jampena", "Kagitha", "Kamakutam", "Kaspa Jagannadhapuram", "Kinthali", "Kinthali Vallapuram", "Kurmanadhapuram", "Lakshmipuram", "Lova Kothapalle", "Lova Krishnapuram", "Lova Ponnavolu", "Lovagavara Varam", "M.K.Vallapuram", "Maddulapalem", "Madugula", "Madugula Koduru", "Madugulakotapadu", "Medaveedu", "Moksha Krishnapuram", "Mukundapuram", "P.Sivaram Puram", "Pappusettiseri", "Peda Gorrigedda", "Peda Sarada", "Pittagedda", "Pongalipaka", "Pothanapudi Agraharam", "Ravipalem", "Sagaram", "Sanghyam", "Sankaram", "Satyavaram", "Tatiparthi", "Tiruvada", "Vantarlapalem", "Veeranarayanam", "Veeravilli", "Vommali", "Vommali Jagannadhapuram", "Yerukuvada"],
  "Cheedikada": ["Advi Agraharam", "Appalarajupuram", "Arjunagiri Agraharam", "Bylapudi", "Bylapudi Singavaram", "Cheedikada", "Cheedipalle Agraharam", "Chettupalle", "Chinagogada", "Chukkapalle", "Dandi Suravaram", "Dibbapalem", "G. Kothapalle", "Jaithavaram", "J. B. Puram", "Kattuvari Agraharam", "Khandivara Agraharam", "Konam", "Kondasompura Agraharam", "Lingabhupala Patnam", "Manchala", "Neelampeta", "Pedagogada Agraharam", "Seetharampura Agraharam", "Sirijam", "Tangudubilli", "Tuni Valasa", "Tunivalasa Bhupatipalem", "Turuvolu", "Varahapura Agraharam", "Veerabhadrapeta", "Veerapurajupeta", "Vellanki", "Vintipalem"],
  "Chodavaram": ["Adduru", "Amberupuram", "Ankupalem", "Annavaram", "Bennavolu", "Bhogapuram", "Chakipalle", "Chodavaram", "Damunapalle", "Duddupalem", "Gajapathinagaram", "Gandhavaram", "Gavaravaram", "Govada", "Gowripatnam", "Jannavaram", "Juttada", "Khandipalle", "Lakkavaram", "Laxmipuram", "M. Kothapalle", "Muddurthi", "Mycherlapalem", "Narasayyapeta", "Pakirsahebpeta", "Rayapurajupeta", "Seemunapalle", "Sreerampatnam", "Thimmannapalem", "Venkannapalem", "Venkayyagaripeta"],
  "Devarapalli": ["Alamanda", "Alamandakothapalle", "Bethapudi", "Boddapadu", "Boilakintada", "Chainulapalem", "Chinagangavaram", "Chinanandipalle", "Chinasompuram", "Chintalapudi", "Devarapalle", "Garisingi", "Gorupalem", "Juttadapalem", "Kaligotla", "Kasipathirajupuram", "Kasipuram", "Kondakodabu", "Kothapenta", "Lovamukundapuram", "Lovarayapuraju Peta", "Mamidipalle", "Marepalle", "Mulakalapalle", "Mushidipalle", "Nagayyapeta", "Narasimha Gajapathinagaram", "Pallapukodabu", "Pedanandipalle Agraharam", "Pedasompuram", "Raiwada", "Sambuvanipalem", "Sammeda", "Seetampeta", "Sivaramachainulapalem", "Tamarabba", "Taruva", "Tenugupudi", "Thimiram", "Vakapalle", "Valabu", "Vechalam", "Venkatarajupuram"],
  "Ravikamatam": ["Badanapadu", "Buddibanda", "Chalisingam @ Demudukonda", "Cheemalapadu", "Chinapachila", "Dharmavaram", "Diddi", "Dondapudi", "Garnikam", "Gogamcheedipalle", "Gompa", "Guddipa", "Gudiwada", "Gummallapadu", "Kanada", "Kavagunta", "Komira", "Kothakota", "Kotnabilli", "Krishnabhupala Puram Agraharam", "Machchavanipalem", "Marrivalasa", "Marupaka", "Matsyapuram", "Medivada", "Pedapachila", "Pulakandam Ponavolu", "Ravikamatham", "T.Arjapuram", "Tattabanda", "Totakurapalem", "Z.Bennavaram", "Z.Kothapatnam"],
  "Butchayyapeta": ["Aithampudi", "Appampalem", "Bhatlova", "Butchayyapeta", "China Madina", "Chinappannapalem", "Chintapaka", "Chittiyyapalem", "Dibbidi", "Gantikorlam", "Gunnempudi", "Kandipudi", "Karaka", "Komallapudi", "Kondapalem", "Kondapalem Agraharam", "Kondempudi", "L. Singavaram", "Laluru", "Lingabhupala Puram Agraharam", "Lopudi", "Mallam", "Mallam Bhupathipalem", "Mangalapuram", "Neelakantapuram", "Nimmalova", "P. Bheemavaram", "Pangidi", "Peda Madina", "Pedapudi", "Pedapudi Agraharam", "Polepalle", "Pottidorapalem", "R. Bheemavaram", "R. Sivarampuram", "Rajam", "Turakalapudi", "Typuram", "Vaddadi", "Vijayaramarajupeta"],
  "K. Kotapadu": ["Alamanda Bheemavaram", "Alamandakoduru", "Arle", "Chandrayyapeta", "Chowduvada", "Dalivalasa", "Deekshitula Agraharam", "Garugubilli", "Gavarapalem", "Gondupalem", "Gotlam", "Gullepalle", "Kavi Konda Agraharam", "Kintada", "Kintadakotapadu", "Koruvada", "Koruvada Jagannadhapuram", "Marrivalasa", "Medicherla", "Paidampeta", "Pathavalasa", "Pindrangi", "Pothanavalasa Agraharam", "Ramayogi Agraharam", "Rongalinaidupalle", "Santhapalem", "Singannadorapalem", "Srungavaram", "Sudivalasa", "Suriddipalem", "Ugginavalasa", "Varada"]
};

async function main() {
  console.log("Starting seed for Anakapalli locations...");

  // 1. Get or create Anakapalli District
  let district = await prisma.configValue.findFirst({
    where: { type: 'DISTRICT', value: 'Anakapalli' }
  });

  if (!district) {
    district = await prisma.configValue.create({
      data: { type: 'DISTRICT', value: 'Anakapalli' }
    });
    console.log("Created District: Anakapalli");
  } else {
    console.log("Found District: Anakapalli");
  }

  // 2. Add Mandals and Villages
  for (const [mandalName, villages] of Object.entries(data)) {
    // Get or Create Mandal
    let mandal = await prisma.configValue.findFirst({
      where: { type: 'MANDAL', value: mandalName, parentId: district.id }
    });

    if (!mandal) {
      mandal = await prisma.configValue.create({
        data: { type: 'MANDAL', value: mandalName, parentId: district.id }
      });
      console.log(`Created Mandal: ${mandalName}`);
    } else {
      console.log(`Found Mandal: ${mandalName}`);
    }

    // Add Villages
    for (const villageName of villages) {
      let village = await prisma.configValue.findFirst({
        where: { type: 'VILLAGE', value: villageName, parentId: mandal.id }
      });

      if (!village) {
        await prisma.configValue.create({
          data: { type: 'VILLAGE', value: villageName, parentId: mandal.id }
        });
        console.log(`  - Created Village: ${villageName}`);
      }
    }
  }

  console.log("Seeding complete!");
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
