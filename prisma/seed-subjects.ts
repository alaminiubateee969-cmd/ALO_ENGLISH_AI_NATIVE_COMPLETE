/**
 * prisma/seed-subjects.ts
 *
 * Seeds the Subject table with common study subjects/categories.
 * Also adds intake data to existing courses.
 */

import { PrismaClient } from "@prisma/client";
const db = new PrismaClient();

const SUBJECTS = [
  { name: "Business Administration", category: "Business" },
  { name: "Management", category: "Business" },
  { name: "Marketing", category: "Business" },
  { name: "Finance", category: "Business" },
  { name: "Accounting", category: "Business" },
  { name: "MBA", category: "Business" },
  { name: "Computer Science", category: "Engineering & IT" },
  { name: "Software Engineering", category: "Engineering & IT" },
  { name: "Data Science", category: "Engineering & IT" },
  { name: "Artificial Intelligence", category: "Engineering & IT" },
  { name: "Cybersecurity", category: "Engineering & IT" },
  { name: "Information Technology", category: "Engineering & IT" },
  { name: "Mechanical Engineering", category: "Engineering" },
  { name: "Civil Engineering", category: "Engineering" },
  { name: "Electrical Engineering", category: "Engineering" },
  { name: "Chemical Engineering", category: "Engineering" },
  { name: "Medicine (MBBS)", category: "Medicine & Health" },
  { name: "Nursing", category: "Medicine & Health" },
  { name: "Pharmacy", category: "Medicine & Health" },
  { name: "Public Health", category: "Medicine & Health" },
  { name: "Dentistry", category: "Medicine & Health" },
  { name: "Law", category: "Law" },
  { name: "International Relations", category: "Law" },
  { name: "Psychology", category: "Social Sciences" },
  { name: "Sociology", category: "Social Sciences" },
  { name: "Economics", category: "Social Sciences" },
  { name: "Political Science", category: "Social Sciences" },
  { name: "Education", category: "Education" },
  { name: "TESOL", category: "Education" },
  { name: "English Literature", category: "Arts & Humanities" },
  { name: "History", category: "Arts & Humanities" },
  { name: "Philosophy", category: "Arts & Humanities" },
  { name: "Graphic Design", category: "Arts & Humanities" },
  { name: "Architecture", category: "Arts & Humanities" },
  { name: "Hospitality Management", category: "Hospitality" },
  { name: "Tourism Management", category: "Hospitality" },
  { name: "Culinary Arts", category: "Hospitality" },
  { name: "Environmental Science", category: "Science" },
  { name: "Biotechnology", category: "Science" },
  { name: "Physics", category: "Science" },
  { name: "Chemistry", category: "Science" },
  { name: "Mathematics", category: "Science" },
];

async function main() {
  console.log("Seeding subjects...");
  let added = 0;
  for (const s of SUBJECTS) {
    const existing = await db.subject.findUnique({ where: { name: s.name } });
    if (!existing) {
      await db.subject.create({ data: s });
      added++;
    }
  }
  console.log(`✅ ${added} subjects added (${SUBJECTS.length - added} already existed)`);

  // Add intakes to existing courses
  const courses = await db.course.findMany({ take: 50 });
  const intakeMonths = ["Jan", "May", "Sep"];
  const year = 2027;
  let intakeAdded = 0;

  for (const course of courses) {
    for (const month of intakeMonths) {
      const existing = await db.courseIntake.findUnique({
        where: { courseId_month_year: { courseId: course.id, month, year } },
      });
      if (!existing) {
        await db.courseIntake.create({
          data: {
            courseId: course.id,
            month,
            year,
            deadline: new Date(`${year}-${month === "Jan" ? "01" : month === "May" ? "05" : "09"}-15`),
          },
        });
        intakeAdded++;
      }
    }
  }
  console.log(`✅ ${intakeAdded} course intakes added`);

  const totalSubjects = await db.subject.count();
  const totalIntakes = await db.courseIntake.count();
  console.log(`\n📊 Total subjects: ${totalSubjects}`);
  console.log(`📊 Total course intakes: ${totalIntakes}`);
}

main()
  .then(() => db.$disconnect())
  .catch((e) => {
    console.error("Seed failed:", e);
    db.$disconnect();
    process.exit(1);
  });
