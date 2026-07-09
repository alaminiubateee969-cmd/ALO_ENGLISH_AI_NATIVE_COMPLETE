import {
  Plane,
  GraduationCap,
  Award,
  FileText,
  Mic,
  PlaneTakeoff,
  Users,
  Building2,
  BookOpen,
  MapPin,
  Briefcase,
  Clock,
  Banknote,
  ShieldCheck,
  type LucideIcon,
} from "lucide-react";

export type Destination = {
  id: string;
  name: string;
  flag: string;
  image: string;
  accent: string; // hex
  accentSoft: string;
  tagline: string;
  blurb: string;
  quickFacts: { label: string; value: string; icon: LucideIcon }[];
  highlights: string[];
  topUniversities: string[];
  popularCourses: string[];
  tuitionRange: string;
};

export const DESTINATIONS: Destination[] = [
  {
    id: "uk",
    name: "United Kingdom",
    flag: "🇬🇧",
    image: "/images/dest-uk.png",
    accent: "#012169",
    accentSoft: "#E6EBF5",
    tagline: "World-ranked universities, 2-year post-study work visa",
    blurb:
      "Study at historic and modern UK institutions with the Graduate Route visa offering 2 years of post-study work. Home to 4 of the world's top 30 universities.",
    quickFacts: [
      { label: "Universities", value: "160+", icon: Building2 },
      { label: "Avg. tuition", value: "£14k–£30k/yr", icon: Banknote },
      { label: "Post-study work", value: "2 years", icon: Clock },
      { label: "Popular intake", value: "Sep / Jan", icon: Clock },
      { label: "Visa route", value: "Student Visa", icon: ShieldCheck },
      { label: "Part-time work", value: "20 hrs/week", icon: Briefcase },
    ],
    highlights: [
      "2-year Graduate Route post-study work visa",
      "Home to Oxford, Cambridge, Imperial, UCL",
      "Shorter 1-year Master's degrees",
      "Free NHS healthcare for students",
    ],
    topUniversities: ["University of Oxford", "University of Cambridge", "Imperial College London", "UCL", "University of Edinburgh"],
    popularCourses: ["Business & Management", "Computer Science", "Engineering", "Law", "Data Science"],
    tuitionRange: "£14,000 – £30,000 / year",
  },
  {
    id: "canada",
    name: "Canada",
    flag: "🇨🇦",
    image: "/images/dest-canada.png",
    accent: "#D52B1E",
    accentSoft: "#FBE7E5",
    tagline: "Clear PR pathway, affordable tuition, welcoming culture",
    blurb:
      "Canada offers a transparent path to permanent residency through the Post-Graduation Work Permit (PGWP) and Express Entry. Known for safety, diversity and affordability.",
    quickFacts: [
      { label: "Universities", value: "100+", icon: Building2 },
      { label: "Avg. tuition", value: "CA$20k–35k/yr", icon: Banknote },
      { label: "Post-study work", value: "Up to 3 yrs", icon: Clock },
      { label: "Popular intake", value: "Sep / Jan / May", icon: Clock },
      { label: "Visa route", value: "Study Permit", icon: ShieldCheck },
      { label: "Part-time work", value: "20 hrs/week", icon: Briefcase },
    ],
    highlights: [
      "Post-Graduation Work Permit up to 3 years",
      "Clear Express Entry PR pathway",
      "Affordable tuition vs USA/UK",
      "Bilingual English & French environment",
    ],
    topUniversities: ["University of Toronto", "UBC", "McGill University", "University of Waterloo", "University of Alberta"],
    popularCourses: ["Computer Science", "Engineering", "Business Analytics", "Health Sciences", "Data Science"],
    tuitionRange: "CA$20,000 – CA$35,000 / year",
  },
  {
    id: "australia",
    name: "Australia",
    flag: "🇦🇺",
    image: "/images/dest-australia.png",
    accent: "#012169",
    accentSoft: "#E6EBF5",
    tagline: "High graduate salaries, 4-year post-study work, beach lifestyle",
    blurb:
      "Australia combines top-100 universities with a strong economy and post-study work rights of 2–4 years. The Group of Eight (Go8) leads global research rankings.",
    quickFacts: [
      { label: "Universities", value: "43", icon: Building2 },
      { label: "Avg. tuition", value: "A$22k–42k/yr", icon: Banknote },
      { label: "Post-study work", value: "2–4 years", icon: Clock },
      { label: "Popular intake", value: "Feb / Jul", icon: Clock },
      { label: "Visa route", value: "Subclass 500", icon: ShieldCheck },
      { label: "Part-time work", value: "24 hrs/week", icon: Briefcase },
    ],
    highlights: [
      "Temporary Graduate Visa (485) for 2–4 years",
      "Group of Eight top-100 research universities",
      "Strong graduate salaries & quality of life",
      "Regional study bonus for PR points",
    ],
    topUniversities: ["University of Melbourne", "UNSW Sydney", "University of Sydney", "ANU", "Monash University"],
    popularCourses: ["Nursing", "IT & Cybersecurity", "Engineering", "Accounting", "Public Health"],
    tuitionRange: "A$22,000 – A$42,000 / year",
  },
  {
    id: "usa",
    name: "United States",
    flag: "🇺🇸",
    image: "/images/dest-usa.png",
    accent: "#0A3161",
    accentSoft: "#E6EDF5",
    tagline: "Largest university system, OPT work, global research leader",
    blurb:
      "The USA hosts the world's largest university system with unmatched research funding and the OPT/STEM-OPT pathway for up to 3 years of post-study work.",
    quickFacts: [
      { label: "Universities", value: "4,000+", icon: Building2 },
      { label: "Avg. tuition", value: "$25k–55k/yr", icon: Banknote },
      { label: "Post-study work", value: "1–3 yrs OPT", icon: Clock },
      { label: "Popular intake", value: "Fall / Spring", icon: Clock },
      { label: "Visa route", value: "F-1 Visa", icon: ShieldCheck },
      { label: "Part-time work", value: "20 hrs/week", icon: Briefcase },
    ],
    highlights: [
      "STEM OPT extension up to 3 years",
      "Largest research funding globally",
      "Flexible major/minor & liberal arts",
      "Ivy League + top public universities",
    ],
    topUniversities: ["MIT", "Stanford University", "Harvard University", "UC Berkeley", "Carnegie Mellon"],
    popularCourses: ["Computer Science", "MBA", "Data Science", "Engineering", "Public Health"],
    tuitionRange: "$25,000 – $55,000 / year",
  },
  {
    id: "ireland",
    name: "Ireland",
    flag: "🇮🇪",
    image: "/images/dest-ireland.png",
    accent: "#169B62",
    accentSoft: "#E6F5EE",
    tagline: "European tech hub, 2-year stay-back, English-speaking",
    blurb:
      "Ireland is Europe's English-speaking tech hub hosting Google, Meta and Pfizer. The Third Level Graduate Scheme offers 1–2 years stay-back for work.",
    quickFacts: [
      { label: "Universities", value: "34", icon: Building2 },
      { label: "Avg. tuition", value: "€10k–25k/yr", icon: Banknote },
      { label: "Post-study work", value: "1–2 years", icon: Clock },
      { label: "Popular intake", value: "Sep / Jan", icon: Clock },
      { label: "Visa route", value: "Long C Study", icon: ShieldCheck },
      { label: "Part-time work", value: "20 hrs/week", icon: Briefcase },
    ],
    highlights: [
      "1–2 year Third Level Graduate stay-back",
      "European HQ for Google, Meta, Apple",
      "English-speaking EU member state",
      "Trinity College Dublin in world top 100",
    ],
    topUniversities: ["Trinity College Dublin", "University College Dublin", "University of Galway", "DCU", "UCC"],
    popularCourses: ["Computer Science", "Data Analytics", "Pharma & Biotech", "Business", "Cybersecurity"],
    tuitionRange: "€10,000 – €25,000 / year",
  },
  {
    id: "new-zealand",
    name: "New Zealand",
    flag: "🇳🇿",
    image: "/images/dest-newzealand.png",
    accent: "#012169",
    accentSoft: "#E6EBF5",
    tagline: "Post-study work visa, safe & scenic, 8 universities",
    blurb:
      "New Zealand offers a Post-Study Work Visa of 1–3 years, a safe environment, and all 8 public universities ranked in the QS world top 3%.",
    quickFacts: [
      { label: "Universities", value: "8", icon: Building2 },
      { label: "Avg. tuition", value: "NZ$22k–35k/yr", icon: Banknote },
      { label: "Post-study work", value: "1–3 years", icon: Clock },
      { label: "Popular intake", value: "Feb / Jul", icon: Clock },
      { label: "Visa route", value: "Student Visa", icon: ShieldCheck },
      { label: "Part-time work", value: "20 hrs/week", icon: Briefcase },
    ],
    highlights: [
      "Post-Study Work Visa of 1–3 years",
      "All 8 universities in world top 3%",
      "Safe, peaceful and scenic lifestyle",
      "Clear skilled migrant PR pathway",
    ],
    topUniversities: ["University of Auckland", "University of Otago", "Victoria University of Wellington", "AUT", "University of Canterbury"],
    popularCourses: ["Engineering", "Nursing", "Agriculture", "IT", "Hospitality"],
    tuitionRange: "NZ$22,000 – NZ$35,000 / year",
  },
  {
    id: "dubai",
    name: "Dubai, UAE",
    flag: "🇦🇪",
    image: "/images/dest-dubai.png",
    accent: "#C8102E",
    accentSoft: "#FBE7EA",
    tagline: "Tax-free income, global university campuses, golden visa",
    blurb:
      "Dubai hosts international branch campuses of UK, USA and Australian universities. Enjoy tax-free earnings, a Golden Visa pathway and a strategic global location.",
    quickFacts: [
      { label: "Universities", value: "60+ branches", icon: Building2 },
      { label: "Avg. tuition", value: "AED 40k–80k/yr", icon: Banknote },
      { label: "Post-study work", value: "1 year+", icon: Clock },
      { label: "Popular intake", value: "Sep / Jan", icon: Clock },
      { label: "Visa route", value: "Student Visa", icon: ShieldCheck },
      { label: "Part-time work", value: "Permitted", icon: Briefcase },
    ],
    highlights: [
      "Branch campuses of UK/USA/AUS universities",
      "Tax-free income & Golden Visa pathway",
      "Strategic gateway between East & West",
      "Booming job market in finance & tech",
    ],
    topUniversities: ["Heriot-Watt Dubai", "University of Wollongong Dubai", "Middlesex University Dubai", "AUD", "Amity Dubai"],
    popularCourses: ["Business & MBA", "Computer Science", "Architecture", "Engineering", "Hospitality"],
    tuitionRange: "AED 40,000 – AED 80,000 / year",
  },
];


