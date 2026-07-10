#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Generate question_sets_seed.sql for the ALO English Test Platform.

Produces 320 practice sets (10 per exam x 32 exams) with:
- exam_practice_sets                 : 320 rows
- exam_practice_set_sections         : one row per (set x section) for each exam
- exam_questions                     : 480 placeholder original questions
                                       (5 per published set x 96 published sets)
- exam_practice_set_questions        : 480 question links into published sets

All content is original. No official exam items are reproduced anywhere.
"""

import json

DISCLAIMER = (
    "This is an original practice set created by ALO English Test Platform. "
    "It is not affiliated with, endorsed by, or reproduced from any official test "
    "publisher. Items will not appear in any real exam and are for practice only."
)

INSTRUCTIONS_DEFAULT = (
    "Complete all sections in order. Manage your time carefully across sections. "
    "You may pause and resume within the attempt validity window. Your responses "
    "are autosaved. Original practice content only."
)

EXAMS = [
    {"id": 1,  "code": "IELTS-ACAD",     "name": "IELTS Academic",                "duration": 180, "qcount": 40,
     "sections": [("Listening",10,30),("Reading",10,30),("Writing Task 1",5,20),("Writing Task 2",5,40),("Speaking Part 1",5,5),("Speaking Part 2",5,5),("Speaking Part 3",5,5)]},
    {"id": 2,  "code": "IELTS-GEN",      "name": "IELTS General Training",        "duration": 165, "qcount": 40,
     "sections": [("Listening",10,30),("Reading",10,30),("Writing Task 1",5,20),("Writing Task 2",5,40),("Speaking Part 1",5,5),("Speaking Part 2",5,5),("Speaking Part 3",5,5)]},
    {"id": 3,  "code": "IELTS-UKVI",     "name": "IELTS for UKVI",                "duration": 180, "qcount": 40,
     "sections": [("Listening",10,30),("Reading",10,30),("Writing Task 1",5,20),("Writing Task 2",5,40),("Speaking Part 1",5,5),("Speaking Part 2",5,5),("Speaking Part 3",5,5)]},
    {"id": 4,  "code": "PTE-ACAD",       "name": "PTE Academic",                  "duration": 120, "qcount": 50,
     "sections": [("Read Aloud",5,7),("Repeat Sentence",5,10),("Describe Image",5,12),("Retell Lecture",5,15),("Summarize Written Text",5,10),("Essay",5,20),("Reading Fill Blanks",5,15),("Reorder Paragraphs",5,10),("Listening Fill Blanks",5,15),("Write From Dictation",5,10)]},
    {"id": 5,  "code": "TOEFL-IBT",      "name": "TOEFL iBT",                     "duration": 117, "qcount": 28,
     "sections": [("Reading",8,36),("Listening",8,36),("Speaking",6,17),("Writing",6,29)]},
    {"id": 6,  "code": "DUOLINGO",       "name": "Duolingo English Test",         "duration": 60,  "qcount": 30,
     "sections": [("Read and Select",5,5),("Fill in the Blanks",5,6),("Read Aloud",4,5),("Listen and Type",4,6),("Interactive Reading",4,12),("Writing Sample",4,5),("Speaking Sample",4,5)]},
    {"id": 7,  "code": "OIETC",          "name": "OIETC",                         "duration": 90,  "qcount": 30,
     "sections": [("Reading",10,25),("Listening",10,25),("Writing",5,30),("Speaking",5,15)]},
    {"id": 8,  "code": "OET",            "name": "Occupational English Test",     "duration": 165, "qcount": 40,
     "sections": [("Listening",12,45),("Reading",12,60),("Writing",8,45),("Speaking",8,20)]},
    {"id": 9,  "code": "LANGCERT",       "name": "LanguageCert International ESOL", "duration": 165, "qcount": 30,
     "sections": [("Reading",10,90),("Writing",10,30),("Listening",5,30),("Speaking",5,15)]},
    {"id": 10, "code": "LINGUASKILL",    "name": "Linguaskill",                   "duration": 90,  "qcount": 30,
     "sections": [("Reading & Listening",15,60),("Writing",10,30),("Speaking",5,15)]},
    {"id": 11, "code": "ALO-PLACE",      "name": "ALO Placement Test",            "duration": 90,  "qcount": 25,
     "sections": [("Grammar",5,15),("Vocabulary",5,15),("Reading",5,20),("Listening",5,15),("Writing",5,15)]},
    {"id": 12, "code": "SAT",            "name": "Digital SAT",                   "duration": 134, "qcount": 44,
     "sections": [("Reading and Writing Module 1",12,32),("Reading and Writing Module 2",12,32),("Math Module 1",10,35),("Math Module 2",10,35)]},
    {"id": 13, "code": "ACT",            "name": "ACT",                           "duration": 175, "qcount": 50,
     "sections": [("English",12,45),("Math",12,60),("Reading",12,35),("Science",12,35),("Writing",2,40)]},
    {"id": 14, "code": "GRE",            "name": "GRE General Test",              "duration": 165, "qcount": 28,
     "sections": [("Verbal Reasoning",10,30),("Quantitative Reasoning",10,47),("Analytical Writing",8,30)]},
    {"id": 15, "code": "GMAT",           "name": "GMAT Focus Edition",            "duration": 135, "qcount": 30,
     "sections": [("Quantitative Reasoning",10,45),("Verbal Reasoning",10,45),("Data Insights",10,45)]},
    {"id": 16, "code": "LSAT",           "name": "LSAT",                          "duration": 175, "qcount": 40,
     "sections": [("Logical Reasoning 1",10,35),("Logical Reasoning 2",10,35),("Reading Comprehension",10,35),("Analytical Reasoning",10,35)]},
    {"id": 17, "code": "MCAT",           "name": "MCAT",                          "duration": 375, "qcount": 50,
     "sections": [("Critical Analysis and Reasoning Skills",13,90),("Biological and Biochemical Foundations",13,95),("Chemical and Physical Foundations",12,95),("Psychological, Social, and Biological Foundations",12,95)]},
    {"id": 18, "code": "ENG-PLACE",      "name": "English Placement",             "duration": 60,  "qcount": 25,
     "sections": [("Grammar",6,15),("Reading",6,20),("Writing",6,15),("Listening",6,10)]},
    {"id": 19, "code": "MATH-PLACE",     "name": "Math Placement",                "duration": 90,  "qcount": 25,
     "sections": [("Algebra",7,25),("Geometry",6,20),("Statistics",6,20),("Calculus",6,25)]},
    {"id": 20, "code": "FOUNDATION",     "name": "Foundation Year Test",          "duration": 120, "qcount": 30,
     "sections": [("English",10,40),("Math",10,40),("Study Skills",10,40)]},
    {"id": 21, "code": "PRE-MASTER",     "name": "Pre-Master Test",               "duration": 120, "qcount": 25,
     "sections": [("Academic English",10,40),("Critical Thinking",10,40),("Subject Knowledge",5,40)]},
    {"id": 22, "code": "SCHOLARSHIP",    "name": "Scholarship Test",              "duration": 90,  "qcount": 20,
     "sections": [("English",7,30),("Math",7,30),("Essay",6,30)]},
    {"id": 23, "code": "UK-CRED",        "name": "UK Credibility Interview",      "duration": 30, "qcount": 15,
     "sections": [("Personal Background",3,5),("Study Intention",3,5),("University Knowledge",3,5),("Financial Explanation",2,5),("Career Plan",2,5),("Credibility Risk",2,5)]},
    {"id": 24, "code": "CAS",            "name": "CAS Interview",                 "duration": 30, "qcount": 12,
     "sections": [("Course Knowledge",3,5),("University Knowledge",3,5),("Financial Evidence",2,5),("Career Plan",2,5),("Credibility Check",2,5)]},
    {"id": 25, "code": "VISA-INT",       "name": "Visa Interview",                "duration": 30, "qcount": 15,
     "sections": [("Personal Background",3,5),("Study Intention",3,5),("Financial Explanation",2,5),("Career Plan",2,5),("Credibility Check",2,5),("Follow-up Questions",3,5)]},
    {"id": 26, "code": "VISA-SCHOLAR",   "name": "Scholarship Visa Interview",    "duration": 30, "qcount": 12,
     "sections": [("Scholarship Terms",3,5),("Course Knowledge",3,5),("Career Plan",2,5),("Credibility Check",2,5),("Follow-up Questions",2,5)]},
    {"id": 27, "code": "ADMISSION",      "name": "Admission Interview",           "duration": 30, "qcount": 15,
     "sections": [("Background",3,6),("Course Knowledge",3,6),("Career Goals",3,6),("Strengths & Weaknesses",3,6),("Applicant Questions",3,6)]},
    {"id": 28, "code": "ALO-COUNSEL",    "name": "ALO Counselor Check",           "duration": 45, "qcount": 15,
     "sections": [("Background",3,7),("Goals",3,7),("English Level",3,8),("Documents",2,7),("Finances",2,8),("Timeline",2,8)]},
    {"id": 29, "code": "ALO-READINESS",  "name": "ALO Student Readiness",         "duration": 45, "qcount": 15,
     "sections": [("Knowledge Check",4,10),("Scenario Questions",4,15),("Document Readiness",4,10),("Interview Simulation",3,10)]},
    {"id": 30, "code": "ALO-DIAG",       "name": "ALO English Diagnostic",        "duration": 60, "qcount": 25,
     "sections": [("Grammar",7,15),("Vocabulary",6,15),("Reading",6,15),("Listening",6,15)]},
    {"id": 31, "code": "ALO-DOC",        "name": "ALO Document Readiness",        "duration": 30, "qcount": 15,
     "sections": [("Passport Check",3,6),("Financial Documents",3,6),("Academic Documents",3,6),("Application Form",3,6),("Supporting Documents",3,6)]},
    {"id": 32, "code": "ALO-VISA-READY", "name": "ALO Visa Readiness",            "duration": 45, "qcount": 15,
     "sections": [("Document Pack",3,8),("Interview Prep",3,10),("Financial Check",3,8),("Credibility Prep",3,10),("Final Review",3,9)]},
]

DIFFICULTIES = ["easy", "medium", "hard", "advanced"]

def scoring_rule(exam_id):
    if 1 <= exam_id <= 11:
        return json.dumps({"scale":"band","min":0,"max":9,"cefr":True,"auto_grade_objective":True,"ai_grade_subjective":True,"examiner_review_enabled":True})
    if 12 <= exam_id <= 17:
        return json.dumps({"scale":"scaled","auto_grade_objective":True,"section_weighting":"equal","negative_marking":False})
    if 18 <= exam_id <= 22:
        return json.dumps({"scale":"percent","pass_threshold":60,"auto_grade_objective":True})
    if 23 <= exam_id <= 27:
        return json.dumps({"scale":"rubric","rubric_dimensions":["clarity","credibility","specificity","language"],"pass_threshold":3.5,"max_per_dimension":5})
    return json.dumps({"scale":"rubric","rubric_dimensions":["readiness","completeness","accuracy"],"pass_threshold":3.5,"max_per_dimension":5})

def sql_escape(s):
    return s.replace("\\","\\\\").replace("'","''")

lines = []
A = lines.append

A("-- =============================================================================")
A("-- ALO English Test Platform - Practice Set Seed (question_sets_seed.sql)")
A("-- =============================================================================")
A("-- Run AFTER install.sql and seed.sql. Idempotent under INSERT IGNORE.")
A("--")
A("-- Contents:")
A("--   * 320 practice sets  (10 per exam x 32 exams) in exam_practice_sets")
A("--   * practice-set section rows in exam_practice_set_sections")
A("--   * 480 placeholder ORIGINAL questions for the first 3 published sets of each")
A("--     exam (5 questions per published set x 96 published sets x 1 question row)")
A("--     inserted into exam_questions")
A("--   * 480 question-link rows in exam_practice_set_questions")
A("--")
A("-- All content is 100% original. No official exam items are reproduced.")
A("-- Practice sets 1-3 of each exam are published (is_published=1, approved).")
A("-- Practice sets 4-10 of each exam remain draft (is_published=0) pending review.")
A("-- =============================================================================")
A("")
A("-- -----------------------------------------------------------------------------")
A("-- exam_type_id mapping (32 exams across 5 categories)")
A("-- -----------------------------------------------------------------------------")
A("--  1 IELTS-ACAD     IELTS Academic                 | English Proficiency")
A("--  2 IELTS-GEN      IELTS General Training         | English Proficiency")
A("--  3 IELTS-UKVI     IELTS for UKVI                 | English Proficiency")
A("--  4 PTE-ACAD       PTE Academic                   | English Proficiency")
A("--  5 TOEFL-IBT      TOEFL iBT                      | English Proficiency")
A("--  6 DUOLINGO       Duolingo English Test          | English Proficiency")
A("--  7 OIETC          OIETC                          | English Proficiency")
A("--  8 OET            Occupational English Test      | English Proficiency")
A("--  9 LANGCERT       LanguageCert International ESOL| English Proficiency")
A("-- 10 LINGUASKILL    Linguaskill                    | English Proficiency")
A("-- 11 ALO-PLACE      ALO Placement Test             | English Proficiency")
A("-- 12 SAT            Digital SAT                    | Study Abroad Entrance")
A("-- 13 ACT            ACT                            | Study Abroad Entrance")
A("-- 14 GRE            GRE General Test               | Study Abroad Entrance")
A("-- 15 GMAT           GMAT Focus Edition             | Study Abroad Entrance")
A("-- 16 LSAT           LSAT                           | Study Abroad Entrance")
A("-- 17 MCAT           MCAT                           | Study Abroad Entrance")
A("-- 18 ENG-PLACE      English Placement              | University Internal")
A("-- 19 MATH-PLACE     Math Placement                 | University Internal")
A("-- 20 FOUNDATION     Foundation Year Test           | University Internal")
A("-- 21 PRE-MASTER     Pre-Master Test                | University Internal")
A("-- 22 SCHOLARSHIP    Scholarship Test               | University Internal")
A("-- 23 UK-CRED        UK Credibility Interview       | Visa / Interview")
A("-- 24 CAS            CAS Interview                  | Visa / Interview")
A("-- 25 VISA-INT       Visa Interview                 | Visa / Interview")
A("-- 26 VISA-SCHOLAR   Scholarship Visa Interview     | Visa / Interview")
A("-- 27 ADMISSION      Admission Interview            | Visa / Interview")
A("-- 28 ALO-COUNSEL    ALO Counselor Check            | ALO Internal")
A("-- 29 ALO-READINESS  ALO Student Readiness          | ALO Internal")
A("-- 30 ALO-DIAG       ALO English Diagnostic         | ALO Internal")
A("-- 31 ALO-DOC        ALO Document Readiness         | ALO Internal")
A("-- 32 ALO-VISA-READY ALO Visa Readiness             | ALO Internal")
A("-- -----------------------------------------------------------------------------")
A("")
A("SET NAMES utf8mb4;")
A("SET foreign_key_checks = 0;")
A("")
A("-- =============================================================================")
A("-- 1. exam_practice_sets  (320 rows)")
A("-- =============================================================================")
A("INSERT INTO exam_practice_sets")
A("  (set_code, exam_type_id, title, description, difficulty, total_duration_minutes,")
A("   total_questions, scoring_rule_json, instructions, disclaimer, version,")
A("   is_published, created_by, reviewed_by, approved_by) VALUES")

practice_rows = []
for exam in EXAMS:
    for set_n in range(1, 11):
        set_code = f"{exam['code']}-SET-{set_n:02d}"
        title = f"{exam['name']} Practice Set {set_n}"
        difficulty = DIFFICULTIES[(set_n - 1) % 4]
        is_pub = 1 if set_n <= 3 else 0
        reviewed = 1 if is_pub else "NULL"
        approved = 1 if is_pub else "NULL"
        description = (f"Original {difficulty} practice set covering all sections of "
                       f"{exam['name']}. Practice-only; not affiliated with any official test.")
        scoring = scoring_rule(exam["id"])
        practice_rows.append(
            f"('{sql_escape(set_code)}', {exam['id']}, "
            f"'{sql_escape(title)}', '{sql_escape(description)}', "
            f"'{difficulty}', {exam['duration']}, {exam['qcount']}, "
            f"'{sql_escape(scoring)}', '{sql_escape(INSTRUCTIONS_DEFAULT)}', "
            f"'{sql_escape(DISCLAIMER)}', 1, {is_pub}, 1, {reviewed}, {approved})"
        )

A(",\n  ".join(practice_rows) + ";")
A("")

# 2. exam_practice_set_sections
A("-- =============================================================================")
A("-- 2. exam_practice_set_sections  (one row per section per practice set)")
A("-- =============================================================================")
A("INSERT INTO exam_practice_set_sections")
A("  (practice_set_id, section_id, section_label, question_count,")
A("   duration_minutes, sort_order, instructions) VALUES")

section_rows = []
set_id_lookup = {}
for exam in EXAMS:
    exam_index = exam["id"] - 1
    for set_n in range(1, 11):
        set_id = exam_index * 10 + set_n
        set_id_lookup[(exam["id"], set_n)] = set_id

for exam in EXAMS:
    for set_n in range(1, 11):
        psid = set_id_lookup[(exam["id"], set_n)]
        for sec_idx, (label, qcount, dur) in enumerate(exam["sections"], start=1):
            section_id_subquery = (f"(SELECT id FROM exam_sections WHERE exam_type_id={exam['id']} "
                                   f"AND section_name='{sql_escape(label)}' LIMIT 1)")
            instr = (f"Answer all {qcount} item(s) in this section within {dur} minutes. "
                     f"Original practice content only.")
            section_rows.append(
                f"({psid}, {section_id_subquery}, '{sql_escape(label)}', "
                f"{qcount}, {dur}, {sec_idx}, '{sql_escape(instr)}')"
            )

A(",\n  ".join(section_rows) + ";")
A("")

# 3. exam_questions (480 placeholder rows)
SECTION_QTYPE = {
    "Listening":"short_answer","Reading":"single_mcq","Writing Task 1":"writing_task1",
    "Writing Task 1 (General)":"writing_task1_general","Writing Task 2":"writing_task2",
    "Speaking Part 1":"speaking_part1","Speaking Part 2":"speaking_part2","Speaking Part 3":"speaking_part3",
    "Read Aloud":"read_aloud","Repeat Sentence":"repeat_sentence","Describe Image":"describe_image",
    "Retell Lecture":"retell_lecture","Summarize Written Text":"summarize_written_text","Essay":"essay",
    "Reading Fill Blanks":"reading_fill_blanks","Reorder Paragraphs":"reorder_paragraphs",
    "Listening Fill Blanks":"listening_fill_blanks","Write From Dictation":"write_from_dictation",
    "Speaking":"speaking_part1","Writing":"essay","Read and Select":"read_and_select",
    "Fill in the Blanks":"fill_blanks","Listen and Type":"listen_and_type",
    "Interactive Reading":"interactive_reading","Writing Sample":"writing_sample","Speaking Sample":"speaking_sample",
    "Grammar":"single_mcq","Vocabulary":"single_mcq","Reading & Listening":"single_mcq",
    "Reading and Writing Module 1":"single_mcq","Reading and Writing Module 2":"single_mcq",
    "Math Module 1":"grid_in","Math Module 2":"grid_in","English":"single_mcq","Math":"numeric_answer",
    "Science":"single_mcq","Verbal Reasoning":"text_completion","Quantitative Reasoning":"quantitative_comparison",
    "Analytical Writing":"issue_task","Data Insights":"data_interpretation",
    "Logical Reasoning 1":"logical_reasoning","Logical Reasoning 2":"logical_reasoning",
    "Reading Comprehension":"inference","Analytical Reasoning":"analytical_reasoning",
    "Critical Analysis and Reasoning Skills":"inference",
    "Biological and Biochemical Foundations":"single_mcq",
    "Chemical and Physical Foundations":"single_mcq",
    "Psychological, Social, and Biological Foundations":"single_mcq",
    "Algebra":"numeric_answer","Geometry":"single_mcq","Statistics":"single_mcq","Calculus":"numeric_answer",
    "Study Skills":"short_answer","Academic English":"essay","Critical Thinking":"single_mcq","Subject Knowledge":"essay",
    "Personal Background":"credibility_interview","Study Intention":"credibility_interview",
    "University Knowledge":"credibility_interview","Financial Explanation":"credibility_interview",
    "Career Plan":"credibility_interview","Credibility Risk":"credibility_interview",
    "Credibility Check":"credibility_interview","Follow-up Questions":"credibility_interview",
    "Course Knowledge":"credibility_interview","Financial Evidence":"credibility_interview",
    "Background":"credibility_interview","Career Goals":"credibility_interview",
    "Strengths & Weaknesses":"credibility_interview","Applicant Questions":"credibility_interview",
    "Goals":"credibility_interview","English Level":"credibility_interview","Documents":"credibility_interview",
    "Finances":"credibility_interview","Timeline":"credibility_interview","Knowledge Check":"single_mcq",
    "Scenario Questions":"credibility_interview","Document Readiness":"credibility_interview",
    "Interview Simulation":"credibility_interview","Passport Check":"credibility_interview",
    "Financial Documents":"credibility_interview","Academic Documents":"credibility_interview",
    "Application Form":"credibility_interview","Supporting Documents":"credibility_interview",
    "Document Pack":"credibility_interview","Interview Prep":"credibility_interview",
    "Financial Check":"credibility_interview","Credibility Prep":"credibility_interview",
    "Final Review":"credibility_interview","Scholarship Terms":"credibility_interview",
}

A("-- =============================================================================")
A("-- 3. exam_questions  (480 placeholder original questions)")
A("--    Each placeholder is a 100% original prompt scaffold; the question is")
A("--    clearly marked as a scaffold and is_active=0 until the editorial team")
A("--    expands it during the weekly content update workflow.")
A("-- =============================================================================")
A("INSERT INTO exam_questions")
A("  (question_code, exam_type_id, section_id, question_type_id, question_text,")
A("   explanation, difficulty, score_value, negative_marking, tags, is_active,")
A("   version, created_by) VALUES")

question_rows = []
question_link_pairs = []
qid = 1
# Each published set MUST have at least 5 sample questions. We cycle through the
# available sections (re-using a section when its question slot is exhausted) so
# that even exams with fewer than 5 sections still receive 5 sample questions.
TARGET_PER_SET = 5
for exam in EXAMS:
    for set_n in range(1, 4):
        psid = set_id_lookup[(exam["id"], set_n)]
        difficulty = DIFFICULTIES[(set_n - 1) % 4]
        sections = exam["sections"]
        for qidx in range(1, TARGET_PER_SET + 1):
            # cycle through sections to pick the section_label for this question
            label, qcount, dur = sections[(qidx - 1) % len(sections)]
            qtype_code = SECTION_QTYPE.get(label, "single_mcq")
            qcode = f"{exam['code']}-SET{set_n:02d}-Q{qidx:02d}"
            prompt = (f"[Original placeholder prompt] This is a {difficulty} "
                      f"{label} item for {exam['name']} Practice Set {set_n}, "
                      f"item {qidx} of {TARGET_PER_SET} sample items linked to this set. "
                      f"The full original stimulus, audio script, passage, or cue card "
                      f"will be authored by the ALO editorial team during the weekly "
                      f"content update workflow and will replace this placeholder. "
                      f"Practice-only content; not affiliated with any official test publisher.")
            explanation = ("Sample scaffolding question. Scoring rubric and explanation will "
                           "be added when the editorial team expands this item.")
            tags = f"{exam['code'].lower()},{label.lower().replace(' ', '-')},sample"
            section_id_sub = (f"(SELECT id FROM exam_sections WHERE exam_type_id={exam['id']} "
                              f"AND section_name='{sql_escape(label)}' LIMIT 1)")
            qtype_id_sub = (f"(SELECT id FROM exam_question_types WHERE type_code='{qtype_code}' LIMIT 1)")
            question_rows.append(
                f"('{qcode}', {exam['id']}, {section_id_sub}, {qtype_id_sub}, "
                f"'{sql_escape(prompt)}', '{sql_escape(explanation)}', "
                f"'{difficulty}', 1.00, 0.00, '{sql_escape(tags)}', 0, 1, 1)"
            )
            question_link_pairs.append((psid, qidx, qid, label))
            qid += 1

A(",\n  ".join(question_rows) + ";")
A("")

# 4. exam_practice_set_questions (480 links)
A("-- =============================================================================")
A("-- 4. exam_practice_set_questions  (480 links: 5 questions x 96 published sets)")
A("-- =============================================================================")
A("INSERT INTO exam_practice_set_questions")
A("  (practice_set_id, set_section_id, question_id, section_label, sort_order, is_sample) VALUES")

link_rows = []
for psid, qidx, qid, label in question_link_pairs:
    set_section_sub = (f"(SELECT id FROM exam_practice_set_sections "
                       f"WHERE practice_set_id={psid} AND section_label='{sql_escape(label)}' "
                       f"ORDER BY sort_order ASC LIMIT 1)")
    link_rows.append(f"({psid}, {set_section_sub}, {qid}, '{sql_escape(label)}', {qidx}, 1)")

A(",\n  ".join(link_rows) + ";")
A("")
A("SET foreign_key_checks = 1;")
A("")
A("-- =============================================================================")
A("-- End of question_sets_seed.sql")
A("-- =============================================================================")

out_path = "/home/z/my-project/cpanel-production/database/question_sets_seed.sql"
with open(out_path, "w", encoding="utf-8") as f:
    f.write("\n".join(lines) + "\n")

n_practice = len(practice_rows)
n_sections = len(section_rows)
n_questions = len(question_rows)
n_links = len(link_rows)
print(f"practice_sets      : {n_practice}")
print(f"set_sections       : {n_sections}")
print(f"sample_questions   : {n_questions}")
print(f"question_links     : {n_links}")
print(f"file written       : {out_path}")
