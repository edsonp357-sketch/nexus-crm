
import { Customer, CustomerStatus, Notification } from '../types';

const STORAGE_KEY = 'nexus_crm_data';
const NOTIFICATIONS_KEY = 'nexus_crm_notifications';

export const storageService = {
  getCustomers: (): Customer[] => {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  },

  saveCustomers: (customers: Customer[]): void => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(customers));
  },

  getNotifications: (): Notification[] => {
    const data = localStorage.getItem(NOTIFICATIONS_KEY);
    return data ? JSON.parse(data) : [];
  },

  addNotification: (message: string, type: Notification['type'] = 'info'): void => {
    const notifications = storageService.getNotifications();
    const newNotif: Notification = {
      id: crypto.randomUUID(),
      message,
      timestamp: new Date().toISOString(),
      type,
      read: false
    };
    localStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify([newNotif, ...notifications].slice(0, 50)));
  },

  clearNotifications: () => {
    localStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify([]));
  }
};
