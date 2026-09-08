export type AgentNodeId =
  | 'node1_absence'
  | 'node2_leave'
  | 'node3_overtime'
  | 'node4_escalation'
  | 'node5_anomaly';

export type AgentNodeType = 'deterministic' | 'hybrid_llm';

export type ThreadStatus =
  | 'Running'
  | 'Completed'
  | 'Paused — HIL'
  | 'Waiting'
  | 'Failed';

export interface AgentNodeConfig {
  id: AgentNodeId;
  nodeNumber: number;
  name: string;
  shortName: string;
  role: string;
  type: AgentNodeType;
  technologyBadge: string;
  description: string;
  inputTables: string[];
  outputTables: string[];
  writesSummary: string;
  llmInvolved: boolean;
  llmModel?: string;
  rulesSummary: string[];
}

export interface AgentThread {
  thread_id: string; // e.g. attendance-emp_004-2026-09-07
  employee_id: string;
  employee_name: string;
  department: string;
  run_date: string;
  current_node: AgentNodeId | 'END' | 'START';
  status: ThreadStatus;
  started_at: string;
  updated_at: string;
  hil_required: boolean;
  hil_completed?: boolean;
  execution_time_ms: number;
  records_read: number;
  records_written: number;
  logs: string[];
  actions_taken: {
    node: string;
    action: string;
    details?: any;
  }[];
  flags?: Record<string, any>;
  draft_narrative?: string;
  approved_narrative?: string;
}

export interface HILQueueItem {
  id: string;
  thread_id: string;
  employee_id: string;
  employee_name: string;
  department: string;
  run_date: string;
  anomaly_types: string[];
  flags: Record<string, any>;
  draft_narrative: string;
  created_at: string;
  waiting_minutes: number;
  assigned_reviewer?: string;
  status: 'Waiting for Review' | 'Approved & Committed' | 'Rejected';
}
