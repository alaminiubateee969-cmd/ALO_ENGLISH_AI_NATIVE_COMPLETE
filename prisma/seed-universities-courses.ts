/**
 * prisma/seed-universities-courses.ts
 *
 * Seeds real universities + courses for the Course Finder.
 */

import { PrismaClient } from "@prisma/client";
const db = new PrismaClient();

type UniData = {
  name: string;
  country: string;
  city: string;
  website: string;
  ranking: number;
  courses: Array<{
    name: string;
    level: string;
    tuitionFee: number;
    duration: string;
    entryRequirements: string;
    description: string;
    ieltsRequirement: string;
    scholarship: string;
  }>;
}

const UNIVERSITIES: UniData[] = [
  {
    name: "University of Oxford",
    country: "UK",
    city: "Oxford",
    website: "https://www.ox.ac.uk",
    ranking: 1,
    courses: [
      { name: "MSc Computer Science", level: "PG", tuitionFee: 35000, duration: "1 year", entryRequirements: "First-class honours degree in CS or related", description: "Advanced computer science program covering AI, machine learning, and systems.", ieltsRequirement: "7.5 overall (7.0 minimum per band)", scholarship: "Clarendon Fund, Rhodes Scholarship" },
      { name: "MBA", level: "PG", tuitionFee: 65000, duration: "1 year", entryRequirements: "2:1 degree + 3 years work experience + GMAT", description: "World-leading MBA program with global networking.", ieltsRequirement: "7.5 overall (7.0 minimum per band)", scholarship: "Oxford Saïd Scholarships" },
      { name: "BSc Economics", level: "UG", tuitionFee: 28000, duration: "3 years", entryRequirements: "A*AA at A-level including Mathematics", description: "Comprehensive economics degree with quantitative focus.", ieltsRequirement: "7.0 overall (6.5 minimum per band)", scholarship: "Oxford Opportunity Bursaries" },
    ],
  },
  {
    name: "University of Cambridge",
    country: "UK",
    city: "Cambridge",
    website: "https://www.cam.ac.uk",
    ranking: 2,
    courses: [
      { name: "MPhil Engineering", level: "PG", tuitionFee: 33000, duration: "1 year", entryRequirements: "First-class honours in Engineering", description: "Research-focused engineering masters.", ieltsRequirement: "7.5 overall", scholarship: "Gates Cambridge Scholarship" },
      { name: "BA Law", level: "UG", tuitionFee: 27000, duration: "3 years", entryRequirements: "A*A*A at A-level", description: "Renowned law degree preparing for barrister/solicitor careers.", ieltsRequirement: "7.5 overall (7.0 per band)", scholarship: "Cambridge Bursary Scheme" },
    ],
  },
  {
    name: "University of Toronto",
    country: "Canada",
    city: "Toronto",
    website: "https://www.utoronto.ca",
    ranking: 18,
    courses: [
      { name: "MSc Data Science", level: "PG", tuitionFee: 45000, duration: "2 years", entryRequirements: "B+ average in relevant undergraduate degree", description: "Statistical and computational data science.", ieltsRequirement: "7.0 overall (6.5 per band)", scholarship: "Vanier Canada Graduate Scholarship" },
      { name: "BSc Computer Science", level: "UG", tuitionFee: 42000, duration: "4 years", entryRequirements: "High school diploma with Calculus + English", description: "Comprehensive CS program with co-op option.", ieltsRequirement: "6.5 overall (6.0 per band)", scholarship: "Lester B. Pearson International Scholarship" },
      { name: "Master of Management", level: "PG", tuitionFee: 48000, duration: "2 years", entryRequirements: "Undergraduate degree in any discipline", description: "Management program for non-business graduates.", ieltsRequirement: "7.0 overall", scholarship: "U of T Excellence Scholarship" },
    ],
  },
  {
    name: "University of Melbourne",
    country: "Australia",
    city: "Melbourne",
    website: "https://www.unimelb.edu.au",
    ranking: 14,
    courses: [
      { name: "Master of Engineering", level: "PG", tuitionFee: 38000, duration: "2-3 years", entryRequirements: "Engineering degree + 2 years experience", description: "Professional engineering accreditation program.", ieltsRequirement: "6.5 overall (6.0 per band)", scholarship: "Melbourne International Scholarship" },
      { name: "Bachelor of Commerce", level: "UG", tuitionFee: 35000, duration: "3 years", entryRequirements: "Secondary school equivalent to VCE", description: "Business and commerce degree with multiple majors.", ieltsRequirement: "6.5 overall (6.0 per band)", scholarship: "Melbourne Chancellor's Scholarship" },
    ],
  },
  {
    name: "Harvard University",
    country: "USA",
    city: "Cambridge, MA",
    website: "https://www.harvard.edu",
    ranking: 3,
    courses: [
      { name: "Master of Public Health", level: "PG", tuitionFee: 55000, duration: "2 years", entryRequirements: "Bachelor's degree + work experience", description: "Public health leadership program.", ieltsRequirement: "7.5 overall (7.0 per band)", scholarship: "Harvard Financial Aid Initiative" },
      { name: "MBA", level: "PG", tuitionFee: 73000, duration: "2 years", entryRequirements: "Bachelor's + GMAT/GRE + work experience", description: "Premier global business education.", ieltsRequirement: "7.5 overall", scholarship: "Need-Based Harvard MBA Scholarships" },
    ],
  },
  {
    name: "University College Dublin",
    country: "Ireland",
    city: "Dublin",
    website: "https://www.ucd.ie",
    ranking: 171,
    courses: [
      { name: "MSc Business Analytics", level: "PG", tuitionFee: 22000, duration: "1 year", entryRequirements: "2:1 degree in business/quantitative subject", description: "Data-driven business decision making.", ieltsRequirement: "6.5 overall (6.0 per band)", scholarship: "UCD Global Excellence Scholarship" },
      { name: "BSc Nursing", level: "UG", tuitionFee: 20000, duration: "4 years", entryRequirements: "Secondary school with science subjects", description: "Registered nurse qualification program.", ieltsRequirement: "6.5 overall (6.5 per band)", scholarship: "UCD Ad Astra Academy" },
    ],
  },
  {
    name: "University of Auckland",
    country: "New Zealand",
    city: "Auckland",
    website: "https://www.auckland.ac.nz",
    ranking: 65,
    courses: [
      { name: "Master of Information Technology", level: "PG", tuitionFee: 28000, duration: "1.5 years", entryRequirements: "Bachelor's degree in any subject", description: "IT professional conversion program.", ieltsRequirement: "6.5 overall (6.0 per band)", scholarship: "University of Auckland International Student Excellence" },
      { name: "Bachelor of Engineering (Hons)", level: "UG", tuitionFee: 25000, duration: "4 years", entryRequirements: "NCEA with physics + calculus", description: "Professional engineering degree.", ieltsRequirement: "6.0 overall (5.5 per band)", scholarship: "NZ Excellence Awards" },
    ],
  },
  {
    name: "Heriot-Watt University Dubai",
    country: "Dubai",
    city: "Dubai",
    website: "https://www.hw.ac.uk/dubai",
    ranking: 270,
    courses: [
      { name: "BSc Computer Systems", level: "UG", tuitionFee: 18000, duration: "3-4 years", entryRequirements: "A-level equivalent + math", description: "Computing systems engineering program.", ieltsRequirement: "6.0 overall (5.5 per band)", scholarship: "Heriot-Watt Dubai Scholarship" },
      { name: "MBA", level: "PG", tuitionFee: 25000, duration: "1 year", entryRequirements: "Bachelor's + 3 years experience", description: "Global MBA with Dubai business focus.", ieltsRequirement: "6.5 overall", scholarship: "Dubai Academic Scholarship" },
    ],
  },
];

