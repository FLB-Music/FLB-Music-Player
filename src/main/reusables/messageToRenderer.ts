import { win } from '@/background';
import { NotificationTypes } from '@/types';

export function sendMessageToRenderer (listener: string, msg: any) {
  win.webContents.send(listener, msg);
}

export function sendNotificationToRenderer (title: string, subTitle = '', type: NotificationTypes = 'normal', isPersistent = false, values?: Record<string, string | number>) {
  const notification = {
    title, subTitle, type, isPersistent, values
  };
  sendMessageToRenderer('notification', notification);
}
