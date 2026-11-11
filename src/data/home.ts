/**
 * PLACEHOLDER CONTENT — replace with real Office of International Relations data.
 * Every string below is intentionally marked or generic so swaps are obvious.
 */

export const chapters = [
  { id: "about", label: "01", title: "Who we are" },
  { id: "partners", label: "02", title: "Partners" },
  { id: "programs", label: "03", title: "Programs" },
  { id: "journey", label: "04", title: "Journey" },
  { id: "stories", label: "05", title: "Stories" },
  { id: "events", label: "06", title: "Events" },
  { id: "faq", label: "07", title: "FAQ" },
] as const;

export const impactStats = [
  { id: "partners", value: 48, suffix: "+", label: "Partner Universities" },
  { id: "countries", value: 22, suffix: "", label: "Countries" },
  { id: "students", value: 320, suffix: "+", label: "Students Sent Abroad" },
  { id: "research", value: 35, suffix: "+", label: "Joint Research Projects" },
] as const;

export const aboutContent = {
  eyebrow: "Chapter 01 — Who we are",
  heading: ["Your bridge from Chennai", "to the world"],
  paragraphs: [
    // PLACEHOLDER — replace with official mission copy
    "PLACEHOLDER: The Office of International Relations at VIT Chennai connects students and faculty with universities across continents through exchanges, dual degrees, and collaborative research.",
    "PLACEHOLDER: From nomination letters to landing support, we guide every step so global opportunities feel close to home.",
  ],
  pillars: [
    {
      id: "mobility",
      title: "Student Mobility",
      description: "PLACEHOLDER: Semesters abroad, twinning paths, and short immersions.",
      icon: "plane" as const,
    },
    {
      id: "partnerships",
      title: "Academic Partnerships",
      description: "PLACEHOLDER: MoUs, dual degrees, and visiting faculty networks.",
      icon: "handshake" as const,
    },
    {
      id: "research",
      title: "Global Research",
      description: "PLACEHOLDER: Joint labs, workshops, and co-authored projects.",
      icon: "flask" as const,
    },
  ],
  director: {
    // PLACEHOLDER — replace photo, name, title, and quote
    name: "Sample Director Name",
    title: "Director, International Relations (Placeholder)",
    quote:
      "PLACEHOLDER: Our door is open to every student ready to learn beyond borders — Chennai is your launchpad.",
    photoUrl: "https://i.pravatar.cc/160?img=60",
  },
};

export type ProgramAudience = "all" | "students" | "faculty" | "research";

export const programsContent = {
  eyebrow: "Chapter 02 — Choose your path",
  heading: ["Many ways to go global,", "one place to start."],
  filters: [
    { id: "all" as const, label: "All" },
    { id: "students" as const, label: "Students" },
    { id: "faculty" as const, label: "Faculty" },
    { id: "research" as const, label: "Research" },
  ],
  items: [
    {
      id: "semester-exchange",
      title: "Semester Exchange",
      description:
        "PLACEHOLDER: Spend a semester at a partner university while earning VIT credits.",
      icon: "globe" as const,
      audience: ["students"] as ProgramAudience[],
      tags: ["1 semester", "UG / PG"],
      href: "#contact", // TODO: program detail page
    },
    {
      id: "dual-degree",
      title: "Dual Degree / Twinning",
      description:
        "PLACEHOLDER: Structured 2+2 and 3+1 pathways with select partner institutions.",
      icon: "award" as const,
      audience: ["students"] as ProgramAudience[],
      tags: ["2+2 / 3+1", "Degree pathway"],
      href: "#contact", // TODO: program detail page
    },
    {
      id: "summer-winter",
      title: "Summer & Winter Schools",
      description:
        "PLACEHOLDER: Short, intensive programs abroad during academic breaks.",
      icon: "sun" as const,
      audience: ["students"] as ProgramAudience[],
      tags: ["2–6 weeks", "Open call"],
      href: "#contact", // TODO: program detail page
    },
    {
      id: "research-internships",
      title: "Research Internships Abroad",
      description:
        "PLACEHOLDER: Lab placements and supervised projects with partner faculty.",
      icon: "microscope" as const,
      audience: ["students", "research"] as ProgramAudience[],
      tags: ["8–12 weeks", "Research"],
      href: "#contact", // TODO: program detail page
    },
    {
      id: "faculty-exchange",
      title: "Faculty Exchange",
      description:
        "PLACEHOLDER: Teaching and collaborative visits for VIT Chennai faculty.",
      icon: "users" as const,
      audience: ["faculty"] as ProgramAudience[],
      tags: ["Short visit", "Faculty"],
      href: "#contact", // TODO: program detail page
    },
    {
      id: "joint-research",
      title: "Joint Research & Workshops",
      description:
        "PLACEHOLDER: Co-hosted seminars, grant proposals, and visiting scholar weeks.",
      icon: "flask" as const,
      audience: ["faculty", "research"] as ProgramAudience[],
      tags: ["Ongoing", "Research"],
      href: "#contact", // TODO: program detail page
    },
  ],
};

