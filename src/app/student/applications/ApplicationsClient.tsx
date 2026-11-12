"use client";


/**
 * src/app/student/applications/page.tsx
 *
 * Form B — Application Form (Student Portal)
 *
 * Full application with all 11 sections:
 *   A) Personal Information
 *   B) Contact Information
 *   C) Passport Details
 *   D) Education History (dynamic rows)
 *   E) English Proficiency (dynamic rows)
 *   F) Work Experience (dynamic rows, optional)
 *   G) Recommendation Letters (dynamic rows, optional)
 *   H) Visa History
 *   I) Admission Preferences (dynamic rows)
 *   J) Funding Information
 *   K) Notes
 *
 * Features:
 *   - Autosave on field change
 *   - Document upload per section
 *   - Status tracking (DRAFT → SUBMITTED → IN_REVIEW → APPROVED/REJECTED)
 *   - Counselor comments visible to student
 */

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Trash2, Save, Send, CheckCircle2, Clock, AlertCircle } from "lucide-react";

type DraftId = string | null;

type EducationEntry = {
  level: string;
  institution: string;
  city: string;
  country: string;
  board: string;
  subject: string;
  result: string;
  passingYear: string;
  startDate: string;
  endDate: string;
};

type EnglishTest = {
  testName: string;
  testDate: string;
  expirationDate: string;
  trtNumber: string;
  overallScore: string;
  listening: string;
  reading: string;
  writing: string;
  speaking: string;
};

type WorkEntry = {
  company: string;
  designation: string;
  department: string;
  startDate: string;
  endDate: string;
  currentlyWorking: boolean;
  responsibilities: string;
};

type Reference = {
  name: string;
  institution: string;
  email: string;
  phone: string;
  notes: string;
};

type AdmissionPref = {
  destination: string;
  level: string;
  courseTitle: string;
  institute: string;
  intake: string;
  priority: string;
  pathway: string;
};

