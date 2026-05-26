import { Timestamp } from "firebase/firestore";

export interface Overflow {
  isOverflowing: boolean;
  scaleFactor: number;
}

export interface ResumeStyles {
  preset: 'classic' | 'modern' | 'minimal' | 'technical' | 'compact';
  displayFont: string;
  bodyFont: string;
  fontSize: number;
  lineHeight: number;
  accentColor: string;
  headerAlignment: 'left' | 'center' | 'right';
  density: 'compact' | 'standard' | 'relaxed';
  sectionSpacing: 'tight' | 'normal' | 'relaxed';
  pageMargin: number;
  showHeaderDivider: boolean;
  showSectionDividers: boolean;
  bulletStyle: 'disc' | 'dash' | 'arrow' | 'square' | 'none';
  contactLayout: 'inline' | 'stacked' | 'icons';
  skillsDisplay: 'inline' | 'tags' | 'columns';
  dateAlignment: 'right' | 'inline';
  pageSize: 'us-letter' | 'a4';
}

export interface Resume {
  id: string;
  userId: string;
  title: string;
  markdown: string;
  templateId: string;
  isDefault: boolean;
  paperSize: "us-letter" | "a4";
  styles?: ResumeStyles;
  overflow: Overflow;
  showQrCode: boolean;
  /** Custom QR code destination URL (Pro feature). Null = default profile URL. */
  qrCodeUrl: string | null;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface Version {
  id: string;
  markdown: string;
  templateId: string;
  createdAt: Timestamp;
}
