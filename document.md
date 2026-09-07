# TATVA IDENTITY

# MASTER PRODUCT IMPLEMENTATION ROADMAP

## Professional Identity Graph for the Tatva Ecosystem

This document is the master implementation roadmap for the Tatva Professional Identity Network.

The product is not intended to be a LinkedIn clone.

It is the professional identity layer of the Tatva ecosystem.

The long-term product model is:

**Professional Identity**
+
**Verified Work History**
+
**Credentials**
+
**Reputation**
+
**Projects**
+
**Availability**
+
**Organisation Identity**
+
**Professional Network**
+
**Jobs**
+
**Gigs**
+
**Services**
+
**Tatva Vertex operational data**

The end state is a **Professional Identity Graph** where real work progressively strengthens a person's professional identity and an organisation's business identity.

---

# 0. CORE PRODUCT PRINCIPLE

The product must answer:

### For a person

Who are you?

What can you do?

What have you actually done?

Who verified it?

Which projects have you worked on?

How reliable are you?

What credentials do you have?

Are you available?

Can someone hire you?

### For an organisation

Who are you?

What do you provide?

What have you delivered?

Who works with you?

Which credentials do you hold?

Who has worked with you?

Can someone trust and hire you?

---

# 1. IMPORTANT ARCHITECTURAL PRINCIPLE

The Professional Network must NOT become a second worker-management system.

Existing Tatva Vertex entities remain authoritative for operational information.

Conceptually:

auth.users
↓
profiles
↓
professional identity
↓
worker_passport (optional)
↓
verified work history
↓
projects / engagements / skills / reputation

For organisations:

organisation
↓
business profile
↓
business passport
↓
services
↓
projects
↓
people
↓
credentials
↓
reputation

The network consumes and presents authoritative data.

It must not duplicate it unnecessarily.

---

# 2. PHASE MAP

Implement the product in these phases:

## PHASE 0

Repository and architecture discovery

## PHASE 1

Professional Identity foundation

## PHASE 2

Professional Passport and verification

## PHASE 3

Organisation / Business Passport

## PHASE 4

Professional Graph and projects

## PHASE 5

Network and social layer

## PHASE 6

Jobs and opportunity marketplace

## PHASE 7

Gig marketplace

## PHASE 8

Services and business discovery

## PHASE 9

Messaging, enquiries and professional communication

## PHASE 10

Tatva Vertex operational integration

## PHASE 11

Reputation and trust engine

## PHASE 12

Search, recommendations and discovery intelligence

## PHASE 13

Profile/business growth tools

## PHASE 14

Mobile-first worker experience

## PHASE 15

Security, privacy and compliance hardening

## PHASE 16

Performance, observability and production hardening

## PHASE 17

Analytics and product intelligence

## PHASE 18

Multilingual and accessibility expansion

## PHASE 19

Marketplace and commercialisation

## PHASE 20

Professional Identity Graph intelligence

Do not attempt all phases simultaneously.

Complete each phase sufficiently before moving to the next.

---

# PHASE 0 — REPOSITORY + ARCHITECTURE

## Objective

Understand the existing Tatva application before modifying it.

## Work

Inspect:

* Next.js
* App Router
* TypeScript
* Tailwind
* shadcn
* Supabase
* authentication
* RLS
* existing database
* existing worker passport
* engagements
* projects
* sites
* tasks
* gangs
* organisations
* existing design system

Document:

`/docs/professional-network-architecture.md`

Also document:

`/docs/professional-network-data-model.md`

and:

`/docs/professional-network-security.md`

## Deliverable

A clear boundary between:

Existing Tatva Vertex

New Tatva Identity

Future integrations

---

# PHASE 1 — PROFESSIONAL IDENTITY FOUNDATION

## Objective

Create the core professional identity layer.

## Core entities

Potentially:

profiles
profile_handles
profile_settings
profile_visibility

Do not create these if equivalent existing entities already exist.

