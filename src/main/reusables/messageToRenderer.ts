import { win } from '@/background';
import { NotificationTypes } from '@/types';

export function sendMessageToRenderer (listener: string, msg: any) {
  win.webContents.send(listener, msg);
}

export function sendNotificationToRenderer (title: string, subTitle = '', type: NotificationTypes = 'normal', isPersistent = false) {
  const notification = {
    title, subTitle, type, isPersistent
  };
  sendMessageToRenderer('notification', notification);
}
