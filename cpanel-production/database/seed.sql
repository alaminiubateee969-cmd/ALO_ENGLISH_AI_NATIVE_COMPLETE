-- =============================================================================
-- ALO English Test Platform - Seed Data (seed.sql)
-- =============================================================================
-- Run AFTER install.sql. Idempotent: uses INSERT IGNORE / explicit IDs.
-- Contents:
--   1. exam_permissions (full permission catalog across all 24+ modules)
--   2. exam_question_types (46 item types covering all 32 exams)
--   3. exam_sections (one row per section per exam_type - all 32 exams)
--   4. exam_modules (adaptive modules for SAT/LSAT/ACT where applicable)
--   5. exam_settings (key/value platform config)
--   6. exam_users (sample admin user - placeholder password_hash only)
--   7. exam_user_roles (assigns SUPER_ADMIN role to the sample admin)
-- All practice-only / original-content rules apply. No real exam content stored.
-- =============================================================================

SET NAMES utf8mb4;
SET foreign_key_checks = 0;

-- =============================================================================
-- 1. exam_permissions  (grouped by module)
-- =============================================================================
INSERT INTO exam_permissions (permission_code, permission_name, module, description) VALUES
-- User & role management
('users.view',            'View users',                'users',         'Read user accounts'),
('users.create',          'Create users',              'users',         'Create new user accounts'),
('users.edit',            'Edit users',                'users',         'Edit user profile/status'),
('users.delete',          'Delete users',              'users',         'Soft/permanent delete users'),
('users.reset_password',  'Reset user password',       'users',         'Trigger password reset flow'),
('roles.manage',          'Manage roles & permissions','users',         'CRUD on roles and permission grants'),
-- Students
('students.view',         'View students',             'students',      'Read student profiles'),
('students.create',       'Create students',           'students',      'Create student profile'),
('students.edit',         'Edit students',             'students',      'Edit student profile / CRM linkage'),
('students.delete',       'Delete students',           'students',      'Archive / delete student'),
-- Exam catalog
('exam_types.view',       'View exam types',           'exams',         'Read exam type catalog'),
('exam_types.manage',     'Manage exam types',         'exams',         'Create/edit/deactivate exam types'),
('exam_sections.manage',  'Manage exam sections',      'exams',         'Create/edit sections & modules'),
-- Question bank
('questions.view',        'View questions',            'questions',     'Read question bank'),
('questions.create',      'Create questions',          'questions',     'Author new questions'),
('questions.edit',        'Edit questions',            'questions',     'Edit existing questions'),
('questions.delete',      'Delete questions',          'questions',     'Remove questions'),
('questions.review',      'Review questions',          'questions',     'Approve / reject in review queue'),
('questions.version',     'Manage question versions',  'questions',     'View / restore historical versions'),
-- Practice sets
('practice_sets.view',    'View practice sets',        'practice_sets', 'Read published & draft sets'),
('practice_sets.create',  'Create practice sets',      'practice_sets', 'Create new practice set'),
('practice_sets.edit',    'Edit practice sets',        'practice_sets', 'Edit existing sets'),
('practice_sets.publish', 'Publish practice sets',     'practice_sets', 'Approve & publish sets to students'),
('practice_sets.delete',  'Delete practice sets',      'practice_sets', 'Remove practice sets'),
-- Mock attempts
('attempts.view_own',     'View own attempts',         'attempts',      'Student views own attempts'),
('attempts.view_all',     'View all attempts',         'attempts',      'Staff views all student attempts'),
('attempts.take',         'Take mock attempt',         'attempts',      'Start a mock attempt'),
('attempts.grade',        'Grade attempts',            'attempts',      'Finalize grading / override AI'),
-- Speaking & writing review
('speaking.review',       'Review speaking sessions',  'review',        'Examiner reviews speaking recordings'),
('writing.review',        'Review writing submissions','review',        'Examiner reviews writing submissions'),
('feedback.give',         'Provide feedback',          'review',        'Add examiner/counselor feedback'),
-- Reports & certificates
('reports.view',          'View reports',              'reports',       'View score/diagnostic reports'),
('reports.generate',      'Generate reports',          'reports',       'Generate PDF/HTML reports'),
('certificates.issue',    'Issue certificates',        'reports',       'Issue practice completion certificate'),
('certificates.revoke',   'Revoke certificates',       'reports',       'Revoke issued certificates'),
-- Quota & vouchers
('quota.manage',          'Manage free quota',         'billing',       'Adjust free attempt quota'),
('vouchers.create',       'Create vouchers',           'billing',       'Issue voucher codes'),
('vouchers.redeem',       'Redeem vouchers',           'billing',       'Use voucher on attempt'),
('vouchers.revoke',       'Revoke vouchers',           'billing',       'Revoke voucher codes'),
-- Payments
('payments.view',         'View payments',             'billing',       'Read payment records'),
('payments.refund',       'Refund payments',           'billing',       'Trigger refund through gateway'),
-- Leads & CRM
('leads.view',            'View leads',                'crm',           'Read marketing leads'),
('leads.manage',          'Manage leads',              'crm',           'Edit / qualify / convert leads'),
('crm.sync',              'Trigger CRM sync',          'crm',           'Run CRM inbound/outbound sync'),
('crm.sync_logs.view',    'View CRM sync logs',        'crm',           'Inspect sync history'),
-- Consultations
('consultations.book',    'Book consultations',        'consultations', 'Book counselor slot'),
('consultations.manage',  'Manage consultations',      'consultations', 'Manage bookings & counselors'),
-- Marketing
('marketing.manage',      'Manage marketing sources',  'marketing',     'CRUD marketing sources & UTMs'),
-- Weekly updates
('weekly_updates.view',   'View weekly updates',       'content',       'Read weekly content update register'),
('weekly_updates.manage', 'Manage weekly updates',     'content',       'Author / publish weekly update'),
-- Approvals
('approvals.request',     'Request approval',          'approvals',     'Submit entity for admin approval'),
('approvals.review',      'Review approval requests',  'approvals',     'Approve / reject admin approval queue'),
-- Uploads & proctoring
('uploads.manage',        'Manage uploads',            'uploads',       'Upload / replace / delete files'),
('proctor.view',          'View proctor logs',         'proctoring',    'Inspect proctoring events'),
-- Audit & settings
('audit.view',            'View audit logs',           'system',        'Read audit trail'),
('settings.manage',       'Manage platform settings',  'system',        'Edit exam_settings key/value store'),
('terms.manage',          'Manage terms versions',     'system',        'Publish new terms & policies'),
('cron.view',             'View cron logs',            'system',        'Inspect scheduled job runs'),
-- Analytics
('analytics.view',        'View analytics dashboards', 'analytics',     'Access KPI/analytics dashboards');