## Profile capabilities

Support:

Name
Photo
Headline
Professional title
Location
About
Languages
Work preferences
Availability
Professional type

## Professional types

White collar
Blue collar
Skilled trade
Gig worker
Freelancer
Contractor
Technician
Supervisor
Engineer
Architect
Designer
Service professional

## Configuration

Profiles must be configuration-driven.

Do not create separate applications for different worker types.

## Deliverables

Reusable:

ProfileHeader
ProfileMetricStrip
ProfileSidebar
AvailabilityBadge
ProfileSection
ProfileEditor

Routes:

`/people`

`/people/[username]`

`/profile`

---

# PHASE 2 — PROFESSIONAL PASSPORT + VERIFICATION

## Objective

Turn a profile into a progressively verified Professional Passport.

## Passport

Sections:

Identity
Employment
Skills
Projects
Credentials
References
Availability

## Verification hierarchy

Identity Verified

Employment Verified

Project Verified

Skill Verified

Credential Verified

Tatva Verified

## Verified Work History

Integrate existing Tatva service/work history where possible.

Display:

Organisation
Project
Role
Dates
Verified work
Rating where permitted
Verification source

Distinguish:

Self-declared

Organisation verified

Project verified

Tatva verified

## Credential wallet

Support:

Certification
Licence
Training
Safety certification
Professional qualification

Statuses:

Verified
Pending
Expired
Revoked
Not submitted

## QR passport

Create public limited passport view.

Example:

`/passport/[handle]`

Do not expose private data.

---

# PHASE 3 — ORGANISATION + BUSINESS PASSPORT

## Objective

Create an organisation identity substantially more useful than a traditional company page.

## Organisation types

Employer
Service Provider
Vendor
Subcontractor
Staffing Agency
Developer
General Contractor
Manufacturer
Brand
Consultancy
Institution
Training Organisation
Recruitment Agency

## Organisation profile

Name
Logo
Cover
Tagline
Description
Industry
Location
Founded
Organisation type
Service areas
Website
Contact

## Business Passport

Verification:

Business registration
GST
PAN
Trade licence
Insurance
Professional certifications
Other applicable credentials

## Organisation metrics

Completed projects
Verified projects
Team
Years active
Reviews
Service locations

Only show metrics when backed by real data.

## Organisation sections

Overview
About
Services
Projects
People
Jobs
Credentials
Reviews
Posts

## Deliverables

Reusable:

CompanyHeader
BusinessPassport
ServiceCatalogue
OrganisationProjectGrid
OrganisationPeople
OrganisationCredentials
OrganisationReviews

Routes:

`/companies`

`/companies/[slug]`

`/org/[slug]`

---

# PHASE 4 — PROJECT + PROFESSIONAL GRAPH

## Objective

Make projects first-class entities.

A project connects:

Person
Organisation
Client
Service
Skill
Role
Milestone
Post
Credential

## Project relationships

Person → worked on → Project

Person → worked for → Organisation

Organisation → executed → Project

Organisation → hired → Organisation

Person → worked with → Person

Project → requires → Skill

Organisation → provides → Service

## Project page

Overview
Updates
Team
Companies
Gallery
Milestones

## Project portfolio

Projects should automatically become potential professional evidence.

A verified project can contribute to:

Professional Passport

Work History

Organisation Passport

Skills

Reputation

## Deliverables

`ProjectCard`

`ProjectHeader`

`ProjectTeam`

`ProjectOrganisations`

`ProjectGallery`

`ProjectMilestones`

Routes:

`/projects`

`/projects/[id]`

---

# PHASE 5 — PROFESSIONAL NETWORK

## Objective

Build the social/professional relationship graph.

## Relationships

Connection
Follow
Worked With
Former Colleague
Project Teammate
Shared Organisation
Skill Peer

## Features

Connections
Followers
Following
People discovery

## Connection states

Connect

Pending

Connected

## Follow states

Follow

Following