export default function StudentApplicationsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const draftId = searchParams.get("draftId") as DraftId;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState<string>("DRAFT");
  const [counselorComment, setCounselorComment] = useState<string>("");
  const [savedMsg, setSavedMsg] = useState("");

  // Form state
  const [form, setForm] = useState({
    // A) Personal
    givenName: "", familyName: "", gender: "", nationality: "", dateOfBirth: "",
    maritalStatus: "", cityOfBirth: "", countryOfBirth: "", officeAddress: "",
    // B) Contact
    primaryEmail: "", altEmail: "", mobileCountryCode: "+880", mobileNumber: "",
    altCountryCode: "", altNumber: "", presentAddress: "", permanentAddress: "",
    emergencyName: "", emergencyRelation: "", emergencyCountryCode: "", emergencyNumber: "",
    // C) Passport
    hasPassport: false, passportNumber: "", placeOfIssue: "", issueDate: "", expireDate: "",
    // D) Education
    educationHistory: [] as EducationEntry[],
    // E) English
    hasEnglishTest: false, englishTests: [] as EnglishTest[],
    // F) Work
    hasWorkExperience: false, workExperience: [] as WorkEntry[],
    // G) References
    hasReferences: false, references: [] as Reference[],
    // H) Visa
    hasVisa: false, visaHistory: "", hasVisaRefusal: false, visaRefusalDetails: "",
    hasImmigrationHistory: false, immigrationDetails: "",
    hasMedicalCondition: false, medicalDetails: "",
    hasCriminalOffense: false, criminalDetails: "",
    // I) Admission
    admissionPreferences: [] as AdmissionPref[],
    // J) Funding
    fundingStatus: "", sponsor: "", sourceOfFund: "",
    // K) Notes
    notes: "",
  });

  useEffect(() => {
    if (draftId) {
      fetch(`/api/applications/my?draftId=${draftId}`)
        .then((r) => r.json())
        .then((d) => {
          if (d.success && d.data.application?.formB) {
            const fb = d.data.application.formB;
            setForm({
              ...form,
              givenName: fb.givenName || "",
              familyName: fb.familyName || "",
              primaryEmail: fb.primaryEmail || "",
              mobileNumber: fb.mobileNumber || "",
              hasPassport: fb.hasPassport || false,
              educationHistory: fb.educationHistory ? JSON.parse(fb.educationHistory) : [],
              englishTests: fb.englishTests ? JSON.parse(fb.englishTests) : [],
              workExperience: fb.workExperience ? JSON.parse(fb.workExperience) : [],
              references: fb.references ? JSON.parse(fb.references) : [],
              admissionPreferences: fb.admissionPreferences ? JSON.parse(fb.admissionPreferences) : [],
            });
            setStatus(d.data.application.status);
            setCounselorComment(fb.counselorComment || "");
          }
        })
        .catch(() => {})
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [draftId]);

  // Autosave (debounced)
  useEffect(() => {
    if (!draftId || loading) return;
    const timer = setTimeout(() => {
      saveForm(false);
    }, 2000);
    return () => clearTimeout(timer);
  }, [form]);

  const saveForm = async (isSubmit: boolean) => {
    if (!draftId) return;
    if (isSubmit) {
      setSubmitting(true);
    } else {
      setSaving(true);
    }

    try {
      const res = await fetch("/api/applications/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          draftId,
          ...form,
          educationHistory: JSON.stringify(form.educationHistory),
          englishTests: JSON.stringify(form.englishTests),
          workExperience: JSON.stringify(form.workExperience),
          references: JSON.stringify(form.references),
          admissionPreferences: JSON.stringify(form.admissionPreferences),
          submit: isSubmit,
        }),
      });
      const data = await res.json();
      if (data.success) {
        if (isSubmit) {
          setStatus("IN_REVIEW");
          setSavedMsg("Application submitted successfully!");
        } else {
          setSavedMsg("Progress saved");
        }
        setTimeout(() => setSavedMsg(""), 3000);
      }
    } catch {
      setSavedMsg("Error saving. Please try again.");
    } finally {
      setSaving(false);
      setSubmitting(false);
    }
  };

  // Dynamic row helpers
  const addEducation = () => setForm({
    ...form,
    educationHistory: [...form.educationHistory, { level: "", institution: "", city: "", country: "", board: "", subject: "", result: "", passingYear: "", startDate: "", endDate: "" }],
  });
  const removeEducation = (i: number) => setForm({ ...form, educationHistory: form.educationHistory.filter((_, idx) => idx !== i) });
  const updateEducation = (i: number, field: keyof EducationEntry, value: string) => setForm({
    ...form,
    educationHistory: form.educationHistory.map((e, idx) => idx === i ? { ...e, [field]: value } : e),
  });

  const addEnglishTest = () => setForm({
    ...form,
    englishTests: [...form.englishTests, { testName: "IELTS", testDate: "", expirationDate: "", trtNumber: "", overallScore: "", listening: "", reading: "", writing: "", speaking: "" }],
  });
  const removeEnglishTest = (i: number) => setForm({ ...form, englishTests: form.englishTests.filter((_, idx) => idx !== i) });
  const updateEnglishTest = (i: number, field: keyof EnglishTest, value: string) => setForm({
    ...form,
    englishTests: form.englishTests.map((e, idx) => idx === i ? { ...e, [field]: value } : e),
  });

  const addWork = () => setForm({
    ...form,
    workExperience: [...form.workExperience, { company: "", designation: "", department: "", startDate: "", endDate: "", currentlyWorking: false, responsibilities: "" }],
  });
  const removeWork = (i: number) => setForm({ ...form, workExperience: form.workExperience.filter((_, idx) => idx !== i) });
  const updateWork = (i: number, field: keyof WorkEntry, value: string | boolean) => setForm({
    ...form,
    workExperience: form.workExperience.map((e, idx) => idx === i ? { ...e, [field]: value } : e),
  });

  const addReference = () => setForm({
    ...form,
    references: [...form.references, { name: "", institution: "", email: "", phone: "", notes: "" }],
  });
  const removeReference = (i: number) => setForm({ ...form, references: form.references.filter((_, idx) => idx !== i) });
  const updateReference = (i: number, field: keyof Reference, value: string) => setForm({
    ...form,
    references: form.references.map((e, idx) => idx === i ? { ...e, [field]: value } : e),
  });

  const addPref = () => setForm({
    ...form,
    admissionPreferences: [...form.admissionPreferences, { destination: "", level: "", courseTitle: "", institute: "", intake: "", priority: "", pathway: "" }],
  });
  const removePref = (i: number) => setForm({ ...form, admissionPreferences: form.admissionPreferences.filter((_, idx) => idx !== i) });
  const updatePref = (i: number, field: keyof AdmissionPref, value: string) => setForm({
    ...form,
    admissionPreferences: form.admissionPreferences.map((e, idx) => idx === i ? { ...e, [field]: value } : e),
  });

  if (loading) {
    return <div className="mx-auto max-w-4xl px-4 py-12 text-center text-slate-400">Loading application...</div>;
  }

  if (!draftId) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-12 text-center">
        <h1 className="text-2xl font-bold mb-4">My Applications</h1>
        <p className="text-slate-500 mb-4">You have no active applications.</p>
        <a href="/course-finder" className="text-orange-600 hover:underline">Browse courses to apply →</a>
      </div>
    );
  }

  const inputClass = "w-full rounded-md border border-slate-300 px-3 py-2 text-sm";
  const labelClass = "block text-sm font-medium text-slate-700 mb-1";

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Application Form</h1>
        <div className="flex items-center gap-2">
          {status === "DRAFT" && <span className="flex items-center gap-1 rounded-full bg-amber-50 px-3 py-1 text-xs font-medium text-amber-700"><Clock className="h-3 w-3" /> Draft</span>}
          {status === "IN_REVIEW" && <span className="flex items-center gap-1 rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700"><Clock className="h-3 w-3" /> In Review</span>}
          {status === "APPROVED" && <span className="flex items-center gap-1 rounded-full bg-green-50 px-3 py-1 text-xs font-medium text-green-700"><CheckCircle2 className="h-3 w-3" /> Approved</span>}
          {status === "REJECTED" && <span className="flex items-center gap-1 rounded-full bg-red-50 px-3 py-1 text-xs font-medium text-red-700"><AlertCircle className="h-3 w-3" /> Rejected</span>}
        </div>
      </div>

      {savedMsg && <div className="mb-4 rounded-md bg-green-50 border border-green-200 p-2 text-sm text-green-700">{savedMsg}</div>}

      {/* Counselor Comment */}
      {counselorComment && (
        <div className="mb-4 rounded-md bg-blue-50 border border-blue-200 p-3 text-sm">
          <p className="font-semibold text-blue-900">Counselor Comment:</p>
          <p className="text-blue-700">{counselorComment}</p>
        </div>
      )}

      {/* A) Personal Information */}
      <Card className="mb-4">
        <CardHeader><CardTitle className="text-base">A) Personal Information</CardTitle></CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2">
          <div><label className={labelClass}>Given Name (First Name) *</label><input className={inputClass} value={form.givenName} onChange={(e) => setForm({ ...form, givenName: e.target.value })} /></div>
          <div><label className={labelClass}>Family Name (Last Name) *</label><input className={inputClass} value={form.familyName} onChange={(e) => setForm({ ...form, familyName: e.target.value })} /></div>
          <div><label className={labelClass}>Gender</label><select className={inputClass} value={form.gender} onChange={(e) => setForm({ ...form, gender: e.target.value })}><option value="">Select</option><option>Male</option><option>Female</option><option>Other</option></select></div>
          <div><label className={labelClass}>Nationality</label><input className={inputClass} value={form.nationality} onChange={(e) => setForm({ ...form, nationality: e.target.value })} /></div>
          <div><label className={labelClass}>Date of Birth</label><input type="date" className={inputClass} value={form.dateOfBirth} onChange={(e) => setForm({ ...form, dateOfBirth: e.target.value })} /></div>
          <div><label className={labelClass}>Marital Status</label><select className={inputClass} value={form.maritalStatus} onChange={(e) => setForm({ ...form, maritalStatus: e.target.value })}><option value="">Select</option><option>Single</option><option>Married</option></select></div>
          <div><label className={labelClass}>City of Birth</label><input className={inputClass} value={form.cityOfBirth} onChange={(e) => setForm({ ...form, cityOfBirth: e.target.value })} /></div>
          <div><label className={labelClass}>Country of Birth</label><input className={inputClass} value={form.countryOfBirth} onChange={(e) => setForm({ ...form, countryOfBirth: e.target.value })} /></div>
        </CardContent>
      </Card>

      {/* B) Contact Information */}
      <Card className="mb-4">
        <CardHeader><CardTitle className="text-base">B) Contact Information</CardTitle></CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2">
          <div><label className={labelClass}>Primary Email *</label><input type="email" className={inputClass} value={form.primaryEmail} onChange={(e) => setForm({ ...form, primaryEmail: e.target.value })} /></div>
          <div><label className={labelClass}>Alternative Email</label><input type="email" className={inputClass} value={form.altEmail} onChange={(e) => setForm({ ...form, altEmail: e.target.value })} /></div>
          <div><label className={labelClass}>Mobile Number *</label><div className="flex gap-1"><input className={inputClass + " w-20"} value={form.mobileCountryCode} onChange={(e) => setForm({ ...form, mobileCountryCode: e.target.value })} /><input className={inputClass} value={form.mobileNumber} onChange={(e) => setForm({ ...form, mobileNumber: e.target.value })} /></div></div>
          <div><label className={labelClass}>Alternative Number</label><div className="flex gap-1"><input className={inputClass + " w-20"} value={form.altCountryCode} onChange={(e) => setForm({ ...form, altCountryCode: e.target.value })} /><input className={inputClass} value={form.altNumber} onChange={(e) => setForm({ ...form, altNumber: e.target.value })} /></div></div>
          <div className="sm:col-span-2"><label className={labelClass}>Present Address</label><textarea className={inputClass} rows={2} value={form.presentAddress} onChange={(e) => setForm({ ...form, presentAddress: e.target.value })} /></div>
          <div className="sm:col-span-2"><label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.permanentAddress === form.presentAddress} onChange={(e) => setForm({ ...form, permanentAddress: e.target.checked ? form.presentAddress : "" })} /> Same as present address</label></div>
          <div className="sm:col-span-2"><label className={labelClass}>Permanent Address</label><textarea className={inputClass} rows={2} value={form.permanentAddress} onChange={(e) => setForm({ ...form, permanentAddress: e.target.value })} /></div>
          <div><label className={labelClass}>Emergency Contact Name</label><input className={inputClass} value={form.emergencyName} onChange={(e) => setForm({ ...form, emergencyName: e.target.value })} /></div>
          <div><label className={labelClass}>Relation</label><input className={inputClass} value={form.emergencyRelation} onChange={(e) => setForm({ ...form, emergencyRelation: e.target.value })} /></div>
          <div><label className={labelClass}>Emergency Number</label><div className="flex gap-1"><input className={inputClass + " w-20"} value={form.emergencyCountryCode} onChange={(e) => setForm({ ...form, emergencyCountryCode: e.target.value })} /><input className={inputClass} value={form.emergencyNumber} onChange={(e) => setForm({ ...form, emergencyNumber: e.target.value })} /></div></div>
        </CardContent>
      </Card>

      {/* C) Passport Details */}
      <Card className="mb-4">
        <CardHeader><CardTitle className="text-base">C) Passport Details</CardTitle></CardHeader>
        <CardContent>
          <label className="flex items-center gap-2 mb-3 text-sm"><input type="checkbox" checked={form.hasPassport} onChange={(e) => setForm({ ...form, hasPassport: e.target.checked })} /> Do you have a passport?</label>
          {form.hasPassport && (
            <div className="grid gap-3 sm:grid-cols-2">
              <div><label className={labelClass}>Passport Number</label><input className={inputClass} value={form.passportNumber} onChange={(e) => setForm({ ...form, passportNumber: e.target.value })} /></div>
              <div><label className={labelClass}>Place of Issue</label><input className={inputClass} value={form.placeOfIssue} onChange={(e) => setForm({ ...form, placeOfIssue: e.target.value })} /></div>
              <div><label className={labelClass}>Issue Date</label><input type="date" className={inputClass} value={form.issueDate} onChange={(e) => setForm({ ...form, issueDate: e.target.value })} /></div>
              <div><label className={labelClass}>Expiry Date</label><input type="date" className={inputClass} value={form.expireDate} onChange={(e) => setForm({ ...form, expireDate: e.target.value })} /></div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* D) Education History */}
      <Card className="mb-4">
        <CardHeader><CardTitle className="text-base">D) Education History</CardTitle></CardHeader>
        <CardContent>
          {form.educationHistory.map((edu, i) => (
            <div key={i} className="mb-4 rounded-lg border border-slate-200 p-3">
              <div className="mb-2 flex items-center justify-between">
                <h4 className="text-sm font-semibold">Education #{i + 1}</h4>
                <button onClick={() => removeEducation(i)} className="text-red-500 hover:text-red-700"><Trash2 className="h-4 w-4" /></button>
              </div>
              <div className="grid gap-2 sm:grid-cols-2">
                <div><label className={labelClass}>Level</label><select className={inputClass} value={edu.level} onChange={(e) => updateEducation(i, "level", e.target.value)}><option value="">Select</option><option>SSC/O Level</option><option>HSC/A Level</option><option>Diploma</option><option>Bachelor</option><option>Master</option></select></div>
                <div><label className={labelClass}>Institution Name</label><input className={inputClass} value={edu.institution} onChange={(e) => updateEducation(i, "institution", e.target.value)} /></div>
                <div><label className={labelClass}>City/Country</label><input className={inputClass} value={edu.city} onChange={(e) => updateEducation(i, "city", e.target.value)} /></div>
                <div><label className={labelClass}>Board/University</label><input className={inputClass} value={edu.board} onChange={(e) => updateEducation(i, "board", e.target.value)} /></div>
                <div><label className={labelClass}>Subject/Major</label><input className={inputClass} value={edu.subject} onChange={(e) => updateEducation(i, "subject", e.target.value)} /></div>
                <div><label className={labelClass}>Result (GPA/%)</label><input className={inputClass} value={edu.result} onChange={(e) => updateEducation(i, "result", e.target.value)} /></div>
                <div><label className={labelClass}>Passing Year</label><input className={inputClass} value={edu.passingYear} onChange={(e) => updateEducation(i, "passingYear", e.target.value)} /></div>
                <div><label className={labelClass}>Start Date</label><input type="month" className={inputClass} value={edu.startDate} onChange={(e) => updateEducation(i, "startDate", e.target.value)} /></div>
                <div><label className={labelClass}>End Date</label><input type="month" className={inputClass} value={edu.endDate} onChange={(e) => updateEducation(i, "endDate", e.target.value)} /></div>
              </div>
            </div>
          ))}
          <button onClick={addEducation} className="flex items-center gap-1 text-sm text-orange-600 hover:underline"><Plus className="h-4 w-4" /> Add another qualification</button>
        </CardContent>
      </Card>

      {/* E) English Proficiency */}
      <Card className="mb-4">
        <CardHeader><CardTitle className="text-base">E) English Proficiency</CardTitle></CardHeader>
        <CardContent>
          <label className="flex items-center gap-2 mb-3 text-sm"><input type="checkbox" checked={form.hasEnglishTest} onChange={(e) => setForm({ ...form, hasEnglishTest: e.target.checked })} /> Do you have an English proficiency test?</label>
          {form.hasEnglishTest && form.englishTests.map((test, i) => (
            <div key={i} className="mb-4 rounded-lg border border-slate-200 p-3">
              <div className="mb-2 flex items-center justify-between">
                <h4 className="text-sm font-semibold">Test #{i + 1}</h4>
                <button onClick={() => removeEnglishTest(i)} className="text-red-500 hover:text-red-700"><Trash2 className="h-4 w-4" /></button>
              </div>
              <div className="grid gap-2 sm:grid-cols-2">
                <div><label className={labelClass}>Test Name</label><select className={inputClass} value={test.testName} onChange={(e) => updateEnglishTest(i, "testName", e.target.value)}><option>IELTS</option><option>IELTS UKVI</option><option>PTE</option><option>TOEFL</option><option>Duolingo</option><option>OIETC</option><option>GRE</option><option>GMAT</option><option>SAT</option></select></div>
                <div><label className={labelClass}>Test Date</label><input type="date" className={inputClass} value={test.testDate} onChange={(e) => updateEnglishTest(i, "testDate", e.target.value)} /></div>
                <div><label className={labelClass}>Overall Score</label><input className={inputClass} value={test.overallScore} onChange={(e) => updateEnglishTest(i, "overallScore", e.target.value)} /></div>
                <div><label className={labelClass}>TRT No / Certificate ID</label><input className={inputClass} value={test.trtNumber} onChange={(e) => updateEnglishTest(i, "trtNumber", e.target.value)} /></div>
                {(test.testName === "IELTS" || test.testName === "IELTS UKVI" || test.testName === "PTE") && (
                  <>
                    <div><label className={labelClass}>Listening</label><input className={inputClass} value={test.listening} onChange={(e) => updateEnglishTest(i, "listening", e.target.value)} /></div>
                    <div><label className={labelClass}>Reading</label><input className={inputClass} value={test.reading} onChange={(e) => updateEnglishTest(i, "reading", e.target.value)} /></div>
                    <div><label className={labelClass}>Writing</label><input className={inputClass} value={test.writing} onChange={(e) => updateEnglishTest(i, "writing", e.target.value)} /></div>
                    <div><label className={labelClass}>Speaking</label><input className={inputClass} value={test.speaking} onChange={(e) => updateEnglishTest(i, "speaking", e.target.value)} /></div>
                  </>
                )}
              </div>
            </div>
          ))}
          {form.hasEnglishTest && <button onClick={addEnglishTest} className="flex items-center gap-1 text-sm text-orange-600 hover:underline"><Plus className="h-4 w-4" /> Add another test</button>}
        </CardContent>
      </Card>

      {/* F) Work Experience */}
      <Card className="mb-4">
        <CardHeader><CardTitle className="text-base">F) Work Experience (Optional)</CardTitle></CardHeader>
        <CardContent>
          <label className="flex items-center gap-2 mb-3 text-sm"><input type="checkbox" checked={form.hasWorkExperience} onChange={(e) => setForm({ ...form, hasWorkExperience: e.target.checked })} /> Do you have work experience?</label>
          {form.hasWorkExperience && form.workExperience.map((work, i) => (
            <div key={i} className="mb-4 rounded-lg border border-slate-200 p-3">
              <div className="mb-2 flex items-center justify-between">
                <h4 className="text-sm font-semibold">Job #{i + 1}</h4>
                <button onClick={() => removeWork(i)} className="text-red-500 hover:text-red-700"><Trash2 className="h-4 w-4" /></button>
              </div>
              <div className="grid gap-2 sm:grid-cols-2">
                <div><label className={labelClass}>Company</label><input className={inputClass} value={work.company} onChange={(e) => updateWork(i, "company", e.target.value)} /></div>
                <div><label className={labelClass}>Designation</label><input className={inputClass} value={work.designation} onChange={(e) => updateWork(i, "designation", e.target.value)} /></div>
                <div><label className={labelClass}>Start Date</label><input type="month" className={inputClass} value={work.startDate} onChange={(e) => updateWork(i, "startDate", e.target.value)} /></div>
                <div><label className={labelClass}>End Date</label><input type="month" className={inputClass} value={work.endDate} onChange={(e) => updateWork(i, "endDate", e.target.value)} disabled={work.currentlyWorking} /></div>
                <div className="sm:col-span-2"><label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={work.currentlyWorking} onChange={(e) => updateWork(i, "currentlyWorking", e.target.checked)} /> Currently working here</label></div>
                <div className="sm:col-span-2"><label className={labelClass}>Responsibilities</label><textarea className={inputClass} rows={2} value={work.responsibilities} onChange={(e) => updateWork(i, "responsibilities", e.target.value)} /></div>
              </div>
            </div>
          ))}
          {form.hasWorkExperience && <button onClick={addWork} className="flex items-center gap-1 text-sm text-orange-600 hover:underline"><Plus className="h-4 w-4" /> Add another job</button>}
        </CardContent>
      </Card>

      {/* G) References */}
      <Card className="mb-4">
        <CardHeader><CardTitle className="text-base">G) Recommendation Letters (Optional)</CardTitle></CardHeader>
        <CardContent>
          <label className="flex items-center gap-2 mb-3 text-sm"><input type="checkbox" checked={form.hasReferences} onChange={(e) => setForm({ ...form, hasReferences: e.target.checked })} /> Do you have references?</label>
          {form.hasReferences && form.references.map((ref, i) => (
            <div key={i} className="mb-4 rounded-lg border border-slate-200 p-3">
              <div className="mb-2 flex items-center justify-between">
                <h4 className="text-sm font-semibold">Reference #{i + 1}</h4>
                <button onClick={() => removeReference(i)} className="text-red-500 hover:text-red-700"><Trash2 className="h-4 w-4" /></button>
              </div>
              <div className="grid gap-2 sm:grid-cols-2">
                <div><label className={labelClass}>Referee Name</label><input className={inputClass} value={ref.name} onChange={(e) => updateReference(i, "name", e.target.value)} /></div>
                <div><label className={labelClass}>Institution</label><input className={inputClass} value={ref.institution} onChange={(e) => updateReference(i, "institution", e.target.value)} /></div>
                <div><label className={labelClass}>Email</label><input type="email" className={inputClass} value={ref.email} onChange={(e) => updateReference(i, "email", e.target.value)} /></div>
                <div><label className={labelClass}>Phone</label><input className={inputClass} value={ref.phone} onChange={(e) => updateReference(i, "phone", e.target.value)} /></div>
              </div>
            </div>
          ))}
          {form.hasReferences && <button onClick={addReference} className="flex items-center gap-1 text-sm text-orange-600 hover:underline"><Plus className="h-4 w-4" /> Add another reference</button>}
        </CardContent>
      </Card>

      {/* H) Visa History */}
      <Card className="mb-4">
        <CardHeader><CardTitle className="text-base">H) Background & Visa History</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.hasVisa} onChange={(e) => setForm({ ...form, hasVisa: e.target.checked })} /> Do you have any visa?</label>
          {form.hasVisa && <textarea className={inputClass} rows={2} placeholder="Visa details..." value={form.visaHistory} onChange={(e) => setForm({ ...form, visaHistory: e.target.value })} />}
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.hasVisaRefusal} onChange={(e) => setForm({ ...form, hasVisaRefusal: e.target.checked })} /> Do you have any visa refusal?</label>
          {form.hasVisaRefusal && <textarea className={inputClass} rows={2} placeholder="Refusal details (country, date, reason)..." value={form.visaRefusalDetails} onChange={(e) => setForm({ ...form, visaRefusalDetails: e.target.value })} />}
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.hasImmigrationHistory} onChange={(e) => setForm({ ...form, hasImmigrationHistory: e.target.checked })} /> Have you applied for immigration to any country?</label>
          {form.hasImmigrationHistory && <textarea className={inputClass} rows={2} placeholder="Immigration details..." value={form.immigrationDetails} onChange={(e) => setForm({ ...form, immigrationDetails: e.target.value })} />}
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.hasMedicalCondition} onChange={(e) => setForm({ ...form, hasMedicalCondition: e.target.checked })} /> Any serious medical condition?</label>
          {form.hasMedicalCondition && <input className={inputClass} value={form.medicalDetails} onChange={(e) => setForm({ ...form, medicalDetails: e.target.value })} />}
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.hasCriminalOffense} onChange={(e) => setForm({ ...form, hasCriminalOffense: e.target.checked })} /> Any criminal offense?</label>
          {form.hasCriminalOffense && <input className={inputClass} value={form.criminalDetails} onChange={(e) => setForm({ ...form, criminalDetails: e.target.value })} />}
        </CardContent>
      </Card>

      {/* I) Admission Preferences */}
      <Card className="mb-4">
        <CardHeader><CardTitle className="text-base">I) Admission Preferences</CardTitle></CardHeader>
        <CardContent>
          {form.admissionPreferences.map((pref, i) => (
            <div key={i} className="mb-4 rounded-lg border border-slate-200 p-3">
              <div className="mb-2 flex items-center justify-between">
                <h4 className="text-sm font-semibold">Preference #{i + 1}</h4>
                <button onClick={() => removePref(i)} className="text-red-500 hover:text-red-700"><Trash2 className="h-4 w-4" /></button>
              </div>
              <div className="grid gap-2 sm:grid-cols-2">
                <div><label className={labelClass}>Study Destination</label><select className={inputClass} value={pref.destination} onChange={(e) => updatePref(i, "destination", e.target.value)}><option value="">Select</option><option>UK</option><option>Canada</option><option>Australia</option><option>USA</option><option>Ireland</option><option>New Zealand</option><option>Dubai</option></select></div>
                <div><label className={labelClass}>Study Level</label><select className={inputClass} value={pref.level} onChange={(e) => updatePref(i, "level", e.target.value)}><option value="">Select</option><option>Foundation</option><option>UG</option><option>PG</option><option>MRes</option><option>PhD</option></select></div>
                <div><label className={labelClass}>Program/Course Title</label><input className={inputClass} value={pref.courseTitle} onChange={(e) => updatePref(i, "courseTitle", e.target.value)} /></div>
                <div><label className={labelClass}>Institute Name</label><input className={inputClass} value={pref.institute} onChange={(e) => updatePref(i, "institute", e.target.value)} /></div>
                <div><label className={labelClass}>Intake</label><select className={inputClass} value={pref.intake} onChange={(e) => updatePref(i, "intake", e.target.value)}><option value="">Select</option><option>Jan 2027</option><option>May 2027</option><option>Sep 2027</option></select></div>
                <div><label className={labelClass}>Priority/Choice</label><select className={inputClass} value={pref.priority} onChange={(e) => updatePref(i, "priority", e.target.value)}><option value="">Select</option><option>1st Choice</option><option>2nd Choice</option><option>3rd Choice</option></select></div>
              </div>
            </div>
          ))}
          <button onClick={addPref} className="flex items-center gap-1 text-sm text-orange-600 hover:underline"><Plus className="h-4 w-4" /> Add another preference</button>
        </CardContent>
      </Card>

      {/* J) Funding */}
      <Card className="mb-4">
        <CardHeader><CardTitle className="text-base">J) Funding Information</CardTitle></CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-3">
          <div><label className={labelClass}>Funding Status</label><select className={inputClass} value={form.fundingStatus} onChange={(e) => setForm({ ...form, fundingStatus: e.target.value })}><option value="">Select</option><option>Self</option><option>Loan</option><option>Scholarship</option><option>Other</option></select></div>
          <div><label className={labelClass}>Sponsor</label><select className={inputClass} value={form.sponsor} onChange={(e) => setForm({ ...form, sponsor: e.target.value })}><option value="">Select</option><option>Applicant</option><option>Parents</option><option>Sibling</option><option>Dependent</option><option>Others</option></select></div>
          <div><label className={labelClass}>Source of Fund</label><input className={inputClass} value={form.sourceOfFund} onChange={(e) => setForm({ ...form, sourceOfFund: e.target.value })} /></div>
        </CardContent>
      </Card>

      {/* K) Notes */}
      <Card className="mb-4">
        <CardHeader><CardTitle className="text-base">K) Notes / Summary</CardTitle></CardHeader>
        <CardContent>
          <textarea className={inputClass} rows={3} placeholder="Any additional information..." value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="sticky bottom-0 flex items-center justify-between rounded-lg border border-slate-200 bg-white p-4 shadow-lg">
        <div className="text-sm text-slate-500">
          {saving ? "Saving..." : "Progress auto-saves every 2 seconds"}
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => saveForm(false)} disabled={saving || submitting}>
            <Save className="mr-1 h-4 w-4" /> Save
          </Button>
          {status === "DRAFT" && (
            <Button onClick={() => saveForm(true)} disabled={submitting || !form.givenName || !form.familyName || !form.primaryEmail || !form.mobileNumber} className="bg-orange-500 hover:bg-orange-600">
              <Send className="mr-1 h-4 w-4" /> {submitting ? "Submitting..." : "Submit Application"}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
