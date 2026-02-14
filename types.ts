
export enum CustomerStatus {
  ACTIVE = 'Ativo',
  OVERDUE = 'Atrasado',
  EXPIRED = 'Expirado'
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  value: number;
  date: string;
  status: CustomerStatus;
  notes?: string;
  email?: string;
}

export interface Notification {
  id: string;
  message: string;
  timestamp: string;
  type: 'info' | 'success' | 'warning' | 'error';
  read: boolean;
}

export interface CRMConfig {
  webhookUrl: string;
  companyName: string;
}