## Network recommendations

Eventually use:

Shared projects
Shared organisations
Shared skills
Mutual connections
Location
Industry

Do not build advanced recommendation AI yet.

Build clean relationship data first.

Routes:

`/network`

`/connections`

`/followers`

---

# PHASE 6 — JOB MARKETPLACE

## Objective

Allow organisations to publish genuine employment opportunities.

## Job types

Permanent
Contract
Temporary
Part-time
Internship

## Job model

Organisation
Role
Description
Responsibilities
Requirements
Skills
Location
Compensation
Employment type
Application process
Recruiter

## Candidate flow

Discover

View

Save

Apply

Application status

Recruiter communication

## Organisation flow

Create job

Publish

Review applications

Contact candidate

Update application status

## Routes

`/jobs`

`/jobs/[id]`

`/jobs/create`

`/jobs/[id]/applications`

---

# PHASE 7 — GIG MARKETPLACE

## Objective

Build a separate marketplace for short-duration work.

Gigs are NOT jobs.

## Gig durations

Few hours
Single shift
One day
Several days
One week
Project duration

## Gig model

Trade
Location
Date
Shift
Pay
Duration
Seats
Organisation
Site/project
Requirements
Verification

## Worker flow

Discover nearby gigs

Filter

View

Accept/apply

Track status

## Employer flow

Create gig

Specify requirements

Select workers

Manage fulfilment

## Important

The gig system must eventually integrate with:

Worker Passport
Engagement
Site
Shift
Attendance
Verified Work History

Routes:

`/gigs`

`/gigs/[id]`

---

# PHASE 8 — SERVICES + BUSINESS DISCOVERY

## Objective

Turn organisations and professionals into discoverable service providers.

## Services

Service name
Description
Coverage
Pricing model
Availability
Credentials
Project examples
Reviews

## Professional services

Freelancers and independent professionals should also be able to offer services.

Examples:

Interior design

Electrical work

Plumbing

Fabrication

Consulting

Architecture

Photography

Software development

Maintenance

## Discovery

Search:

"electrician Bengaluru"

"interior designer Hyderabad"

"RCC contractor Bengaluru"

Results should include:

People
Companies
Services
Projects

---

# PHASE 9 — MESSAGING + ENQUIRIES

## Objective

Create communication infrastructure around professional actions.

## Conversations

Person ↔ Person

Recruiter ↔ Candidate

Company ↔ Professional

Customer ↔ Service Provider

Employer ↔ Worker

Buyer ↔ Vendor

## Contextual messaging

Every conversation can optionally be associated with:

Job
Gig
Project
Service
Quote
Profile
Organisation

## Features

Messages
Read state
Attachments
Notifications
Conversation context

Do not expose private profile information automatically.

---

# PHASE 10 — TATVA VERTEX OPERATIONAL INTEGRATION

## Objective

Connect professional identity to real-world work.

This is one of the most important phases.

The target workflow:

Professional Profile
↓
Hire
↓
Engagement
↓
Project/Site
↓
Work package
↓
Task
↓
Shift
↓
Attendance
↓
DPR
↓
Productivity
↓
Payroll
↓
Verified Work History

The network should NOT duplicate operational screens.

Instead:

Identity Network
= discovery + identity + reputation + opportunity

Tatva Vertex
= operational execution

## Integration points

Worker Passport

Service Engagement

Project Site

Project Phase

Project Task

Gang Allocation

Attendance

DPR

Payroll

Service History

## Automatic identity enrichment

When a verified engagement completes:

Professional Passport can gain:

Verified Experience

Project

Verified shifts

Skills

Organisation relationship

Project contribution

Reputation signal

This should be derived from operational truth.

---

# PHASE 11 — REPUTATION + TRUST ENGINE

## Objective

Create a transparent reputation system.

Do NOT create one mysterious universal score.

Separate signals.

## Person reputation

Reliability
Work completion
Project performance
Safety
Verified reviews
Skills
Credentials
References

