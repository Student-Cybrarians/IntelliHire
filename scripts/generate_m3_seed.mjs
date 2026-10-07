import fs from 'fs';

const content = fs.readFileSync('./functions/api/simulationEngine.ts', 'utf8');
const match = content.match(/export const SEED_SIMULATIONS = (\[[\s\S]*?\]);\s*export function/);
if (!match) {
  console.error('Could not find SEED_SIMULATIONS');
  process.exit(1);
}

const simulations = eval(match[1]);

function escapeSql(str) {
  if (str === null || str === undefined) return 'NULL';
  return "'" + String(str).replace(/'/g, "''") + "'";
}

let sql = '-- Seed simulation definitions\n';
for (const s of simulations) {
  const scenarioJson = JSON.stringify(s.scenario || {});
  const dynamicJson = JSON.stringify(s.dynamic_injection || {});
  const rubricJson = JSON.stringify(s.rubric || {});
  const expectedOutputSchema = JSON.stringify({ type: s.scenario?.expected_output_type || 'string' });

  sql += `INSERT INTO simulation_definition (
  id, organization_id, title, occupation_code, target_role, domain, simulation_type,
  competency_name, skill_name, difficulty_level, scenario_json, dynamic_injection_json,
  expected_output_schema_json, rubric_json, is_active
) VALUES (
  ${escapeSql(s.id)},
  ${escapeSql('org_default_public')},
  ${escapeSql(s.title)},
  ${escapeSql(s.occupation_code)},
  ${escapeSql(s.target_role)},
  ${escapeSql(s.domain)},
  ${escapeSql(s.simulation_type)},
  ${escapeSql(s.competency_name)},
  ${escapeSql(s.skill_name)},
  ${s.difficulty_level || 2},
  ${escapeSql(scenarioJson)},
  ${escapeSql(dynamicJson)},
  ${escapeSql(expectedOutputSchema)},
  ${escapeSql(rubricJson)},
  1
) ON CONFLICT(id) DO UPDATE SET
  title = excluded.title,
  scenario_json = excluded.scenario_json,
  dynamic_injection_json = excluded.dynamic_injection_json,
  rubric_json = excluded.rubric_json;\n\n`;
}

fs.writeFileSync('seed_m3_definitions.sql', sql, 'utf8');
console.log(`Generated seed_m3_definitions.sql with ${simulations.length} definitions`);
