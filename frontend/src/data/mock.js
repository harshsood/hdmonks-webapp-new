// Mock data for HD MONKS website

export const stages = [
  {
    id: 1,
    title: "Incubation & Identity",
    subtitle: "Setting the legal and visual foundation",
    phase: "Foundation",
    services: [
      {
        id: "startup-assistance",
        name: "Startup Assistance & Incubation",
        description: "Direct mentorship and strategic planning to launch your venture successfully",
        icon: "Rocket",
        relevantFor: ["startup", "msme"],
        details: "Our incubation program provides hands-on mentorship, strategic business planning, market analysis, and go-to-market strategy development. We guide you through every step of launching your business."
      },
      {
        id: "company-formation",
        name: "Company Formation",
        description: "Complete registration services for Pvt Ltd, LLP, and other entity types",
        icon: "Building2",
        relevantFor: ["startup"],
        details: "End-to-end company registration including entity selection, documentation, GST registration, MSME certification, and FSSAI licensing. We handle all regulatory compliance."
      },
      {
        id: "ipr",
        name: "Intellectual Property Rights",
        description: "Trademark registration, patent filing, and copyright protection",
        icon: "Shield",
        relevantFor: ["startup", "msme"],
        details: "Comprehensive IP protection including trademark search and registration, patent filing, copyright registration, and IP portfolio management to safeguard your innovations."
      },
      {
        id: "branding",
        name: "Branding & Design Strategy",
        description: "Corporate identity creation, logo design, and brand guidelines",
        icon: "Palette",
        relevantFor: ["startup"],
        details: "Complete brand identity development including logo design, color palette, typography, brand guidelines, and visual asset creation for consistent brand presence."
      },
      {
        id: "digital-setup",
        name: "Digital Setup",
        description: "Professional website development and IT infrastructure",
        icon: "Globe",
        relevantFor: ["startup", "msme"],
        details: "Custom website development, domain registration, hosting setup, email configuration, and essential IT infrastructure for modern business operations."
      }
    ]
  },
  {
    id: 2,
    title: "Operational Readiness",
    subtitle: "Building the team and rules of play",
    phase: "Structure",
    services: [
      {
        id: "hr-payroll",
        name: "HR & Payroll Management",
        description: "Employee handbook, HR policies, and salary structuring",
        icon: "Users",
        relevantFor: ["startup", "msme"],
        details: "Complete HR setup including employee handbook creation, HR policy documentation, payroll system implementation, and compensation structuring aligned with industry standards."
      },
      {
        id: "legal-advisory",
        name: "Legal Advisory",
        description: "NDAs, founder agreements, and commercial contracts",
        icon: "FileText",
        relevantFor: ["startup", "msme"],
        details: "Comprehensive legal documentation including NDAs, founder/shareholder agreements, employment contracts, vendor agreements, and commercial contract drafting and review."
      },
      {
        id: "hr-compliance",
        name: "HR Compliance",
        description: "ESI/PF registration and POSH compliance setup",
        icon: "CheckCircle",
        relevantFor: ["startup", "msme"],
        details: "Complete statutory compliance including ESI and PF registration, POSH policy implementation, and ongoing compliance management for employee welfare regulations."
      },
      {
        id: "content-development",
        name: "Content & Copy Development",
        description: "Marketing content and internal communication strategy",
        icon: "PenTool",
        relevantFor: ["startup", "msme"],
        details: "Professional content creation for marketing materials, website copy, internal communications, presentation decks, and brand messaging that resonates with your audience."
      }
    ]
  },
  {
    id: 3,
    title: "Market Penetration",
    subtitle: "Growth, visibility, and operational hygiene",
    phase: "Growth",
    services: [
      {
        id: "taxation",
        name: "Taxation & Accounting",
        description: "Monthly GST filings, income tax, and TDS/TCS management",
        icon: "Calculator",
        relevantFor: ["startup", "msme"],
        details: "Complete tax and accounting services including monthly GST returns, income tax filing, TDS/TCS compliance, bookkeeping, financial statements, and tax planning strategies."
      },
      {
        id: "digital-media",
        name: "Digital & Media Services",
        description: "SEO optimization, LinkedIn marketing, and digital growth",
        icon: "TrendingUp",
        relevantFor: ["startup", "msme"],
        details: "Comprehensive digital marketing including SEO optimization, LinkedIn profile management, content marketing, social media strategy, and performance analytics for business growth."
      },
      {
        id: "logistics-legal",
        name: "Logistics & Supply Chain Legal",
        description: "Trade compliance, IEC registration, and vendor contracts",
        icon: "Truck",
        relevantFor: ["msme"],
        details: "Supply chain legal support including import-export code (IEC) registration, customs compliance, logistics agreements, vendor contracts, and international trade documentation."
      },
      {
        id: "ongoing-compliance",
        name: "Ongoing Compliances",
        description: "ISO certifications and industry-specific licenses",
        icon: "Award",
        relevantFor: ["msme"],
        details: "Industry-specific compliance management including ISO certification support, RERA registration, sector-specific licensing, and maintaining ongoing regulatory adherence."
      }
    ]
  },
  {
    id: 4,
    title: "Defense & Optimization",
    subtitle: "Protecting from risks as you scale",
    phase: "Protection",
    services: [
      {
        id: "litigation",
        name: "Litigation Support",
        description: "Recovery suits, civil/criminal matters, and IPR litigation",
        icon: "Gavel",
        relevantFor: ["msme"],
        details: "Comprehensive litigation support including debt recovery, civil and criminal case representation, IPR infringement cases, and dispute resolution through arbitration or mediation."
      },
      {
        id: "advanced-taxation",
        name: "Advanced Taxation",
        description: "E-commerce taxation and tax audit readiness",
        icon: "BarChart",
        relevantFor: ["msme"],
        details: "Advanced tax services including e-commerce taxation, transfer pricing, international taxation, tax audit preparation, and strategic tax optimization for growing businesses."
      },
      {
        id: "operational-audits",
        name: "Operational Audits",
        description: "Legal and HR audits to ensure regulatory compliance",
        icon: "Search",
        relevantFor: ["msme"],
        details: "Periodic audit services covering legal compliance review, HR policy audits, financial system audits, and comprehensive risk assessment to identify and address regulatory gaps."
      }
    ]
  },
  {
    id: 5,
    title: "Exit & Expansion",
    subtitle: "Wealth creation and scaling to the next level",
    phase: "Scale",
    services: [
      {
        id: "funding",
        name: "Funding & Mentoring",
        description: "Pitch deck preparation and VC/Angel due diligence",
        icon: "DollarSign",
        relevantFor: ["msme"],
        details: "Fundraising support including investor pitch deck creation, financial modeling, due diligence preparation, investor introductions, and term sheet negotiation assistance."
      },
      {
        id: "strategy",
        name: "Strategy Advisory",
        description: "Long-term business scaling and pivot strategies",
        icon: "Target",
        relevantFor: ["msme"],
        details: "Strategic consulting for business expansion, market entry strategies, product-market fit optimization, operational scaling, and strategic pivot planning for sustainable growth."
      },
      {
        id: "ipo-readiness",
        name: "IPO Readiness",
        description: "Public listing preparation and corporate governance",
        icon: "LineChart",
        relevantFor: ["msme"],
        details: "Complete IPO preparation including corporate governance structuring, financial audit readiness, regulatory compliance for public markets, and listing process management."
      }
    ]
  }
];