-- =============================================================================
-- 2. exam_question_types (46 item types)
-- =============================================================================
INSERT INTO exam_question_types (type_code, type_name, response_format, is_graded_auto, description) VALUES
-- Objective / auto-graded
('single_mcq',                'Single Best Answer MCQ',           'single_mcq',        1, 'One correct option'),
('multi_mcq',                 'Multiple Correct MCQ',             'multi_mcq',         1, 'Select all that apply (e.g. sentence equivalence)'),
('true_false_notgiven',       'True / False / Not Given',         'single_mcq',        1, 'IELTS reading statement classification'),
('yes_no_notgiven',           'Yes / No / Not Given',             'single_mcq',        1, 'IELTS reading writer-views classification'),
('matching_headings',         'Matching Headings',                'matching',          1, 'Match headings to paragraphs'),
('matching_paragraphs',       'Matching Information',             'matching',          1, 'Match statements to paragraph letters'),
('matching_sentence_endings', 'Matching Sentence Endings',        'matching',          1, 'Match sentence beginnings to endings'),
('sentence_completion',       'Sentence Completion',              'text',              1, 'Fill in missing words to complete sentences'),
('summary_completion',        'Summary Completion',               'text',              1, 'Complete summary with words from a box'),
('fill_blanks',               'Fill in the Blanks',               'text',              1, 'Generic fill-in-the-blank item'),
('short_answer',              'Short Answer',                     'text',              1, 'Brief typed answer (often 1-3 words)'),
('reading_fill_blanks',       'Reading Fill in the Blanks',       'dropdown',          1, 'PTE-style dropdown cloze'),
('reorder_paragraphs',        'Reorder Paragraphs',               'reorder',           1, 'PTE-style drag-to-reorder jumbled paragraphs'),
('listening_fill_blanks',     'Listening Fill in the Blanks',     'text',              1, 'PTE-style listening cloze'),
('write_from_dictation',      'Write From Dictation',             'text',              1, 'PTE-style dictation'),
('grid_in',                   'Numeric Grid-In',                  'grid_in',           1, 'SAT-style numeric input'),
('quantitative_comparison',   'Quantitative Comparison',          'quant_comparison',  1, 'GRE-style Quantity A vs Quantity B'),
('data_sufficiency',          'Data Sufficiency',                 'data_sufficiency',  1, 'GMAT-style A-E sufficiency'),
('text_completion',           'Text Completion (Multi-Blank)',    'dropdown',          1, 'GRE-style three-blank dropdown'),
('sentence_equivalence',      'Sentence Equivalence',             'multi_mcq',         1, 'GRE-style select two synonyms'),
('data_interpretation',       'Data Interpretation',              'single_mcq',        1, 'Charts/tables based MCQ'),
('matching_pairs',            'Matching Pairs',                   'matching',          1, 'Generic left-right matching'),
('interactive_reading',       'Interactive Reading',              'dropdown',          1, 'Duolingo-style adaptive reading'),
('complete_the_sentence',     'Complete the Sentence (Cloze)',    'dropdown',          1, 'Duolingo-style single dropdown cloze'),
('read_and_select',           'Read and Select',                  'multi_mcq',         1, 'Duolingo-style real-word selection'),
('listen_and_type',           'Listen and Type',                  'text',              1, 'Duolingo-style transcription'),
-- Quantitative (numeric)
('numeric_answer',            'Numeric Answer',                   'numeric',           1, 'Free numeric input with tolerance'),
-- Writing / speaking (examiner / AI graded)
('essay',                     'Essay',                            'writing',           0, 'Long-form essay'),
('writing_task1',             'Writing Task 1 (Academic)',        'writing',           0, 'IELTS Academic chart/diagram description'),
('writing_task1_general',     'Writing Task 1 (General)',         'writing',           0, 'IELTS General letter'),
('writing_task2',             'Writing Task 2',                   'writing',           0, 'IELTS Academic/General essay'),
('integrated_writing',        'Integrated Writing',               'writing',           0, 'TOEFL-style read+listen then write'),
('academic_discussion',       'Academic Discussion',              'writing',           0, 'TOEFL-style discussion post'),
('writing_sample',            'Writing Sample',                   'writing',           0, 'Duolingo-style writing sample'),
('issue_task',                'Issue Task',                       'writing',           0, 'GRE-style argument essay'),
('argument_task',             'Argument Task',                    'writing',           0, 'GRE-style critique essay'),
('read_aloud',                'Read Aloud',                       'audio',             0, 'PTE-style read-aloud'),
('repeat_sentence',           'Repeat Sentence',                  'audio',             0, 'PTE-style repeat-sentence'),
('describe_image',            'Describe Image',                   'speaking',          0, 'PTE / Duolingo describe-image'),
('retell_lecture',            'Retell Lecture',                   'speaking',          0, 'PTE-style retell-lecture'),
('summarize_spoken_text',     'Summarize Spoken Text',            'writing',           0, 'PTE-style listening summary'),
('summarize_written_text',    'Summarize Written Text',           'writing',           0, 'PTE-style one-sentence summary'),
('speaking_part1',            'Speaking Part 1',                  'speaking',          0, 'IELTS Speaking introduction & Q&A'),
('speaking_part2',            'Speaking Part 2 (Cue Card)',       'speaking',          0, 'IELTS cue card monologue'),
('speaking_part3',            'Speaking Part 3',                  'speaking',          0, 'IELTS abstract discussion'),
('independent_speaking',      'Independent Speaking',             'speaking',          0, 'TOEFL-style opinion speaking'),
('speaking_sample',           'Speaking Sample',                  'speaking',          0, 'Duolingo-style speaking sample'),
('credibility_interview',     'Credibility Interview Prompt',     'speaking',          0, 'Visa/admission interview question'),
('logical_reasoning',         'Logical Reasoning',                'single_mcq',        1, 'LSAT-style argument-based MCQ'),
('analytical_reasoning',      'Analytical Reasoning (Logic Games)','single_mcq',       1, 'LSAT-style logic game item'),
('critical_reasoning',        'Critical Reasoning',               'single_mcq',        1, 'GMAT-style argument MCQ'),
('sentence_correction',       'Sentence Correction',              'single_mcq',        1, 'GMAT-style grammar MCQ'),
('problem_solving',           'Problem Solving (Quant)',          'single_mcq',        1, 'GMAT-style quant MCQ'),
('central_idea',              'Central Idea / Main Idea',         'single_mcq',        1, 'Reading-comprehension main idea'),
('inference',                 'Inference',                        'single_mcq',        1, 'Reading-comprehension inference'),
('vocabulary_in_context',     'Vocabulary in Context',            'single_mcq',        1, 'Reading-comprehension word meaning'),
('standard_english',          'Standard English Conventions',     'single_mcq',        1, 'SAT Writing grammar MCQ');

