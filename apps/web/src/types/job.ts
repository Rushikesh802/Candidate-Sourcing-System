export type EmploymentType = 'full_time' | 'part_time' | 'contract' | 'internship';

export type RequisitionStatus = 'draft' | 'published' | 'closed';

export interface Job {
  id: string;
  requisition_code: string;
  slug: string;
  title: string;
  department: string;
  location: string;
  employment_type: EmploymentType | string;
  experience_range: string;
  openings: number;
  hiring_manager?: string;
  description_html?: string;
  max_salary_budget?: number | null;
  hiring_complete_by?: string | null;
  status?: RequisitionStatus | string;
  posted_at?: string | null;
  created_at?: string;
  updated_at?: string;
  application_count?: number;
}

export interface JobFilterParams {
  q?: string;
  department?: string;
  location?: string;
  experience?: string;
}
