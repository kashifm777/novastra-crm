import type { Activity, AppState, Customer, Deal, NotificationItem, Rep, Task } from './types';

function daysAgoISO(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString();
}

function plusDaysISO(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() + n);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function monthsAgoISO(months: number, day = 15): string {
  const d = new Date();
  d.setMonth(d.getMonth() - months);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  return `${y}-${m}-${String(day).padStart(2, '0')}`;
}

export function buildSeed(): AppState {
  const reps: Rep[] = [
    { id: 'rep-1', name: 'Sarah Chen', email: 'sarah.chen@novastra.com', phone: '(415) 555-0132', role: 'Senior Sales Rep', status: 'active', createdAt: daysAgoISO(720) },
    { id: 'rep-2', name: 'Marcus Rivera', email: 'marcus.rivera@novastra.com', phone: '(312) 555-0177', role: 'Account Executive', status: 'active', createdAt: daysAgoISO(540) },
    { id: 'rep-3', name: 'Emily Novak', email: 'emily.novak@novastra.com', phone: '(617) 555-0143', role: 'Sales Representative', status: 'active', createdAt: daysAgoISO(420) },
    { id: 'rep-4', name: 'David Okafor', email: 'david.okafor@novastra.com', phone: '(206) 555-0189', role: 'Sales Manager', status: 'active', createdAt: daysAgoISO(900) },
    { id: 'rep-5', name: 'James Holt', email: 'james.holt@novastra.com', phone: '(512) 555-0125', role: 'Sales Representative', status: 'inactive', createdAt: daysAgoISO(810) },
  ];

  const customers: Customer[] = [
    { id: 'cus-1', name: 'Lena Fischer', company: 'Northwind Logistics', email: 'lena@northwindlog.com', phone: '(212) 555-0114', location: 'New York, NY', status: 'active', repId: 'rep-1', notes: 'Fleet tracking roll-out planned for Q3. Prefers calls over email.', createdAt: daysAgoISO(160) },
    { id: 'cus-2', name: 'Omar Haddad', company: 'Brightline Health', email: 'o.haddad@brightlinehealth.org', phone: '(415) 555-0148', location: 'San Francisco, CA', status: 'active', repId: 'rep-3', notes: 'Compliance review required before any rollout. Two decision makers.', createdAt: daysAgoISO(120) },
    { id: 'cus-3', name: 'Grace Umeh', company: 'Umeh & Sons Retail', email: 'grace@umehsons.co', phone: '(713) 555-0192', location: 'Houston, TX', status: 'lead', repId: 'rep-2', notes: 'Inbound via website demo request. Budget approved for Q2.', createdAt: daysAgoISO(38) },
    { id: 'cus-4', name: 'Tomás Álvarez', company: 'Alvarez Freight Co.', email: 'tomas@alvarezfreight.mx', phone: '(602) 555-0166', location: 'Phoenix, AZ', status: 'active', repId: 'rep-2', notes: 'Existing customer on the Growth plan. Upsell candidate for analytics add-on.', createdAt: daysAgoISO(260) },
    { id: 'cus-5', name: 'Kirsten Lund', company: 'Lund Architectural LLP', email: 'kirsten@lundarch.com', phone: '(303) 555-0171', location: 'Denver, CO', status: 'lead', repId: 'rep-1', notes: 'Founder-led team, 40 employees. Requested pricing sheet.', createdAt: daysAgoISO(55) },
    { id: 'cus-6', name: 'Priya Raman', company: 'MedSpark Diagnostics', email: 'p.raman@medspark.com', phone: '(858) 555-0139', location: 'San Diego, CA', status: 'active', repId: 'rep-4', notes: 'Won in February. Expansion tracks for two new labs.', createdAt: daysAgoISO(300) },
    { id: 'cus-7', name: 'Jack Whitman', company: 'Whitman Media Group', email: 'jack@whitmanmedia.tv', phone: '(917) 555-0158', location: 'New York, NY', status: 'churned', repId: 'rep-3', notes: 'Churned in December — budget freeze. Revisit after their funding round.', createdAt: daysAgoISO(410) },
    { id: 'cus-8', name: 'Fatima Noori', company: 'Noori Trading Est.', email: 'fatima@nooritrading.com', phone: '(646) 555-0127', location: 'Brooklyn, NY', status: 'lead', repId: 'rep-1', notes: 'Warm intro from Northwind. First discovery call held.', createdAt: daysAgoISO(21) },
    { id: 'cus-9', name: 'Peter Brandt', company: 'Brandt Engineering', email: 'peter@brandteng.com', phone: '(312) 555-0184', location: 'Chicago, IL', status: 'active', repId: 'rep-4', notes: 'Enterprise account, three-year term. Annual renewal in October.', createdAt: daysAgoISO(500) },
    { id: 'cus-10', name: 'Alicia Fontaine', company: 'Fontaine Hotels', email: 'alicia@fontainehotels.com', phone: '(305) 555-0142', location: 'Miami, FL', status: 'active', repId: 'rep-2', notes: 'Multi-property rollout. Needs procurement sign-off.', createdAt: daysAgoISO(95) },
    { id: 'cus-11', name: 'Oleg Petrov', company: 'Petrov Software Labs', email: 'oleg@petrovlabs.io', phone: '(408) 555-0198', location: 'San Jose, CA', status: 'lead', repId: 'rep-2', notes: 'Technical buyer evaluated API docs. Trial in progress.', createdAt: daysAgoISO(14) },
    { id: 'cus-12', name: 'Hannah Kim', company: 'Kim Apparel Co.', email: 'hannah@kimapparel.com', phone: '(206) 555-0119', location: 'Seattle, WA', status: 'inactive', repId: 'rep-3', notes: 'Postponed expansion until next fiscal year.', createdAt: daysAgoISO(230) },
    { id: 'cus-13', name: 'Miguel Santos', company: 'Santos AgriSupply', email: 'miguel@santosagri.com', phone: '(559) 555-0133', location: 'Fresno, CA', status: 'lead', repId: 'rep-2', notes: 'Considering the Starter plan for two warehouses.', createdAt: daysAgoISO(5) },
  ];

  const deals: Deal[] = [
    // Closed — won (spreads revenue across recent months)
    { id: 'deal-1', name: 'Northwind Platform License', customerId: 'cus-1', repId: 'rep-1', value: 86000, expectedCloseDate: monthsAgoISO(5, 12), stage: 'closed', outcome: 'won', probability: 100, notes: 'Annual enterprise license, ramped in two quarters.', closedAt: monthsAgoISO(5, 12), createdAt: monthsAgoISO(7, 3), updatedAt: monthsAgoISO(5, 12) },
    { id: 'deal-2', name: 'MedSpark Lab Expansion', customerId: 'cus-6', repId: 'rep-4', value: 54000, expectedCloseDate: monthsAgoISO(4, 20), stage: 'closed', outcome: 'won', probability: 100, notes: 'Added two labs to the contract.', closedAt: monthsAgoISO(4, 20), createdAt: monthsAgoISO(6, 18), updatedAt: monthsAgoISO(4, 20) },
    { id: 'deal-3', name: 'Brandt Enterprise Renewal', customerId: 'cus-9', repId: 'rep-4', value: 118000, expectedCloseDate: monthsAgoISO(3, 8), stage: 'closed', outcome: 'won', probability: 100, notes: 'Three-year renewal with 8% uplift.', closedAt: monthsAgoISO(3, 8), createdAt: monthsAgoISO(5, 22), updatedAt: monthsAgoISO(3, 8) },
    { id: 'deal-4', name: 'Alvarez Growth Plan Upgrade', customerId: 'cus-4', repId: 'rep-2', value: 27500, expectedCloseDate: monthsAgoISO(2, 17), stage: 'closed', outcome: 'won', probability: 100, notes: 'Upgraded from Starter to Growth tier.', closedAt: monthsAgoISO(2, 17), createdAt: daysAgoISO(150), updatedAt: monthsAgoISO(2, 17) },
    { id: 'deal-5', name: 'Fontaine Hotels Pilot', customerId: 'cus-10', repId: 'rep-2', value: 42000, expectedCloseDate: daysAgoISO(24), stage: 'closed', outcome: 'won', probability: 100, notes: 'Six-month pilot across four properties, converts to annual.', closedAt: daysAgoISO(24), createdAt: daysAgoISO(95), updatedAt: daysAgoISO(24) },
    { id: 'deal-6', name: 'Brightline Onboarding Suite', customerId: 'cus-2', repId: 'rep-3', value: 33500, expectedCloseDate: daysAgoISO(6), stage: 'closed', outcome: 'won', probability: 100, notes: 'Signed this month after compliance review.', closedAt: daysAgoISO(6), createdAt: daysAgoISO(120), updatedAt: daysAgoISO(6) },
    // Closed — lost
    { id: 'deal-7', name: 'Whitman Media Annual', customerId: 'cus-7', repId: 'rep-3', value: 49000, expectedCloseDate: monthsAgoISO(4, 9), stage: 'closed', outcome: 'lost', probability: 0, notes: 'Lost to budget freeze; competitor offered a 30% discount.', closedAt: monthsAgoISO(4, 9), createdAt: daysAgoISO(400), updatedAt: monthsAgoISO(4, 9) },
    { id: 'deal-8', name: 'Kim Apparel Workflow', customerId: 'cus-12', repId: 'rep-3', value: 18000, expectedCloseDate: monthsAgoISO(2, 25), stage: 'closed', outcome: 'lost', probability: 0, notes: 'Deferred to next fiscal year; revisit later.', closedAt: monthsAgoISO(2, 25), createdAt: daysAgoISO(220), updatedAt: monthsAgoISO(2, 25) },
    // Open pipeline
    { id: 'deal-9', name: 'Lund Studio CRM Rollout', customerId: 'cus-5', repId: 'rep-1', value: 22500, expectedCloseDate: plusDaysISO(34), stage: 'proposal', outcome: 'open', probability: 60, notes: 'Proposal sent, awaiting partner sign-off.', closedAt: null, createdAt: daysAgoISO(30), updatedAt: daysAgoISO(9) },
    { id: 'deal-10', name: 'Noori Trading Starter Package', customerId: 'cus-8', repId: 'rep-1', value: 9600, expectedCloseDate: plusDaysISO(21), stage: 'contacted', outcome: 'open', probability: 30, notes: 'Second call scheduled. Interested in invoicing module.', closedAt: null, createdAt: daysAgoISO(18), updatedAt: daysAgoISO(4) },
    { id: 'deal-11', name: 'Umeh Retail Inventory Suite', customerId: 'cus-3', repId: 'rep-2', value: 34800, expectedCloseDate: plusDaysISO(27), stage: 'qualified', outcome: 'open', probability: 45, notes: 'Budget confirmed; needs IT security questionnaire.', closedAt: null, createdAt: daysAgoISO(36), updatedAt: daysAgoISO(7) },
    { id: 'deal-12', name: 'Petrov Labs API Integration', customerId: 'cus-11', repId: 'rep-2', value: 61000, expectedCloseDate: plusDaysISO(46), stage: 'negotiation', outcome: 'open', probability: 75, notes: 'Redlines on MSA with legal; procurement in week 2.', closedAt: null, createdAt: daysAgoISO(60), updatedAt: daysAgoISO(3) },
    { id: 'deal-13', name: 'Santos Starter Rollout', customerId: 'cus-13', repId: 'rep-2', value: 7400, expectedCloseDate: plusDaysISO(39), stage: 'new-lead', outcome: 'open', probability: 15, notes: 'New inbound lead. Needs discovery call.', closedAt: null, createdAt: daysAgoISO(5), updatedAt: daysAgoISO(5) },
    { id: 'deal-14', name: 'Northwind Fleet Analytics', customerId: 'cus-1', repId: 'rep-1', value: 52000, expectedCloseDate: plusDaysISO(18), stage: 'negotiation', outcome: 'open', probability: 80, notes: 'Analytics expansion; close to verbal agreement.', closedAt: null, createdAt: daysAgoISO(75), updatedAt: daysAgoISO(2) },
    { id: 'deal-15', name: 'Brightline Telehealth Add-on', customerId: 'cus-2', repId: 'rep-3', value: 26000, expectedCloseDate: plusDaysISO(52), stage: 'qualified', outcome: 'open', probability: 40, notes: 'Evaluating competitors; pilot feedback positive.', closedAt: null, createdAt: daysAgoISO(48), updatedAt: daysAgoISO(6) },
    { id: 'deal-16', name: 'Brandt Analytics Module', customerId: 'cus-9', repId: 'rep-4', value: 44000, expectedCloseDate: plusDaysISO(63), stage: 'contacted', outcome: 'open', probability: 25, notes: 'Upsell conversation after renewal kickoff.', closedAt: null, createdAt: daysAgoISO(12), updatedAt: daysAgoISO(8) },
    { id: 'deal-17', name: 'Fontaine Laundry Systems', customerId: 'cus-10', repId: 'rep-2', value: 15800, expectedCloseDate: plusDaysISO(30), stage: 'proposal', outcome: 'open', probability: 55, notes: 'Proposal delivered for two pilot properties.', closedAt: null, createdAt: daysAgoISO(28), updatedAt: daysAgoISO(10) },
    { id: 'deal-18', name: 'MedSpark Compliance Rebuild', customerId: 'cus-6', repId: 'rep-4', value: 37000, expectedCloseDate: plusDaysISO(71), stage: 'new-lead', outcome: 'open', probability: 20, notes: 'New lead from success team referral.', closedAt: null, createdAt: daysAgoISO(9), updatedAt: daysAgoISO(9) },
  ];

  const tasks: Task[] = [
    { id: 'task-1', title: 'Send Lind pricing sheet', description: 'Follow up with the reworked proposal pricing and utility discounts.', dueDate: plusDaysISO(-4), priority: 'high', status: 'open', repId: 'rep-1', customerId: 'cus-5', dealId: 'deal-9', completedAt: null, createdAt: daysAgoISO(11) },
    { id: 'task-2', title: 'Book discovery call with Santos', description: 'First-touch call, walk through warehouse workflows.', dueDate: plusDaysISO(-2), priority: 'medium', status: 'open', repId: 'rep-2', customerId: 'cus-13', dealId: 'deal-13', completedAt: null, createdAt: daysAgoISO(4) },
    { id: 'task-3', title: 'Collect Umeh security questionnaire', description: 'IT security form goes to procurement before proposal stage.', dueDate: plusDaysISO(0), priority: 'high', status: 'open', repId: 'rep-2', customerId: 'cus-3', dealId: 'deal-11', completedAt: null, createdAt: daysAgoISO(6) },
    { id: 'task-4', title: 'Prep negotiation term sheet for Petrov', description: 'Final pricing table for the MSA review call.', dueDate: plusDaysISO(0), priority: 'high', status: 'in-progress', repId: 'rep-2', customerId: 'cus-11', dealId: 'deal-12', completedAt: null, createdAt: daysAgoISO(8) },
    { id: 'task-5', title: 'Contract redline review — Northwind', description: 'Legal turnaround on the analytics expansion contract.', dueDate: plusDaysISO(2), priority: 'high', status: 'open', repId: 'rep-1', customerId: 'cus-1', dealId: 'deal-14', completedAt: null, createdAt: daysAgoISO(9) },
    { id: 'task-6', title: 'Demo telehealth add-on to Brightline', description: 'Show pilot dashboard to clinical leads.', dueDate: plusDaysISO(3), priority: 'medium', status: 'open', repId: 'rep-3', customerId: 'cus-2', dealId: 'deal-15', completedAt: null, createdAt: daysAgoISO(5) },
    { id: 'task-7', title: 'Quarterly check-in with Brandt', description: 'Renewal relationship maintenance + analytics upsell intro.', dueDate: plusDaysISO(6), priority: 'low', status: 'open', repId: 'rep-4', customerId: 'cus-9', dealId: 'deal-16', completedAt: null, createdAt: daysAgoISO(3) },
    { id: 'task-8', title: 'Renewal paperwork for Alvarez', description: 'Countersigned PDFs to account management.', dueDate: plusDaysISO(9), priority: 'medium', status: 'open', repId: 'rep-2', customerId: 'cus-4', dealId: null, completedAt: null, createdAt: daysAgoISO(2) },
    { id: 'task-9', title: 'Update Fontaine rollout plan', description: 'Property-by-property timeline after pilot review.', dueDate: plusDaysISO(12), priority: 'medium', status: 'open', repId: 'rep-2', customerId: 'cus-10', dealId: 'deal-17', completedAt: null, createdAt: daysAgoISO(10) },
    { id: 'task-10', title: 'Qualify MedSpark compliance lead', description: 'Scope the rebuild lead sources with James on intake.', dueDate: plusDaysISO(15), priority: 'medium', status: 'open', repId: 'rep-4', customerId: 'cus-6', dealId: 'deal-18', completedAt: null, createdAt: daysAgoISO(1) },
    { id: 'task-11', title: 'Send Noori follow-up email', description: 'Recap the invoicing module demo and next steps.', dueDate: plusDaysISO(-6), priority: 'low', status: 'completed', repId: 'rep-1', customerId: 'cus-8', dealId: 'deal-10', completedAt: daysAgoISO(5), createdAt: daysAgoISO(14) },
    { id: 'task-12', title: 'Confirm Alvarez upgrade order form', description: 'Upgrade paperwork countersigned.', dueDate: plusDaysISO(-9), priority: 'medium', status: 'completed', repId: 'rep-2', customerId: 'cus-4', dealId: 'deal-4', completedAt: daysAgoISO(8), createdAt: daysAgoISO(20) },
    { id: 'task-13', title: 'Compliance call with Brightline', description: 'Data retention questions answered; cleared for signature.', dueDate: plusDaysISO(-5), priority: 'high', status: 'completed', repId: 'rep-3', customerId: 'cus-2', dealId: 'deal-6', completedAt: daysAgoISO(6), createdAt: daysAgoISO(12) },
  ];

  const activities: Activity[] = [
    { id: 'act-1', entityType: 'deal', entityId: 'deal-6', message: 'Deal marked Won — $33,500', createdAt: daysAgoISO(6) },
    { id: 'act-2', entityType: 'deal', entityId: 'deal-14', message: 'Stage moved to Negotiation', createdAt: daysAgoISO(2) },
    { id: 'act-3', entityType: 'customer', entityId: 'cus-13', message: 'Customer added to CRM', createdAt: daysAgoISO(5) },
    { id: 'act-4', entityType: 'deal', entityId: 'deal-13', message: 'Deal created — $7,400', createdAt: daysAgoISO(5) },
    { id: 'act-5', entityType: 'task', entityId: 'task-3', message: 'Task assigned to Marcus Rivera', createdAt: daysAgoISO(6) },
    { id: 'act-6', entityType: 'deal', entityId: 'deal-11', message: 'Stage moved to Qualified', createdAt: daysAgoISO(7) },
    { id: 'act-7', entityType: 'customer', entityId: 'cus-11', message: 'Customer added to CRM', createdAt: daysAgoISO(14) },
    { id: 'act-8', entityType: 'deal', entityId: 'deal-5', message: 'Deal marked Won — $42,000', createdAt: daysAgoISO(24) },
    { id: 'act-9', entityType: 'task', entityId: 'task-11', message: 'Task completed', createdAt: daysAgoISO(5) },
    { id: 'act-10', entityType: 'deal', entityId: 'deal-12', message: 'Stage moved to Negotiation', createdAt: daysAgoISO(3) },
  ];

  const notifications: NotificationItem[] = [
    { id: 'ntf-1', type: 'deal-won', title: 'Deal won 🎉', message: 'Brightline Onboarding Suite ($33,500) was marked Won by Emily Novak.', dedupeKey: 'deal-outcome:deal-6:won', read: false, createdAt: daysAgoISO(6), link: '/deals/deal-6' },
    { id: 'ntf-2', type: 'task-assigned', title: 'New task assigned', message: '"Send Lind pricing sheet" was assigned to Sarah Chen (high priority).', dedupeKey: 'task-assigned:task-1:rep-1', read: false, createdAt: daysAgoISO(11), link: '/tasks' },
    { id: 'ntf-3', type: 'deal-stage', title: 'Deal stage updated', message: 'Petrov Labs API Integration moved to Negotiation.', dedupeKey: 'deal-stage:deal-12:negotiation', read: false, createdAt: daysAgoISO(3), link: '/deals/deal-12' },
    { id: 'ntf-4', type: 'task-overdue', title: 'Task overdue', message: '"Send Lind pricing sheet" is past its due date.', dedupeKey: 'task-overdue:task-1', read: false, createdAt: plusDaysISO(0), link: '/tasks' },
    { id: 'ntf-5', type: 'deal-assigned', title: 'Deal assigned', message: 'Santos Starter Rollout was assigned to Marcus Rivera.', dedupeKey: 'deal-assigned:deal-13:rep-2', read: true, createdAt: daysAgoISO(5), link: '/deals/deal-13' },
    { id: 'ntf-6', type: 'deal-lost', title: 'Deal lost', message: 'Kim Apparel Workflow ($18,000) was marked Lost.', dedupeKey: 'deal-outcome:deal-8:lost', read: true, createdAt: monthsAgoISO(2, 25), link: '/deals/deal-8' },
  ];

  return { customers, reps, deals, tasks, notifications, activities };
}
