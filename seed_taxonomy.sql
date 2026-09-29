CREATE TABLE IF NOT EXISTS taxonomy_domain (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    code TEXT UNIQUE NOT NULL
);

CREATE TABLE IF NOT EXISTS taxonomy_occupation (
    id TEXT PRIMARY KEY,
    domain_id TEXT NOT NULL REFERENCES taxonomy_domain(id),
    name TEXT NOT NULL,
    code TEXT UNIQUE NOT NULL
);

ALTER TABLE candidate_profile ADD COLUMN target_domain_id TEXT REFERENCES taxonomy_domain(id);
ALTER TABLE candidate_profile ADD COLUMN target_occupation_id TEXT REFERENCES taxonomy_occupation(id);

INSERT OR IGNORE INTO taxonomy_domain (id, name, code) VALUES
('dom_engineering', 'Engineering & Architecture', '17-0000'),
('dom_it', 'Computer & Mathematical', '15-0000'),
('dom_management', 'Management', '11-0000'),
('dom_business', 'Business & Financial Operations', '13-0000'),
('dom_healthcare', 'Healthcare Practitioners', '29-0000');

INSERT OR IGNORE INTO taxonomy_occupation (id, domain_id, name, code) VALUES
('occ_software_dev', 'dom_it', 'Software Developer', '15-1252'),
('occ_web_dev', 'dom_it', 'Web Developer', '15-1254'),
('occ_data_sci', 'dom_it', 'Data Scientist', '15-1221'),
('occ_sys_admin', 'dom_it', 'Network & Computer Systems Administrator', '15-1244'),
('occ_product_mgr', 'dom_management', 'Product Manager', '11-3021'),
('occ_eng_mgr', 'dom_management', 'Engineering Manager', '11-9041'),
('occ_fin_analyst', 'dom_business', 'Financial Analyst', '13-2051'),
('occ_mech_eng', 'dom_engineering', 'Mechanical Engineer', '17-2141'),
('occ_civil_eng', 'dom_engineering', 'Civil Engineer', '17-2051'),
('occ_nurse', 'dom_healthcare', 'Registered Nurse', '29-1141');

