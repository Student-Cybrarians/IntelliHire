// Global Multi-Domain Career Taxonomy Definition
export const GLOBAL_CAREER_DOMAINS = [
  { id: 'dom_tech', name: 'Technology & Digital Systems', code: '15-0000', description: 'Software engineering, cloud architecture, cybersecurity, data science, AI systems, and tech design' },
  { id: 'dom_health', 'name': 'Healthcare, Clinical & Nursing', code: '29-0000', description: 'Physicians, registered nurses, clinical specialists, pharmacy, allied health, and medical technology' },
  { id: 'dom_corp', name: 'Business, Finance & Operations', code: '11-0000', description: 'Operations management, corporate strategy, accounting, marketing, human resources, and business analysis' },
  { id: 'dom_legal', name: 'Legal, Regulatory & Compliance', code: '23-0000', description: 'Corporate counsel, attorneys, paralegals, compliance officers, and regulatory specialists' },
  { id: 'dom_eng', name: 'Engineering & Industrial', code: '17-0000', description: 'Mechanical, civil, electrical, chemical, aerospace, and industrial manufacturing engineering' },
  { id: 'dom_trades', name: 'Skilled Trades & Vocational', code: '47-0000', description: 'Licensed electricians, plumbers, HVAC technicians, welders, carpentry, and site supervisors' },
  { id: 'dom_creative', name: 'Creative, Media & Communications', code: '27-0000', description: 'UX/UI designers, copywriters, art directors, video producers, technical writers, and content creators' },
  { id: 'dom_edu', name: 'Education, Training & Research', code: '25-0000', description: 'Educators, university lecturers, academic researchers, and instructional design specialists' },
  { id: 'dom_public', name: 'Public Sector, Social & Logistics', code: '13-0000', description: 'Public administration, policy analysts, NGO directors, emergency services, and supply chain logistics' }
];

