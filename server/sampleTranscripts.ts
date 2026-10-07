/**
 * Official Hackathon Meeting Transcripts
 * Infinity Hack '26 - NovaWorks AI Project Manager
 */

export const OFFICIAL_HACKATHON_TRANSCRIPT = `NovaWorks Technologies - Sprint & Project Kickoff Meeting
Date: 7 October 2026
Attendees: Ayesha Khan (PM), Bilal Ahmed (PM), Hina Malik (PM), Ali Raza (Dev), Hamza Shah (Dev), Sara Noor (Dev), Usman Tariq (Dev), Zain Abbas (Dev), Maryam Asif (Dev)

[09:00] Ayesha Khan: Good morning everyone. Let's lock in Q4 commitments for our three key enterprise clients. First up: UrbanCart.
Ayesha Khan: The client wants an MVP e-commerce web storefront. Initially we considered delivering everything by 18 October, but after reviewing the backend requirements, our final delivery deadline for UrbanCart is locked in for 2026-10-20. Client name is UrbanCart Inc.
Ali Raza: What's the frontend scope for UrbanCart?
Ayesha Khan: Ali, you'll take the "Product catalog UI" which is estimated at 12 hours, deadline 2026-10-12. And you'll also build the "Demo cart UI" for 8 hours, deadline 2026-10-15. Keep them as separate tasks.
Ali Raza: Got it. What about checkout payments and live warehouse inventory?
Ayesha Khan: No, absolutely not. Stripe payments and live warehouse inventory are completely excluded from this MVP. They are future work. We are only doing a demo cart.
Hamza Shah: What about APIs for UrbanCart?
Ayesha Khan: Hamza, you will build the "Product and cart APIs" for 14 hours, due 2026-10-14.
Ali Raza: When do we do end-to-end website integration? We originally talked about 17 October.
Ayesha Khan: In our final recap, Website integration and testing is scheduled for 2026-10-19 with an estimate of 6 hours, assigned to Ali.
Hamza Shah: Hey, our freelance contact Kamran offered to help with styling.
Ayesha Khan: Kamran is not an employee of NovaWorks and cannot be assigned any internal tasks. Everything stays with our internal team.

[09:35] Bilal Ahmed: Moving on to QuickServe!
Bilal Ahmed: Client name is QuickServe Delivery Services. Project is "QuickServe Mobile App". Final release deadline is 2026-10-24.
Sara Noor: What mobile screens should I build?
Bilal Ahmed: Sara, you're assigned two separate tasks: first, "Login and profile screens" for 8 hours, due 2026-10-12. Second, "Service booking screens" for 12 hours, due 2026-10-17.
Hamza Shah: Backend APIs for QuickServe?
Bilal Ahmed: Hamza, you own "Booking and account APIs" with 16 hours of effort, deadline 2026-10-16. Keep this separate from your UrbanCart API task.
Usman Tariq: What about live GPS driver tracking, Apple Pay, and Google Maps integration?
Bilal Ahmed: Out of scope! No driver tracking, no Google Maps, and no live payment gateway for QuickServe. We are focusing purely on booking requests.
Usman Tariq: What about Mobile integration and testing?
Bilal Ahmed: We originally floated 8 hours, but we agreed it needs more device testing: the final estimate is 10 hours, due 2026-10-22, assigned to Usman Tariq.

[10:15] Hina Malik: Alright, now for the AI team: HelpDeskPro.
Hina Malik: Client name is HelpDeskPro Corp. The project name is "HelpDeskPro AI Assistant". Final delivery deadline is 2026-10-22.
Maryam Asif: I can start on document processing.
Hina Malik: Perfect. Maryam, you take "FAQ document processing", 10 hours effort, deadline 2026-10-13.
Zain Abbas: What about the core model responses?
Hina Malik: Zain, you own "Assistant answer generation", 14 hours, deadline 2026-10-17. And you also own "Human escalation flow", 6 hours, deadline 2026-10-18.
Zain Abbas: Should I also handle evaluation and testing?
Hina Malik: Initially we thought Zain, but Maryam is specialized in evaluation frameworks. So the final assignment for "Assistant evaluation and testing" goes to Maryam, 8 hours, deadline 2026-10-21.
Zain Abbas: Should we wire up live SMTP automated email alerts to escalated end users?
Hina Malik: No, real email sending, automated ticketing webhooks, and direct end-user alerts are rejected for this phase. Keep it strictly as an in-app escalation stub.

[10:45] Ayesha Khan: Let me do a quick final recap so there is zero confusion:
1. UrbanCart Website:
- Manager: Ayesha Khan
- Deadline: 2026-10-20
- Product catalog UI -> Ali (12h, 2026-10-12)
- Demo cart UI -> Ali (8h, 2026-10-15)
- Product and cart APIs -> Hamza (14h, 2026-10-14)
- Website integration and testing -> Ali (6h, 2026-10-19)
- Excluded: Payments, Inventory sync, Kamran

2. QuickServe Mobile App:
- Manager: Bilal Ahmed
- Deadline: 2026-10-24
- Login and profile screens -> Sara (8h, 2026-10-12)
- Service booking screens -> Sara (12h, 2026-10-17)
- Booking and account APIs -> Hamza (16h, 2026-10-16)
- Mobile integration and testing -> Usman (10h, 2026-10-22)
- Excluded: Maps, driver tracking, live payment gateways

3. HelpDeskPro AI Assistant:
- Manager: Hina Malik
- Deadline: 2026-10-22
- FAQ document processing -> Maryam (10h, 2026-10-13)
- Assistant answer generation -> Zain (14h, 2026-10-17)
- Human escalation flow -> Zain (6h, 2026-10-18)
- Assistant evaluation and testing -> Maryam (8h, 2026-10-21)
- Excluded: Real SMTP email sending, automated ticketing webhooks

Let's get to work! Meeting adjourned.`;

