import { Timestamp } from "firebase/firestore";

export interface Overflow {
  isOverflowing: boolean;
  scaleFactor: number;
}

export interface Resume {
  id: string;
  userId: string;
  title: string;
  markdown: string;
  templateId: string;
  isDefault: boolean;
  paperSize: "us-letter" | "a4";
  overflow: Overflow;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface Version {
  id: string;
  markdown: string;
  templateId: string;
  createdAt: Timestamp;
}