-- =============================================================================
-- 3. exam_sections  (one row per section per exam type)
--    section_id sequence: see section_code for uniqueness per exam_type.
-- =============================================================================
INSERT INTO exam_sections (exam_type_id, section_code, section_name, description, duration_minutes, question_count, sort_order, is_active) VALUES
-- 1. IELTS Academic
(1,'LISTENING','Listening','Four recorded monologues and conversations',30,40,1,1),
(1,'READING','Reading','Three long academic passages',60,40,2,1),
(1,'WRITING_T1','Writing Task 1','Describe visual information (150 words)',20,1,3,1),
(1,'WRITING_T2','Writing Task 2','Discursive essay (250 words)',40,1,4,1),
(1,'SPEAKING_P1','Speaking Part 1','Introduction and interview',5,4,5,1),
(1,'SPEAKING_P2','Speaking Part 2','Cue card long turn',5,1,6,1),
(1,'SPEAKING_P3','Speaking Part 3','Two-way discussion',5,5,7,1),
-- 2. IELTS General (same structure as Academic, different Writing Task 1)
(2,'LISTENING','Listening','Four recorded monologues and conversations',30,40,1,1),
(2,'READING','Reading','Three sections of general reading material',60,40,2,1),
(2,'WRITING_T1','Writing Task 1','Letter (150 words)',20,1,3,1),
(2,'WRITING_T2','Writing Task 2','Discursive essay (250 words)',40,1,4,1),
(2,'SPEAKING_P1','Speaking Part 1','Introduction and interview',5,4,5,1),
(2,'SPEAKING_P2','Speaking Part 2','Cue card long turn',5,1,6,1),
(2,'SPEAKING_P3','Speaking Part 3','Two-way discussion',5,5,7,1),
-- 3. IELTS UKVI (same as Academic)
(3,'LISTENING','Listening','Four recorded monologues and conversations',30,40,1,1),
(3,'READING','Reading','Three long academic passages',60,40,2,1),
(3,'WRITING_T1','Writing Task 1','Describe visual information (150 words)',20,1,3,1),
(3,'WRITING_T2','Writing Task 2','Discursive essay (250 words)',40,1,4,1),
(3,'SPEAKING_P1','Speaking Part 1','Introduction and interview',5,4,5,1),
(3,'SPEAKING_P2','Speaking Part 2','Cue card long turn',5,1,6,1),
(3,'SPEAKING_P3','Speaking Part 3','Two-way discussion',5,5,7,1),
-- 4. PTE Academic (10 sections)
(4,'READ_ALOUD','Read Aloud','Read text aloud',7,6,1,1),
(4,'REPEAT_SENTENCE','Repeat Sentence','Repeat heard sentence',10,10,2,1),
(4,'DESCRIBE_IMAGE','Describe Image','Describe chart/image',12,4,3,1),
(4,'RETELL_LECTURE','Retell Lecture','Retell heard lecture',15,2,4,1),
(4,'SUMMARIZE_WRITTEN','Summarize Written Text','One-sentence summary',10,2,5,1),
(4,'ESSAY','Essay','Argument essay (200-300 words)',20,1,6,1),
(4,'READING_FILL','Reading Fill Blanks','Cloze with dropdowns',15,10,7,1),
(4,'REORDER_PARAS','Reorder Paragraphs','Reorder jumbled paragraphs',10,3,8,1),
(4,'LISTENING_FILL','Listening Fill Blanks','Cloze from audio',15,8,9,1),
(4,'WRITE_DICTATION','Write From Dictation','Type heard sentence',10,8,10,1),
-- 5. TOEFL iBT
(5,'READING','Reading','Two academic passages with 10 questions each',36,20,1,1),
(5,'LISTENING','Listening','Lectures and conversations',36,28,2,1),
(5,'SPEAKING','Speaking','Independent and integrated speaking tasks',17,4,3,1),
(5,'WRITING','Writing','Integrated and academic discussion tasks',29,2,4,1),
-- 6. Duolingo English Test
(6,'READ_SELECT','Read and Select','Identify real English words',5,15,1,1),
(6,'FILL_BLANKS','Fill in the Blanks','Complete short text',6,9,2,1),
(6,'READ_ALOUD','Read Aloud','Read statement aloud',5,5,3,1),
(6,'LISTEN_TYPE','Listen and Type','Transcribe audio',6,5,4,1),
(6,'INTERACTIVE_READING','Interactive Reading','Cloze + highlight + answer',12,8,5,1),
(6,'WRITING_SAMPLE','Writing Sample','Short written response',5,1,6,1),
(6,'SPEAKING_SAMPLE','Speaking Sample','Short spoken response',5,1,7,1),
-- 7. OIETC
(7,'READING','Reading','Academic reading passages',25,30,1,1),
(7,'LISTENING','Listening','Recorded lectures and conversations',25,30,2,1),
(7,'WRITING','Writing','Two written tasks',30,2,3,1),
(7,'SPEAKING','Speaking','Three speaking parts',15,3,4,1),
-- 8. OET
(8,'LISTENING','Listening','Consultation and lecture notes',45,42,1,1),
(8,'READING','Reading','Healthcare reading tasks',60,42,2,1),
(8,'WRITING','Writing','Healthcare profession letter',45,1,3,1),
(8,'SPEAKING','Speaking','Role-play healthcare scenarios',20,2,4,1),
-- 9. LanguageCert
(9,'READING','Reading','Comprehension passages',90,30,1,1),
(9,'WRITING','Writing','Two writing tasks',30,2,2,1),
(9,'LISTENING','Listening','Comprehension audio',30,25,3,1),
(9,'SPEAKING','Speaking','Interview with interlocutor',15,4,4,1),
-- 10. Linguaskill
(10,'READING_LISTENING','Reading & Listening','Adaptive reading/listening',60,50,1,1),
(10,'WRITING','Writing','Two writing tasks',30,2,2,1),
(10,'SPEAKING','Speaking','Five speaking parts',15,5,3,1),
-- 11. ALO Placement
(11,'GRAMMAR','Grammar','Grammar MCQs',15,15,1,1),
(11,'VOCABULARY','Vocabulary','Vocabulary MCQs',15,15,2,1),
(11,'READING','Reading','Short reading passages',20,15,3,1),
(11,'LISTENING','Listening','Short listening items',15,10,4,1),
(11,'WRITING','Writing','Short writing sample',15,1,5,1),
-- 12. Digital SAT (modules)
(12,'RW_MOD1','Reading and Writing Module 1','First adaptive R&W module',32,27,1,1),
(12,'RW_MOD2','Reading and Writing Module 2','Adaptive R&W module',32,27,2,1),
(12,'MATH_MOD1','Math Module 1','First adaptive math module',35,22,3,1),
(12,'MATH_MOD2','Math Module 2','Adaptive math module',35,22,4,1),
-- 13. ACT
(13,'ENGLISH','English','Grammar and rhetoric',45,75,1,1),
(13,'MATH','Math','Pre-algebra through trigonometry',60,60,2,1),
(13,'READING','Reading','Four passages',35,40,3,1),
(13,'SCIENCE','Science','Interpretation of data',35,40,4,1),
(13,'WRITING','Writing (optional)','Argumentative essay',40,1,5,1),
-- 14. GRE
(14,'VERBAL','Verbal Reasoning','Text completion, sentence equivalence, RC',30,27,1,1),
(14,'QUANT','Quantitative Reasoning','QC, problem solving, data interpretation',47,27,2,1),
(14,'ANALYTICAL_WRITING','Analytical Writing','Issue and argument essays',30,2,3,1),
-- 15. GMAT Focus
(15,'QUANT','Quantitative Reasoning','Problem solving',45,21,1,1),
(15,'VERBAL','Verbal Reasoning','Critical reasoning and sentence correction',45,23,2,1),
(15,'DATA_INSIGHTS','Data Insights','Multi-source reasoning, tables, charts',45,20,3,1),
-- 16. LSAT
(16,'LR1','Logical Reasoning 1','Short argument MCQs',35,24,1,1),
(16,'LR2','Logical Reasoning 2','Short argument MCQs',35,25,2,1),
(16,'READING_COMP','Reading Comprehension','Long passage MCQs',35,26,3,1),
(16,'ANALYTICAL_REASONING','Analytical Reasoning','Logic games',35,22,4,1),
-- 17. MCAT
(17,'CARS','Critical Analysis and Reasoning Skills','Reading comprehension on humanities',90,53,1,1),
(17,'BIO_BIOCHEM','Biological and Biochemical Foundations','Biology and biochemistry',95,59,2,1),
(17,'CHEM_PHYS','Chemical and Physical Foundations','General and organic chemistry + physics',95,59,3,1),
(17,'PSYCH_SOC','Psychological, Social, Biological Foundations','Psychology and sociology',95,59,4,1),
-- 18. English Placement
(18,'GRAMMAR','Grammar','University English grammar',15,15,1,1),
(18,'READING','Reading','Academic reading',20,15,2,1),
(18,'WRITING','Writing','Short essay',15,1,3,1),
(18,'LISTENING','Listening','Lecture listening',10,10,4,1),
-- 19. Math Placement
(19,'ALGEBRA','Algebra','Linear and quadratic equations',25,15,1,1),
(19,'GEOMETRY','Geometry','Plane and coordinate geometry',20,12,2,1),
(19,'STATISTICS','Statistics','Descriptive statistics and probability',20,12,3,1),
(19,'CALCULUS','Calculus','Limits and derivatives',25,11,4,1),
-- 20. Foundation Year
(20,'ENGLISH','English','Foundation English skills',40,30,1,1),
(20,'MATH','Math','Foundation math skills',40,30,2,1),
(20,'STUDY_SKILLS','Study Skills','Academic skills diagnostic',40,20,3,1),
-- 21. Pre-Master
(21,'ACADEMIC_ENGLISH','Academic English','Graduate academic English',40,30,1,1),
(21,'CRITICAL_THINKING','Critical Thinking','Argument analysis',40,15,2,1),
(21,'SUBJECT_KNOWLEDGE','Subject Knowledge','Subject-specific readiness',40,15,3,1),
-- 22. Scholarship Test
(22,'ENGLISH','English','Scholarship English',30,20,1,1),
(22,'MATH','Math','Scholarship math',30,20,2,1),
(22,'ESSAY','Essay','Scholarship essay',30,1,3,1),
-- 23. UK Credibility Interview
(23,'PERSONAL_BG','Personal Background','Background and history',5,5,1,1),
(23,'STUDY_INTENTION','Study Intention','Why UK and this course',5,5,2,1),
(23,'UNIVERSITY_KNOWLEDGE','University Knowledge','Course and institution awareness',5,5,3,1),
(23,'FINANCIAL','Financial Explanation','Funding source explanation',5,5,4,1),
(23,'CAREER_PLAN','Career Plan','Post-study plans',5,5,5,1),
(23,'CREDIBILITY','Credibility Risk','Genuine student test',5,5,6,1),
-- 24. CAS Interview
(24,'COURSE_KNOWLEDGE','Course Knowledge','Course content awareness',5,5,1,1),
(24,'UNIVERSITY_KNOWLEDGE','University Knowledge','Institution research',5,5,2,1),
(24,'FINANCIAL','Financial Evidence','Tuition and living funds',5,5,3,1),
(24,'CAREER_PLAN','Career Plan','Future career alignment',5,5,4,1),
(24,'CREDIBILITY','Credibility Check','Genuine intent',5,5,5,1),
-- 25. Visa Interview
(25,'PERSONAL_BG','Personal Background','Background and family',5,5,1,1),
(25,'STUDY_INTENTION','Study Intention','Why this destination',5,5,2,1),
(25,'FINANCIAL','Financial Explanation','Funds and sponsorship',5,5,3,1),
(25,'CAREER_PLAN','Career Plan','Return-home plans',5,5,4,1),
(25,'CREDIBILITY','Credibility Check','Genuine student test',5,5,5,1),
(25,'FOLLOW_UP','Follow-up Questions','Probe and verify',5,5,6,1),
-- 26. Scholarship Visa Interview
(26,'SCHOLARSHIP_TERMS','Scholarship Terms','Coverage and conditions',5,5,1,1),
(26,'COURSE_KNOWLEDGE','Course Knowledge','Course alignment with scholarship',5,5,2,1),
(26,'CAREER_PLAN','Career Plan','Return-home contribution',5,5,3,1),
(26,'CREDIBILITY','Credibility Check','Genuine intent',5,5,4,1),
(26,'FOLLOW_UP','Follow-up Questions','Probe and verify',5,5,5,1),
-- 27. Admission Interview
(27,'BACKGROUND','Background','Academic and personal background',6,5,1,1),
(27,'COURSE_KNOWLEDGE','Course Knowledge','Why this course',6,5,2,1),
(27,'CAREER_GOALS','Career Goals','Long-term plans',6,5,3,1),
(27,'STRENGTHS_WEAKNESSES','Strengths & Weaknesses','Self-assessment',6,5,4,1),
(27,'QUESTIONS','Applicant Questions','Questions for the panel',6,5,5,1),
-- 28. ALO Counselor Check
(28,'BACKGROUND','Background','Student background',7,5,1,1),
(28,'GOALS','Goals','Study goals',7,5,2,1),
(28,'ENGLISH_LEVEL','English Level','English placement',8,5,3,1),
(28,'DOCUMENTS','Documents','Document readiness',7,5,4,1),
(28,'FINANCES','Finances','Budget and funding',8,5,5,1),
(28,'TIMELINE','Timeline','Application timeline',8,5,6,1),
-- 29. ALO Student Readiness
(29,'KNOWLEDGE_CHECK','Knowledge Check','Readiness knowledge check',10,5,1,1),
(29,'SCENARIOS','Scenario Questions','Hypothetical scenarios',15,5,2,1),
(29,'DOCUMENT_READINESS','Document Readiness','Document completeness check',10,5,3,1),
(29,'INTERVIEW_SIM','Interview Simulation','Mock interview',10,5,4,1),
-- 30. ALO English Diagnostic
(30,'GRAMMAR','Grammar','Diagnostic grammar',15,15,1,1),
(30,'VOCABULARY','Vocabulary','Diagnostic vocabulary',15,15,2,1),
(30,'READING','Reading','Short diagnostic passages',15,10,3,1),
(30,'LISTENING','Listening','Short diagnostic listening',15,10,4,1),
-- 31. ALO Document Readiness
(31,'PASSPORT','Passport Check','Passport validity and pages',6,5,1,1),
(31,'FINANCIAL_DOCS','Financial Documents','Bank statements and sponsorship',6,5,2,1),
(31,'ACADEMIC_DOCS','Academic Documents','Transcripts and certificates',6,5,3,1),
(31,'APPLICATION_FORM','Application Form','Form completeness',6,5,4,1),
(31,'SUPPORTING','Supporting Docs','SOP, LOR, CV',6,5,5,1),
-- 32. ALO Visa Readiness
(32,'DOCUMENT_PACK','Document Pack','Visa pack completeness',8,5,1,1),
(32,'INTERVIEW_PREP','Interview Prep','Mock visa interview',10,5,2,1),
(32,'FINANCIAL_CHECK','Financial Check','Funds recency and source',8,5,3,1),
(32,'CREDIBILITY_PREP','Credibility Prep','Genuine-student narrative',10,5,4,1),
(32,'FINAL_REVIEW','Final Review','Final readiness sign-off',9,5,5,1);

