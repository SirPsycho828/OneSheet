import { Timestamp } from "firebase/firestore";

export interface Analytics {
  userId: string;
  profileViews: number;
  pdfDownloads: number;
  lastViewedAt: Timestamp | null;
}