## Organisation reputation

Project completion
Verified clients
Service quality
Professional credentials
Worker feedback
Client reviews

## Reviews

Prefer:

Verified project review

Verified employer review

Verified client review

Verified transaction review

Avoid anonymous unverified reviews wherever possible.

---

# PHASE 12 — SEARCH + DISCOVERY INTELLIGENCE

## Objective

Make the identity graph discoverable.

Universal search:

People
Companies
Projects
Jobs
Gigs
Skills
Services
Posts

## Search progression

Phase 1:

PostgreSQL/full-text search

Then:

weighted ranking

Then:

semantic/vector search where justified

Then:

graph-aware recommendations

## Search ranking signals

Relevance

Verification

Location

Availability

Experience

Skills

Project history

Reputation

User intent

Do not allow popularity alone to dominate.

---

# PHASE 13 — PROFILE + BUSINESS GROWTH TOOLS

## Objective

Help users improve their professional identity.

## Person tools

Profile completion

Passport completion

Missing credentials

Skill verification opportunities

Project portfolio recommendations

Reference requests

Profile analytics

Profile views

Search appearances

## Organisation tools

Business Passport completion

Missing verification

Service completeness

Project portfolio

Business profile views

Enquiry analytics

Candidate discovery

Job performance

---

# PHASE 14 — MOBILE-FIRST WORKER EXPERIENCE

## Objective

Make the network genuinely accessible to blue-collar and field professionals.

Mobile priorities:

Simple language

Large tap targets

Low typing

Fast loading

Clear actions

Location awareness

Availability

Nearby gigs

Professional QR

Work history

Credentials

Messages

## Mobile navigation

Home

Network

Post

Jobs

Profile

## Future

Voice-assisted profile creation

Multilingual onboarding

Document capture

Credential scanning

QR passport

Offline-aware experiences where relevant

---

# PHASE 15 — SECURITY + PRIVACY + COMPLIANCE

## Objective

Protect professional and operational identity.

## Never publicly expose

Aadhaar

Bank information

Payroll

PF

ESI

Medical information

Emergency contacts

Home address

Raw attendance

Sensitive HR information

Internal disciplinary information

## Architecture

RLS

Server-side authorization

Role-based access

Organisation permissions

Profile visibility

Document permissions

Audit logs

## Visibility levels

Public

Connections

Recruiters

Organisation members

Private

Every sensitive field must have an explicit access policy.

---

# PHASE 16 — PRODUCTION HARDENING

## Objective

Prepare the system for real usage.

## Performance

Server components

Query optimisation

Pagination

Caching

Image optimisation

Lazy loading

Virtualisation for very large lists

## Reliability

Error boundaries

Loading states

Skeletons

Retries

Graceful degradation

## Observability

Structured logging

Error monitoring

Performance monitoring

Database query monitoring

Important user-action telemetry

---

# PHASE 17 — PRODUCT ANALYTICS

## Objective

Understand whether the identity network is actually useful.

Track events such as:

Profile created

Passport completed

Verification submitted

Verification completed

Project viewed

Professional searched

Profile viewed

Connection created

Follow created

Job viewed

Job applied

Gig viewed

Gig accepted

Service viewed

Quote requested

Message started

Organisation followed

Project viewed

## Important product metrics

Profile completion

Passport verification rate

Verified professionals

Verified organisations

Verified projects

Search → profile conversion

Profile → contact conversion

Profile → hire conversion

Job application conversion

Gig fulfilment rate

Service enquiry conversion

Repeat professional activity

---

# PHASE 18 — MULTILINGUAL + ACCESSIBILITY EXPANSION

## Languages

Architecture should support:

English

Hindi

Kannada

Tamil

Telugu

Marathi

Bengali

Gujarati

Do not hardcode UI strings throughout components.

Use an internationalisation architecture.

## Accessibility

WCAG-aligned patterns

Keyboard navigation

