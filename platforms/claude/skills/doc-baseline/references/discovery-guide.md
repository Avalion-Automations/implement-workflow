# Discovery guide

Ask these groups in order, skipping facts already evident from the user's brief or repository. Let the user answer in their own words; do not force a preset product shape.

## 1. Outcome and boundaries

- What problem, users, and business outcome must the initiative serve?
- What is the first release, and what is explicitly out of scope?
- What existing repository, systems, policies, or decisions are authoritative?

## 2. Workflows and experience

- What are the primary user journeys, entry points, decisions, and end states?
- What must happen for validation failures, cancellation, retry, duplicate/conflict, edit, and delete?
- Which platforms, accessibility, localization, offline, or performance constraints apply?

## 3. Data and rules

- What entities, required fields, identifiers, lifecycle states, relationships, and retention/deletion rules exist?
- Which source is authoritative for each field? How should user edits, system data, AI/OCR, and unknown values reconcile?
- What calculations are allowed, prohibited, or must remain blank?

## 4. Integrations and security

- Which external systems, protocols, credentials, data classifications, and failure modes matter?
- What client/backend boundary, host allowlist, redirect policy, timeout, response-size limit, validation, logging, and privacy rules apply?
- What should users see and what should persist on integration failure?

## 5. Reporting, operations, and exports

- What dashboards, filters, totals, drill-downs, exports, column names/order/types/formats, and time-zone/locale rules are required?
- What must exports exclude? Who can generate or receive them?

## 6. Delivery and documentation governance

- Which draft topics and observable acceptance criteria are required?
- What checks, reviewers, dependencies, risks, and non-goals should the plan carry?
- Should the default copy-only, versioned, SHA-256 promotion gate apply? If not, document the alternate policy explicitly.

## Completion ledger

Maintain this table during discovery:

| Area | Decided | Proposed default | Open risk / owner |
| --- | --- | --- | --- |
| Outcome and scope | | | |
| Workflow and UX | | | |
| Data and rules | | | |
| Integrations and security | | | |
| Reporting and export | | | |
| Acceptance and governance | | | |
