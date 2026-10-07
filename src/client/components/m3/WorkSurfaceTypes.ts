export interface ExecutionTestResult {
  name: string;
  passed: boolean;
  expected?: string;
  actual?: string;
  message?: string;
}

export interface ExecutionResultPayload {
  success: boolean;
  execution_type: string;
  status: 'passed' | 'failed' | 'warning' | 'error';
  output: string;
  duration_ms: number;
  test_results?: ExecutionTestResult[];
  metrics?: Record<string, any>;
  errors?: string[];
}

export interface WorkSurfaceAdapterProps {
  task: any;
  candidateWork: any;
  onChange: (updatedWork: any) => void;
  onAction: (actionType: string, payload: any, updatedWork?: any) => Promise<any>;
  onExecute: (actionType: string, payload?: any) => Promise<ExecutionResultPayload | void>;
  isExecuting: boolean;
  executionResult: ExecutionResultPayload | null;
  operationalConstraints: string[];
  dynamicAlert?: any;
  readOnly?: boolean;
}
