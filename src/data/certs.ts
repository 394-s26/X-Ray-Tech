export interface CertRecord {
  id: string;
  name: string;
  expiryDate: string; // ISO "YYYY-MM-DD"
  addedDate: string;  // ISO "YYYY-MM-DD"
}

export const ARRT_RECORDS: CertRecord[] = [
  { id: 'arrt-1', name: 'Quality Management',            expiryDate: '2026-04-30', addedDate: '2024-04-30' },
  { id: 'arrt-2', name: 'Cardiac Imaging Specialization', expiryDate: '2026-05-20', addedDate: '2024-05-20' },
  { id: 'arrt-3', name: 'Bone Densitometry',             expiryDate: '2026-06-25', addedDate: '2024-06-25' },
  { id: 'arrt-4', name: 'CT Imaging',                    expiryDate: '2026-07-15', addedDate: '2025-07-15' },
  { id: 'arrt-5', name: 'Vascular Sonography',           expiryDate: '2026-08-09', addedDate: '2025-08-09' },
  { id: 'arrt-6', name: 'MRI Imaging',                   expiryDate: '2026-11-04', addedDate: '2025-11-04' },
  { id: 'arrt-7', name: 'Mammography',                   expiryDate: '2027-01-20', addedDate: '2026-01-20' },
];

export const IEMA_RECORDS: CertRecord[] = [
  { id: 'iema-1', name: 'Radiation Worker — Annual Refresher',  expiryDate: '2026-05-28', addedDate: '2025-05-28' },
  { id: 'iema-2', name: 'Personal Dosimetry Renewal',           expiryDate: '2026-06-30', addedDate: '2025-06-30' },
  { id: 'iema-3', name: 'Medical Imaging Tech Certification',   expiryDate: '2026-07-22', addedDate: '2024-07-22' },
  { id: 'iema-4', name: 'Lead Apron Inspection',                expiryDate: '2026-09-12', addedDate: '2025-09-12' },
  { id: 'iema-5', name: 'Fluoroscopy Operator Training',        expiryDate: '2026-12-15', addedDate: '2024-12-15' },
];
