import { AnomalyRecord, AnomalySummaryStats, AnomalyStatus } from '../types/anomaly';
import { MOCK_ANOMALIES, MOCK_ANOMALY_STATS } from '../data/mockAnomalies';

let anomalies: AnomalyRecord[] = [...MOCK_ANOMALIES];

export const anomalyService = {
  async getAnomalies(filters?: {
    status?: AnomalyStatus | 'All';
    severity?: string;
    department?: string;
    search?: string;
  }): Promise<AnomalyRecord[]> {
    await new Promise((r) => setTimeout(r, 150));
    let list = [...anomalies];

    if (filters?.status && filters.status !== 'All') {
      list = list.filter((a) => a.status === filters.status);
    }
    if (filters?.severity && filters.severity !== 'All') {
      list = list.filter((a) => a.detected_signal.severity === filters.severity);
    }
    if (filters?.department && filters.department !== 'All Departments') {
      list = list.filter((a) => a.department === filters.department);
    }
    if (filters?.search) {
      const q = filters.search.toLowerCase();
      list = list.filter(
        (a) =>
          a.employee_name.toLowerCase().includes(q) ||
          a.employee_id.toLowerCase().includes(q) ||
          a.detected_signal.title.toLowerCase().includes(q)
      );
    }

    return list;
  },

  async getAnomalySummary(): Promise<AnomalySummaryStats> {
    await new Promise((r) => setTimeout(r, 100));
    const total = anomalies.length;
    const critical = anomalies.filter((a) => a.detected_signal.severity === 'Critical').length;
    const warning = anomalies.filter((a) => a.detected_signal.severity === 'Warning').length;
    const underReview = anomalies.filter((a) => a.status === 'Under Review' || a.status === 'Drafted').length;
    const resolved = anomalies.filter((a) => a.status === 'Resolved').length;

    return {
      total,
      critical,
      warning,
      underReview,
      resolved,
    };
  },

  async resolveAnomaly(id: string, resolutionNote: string): Promise<AnomalyRecord> {
    await new Promise((r) => setTimeout(r, 200));
    const idx = anomalies.findIndex((a) => a.id === id);
    if (idx === -1) throw new Error('Anomaly record not found');

    anomalies[idx] = {
      ...anomalies[idx],
      status: 'Resolved',
      approved_narrative: resolutionNote,
    };

    return anomalies[idx];
  },
};
