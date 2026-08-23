export interface NotificationItem {
  id: string;
  user_id: string;
  type: string;
  title: string;
  body: string;
  requisition_id?: string | null;
  application_id?: string | null;
  read_at?: string | null;
  created_at: string;
}

export interface NotificationListResponse {
  items: NotificationItem[];
  unread_count: number;
}
