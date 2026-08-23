export type Gender = 'male' | 'female' | 'other' | 'prefer_not';

export type NoticePeriod = 'immediate' | '15' | '30' | '60' | '90_plus';

export type EducationLevel = 'high_school' | 'diploma' | 'bachelors' | 'masters' | 'doctorate';

export interface ProfileData {
  user_id: string;
  email: string;
  first_name: string;
  last_name: string;
  mobile: string;
  gender?: Gender | null;
  date_of_birth?: string | null;
  current_location?: string | null;
  current_company?: string | null;
  notice_period?: NoticePeriod | null;
  current_address?: string | null;
  photo_key?: string | null;
  photo_url?: string | null;
  is_fresher: boolean;
  total_experience_years: number;
}

export interface ProfileUpdatePayload {
  first_name?: string;
  last_name?: string;
  mobile?: string;
  gender?: Gender | null;
  date_of_birth?: string | null;
  current_location?: string | null;
  current_company?: string | null;
  notice_period?: NoticePeriod | null;
  current_address?: string | null;
  is_fresher?: boolean;
}

export interface Education {
  id?: string;
  degree: string;
  specialization?: string;
  institution: string;
  year_of_passing: number;
  grade?: string;
  education_level: EducationLevel;
  sort_order?: number;
}

export interface Experience {
  id?: string;
  employer: string;
  job_title: string;
  start_date: string;
  end_date?: string | null;
  is_current: boolean;
  responsibilities?: string;
}

export interface ExperienceUpdatePayload {
  is_fresher: boolean;
  experiences: Experience[];
}