export const journeySteps = [
  {
    id: "1",
    title: "Explore programs",
    description: "PLACEHOLDER: Browse partners, durations, and eligibility filters.",
  },
  {
    id: "2",
    title: "Check eligibility",
    description: "PLACEHOLDER: Confirm CGPA, language, and department approvals.",
  },
  {
    id: "3",
    title: "Apply & nominate",
    description: "PLACEHOLDER: Submit documents; IR nominates you to the partner.",
  },
  {
    id: "4",
    title: "Selection & offer letter",
    description: "PLACEHOLDER: Receive selection results and your offer package.",
  },
  {
    id: "5",
    title: "Visa, travel & prep",
    description: "PLACEHOLDER: Visa guidance, insurance, housing, and briefings.",
  },
  {
    id: "6",
    title: "Study abroad & share your story",
    description: "PLACEHOLDER: Thrive overseas, then inspire the next cohort.",
  },
] as const;

export const journeyContent = {
  eyebrow: "Chapter 03 — Your journey",
  heading: ["From application", "to arrival."],
  steps: journeySteps,
};

export const storiesContent = {
  eyebrow: "Chapter 04 — Voices from abroad",
  heading: ["Stories that started", "right here."],
  items: [
    {
      id: "s1",
      name: "Sample Student — Ananya R.",
      branchYear: "CSE · 3rd Year (Placeholder)",
      destination: "TU Munich",
      country: "Germany",
      flag: "🇩🇪",
      quote:
        "PLACEHOLDER: The IR desk made nomination feel simple — I landed ready to learn.",
      photoUrl: "https://images.unsplash.com/photo-1524504388940-b1c17226555e?w=640&h=800&fit=crop",
      href: "#stories", // TODO: story page
    },
    {
      id: "s2",
      name: "Sample Student — Rohan M.",
      branchYear: "Mechanical · 4th Year (Placeholder)",
      destination: "NUS",
      country: "Singapore",
      flag: "🇸🇬",
      quote:
        "PLACEHOLDER: From visa tips to buddy matching, every step had a human on the other end.",
      photoUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=640&h=800&fit=crop",
      href: "#stories", // TODO: story page
    },
    {
      id: "s3",
      name: "Sample Student — Meera S.",
      branchYear: "ECE · 3rd Year (Placeholder)",
      destination: "University of Leeds",
      country: "UK",
      flag: "🇬🇧",
      quote:
        "PLACEHOLDER: Credit mapping was clear before I left — that confidence mattered.",
      photoUrl: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=640&h=800&fit=crop",
      href: "#stories", // TODO: story page
    },
    {
      id: "s4",
      name: "Sample Student — Kabir T.",
      branchYear: "Biotech · PG (Placeholder)",
      destination: "University of Tokyo",
      country: "Japan",
      flag: "🇯🇵",
      quote:
        "PLACEHOLDER: A research summer that became a thesis chapter — and lifelong friends.",
      photoUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=640&h=800&fit=crop",
      href: "#stories", // TODO: story page
    },
    {
      id: "s5",
      name: "Sample Student — Sara P.",
      branchYear: "Law · 2nd Year (Placeholder)",
      destination: "Sciences Po",
      country: "France",
      flag: "🇫🇷",
      quote:
        "PLACEHOLDER: Chennai to Paris felt huge until the IR orientation made it familiar.",
      photoUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=640&h=800&fit=crop",
      href: "#stories", // TODO: story page
    },
  ],
};

