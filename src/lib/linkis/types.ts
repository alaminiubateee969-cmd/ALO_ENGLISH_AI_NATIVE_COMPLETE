/**
 * src/lib/linkis/types.ts — typed contracts for Apache Linkis REST API
 * Reference: https://linkis.apache.org/docs/latest/api/restful-api/
 * Gateway exposes POST /api/rest_j/v1/entrance/submit etc.
 */

export type EngineType =
  | "spark-3.2.1"
  | "hive-3.1.3"
  | "python"
  | "shell"
  | "jdbc"
  | "flink-1.16"
  | "presto"
  | "trino"
  | "pipeline"
  | "seatunnel";

export type RunType = "sql" | "py" | "scala" | "hql" | "python" | "shell" | "jdbc" | "psql";

export type LinkisLabel = {
  engineType: EngineType;
  userCreator: string; // e.g. "alo-system-IDE"
  version: string; // "*-*"
};

export type LinkisSubmitRequest = {
  executionContent: { code: string; runType: RunType };
  params: {
    variable?: Record<string, string>;
    configuration?: Record<string, unknown>;
  };
  labels: LinkisLabel;
  source: { scriptPath: string };
};

export type LinkisSubmitResponse = {
  method: string;
  status: number;
  message: string;
  data: {
    execID: string;
    taskID: number;
  };
};

export type LinkisStatusResponse = {
  method: string;
  status: number;
  data: {
    execID: string;
    status: string; // Inited | Scheduled | Running | Succeed | Failed | Cancelled | Timeout
    progress?: string;
    log?: string;
  };
};

export type LinkisResultSetResponse = {
  method: string;
  status: number;
  data: {
    resultSet: string;
    metadata?: unknown;
  };
};

export type LinkisJob = {
  execID: string;
  taskID: number;
  status: string;
  engineType: EngineType;
  submittedAt: string;
};

export type AloLinkisTask =
  | "question_validation" // validate Question bank (Python)
  | "exam_analytics" // aggregate Score/Attempt via Spark SQL
  | "content_etl" // ETL StudyMaterial for RAG via Python/Shell
  | "report_generation"; // ad-hoc SQL for admin dashboards