export const GLOBAL_OCCUPATIONS: Record<string, Array<{ id: string; name: string; code: string; description: string; seniority_levels: string[] }>> = {
  dom_tech: [
    { id: 'occ_sw_eng', name: 'Software / Full-Stack Engineer', code: '15-1252', description: 'Designs and builds scalable web, cloud, and distributed applications', seniority_levels: ['Junior', 'Mid-Level', 'Senior', 'Staff / Lead', 'Principal'] },
    { id: 'occ_data_sci', name: 'Data Scientist / ML Engineer', code: '15-2051', description: 'Builds machine learning models, statistical analyses, and data pipelines', seniority_levels: ['Associate', 'Mid-Level', 'Senior', 'Lead Scientist'] },
    { id: 'occ_cloud_devops', name: 'DevOps & Site Reliability Engineer', code: '15-1244', description: 'Manages CI/CD, cloud infrastructure, container orchestration, and uptime', seniority_levels: ['Junior', 'Mid-Level', 'Senior', 'Lead SRE'] },
    { id: 'occ_cybersec', name: 'Cybersecurity Analyst & Engineer', code: '15-1212', description: 'Secures networks, monitors vulnerabilities, and ensures compliance', seniority_levels: ['Analyst', 'Senior Specialist', 'Security Architect'] }
  ],
  dom_health: [
    { id: 'occ_rn', name: 'Registered Nurse (RN)', code: '29-1141', description: 'Delivers acute and clinical patient care, administering treatments and triage', seniority_levels: ['Staff Nurse', 'Charge Nurse', 'Clinical Nurse Specialist', 'Nurse Manager'] },
    { id: 'occ_physician', name: 'Medical Doctor / Physician', code: '29-1210', description: 'Diagnoses medical conditions, prescribes therapeutics, and directs clinical pathways', seniority_levels: ['Resident', 'Attending Physician', 'Department Head'] },
    { id: 'occ_pharmacist', name: 'Clinical Pharmacist', code: '29-1051', description: 'Manages pharmacotherapy, reviews drug interactions, and counsels patients', seniority_levels: ['Staff Pharmacist', 'Clinical Specialist', 'Director of Pharmacy'] },
    { id: 'occ_med_tech', name: 'Medical Laboratory Technologist', code: '29-2010', description: 'Performs clinical diagnostic assays, hematology, and pathology analysis', seniority_levels: ['Technician', 'Senior Technologist', 'Lab Supervisor'] }
  ],
  dom_corp: [
    { id: 'occ_financial_analyst', name: 'Financial Analyst / Accountant (CPA)', code: '13-2051', description: 'Performs financial modeling, auditing, variance analysis, and reporting', seniority_levels: ['Associate', 'Senior Analyst', 'Finance Manager', 'Controller / CFO'] },
    { id: 'occ_ops_mgr', name: 'Operations / Project Manager (PMP)', code: '11-1021', description: 'Leads cross-functional project execution, budgets, and operational improvements', seniority_levels: ['Project Coordinator', 'Project Manager', 'Program Director'] },
    { id: 'occ_hr_specialist', name: 'Human Resources Business Partner', code: '13-1071', description: 'Talent management, organizational development, employee relations, and compliance', seniority_levels: ['Generalist', 'HRBP', 'People Operations Director'] }
  ],
  dom_legal: [
    { id: 'occ_lawyer', name: 'Corporate Legal Counsel / Attorney', code: '23-1011', description: 'Handles contracts, risk mitigation, corporate transactions, and litigation', seniority_levels: ['Associate Attorney', 'Senior Counsel', 'General Counsel / Partner'] },
    { id: 'occ_paralegal', name: 'Paralegal / Compliance Specialist', code: '23-2011', description: 'Performs legal research, discovery, regulatory filings, and due diligence', seniority_levels: ['Junior Paralegal', 'Senior Paralegal', 'Compliance Manager'] }
  ],
  dom_eng: [
    { id: 'occ_mech_eng', name: 'Mechanical Engineer', code: '17-2141', description: 'Designs thermal, mechanical, and robotic assemblies with CAD/CAM simulation', seniority_levels: ['Junior Engineer', 'Senior Engineer', 'Chief Mechanical Engineer'] },
    { id: 'occ_civil_eng', name: 'Civil / Structural Engineer', code: '17-2051', description: 'Designs structural foundations, public infrastructure, and geotechnical works', seniority_levels: ['Design Engineer', 'Project Engineer', 'Principal Engineer'] }
  ],
  dom_trades: [
    { id: 'occ_electrician', name: 'Licensed Electrician', code: '47-2111', description: 'Installs, tests, and repairs high/low voltage electrical systems and control gear', seniority_levels: ['Apprentice', 'Journeyman', 'Master Electrician', 'Electrical Contractor'] },
    { id: 'occ_hvac', name: 'HVAC-R Technician', code: '49-9021', description: 'Installs, diagnoses, and services commercial and residential refrigeration & climate systems', seniority_levels: ['Apprentice', 'Certified Technician', 'Lead Technician'] }
  ],
  dom_creative: [
    { id: 'occ_ux_designer', name: 'UX / Product Designer', code: '27-1024', description: 'User research, wireframing, design systems, and usability testing', seniority_levels: ['Junior Designer', 'Senior Product Designer', 'Design Director'] },
    { id: 'occ_copywriter', name: 'Content Strategist / Copywriter', code: '27-3042', description: 'Develops brand messaging, technical copy, and communication campaigns', seniority_levels: ['Copywriter', 'Senior Strategist', 'Creative Director'] }
  ],
  dom_edu: [
    { id: 'occ_teacher', name: 'Educator / Instructional Designer', code: '25-2031', description: 'Curriculum development, student assessment, pedagogical design, and e-learning', seniority_levels: ['Teacher', 'Senior Instructor', 'Dean / Academic Director'] }
  ],
  dom_public: [
    { id: 'occ_public_admin', name: 'Public Administrator / Policy Analyst', code: '13-1000', description: 'Public policy evaluation, government program administration, and civic logistics', seniority_levels: ['Policy Analyst', 'Senior Administrator', 'Department Director'] }
  ]
};
