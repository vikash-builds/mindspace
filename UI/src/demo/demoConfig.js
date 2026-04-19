export const demoModeEnabled = String(import.meta.env.VITE_ENABLE_DEMO_MODE || 'true').toLowerCase() !== 'false';
export const demoPersona = (import.meta.env.VITE_DEMO_PERSONA || 'hr').toLowerCase();

export const hrDemoConfig = {
  title: 'HR Operations Copilot',
  subtitle: 'Grounded answers, policy-aware workflows, and action extraction from real GyanMatrix HR and IT policy documents.',
  targetFiles: [
    'Acceptance policy_GyanMatrix.pdf',
    'Clean Desk Policy.pdf',
    'GMX - IT policy.pdf',
    'GyanMatrix_Home office_Operational protocol.pdf',
    'GyanMatrix_Maternity_Paternity leave Policy.pdf',
    "Holiday list'2022.pdf",
    'Star Health_Medi Insurance Policy copy_FY2o22-2o23.pdf',
    'WFH_Self declaration.pdf',
    "Holiday List'2023.png",
  ],
  wowMoments: [
    'Ask policy questions and show citations back to uploaded GyanMatrix documents.',
    'Compare leave, home office, and IT policy rules in one grounded answer.',
    'Turn policy obligations into reminders and compliance checklists.',
    'Show retrieval across both PDF documents and the uploaded holiday-list image.',
  ],
  judgeFlow: [
    {
      step: 'Upload the GyanMatrix policy set',
      detail: 'Load the leave, IT, WFH, insurance, and holiday documents so the judges immediately see real enterprise knowledge.',
    },
    {
      step: 'Ask a real HR or compliance question',
      detail: 'Show a grounded answer with citations so the judges see this is retrieval over company policy, not generic chat.',
    },
    {
      step: 'Trigger an operational action',
      detail: 'Create a reminder or checklist directly from chat to prove the product moves from policy knowledge to execution.',
    },
    {
      step: 'Show follow-through',
      detail: 'Open Reminders to show that the action persisted across the workspace and can be tracked after the chat.',
    },
  ],
  prompts: [
    'Summarize the maternity and paternity leave policy and highlight the key eligibility rules with citations.',
    'What are the main work from home expectations according to the home office operational protocol and self declaration documents?',
    'Summarize the key employee obligations from the clean desk policy and IT policy with citations.',
    'Create a compliance checklist for a new employee based on the acceptance policy, clean desk policy, and IT policy.',
    'What holidays are listed in the uploaded 2022 and 2023 holiday documents?',
    'Create a reminder for tomorrow at 10 am to collect the signed WFH self declaration from a new employee.',
  ],
  talkTrack: [
    'MindSpace is not just answering questions from model memory; it is grounding every response in actual GyanMatrix policy documents.',
    'The assistant can compare multiple policies at once and then convert that knowledge into reminders and compliance checklists.',
    'This means HR and operations teams spend less time hunting through PDFs and more time executing correctly against company policy.',
  ],
};

export function getActiveDemoConfig() {
  if (demoPersona === 'hr') {
    return hrDemoConfig;
  }
  return hrDemoConfig;
}
