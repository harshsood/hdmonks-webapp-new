"""
Seed script to populate the database with initial stages and services
"""
import asyncio
from database import Database
from datetime import datetime, timedelta
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


async def seed_stages_and_services():
    """Seed the database with initial stages and services"""
    
    db = Database()
    await db.connect()
    
    stages_data = [
        {
            "id": 1,
            "title": "Incubation & Identity",
            "subtitle": "Setting the legal and visual foundation",
            "phase": "Foundation",
            "services": [
                {
                    "id": "startup-assistance-1",
                    "service_id": "startup-assistance",
                    "name": "Startup Assistance & Incubation",
                    "description": "Direct mentorship and strategic planning to launch your venture successfully",
                    "icon": "Rocket",
                    "relevant_for": ["startup", "msme"],
                    "details": "Our incubation program provides hands-on mentorship, strategic business planning, market analysis, and go-to-market strategy development. We guide you through every step of launching your business.",
                    "created_at": datetime.utcnow(),
                    "updated_at": datetime.utcnow()
                },
                {
                    "id": "company-formation-1",
                    "service_id": "company-formation",
                    "name": "Company Formation",
                    "description": "Complete registration services for Pvt Ltd, LLP, and other entity types",
                    "icon": "Building2",
                    "relevant_for": ["startup"],
                    "details": "End-to-end company registration including entity selection, documentation, GST registration, MSME certification, and FSSAI licensing. We handle all regulatory compliance.",
                    "created_at": datetime.utcnow(),
                    "updated_at": datetime.utcnow()
                },
                {
                    "id": "ipr-1",
                    "service_id": "ipr",
                    "name": "Intellectual Property Rights",
                    "description": "Trademark registration, patent filing, and copyright protection",
                    "icon": "Shield",
                    "relevant_for": ["startup", "msme"],
                    "details": "Comprehensive IP protection including trademark search and registration, patent filing, copyright registration, and IP portfolio management to safeguard your innovations.",
                    "created_at": datetime.utcnow(),
                    "updated_at": datetime.utcnow()
                },
                {
                    "id": "branding-1",
                    "service_id": "branding",
                    "name": "Branding & Design Strategy",
                    "description": "Corporate identity creation, logo design, and brand guidelines",
                    "icon": "Palette",
                    "relevant_for": ["startup"],
                    "details": "Complete brand identity development including logo design, color palette, typography, brand guidelines, and visual asset creation for consistent brand presence.",
                    "created_at": datetime.utcnow(),
                    "updated_at": datetime.utcnow()
                },
                {
                    "id": "digital-setup-1",
                    "service_id": "digital-setup",
                    "name": "Digital Setup",
                    "description": "Professional website development and IT infrastructure",
                    "icon": "Globe",
                    "relevant_for": ["startup", "msme"],
                    "details": "Custom website development, domain registration, hosting setup, email configuration, and essential IT infrastructure for modern business operations.",
                    "created_at": datetime.utcnow(),
                    "updated_at": datetime.utcnow()
                }
            ],
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        },
        {
            "id": 2,
            "title": "Operational Readiness",
            "subtitle": "Building the team and rules of play",
            "phase": "Structure",
            "services": [
                {
                    "id": "hr-payroll-2",
                    "service_id": "hr-payroll",
                    "name": "HR & Payroll Management",
                    "description": "Employee handbook, HR policies, and salary structuring",
                    "icon": "Users",
                    "relevant_for": ["startup", "msme"],
                    "details": "Complete HR setup including employee handbook creation, HR policy documentation, payroll system implementation, and compensation structuring aligned with industry standards.",
                    "created_at": datetime.utcnow(),
                    "updated_at": datetime.utcnow()
                },
                {
                    "id": "legal-advisory-2",
                    "service_id": "legal-advisory",
                    "name": "Legal Advisory",
                    "description": "NDAs, founder agreements, and commercial contracts",
                    "icon": "FileText",
                    "relevant_for": ["startup", "msme"],
                    "details": "Comprehensive legal documentation including NDAs, founder/shareholder agreements, employment contracts, vendor agreements, and commercial contract drafting and review.",
                    "created_at": datetime.utcnow(),
                    "updated_at": datetime.utcnow()
                },
                {
                    "id": "hr-compliance-2",
                    "service_id": "hr-compliance",
                    "name": "HR Compliance",
                    "description": "ESI/PF registration and POSH compliance setup",
                    "icon": "CheckCircle",
                    "relevant_for": ["startup", "msme"],
                    "details": "Complete statutory compliance including ESI and PF registration, POSH policy implementation, and ongoing compliance management for employee welfare regulations.",
                    "created_at": datetime.utcnow(),
                    "updated_at": datetime.utcnow()
                },
                {
                    "id": "content-development-2",
                    "service_id": "content-development",
                    "name": "Content & Copy Development",
                    "description": "Marketing content and internal communication strategy",
                    "icon": "PenTool",
                    "relevant_for": ["startup", "msme"],
                    "details": "Professional content creation for marketing materials, website copy, internal communications, presentation decks, and brand messaging that resonates with your audience.",
                    "created_at": datetime.utcnow(),
                    "updated_at": datetime.utcnow()
                }
            ],
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        },
        {
            "id": 3,
            "title": "Market Penetration",
            "subtitle": "Growth, visibility, and operational hygiene",
            "phase": "Growth",
            "services": [
                {
                    "id": "taxation-3",
                    "service_id": "taxation",
                    "name": "Taxation & Accounting",
                    "description": "Monthly GST filings, income tax, and TDS/TCS management",
                    "icon": "Calculator",
                    "relevant_for": ["startup", "msme"],
                    "details": "Complete tax and accounting services including monthly GST returns, income tax filing, TDS/TCS compliance, bookkeeping, financial statements, and tax planning strategies.",
                    "created_at": datetime.utcnow(),
                    "updated_at": datetime.utcnow()
                },
                {
                    "id": "digital-media-3",
                    "service_id": "digital-media",
                    "name": "Digital & Media Services",
                    "description": "SEO optimization, LinkedIn marketing, and digital growth",
                    "icon": "TrendingUp",
                    "relevant_for": ["startup", "msme"],
                    "details": "Comprehensive digital marketing including SEO optimization, LinkedIn profile management, content marketing, social media strategy, and performance analytics for business growth.",
                    "created_at": datetime.utcnow(),
                    "updated_at": datetime.utcnow()
                },
                {
                    "id": "logistics-legal-3",
                    "service_id": "logistics-legal",
                    "name": "Logistics & Supply Chain Legal",
                    "description": "Trade compliance, IEC registration, and vendor contracts",
                    "icon": "Truck",
                    "relevant_for": ["msme"],
                    "details": "Supply chain legal support including import-export code (IEC) registration, customs compliance, logistics agreements, vendor contracts, and international trade documentation.",
                    "created_at": datetime.utcnow(),
                    "updated_at": datetime.utcnow()
                },
                {
                    "id": "ongoing-compliance-3",
                    "service_id": "ongoing-compliance",
                    "name": "Ongoing Compliances",
                    "description": "ISO certifications and industry-specific licenses",
                    "icon": "Award",
                    "relevant_for": ["msme"],
                    "details": "Industry-specific compliance management including ISO certification support, RERA registration, sector-specific licensing, and maintaining ongoing regulatory adherence.",
                    "created_at": datetime.utcnow(),
                    "updated_at": datetime.utcnow()
                }
            ],
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        },
        {
            "id": 4,
            "title": "Defense & Optimization",
            "subtitle": "Protecting from risks as you scale",
            "phase": "Protection",
            "services": [
                {
                    "id": "litigation-4",
                    "service_id": "litigation",
                    "name": "Litigation Support",
                    "description": "Recovery suits, civil/criminal matters, and IPR litigation",
                    "icon": "Gavel",
                    "relevant_for": ["startup", "msme"],
                    "details": "Comprehensive litigation support including debt recovery, civil and criminal case representation, IPR infringement cases, and dispute resolution through arbitration or mediation.",
                    "created_at": datetime.utcnow(),
                    "updated_at": datetime.utcnow()
                },
                {
                    "id": "advanced-taxation-4",
                    "service_id": "advanced-taxation",
                    "name": "Advanced Taxation",
                    "description": "E-commerce taxation and tax audit readiness",
                    "icon": "BarChart",
                    "relevant_for": ["startup", "msme"],
                    "details": "Advanced tax services including e-commerce taxation, transfer pricing, international taxation, tax audit preparation, and strategic tax optimization for growing businesses.",
                    "created_at": datetime.utcnow(),
                    "updated_at": datetime.utcnow()
                },
                {
                    "id": "operational-audits-4",
                    "service_id": "operational-audits",
                    "name": "Operational Audits",
                    "description": "Legal and HR audits to ensure regulatory compliance",
                    "icon": "Search",
                    "relevant_for": ["startup", "msme"],
                    "details": "Periodic audit services covering legal compliance review, HR policy audits, financial system audits, and comprehensive risk assessment to identify and address regulatory gaps.",
                    "created_at": datetime.utcnow(),
                    "updated_at": datetime.utcnow()
                }
            ],
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        },
        {
            "id": 5,
            "title": "Exit & Expansion",
            "subtitle": "Wealth creation and scaling to the next level",
            "phase": "Scale",
            "services": [
                {
                    "id": "funding-5",
                    "service_id": "funding",
                    "name": "Funding & Mentoring",
                    "description": "Pitch deck preparation and VC/Angel due diligence",
                    "icon": "DollarSign",
                    "relevant_for": ["startup", "msme"],
                    "details": "Fundraising support including investor pitch deck creation, financial modeling, due diligence preparation, investor introductions, and term sheet negotiation assistance.",
                    "created_at": datetime.utcnow(),
                    "updated_at": datetime.utcnow()
                },
                {
                    "id": "strategy-5",
                    "service_id": "strategy",
                    "name": "Strategy Advisory",
                    "description": "Long-term business scaling and pivot strategies",
                    "icon": "Target",
                    "relevant_for": ["startup", "msme"],
                    "details": "Strategic consulting for business expansion, market entry strategies, product-market fit optimization, operational scaling, and strategic pivot planning for sustainable growth.",
                    "created_at": datetime.utcnow(),
                    "updated_at": datetime.utcnow()
                },
                {
                    "id": "ipo-readiness-5",
                    "service_id": "ipo-readiness",
                    "name": "IPO Readiness",
                    "description": "Public listing preparation and corporate governance",
                    "icon": "LineChart",
                    "relevant_for": ["startup", "msme"],
                    "details": "Complete IPO preparation including corporate governance structuring, financial audit readiness, regulatory compliance for public markets, and listing process management.",
                    "created_at": datetime.utcnow(),
                    "updated_at": datetime.utcnow()
                }
            ],
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        }
    ]
    
    # Clear existing stages
    await db.db.stages.delete_many({})
    logger.info("Cleared existing stages")
    
    # Insert new stages
    for stage_data in stages_data:
        await db.create_stage(stage_data)
        logger.info(f"Created stage {stage_data['id']}: {stage_data['title']}")
    
    logger.info("Database seeded successfully!")
    await db.close()