export const CHANGED_INPUT_TEST_TRANSCRIPT = `NovaWorks Technologies - Sprint Adjustment Meeting
Date: 7 October 2026
Attendees: Ayesha Khan (PM), Bilal Ahmed (PM), Hina Malik (PM), Ali Raza, Hamza Shah, Sara Noor, Usman Tariq, Zain Abbas, Maryam Asif

[Sprint Adjustment Note for Judges]
Same scope as standard sprint kickoff, except for the QuickServe testing agreement:

UrbanCart Inc:
- Project: UrbanCart Website, Manager: Ayesha Khan, Deadline: 2026-10-20.
- Tasks:
  * Product catalog UI -> Ali Raza (DEV01), 12h, 2026-10-12
  * Demo cart UI -> Ali Raza (DEV01), 8h, 2026-10-15
  * Product and cart APIs -> Hamza Shah (DEV02), 14h, 2026-10-14
  * Website integration and testing -> Ali Raza (DEV01), 6h, 2026-10-19
- Rejected: Live payments, warehouse inventory, Kamran

QuickServe Delivery Services:
- Project: QuickServe Mobile App, Manager: Bilal Ahmed, Deadline: 2026-10-24.
- Tasks:
  * Login and profile screens -> Sara Noor (DEV03), 8h, 2026-10-12
  * Service booking screens -> Sara Noor (DEV03), 12h, 2026-10-17
  * Booking and account APIs -> Hamza Shah (DEV02), 16h, 2026-10-16
  * Mobile integration and testing -> Usman Tariq (DEV04), 12h, deadline revised to 2026-10-23 (CRITICAL TEST CHANGE: 12 hours, 23 October)
- Rejected: GPS maps, driver tracking

HelpDeskPro Corp:
- Project: HelpDeskPro AI Assistant, Manager: Hina Malik, Deadline: 2026-10-22.
- Tasks:
  * FAQ document processing -> Maryam Asif (DEV06), 10h, 2026-10-13
  * Assistant answer generation -> Zain Abbas (DEV05), 14h, 2026-10-17
  * Human escalation flow -> Zain Abbas (DEV05), 6h, 2026-10-18
  * Assistant evaluation and testing -> Maryam Asif (DEV06), 8h, 2026-10-21
- Rejected: Live email dispatch, ticket sync`;

export const ADVERSARIAL_TEST_TRANSCRIPT = `Sprint Meeting with Violations to test system validation guards:
Client: GlitchCorp
Project: Impossible Project
Manager: Kamran (Note: Kamran is not a manager in our directory)
Deadline: 2026-10-10
Tasks:
- Glitch task 1 -> Ali Raza (DEV01), deadline 2026-10-15 (Exceeds project deadline of 2026-10-10)
- Glitch task 2 -> Unregistered Bob, 10h, 2026-10-09 (Bob not in directory)
- Glitch task 3 -> Ayesha Khan, 4h, 2026-10-09 (Ayesha has role MANAGER, not AGENT)`;
