export type ApplicationStatus = 'draft' | 'new' | 'reviewed' | 'shortlisted' | 'rejected';

export interface ApplicationItem {
  id: string;
  application_code: string;
  requisition_id: string;
  requisition_title: string;
  requisition_code: string;
  requisition_slug: string;
  department: string;
  location: string;
  employment_type: string;
  status: ApplicationStatus;
  submitted_at?: string | null;
  created_at: string;
}

export interface ApplicationDetail {
  id: string;
  application_code: string;
  requisition_id: string;
  requisition_title: string;
  requisition_code: string;
  requisition_slug: string;
  department: string;
  location: string;
  employment_type: string;
  status: ApplicationStatus;
  submitted_at?: string | null;
  resume_filename?: string | null;
  cover_note?: string | null;
  snapshot_json?: {
    candidate?: {
      id: string;
      email: string;
      first_name: string;
      last_name: string;
      mobile: string;
    };
    profile?: {
      gender?: string | null;
      date_of_birth?: string | null;
      current_location?: string | null;
      current_company?: string | null;
      notice_period?: string | null;
      current_address?: string | null;
      is_fresher: boolean;
      total_experience_years: number;
      photo_key?: string | null;
    };
    educations?: Array<{
      degree: string;
      specialization?: string | null;
      institution: string;
      year_of_passing: number;
      grade?: string | null;
      education_level: string;
    }>;
    experiences?: Array<{
      employer: string;
      job_title: string;
      start_date: string;
      end_date?: string | null;
      is_current: boolean;
      responsibilities?: string | null;
    }>;
    total_experience_years?: number;
    frozen_at?: string;
  } | null;
  created_at: string;
}

export interface ApplicationSubmitPayload {
  resume: File;
  cover_note?: string;
  consent_accuracy: boolean;
  consent_privacy: boolean;
}