export type Service = {
  id: string;
  title: string;
  icon: LucideIcon;
  description: string;
  features: string[];
  accent: "blue" | "orange";
};

export const SERVICES: Service[] = [
  {
    id: "study-abroad-counseling",
    title: "Study Abroad Counseling",
    icon: Users,
    description: "Personalized 1:1 guidance to choose the right country, course and university for your goals and budget.",
    features: ["Profile evaluation", "Country shortlisting", "University matching", "Budget planning"],
    accent: "blue",
  },
  {
    id: "university-application",
    title: "University Application",
    icon: FileText,
    description: "End-to-end application management across multiple universities and intakes with deadline tracking.",
    features: ["Application drafting", "Document review", "Submission tracking", "Offer comparison"],
    accent: "orange",
  },
  {
    id: "scholarship-guidance",
    title: "Scholarship Guidance",
    icon: Award,
    description: "Identify and apply for merit, need-based and country-specific scholarships to reduce tuition costs.",
    features: ["Scholarship matching", "Essay support", "Deadlines tracked", "Renewal guidance"],
    accent: "blue",
  },
  {
    id: "visa-guidance",
    title: "Visa Guidance",
    icon: ShieldCheck,
    description: "Complete student visa support including financials, SOPs and interview readiness for every country.",
    features: ["Visa documentation", "Financial proof", "Interview prep", "GTE/SOP review"],
    accent: "orange",
  },
  {
    id: "sop-cv-support",
    title: "SOP & CV Support",
    icon: BookOpen,
    description: "AI-assisted SOP drafting and CV auditing to make your application stand out to admissions committees.",
    features: ["AI SOP Writer", "CV Auditor", "Personalized editing", "Multiple drafts"],
    accent: "blue",
  },
  {
    id: "interview-preparation",
    title: "Interview Preparation",
    icon: Mic,
    description: "Mock credibility, visa and university CAS interviews with the ALO Practice Interview Coach.",
    features: ["Credibility interview", "Visa interview", "CAS interview", "Scholarship interview"],
    accent: "orange",
  },
  {
    id: "pre-departure",
    title: "Pre-Departure Support",
    icon: PlaneTakeoff,
    description: "Airport pickup, accommodation, banking, SIM and orientation so you land ready and confident.",
    features: ["Accommodation help", "Airport pickup", "Banking & SIM", "Orientation briefing"],
    accent: "blue",
  },
];

