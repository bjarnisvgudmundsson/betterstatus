import type { Client } from "./types";

export const INITIAL_CLIENTS: Client[] = [
  {
    id: "lsh", slug: "lsh",
    name: "Landspítali — LSH",
    sector: "Public Sector · Healthcare",
    pageTitle: "DPS Tender — Category A Delivery Status",
    overallState: "at_risk",
    lastUpdated: "2026-03-06T09:15:00",
    summary: "Bid preparation is progressing on two fronts. Technical specification is on track; the commercial section has an open dependency on legal sign-off.",
    purchaserMode: "direct",
    pings: [
      { id: "ping-1", author: "Sigríður Björk", role: "Procurement Lead", text: "Does the bid cover Category B requirements as well, or only Category A? We need clarity before the panel review on the 10th.", timestamp: "2026-03-06T08:42:00", status: "unread", response: null },
    ],
    workstreams: [
      {
        id: "ws-bid", title: "Bid Preparation", state: "at_risk",
        items: [
          {
            id: "it-techspec", title: "Technical Specification",
            latestStatus: "Section 4 (Data Architecture) complete. Section 5 (Security Model) in final internal review.",
            state: "on_track", updatedAt: "2026-03-06T09:00:00", seenAt: "2026-03-04T12:00:00",
            toggl: { projectId: "toggl-lsh-techspec", taskId: null, hours7d: 11.5 },
            updates: [
              { id: "u1", text: "Section 4 completed and cross-referenced against LSH data classification policy.", weekLabel: "Week of 2 Mar", timestamp: "2026-03-06T09:00:00" },
              { id: "u2", text: "Sections 1–3 submitted for internal review. Minor revisions incorporated.", weekLabel: "Week of 23 Feb", timestamp: "2026-02-27T16:00:00" },
              { id: "u3", text: "Outline approved. Section drafting commenced.", weekLabel: "Week of 16 Feb", timestamp: "2026-02-18T10:00:00" },
            ],
            comments: [
              { id: "c1", author: "Bjarni G.", authorRole: "Consultant", text: "Section 5 should reference the Hugvit Security Edition benchmark doc from the EFTA audit response.", timestamp: "2026-03-05T14:22:00",
                replies: [
                  { id: "c1r1", author: "Sigríður Björk", authorRole: "Client", text: "Agreed — can you confirm which version of the EFTA audit doc is current?", timestamp: "2026-03-05T15:01:00" },
                  { id: "c1r2", author: "Bjarni G.", authorRole: "Consultant", text: "It's the March 2025 Deloitte response. I'll attach it in the evidence pack.", timestamp: "2026-03-05T15:14:00" },
                ],
              },
            ],
            children: [
              { id: "ch-sec4", title: "Data Architecture (§4)", latestStatus: "Complete.", state: "done", updatedAt: "2026-03-05T10:00:00", updates: [], comments: [], children: [] },
              { id: "ch-sec5", title: "Security Model (§5)", latestStatus: "Under internal review. Sign-off expected 7 Mar.", state: "on_track", updatedAt: "2026-03-06T08:30:00", updates: [], comments: [], children: [] },
              { id: "ch-sec6", title: "Integration Requirements (§6)", latestStatus: "Not yet started — dependent on §5.", state: "not_started", updatedAt: "2026-03-04T12:00:00", updates: [], comments: [], children: [] },
            ],
          },
          {
            id: "it-commercial", title: "Commercial Section",
            latestStatus: "Waiting for legal sign-off on consortium structure. Pricing table drafted but blocked.",
            state: "at_risk", blocker: "Legal confirmation of consortium partner role not yet received.",
            updatedAt: "2026-03-05T17:30:00", seenAt: "2026-03-05T20:00:00",
            toggl: { projectId: "toggl-lsh-commercial", taskId: null, hours7d: 3.25 },
            updates: [
              { id: "u4", text: "Pricing table draft prepared. Blocked on legal confirmation of consortium structure.", weekLabel: "Week of 2 Mar", timestamp: "2026-03-05T17:30:00" },
              { id: "u5", text: "Initial commercial framework discussed with partner. Awaiting formal response.", weekLabel: "Week of 23 Feb", timestamp: "2026-02-26T11:00:00" },
            ],
            comments: [
              { id: "c2", author: "Bjarni G.", authorRole: "Consultant", text: "Escalated to legal counsel 5 Mar. Expecting response by 9 Mar at latest.", timestamp: "2026-03-05T18:00:00", replies: [] },
            ],
            children: [],
          },
          {
            id: "it-analogue", title: "Analogous Experience Evidence",
            latestStatus: "GoPro Foris Security Edition and EFTA Casedoc selected. Evidence pack drafted.",
            state: "on_track", updatedAt: "2026-03-04T11:00:00", seenAt: "2026-03-05T00:00:00",
            toggl: { projectId: "toggl-lsh-evidence", taskId: null, hours7d: 2.0 },
            updates: [
              { id: "u6", text: "Two reference cases selected. Evidence documentation drafted and ready for review.", weekLabel: "Week of 2 Mar", timestamp: "2026-03-04T11:00:00" },
            ],
            comments: [], children: [],
          },
        ],
      },
      {
        id: "ws-compliance", title: "Compliance & Standards", state: "on_track",
        items: [
          {
            id: "it-iso", title: "ISO 27001 Alignment",
            latestStatus: "Gap assessment complete. No critical gaps identified against Category A criteria.",
            state: "done", updatedAt: "2026-03-01T14:00:00", seenAt: "2026-03-02T00:00:00",
            toggl: { projectId: "toggl-lsh-iso", taskId: null, hours7d: 0 },
            updates: [{ id: "u7", text: "Gap assessment finalised. Report filed.", weekLabel: "Week of 23 Feb", timestamp: "2026-03-01T14:00:00" }],
            comments: [], children: [],
          },
          {
            id: "it-gdpr", title: "Data Protection Statement",
            latestStatus: "GDPR compliance statement drafted. Under review by DPO.",
            state: "on_track", updatedAt: "2026-03-05T09:00:00", seenAt: "2026-03-03T00:00:00",
            toggl: { projectId: "toggl-lsh-gdpr", taskId: null, hours7d: 1.5 },
            updates: [{ id: "u8", text: "Draft submitted to DPO. Review expected by 10 Mar.", weekLabel: "Week of 2 Mar", timestamp: "2026-03-05T09:00:00" }],
            comments: [], children: [],
          },
        ],
      },
    ],
  },
  {
    id: "iom", slug: "iom",
    name: "Isle of Man Courts & Tribunals",
    sector: "Crown Dependencies · Justice",
    pageTitle: "Casedoc Implementation — Phase 1",
    overallState: "on_track",
    lastUpdated: "2026-03-05T16:45:00",
    summary: "Phase 1 implementation is progressing to plan. Discovery complete; configuration sprint underway. One item blocked on IT provisioning.",
    purchaserMode: "direct",
    pings: [
      { id: "ping-2", author: "Claire Watterson", role: "Programme Director", text: "The Tribunals team asked whether the case type list they submitted is sufficient, or if you need anything else before configuration starts?", timestamp: "2026-03-05T17:55:00", status: "responded", response: "That list covers everything we need for initial config. I'll confirm once the Tribunals module is set up — likely mid next week." },
    ],
    workstreams: [
      {
        id: "ws-disc", title: "Discovery & Requirements", state: "done",
        items: [
          {
            id: "it-wshops", title: "Stakeholder Workshops",
            latestStatus: "Three workshops completed. Requirements baselined and signed off.",
            state: "done", updatedAt: "2026-02-28T17:00:00", seenAt: "2026-03-01T00:00:00",
            toggl: { projectId: "toggl-iom-workshops", taskId: null, hours7d: 0 },
            updates: [
              { id: "u9",  text: "Workshop 3 (Case Status & Notifications) completed. All outputs reviewed.", weekLabel: "Week of 23 Feb", timestamp: "2026-02-28T17:00:00" },
              { id: "u10", text: "Workshop 2 (Document Management) completed. Edge cases documented.", weekLabel: "Week of 16 Feb", timestamp: "2026-02-21T15:00:00" },
            ],
            comments: [], children: [],
          },
          {
            id: "it-reqdoc", title: "Requirements Document",
            latestStatus: "v1.2 signed off by client. Baselined. Change control in effect.",
            state: "done", updatedAt: "2026-03-03T10:00:00", seenAt: "2026-03-04T00:00:00",
            toggl: { projectId: "toggl-iom-reqdoc", taskId: null, hours7d: 0 },
            updates: [{ id: "u11", text: "v1.2 signed off. Document baselined.", weekLabel: "Week of 2 Mar", timestamp: "2026-03-03T10:00:00" }],
            comments: [], children: [],
          },
        ],
      },
      {
        id: "ws-config", title: "System Configuration", state: "on_track",
        items: [
          {
            id: "it-caseflow", title: "Case Status Workflow",
            latestStatus: "18 of 24 statuses configured. Trial courts configuration in progress.",
            state: "on_track", updatedAt: "2026-03-05T16:45:00", seenAt: "2026-03-04T08:00:00",
            toggl: { projectId: "toggl-iom-caseflow", taskId: null, hours7d: 8.75 },
            updates: [
              { id: "u12", text: "Magistrates Court workflow complete (14 statuses). Crown Court configuration started.", weekLabel: "Week of 2 Mar", timestamp: "2026-03-05T16:45:00" },
              { id: "u13", text: "Status taxonomy agreed with client. 24-status model approved.", weekLabel: "Week of 23 Feb", timestamp: "2026-02-27T11:00:00" },
            ],
            comments: [
              { id: "c3", author: "PDMS Liaison", authorRole: "Partner", text: "Staffing Tribunals module next — do we have the Tribunal case types list confirmed?", timestamp: "2026-03-05T17:10:00",
                replies: [
                  { id: "c3r1", author: "Bjarni G.", authorRole: "Consultant", text: "Yes — shared via SharePoint. Link confirmed in the delivery folder.", timestamp: "2026-03-05T17:22:00" },
                ],
              },
            ],
            children: [
              { id: "ch-mag",   title: "Magistrates Court", latestStatus: "Configuration complete. Under QA review.", state: "done",         updatedAt: "2026-03-04T10:00:00", updates: [], comments: [], children: [] },
              { id: "ch-crown", title: "Crown Court",        latestStatus: "4 of 10 statuses configured. In progress.", state: "on_track",    updatedAt: "2026-03-05T16:45:00", updates: [], comments: [], children: [] },
              { id: "ch-trib",  title: "Tribunals",          latestStatus: "Not yet started — awaiting case type list.", state: "not_started", updatedAt: "2026-03-03T09:00:00", updates: [], comments: [], children: [] },
            ],
          },
          {
            id: "it-roles", title: "User Roles & Permissions",
            latestStatus: "Role matrix agreed. LDAP integration spec drafted, pending IT team confirmation.",
            state: "on_track", updatedAt: "2026-03-04T14:30:00", seenAt: "2026-03-05T00:00:00",
            toggl: { projectId: "toggl-iom-roles", taskId: null, hours7d: 2.5 },
            updates: [{ id: "u14", text: "Role matrix v1 agreed with client CISO. Integration spec drafted.", weekLabel: "Week of 2 Mar", timestamp: "2026-03-04T14:30:00" }],
            comments: [], children: [],
          },
          {
            id: "it-docs", title: "Document Management Setup",
            latestStatus: "Storage configuration blocked — awaiting IT provisioning of shared drive access.",
            state: "blocked", blocker: "IT have not provisioned the network storage credentials. Escalated to CTS IT Manager.",
            updatedAt: "2026-03-05T09:00:00", seenAt: "2026-03-05T10:00:00",
            toggl: { projectId: "toggl-iom-docs", taskId: null, hours7d: 1.0 },
            updates: [{ id: "u15", text: "Blocked. IT provisioning request raised on 1 Mar. No response yet.", weekLabel: "Week of 2 Mar", timestamp: "2026-03-05T09:00:00" }],
            comments: [
              { id: "c5", author: "Bjarni G.", authorRole: "Consultant", text: "Chased IT again this morning. Escalating to Programme Director if no response by EOD.", timestamp: "2026-03-05T09:05:00",
                replies: [
                  { id: "c5r1", author: "Claire Watterson", authorRole: "Client", text: "I've pinged the IT Manager directly — should hear back today.", timestamp: "2026-03-05T10:30:00" },
                ],
              },
            ],
            children: [],
          },
        ],
      },
    ],
  },
  {
    id: "hugvit", slug: "hugvit",
    name: "Hugvit hf.",
    sector: "SaaS · Case Management",
    pageTitle: "GoPro Foris — Implementation Support",
    overallState: "on_track",
    lastUpdated: "2026-03-06T14:30:00",
    summary: "Implementation project for Reykjavíkurborg is on track. Core case management configuration complete; user training modules in final review.",
    purchaserMode: "subcontractor",
    endClientName: "Reykjavíkurborg",
    pings: [],
    workstreams: [
      {
        id: "ws-impl", title: "System Implementation", state: "on_track",
        items: [
          {
            id: "it-config", title: "Core Configuration",
            latestStatus: "Case types, workflows, and user roles configured. Testing phase commenced.",
            state: "on_track", updatedAt: "2026-03-06T14:30:00", seenAt: "2026-03-06T09:00:00",
            toggl: { projectId: "toggl-hugvit-config", taskId: null, hours7d: 14.5 },
            updates: [
              { id: "u20", text: "All 12 case types configured and tested. Workflow automation rules deployed to staging.", weekLabel: "Week of 2 Mar", timestamp: "2026-03-06T14:30:00" },
              { id: "u21", text: "User role matrix finalised with client IT team. LDAP integration spec approved.", weekLabel: "Week of 23 Feb", timestamp: "2026-02-28T16:00:00" },
            ],
            comments: [],
            children: [],
          },
          {
            id: "it-migration", title: "Data Migration",
            latestStatus: "Legacy data extraction complete. Transformation scripts under QA review.",
            state: "on_track", updatedAt: "2026-03-05T11:00:00", seenAt: "2026-03-05T15:00:00",
            toggl: { projectId: "toggl-hugvit-migration", taskId: null, hours7d: 9.0 },
            updates: [
              { id: "u22", text: "15,000 legacy cases extracted from old system. Data cleansing complete.", weekLabel: "Week of 2 Mar", timestamp: "2026-03-05T11:00:00" },
              { id: "u23", text: "Transformation scripts written. Initial test migration run scheduled for 10 Mar.", weekLabel: "Week of 23 Feb", timestamp: "2026-02-26T14:00:00" },
            ],
            comments: [],
            children: [],
          },
          {
            id: "it-integration", title: "Third-party Integrations",
            latestStatus: "Email notification service integrated. Document storage API in testing.",
            state: "on_track", updatedAt: "2026-03-06T10:00:00", seenAt: "2026-03-06T12:00:00",
            toggl: { projectId: "toggl-hugvit-integration", taskId: null, hours7d: 6.25 },
            updates: [
              { id: "u24", text: "Email service fully integrated. Notification templates approved by client.", weekLabel: "Week of 2 Mar", timestamp: "2026-03-06T10:00:00" },
            ],
            comments: [],
            children: [],
          },
        ],
      },
      {
        id: "ws-training", title: "User Training & Documentation", state: "on_track",
        items: [
          {
            id: "it-docs", title: "User Documentation",
            latestStatus: "Administrator guide and end-user handbook drafted. Client review in progress.",
            state: "on_track", updatedAt: "2026-03-05T16:00:00", seenAt: "2026-03-05T17:00:00",
            toggl: { projectId: "toggl-hugvit-docs", taskId: null, hours7d: 5.5 },
            updates: [
              { id: "u25", text: "Admin guide v1.0 delivered to client for review. End-user handbook 85% complete.", weekLabel: "Week of 2 Mar", timestamp: "2026-03-05T16:00:00" },
            ],
            comments: [],
            children: [],
          },
          {
            id: "it-training", title: "Training Sessions",
            latestStatus: "Training plan approved. First session scheduled for 12 Mar.",
            state: "on_track", updatedAt: "2026-03-04T09:00:00", seenAt: "2026-03-04T10:00:00",
            toggl: { projectId: "toggl-hugvit-training", taskId: null, hours7d: 3.0 },
            updates: [
              { id: "u26", text: "Training schedule agreed with client. 3 sessions planned for admin users, 2 for general staff.", weekLabel: "Week of 2 Mar", timestamp: "2026-03-04T09:00:00" },
            ],
            comments: [],
            children: [],
          },
        ],
      },
      {
        id: "ws-qa", title: "Quality Assurance", state: "on_track",
        items: [
          {
            id: "it-testing", title: "User Acceptance Testing",
            latestStatus: "UAT environment prepared. Test scenarios documented and shared with client.",
            state: "on_track", updatedAt: "2026-03-06T13:00:00", seenAt: "2026-03-06T14:00:00",
            toggl: { projectId: "toggl-hugvit-testing", taskId: null, hours7d: 4.75 },
            updates: [
              { id: "u27", text: "UAT environment deployed. 24 test scenarios prepared covering all case types.", weekLabel: "Week of 2 Mar", timestamp: "2026-03-06T13:00:00" },
            ],
            comments: [],
            children: [],
          },
        ],
      },
    ],
  },
];