export const contactInfo = {
  email: "contact@hdmonks.com",
  phone: "+91 XXX XXX XXXX",
  address: "Your Business Address"
};

export const testimonials = [
  {
    id: 1,
    name: "Rajesh Kumar",
    company: "Tech Startup Pvt Ltd",
    text: "HD MONKS guided us through every step of company formation and compliance. Their expertise saved us months of confusion.",
    rating: 5
  },
  {
    id: 2,
    name: "Priya Sharma",
    company: "MSME Manufacturing",
    text: "The team's knowledge in taxation and ongoing compliance has been invaluable for our growing business.",
    rating: 5
  },
  {
    id: 3,
    name: "Amit Patel",
    company: "E-commerce Business",
    text: "From startup to scaling, HD MONKS has been our trusted partner. Highly recommend their comprehensive services.",
    rating: 5
  }
];

export const expertLeads = {
  legal: {
    name: "Legal Team",
    expertise: "Corporate Law & Compliance"
  },
  ca: {
    name: "CA Team",
    expertise: "Taxation & Accounting"
  },
  hr: {
    name: "HR Team",
    expertise: "Human Resources & Payroll"
  },
  digital: {
    name: "Digital Team",
    expertise: "Marketing & Technology"
  },
  strategy: {
    name: "Strategy Team",
    expertise: "Business Growth & Funding"
  }
};
