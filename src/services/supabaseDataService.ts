import { supabase } from '../lib/supabase';

/**
 * Initial Supabase data-access layer.
 * Use these async functions from views/services as the localStorage data layer
 * is migrated. Never put a Supabase service_role key in frontend code.
 */
export const supabaseDataService = {
 
  // STUDENTS
  async listStudents() {
    const { data, error } = await supabase
      .from('students')
      .select(
        'id, student_number, first_name, last_name, email, programme, year_of_study, phone_number, academic_year, status, created_at'
      )
      .order('last_name');

    if (error) throw error;

    return (data ?? []).map((row) => ({
      supabase_id: row.id,
      student_id: row.student_number,
      name: `${row.first_name} ${row.last_name}`.trim(),
      course: row.programme,
      email: row.email ?? '',
      phone_number: row.phone_number ?? '',
      year_of_study: row.year_of_study,
      academic_year: row.academic_year ?? '2026/2027',
      status: row.status ?? 'ACTIVE',
      created_at: row.created_at,
    }));
  },

  async createStudent(input: {
    student_number: string;
    first_name: string;
    last_name: string;
    email: string | null;
    programme: string;
    year_of_study: number;
    phone_number: string | null;
    academic_year: string;
    status: string;
  }) {
    const { data, error } = await supabase
      .from('students')
      .insert({
        student_number: input.student_number,
        first_name: input.first_name,
        last_name: input.last_name,
        email: input.email,
        programme: input.programme,
        year_of_study: input.year_of_study,
        phone_number: input.phone_number,
        academic_year: input.academic_year,
        status: input.status,
      })
      .select('id, student_number')
      .single();

    if (error) throw error;
    return data;
  },

  async updateStudent(
    supabaseId: string,
    input: {
      first_name: string;
      last_name: string;
      email: string | null;
      programme: string;
      year_of_study: number;
      phone_number: string | null;
      academic_year: string;
      status: string;
    }
  ) {
    const { data, error } = await supabase
      .from('students')
      .update({
        first_name: input.first_name,
        last_name: input.last_name,
        email: input.email,
        programme: input.programme,
        year_of_study: input.year_of_study,
        phone_number: input.phone_number,
        academic_year: input.academic_year,
        status: input.status,
      })
      .eq('id', supabaseId)
      .select('id')
      .single();

    if (error) throw error;
    return data;
  },

 

  async listModules() {
    const { data, error } = await supabase
      .from('modules')
      .select('module_id, module_code, module_name, credits, semester, academic_year, lecturer_id')
      .order('module_code');
    if (error) throw error;
    return data;
  },

  async listStudentResults(studentId: string) {
    const { data, error } = await supabase
      .from('final_results')
      .select('result_id, student_id, module_id, final_mark, grade, status, academic_year, semester, calculated_at')
      .eq('student_id', studentId)
      .order('calculated_at', { ascending: false });
    if (error) throw error;
    return data;
  },

  async listMarksForModule(moduleId: string) {
    const { data, error } = await supabase
      .from('assessment_marks')
      .select('mark_id, student_id, module_id, assessment_name, mark, assessment_weight, date_captured')
      .eq('module_id', moduleId)
      .order('date_captured', { ascending: false });
    if (error) throw error;
    return data;
  },


  


};
