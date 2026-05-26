export interface StarterTemplate {
  id: string;
  label: string;
  description: string;
  markdown: string;
}

export const STARTER_TEMPLATES: StarterTemplate[] = [
  {
    id: "engineer",
    label: "Engineer",
    description: "Software and technical roles",
    markdown: `# Your Name

you@example.com | San Francisco, CA | [linkedin.com/in/yourname](https://linkedin.com/in/yourname) | [github.com/yourname](https://github.com/yourname)

## Summary

Full-stack software engineer with experience building scalable web applications and distributed systems. Focused on delivering reliable, well-tested solutions that improve developer productivity and user experience.

## Experience

**Senior Software Engineer** | Acme Corp | 2022 -- Present

- Redesigned the payments API to support multi-currency transactions, reducing checkout errors by 34% and processing $12M in additional annual revenue
- Led migration from monolithic architecture to microservices, cutting deploy times from 45 minutes to under 8 minutes
- Mentored 3 junior engineers through code reviews and architecture discussions, resulting in 2 promotions within 12 months

**Software Engineer** | StartupCo | 2019 -- 2022

- Built a real-time collaboration feature using WebSockets that increased daily active usage by 28% across 15,000 users
- Reduced API response times by 60% by introducing Redis caching and optimizing database queries
- Designed and implemented a CI/CD pipeline that decreased production incidents by 40%

## Education

**B.S. Computer Science** | University of California, Berkeley | 2019

## Skills

**Languages:** TypeScript, Python, Go, SQL
**Frameworks:** React, Node.js, FastAPI, Next.js
**Infrastructure:** AWS, Docker, Kubernetes, Terraform, PostgreSQL, Redis
`,
  },
  {
    id: "designer",
    label: "Designer",
    description: "Product and UX design roles",
    markdown: `# Your Name

you@example.com | New York, NY | [linkedin.com/in/yourname](https://linkedin.com/in/yourname) | [yourportfolio.com](https://yourportfolio.com)

## Summary

Product designer who turns complex problems into simple, intuitive experiences. Track record of driving measurable improvements in user engagement and conversion through research-driven design and close cross-functional collaboration.

## Experience

**Senior Product Designer** | DesignCo | 2021 -- Present

- Redesigned the onboarding flow for a B2B SaaS platform, increasing trial-to-paid conversion by 22% across 50,000 monthly signups
- Established a component-based design system adopted by 4 product teams, reducing design-to-dev handoff time by 35%
- Led user research for a new analytics dashboard, conducting 30+ interviews that uncovered key pain points and shaped the product roadmap

**Product Designer** | AgencyCo | 2018 -- 2021

- Designed a mobile-first e-commerce checkout that boosted completion rates by 18% and decreased support tickets by 25%
- Created interactive prototypes in Figma for investor demos that helped close a $5M Series A round
- Ran weekly usability testing sessions and synthesized findings into actionable recommendations for engineering

## Education

**B.F.A. Interaction Design** | School of Visual Arts | 2018

## Skills

**Design:** Figma, Sketch, Adobe Creative Suite, Framer, Principle
**Research:** Usability testing, user interviews, surveys, A/B testing, journey mapping
**Technical:** HTML/CSS, React basics, design tokens, accessibility (WCAG 2.1)
`,
  },
  {
    id: "product-manager",
    label: "Product Manager",
    description: "Product strategy and execution roles",
    markdown: `# Your Name

you@example.com | Seattle, WA | [linkedin.com/in/yourname](https://linkedin.com/in/yourname)

## Summary

Product manager with a track record of shipping features that drive revenue growth and user retention. Experienced in translating customer insights and business objectives into clear product roadmaps and measurable outcomes.

## Experience

**Senior Product Manager** | TechCorp | 2021 -- Present

- Owned the product roadmap for a $30M ARR collaboration platform, prioritizing features that increased net revenue retention from 105% to 118%
- Launched an AI-powered search feature by partnering with engineering and data science, growing weekly active usage by 40% within 3 months
- Defined and tracked KPIs across the product funnel, identifying a drop-off that led to a redesign improving activation rates by 25%

**Product Manager** | GrowthCo | 2018 -- 2021

- Led discovery and delivery for a self-serve billing portal that reduced support volume by 45% and saved $500K in annual operational costs
- Ran a beta program with 200 enterprise customers, incorporating feedback that shaped the roadmap for 3 consecutive quarters
- Coordinated cross-functional launches across engineering, design, marketing, and sales for 8 major feature releases

## Education

**MBA** | University of Washington | 2018
**B.A. Economics** | UCLA | 2014

## Skills

**Product:** Roadmapping, A/B testing, user research, competitive analysis, PRDs
**Analytics:** Amplitude, Mixpanel, Looker, SQL
**Tools:** Jira, Linear, Figma, Notion, Miro
`,
  },
  {
    id: "sales",
    label: "Sales / Business Development",
    description: "Revenue and partnerships roles",
    markdown: `# Your Name

you@example.com | Chicago, IL | [linkedin.com/in/yourname](https://linkedin.com/in/yourname)

## Summary

Results-driven sales professional with a history of exceeding quota and building long-term client relationships. Skilled at navigating complex enterprise sales cycles and aligning solutions to customer business outcomes.

## Experience

**Senior Account Executive** | SalesCorp | 2021 -- Present

- Exceeded annual quota by 135% in 2023, closing $4.2M in new business across mid-market and enterprise segments
- Built and managed a pipeline of 60+ qualified opportunities through strategic outbound prospecting and inbound lead management
- Negotiated a 3-year, $1.8M contract with a Fortune 500 account by aligning platform capabilities to their digital transformation roadmap

**Business Development Representative** | StartupSales | 2019 -- 2021

- Generated $2.1M in qualified pipeline through cold outreach, averaging 45 discovery calls per week
- Developed a vertical-specific messaging playbook for healthcare that increased response rates by 28%
- Consistently ranked in the top 10% of the BDR team, earning promotion to AE track in 18 months

## Education

**B.B.A. Marketing** | University of Michigan | 2019

## Skills

**Sales:** Consultative selling, pipeline management, contract negotiation, forecasting
**Tools:** Salesforce, HubSpot, Outreach, Gong, LinkedIn Sales Navigator
**Domains:** SaaS, enterprise software, healthcare, financial services
`,
  },
  {
    id: "founder",
    label: "Founder / Operator",
    description: "Startup and leadership roles",
    markdown: `# Your Name

you@example.com | Austin, TX | [linkedin.com/in/yourname](https://linkedin.com/in/yourname)

## Summary

Builder and operator with experience launching products from zero to scale. Comfortable wearing multiple hats across product, engineering, sales, and operations. Focused on finding product-market fit fast and building teams that execute.

## Experience

**Co-Founder & CEO** | LaunchCo | 2021 -- Present

- Grew the company from idea to $2M ARR in 18 months, serving 500+ SMB customers across 3 verticals
- Raised a $3.5M seed round from top-tier investors by crafting the narrative, building the data room, and leading all partner meetings
- Hired and managed a team of 12 across engineering, design, and GTM, establishing the culture and operating cadence from day one

**Head of Operations** | ScaleUp Inc. | 2018 -- 2021

- Stood up the operations function as employee #5, building processes for customer onboarding, support, and billing that scaled to 2,000 accounts
- Reduced customer churn from 8% to 3.5% monthly by implementing a proactive health-scoring system and intervention playbook
- Managed vendor relationships and negotiated contracts that cut infrastructure costs by 30%

## Education

**B.S. Industrial Engineering** | Georgia Tech | 2018

## Skills

**Leadership:** Hiring, fundraising, board management, strategic planning, P&L ownership
**Operations:** Process design, vendor management, customer success, analytics
**Technical:** SQL, Python, no-code tools (Retool, Zapier), financial modeling
`,
  },
  {
    id: "custom",
    label: "Custom",
    description: "Start with a blank slate",
    markdown: "",
  },
];