export type Scholarship = {
  id: string;
  name: string;
  country: string;
  amount: string;
  level: string;
  eligibility: string;
};

export const SCHOLARSHIPS: Scholarship[] = [
  { id: "chevening", name: "Chevening Scholarship", country: "UK", amount: "Full tuition + £18k stipend", level: "Master's", eligibility: "2+ years work experience, leadership potential" },
  { id: "commonwealth", name: "Commonwealth Scholarship", country: "UK", amount: "Full tuition + stipend", level: "Master's / PhD", eligibility: "Commonwealth country nationals" },
  { id: "vanier", name: "Vanier Canada Graduate", country: "Canada", amount: "CA$50,000 / year", level: "PhD", eligibility: "Academic excellence, research potential" },
  { id: "aus-awards", name: "Australia Awards", country: "Australia", amount: "Full tuition + stipend", level: "Master's / PhD", eligibility: "Selected country nationals, development focus" },
  { id: "fulbright", name: "Fulbright Foreign Student", country: "USA", amount: "Full tuition + living", level: "Master's / PhD", eligibility: "Academic merit + leadership" },
  { id: "governance-irl", name: "Government of Ireland Postgrad", country: "Ireland", amount: "€16,000 + fee waiver", level: "Master's / PhD", eligibility: "Academic excellence" },
];

