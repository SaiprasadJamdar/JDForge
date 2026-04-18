export type JDStatus = "draft" | "finalized";

export interface JD {
  id: string;
  title: string;
  status: JDStatus;
  createdAt: number;
  iconType: "code" | "layout" | "database";
  color: string;
  content: {
    summary: string;
    experience: string;
    location: string;
    mode: string;
    responsibilities: string[];
    qualifications: string[];
    goodToHave: string[];
  }
}

export const initialJDs: JD[] = [
  {
    id: "java_architect_x1",
    title: "Java Architect",
    status: "draft",
    createdAt: Date.now() - 100000,
    iconType: "code",
    color: "bg-blue-500",
    content: {
      summary: "Wissen Technology is hiring an experienced Java Architect to design, develop, and guide scalable enterprise applications. The role involves defining architecture, mentoring teams, and ensuring best practices across the development lifecycle.",
      experience: "12+ years",
      location: "Pune / Mumbai",
      mode: "Hybrid",
      responsibilities: [
        "Define and own the overall application architecture and design standards",
        "Design scalable, high-performance, and secure Java-based applications",
        "Provide technical leadership and guidance to development teams",
        "Review code, design documents, and ensure adherence to best practices",
        "Collaborate with product owners, stakeholders, and cross-functional teams",
        "Drive cloud-native, microservices, and API-based architectures",
        "Identify and resolve performance, security, and scalability issues",
        "Participate in technical decision-making and architecture governance"
      ],
      qualifications: [
        "Strong expertise in Core Java, Java 8+",
        "Hands-on experience with Spring, Spring Boot",
        "Experience in Microservices architecture",
        "Strong knowledge of RESTful APIs",
        "Experience with Hibernate / JPA",
        "Working knowledge of SQL / NoSQL databases",
        "Experience with Kafka / RabbitMQ (preferred)",
        "Exposure to Docker, Kubernetes",
        "Experience with AWS / Azure / GCP"
      ],
      goodToHave: [
        "Experience with DevOps tools (CI/CD, Jenkins, Git)",
        "Knowledge of design patterns and architectural patterns",
        "Experience in domain-driven design (DDD)",
        "Exposure to security standards (OAuth2, JWT)"
      ]
    }
  },
  {
    id: "frontend_engineer_x2",
    title: "Frontend Engineer",
    status: "draft",
    createdAt: Date.now() - 50000,
    iconType: "layout",
    color: "bg-teal-500",
    content: {
      summary: "Wissen Technology is looking for a passionate Frontend Engineer to build exceptional user interfaces. You will work closely with designers and backend engineers to create fast, responsive, and accessible web applications.",
      experience: "4-7 years",
      location: "Bangalore",
      mode: "Remote",
      responsibilities: [
        "Develop user-facing features using modern React.js and Next.js",
        "Build reusable components and front-end libraries for future use",
        "Translate designs and wireframes into high-quality code",
        "Optimize components for maximum performance across a vast array of web-capable devices and browsers",
        "Collaborate with back-end developers and web designers to improve usability",
        "Ensure high quality graphic standards and brand consistency"
      ],
      qualifications: [
        "Strong proficiency in JavaScript, including DOM manipulation",
        "Thorough understanding of React.js and its core principles",
        "Experience with popular React.js workflows (such as Redux)",
        "Familiarity with newer specifications of ECMAScript",
        "Knowledge of isomorphic React is a plus",
        "Familiarity with RESTful APIs",
        "Experience with frontend build pipelines and tools"
      ],
      goodToHave: [
        "Experience with TypeScript",
        "Knowledge of Tailwind CSS",
        "Familiarity with Figma or other design tools",
        "Experience with frontend testing frameworks (Jest, Cypress)"
      ]
    }
  },
  {
    id: "data_analyst_x3",
    title: "Data Analyst",
    status: "draft",
    createdAt: Date.now(),
    iconType: "database",
    color: "bg-orange-500",
    content: {
      summary: "We are seeking a detail-oriented Data Analyst to join our analytics team. You will be responsible for interpreting data, analyzing results, and providing ongoing reports to help drive business decisions.",
      experience: "3-5 years",
      location: "Hyderabad",
      mode: "On-site",
      responsibilities: [
        "Interpret data, analyze results using statistical techniques and provide ongoing reports",
        "Develop and implement databases, data collection systems, data analytics",
        "Acquire data from primary or secondary data sources and maintain databases",
        "Identify, analyze, and interpret trends or patterns in complex data sets",
        "Filter and 'clean' data by reviewing computer reports to locate and correct code problems",
        "Work with management to prioritize business and information needs"
      ],
      qualifications: [
        "Proven working experience as a Data Analyst or Business Data Analyst",
        "Technical expertise regarding data models, database design development",
        "Strong knowledge of and experience with reporting packages, databases (SQL etc)",
        "Knowledge of statistics and experience using statistical packages for analyzing datasets",
        "Strong analytical skills with the ability to collect, organize, analyze, and disseminate",
        "Adept at queries, report writing and presenting findings"
      ],
      goodToHave: [
        "Experience with Python or R for data analysis",
        "Knowledge of data visualization tools (Tableau, PowerBI)",
        "Familiarity with cloud data warehouses (Snowflake, BigQuery)",
        "Understanding of machine learning concepts"
      ]
    }
  }
];