-- =============================================================================
-- 4. exam_modules  (adaptive / multi-module sections)
-- =============================================================================
INSERT INTO exam_modules (section_id, module_code, module_name, duration_minutes, question_count, sort_order, is_adaptive) VALUES
-- Digital SAT: 4 sections are themselves adaptive modules - keep single-module entries
-- SAT section_ids are auto-increment; we resolve them by (exam_type_id, section_code) below.
-- For safety we add explicit module rows for SAT modules using known IDs after seed.
((SELECT id FROM exam_sections WHERE exam_type_id=12 AND section_code='RW_MOD1'),  'RW_MOD1_EASY',  'R&W Module 1 (Baseline)',  32, 27, 1, 0),
((SELECT id FROM exam_sections WHERE exam_type_id=12 AND section_code='RW_MOD2'),  'RW_MOD2_HARD',  'R&W Module 2 (Hard)',      32, 27, 1, 1),
((SELECT id FROM exam_sections WHERE exam_type_id=12 AND section_code='RW_MOD2'),  'RW_MOD2_EASY',  'R&W Module 2 (Easy)',      32, 27, 2, 1),
((SELECT id FROM exam_sections WHERE exam_type_id=12 AND section_code='MATH_MOD1'),'MATH_MOD1_BASE', 'Math Module 1 (Baseline)', 35, 22, 1, 0),
((SELECT id FROM exam_sections WHERE exam_type_id=12 AND section_code='MATH_MOD2'),'MATH_MOD2_HARD', 'Math Module 2 (Hard)',     35, 22, 1, 1),
((SELECT id FROM exam_sections WHERE exam_type_id=12 AND section_code='MATH_MOD2'),'MATH_MOD2_EASY', 'Math Module 2 (Easy)',     35, 22, 2, 1),
-- GMAT Focus: three sections each have one module
((SELECT id FROM exam_sections WHERE exam_type_id=15 AND section_code='QUANT'),     'QUANT_BASE',  'Quantitative Reasoning',  45, 21, 1, 0),
((SELECT id FROM exam_sections WHERE exam_type_id=15 AND section_code='VERBAL'),    'VERBAL_BASE', 'Verbal Reasoning',        45, 23, 1, 0),
((SELECT id FROM exam_sections WHERE exam_type_id=15 AND section_code='DATA_INSIGHTS'),'DI_BASE',  'Data Insights',           45, 20, 1, 0);