async def seed_sample_timeslots():
    """Create sample time slots for the next 7 days"""
    
    db = Database()
    await db.connect()
    
    # Clear existing timeslots
    await db.db.timeslots.delete_many({})
    logger.info("Cleared existing timeslots")
    
    # Create slots for next 7 days (10 AM to 4 PM, 30 min intervals)
    today = datetime.now()
    times = ["10:00", "10:30", "11:00", "11:30", "12:00", "12:30", 
             "14:00", "14:30", "15:00", "15:30", "16:00"]
    
    for day_offset in range(1, 8):  # Next 7 days
        date = (today + timedelta(days=day_offset)).strftime("%Y-%m-%d")
        for time in times:
            timeslot_data = {
                "id": f"{date}-{time.replace(':', '')}",
                "date": date,
                "time": time,
                "duration_minutes": 30,
                "is_available": True,
                "created_at": datetime.utcnow()
            }
            await db.create_timeslot(timeslot_data)
    
    logger.info(f"Created sample timeslots for next 7 days")
    await db.close()


async def main():
    """Main seed function"""
    try:
        logger.info("Starting database seed...")
        await seed_stages_and_services()
        await seed_sample_timeslots()
        logger.info("Seeding completed successfully!")
    except Exception as e:
        logger.error(f"Error seeding database: {str(e)}")
        import traceback
        traceback.print_exc()


if __name__ == "__main__":
    asyncio.run(main())
