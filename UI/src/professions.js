export const PROFESSIONS = [
  {
    id: 'student',
    label: 'Student',
    params: { chunk_size: 500, chunk_overlap: 100, top_k: 10, temperature: 0.5, similarity_threshold: 0.3 }
  },
  {
    id: 'doctor',
    label: 'Doctor',
    params: { chunk_size: 800, chunk_overlap: 150, top_k: 5, temperature: 0.2, similarity_threshold: 0.4 }
  },
  {
    id: 'lawyer',
    label: 'Lawyer',
    params: { chunk_size: 1200, chunk_overlap: 250, top_k: 8, temperature: 0.1, similarity_threshold: 0.5 }
  },
  {
    id: 'teacher',
    label: 'Teacher',
    params: { chunk_size: 600, chunk_overlap: 100, top_k: 7, temperature: 0.6, similarity_threshold: 0.3 }
  },
  {
    id: 'researcher',
    label: 'Researcher',
    params: { chunk_size: 1500, chunk_overlap: 300, top_k: 12, temperature: 0.4, similarity_threshold: 0.35 }
  },
  {
    id: 'hr',
    label: 'HR Manager',
    params: { chunk_size: 600, chunk_overlap: 100, top_k: 5, temperature: 0.3, similarity_threshold: 0.4 }
  },
  {
    id: 'engineer',
    label: 'Software Engineer',
    params: { chunk_size: 800, chunk_overlap: 150, top_k: 8, temperature: 0.2, similarity_threshold: 0.5 }
  },
  {
    id: 'accountant',
    label: 'Accountant',
    params: { chunk_size: 400, chunk_overlap: 50, top_k: 5, temperature: 0.1, similarity_threshold: 0.6 }
  },
  {
    id: 'journalist',
    label: 'Journalist',
    params: { chunk_size: 1000, chunk_overlap: 200, top_k: 10, temperature: 0.6, similarity_threshold: 0.3 }
  },
  {
    id: 'writer',
    label: 'Writer/Author',
    params: { chunk_size: 1500, chunk_overlap: 300, top_k: 15, temperature: 0.8, similarity_threshold: 0.2 }
  },
  {
    id: 'architect',
    label: 'Architect',
    params: { chunk_size: 800, chunk_overlap: 150, top_k: 6, temperature: 0.3, similarity_threshold: 0.4 }
  },
  {
    id: 'analyst',
    label: 'Data Analyst',
    params: { chunk_size: 500, chunk_overlap: 100, top_k: 8, temperature: 0.2, similarity_threshold: 0.5 }
  },
  {
    id: 'manager',
    label: 'Project Manager',
    params: { chunk_size: 600, chunk_overlap: 100, top_k: 5, temperature: 0.4, similarity_threshold: 0.3 }
  },
  {
    id: 'sales',
    label: 'Sales Executive',
    params: { chunk_size: 400, chunk_overlap: 50, top_k: 5, temperature: 0.5, similarity_threshold: 0.3 }
  },
  {
    id: 'legal',
    label: 'Legal Assistant',
    params: { chunk_size: 1000, chunk_overlap: 200, top_k: 10, temperature: 0.1, similarity_threshold: 0.5 }
  },
  {
    id: 'custom',
    label: 'CUSTOM PROFESSION',
    params: { chunk_size: 500, chunk_overlap: 100, top_k: 5, temperature: 0.7, similarity_threshold: 0.5 }
  }
];

export const BOUNDARIES = {
  chunk_size: { min: 100, max: 2000, step: 50 },
  chunk_overlap: { min: 0, max: 500, step: 10 },
  top_k: { min: 1, max: 20, step: 1 },
  temperature: { min: 0, max: 1, step: 0.1 },
  similarity_threshold: { min: 0.1, max: 0.9, step: 0.05 }
};