export type University = {
  id: string;
  name: string;
  country: string;
  flag: string;
  ranking: string;
  popularFor: string;
};

export const UNIVERSITIES: University[] = [
  { id: "u1", name: "University of Oxford", country: "UK", flag: "🇬🇧", ranking: "QS #3", popularFor: "Law, PPE, Business" },
  { id: "u2", name: "University of Toronto", country: "Canada", flag: "🇨🇦", ranking: "QS #21", popularFor: "CS, Engineering, Medicine" },
  { id: "u3", name: "University of Melbourne", country: "Australia", flag: "🇦🇺", ranking: "QS #13", popularFor: "Nursing, Business, Law" },
  { id: "u4", name: "MIT", country: "USA", flag: "🇺🇸", ranking: "QS #1", popularFor: "Engineering, CS, AI" },
  { id: "u5", name: "Trinity College Dublin", country: "Ireland", flag: "🇮🇪", ranking: "QS #81", popularFor: "CS, Pharma, Business" },
  { id: "u6", name: "University of Auckland", country: "New Zealand", flag: "🇳🇿", ranking: "QS #65", popularFor: "Engineering, Nursing" },
  { id: "u7", name: "Heriot-Watt Dubai", country: "Dubai", flag: "🇦🇪", ranking: "Branch campus", popularFor: "Business, Architecture" },
  { id: "u8", name: "Imperial College London", country: "UK", flag: "🇬🇧", ranking: "QS #6", popularFor: "Engineering, Data, Medicine" },
  { id: "u9", name: "UBC", country: "Canada", flag: "🇨🇦", ranking: "QS #34", popularFor: "Forestry, CS, Business" },
  { id: "u10", name: "Stanford University", country: "USA", flag: "🇺🇸", ranking: "QS #6", popularFor: "CS, MBA, Engineering" },
];

