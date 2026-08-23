export type RequisitionStatus = 'draft' | 'published' | 'closed';

export type EmploymentType = 'full_time' | 'part_time' | 'contract' | 'internship';

export interface Requisition {
  id: string;
  requisition_code: string;
  slug: string;
  title: string;
  department: string;
  location: string;
  employment_type: EmploymentType;
  experience_range: string;
  openings: number;
  hiring_manager: string;
  description_html: string;
  max_salary_budget?: number | null;
  hiring_complete_by?: string | null;
  status: RequisitionStatus;
  posted_at?: string | null;
  created_by?: string | null;
  created_at: string;
  updated_at: string;
  applications_count?: number;
}

export interface RequisitionFormData {
  title: string;
  department: string;
  location: string;
  employment_type: EmploymentType;
  experience_range: string;
  openings: number;
  hiring_manager: string;
  description_html: string;
  max_salary_budget?: number | null | string;
  hiring_complete_by?: string | null;
  status?: RequisitionStatus;
}

export interface RequisitionListResponse {
  items: Requisition[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export const DEPARTMENT_OPTIONS = [
  'Engineering',
  'Product',
  'Design',
  'Marketing',
  'Sales',
  'Operations',
  'Human Resources',
  'Finance',
  'Customer Support',
  'Legal',
  'Data & Analytics',
  'Security',
] as const;

export const EMPLOYMENT_TYPE_LABELS: Record<EmploymentType, string> = {
  full_time: 'Full-time',
  part_time: 'Part-time',
  contract: 'Contract',
  internship: 'Internship',
};

export const EXPERIENCE_RANGE_OPTIONS = [
  '0-1 years (Entry level)',
  '1-3 years (Junior)',
  '3-5 years (Mid-level)',
  '5-8 years (Senior)',
  '8-12 years (Staff / Principal)',
  '12+ years (Executive / Director)',
] as const;