Screen reader support

Large touch targets

Clear language

High contrast

Non-colour status indicators

---

# PHASE 19 — MARKETPLACE + COMMERCIALISATION

## Objective

Eventually create commercial value around the identity graph.

Potential capabilities:

Recruiter tools

Premium candidate discovery

Verified business discovery

Service marketplace

Vendor discovery

Staffing marketplace

Project subcontractor discovery

Professional subscriptions

Organisation subscriptions

Recruitment tools

Sponsored opportunities

Business profile enhancements

Do not implement monetisation prematurely.

Build the identity graph first.

---

# PHASE 20 — PROFESSIONAL IDENTITY GRAPH INTELLIGENCE

This is the long-term differentiator.

Once enough verified relationships exist, the graph can answer:

Who has worked with whom?

Who has worked on similar projects?

Which workers have demonstrated a particular skill?

Which organisations repeatedly work with reliable professionals?

Which contractors have completed similar projects?

Which professionals are available nearby?

Which skills are becoming scarce?

Which projects require particular expertise?

Which workers have demonstrated a skill across multiple verified projects?

Which companies consistently deliver particular services?

## Graph structure

Person
↔ Organisation
↔ Project
↔ Skill
↔ Service
↔ Credential
↔ Job
↔ Gig
↔ Location
↔ Reputation

This can eventually power:

Candidate recommendations

Professional recommendations

Vendor recommendations

Project staffing

Skill recommendations

Training recommendations

Gig recommendations

Job recommendations

Business discovery

Workforce planning

---

# CROSS-PHASE ENGINEERING RULES

## Rule 1 — One source of truth

Do not duplicate existing Tatva operational data.

## Rule 2 — Domain entities must be canonical

A person should have one professional identity.

An organisation should have one business identity.

A project should have one project entity.

## Rule 3 — Derived information should remain derived

For example:

Verified shifts

should come from verified work records where possible.

Do not manually maintain duplicate counters.

## Rule 4 — Public APIs must be privacy-safe

Never return sensitive fields simply because the frontend currently does not display them.

## Rule 5 — RLS is mandatory

Security must exist at the database/server boundary.

## Rule 6 — Mobile is not a later CSS task

Every major feature must be designed responsively.

## Rule 7 — Empty states are real product states

Never manufacture data to make a screen look full.

## Rule 8 — No giant components

Keep feature boundaries clean.

## Rule 9 — No fake backend behaviour

Do not simulate successful persistence.

## Rule 10 — No LinkedIn cloning

Use familiar interaction patterns.

Do not reproduce LinkedIn's UI or information architecture pixel-for-pixel.

---

# COMPONENT SYSTEM

Maintain reusable primitives such as:

<AppShell />

<GlobalHeader />

<DesktopSidebar />

<MobileBottomNav />

<ProfileHeader />

<CompanyHeader />

<ProfileMetricStrip />

<MetricCard />

<PassportStrength />

<BusinessPassport />

<VerificationBadge />

<VerificationTooltip />

<AvailabilityBadge />

<ExperienceCard />

<VerifiedExperienceCard />

<ServiceLedger />

<SkillChip />

<CredentialCard />

<ProjectCard />

<ProjectPortfolioGrid />

<PersonCard />

<CompanyCard />

<JobCard />

<GigCard />

<ServiceCard />

<PostCard />

<PostComposer />

<ReviewCard />

<RecommendationCard />

<EntitySearch />

<FilterSidebar />

<EmptyState />

<SkeletonCard />

---

# ROUTING TARGET

Public/network:

/feed
/people
/people/[username]
/companies
/companies/[slug]
/jobs
/jobs/[id]
/gigs
/gigs/[id]
/projects
/projects/[id]
/services
/skills
/search
/network
/connections
/followers
/messages
/notifications

Professional Passport:

/passport
/passport/experience
/passport/projects
/passport/skills
/passport/certifications
/passport/documents
/passport/reputation
/passport/availability