export const eventsContent = {
  eyebrow: "Chapter 05 — What's happening",
  heading: ["Upcoming events", "and deadlines."],
  events: [
    {
      id: "e1",
      day: "12",
      month: "NOV",
      title: "PLACEHOLDER: Fall Exchange Info Session",
      type: "Info Session" as const,
      location: "AB1 Seminar Hall · Hybrid",
      href: "#contact", // TODO: event registration page
    },
    {
      id: "e2",
      day: "18",
      month: "NOV",
      title: "PLACEHOLDER: Visa Documentation Workshop",
      type: "Workshop" as const,
      location: "Online (Zoom)",
      href: "#contact", // TODO: event registration page
    },
    {
      id: "e3",
      day: "02",
      month: "DEC",
      title: "PLACEHOLDER: Partner Delegation Visit — EU Cluster",
      type: "Delegation Visit" as const,
      location: "IR Office · By invitation",
      href: "#contact", // TODO: event registration page
    },
    {
      id: "e4",
      day: "09",
      month: "DEC",
      title: "PLACEHOLDER: Research Internship Webinar",
      type: "Webinar" as const,
      location: "Online",
      href: "#contact", // TODO: event registration page
    },
  ],
  deadline: {
    // PLACEHOLDER — set a real ISO deadline
    label: "Next application deadline",
    program: "PLACEHOLDER: Spring 2027 Semester Exchange",
    // ~45 days from a fixed-ish future so countdown works in demos
    iso: "2027-01-15T23:59:59+05:30",
    href: "#contact", // TODO: application page
  },
  news: [
    {
      id: "n1",
      date: "28 Oct 2026",
      title: "PLACEHOLDER: New MoU signed with a Nordic partner university",
      href: "#events", // TODO: news article page
    },
    {
      id: "n2",
      date: "21 Oct 2026",
      title: "PLACEHOLDER: Outbound cohort orientation photos are up",
      href: "#events", // TODO: news article page
    },
    {
      id: "n3",
      date: "14 Oct 2026",
      title: "PLACEHOLDER: Scholarship tips for summer schools published",
      href: "#events", // TODO: news article page
    },
  ],
};

export const faqContent = {
  eyebrow: "Questions",
  heading: ["Frequently asked", "questions."],
  items: [
    {
      id: "q1",
      question: "PLACEHOLDER: Who is eligible for semester exchange?",
      answer:
        "PLACEHOLDER: Typically UG/PG students meeting CGPA, credit, and department criteria. Exact cutoffs vary by partner and cycle.",
    },
    {
      id: "q2",
      question: "PLACEHOLDER: What CGPA do I need?",
      answer:
        "PLACEHOLDER: Many partners ask for a minimum CGPA (often around 7.0/10). Check the active call sheet for the cycle you are applying to.",
    },
    {
      id: "q3",
      question: "PLACEHOLDER: Are there scholarships or fee waivers?",
      answer:
        "PLACEHOLDER: Some partners offer tuition waivers; travel scholarships may open seasonally. IR circulates calls when available.",
    },
    {
      id: "q4",
      question: "PLACEHOLDER: How does credit transfer work?",
      answer:
        "PLACEHOLDER: Courses are pre-mapped with your school. Keep syllabi and transcripts for post-return credit approval.",
    },
    {
      id: "q5",
      question: "PLACEHOLDER: How long does the visa process take?",
      answer:
        "PLACEHOLDER: Timelines depend on the destination (often 2–8 weeks). Start immediately after your offer letter.",
    },
    {
      id: "q6",
      question: "PLACEHOLDER: Can faculty apply for short visits?",
      answer:
        "PLACEHOLDER: Yes — faculty exchange and workshop visits run on separate calls. Contact IR with your host invitation.",
    },
    {
      id: "q7",
      question: "PLACEHOLDER: Who do I contact for inbound admissions?",
      answer:
        "PLACEHOLDER: Email the IR office (see Contact). Inbound advisors handle applications, housing, and FRRO orientation.",
    },
    {
      id: "q8",
      question: "PLACEHOLDER: What if my preferred partner has no seats?",
      answer:
        "PLACEHOLDER: Rank multiple preferences on your application. IR may offer alternates from the same region or cycle.",
    },
  ],
};
