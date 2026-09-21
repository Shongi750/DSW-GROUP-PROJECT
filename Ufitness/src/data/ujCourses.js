export const UJ_PROSPECTUS_YEAR = 2026;
export const UJ_PROSPECTUS_URL =
  'https://www.uj.ac.za/wp-content/uploads/2025/03/2026-undergraduate-prospectus.pdf';

export const YEARS_OF_STUDY = [
  '1st Year',
  '2nd Year',
  '3rd Year',
  '4th Year',
  'Postgraduate',
];

const c = (faculty, name) => ({ faculty, name });

const FADA = 'Art, Design and Architecture';
const CBE = 'College of Business and Economics';
const EDU = 'Education';
const FEBE = 'Engineering and the Built Environment';
const HEALTH = 'Health Sciences';
const HUM = 'Humanities';
const LAW = 'Law';
const SCI = 'Science';

/** Undergraduate programmes from the UJ 2026 prospectus (plus Science majors listed there). */
export const UJ_COURSES = [
  c(FADA, 'Diploma in Architecture'),
  c(FADA, 'Diploma in Fashion Production'),
  c(FADA, 'Diploma in Jewellery Design and Manufacture'),
  c(FADA, 'BArch Architecture'),
  c(FADA, 'BA Communication Design'),
  c(FADA, 'BA Digital Media Design'),
  c(FADA, 'BA Fashion Design'),
  c(FADA, 'BA Industrial Design'),
  c(FADA, 'BA Interior Design'),
  c(FADA, 'BA Visual Art'),

  c(CBE, 'BCom Accounting (CA)'),
  c(CBE, 'BCom Accounting'),
  c(CBE, 'BCom Accountancy'),
  c(CBE, 'BCom Accountancy (Online)'),
  c(CBE, 'BCom Accounting (Extended)'),
  c(CBE, 'BCom Business Management'),
  c(CBE, 'BCom Economics and Econometrics'),
  c(CBE, 'BCom Entrepreneurial Management'),
  c(CBE, 'BCom Finance'),
  c(CBE, 'BCom Industrial Psychology'),
  c(CBE, 'BCom Information Management'),
  c(CBE, 'BCom Information Systems'),
  c(CBE, 'BCom Marketing Management'),
  c(CBE, 'Bachelor of Human Resource Management'),
  c(CBE, 'Bachelor of Human Resource Management (Online)'),
  c(CBE, 'Bachelor of Hospitality Management'),
  c(CBE, 'Bachelor of Public Management and Governance'),
  c(CBE, 'Bachelor of Tourism Development and Management'),
  c(CBE, 'Diploma in Accountancy'),
  c(CBE, 'Diploma in Business Information Technology'),
  c(CBE, 'Diploma in Financial Services Operations'),
  c(CBE, 'Diploma in Food and Beverage Operations'),
  c(CBE, 'Diploma in Logistics'),
  c(CBE, 'Diploma in Logistics (Extended)'),
  c(CBE, 'Diploma in Marketing'),
  c(CBE, 'Diploma in People Management'),
  c(CBE, 'Diploma in People Management (Extended)'),
  c(CBE, 'Diploma in Retail Business Management'),
  c(CBE, 'Diploma in Small Business Management'),
  c(CBE, 'Diploma in Small Business Management (Extended)'),
  c(CBE, 'Diploma in Tourism Management'),
  c(CBE, 'Diploma in Transportation Management'),
  c(CBE, 'Diploma in Transportation Management (Extended)'),
  c(CBE, 'Diploma in Transport and Logistics Management'),

  c(EDU, 'BEd Foundation Phase Teaching (Grades R–3)'),
  c(EDU, 'BEd Intermediate Phase Teaching (Grades 4–7)'),
  c(EDU, 'BEd Senior Phase and FET Teaching (Grades 8–12)'),
  c(EDU, 'BEd FET — Accounting'),
  c(EDU, 'BEd FET — Afrikaans'),
  c(EDU, 'BEd FET — Business Management'),
  c(EDU, 'BEd FET — Economics'),
  c(EDU, 'BEd FET — English'),
  c(EDU, 'BEd FET — Geography'),
  c(EDU, 'BEd FET — isiZulu'),
  c(EDU, 'BEd FET — Life Orientation'),
  c(EDU, 'BEd FET — Life Sciences'),
  c(EDU, 'BEd FET — Mathematics'),
  c(EDU, 'BEd FET — Physical Science'),
  c(EDU, 'BEd FET — Psychology'),
  c(EDU, 'BEd FET — Sepedi'),

  c(FEBE, 'BEng Civil Engineering'),
  c(FEBE, 'BEng Electrical and Electronic Engineering'),
  c(FEBE, 'BEng Mechanical Engineering'),
  c(FEBE, 'BEng Mining Engineering'),
  c(FEBE, 'BEngTech Chemical Engineering'),
  c(FEBE, 'BEngTech Civil Engineering'),
  c(FEBE, 'BEngTech Civil Engineering (Extended)'),
  c(FEBE, 'BEngTech Electrical Engineering'),
  c(FEBE, 'BEngTech Electrical Engineering (Extended)'),
  c(FEBE, 'BEngTech Extraction Metallurgy'),
  c(FEBE, 'BEngTech Extraction Metallurgy (Extended)'),
  c(FEBE, 'BEngTech Industrial Engineering'),
  c(FEBE, 'BEngTech Industrial Engineering (Extended)'),
  c(FEBE, 'BEngTech Mechanical Engineering'),
  c(FEBE, 'BEngTech Mechanical Engineering (Extended)'),
  c(FEBE, 'BEngTech Physical Metallurgy'),
  c(FEBE, 'BEngTech Physical Metallurgy (Extended)'),
  c(FEBE, 'BSc Construction'),
  c(FEBE, 'BSc Construction (Extended)'),
  c(FEBE, 'Bachelor of Mine Surveying'),
  c(FEBE, 'Bachelor of Urban and Regional Planning'),
  c(FEBE, 'Diploma in Management Services'),
  c(FEBE, 'Diploma in Management Services (Extended)'),
  c(FEBE, 'Diploma in Operations Management'),
  c(FEBE, 'Diploma in Operations Management (Extended)'),

  c(HEALTH, 'Bachelor of Biokinetics'),
  c(HEALTH, 'Bachelor of Chiropractic'),
  c(HEALTH, 'Bachelor of Complementary Medicine'),
  c(HEALTH, 'Bachelor of Diagnostic Radiography'),
  c(HEALTH, 'Bachelor of Diagnostic Ultrasound'),
  c(HEALTH, 'Bachelor of Emergency Medical Care'),
  c(HEALTH, 'Bachelor of Environmental Health'),
  c(HEALTH, 'Bachelor of Medical Laboratory Science'),
  c(HEALTH, 'Bachelor of Nuclear Medicine'),
  c(HEALTH, 'Bachelor of Nursing'),
  c(HEALTH, 'Bachelor of Optometry'),
  c(HEALTH, 'Bachelor of Podiatry'),
  c(HEALTH, 'Bachelor of Radiation Therapy'),
  c(HEALTH, 'Bachelor of Sport and Exercise Science'),
  c(HEALTH, 'BCom Sport Management'),

  c(HUM, 'BA'),
  c(HUM, 'BA (Extended)'),
  c(HUM, 'BA Development Studies'),
  c(HUM, 'BA Language Practice'),
  c(HUM, 'BA Linguistics'),
  c(HUM, 'BA Linguistics and Language Practice'),
  c(HUM, 'BA Politics, Economics and Technology'),
  c(HUM, 'BA Strategic Communication'),
  c(HUM, 'Bachelor of Social Work'),
  c(HUM, 'Diploma in Community Development and Leadership'),
  c(HUM, 'Diploma in Public Relations and Communication'),
  c(HUM, 'Diploma in Public Relations and Communication (Extended)'),

  c(LAW, 'BA Law'),
  c(LAW, 'BCom Law'),
  c(LAW, 'LLB'),

  c(SCI, 'BSc Information Technology'),
  c(SCI, 'BSc Computer Science and Informatics'),
  c(SCI, 'BSc Computer Science and Informatics (Extended)'),
  c(SCI, 'BSc Biochemistry and Botany'),
  c(SCI, 'BSc Botany and Chemistry'),
  c(SCI, 'BSc Botany and Zoology'),
  c(SCI, 'BSc Zoology and Biochemistry'),
  c(SCI, 'BSc Zoology and Chemistry'),
  c(SCI, 'BSc Zoology and Geography'),
  c(SCI, 'BSc Zoology and Physiology'),
  c(SCI, 'BSc Physiology and Biochemistry'),
  c(SCI, 'BSc Geography and Environmental Management'),
  c(SCI, 'BSc Geology and Geography'),
  c(SCI, 'BSc Applied Mathematics and Computer Science'),
  c(SCI, 'BSc Applied Mathematics and Mathematical Statistics'),
  c(SCI, 'BSc Mathematical Statistics and Computer Science'),
  c(SCI, 'BSc Biochemistry and Chemistry'),
  c(SCI, 'BSc Chemistry and Physics'),
  c(SCI, 'BSc Geology and Chemistry'),
  c(SCI, 'BSc Geology and Physics'),
  c(SCI, 'BSc Physics and Applied Mathematics'),
  c(SCI, 'Diploma in Analytical Chemistry'),
  c(SCI, 'Diploma in Biotechnology'),
  c(SCI, 'Diploma in Food Technology'),
];

export function searchUjCourses(query) {
  const q = String(query || '')
    .trim()
    .toLowerCase();
  if (!q) return UJ_COURSES;
  return UJ_COURSES.filter(
    (item) => item.name.toLowerCase().includes(q) || item.faculty.toLowerCase().includes(q)
  );
}

export function facultyForCourse(name) {
  return UJ_COURSES.find((item) => item.name === name)?.faculty || '';
}