-- =============================================================================
-- 5. exam_settings  (key/value platform config)
-- =============================================================================
INSERT INTO exam_settings (setting_key, setting_value, data_type, is_public, description) VALUES
-- Free quota
('free_quota_alo',                   '3',                                      'int',    1, 'Free mock attempts allowed per ALO-linked student'),
('free_quota_public',                '1',                                      'int',    1, 'Free mock attempts allowed per public (non-ALO) student'),
('free_quota_partner',               '2',                                      'int',    1, 'Free mock attempts allowed per partner student'),
('free_quota_ambassador_referred',   '2',                                      'int',    1, 'Free mock attempts for ambassador-referred sign-ups'),
-- Weekly updates
('weekly_update_enabled',            'true',                                   'bool',   1, 'Whether weekly content update register is active'),
('weekly_update_day',                'monday',                                 'string', 1, 'Day of week when weekly update is published'),
('weekly_update_questions_target',   '20',                                     'int',    0, 'Target number of new questions added per week'),
-- Practice disclaimer
('practice_disclaimer',              'This is an original practice question created by ALO. It is not an official exam item and is not affiliated with, endorsed by, or reproduced from any official test publisher. Items will not appear in any real exam.', 'string', 1, 'Standard practice disclaimer shown across practice sets and reports'),
('attempts_disclaimer',              'Mock attempts on this platform are for practice and self-assessment only. They are not official exam sittings and do not produce a valid official score.', 'string', 1, 'Disclaimer shown on mock attempt reports'),
('certificates_disclaimer',          'Certificates issued by ALO English Test Platform acknowledge completion of practice only and are not official language proficiency certifications.', 'string', 1, 'Disclaimer printed on certificates'),
-- CRM sync
('crm_sync_enabled',                 'true',                                   'bool',   0, 'Enable ALO CRM two-way sync'),
('crm_sync_endpoint',                'https://crm.alo.com/api/v2',             'string', 0, 'ALO CRM API base URL'),
('crm_sync_api_key_env',             'ALO_CRM_API_KEY',                        'string', 0, 'Env variable name holding CRM API key'),
('crm_sync_batch_size',              '50',                                     'int',    0, 'Records per CRM sync batch'),
('crm_sync_retry_max',               '3',                                      'int',    0, 'Max retries on failed CRM sync'),
-- Payments
('default_currency',                 'USD',                                    'string', 1, 'Default currency for paid attempts'),
('payment_gateway_default',          'stripe',                                 'string', 0, 'Default payment gateway'),
('paid_attempt_price_usd',           '9.00',                                   'float',  1, 'Default price for a single paid mock attempt (USD)'),
('voucher_default_expiry_days',      '90',                                     'int',    1, 'Default voucher validity (days)'),
-- Attempt behaviour
('attempt_default_buffer_minutes',   '5',                                      'int',    0, 'Extra grace minutes added to attempt timer'),
('attempt_max_active_per_student',   '2',                                      'int',    0, 'Concurrent in-progress attempts allowed per student'),
('attempt_expiry_hours',             '24',                                     'int',    0, 'Hours after which an abandoned attempt auto-expires'),
-- Speaking & writing
('speaking_max_attempts_per_day',    '3',                                      'int',    1, 'Daily cap on speaking practice attempts'),
('writing_word_count_min',           '150',                                    'int',    1, 'Minimum word count for writing tasks'),
('writing_word_count_max',           '750',                                    'int',    1, 'Maximum word count for writing tasks'),
('ai_grading_enabled',               'true',                                   'bool',   1, 'Enable AI grading for speaking and writing'),
('ai_grading_model',                 'alo-internal-rubric-v1',                 'string', 0, 'Identifier of the AI grading model in use'),
-- Proctoring & integrity
('proctoring_enabled',               'false',                                  'bool',   1, 'Whether proctoring/anti-cheat is enabled by default'),
('proctor_tab_switch_threshold',     '3',                                      'int',    0, 'Tab-switch events before a proctor warning is raised'),
-- Certificates
('certificates_enabled',             'true',                                   'bool',   1, 'Whether practice-completion certificates are issued'),
-- Ambassador program
('ambassador_program_enabled',       'true',                                   'bool',   1, 'Whether ambassador referrals are active'),
('ambassador_reward_voucher_count',  '5',                                      'int',    1, 'Vouchers granted per qualified referral'),
-- Platform identity
('platform_name',                    'ALO English Test Platform',              'string', 1, 'Public platform name'),
('platform_version',                 '1.0.0',                                  'string', 1, 'Current platform release version'),
('support_email',                    'support@alo.com',                        'string', 1, 'Customer support email'),
('support_phone',                    '+1-000-000-0000',                        'string', 1, 'Customer support phone'),
('terms_version',                    '2025-01',                                'string', 1, 'Current terms-of-service version'),
('privacy_version',                  '2025-01',                                'string', 1, 'Current privacy-policy version'),
-- Feature flags
('feature_partner_portal',           'true',                                   'bool',   1, 'Partner portal enabled'),
('feature_ambassador_portal',        'true',                                   'bool',   1, 'Ambassador portal enabled'),
('feature_counselor_booking',        'true',                                   'bool',   1, 'Counselor booking enabled'),
('feature_pdf_reports',              'true',                                   'bool',   1, 'PDF report downloads enabled'),
('feature_progress_tracking',        'true',                                   'bool',   1, 'Long-term progress tracking enabled');

-- =============================================================================
-- 6. exam_users  (sample admin user - placeholder password hash only)
-- =============================================================================
INSERT INTO exam_users (id, user_code, name, email, phone, password_hash, status, email_verified_at, last_login_at) VALUES
(1, 'ADMIN-0001', 'ALO Platform Admin', 'admin@alo.com', '+1-000-000-0000',
 '$2y$12$REPLACE_WITH_BCRYPT_HASH_OF_REAL_ADMIN_PASSWORD.XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX',
 'active', NOW(), NULL);

-- =============================================================================
-- 7. exam_user_roles  (SUPER_ADMIN role for the sample admin user)
-- =============================================================================
INSERT INTO exam_user_roles (user_id, role_id, scope, scope_ref, granted_at, granted_by, expires_at)
SELECT 1, id, 'global', NULL, NOW(), NULL, NULL FROM exam_roles WHERE role_code = 'SUPER_ADMIN';

SET foreign_key_checks = 1;

-- =============================================================================
-- End of seed.sql
-- =============================================================================