Organisation:

/org/[slug]
/org/[slug]/about
/org/[slug]/services
/org/[slug]/projects
/org/[slug]/people
/org/[slug]/jobs
/org/[slug]/posts
/org/[slug]/credentials
/org/[slug]/reviews

Settings:

/settings

---

# DEVELOPMENT PROCESS FOR EVERY PHASE

Before beginning a phase:

1. Inspect existing implementation.
2. Identify reusable code.
3. Identify existing Tatva entities.
4. Update architecture documentation.
5. Define domain changes.
6. Define database changes if necessary.
7. Define RLS/security.
8. Implement domain layer.
9. Implement data-access layer.
10. Implement UI.
11. Implement loading/empty/error states.
12. Implement responsive behaviour.
13. Test.
14. Run TypeScript.
15. Run ESLint.
16. Run production build.
17. Fix issues.
18. Review against product requirements.

---

# DATA POLICY

This roadmap does NOT authorise creating mock data.

Do not:

* seed fake users
* seed fake organisations
* seed fake projects
* seed fake jobs
* seed fake gigs
* seed fake reviews
* seed fake credentials
* fabricate verification
* fabricate ratings
* fabricate work history

I will provide demo/mock data separately when required.

Until then:

Use actual available repository/database data.

Where data does not exist:

build the architecture and show polished empty states.

---

# DESIGN DIRECTION

The product should feel:

Premium
Trustworthy
Modern
Professional
Human
Enterprise-grade
Accessible

Use the existing Tatva design system where available.

Suggested direction:

Background:
#F4F6F8

Primary:
#111827

Accent:
#4F46E5

Success:
Emerald

Warning:
Amber

Error:
Rose

Verification:
Blue/Cyan

Typography:

Inter or Geist.

Avoid:

Excessive gradients
Huge text
Over-rounded interfaces
Excessive pills
Generic AI dashboards
Dense HRMS layouts
Industrial clichés
Unnecessary animation

---

# PRODUCT NORTH STAR

The final system should evolve towards:

## PERSON

Identity
→ Skills
→ Credentials
→ Work
→ Projects
→ Reputation
→ Availability
→ Opportunities

## ORGANISATION

Identity
→ Verification
→ Services
→ Projects
→ People
→ Reputation
→ Opportunities

## PROJECT

Project
→ Organisations
→ People
→ Skills
→ Services
→ Milestones
→ Verified outcomes

## WORK

Profile
→ Opportunity
→ Engagement
→ Project
→ Execution
→ Verified work
→ Reputation
→ Future opportunities

---

# FINAL NORTH-STAR EXPERIENCE

A person should eventually be able to:

Create professional identity
↓
Verify identity
↓
Add skills
↓
Connect credentials
↓
Work on a Tatva project
↓
Complete verified work
↓
Automatically strengthen Professional Passport
↓
Build verified reputation
↓
Become discoverable
↓
Receive relevant opportunities
↓
Accept work
↓
Generate more verified history

An organisation should eventually be able to:

Create Business Passport
↓
Verify business
↓
Publish services
↓
Execute projects
↓
Build verified project history
↓
Build reputation
↓
Discover professionals
↓
Hire workers
↓
Publish jobs/gigs
↓
Complete work
↓
Strengthen business identity

---

# EXECUTION STRATEGY

Do not attempt to finish the entire roadmap in one pass.

Work sequentially.

At the beginning of every phase:

* inspect the current code
* inspect existing data
* inspect previous architecture decisions

At the end:

* test
* validate
* clean up
* document
* move to the next phase

Never sacrifice architecture quality just to increase the number of completed screens.

The objective is not:

"Build a LinkedIn clone."

The objective is:

# BUILD THE PROFESSIONAL IDENTITY GRAPH FOR THE TATVA ECOSYSTEM.

Start with the current repository state and determine the next incomplete phase.

Then implement that phase completely before moving forward.
