import { WorkSurfaceAdapterProps } from './WorkSurfaceTypes';
import CodeWorkSurfaceAdapter from './adapters/CodeWorkSurfaceAdapter';
import SqlQueryWorkSurfaceAdapter from './adapters/SqlQueryWorkSurfaceAdapter';
import DataAnalysisWorkSurfaceAdapter from './adapters/DataAnalysisWorkSurfaceAdapter';
import FinancialTableWorkSurfaceAdapter from './adapters/FinancialTableWorkSurfaceAdapter';
import EngineeringCalculationWorkSurfaceAdapter from './adapters/EngineeringCalculationWorkSurfaceAdapter';
import OperationsDecisionWorkSurfaceAdapter from './adapters/OperationsDecisionWorkSurfaceAdapter';
import DocumentWritingWorkSurfaceAdapter from './adapters/DocumentWritingWorkSurfaceAdapter';
import LegalProfessionalMemoWorkSurfaceAdapter from './adapters/LegalProfessionalMemoWorkSurfaceAdapter';
import ResearchAnalysisWorkSurfaceAdapter from './adapters/ResearchAnalysisWorkSurfaceAdapter';
import StructuredResponseWorkSurfaceAdapter from './adapters/StructuredResponseWorkSurfaceAdapter';

export default function UniversalWorkSurfaceDispatcher(props: WorkSurfaceAdapterProps) {
  const { task } = props;
  const simType = (task?.simulation_type || task?.modality || '').toLowerCase();
  const taskForm = (task?.taskForm || '').toLowerCase();
  const taskFamily = (task?.taskFamily || '').toLowerCase();
  const taskId = (task?.id || '').toLowerCase();

  // 1. SQL / Query Workspace
  if (
    simType === 'sql' ||
    taskFamily === 'sql' ||
    taskId.includes('relational-indexing') ||
    taskId.includes('sql')
  ) {
    return <SqlQueryWorkSurfaceAdapter {...props} />;
  }

  // 2. Data Analysis / Transformation Workspace
  if (
    simType === 'data_analysis' ||
    taskFamily === 'data_analysis' ||
    taskId.includes('data-transformation') ||
    taskId.includes('kafka')
  ) {
    return <DataAnalysisWorkSurfaceAdapter {...props} />;
  }

  // 3. Financial Modeling Workspace
  if (
    simType === 'financial_analysis' ||
    taskFamily === 'financial_modeling' ||
    taskForm === 'quantitative_calculation' ||
    taskId.includes('capex') ||
    taskId.includes('financial')
  ) {
    return <FinancialTableWorkSurfaceAdapter {...props} />;
  }

  // 4. Engineering Calculations Workspace
  if (
    simType === 'engineering_calc' ||
    taskFamily === 'engineering_calculations' ||
    taskId.includes('engineering')
  ) {
    return <EngineeringCalculationWorkSurfaceAdapter {...props} />;
  }

  // 5. Operations / Triage / Crisis Decision Workspace
  if (
    simType === 'operational_triage' ||
    taskFamily === 'operations_management' ||
    taskId.includes('triage') ||
    taskId.includes('hospital') ||
    taskId.includes('float-pool')
  ) {
    return <OperationsDecisionWorkSurfaceAdapter {...props} />;
  }

  // 6. Legal / Professional Memo Workspace
  if (
    simType === 'policy_review' ||
    taskFamily === 'legal_compliance' ||
    taskId.includes('legal') ||
    taskId.includes('contract') ||
    taskId.includes('msa')
  ) {
    return <LegalProfessionalMemoWorkSurfaceAdapter {...props} />;
  }

  // 7. Research / Investigation Workspace
  if (
    simType === 'troubleshooting' ||
    taskFamily === 'troubleshooting' ||
    taskForm === 'debugging' ||
    taskId.includes('investigation') ||
    taskId.includes('zero-trust')
  ) {
    return <ResearchAnalysisWorkSurfaceAdapter {...props} />;
  }

  // 8. Document / Professional Writing Workspace
  if (
    simType === 'written_response' ||
    simType === 'written_communication' ||
    taskForm === 'written_response' ||
    taskFamily === 'marketing_strategy' ||
    taskFamily === 'hr_people'
  ) {
    return <DocumentWritingWorkSurfaceAdapter {...props} />;
  }

  // 9. Code Editor Workspace (Default for coding, technical execution)
  if (
    simType === 'coding' ||
    taskFamily === 'coding' ||
    taskFamily === 'debugging' ||
    taskFamily === 'system_design' ||
    taskForm === 'practical_execution' ||
    taskId.includes('code') ||
    taskId.includes('rate-limiter') ||
    taskId.includes('failover')
  ) {
    return <CodeWorkSurfaceAdapter {...props} />;
  }

  // 10. General Structured-Response Workspace (Universal Fallback)
  return <StructuredResponseWorkSurfaceAdapter {...props} />;
}