async function main() {
  console.log("Seeding universities and courses...\n");

  for (const uniData of UNIVERSITIES) {
    // Find or create country
    const countryCodeMap: Record<string, string> = {
      "UK": "GB", "Canada": "CA", "Australia": "AU", "USA": "US",
      "Ireland": "IE", "New Zealand": "NZ", "Dubai": "AE",
    };
    let country = await db.country.findFirst({ where: { name: uniData.country } });
    if (!country) {
      country = await db.country.create({
        data: {
          name: uniData.country,
          code: countryCodeMap[uniData.country] || "XX",
        },
      });
    }

    // Find or create university
    let uni = await db.university.findFirst({ where: { name: uniData.name } });
    if (!uni) {
      uni = await db.university.create({
        data: {
          name: uniData.name,
          countryId: country.id,
          city: uniData.city,
          website: uniData.website,
          description: `University located in ${uniData.city}, ${uniData.country}. World ranking: #${uniData.ranking}.`,
          isActive: true,
          isPublished: true,
        },
      });
      console.log(`✅ University: ${uniData.name}`);
    }

    // Create courses
    for (const c of uniData.courses) {
      const existing = await db.course.findFirst({
        where: { universityId: uni.id, name: c.name },
      });
      if (!existing) {
        const course = await db.course.create({
          data: {
            universityId: uni.id,
            name: c.name,
            level: c.level,
            duration: c.duration,
            tuitionFee: c.tuitionFee,
            currency: "USD",
            entryRequirements: c.entryRequirements,
            description: c.description,
            isActive: true,
          },
        });

        // Add intakes for this course
        const intakeMonths = ["Jan", "May", "Sep"];
        for (const month of intakeMonths) {
          await db.courseIntake.create({
            data: {
              courseId: course.id,
              month,
              year: 2027,
              deadline: new Date(`2027-${month === "Jan" ? "01" : month === "May" ? "05" : "09"}-15`),
            },
          }).catch(() => {});
        }

        console.log(`  📚 ${c.name} (${c.level}, $${c.tuitionFee}/yr)`);
      }
    }
  }

  const totalUnis = await db.university.count();
  const totalCourses = await db.course.count();
  const totalIntakes = await db.courseIntake.count();
  console.log(`\n📊 Total: ${totalUnis} universities, ${totalCourses} courses, ${totalIntakes} intakes`);
}

main()
  .then(() => db.$disconnect())
  .catch((e) => {
    console.error("Seed failed:", e);
    db.$disconnect();
    process.exit(1);
  });