export type CourseResult = {
  id: string;
  course: string;
  university: string;
  country: string;
  flag: string;
  city: string;
  level: string;
  tuition: string;
  scholarship: string;
  intake: string;
  duration: string;
  englishReq: string;
  deadline: string;
};

export const COURSE_RESULTS: CourseResult[] = [
  { id: "c1", course: "MSc Computer Science", university: "University of Oxford", country: "UK", flag: "🇬🇧", city: "Oxford", level: "Master's", tuition: "£32,800/yr", scholarship: "Up to 50%", intake: "Sep 2026", duration: "1 year", englishReq: "IELTS 7.5", deadline: "Jan 2026" },
  { id: "c2", course: "MEng Computer Engineering", university: "University of Toronto", country: "Canada", flag: "🇨🇦", city: "Toronto", level: "Bachelor's", tuition: "CA$58,160/yr", scholarship: "Merit 20%", intake: "Sep 2026", duration: "4 years", englishReq: "IELTS 6.5", deadline: "Jan 2026" },
  { id: "c3", course: "Master of Data Science", university: "University of Melbourne", country: "Australia", flag: "🇦🇺", city: "Melbourne", level: "Master's", tuition: "A$49,728/yr", scholarship: "Up to 25%", intake: "Feb 2026", duration: "2 years", englishReq: "IELTS 6.5", deadline: "Oct 2025" },
  { id: "c4", course: "MS Computer Science", university: "Stanford University", country: "USA", flag: "🇺🇸", city: "Stanford", level: "Master's", tuition: "$58,470/yr", scholarship: "Need-based", intake: "Fall 2026", duration: "2 years", englishReq: "TOEFL 100", deadline: "Dec 2025" },
  { id: "c5", course: "MSc Business Analytics", university: "Trinity College Dublin", country: "Ireland", flag: "🇮🇪", city: "Dublin", level: "Master's", tuition: "€24,500/yr", scholarship: "€5,000 merit", intake: "Sep 2026", duration: "1 year", englishReq: "IELTS 6.5", deadline: "May 2026" },
  { id: "c6", course: "BE Software Engineering", university: "University of Auckland", country: "New Zealand", flag: "🇳🇿", city: "Auckland", level: "Bachelor's", tuition: "NZ$48,000/yr", scholarship: "NZ$10k", intake: "Feb 2026", duration: "4 years", englishReq: "IELTS 6.0", deadline: "Dec 2025" },
  { id: "c7", course: "MBA", university: "Heriot-Watt Dubai", country: "Dubai", flag: "🇦🇪", city: "Dubai", level: "Master's", tuition: "AED 75,000/yr", scholarship: "Up to 30%", intake: "Sep 2026", duration: "1 year", englishReq: "IELTS 6.5", deadline: "Aug 2026" },
  { id: "c8", course: "MSc Cybersecurity", university: "Imperial College London", country: "UK", flag: "🇬🇧", city: "London", level: "Master's", tuition: "£41,750/yr", scholarship: "Merit 40%", intake: "Sep 2026", duration: "1 year", englishReq: "IELTS 7.0", deadline: "Jan 2026" },
  { id: "c9", course: "Master of Nursing", university: "University of Sydney", country: "Australia", flag: "🇦🇺", city: "Sydney", level: "Master's", tuition: "A$46,500/yr", scholarship: "Up to 20%", intake: "Feb 2026", duration: "2 years", englishReq: "IELTS 7.0", deadline: "Nov 2025" },
];

export const JOURNEY_STEPS = [
  { step: "01", title: "Profile & Counseling", desc: "Free 1:1 session to understand your goals, budget and target country.", icon: Users },
  { step: "02", title: "Course & University Match", desc: "AI Study Matchmaker + counselor shortlist the best-fit courses for you.", icon: GraduationCap },
  { step: "03", title: "Applications & Documents", desc: "We draft, review and submit applications with SOP, CV and transcripts.", icon: FileText },
  { step: "04", title: "Offers & Scholarships", desc: "Compare offers, negotiate scholarships and accept your preferred offer.", icon: Award },
  { step: "05", title: "Visa & Financials", desc: "Complete visa documentation, financial proof and interview prep.", icon: ShieldCheck },
  { step: "06", title: "Pre-Departure & Fly", desc: "Accommodation, airport pickup, SIM, banking and you're ready to fly.", icon: PlaneTakeoff },
];

export const TRUST_STATS = [
  { label: "Students Guided", value: "12,500+", icon: Users },
  { label: "University Options", value: "4,000+", icon: Building2 },
  { label: "Countries", value: "7", icon: MapPin },
  { label: "Visa Success", value: "97%", icon: ShieldCheck },
];

// CRM KPIs (admin/examiner/staff only — never shown to students)
export const CRM_KPIS = [
  { label: "New Leads", value: "284", delta: "+18%", trend: "up", icon: Users, color: "blue" },
  { label: "Active Students", value: "1,924", delta: "+7%", trend: "up", icon: GraduationCap, color: "orange" },
  { label: "Applications", value: "642", delta: "+12%", trend: "up", icon: FileText, color: "blue" },
  { label: "Offers", value: "318", delta: "+22%", trend: "up", icon: Award, color: "orange" },
];

export const CRM_PIPELINE = [
  { stage: "New Lead", count: 284, color: "#0057B8", items: ["Tania I. — UK MSc", "Arif R. — Canada BSc", "Nadia K. — AUS Nursing"] },
  { stage: "Counseling", count: 162, color: "#0B63CE", items: ["Rakib H. — USA MS CS", "Sadia M. — IRL MSc", "Tofazzal H. — NZ BE"] },
  { stage: "Application", count: 98, color: "#F59E0B", items: ["Mitu R. — UK MBA", "Hasan A. — CAN MEng"] },
  { stage: "Offer", count: 54, color: "#16A34A", items: ["Nusrat J. — AUS MN", "Imran S. — USA MS"] },
  { stage: "Visa", count: 31, color: "#E8501A", items: ["Sabbir A. — UK Visa", "Lamia B. — CAN Visa"] },
  { stage: "Enrolled", count: 27, color: "#0B1F3A", items: ["Farhan R. — UK", "Jerin M. — CAN"] },
];

export const STUDENT_PORTAL_NAV = [
  { group: "My Portal", items: ["Dashboard", "Profile Overview", "My Applications", "Documents Hub", "Appointments & Booking", "Messages Chat", "Payments & Billing", "Helpdesk & Support", "Settings"] },
  { group: "AI Tools", items: ["AI SOP Writer", "AI CV Auditor", "AI Credibility Practice", "Visa Prep Hub", "AI Career Path Planner"] },
  { group: "Explore", items: ["Course Finder", "Saved Courses", "Compare Courses", "AI Study Matchmaker", "IELTS Prep Courses", "IELTS Full Mock Tests"] },
];

export const PARTNER_PORTAL_NAV = [
  { group: "Partner", items: ["Dashboard", "Leads", "Students", "Applications", "Reports", "Course Finder"] },
];
