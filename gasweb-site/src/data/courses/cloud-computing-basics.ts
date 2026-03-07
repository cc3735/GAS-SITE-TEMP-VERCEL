import type { FullCourse } from '../courseContent';

export const cloudComputingBasics: FullCourse = {
  id: 'cloud-computing-basics',
  instructorName: 'James Rodriguez',
  instructorBio:
    'AWS Solutions Architect Professional with 8 years building cloud infrastructure.',
  learningOutcomes: [
    'Differentiate between IaaS, PaaS, and SaaS cloud service models and choose the right one for a given scenario',
    'Navigate core AWS services including EC2, S3, VPC, IAM, and RDS',
    'Apply cloud security best practices including identity management and data encryption',
    'Estimate and optimize cloud spending using budgets, reserved capacity, and right-sizing techniques',
  ],
  modules: [
    // ── Module 1: Cloud Models (IaaS/PaaS/SaaS) ──────────────────────
    {
      id: 'cloud-computing-basics__m1',
      title: 'Cloud Models (IaaS/PaaS/SaaS)',
      description:
        'Understand the three fundamental cloud service models, public vs. private vs. hybrid deployments, and how to evaluate which model fits your workload.',
      lessons: [
        {
          id: 'cloud-computing-basics__m1__l1',
          title: 'What Is Cloud Computing?',
          objectives: [
            'Define cloud computing and its five essential characteristics',
            'Explain the business drivers behind cloud adoption',
            'Describe the shared responsibility model at a high level',
          ],
          estimatedMinutes: 20,
          keyTakeaways: [
            'Cloud computing delivers IT resources on-demand over the internet with pay-as-you-go pricing',
            'The five NIST characteristics are on-demand self-service, broad network access, resource pooling, rapid elasticity, and measured service',
            'Cloud shifts capital expenditure (CapEx) to operational expenditure (OpEx), reducing upfront costs',
            'The shared responsibility model divides security duties between the cloud provider and the customer',
          ],
          content: `## What Is Cloud Computing?

At its simplest, cloud computing is the delivery of computing resources -- servers, storage, databases, networking, software, analytics, and intelligence -- over the internet ("the cloud") on a pay-as-you-go basis. Instead of buying and maintaining physical data centers and servers, you rent access to technology services from a cloud provider like Amazon Web Services (AWS), Microsoft Azure, or Google Cloud Platform (GCP).

### Why Cloud Computing Exists

Before the cloud, launching a new application meant months of planning. You had to estimate how many servers you would need, purchase the hardware, wait for it to ship, rack it in a data center, install operating systems, configure networking, and then finally deploy your code. If you overestimated demand, you wasted money on idle hardware. If you underestimated, your application crashed under load.

Cloud computing eliminates this friction. You can spin up a virtual server in seconds, scale to thousands of instances during a traffic spike, and shut everything down when you are done -- paying only for what you used.

### The Five Essential Characteristics

The National Institute of Standards and Technology (NIST) defines five essential characteristics that distinguish cloud computing from traditional hosting:

1. **On-demand self-service** -- You provision resources (servers, storage, databases) through a web console or API whenever you need them, without requiring human interaction with the provider.

2. **Broad network access** -- Resources are available over the network and accessed through standard mechanisms (web browsers, mobile apps, CLI tools) from any device.

3. **Resource pooling** -- The provider serves multiple customers from a shared pool of physical resources. You do not know (or need to know) the exact physical location of your data, though you can usually specify a region.

4. **Rapid elasticity** -- Resources can be elastically provisioned and released to scale with demand. To the consumer, the available resources often appear unlimited.

5. **Measured service** -- Usage is monitored, controlled, and reported. You pay only for what you consume, similar to a utility bill for electricity or water.

### CapEx vs. OpEx

One of the most compelling financial arguments for cloud computing is the shift from **Capital Expenditure (CapEx)** to **Operational Expenditure (OpEx)**.

- **CapEx** involves large upfront investments in physical infrastructure. You buy servers, networking equipment, and data center space before you earn a single dollar of revenue from them.
- **OpEx** spreads costs over time. With cloud, you pay a monthly bill based on actual usage. There is no upfront hardware purchase, no depreciation schedule, and no risk of investing in equipment that becomes obsolete.

This shift is especially powerful for startups and small businesses. A team of two developers can deploy a globally distributed application on the same infrastructure that powers Fortune 500 companies, paying only a few dollars per month until their traffic grows.

### The Shared Responsibility Model

Security in the cloud is a shared effort between the provider and the customer. The exact boundary depends on the service model (we will cover IaaS, PaaS, and SaaS in the next lessons), but the general principle is:

- **The provider is responsible for security OF the cloud** -- the physical data centers, the network infrastructure, the hypervisors, and the hardware.
- **The customer is responsible for security IN the cloud** -- the data they store, the access controls they configure, the applications they deploy, and the operating systems they manage (when applicable).

Understanding this boundary is critical. Many cloud security breaches happen not because the provider failed, but because the customer misconfigured an access policy or left data in a publicly accessible storage bucket.

### Cloud Computing in Practice

Consider a real-world example. A retail company wants to launch an e-commerce platform. With traditional IT, they would need to buy servers to handle Black Friday traffic -- hardware that sits mostly idle the other 364 days of the year. With cloud computing, they can:

- Run on a small number of servers during normal traffic periods
- Automatically scale to hundreds of servers during Black Friday
- Scale back down the next day
- Pay only for the compute hours actually consumed

This elastic model means the company gets the performance they need during peak demand without the waste of over-provisioned hardware.

### Try This

Visit the AWS Free Tier page (aws.amazon.com/free) and browse the services available at no cost. Notice how many different categories exist -- compute, storage, databases, machine learning, IoT, and more. This gives you a sense of how broad the cloud ecosystem has become.`,
        },
        {
          id: 'cloud-computing-basics__m1__l2',
          title: 'Infrastructure as a Service (IaaS)',
          objectives: [
            'Define IaaS and explain what the provider manages vs. what you manage',
            'Identify common IaaS use cases and when IaaS is the right choice',
            'Compare leading IaaS offerings across major cloud providers',
          ],
          estimatedMinutes: 20,
          keyTakeaways: [
            'IaaS provides virtualized computing resources (servers, storage, networking) on demand',
            'You manage the OS, middleware, runtime, and applications; the provider manages the physical infrastructure',
            'IaaS is ideal when you need full control over the computing environment or must run legacy applications',
            'AWS EC2, Azure Virtual Machines, and Google Compute Engine are leading IaaS offerings',
          ],
          content: `## Infrastructure as a Service (IaaS)

Infrastructure as a Service is the most fundamental cloud service model. It provides the basic building blocks of IT infrastructure -- virtual machines, storage volumes, and network components -- delivered as a service over the internet.

### What You Get with IaaS

Think of IaaS as renting a bare room in a building. The landlord (cloud provider) takes care of the building structure, electricity, plumbing, and security guards. But once you walk into your room, everything inside it is your responsibility: the furniture, the equipment, and how you arrange it all.

In cloud terms, the provider manages:
- Physical servers and data centers
- Networking hardware (routers, switches, firewalls)
- Storage hardware (disk arrays, SANs)
- Virtualization layer (hypervisors)

You manage:
- Operating systems (Linux, Windows)
- Middleware and runtime environments
- Applications and code
- Data
- Access controls and security configurations

### How IaaS Works in Practice

When you launch an IaaS virtual machine (VM), here is what happens behind the scenes:

1. You select a **machine type** -- the number of virtual CPUs, amount of RAM, and storage configuration.
2. You choose an **operating system image** -- a pre-configured template like Amazon Linux, Ubuntu, or Windows Server.
3. You configure **networking** -- which virtual network the VM belongs to, which ports are open, and which IP address it receives.
4. The provider allocates resources from its physical hardware pool, boots your VM, and gives you remote access (SSH for Linux, RDP for Windows).

The entire process takes about 60 seconds. Compare that to the weeks or months it takes to procure, ship, and configure a physical server.

### Common IaaS Use Cases

**Development and testing environments.** Developers spin up VMs to test new features, run integration tests, or experiment with different configurations. When they are done, they terminate the VMs and stop paying.

**Website and application hosting.** You deploy web servers, application servers, and background workers on IaaS VMs, maintaining full control over the software stack.

**High-performance computing (HPC).** Research teams rent hundreds of powerful VMs to run simulations, genomic analysis, or financial modeling, then release the resources when the computation finishes.

**Disaster recovery.** Instead of maintaining a duplicate physical data center, you replicate critical systems to a cloud region. If your primary site goes down, you fail over to the cloud environment.

**Legacy application migration.** Applications that require specific OS versions or custom configurations can be "lifted and shifted" to IaaS VMs with minimal code changes.

### Leading IaaS Offerings

| Provider | Service | Key Feature |
|----------|---------|-------------|
| AWS | EC2 (Elastic Compute Cloud) | Widest selection of instance types |
| Azure | Virtual Machines | Deep integration with Windows ecosystem |
| GCP | Compute Engine | Per-second billing, live migration |

### When to Choose IaaS

Choose IaaS when you need:
- Full control over the operating system and software stack
- The ability to run custom or legacy software that cannot run on managed platforms
- Predictable, consistent performance for workloads with specific hardware requirements
- Compliance with regulations that require you to manage security at the OS level

IaaS gives you the most flexibility but also the most responsibility. You are responsible for patching the operating system, configuring firewalls, managing backups, and scaling your infrastructure.

### IaaS Pricing Models

Most IaaS providers offer several pricing options:

- **On-demand** -- Pay by the hour or second with no commitment. Best for unpredictable workloads.
- **Reserved instances** -- Commit to one or three years for a significant discount (up to 72% on AWS). Best for steady-state workloads.
- **Spot/preemptible instances** -- Use spare capacity at a steep discount (up to 90% off). The provider can reclaim these instances with short notice. Best for fault-tolerant batch processing.

Understanding these pricing models is essential for managing cloud costs, which we will cover in depth in Module 4.`,
        },
        {
          id: 'cloud-computing-basics__m1__l3',
          title: 'Platform as a Service (PaaS)',
          objectives: [
            'Define PaaS and explain how it differs from IaaS',
            'Identify scenarios where PaaS accelerates development',
            'Describe the trade-offs between PaaS convenience and control',
          ],
          estimatedMinutes: 18,
          keyTakeaways: [
            'PaaS provides a managed platform for deploying applications without managing the underlying infrastructure',
            'The provider manages the OS, runtime, and middleware; you manage the application code and data',
            'PaaS accelerates development by eliminating infrastructure management overhead',
            'Vendor lock-in is a key risk to evaluate when choosing PaaS',
          ],
          content: `## Platform as a Service (PaaS)

Platform as a Service sits one layer above IaaS in the cloud service model stack. With PaaS, the cloud provider manages not only the physical infrastructure but also the operating system, middleware, and runtime environment. You focus entirely on writing and deploying your application code.

### The PaaS Abstraction

Extending our building analogy: if IaaS is renting a bare room, PaaS is renting a fully furnished office. The landlord provides the desks, chairs, internet connection, and even the computers. You just show up, sit down, and start working.

In cloud terms, the provider manages:
- Physical infrastructure (same as IaaS)
- Operating system patches and updates
- Runtime environment (Node.js, Python, Java, .NET)
- Middleware (web servers, application servers)
- Auto-scaling and load balancing

You manage:
- Application code
- Data
- Application-level configurations
- User access controls

### How PaaS Works in Practice

A typical PaaS deployment workflow looks like this:

1. You write your application code locally and push it to a Git repository.
2. The PaaS platform detects the push, identifies the programming language, and builds your application.
3. The platform provisions the necessary infrastructure (servers, load balancers, SSL certificates) automatically.
4. Your application is live and accessible via a URL. The platform handles scaling, health monitoring, and restarts.

Notice what is missing from this workflow: you never configured a server, installed an operating system, or set up a web server. The platform handles all of that.

### Common PaaS Offerings

| Provider | Service | Best For |
|----------|---------|----------|
| AWS | Elastic Beanstalk | Java, .NET, PHP, Node.js, Python apps |
| AWS | Lambda (serverless) | Event-driven functions |
| Azure | App Service | .NET and Windows-native applications |
| GCP | App Engine | Python, Java, Go applications |
| Heroku | Heroku Platform | Rapid prototyping and startups |
| Vercel | Vercel Platform | Frontend and serverless applications |

### When PaaS Shines

**Rapid development cycles.** When your team needs to ship features quickly, PaaS eliminates the overhead of managing servers. Developers focus on business logic instead of infrastructure.

**Microservices architecture.** PaaS platforms excel at running many small, independent services. Each microservice can be deployed, scaled, and updated independently.

**API backends.** Building a REST API or GraphQL endpoint is straightforward on PaaS. The platform handles SSL, load balancing, and auto-scaling.

**Prototyping and MVPs.** When you need to validate an idea quickly, PaaS lets you go from code to production in minutes rather than days.

### The Trade-offs

PaaS simplifies operations, but it comes with trade-offs you should understand:

**Less control.** You cannot customize the operating system, install arbitrary system packages, or fine-tune server configurations. If your application has unusual requirements, PaaS may not accommodate them.

**Vendor lock-in.** PaaS platforms often use proprietary APIs, deployment tools, and configuration formats. Migrating from one PaaS provider to another can require significant rework. For example, an application built specifically for AWS Elastic Beanstalk may need modifications to run on Azure App Service.

**Cold starts.** Serverless PaaS offerings (like AWS Lambda) may experience "cold starts" -- a brief delay when a function is invoked after being idle. For latency-sensitive applications, this can be a concern.

**Cost at scale.** PaaS can be more expensive per compute unit than IaaS because you are paying for the managed services layer. For large, steady-state workloads, running your own servers on IaaS may be more cost-effective.

### PaaS vs. IaaS: A Decision Framework

Ask yourself these questions:

1. **Do I need full OS access?** If yes, choose IaaS.
2. **Is speed of deployment more important than customization?** If yes, choose PaaS.
3. **Am I running a standard web application in a popular language?** PaaS is likely the better fit.
4. **Do I have a dedicated ops team?** If not, PaaS reduces the operational burden.
5. **Am I concerned about vendor lock-in?** If yes, choose IaaS or use container-based PaaS solutions that are more portable.

### Try This

Think about a recent project you have worked on or a personal application you would like to build. List the technology stack it requires (programming language, database, caching layer). Then visit the AWS Elastic Beanstalk documentation and check whether your stack is supported. This exercise helps you evaluate whether PaaS is a realistic option for your specific workload.`,
        },
        {
          id: 'cloud-computing-basics__m1__l4',
          title: 'SaaS and Choosing the Right Model',
          objectives: [
            'Define SaaS and explain how it differs from IaaS and PaaS',
            'Compare all three service models across a set of evaluation criteria',
            'Apply a decision framework to choose the right model for a given scenario',
          ],
          estimatedMinutes: 20,
          keyTakeaways: [
            'SaaS delivers complete applications over the internet with the provider managing everything except user data and access',
            'The choice between IaaS, PaaS, and SaaS depends on how much control you need vs. how much management you want to offload',
            'Hybrid approaches are common -- organizations often use all three models for different workloads',
          ],
          content: `## SaaS and Choosing the Right Model

Software as a Service (SaaS) is the cloud service model you are probably most familiar with, even if you have never thought of it that way. Every time you use Gmail, Slack, Salesforce, or Dropbox, you are using SaaS.

### What Is SaaS?

SaaS delivers a complete, ready-to-use application over the internet. The provider manages everything -- the infrastructure, the platform, and the application itself. You simply sign up, log in, and start using the software.

Going back to our building analogy: if IaaS is renting a bare room and PaaS is a furnished office, SaaS is hiring a co-working space where everything is set up. You walk in, connect to Wi-Fi, and get to work. You do not think about the furniture, the internet provider, or the cleaning service.

In cloud terms, the provider manages:
- Physical infrastructure
- Operating system, runtime, and middleware
- The application code and feature updates
- Security patches and bug fixes
- Data backups and disaster recovery

You manage:
- Your data within the application
- User accounts and access permissions
- Application configuration and preferences

### Common SaaS Examples

SaaS spans virtually every business function:

| Category | Examples |
|----------|----------|
| Email & Communication | Gmail, Microsoft 365, Slack, Zoom |
| CRM | Salesforce, HubSpot |
| Project Management | Jira, Asana, Monday.com |
| Accounting | QuickBooks Online, Xero |
| HR & Payroll | Workday, BambooHR |
| Design | Figma, Canva |
| Development | GitHub, GitLab |

### Comparing the Three Models

Here is a comprehensive comparison to help you understand the spectrum:

**Level of Control**
- IaaS: High -- you control the OS, middleware, runtime, and applications
- PaaS: Medium -- you control the application code and data
- SaaS: Low -- you control data and user settings only

**Operational Overhead**
- IaaS: High -- you patch servers, configure networking, manage scaling
- PaaS: Medium -- the platform handles infrastructure, you manage application-level concerns
- SaaS: Low -- the provider handles nearly everything

**Flexibility**
- IaaS: Maximum -- run anything that runs on a standard OS
- PaaS: Moderate -- limited to supported languages and frameworks
- SaaS: Minimal -- use the application as designed, with some configuration options

**Time to Production**
- IaaS: Days to weeks (configure servers, install software, deploy)
- PaaS: Hours to days (write code, push, deploy)
- SaaS: Minutes (sign up and start using)

### Deployment Models: Public, Private, and Hybrid

Beyond the service model (IaaS/PaaS/SaaS), you also need to choose a deployment model:

**Public cloud** -- Resources are owned and operated by a third-party provider and shared across multiple customers. AWS, Azure, and GCP are public clouds. This is the most common and cost-effective option for most workloads.

**Private cloud** -- Resources are dedicated to a single organization. The cloud can be hosted on-premises or by a third party. Private clouds offer more control and are common in regulated industries like healthcare and finance.

**Hybrid cloud** -- A combination of public and private clouds, connected by technology that allows data and applications to move between them. Many enterprises use hybrid architectures to keep sensitive data on-premises while leveraging the public cloud for scalable compute.

**Multi-cloud** -- Using services from multiple public cloud providers. Organizations adopt multi-cloud strategies to avoid vendor lock-in, leverage best-of-breed services, or meet data residency requirements.

### A Decision Framework

When evaluating which cloud model to use for a specific workload, walk through these questions:

1. **Is there an existing SaaS solution that meets your needs?** If a well-established SaaS product covers 80% or more of your requirements, it is almost always faster and cheaper than building from scratch.

2. **Do you need custom application logic?** If yes, you are choosing between PaaS and IaaS. Move to the next question.

3. **Does your application use a standard technology stack?** If yes, PaaS will accelerate your development and reduce operational burden.

4. **Do you need OS-level access or custom system configurations?** If yes, IaaS is your model.

5. **What are your compliance and security requirements?** Some regulations require specific control over data and infrastructure that may influence your choice.

### Real-World Scenario

A mid-sized marketing agency is planning its IT strategy. Here is how they might use all three models:

- **SaaS**: Slack for team communication, Salesforce for CRM, QuickBooks for accounting
- **PaaS**: A custom client reporting dashboard deployed on AWS Elastic Beanstalk
- **IaaS**: A video rendering pipeline on EC2 instances with GPU acceleration, requiring custom FFmpeg configurations

This hybrid approach is extremely common. Most organizations use a mix of service models tailored to each workload's requirements.

### Try This

Make a list of the software tools and services your organization (or a hypothetical one) uses daily. Categorize each as IaaS, PaaS, or SaaS. You may be surprised how many SaaS tools you already rely on. Then identify one process that is currently manual or running on local hardware. Which cloud service model would be the best fit for migrating it?`,
        },
      ],
      quiz: [
        {
          id: 'cloud-computing-basics__m1__q1',
          question:
            'A startup needs to launch an MVP web application in two weeks. They use Node.js and PostgreSQL. Their team has no dedicated operations engineers. Which cloud service model is the best fit?',
          options: [
            'IaaS -- they need full control over the server environment',
            'PaaS -- the managed platform handles infrastructure while they focus on code',
            'SaaS -- they should use an existing no-code application builder',
            'Private cloud -- startups need maximum security from day one',
          ],
          correctIndex: 1,
          explanation:
            'PaaS is ideal here because the team lacks ops expertise and needs to ship quickly. A platform like AWS Elastic Beanstalk or Heroku supports Node.js and PostgreSQL natively, handling server provisioning, scaling, and OS patches so the developers can focus on building features.',
        },
        {
          id: 'cloud-computing-basics__m1__q2',
          question:
            'Which of the following is NOT one of the five essential characteristics of cloud computing as defined by NIST?',
          options: [
            'On-demand self-service',
            'Rapid elasticity',
            'Guaranteed 99.999% uptime',
            'Measured service',
          ],
          correctIndex: 2,
          explanation:
            'The five NIST characteristics are on-demand self-service, broad network access, resource pooling, rapid elasticity, and measured service. Uptime guarantees are part of Service Level Agreements (SLAs), not a defining characteristic of cloud computing itself.',
        },
        {
          id: 'cloud-computing-basics__m1__q3',
          question:
            'A financial services company must run a legacy application that requires a specific version of Red Hat Enterprise Linux with custom kernel modules. Which model should they use?',
          options: [
            'SaaS because it requires the least management',
            'PaaS because it supports Linux applications',
            'IaaS because they need full OS-level control',
            'Multi-cloud to spread risk across providers',
          ],
          correctIndex: 2,
          explanation:
            'IaaS is the correct choice because the company needs full control over the operating system, including the ability to install a specific RHEL version and custom kernel modules. PaaS abstracts away OS-level access, and SaaS provides no infrastructure control at all.',
        },
        {
          id: 'cloud-computing-basics__m1__q4',
          question:
            'In the shared responsibility model, a customer discovers that their S3 bucket containing client data is publicly accessible. Who is responsible for this misconfiguration?',
          options: [
            'AWS, because they manage the S3 service infrastructure',
            'The customer, because access controls are the customer\'s responsibility',
            'Both equally, because security is always a 50/50 split',
            'Neither -- public buckets are a feature, not a misconfiguration',
          ],
          correctIndex: 1,
          explanation:
            'Under the shared responsibility model, the cloud provider manages security OF the cloud (physical infrastructure, service availability), while the customer manages security IN the cloud (data, access controls, configurations). S3 bucket permissions are the customer\'s responsibility.',
        },
        {
          id: 'cloud-computing-basics__m1__q5',
          question:
            'A company currently spends $500,000 annually on physical servers that are utilized at only 15% capacity on average. Which cloud computing benefit most directly addresses this waste?',
          options: [
            'Broad network access',
            'Rapid elasticity and pay-as-you-go pricing',
            'Resource pooling',
            'On-demand self-service',
          ],
          correctIndex: 1,
          explanation:
            'Rapid elasticity combined with pay-as-you-go pricing directly addresses over-provisioning. The company can scale resources up during peak demand and down during quiet periods, paying only for what they actually use instead of maintaining idle hardware.',
        },
        {
          id: 'cloud-computing-basics__m1__q6',
          question:
            'A healthcare organization needs to keep patient records on-premises due to regulations but wants to use cloud computing for its public-facing appointment booking system. Which deployment model fits?',
          options: [
            'Public cloud for everything with encryption',
            'Private cloud for everything to maximize control',
            'Hybrid cloud combining on-premises and public cloud',
            'Multi-cloud using multiple public providers',
          ],
          correctIndex: 2,
          explanation:
            'A hybrid cloud model allows the organization to keep sensitive patient data on-premises (meeting regulatory requirements) while leveraging the public cloud\'s scalability and cost-effectiveness for the appointment booking system. This is a textbook hybrid cloud use case.',
        },
      ],
    },

    // ── Module 2: AWS Core Services ───────────────────────────────────────
    {
      id: 'cloud-computing-basics__m2',
      title: 'AWS Core Services',
      description:
        'Get hands-on with the foundational AWS services every cloud practitioner must know: EC2 for compute, S3 for storage, VPC for networking, and IAM for access control.',
      lessons: [
        {
          id: 'cloud-computing-basics__m2__l1',
          title: 'EC2: Elastic Compute Cloud',
          objectives: [
            'Explain what EC2 is and how virtual machines work in AWS',
            'Choose the appropriate instance type and size for a given workload',
            'Describe the EC2 launch process including AMIs, security groups, and key pairs',
          ],
          estimatedMinutes: 25,
          keyTakeaways: [
            'EC2 provides resizable virtual servers in the cloud with full root access',
            'Instance types are optimized for different workloads: general purpose, compute-optimized, memory-optimized, storage-optimized, and accelerated computing',
            'An Amazon Machine Image (AMI) is a template that contains the OS and pre-installed software for your instance',
            'Security groups act as virtual firewalls controlling inbound and outbound traffic to your instances',
          ],
          content: `## EC2: Elastic Compute Cloud

Amazon Elastic Compute Cloud (EC2) is the backbone of AWS. It provides resizable virtual servers -- called **instances** -- that you can launch in minutes and configure to run virtually any workload. EC2 was one of the first services AWS offered when it launched in 2006, and it remains the foundation on which countless applications are built.

### How EC2 Works

When you launch an EC2 instance, AWS allocates a portion of a physical server in one of its data centers to your virtual machine. A technology called a **hypervisor** sits between the physical hardware and your virtual machine, ensuring that your instance is isolated from other customers' instances running on the same physical host.

From your perspective, the EC2 instance looks and behaves like a dedicated physical server. You get:
- A specified number of virtual CPUs (vCPUs)
- A specified amount of RAM
- Temporary or persistent storage
- A network interface with a private IP address (and optionally a public one)
- Full root/administrator access

### Instance Types

AWS offers hundreds of instance types organized into families, each optimized for different use cases:

**General Purpose (T3, M6i)** -- Balanced compute, memory, and networking. Ideal for web servers, development environments, and small databases. The T3 family offers "burstable" performance, where instances accumulate CPU credits during low-usage periods and spend them during traffic spikes.

**Compute Optimized (C6i)** -- High-performance processors for compute-intensive tasks like batch processing, scientific modeling, gaming servers, and video encoding.

**Memory Optimized (R6i, X2idn)** -- Designed for workloads that process large datasets in memory, such as in-memory databases (Redis, Memcached), real-time analytics, and SAP HANA.

**Storage Optimized (I3, D3)** -- High sequential read/write access to very large datasets on local storage. Common for data warehousing, distributed file systems, and log processing.

**Accelerated Computing (P4d, G5)** -- GPU-powered instances for machine learning training, graphics rendering, and high-performance computing.

### Launching an EC2 Instance

The launch process involves several key decisions:

**1. Choose an AMI (Amazon Machine Image).** An AMI is a template that contains the operating system and optionally pre-installed software. AWS provides official AMIs for Amazon Linux, Ubuntu, Windows Server, Red Hat, and more. You can also create custom AMIs with your own software pre-configured, which speeds up future launches.

**2. Select an instance type.** Based on your workload requirements, choose the right family and size. Instance sizes within a family follow a pattern: t3.micro (1 vCPU, 1 GB RAM), t3.small (2 vCPU, 2 GB), t3.medium (2 vCPU, 4 GB), and so on up to very large configurations.

**3. Configure networking.** Place your instance in a specific Virtual Private Cloud (VPC) and subnet. Assign a public IP if the instance needs to be accessible from the internet.

**4. Add storage.** Attach Elastic Block Store (EBS) volumes for persistent storage. EBS volumes persist independently of the instance -- if you stop or terminate the instance, the data on EBS remains (unless you configure it to delete on termination).

**5. Configure security groups.** A security group acts as a virtual firewall. You define rules that specify which traffic is allowed to reach your instance. For example, you might allow SSH (port 22) from your office IP address and HTTP (port 80) from anywhere.

**6. Create or select a key pair.** For Linux instances, you use an SSH key pair for authentication. AWS generates the key pair and gives you the private key file (.pem). Guard this file carefully -- it is the only way to access your instance.

### Instance Lifecycle

EC2 instances have several states:

- **Running** -- The instance is active and you are being charged for compute time.
- **Stopped** -- The instance is shut down. You are not charged for compute, but you still pay for attached EBS volumes.
- **Terminated** -- The instance is permanently deleted. EBS volumes are deleted too (unless configured otherwise).

You can stop an instance to save money during off-hours and start it again when needed. The instance retains its configuration and EBS data, though it may receive a new public IP address.

### Practical Tip

For learning and experimentation, use the **t3.micro** instance type, which is included in the AWS Free Tier (750 hours per month for the first 12 months). Pair it with the Amazon Linux 2023 AMI, which is also free and optimized for AWS.`,
        },
        {
          id: 'cloud-computing-basics__m2__l2',
          title: 'S3: Simple Storage Service',
          objectives: [
            'Explain what S3 is and how object storage differs from block storage',
            'Describe S3 storage classes and when to use each',
            'Configure basic S3 bucket policies and access controls',
          ],
          estimatedMinutes: 22,
          keyTakeaways: [
            'S3 is an object storage service designed for 99.999999999% (11 nines) durability',
            'Objects are stored in buckets and accessed via unique keys, not file paths',
            'Storage classes (Standard, IA, Glacier) trade access speed for lower cost',
            'Bucket policies and ACLs control who can access your stored data',
          ],
          content: `## S3: Simple Storage Service

Amazon S3 is one of the most widely used cloud services in the world. It provides virtually unlimited object storage with industry-leading durability, availability, and performance. Whether you are storing application assets, backing up databases, hosting a static website, or building a data lake for analytics, S3 is likely part of the solution.

### Object Storage vs. Block Storage

Before diving into S3, it helps to understand the difference between object storage and block storage:

**Block storage** (like EBS) works like a traditional hard drive. Data is stored in fixed-size blocks, and the operating system manages a file system on top of those blocks. You can install operating systems on block storage, run databases, and perform random read/write operations efficiently.

**Object storage** (like S3) stores data as discrete objects, each consisting of:
- The **data** itself (a file of any type and size up to 5 TB)
- **Metadata** (key-value pairs describing the object, like content type, creation date, custom tags)
- A **unique key** (the identifier used to retrieve the object)

Objects are stored in **buckets** -- logical containers with globally unique names. Unlike a file system, S3 has a flat structure. The path "images/2024/photo.jpg" is not a folder hierarchy -- it is a single key string. S3 console and tools simulate folders for convenience, but technically every object sits at the same level within a bucket.

### S3 Durability and Availability

S3 Standard is designed for **99.999999999% durability** (often called "11 nines"). This means that if you store 10 million objects, you can statistically expect to lose a single object once every 10,000 years. AWS achieves this by automatically replicating your data across at least three physically separate Availability Zones within a region.

Availability (uptime) for S3 Standard is 99.99%, which translates to about 52 minutes of downtime per year.

### Storage Classes

S3 offers multiple storage classes that balance cost, access frequency, and retrieval time:

**S3 Standard** -- For frequently accessed data. Low latency, high throughput. This is the default and most expensive per-GB option.

**S3 Intelligent-Tiering** -- Automatically moves objects between frequent and infrequent access tiers based on usage patterns. Ideal when access patterns are unpredictable. There is a small monthly monitoring fee per object.

**S3 Standard-Infrequent Access (S3 Standard-IA)** -- Lower storage cost than Standard but with a per-GB retrieval fee. Best for data accessed less than once a month but requiring millisecond access when needed (backups, disaster recovery copies).

**S3 One Zone-IA** -- Same as Standard-IA but stored in a single Availability Zone. Cheaper, but less resilient. Good for data you can recreate if lost, like thumbnail caches.

**S3 Glacier Instant Retrieval** -- Lowest cost for long-lived data that is rarely accessed but needs millisecond retrieval. Up to 68% cheaper than Standard-IA.

**S3 Glacier Flexible Retrieval** -- For archive data that does not need immediate access. Retrieval times range from minutes to hours. Extremely low storage cost.

**S3 Glacier Deep Archive** -- The cheapest storage class. Designed for data retained for 7-10 years or more, like compliance records. Retrieval takes 12-48 hours.

### Access Control

S3 provides multiple layers of access control:

**Block Public Access** -- A bucket-level setting that overrides any other policy to prevent public access. AWS enables this by default on new buckets, and you should leave it enabled unless you have a specific reason to serve public content.

**Bucket policies** -- JSON-based policies attached to a bucket that define what actions (GetObject, PutObject, DeleteObject) are allowed or denied for specific principals (users, accounts, services).

**IAM policies** -- Attached to IAM users, groups, or roles to control which S3 actions they can perform across buckets.

**Access Control Lists (ACLs)** -- A legacy mechanism that grants basic read/write permissions. AWS recommends using bucket policies and IAM policies instead.

### Common S3 Use Cases

- **Static website hosting**: Serve HTML, CSS, JavaScript, and images directly from S3 with no web server needed
- **Data lake foundation**: Store raw data from multiple sources in S3 and query it with services like Athena or Redshift Spectrum
- **Application asset storage**: Store user uploads, media files, and documents
- **Backup and archive**: Use lifecycle policies to automatically move aging data to cheaper storage classes
- **Log storage**: Centralize logs from EC2, CloudFront, ELB, and other services

### Try This

If you have an AWS account, create an S3 bucket with a unique name. Upload a text file. Then try accessing it via the object URL in your browser -- you will get an "Access Denied" error because Block Public Access is enabled by default. This is exactly the behavior you want for most use cases.`,
        },
        {
          id: 'cloud-computing-basics__m2__l3',
          title: 'VPC: Virtual Private Cloud',
          objectives: [
            'Explain what a VPC is and why network isolation matters in the cloud',
            'Design a basic VPC with public and private subnets',
            'Describe the roles of internet gateways, NAT gateways, and route tables',
          ],
          estimatedMinutes: 25,
          keyTakeaways: [
            'A VPC is a logically isolated virtual network within AWS where you launch resources',
            'Subnets divide a VPC into segments; public subnets have routes to the internet, private subnets do not',
            'Internet gateways enable internet access for public subnets; NAT gateways let private subnets make outbound connections',
            'Route tables control how traffic flows between subnets and to/from the internet',
          ],
          content: `## VPC: Virtual Private Cloud

Amazon Virtual Private Cloud (VPC) lets you create a logically isolated section of the AWS cloud where you launch resources in a virtual network that you define. You have complete control over the network configuration: IP address ranges, subnets, route tables, and network gateways.

### Why Network Isolation Matters

In the early days of cloud computing, all resources shared a flat network. Your EC2 instances could potentially communicate with any other instance in the same region. This was a security concern -- a compromised instance could probe and attack neighboring resources.

VPC solves this by giving each customer their own isolated network. Resources in your VPC cannot communicate with resources in another customer's VPC unless you explicitly configure connectivity. This isolation is fundamental to cloud security.

### VPC Fundamentals

**CIDR Block.** When you create a VPC, you define its IP address range using CIDR (Classless Inter-Domain Routing) notation. For example, a VPC with CIDR block 10.0.0.0/16 provides 65,536 IP addresses (10.0.0.0 through 10.0.255.255). Choose your CIDR block carefully -- it cannot overlap with other VPCs you want to connect to or with your on-premises network.

**Subnets.** A subnet is a range of IP addresses within your VPC. You create subnets in specific Availability Zones (AZs). A well-designed VPC distributes subnets across multiple AZs for high availability.

There are two types of subnets:
- **Public subnets** have a route to an internet gateway, allowing resources with public IPs to communicate with the internet.
- **Private subnets** have no direct route to the internet. Resources in private subnets can only be reached from within the VPC (or through a VPN/peering connection).

### A Standard Two-Tier Architecture

The most common VPC design uses two tiers:

**Public subnet (presentation tier):**
- Contains load balancers and bastion hosts (jump servers)
- Has a route to the internet gateway
- Resources here have public IP addresses

**Private subnet (application/data tier):**
- Contains application servers, databases, and caches
- No direct internet access
- Communicates with the internet only through a NAT gateway (for outbound connections like software updates)
- Only accepts traffic from the public subnet

This design follows the principle of least privilege: only the components that must be internet-facing are placed in public subnets. Everything else is hidden in private subnets.

### Key VPC Components

**Internet Gateway (IGW).** An IGW is a horizontally scaled, redundant, and highly available VPC component that enables communication between your VPC and the internet. You attach one IGW to a VPC. Without an IGW, nothing in the VPC can reach the internet, even if resources have public IP addresses.

**NAT Gateway.** A Network Address Translation (NAT) gateway allows resources in private subnets to initiate outbound connections to the internet (for example, to download software updates) while preventing unsolicited inbound connections. The NAT gateway sits in a public subnet and translates private IP addresses to its own public IP for outbound traffic.

**Route Tables.** Every subnet is associated with a route table that determines where network traffic is directed. A public subnet's route table includes a route sending internet-bound traffic (0.0.0.0/0) to the internet gateway. A private subnet's route table sends internet-bound traffic to the NAT gateway.

**Security Groups.** As mentioned in the EC2 lesson, security groups act as stateful firewalls at the instance level. "Stateful" means that if you allow an inbound request, the response is automatically allowed regardless of outbound rules.

**Network ACLs (NACLs).** Network Access Control Lists operate at the subnet level and are stateless -- you must explicitly allow both inbound and outbound traffic. NACLs provide an additional layer of defense. Most teams use security groups as the primary firewall and NACLs as a secondary layer for broad rules (like blocking an entire IP range).

### Designing for High Availability

A production VPC should span at least two Availability Zones:

- AZ-a: Public subnet A + Private subnet A
- AZ-b: Public subnet B + Private subnet B

Your load balancer distributes traffic across both public subnets. Application servers run in both private subnets. If one AZ experiences an outage, the other AZ continues serving traffic.

### VPC Peering and Transit Gateway

As your cloud environment grows, you may need to connect multiple VPCs:

**VPC Peering** creates a direct, private connection between two VPCs. Traffic never traverses the public internet. Peering works across regions and even across AWS accounts.

**Transit Gateway** acts as a hub that connects multiple VPCs, VPN connections, and on-premises networks through a central point. It simplifies network architecture when you have many VPCs that need to communicate.

### Try This

Sketch a VPC diagram on paper with a /16 CIDR block (10.0.0.0/16). Create four subnets: two public (10.0.1.0/24 and 10.0.2.0/24) in different AZs, and two private (10.0.3.0/24 and 10.0.4.0/24) in the same AZs. Draw the internet gateway, NAT gateway, and route tables. This visual exercise solidifies how VPC networking fits together.`,
        },
        {
          id: 'cloud-computing-basics__m2__l4',
          title: 'IAM: Identity and Access Management',
          objectives: [
            'Explain the purpose of IAM and the principle of least privilege',
            'Differentiate between IAM users, groups, roles, and policies',
            'Write a basic IAM policy that grants specific permissions',
          ],
          estimatedMinutes: 22,
          keyTakeaways: [
            'IAM controls who (authentication) can do what (authorization) in your AWS account',
            'The principle of least privilege means granting only the permissions necessary to perform a task',
            'IAM roles are preferred over long-lived access keys for granting permissions to services and applications',
            'IAM policies are JSON documents that define allow/deny rules for specific actions on specific resources',
          ],
          content: `## IAM: Identity and Access Management

AWS Identity and Access Management (IAM) is the service that controls authentication (who are you?) and authorization (what are you allowed to do?) for your entire AWS account. Every API call to any AWS service is evaluated against IAM policies. Understanding IAM is not optional -- it is the foundation of cloud security.

### The Principle of Least Privilege

The single most important concept in IAM is the **principle of least privilege**: every user, application, and service should have only the minimum permissions needed to perform its function, and nothing more.

This principle seems obvious, but in practice it is frequently violated. Teams often grant broad permissions ("AdministratorAccess") to move fast, creating security risks. A compromised account with administrator access can delete every resource in your AWS environment. An account with only "S3 read access to a single bucket" limits the blast radius dramatically.

### IAM Building Blocks

**Root Account.** When you first create an AWS account, you get a root user with unrestricted access to everything. Best practice: secure the root account with a strong password and MFA, then never use it for day-to-day operations. Create IAM users instead.

**IAM Users.** An IAM user represents a person or application that interacts with AWS. Each user has:
- A unique username
- Optional console password (for web access)
- Optional access keys (for CLI/API access)
- Permissions defined by attached policies

**IAM Groups.** A group is a collection of IAM users. You attach policies to the group, and all members inherit those permissions. This simplifies management -- instead of attaching policies to 50 individual developers, you create a "Developers" group with the right policies and add users to it.

**IAM Roles.** A role is like a user, but it is not associated with a specific person. Instead, roles are assumed temporarily by:
- EC2 instances that need to access other AWS services
- Lambda functions that read from S3 or write to DynamoDB
- Users who need temporary elevated permissions
- External applications authenticating via federation

Roles are the preferred mechanism for granting permissions to AWS services. They provide temporary credentials that automatically rotate, eliminating the risk of leaked long-lived access keys.

**IAM Policies.** A policy is a JSON document that defines permissions. It specifies:
- **Effect**: Allow or Deny
- **Action**: The AWS API actions permitted or denied (e.g., s3:GetObject, ec2:StartInstances)
- **Resource**: The specific AWS resources the policy applies to (identified by ARN)
- **Condition** (optional): Circumstances under which the policy applies (e.g., only from a specific IP range)

Here is an example policy that allows reading objects from a specific S3 bucket:

\`\`\`json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:GetObject",
        "s3:ListBucket"
      ],
      "Resource": [
        "arn:aws:s3:::my-app-data",
        "arn:aws:s3:::my-app-data/*"
      ]
    }
  ]
}
\`\`\`

This policy follows least privilege: it grants read access to one specific bucket and nothing else.

### Policy Types

**AWS Managed Policies** -- Pre-built policies created and maintained by AWS (e.g., AmazonS3ReadOnlyAccess). Convenient but often broader than necessary.

**Customer Managed Policies** -- Policies you create and maintain. These allow precise, tailored permissions aligned with your specific requirements.

**Inline Policies** -- Policies embedded directly in a user, group, or role. Use these sparingly, as they are harder to manage and audit than standalone policies.

### Multi-Factor Authentication (MFA)

MFA adds a second layer of authentication beyond a password. Even if an attacker obtains a user's password, they cannot access the account without the MFA device. AWS supports:
- Virtual MFA apps (Google Authenticator, Authy)
- Hardware MFA keys (YubiKey)
- SMS-based MFA (least secure, not recommended)

Enable MFA on the root account immediately. Require MFA for all IAM users who have console access.

### IAM Best Practices

1. **Never use the root account for daily tasks.** Create IAM users with appropriate permissions.
2. **Enable MFA everywhere.** Especially on the root account and any user with elevated privileges.
3. **Use roles instead of access keys.** EC2 instances, Lambda functions, and other services should assume IAM roles rather than store access keys.
4. **Apply least privilege.** Start with no permissions and add only what is needed. Use AWS Access Analyzer to identify unused permissions.
5. **Use groups to assign permissions.** Manage permissions at the group level, not the individual user level.
6. **Rotate credentials regularly.** If you must use access keys, rotate them every 90 days.
7. **Audit with CloudTrail.** AWS CloudTrail logs every API call, allowing you to see who did what, when, and from where.

### IAM Policy Evaluation Logic

When AWS evaluates a request, it follows this logic:
1. By default, all requests are **denied** (implicit deny).
2. An explicit **Allow** in a policy overrides the implicit deny.
3. An explicit **Deny** in any policy overrides any Allow.

This means if a user has one policy that allows S3 access and another that denies S3 access, the deny wins. Explicit deny always takes precedence.

### Try This

Log into the AWS console and navigate to IAM. Create a new user with programmatic access only (no console password). Attach the "AmazonS3ReadOnlyAccess" managed policy. Then open the policy and read the JSON -- notice how it grants s3:Get* and s3:List* actions on all S3 resources. Consider how you would narrow this to a single bucket.`,
        },
      ],
      quiz: [
        {
          id: 'cloud-computing-basics__m2__q1',
          question:
            'A development team is building a web application that processes images uploaded by users. The images need to be stored durably and accessed frequently by the application. Which AWS service and storage class combination is most appropriate?',
          options: [
            'EBS General Purpose SSD attached to each application server',
            'S3 Standard for its durability and low-latency access',
            'S3 Glacier because storage costs are lowest',
            'EC2 instance store for maximum I/O performance',
          ],
          correctIndex: 1,
          explanation:
            'S3 Standard provides 11 nines of durability, high availability, and low-latency access for frequently used data. EBS would work but ties storage to specific instances. Glacier is for archival data with slow retrieval. Instance store is ephemeral and data is lost when the instance stops.',
        },
        {
          id: 'cloud-computing-basics__m2__q2',
          question:
            'An application running on an EC2 instance in a private subnet needs to download security patches from the internet. The instance should NOT be directly accessible from the internet. What must be configured?',
          options: [
            'Attach a public IP address to the instance',
            'Move the instance to a public subnet temporarily',
            'Place a NAT gateway in a public subnet and route the private subnet\'s internet traffic through it',
            'Create a VPC peering connection to the internet',
          ],
          correctIndex: 2,
          explanation:
            'A NAT gateway in a public subnet allows instances in private subnets to initiate outbound internet connections (like downloading patches) while preventing unsolicited inbound traffic. Assigning a public IP or moving to a public subnet would expose the instance directly to the internet.',
        },
        {
          id: 'cloud-computing-basics__m2__q3',
          question:
            'A company\'s EC2 instances need to read and write objects to an S3 bucket. What is the most secure way to grant this access?',
          options: [
            'Store AWS access keys in the application\'s environment variables on each instance',
            'Create an IAM role with an S3 policy and attach it to the EC2 instances',
            'Make the S3 bucket public so any instance can access it',
            'Use the root account credentials in the application configuration',
          ],
          correctIndex: 1,
          explanation:
            'IAM roles provide temporary, automatically rotated credentials to EC2 instances. This is far more secure than storing long-lived access keys (which can be leaked) or using root credentials (which grant unlimited access). Making the bucket public would expose data to the entire internet.',
        },
        {
          id: 'cloud-computing-basics__m2__q4',
          question:
            'A startup is choosing an EC2 instance type for a machine learning training workload that requires GPU acceleration. Which instance family should they evaluate?',
          options: [
            'T3 (general purpose burstable)',
            'R6i (memory optimized)',
            'P4d (accelerated computing with GPUs)',
            'D3 (storage optimized)',
          ],
          correctIndex: 2,
          explanation:
            'The P4d family provides GPU-powered instances specifically designed for machine learning training, deep learning, and high-performance computing. T3 instances are for general workloads, R6i for memory-intensive tasks, and D3 for storage-heavy operations.',
        },
        {
          id: 'cloud-computing-basics__m2__q5',
          question:
            'An organization has an IAM user with the "AmazonS3FullAccess" managed policy attached. A separate inline policy explicitly denies s3:DeleteObject on all resources. Can this user delete S3 objects?',
          options: [
            'Yes, because AmazonS3FullAccess includes all S3 actions',
            'Yes, because managed policies take precedence over inline policies',
            'No, because an explicit Deny always overrides an Allow',
            'No, because inline policies always override managed policies',
          ],
          correctIndex: 2,
          explanation:
            'In IAM policy evaluation, an explicit Deny always takes precedence over any Allow, regardless of the policy type. Even though AmazonS3FullAccess allows all S3 actions, the inline Deny on s3:DeleteObject wins. This is a core principle of IAM security.',
        },
        {
          id: 'cloud-computing-basics__m2__q6',
          question:
            'A company stores log files in S3. The logs are queried frequently during the first 30 days, then rarely accessed for the next year, then must be retained for 7 years for compliance. Which S3 strategy best balances cost and access?',
          options: [
            'Store everything in S3 Standard permanently',
            'Use S3 Lifecycle policies to transition from Standard to Standard-IA after 30 days, then to Glacier Deep Archive after 1 year',
            'Store everything in Glacier from day one to minimize cost',
            'Delete logs after 30 days and keep only summaries',
          ],
          correctIndex: 1,
          explanation:
            'S3 Lifecycle policies automate transitions between storage classes based on object age. Standard handles the frequent-access period, Standard-IA reduces cost for the infrequent-access period, and Glacier Deep Archive provides the cheapest long-term storage for compliance retention. Storing everything in Standard wastes money; Glacier from day one makes frequent access expensive and slow.',
        },
      ],
    },

    // ── Module 3: Cloud Security ──────────────────────────────────────────
    {
      id: 'cloud-computing-basics__m3',
      title: 'Cloud Security',
      description:
        'Learn the essential security practices for protecting cloud workloads, including identity management, encryption, network security, and compliance frameworks.',
      lessons: [
        {
          id: 'cloud-computing-basics__m3__l1',
          title: 'The Shared Responsibility Model in Depth',
          objectives: [
            'Map security responsibilities to the correct party (provider vs. customer) for each service model',
            'Identify the most common customer-side security failures',
            'Explain how the responsibility boundary shifts across IaaS, PaaS, and SaaS',
          ],
          estimatedMinutes: 20,
          keyTakeaways: [
            'The provider always secures the physical infrastructure, but customer responsibilities grow as you move from SaaS to PaaS to IaaS',
            'Most cloud security breaches result from customer misconfigurations, not provider failures',
            'Understanding the responsibility boundary for each service you use is essential for building a complete security strategy',
          ],
          content: `## The Shared Responsibility Model in Depth

We introduced the shared responsibility model in Module 1. Now we need to examine it in detail, because misunderstanding this model is the single most common source of cloud security failures.

### The Core Principle

AWS articulates it simply: "Security OF the cloud" is AWS's responsibility. "Security IN the cloud" is your responsibility.

But this simple statement masks important nuance. The exact boundary depends on which service model you are using, and many organizations fail to recognize how much responsibility remains on their side.

### Responsibility by Service Model

**IaaS (e.g., EC2)**

AWS manages:
- Physical security of data centers (guards, biometrics, surveillance)
- Hardware (servers, storage devices, networking equipment)
- Hypervisor and virtualization layer
- Network infrastructure

You manage:
- Operating system (patches, updates, hardening)
- Network configuration (security groups, NACLs, VPC design)
- Application security (code vulnerabilities, dependencies)
- Data encryption (at rest and in transit)
- Identity and access management (IAM policies, user management)
- Firewall rules and intrusion detection
- Logging and monitoring

With IaaS, you carry the heaviest security burden. If you fail to patch your operating system and an attacker exploits a known vulnerability, that is your responsibility -- not AWS's.

**PaaS (e.g., Elastic Beanstalk, RDS)**

AWS manages everything from IaaS PLUS:
- Operating system patches and updates
- Runtime environment maintenance
- Platform-level security configurations

You manage:
- Application code security
- Data encryption and classification
- IAM policies and access controls
- Network-level access restrictions
- Application-level authentication and authorization

PaaS reduces your burden, but you are still responsible for your application code, your data, and who can access both.

**SaaS (e.g., AWS WorkMail, Amazon Connect)**

AWS manages virtually everything:
- All infrastructure, platform, and application security
- Patching, updates, and maintenance
- Built-in security features

You manage:
- Data you put into the application
- User access and permissions within the application
- Configuration of security-relevant settings
- Compliance with your organization's data policies

### Where Organizations Fail

Studies consistently show that the vast majority of cloud security incidents are caused by customer misconfigurations, not provider breaches. The most common failures include:

**Overly permissive IAM policies.** Granting AdministratorAccess to developers, using root account credentials, or creating IAM users with long-lived access keys that are never rotated.

**Public S3 buckets.** Storing sensitive data in S3 and accidentally (or intentionally) disabling Block Public Access. Major data breaches at companies like Capital One and Twitch involved misconfigured S3 access.

**Unpatched EC2 instances.** Launching instances and never applying security updates. The operating system is your responsibility on EC2.

**Missing encryption.** Failing to enable encryption for data at rest (EBS volumes, S3 objects, RDS databases) and in transit (TLS/SSL).

**Excessive security group rules.** Allowing SSH (port 22) from 0.0.0.0/0 (the entire internet) instead of restricting it to known IP addresses.

**No logging or monitoring.** Failing to enable CloudTrail, VPC Flow Logs, or GuardDuty, leaving you blind to suspicious activity.

### A Mental Model

Think of the shared responsibility model as an apartment building:

- **The building owner (AWS)** maintains the structure, elevators, fire suppression system, and entry doors with key fobs.
- **The tenant (you)** is responsible for locking their apartment door, not leaving windows open, safeguarding their valuables, and not inviting untrustworthy people inside.

If a burglar breaks into the building by compromising the entry system, that is the building owner's failure. If a burglar enters your unlocked apartment because you forgot to close the door, that is your failure -- even though you live in a secure building.

### Compliance Considerations

Many industries have regulatory requirements (HIPAA for healthcare, PCI DSS for payment processing, SOC 2 for service organizations). AWS maintains compliance certifications for its infrastructure, but the customer must ensure their own configurations and processes meet the relevant standards.

AWS provides compliance reports through **AWS Artifact**, a portal where you can download audit reports, certifications, and agreements. These documents demonstrate that the provider's side of the shared responsibility model meets regulatory requirements. But you must still document and prove that your side is compliant.

### Try This

Open the AWS Shared Responsibility Model documentation page and study the diagram for each service type. Then pick three AWS services your organization uses (or plans to use) and write down exactly which security responsibilities fall on your team. This exercise often reveals gaps in security coverage that teams had not considered.`,
        },
        {
          id: 'cloud-computing-basics__m3__l2',
          title: 'Encryption and Data Protection',
          objectives: [
            'Explain the difference between encryption at rest and encryption in transit',
            'Describe how AWS Key Management Service (KMS) works',
            'Apply encryption best practices to S3, EBS, and RDS',
          ],
          estimatedMinutes: 22,
          keyTakeaways: [
            'Encryption at rest protects stored data; encryption in transit protects data moving across networks',
            'AWS KMS provides centralized key management with automatic rotation and audit logging',
            'Most AWS services support encryption with a single checkbox or API parameter -- there is no excuse not to enable it',
            'Server-side encryption (SSE) handles encryption transparently; client-side encryption gives you maximum control',
          ],
          content: `## Encryption and Data Protection

Encryption is the process of converting readable data (plaintext) into an unreadable format (ciphertext) that can only be decoded with the correct key. In cloud computing, encryption is your most important defense against data breaches -- even if an attacker gains access to your storage, encrypted data is useless without the decryption key.

### Encryption at Rest

Encryption at rest protects data that is stored on disk -- S3 objects, EBS volumes, RDS database files, DynamoDB tables. When encryption at rest is enabled, the service automatically encrypts data before writing it to disk and decrypts it when you read it back. The process is transparent to your application.

**Why it matters:** If an attacker gains access to the underlying storage (through a misconfiguration, insider threat, or physical theft of a drive), the data is unreadable without the encryption key.

AWS offers several encryption at rest options:

**Server-Side Encryption with S3 Managed Keys (SSE-S3).** AWS manages the encryption keys entirely. You enable it with a single setting and never handle keys yourself. This is the simplest option and is now the default for all new S3 objects.

**Server-Side Encryption with KMS Keys (SSE-KMS).** AWS Key Management Service manages the keys. You get additional benefits: centralized key management, key rotation policies, and an audit trail showing every time a key was used (logged in CloudTrail).

**Server-Side Encryption with Customer-Provided Keys (SSE-C).** You manage the encryption keys yourself and provide them with each request. AWS uses the key to encrypt/decrypt but does not store it. This gives you maximum control but requires you to manage key storage and rotation.

**Client-Side Encryption.** You encrypt data before sending it to AWS. The service stores ciphertext and has no access to the plaintext or the keys. This is the most secure option for highly sensitive data, but it adds complexity to your application.

### Encryption in Transit

Encryption in transit protects data as it moves between your application and AWS services, between AWS services, or between your users and your application. The standard protocol is **TLS (Transport Layer Security)**, the technology behind HTTPS.

**AWS API endpoints.** All AWS service APIs use HTTPS by default. When you call s3.getObject() or ec2.describeInstances(), the data travels over an encrypted TLS connection.

**Application traffic.** For web applications, you should enforce HTTPS by using AWS Certificate Manager (ACM) to provision free TLS certificates and attach them to your load balancer or CloudFront distribution.

**Database connections.** RDS supports TLS connections. You can (and should) require that all database clients connect over TLS by setting the appropriate parameter group option.

### AWS Key Management Service (KMS)

KMS is the central hub for encryption key management in AWS. It provides:

**Key creation and storage.** KMS generates cryptographic keys and stores them in hardware security modules (HSMs) that are validated under FIPS 140-2.

**Key policies.** You define who can use and manage each key using IAM-style JSON policies. This creates a separation of duties -- the database administrator might have permission to use the key for encryption/decryption, but only the security team can manage or delete the key.

**Automatic rotation.** KMS can automatically rotate keys annually. When rotation occurs, KMS keeps the old key material so that previously encrypted data can still be decrypted, while new encryption operations use the new key material.

**Audit trail.** Every use of a KMS key is logged in CloudTrail: who used it, when, on which resource, and from which IP address. This audit trail is invaluable for compliance and incident investigation.

**Cross-account access.** You can share KMS keys across AWS accounts, enabling centralized key management in multi-account environments.

### Encryption Best Practices

1. **Enable encryption everywhere.** Turn on encryption at rest for S3, EBS, RDS, DynamoDB, and any other service that stores your data. Most services make this a one-click option.

2. **Use KMS for key management.** While SSE-S3 is simpler, KMS gives you audit trails, key policies, and rotation. The small additional cost is worth the security benefits.

3. **Enforce HTTPS.** Configure your load balancers and CloudFront distributions to redirect HTTP to HTTPS. Use HSTS headers to prevent protocol downgrade attacks.

4. **Require TLS for database connections.** Configure your RDS parameter groups to require SSL/TLS, and ensure your application connection strings include the TLS flag.

5. **Separate key management from data access.** The person who manages encryption keys should not be the same person who accesses the encrypted data. This separation of duties limits the impact of a compromised account.

6. **Never store encryption keys alongside encrypted data.** If you use client-side encryption, store keys in KMS or a dedicated secrets manager -- never in the same S3 bucket or database that holds the encrypted data.

7. **Use AWS Secrets Manager for credentials.** Database passwords, API keys, and other secrets should be stored in Secrets Manager, which encrypts them with KMS and supports automatic rotation.

### Real-World Example

A healthcare company stores patient records in an RDS PostgreSQL database with PHI (Protected Health Information). Their encryption strategy:

- **At rest**: RDS encryption enabled with a KMS key, separate from the application team's keys
- **In transit**: TLS required for all database connections; HTTPS enforced on the web application
- **Key management**: Security team manages the KMS key; application team has use-only access
- **Audit**: CloudTrail logs every KMS key usage; alerts fire if the key is used outside normal patterns

This layered approach means that even if an attacker compromises an application server, the encrypted database data requires a separate KMS key usage that would trigger security alerts.`,
        },
        {
          id: 'cloud-computing-basics__m3__l3',
          title: 'Network Security in the Cloud',
          objectives: [
            'Design defense-in-depth network security using security groups, NACLs, and WAF',
            'Explain how DDoS protection works with AWS Shield',
            'Configure VPC Flow Logs for network traffic monitoring',
          ],
          estimatedMinutes: 22,
          keyTakeaways: [
            'Defense in depth means applying multiple layers of security controls so that no single failure compromises the system',
            'Security groups are stateful instance-level firewalls; NACLs are stateless subnet-level firewalls',
            'AWS WAF protects web applications from common exploits like SQL injection and cross-site scripting',
            'VPC Flow Logs capture metadata about network traffic for monitoring and forensics',
          ],
          content: `## Network Security in the Cloud

Network security in the cloud follows the same fundamental principles as on-premises security, but the tools and implementation differ. AWS provides multiple layers of network security controls that you can combine to build a defense-in-depth strategy.

### Defense in Depth

Defense in depth is the practice of applying multiple layers of security controls so that if one layer fails, others remain to protect your resources. Think of it like a medieval castle: the moat, outer wall, inner wall, and keep each provide independent layers of defense. An attacker must breach all layers to reach the treasure.

In AWS, your network security layers from outermost to innermost are:

1. **Edge protection** (AWS Shield, CloudFront, WAF)
2. **VPC-level controls** (NACLs, VPC design)
3. **Subnet-level segmentation** (public/private subnets)
4. **Instance-level firewalls** (security groups)
5. **Application-level security** (authentication, input validation)

### Security Groups: Instance-Level Firewalls

Security groups control inbound and outbound traffic at the instance level. Key characteristics:

**Stateful.** If you allow an inbound request on port 443, the response traffic is automatically allowed on the outbound side. You do not need to create separate outbound rules for response traffic.

**Allow-only rules.** Security groups only support Allow rules. You cannot create Deny rules. If you do not explicitly allow traffic, it is denied by default.

**Source referencing.** Instead of allowing traffic from an IP address, you can reference another security group as the source. For example, your application server's security group can allow traffic from the load balancer's security group. This approach is more maintainable and secure than hardcoding IP addresses.

**Best practices:**
- Allow only the ports your application actually needs
- Restrict SSH/RDP access to your office IP range or a bastion host's security group
- Use separate security groups for different application tiers (web, app, database)
- Regularly audit security group rules for unnecessary open ports

### Network ACLs: Subnet-Level Firewalls

NACLs operate at the subnet level and provide a second layer of network filtering:

**Stateless.** Unlike security groups, NACLs require explicit rules for both inbound and outbound traffic. If you allow inbound HTTP on port 80, you must also allow outbound traffic on ephemeral ports (1024-65535) for the response.

**Ordered rules.** NACL rules are evaluated in order by rule number (lowest first). When a rule matches, it is applied immediately without evaluating subsequent rules. This means rule ordering matters.

**Allow and Deny rules.** Unlike security groups, NACLs support both Allow and Deny rules. This lets you block specific IP addresses or ranges at the subnet level.

**Common NACL use case:** Blocking a known malicious IP range from reaching any resource in a subnet. While security groups can restrict access, NACLs provide a broader, subnet-wide block.

### AWS Web Application Firewall (WAF)

AWS WAF protects web applications from common attack patterns at the application layer (Layer 7). You deploy WAF on CloudFront, Application Load Balancer, or API Gateway.

WAF works with **rules** that inspect HTTP requests and decide whether to allow, block, or count them:

**Managed rule groups** -- Pre-built rules maintained by AWS or security vendors that protect against common threats:
- SQL injection
- Cross-site scripting (XSS)
- Known bad bots
- Common vulnerabilities (OWASP Top 10)

**Custom rules** -- You write rules to match specific patterns in your traffic:
- Rate limiting: Block IPs that exceed 2,000 requests per 5 minutes
- Geo-blocking: Deny traffic from specific countries
- String matching: Block requests containing specific patterns in headers or body

### AWS Shield: DDoS Protection

Distributed Denial of Service (DDoS) attacks flood your application with traffic to overwhelm it and make it unavailable to legitimate users.

**AWS Shield Standard** is free and automatically protects all AWS customers against the most common network and transport layer DDoS attacks (Layer 3/4). It handles volumetric attacks, SYN floods, and UDP reflection attacks.

**AWS Shield Advanced** (paid) provides additional protection:
- Enhanced detection for application layer (Layer 7) attacks
- Real-time attack visibility and detailed diagnostics
- 24/7 access to the AWS DDoS Response Team (DRT)
- Cost protection: AWS credits charges that result from DDoS-related scaling

### VPC Flow Logs

VPC Flow Logs capture information about the IP traffic going to and from network interfaces in your VPC. They do not capture the actual packet contents -- just metadata:

- Source and destination IP addresses
- Source and destination ports
- Protocol (TCP, UDP, ICMP)
- Number of packets and bytes
- Whether the traffic was accepted or rejected
- Timestamp

Flow Logs can be configured at three levels:
- **VPC level** -- Captures all traffic in the VPC
- **Subnet level** -- Captures traffic in a specific subnet
- **Network interface level** -- Captures traffic for a specific instance

Flow Log data is stored in CloudWatch Logs or S3. You can analyze it with:
- **CloudWatch Insights** for real-time queries
- **Amazon Athena** for SQL-based analysis of logs in S3
- **Third-party SIEM tools** (Splunk, Datadog) for advanced correlation and alerting

### Practical Example: Securing a Web Application

Consider a typical three-tier web application. Here is how you would layer network security:

1. **CloudFront + WAF** at the edge: Block SQL injection, XSS, and rate-limit abusive IPs
2. **ALB in public subnets**: Only accepts HTTPS traffic from CloudFront
3. **Application servers in private subnets**: Security group allows traffic only from the ALB security group on port 8080
4. **Database in private subnets**: Security group allows traffic only from the application security group on port 5432
5. **NACLs**: Deny known malicious IP ranges at the subnet level
6. **VPC Flow Logs**: Monitor all traffic for anomaly detection

Each layer independently reduces the attack surface. An attacker would need to bypass WAF, find the ALB directly, bypass security groups, and reach the database -- each requiring a separate exploit.`,
        },
        {
          id: 'cloud-computing-basics__m3__l4',
          title: 'Monitoring, Logging, and Incident Response',
          objectives: [
            'Configure CloudTrail for API activity logging across an AWS account',
            'Use Amazon GuardDuty for intelligent threat detection',
            'Outline a basic cloud incident response plan',
          ],
          estimatedMinutes: 20,
          keyTakeaways: [
            'CloudTrail logs every API call in your AWS account, providing a complete audit trail',
            'GuardDuty uses machine learning to detect suspicious activity across your account without any agent installation',
            'A cloud incident response plan should include identification, containment, eradication, recovery, and lessons learned phases',
            'Automate security responses where possible using EventBridge rules and Lambda functions',
          ],
          content: `## Monitoring, Logging, and Incident Response

Even with perfect preventive controls, security incidents can occur. Detection and response capabilities determine whether an incident is caught in minutes or months. In cloud environments, the rich set of logging and monitoring services available makes comprehensive visibility achievable -- but only if you enable and configure them.

### AWS CloudTrail

CloudTrail records every API call made in your AWS account. Whether someone launches an EC2 instance, modifies an IAM policy, or deletes an S3 bucket, CloudTrail captures:

- **Who** made the request (IAM user, role, or AWS service)
- **What** action was performed (the API call, e.g., RunInstances, DeleteBucket)
- **When** it happened (timestamp)
- **Where** the request originated (source IP address, user agent)
- **Which** resources were affected (instance IDs, bucket names, etc.)

**Setting up CloudTrail:**
1. Create a trail that applies to all regions (so you do not miss activity in regions you do not actively use).
2. Deliver logs to a dedicated S3 bucket with encryption enabled.
3. Enable log file integrity validation so you can detect if log files have been tampered with.
4. Set up CloudWatch alarms for critical events (root account login, IAM policy changes, security group modifications).

**What to monitor:**
- Root account usage (should be near zero)
- IAM policy changes (who is modifying permissions?)
- Security group modifications (are new ports being opened?)
- S3 bucket policy changes (is someone making data public?)
- Failed authentication attempts (brute force indicators)
- API calls from unusual IP addresses or regions

### Amazon GuardDuty

GuardDuty is an intelligent threat detection service that continuously monitors your AWS environment for malicious or unauthorized behavior. It analyzes:

- CloudTrail management and data events
- VPC Flow Logs
- DNS logs
- EKS audit logs
- S3 data events

GuardDuty uses machine learning, anomaly detection, and integrated threat intelligence to identify threats like:

- **Compromised instances**: An EC2 instance communicating with a known command-and-control server, mining cryptocurrency, or scanning ports.
- **Compromised credentials**: API calls from unusual locations, impossible travel patterns (calls from two distant locations minutes apart), or calls from known Tor exit nodes.
- **Data exfiltration**: Unusual S3 API patterns suggesting someone is downloading large amounts of data.
- **Privilege escalation**: An IAM user suddenly performing admin-level actions they have never done before.

The beauty of GuardDuty is that it requires no agents, no infrastructure, and no rule writing. You enable it with a single click and it starts generating findings. Each finding includes a severity rating (low, medium, high) and detailed context to help you investigate.

### Amazon CloudWatch

While CloudTrail tracks API calls, CloudWatch monitors the operational health and performance of your resources:

**Metrics** -- CPU utilization, memory usage, disk I/O, network traffic, request counts, error rates. AWS services publish metrics automatically; you can also publish custom metrics from your applications.

**Alarms** -- Trigger notifications or automated actions when a metric crosses a threshold. For example: "Alert me when CPU utilization exceeds 80% for 5 minutes" or "Scale out the Auto Scaling group when request count exceeds 1,000 per minute."

**Logs** -- Centralize logs from EC2 instances, Lambda functions, and other services. Use CloudWatch Logs Insights to query logs with a SQL-like syntax.

**Dashboards** -- Build real-time visualizations of your metrics and alarms in a single view.

### AWS Config

AWS Config continuously evaluates your resource configurations against rules you define. It answers the question: "Are my resources configured the way they should be?"

Example Config rules:
- All S3 buckets must have encryption enabled
- All EBS volumes must be encrypted
- Security groups must not allow SSH from 0.0.0.0/0
- All IAM users must have MFA enabled

When a resource violates a rule, Config flags it as "non-compliant" and can trigger automated remediation through Systems Manager or Lambda.

### Building an Incident Response Plan

A cloud incident response plan follows the same phases as traditional IR, adapted for cloud-specific tools:

**1. Preparation**
- Enable CloudTrail, GuardDuty, VPC Flow Logs, and Config before an incident occurs
- Define severity levels and escalation procedures
- Create runbooks for common scenarios (compromised instance, leaked credentials, data exposure)
- Set up a dedicated incident response IAM role with pre-approved permissions

**2. Identification**
- GuardDuty finding triggers an alert
- CloudWatch alarm fires on anomalous metrics
- Config rule detects a non-compliant change
- Manual report from a team member

**3. Containment**
- Isolate the affected resource: modify security groups to deny all traffic, detach from load balancers
- Revoke compromised credentials: deactivate IAM access keys, revoke active sessions
- Preserve evidence: create snapshots of EBS volumes, capture memory dumps

**4. Eradication**
- Remove the root cause: patch the vulnerability, delete the malicious code, close the misconfigured access
- Scan for lateral movement: check if the attacker accessed other resources

**5. Recovery**
- Restore services from clean backups or snapshots
- Gradually re-enable access while monitoring closely
- Verify that the vulnerability is fully resolved

**6. Lessons Learned**
- Conduct a post-incident review within 48 hours
- Document what happened, how it was detected, how it was contained, and what you will improve
- Update runbooks, monitoring rules, and preventive controls based on findings

### Automation Is Key

Manual incident response is slow and error-prone. Use AWS EventBridge to automatically trigger Lambda functions when GuardDuty detects a threat. For example:

- GuardDuty detects a compromised EC2 instance -> Lambda automatically isolates it by modifying its security group to deny all traffic and creates a snapshot for forensics
- GuardDuty detects API calls from a Tor exit node -> Lambda automatically deactivates the associated IAM access key

This "security automation" approach reduces response time from hours to seconds.`,
        },
      ],
      quiz: [
        {
          id: 'cloud-computing-basics__m3__q1',
          question:
            'A security audit reveals that an EC2 instance in a private subnet has been communicating with a known cryptocurrency mining pool for the past 48 hours. Which AWS service should have detected this activity?',
          options: [
            'AWS Config -- it monitors resource configurations',
            'Amazon GuardDuty -- it detects suspicious network behavior using VPC Flow Logs and threat intelligence',
            'AWS CloudTrail -- it tracks API calls',
            'Amazon CloudWatch -- it monitors CPU metrics',
          ],
          correctIndex: 1,
          explanation:
            'GuardDuty analyzes VPC Flow Logs and cross-references network destinations against threat intelligence feeds. Communication with known mining pools is a common GuardDuty finding (CryptoCurrency:EC2/BitcoinTool.B). CloudTrail logs API calls but not network traffic, Config checks configurations not runtime behavior, and CloudWatch would show high CPU but not the destination of traffic.',
        },
        {
          id: 'cloud-computing-basics__m3__q2',
          question:
            'A developer needs to store database connection strings and API keys for a production application. Which approach is most secure?',
          options: [
            'Store them in a .env file committed to the Git repository',
            'Hardcode them in the application source code',
            'Store them in AWS Secrets Manager with encryption via KMS and automatic rotation',
            'Save them in an unencrypted S3 bucket accessible to the development team',
          ],
          correctIndex: 2,
          explanation:
            'AWS Secrets Manager encrypts secrets using KMS, supports automatic rotation, provides fine-grained IAM access control, and logs every access in CloudTrail. Storing secrets in code, .env files in version control, or unencrypted storage creates serious risks of credential exposure.',
        },
        {
          id: 'cloud-computing-basics__m3__q3',
          question:
            'An e-commerce site experiences a sudden spike in traffic that matches the pattern of an HTTP flood DDoS attack. The site is served through CloudFront. Which combination of services provides the best protection?',
          options: [
            'Increase EC2 instance sizes to handle more traffic',
            'AWS Shield Standard (automatic) + AWS WAF rate-limiting rules on CloudFront',
            'Block all international traffic at the VPC NACL level',
            'Shut down the application until the attack stops',
          ],
          correctIndex: 1,
          explanation:
            'Shield Standard automatically protects against network-layer attacks for free. For application-layer HTTP floods, WAF rate-limiting rules on CloudFront can block IPs that exceed request thresholds. Simply scaling up is expensive and may not work against sophisticated attacks. Blocking countries would deny legitimate customers, and shutting down achieves the attacker\'s goal.',
        },
        {
          id: 'cloud-computing-basics__m3__q4',
          question:
            'During an incident investigation, the security team discovers that CloudTrail was disabled in two AWS regions they do not actively use. An attacker launched resources in those regions to avoid detection. What should the team implement to prevent this?',
          options: [
            'Enable CloudTrail only in the region where their resources run',
            'Create a CloudTrail trail that applies to ALL regions and enable log file integrity validation',
            'Use only AWS Config to monitor all regions',
            'Block all API calls in unused regions using IAM policies',
          ],
          correctIndex: 1,
          explanation:
            'A multi-region CloudTrail trail ensures that API activity is logged in every region, including ones you do not actively use. Log file integrity validation detects if an attacker attempts to modify or delete log files. While restricting API access in unused regions (via SCPs) is also good practice, comprehensive logging is essential for detection.',
        },
        {
          id: 'cloud-computing-basics__m3__q5',
          question:
            'A company encrypts its RDS database with a KMS key. An administrator accidentally deletes the KMS key. What happens to the database?',
          options: [
            'Nothing -- AWS keeps a backup copy of all KMS keys',
            'The database continues running but new writes fail',
            'After the key\'s waiting period (7-30 days), the key is permanently deleted and the encrypted data becomes unrecoverable',
            'AWS automatically re-encrypts the database with a new key',
          ],
          correctIndex: 2,
          explanation:
            'When a KMS key is scheduled for deletion, it enters a waiting period (minimum 7 days, default 30 days). During this window, the deletion can be cancelled. Once the waiting period expires, the key is permanently deleted and any data encrypted with it is unrecoverable. This is why KMS key deletion policies and permissions should be tightly controlled.',
        },
        {
          id: 'cloud-computing-basics__m3__q6',
          question:
            'A security group allows inbound traffic on port 22 (SSH) from 0.0.0.0/0. An AWS Config rule flags this as non-compliant. What is the best remediation approach?',
          options: [
            'Delete the security group entirely',
            'Restrict SSH access to specific trusted IP addresses or use AWS Systems Manager Session Manager, which requires no open inbound ports',
            'Change the SSH port from 22 to a non-standard port like 2222',
            'Add a NACL deny rule to override the security group allow',
          ],
          correctIndex: 1,
          explanation:
            'The best approach is either restricting SSH to known IP addresses (your office CIDR, VPN endpoint) or eliminating SSH entirely by using Session Manager, which provides shell access through IAM authentication without any inbound ports. Changing the port is security through obscurity. Deleting the security group may break the application. A NACL deny would work but is a workaround, not a fix.',
        },
      ],
    },

    // ── Module 4: Cost Optimization ───────────────────────────────────────
    {
      id: 'cloud-computing-basics__m4',
      title: 'Cost Optimization',
      description:
        'Master the strategies and tools for controlling cloud spending, including right-sizing, reserved capacity, spot instances, and AWS cost management services.',
      lessons: [
        {
          id: 'cloud-computing-basics__m4__l1',
          title: 'Understanding Cloud Pricing Models',
          objectives: [
            'Explain on-demand, reserved, spot, and savings plan pricing models',
            'Calculate potential savings for a given workload under different pricing models',
            'Identify which pricing model fits common workload patterns',
          ],
          estimatedMinutes: 22,
          keyTakeaways: [
            'On-demand pricing provides flexibility with no commitment but at the highest per-unit cost',
            'Reserved Instances and Savings Plans offer up to 72% savings for predictable workloads',
            'Spot Instances provide up to 90% savings for fault-tolerant, flexible workloads',
            'Most organizations use a mix of pricing models optimized for each workload type',
          ],
          content: `## Understanding Cloud Pricing Models

Cloud computing promises to save money compared to on-premises infrastructure, but this is only true if you manage your spending carefully. Without cost optimization, cloud bills can grow rapidly and unpredictably. Understanding pricing models is the first step to controlling costs.

### The Cloud Pricing Challenge

On-premises infrastructure has a simple (if inflexible) cost model: you buy hardware, depreciate it over 3-5 years, and pay for electricity and maintenance. The costs are predictable because they are fixed.

Cloud pricing is fundamentally different. You pay for what you use, but "what you use" can change minute by minute. An auto-scaling event might double your EC2 fleet. A data transfer spike might add thousands to your networking bill. A developer might forget to shut down a test environment, running up charges for weeks.

This flexibility is also cloud's greatest strength -- but it requires active management.

### On-Demand Pricing

On-demand is the default pricing model. You pay for compute capacity by the hour or second with no upfront commitment and no long-term contract.

**Advantages:**
- No commitment -- start and stop anytime
- Scale up and down freely
- No upfront costs
- Simple to understand and budget

**Disadvantages:**
- Highest per-unit cost
- Unpredictable bills if usage is not monitored
- No discount for consistent usage

**Best for:** Short-term workloads, development/testing environments, unpredictable traffic patterns, applications being evaluated before committing to a pricing plan.

**Example cost:** A t3.medium instance (2 vCPU, 4 GB RAM) in US East costs approximately $0.0416 per hour on-demand, or about $30 per month running 24/7.

### Reserved Instances (RIs)

Reserved Instances let you commit to using a specific instance type in a specific region for one or three years. In exchange, you receive a significant discount compared to on-demand pricing.

**Payment options:**
- **All Upfront**: Pay the entire cost upfront. Maximum discount (up to 72% savings).
- **Partial Upfront**: Pay a portion upfront, the rest monthly. Moderate discount.
- **No Upfront**: Pay monthly with no upfront cost. Smallest discount but still significant savings.

**Types of RIs:**
- **Standard RI**: Locked to a specific instance type. Highest discount but least flexible.
- **Convertible RI**: Can be exchanged for a different instance type. Lower discount but more flexibility as your needs change.

**Best for:** Steady-state workloads that run 24/7 -- production databases, core application servers, baseline compute capacity.

**Example savings:** That same t3.medium at $30/month on-demand drops to approximately $11/month with a 3-year All Upfront Standard RI -- a 63% savings.

### Savings Plans

Savings Plans are a newer, more flexible alternative to Reserved Instances. Instead of committing to a specific instance type, you commit to a consistent amount of compute usage (measured in dollars per hour) for one or three years.

**Compute Savings Plans** apply to any EC2 instance, Lambda function, or Fargate task regardless of region, instance family, OS, or tenancy. You commit to spending, say, $10/hour on compute -- however you distribute that spend is up to you.

**EC2 Instance Savings Plans** are similar but locked to a specific instance family (like M5) in a specific region. They offer a slightly higher discount than Compute Savings Plans.

**Best for:** Organizations that want RI-level discounts with more flexibility to change instance types and regions over time.

### Spot Instances

Spot Instances let you use spare EC2 capacity at up to 90% discount compared to on-demand prices. The catch: AWS can reclaim your Spot Instance with a two-minute warning when it needs the capacity back.

**How Spot pricing works:** You specify the maximum price you are willing to pay. As long as the current Spot price is below your maximum, your instance runs. If the Spot price exceeds your maximum (or AWS needs the capacity), your instance is interrupted.

**Best for:**
- Batch processing jobs that can be checkpointed and restarted
- Big data analytics workloads (EMR, Spark)
- CI/CD build environments
- Containerized microservices with multiple replicas (losing one instance does not cause downtime)
- Machine learning training with checkpointing

**Not suitable for:** Databases, stateful applications, single-instance workloads where interruption causes data loss or outages.

**Strategies for Spot reliability:**
- **Diversify**: Request Spot capacity across multiple instance types and Availability Zones
- **Spot Fleet**: Automatically maintain a target capacity by replacing interrupted instances
- **Graceful handling**: Use the two-minute interruption notice to save state and drain connections

### Combining Pricing Models

Smart organizations blend pricing models:

| Workload Layer | Pricing Model | Example |
|---------------|---------------|---------|
| Baseline capacity | Reserved/Savings Plan | Production database, minimum app servers |
| Variable capacity | On-Demand | Additional servers during business hours |
| Fault-tolerant batch | Spot | Nightly data processing, ML training |
| Development/testing | On-Demand with auto-shutdown | Dev environments that stop at 6 PM |

A company running 10 application servers 24/7 with traffic spikes during business hours might use 6 Reserved Instances for the baseline, 4 on-demand instances that scale in during the day and out at night, and Spot Instances for weekly batch processing jobs.`,
        },
        {
          id: 'cloud-computing-basics__m4__l2',
          title: 'Right-Sizing and Resource Optimization',
          objectives: [
            'Define right-sizing and explain why over-provisioning is common in cloud environments',
            'Use AWS tools to identify underutilized resources',
            'Apply right-sizing recommendations to reduce costs without impacting performance',
          ],
          estimatedMinutes: 20,
          keyTakeaways: [
            'Right-sizing means matching instance types and sizes to actual workload requirements, not peak theoretical demand',
            'AWS Compute Optimizer and Cost Explorer provide data-driven right-sizing recommendations',
            'Over-provisioning is the most common source of cloud waste, often accounting for 30-40% of compute spend',
            'Right-sizing should be an ongoing process, not a one-time exercise',
          ],
          content: `## Right-Sizing and Resource Optimization

Right-sizing is the process of matching your cloud resources to your actual workload requirements. It sounds simple, but it is the single most impactful cost optimization strategy. Studies consistently show that 30-40% of cloud compute spending goes to waste -- instances that are oversized, idle, or running in environments nobody is using.

### Why Over-Provisioning Happens

Over-provisioning is a habit carried over from on-premises thinking. When buying physical servers, you sized for peak demand plus a safety margin because scaling up meant ordering new hardware -- a process that took weeks. Better to have too much capacity than too little.

In the cloud, this logic no longer applies. You can scale up in minutes and scale down just as fast. But habits are hard to break, and several factors perpetuate over-provisioning:

**Fear of performance issues.** Teams choose large instance types "just in case," worried that a smaller instance might cause latency or outages. In reality, most applications are not CPU-bound, and a smaller instance handles the load fine.

**Lack of monitoring data.** Without utilization data, teams cannot know whether their instances are appropriately sized. They default to "bigger is safer."

**No incentive to optimize.** If cloud costs come from a centralized IT budget, individual teams have no visibility into or accountability for their spending. When no one owns the cost, no one optimizes it.

**Lift-and-shift migrations.** When migrating from on-premises to cloud, teams often replicate the exact same server specifications. A 32-core physical server becomes a 32-vCPU EC2 instance, even though the application only uses 10% of the CPU.

### How to Right-Size

**Step 1: Gather utilization data.** Use CloudWatch to monitor CPU utilization, memory usage, network throughput, and disk I/O for at least two weeks (ideally a full month to capture monthly patterns).

**Step 2: Identify waste.** Look for instances where:
- Average CPU utilization is below 20%
- Peak CPU utilization never exceeds 50%
- Memory usage is consistently below 40%
- Network throughput is far below the instance type's capacity

**Step 3: Evaluate recommendations.** AWS provides two tools for right-sizing:

**AWS Compute Optimizer** analyzes utilization data and recommends optimal instance types. It considers CPU, memory, network, and storage requirements and suggests specific alternatives with estimated cost impact. Compute Optimizer uses machine learning to account for performance variability, not just averages.

**AWS Cost Explorer Right Sizing Recommendations** identifies EC2 instances that are underutilized based on CloudWatch metrics. It provides specific downsizing recommendations with projected savings.

**Step 4: Test the change.** Before resizing a production instance, test the new size in a staging environment under realistic load. Verify that response times, throughput, and error rates remain acceptable.

**Step 5: Apply the change.** Stop the instance, change the instance type, and start it again. The process takes about a minute. For critical production workloads, use a blue-green deployment pattern: launch the new size alongside the old, shift traffic gradually, and terminate the old instance once validated.

### Beyond EC2: Other Optimization Targets

**EBS Volumes.** Many teams provision General Purpose SSD (gp3) volumes that are far larger than needed. Audit volume utilization and reduce sizes. Also check for unattached EBS volumes -- volumes that remain after instances were terminated. These "orphaned" volumes still incur charges.

**Elastic IP Addresses.** An Elastic IP attached to a running instance is free. An Elastic IP that is not attached to any instance incurs a small hourly charge. Release unused Elastic IPs.

**Load Balancers.** Each ALB costs approximately $16/month minimum. If you have development environments with their own load balancers running 24/7, that cost adds up. Consolidate where possible or shut down non-production load balancers after hours.

**RDS Instances.** Database instances are often the largest line item on a cloud bill. Right-size based on actual query performance metrics, not theoretical peak. Consider Aurora Serverless for variable workloads that can scale down to zero.

**S3 Storage.** Use S3 Storage Class Analysis to identify objects that could be moved to cheaper storage classes. Implement lifecycle policies to automatically transition aging data.

### The Right-Sizing Cycle

Right-sizing is not a one-time project. Workloads change over time as features are added, traffic grows, and usage patterns shift. Build a recurring process:

1. **Monthly review**: Check Compute Optimizer recommendations
2. **Quarterly audit**: Review all running resources for waste
3. **Post-launch review**: 30 days after deploying a new service, verify that the chosen instance type matches actual usage
4. **Cost anomaly alerts**: Set up AWS Cost Anomaly Detection to flag unexpected spending increases

### Real-World Impact

A SaaS company with 200 EC2 instances ran a right-sizing analysis and found:
- 40% of instances had average CPU below 10%
- 25% could be downsized by two sizes (e.g., m5.xlarge to m5.small)
- 15 instances were completely idle (test environments left running)
- Total savings after right-sizing: $14,000/month (38% of compute spend)

These savings required no code changes, no architectural redesign, and no sacrifice in performance. Right-sizing is the lowest-effort, highest-impact cost optimization available.`,
        },
        {
          id: 'cloud-computing-basics__m4__l3',
          title: 'AWS Cost Management Tools',
          objectives: [
            'Navigate AWS Cost Explorer to analyze spending trends',
            'Set up AWS Budgets to alert on cost thresholds',
            'Use tagging strategies to attribute costs to teams and projects',
          ],
          estimatedMinutes: 18,
          keyTakeaways: [
            'Cost Explorer provides visualizations of spending trends with filtering by service, region, tag, and account',
            'AWS Budgets sends alerts when actual or forecasted costs exceed thresholds you define',
            'Consistent resource tagging is the foundation of cost allocation and accountability',
            'The AWS Cost and Usage Report (CUR) provides the most granular billing data for detailed analysis',
          ],
          content: `## AWS Cost Management Tools

AWS provides a comprehensive suite of tools for monitoring, analyzing, and controlling cloud costs. Using these tools effectively is the difference between cloud spending that is managed and cloud spending that is a surprise.

### AWS Cost Explorer

Cost Explorer is your primary tool for understanding where your money goes. It provides:

**Visualizations.** Interactive charts showing daily, monthly, or annual spending. You can view costs as bar charts, stacked area charts, or line graphs.

**Filtering and grouping.** Slice your costs by:
- Service (EC2, S3, RDS, Lambda, etc.)
- Region (us-east-1, eu-west-1, etc.)
- Account (in multi-account setups)
- Tag (team, project, environment)
- Instance type
- Usage type

**Forecasting.** Cost Explorer projects your future spending based on historical patterns. This helps you anticipate budget overruns before they happen.

**Right-sizing recommendations.** As discussed in the previous lesson, Cost Explorer identifies underutilized EC2 instances and suggests downsizing.

**Common Cost Explorer workflows:**

1. **Monthly review**: Filter by service to see which services drive the most cost. Are there unexpected charges?
2. **Team chargeback**: Group by tag to see how much each team or project is spending.
3. **Trend analysis**: Compare this month to last month. Is spend increasing? If so, why?
4. **RI/SP coverage**: Check what percentage of your compute usage is covered by Reserved Instances or Savings Plans.

### AWS Budgets

AWS Budgets lets you set custom spending thresholds and receive alerts when your costs approach or exceed those thresholds.

**Budget types:**
- **Cost budget**: Alert when total cost exceeds a dollar amount
- **Usage budget**: Alert when usage of a specific service exceeds a quantity (e.g., EC2 hours, S3 storage GB)
- **Reservation budget**: Track RI and Savings Plan utilization and coverage
- **Savings Plans budget**: Monitor Savings Plan usage

**Alert configuration:**
You can set multiple thresholds per budget. For example:
- Alert at 80% of budget (early warning)
- Alert at 100% of budget (budget exceeded)
- Alert at 120% of budget (escalation)

Alerts can notify via email, SNS topics, or trigger automated actions through AWS Budget Actions (like stopping EC2 instances or restricting IAM permissions when budgets are exceeded).

**Budget Actions** take automation further. You can configure a budget to automatically:
- Apply an IAM policy that denies ec2:RunInstances when the budget is exceeded
- Stop specific EC2 instances
- Restrict purchasing of Reserved Instances

This prevents runaway costs from becoming a disaster.

### Resource Tagging for Cost Allocation

Tags are key-value pairs that you attach to AWS resources. They are the foundation of cost attribution -- without consistent tagging, you cannot answer "which team is spending what?"

**Essential tags for cost management:**

| Tag Key | Example Values | Purpose |
|---------|---------------|---------|
| Environment | production, staging, development | Separate production costs from non-production |
| Team | engineering, marketing, data-science | Attribute costs to teams |
| Project | website-v2, analytics-pipeline | Track project-level spending |
| Owner | jane.doe@company.com | Identify who to contact about resources |
| CostCenter | CC-1001, CC-2045 | Map to financial cost centers |

**Tagging best practices:**

1. **Define a mandatory tagging policy.** Agree on required tags across the organization and document them.
2. **Enforce with AWS Organizations SCPs or AWS Config rules.** Prevent the creation of untagged resources.
3. **Use Tag Editor for bulk tagging.** If you have existing untagged resources, Tag Editor lets you find and tag them in bulk.
4. **Activate cost allocation tags.** In the Billing console, you must activate tags for them to appear in cost reports. This is a step teams often miss.
5. **Automate tagging.** Use CloudFormation, Terraform, or CDK to ensure resources are tagged at creation time.

### AWS Cost and Usage Report (CUR)

The Cost and Usage Report is the most detailed billing dataset AWS provides. It contains line-item detail for every charge, including:
- Resource IDs
- Pricing details (on-demand rate, RI discount applied)
- Usage quantities
- Tag values
- Blended and unblended costs

CUR data is delivered to an S3 bucket in CSV or Parquet format. You can analyze it with:
- **Amazon Athena** for SQL queries directly against S3
- **Amazon QuickSight** for dashboards and visualizations
- **Third-party tools** like CloudHealth, Spot.io, or Kubecost

For organizations spending more than a few thousand dollars per month, CUR analysis reveals optimization opportunities that Cost Explorer's summaries miss.

### AWS Cost Anomaly Detection

This machine learning-powered service automatically detects unusual spending patterns without requiring you to set thresholds. It learns your normal spending patterns and alerts you when something deviates significantly.

For example, if a developer accidentally launches 50 p4d.24xlarge GPU instances (at $32.77/hour each), Cost Anomaly Detection would flag the $39,000/day spike within hours rather than waiting for a monthly bill review.

### Building a Cost Management Practice

1. **Enable Cost Explorer and CUR** on day one of your cloud journey.
2. **Define and enforce tagging standards** before resources proliferate.
3. **Set budgets with alerts** at the account, team, and project levels.
4. **Review costs weekly** (15-minute standup) and deeply monthly.
5. **Enable Cost Anomaly Detection** to catch surprises.
6. **Assign cost ownership** -- every dollar should be attributable to a team.
7. **Celebrate savings** -- recognize teams that reduce waste. Cost optimization is a cultural practice, not just a technical one.`,
        },
        {
          id: 'cloud-computing-basics__m4__l4',
          title: 'Building a Cost-Optimized Architecture',
          objectives: [
            'Apply architectural patterns that reduce cloud costs',
            'Evaluate serverless vs. server-based approaches from a cost perspective',
            'Create a cost optimization action plan for a sample workload',
          ],
          estimatedMinutes: 20,
          keyTakeaways: [
            'Architectural decisions have the largest impact on long-term cloud costs -- optimization starts at design time',
            'Serverless architectures can dramatically reduce costs for variable workloads by charging only for actual execution',
            'Auto-scaling prevents both over-provisioning (wasted spend) and under-provisioning (poor performance)',
            'Data transfer costs are often overlooked but can be a significant portion of the cloud bill',
          ],
          content: `## Building a Cost-Optimized Architecture

The most impactful cost optimizations are not about switching instance types or buying reservations. They are architectural decisions made during system design. The way you build your application determines your cost structure for years to come.

### Serverless: Pay Only for What Executes

Serverless computing (AWS Lambda, API Gateway, DynamoDB on-demand, S3) charges you only when your code runs or your data is accessed. There is no cost for idle time.

**When serverless saves money:**
- Variable or unpredictable traffic patterns
- Workloads with significant idle time (nights, weekends)
- Event-driven processing (file uploads, queue messages)
- APIs with low to moderate request volumes

**Lambda pricing example:** Lambda charges per request ($0.20 per million) and per compute duration ($0.0000166667 per GB-second). A function that processes 1 million requests per month, each running for 500ms with 256 MB of memory, costs approximately:
- Request charges: 1M x $0.20/M = $0.20
- Duration charges: 1M x 0.5s x 0.25 GB x $0.0000166667 = $2.08
- Total: $2.28/month

Running an equivalent t3.small instance 24/7 would cost approximately $15/month. For this workload pattern, serverless is significantly cheaper.

**When serverless costs more:**
- Sustained high-throughput workloads with consistent load
- Long-running processes (Lambda has a 15-minute timeout)
- Applications that require persistent connections (WebSockets at scale)

The break-even point varies, but as a rough guideline: if your compute runs at high utilization for more than 60-70% of the day, server-based compute with Reserved Instances may be cheaper than Lambda.

### Auto-Scaling: Match Capacity to Demand

Auto-scaling automatically adjusts your compute capacity based on demand. It prevents both over-provisioning (paying for idle resources) and under-provisioning (degraded performance or outages).

**EC2 Auto Scaling** adjusts the number of EC2 instances based on CloudWatch metrics. You define:
- **Minimum capacity**: The floor -- never fewer than this many instances
- **Desired capacity**: The target number of instances under normal conditions
- **Maximum capacity**: The ceiling -- never more than this many instances
- **Scaling policies**: Rules that trigger scaling (e.g., add an instance when average CPU exceeds 70%)

**Target tracking scaling** is the simplest policy type. You specify a target metric value (e.g., "maintain average CPU utilization at 60%"), and AWS automatically adjusts the group size to maintain that target.

**Scheduled scaling** adjusts capacity on a predictable schedule. If you know traffic drops by 50% at midnight and ramps up at 8 AM, schedule the scaling accordingly.

**Predictive scaling** uses machine learning to forecast traffic patterns and pre-scale capacity before demand arrives. This eliminates the lag between a traffic spike and the time it takes new instances to boot and become healthy.

### Data Transfer Costs

Data transfer is the "hidden" cost that catches many teams by surprise. AWS pricing for data transfer follows a general pattern:

- **Data in** to AWS: Free (with minor exceptions)
- **Data out** from AWS to the internet: Charged per GB (tiered pricing starting around $0.09/GB)
- **Data between regions**: Charged per GB ($0.01-0.02/GB)
- **Data within the same Availability Zone**: Free
- **Data between AZs in the same region**: Charged ($0.01/GB each way)

**Strategies to reduce data transfer costs:**

1. **Use CloudFront.** CDN caching serves content from edge locations close to users, reducing origin fetches and data transfer from your servers. CloudFront's data transfer pricing is also lower than EC2's.

2. **Keep traffic within AZs when possible.** If a service only communicates with another service in the same AZ, the data transfer is free. Use AZ-aware routing in your service mesh.

3. **Compress data.** Enable gzip or Brotli compression for API responses and web assets. A 70% reduction in response size translates directly to a 70% reduction in data transfer cost.

4. **Use VPC endpoints for AWS services.** Instead of routing S3 or DynamoDB traffic through the internet gateway (which incurs data transfer charges), use VPC endpoints to keep traffic on the AWS private network.

5. **Monitor with CUR.** The Cost and Usage Report breaks down data transfer charges by source, destination, and type. Use this data to identify the largest transfer flows and optimize them.

### Storage Optimization Patterns

**Use the right storage for the right workload:**
- Hot data (frequent access): S3 Standard, EBS gp3
- Warm data (occasional access): S3 Standard-IA
- Cold data (rare access): S3 Glacier
- Archive data (compliance retention): S3 Glacier Deep Archive

**Implement lifecycle policies** to automatically transition objects between storage classes. Many organizations store everything in S3 Standard permanently because they never set up lifecycle rules -- a simple oversight that can waste thousands per month.

**Delete what you do not need.** Old snapshots, unused AMIs, orphaned EBS volumes, and empty S3 buckets all incur costs. Build a monthly cleanup process or use AWS Trusted Advisor to identify these waste items.

### Putting It All Together: A Cost Optimization Plan

For any workload, walk through this checklist:

1. **Architecture review**: Is the architecture appropriate for the workload pattern? Could serverless reduce costs?
2. **Right-sizing**: Are instances sized for actual utilization, not theoretical peak?
3. **Pricing model**: Are steady-state resources covered by RIs or Savings Plans?
4. **Auto-scaling**: Does compute scale with demand to avoid over-provisioning?
5. **Storage tiering**: Are lifecycle policies moving aging data to cheaper storage classes?
6. **Data transfer**: Are you using CloudFront, VPC endpoints, and compression?
7. **Waste elimination**: Are unused resources (idle instances, unattached volumes, old snapshots) cleaned up?
8. **Tagging and visibility**: Can you attribute every dollar to a team and project?
9. **Budget alerts**: Will you know immediately if spending deviates from expectations?
10. **Regular review**: Is there a recurring process to revisit optimizations as workloads evolve?

Following this checklist systematically can reduce cloud spending by 30-50% for organizations that have not previously prioritized cost optimization. The key insight is that cost optimization is not a one-time project -- it is an ongoing practice that should be embedded in your engineering culture.`,
        },
      ],
      quiz: [
        {
          id: 'cloud-computing-basics__m4__q1',
          question:
            'A company runs a web application on 10 EC2 m5.xlarge instances 24/7 year-round. Average CPU utilization across all instances is 15%. Which combination of actions would most reduce their costs?',
          options: [
            'Switch all instances to Spot pricing',
            'Right-size to m5.large (half the CPU/RAM) and purchase 3-year Reserved Instances',
            'Add more instances to distribute the load and reduce per-instance utilization',
            'Move to a larger instance type so fewer instances are needed',
          ],
          correctIndex: 1,
          explanation:
            'With 15% average CPU utilization, the instances are significantly over-provisioned. Right-sizing to m5.large (which would bring utilization to approximately 30% -- still comfortable) cuts the per-instance cost in half. Purchasing 3-year RIs for the steady-state 24/7 workload adds another 60%+ savings. Combined, this could reduce costs by 75-80%. Spot is risky for always-on production workloads.',
        },
        {
          id: 'cloud-computing-basics__m4__q2',
          question:
            'A startup processes user-uploaded images. Traffic is highly variable: 100 uploads per hour during the day, near zero at night, with occasional viral spikes of 10,000 uploads per hour. Which architecture is most cost-effective?',
          options: [
            'A fleet of EC2 instances sized for the 10,000/hour peak, running 24/7',
            'A serverless architecture using S3 for uploads, Lambda for processing, and DynamoDB for metadata',
            'A single large EC2 instance with Reserved Instance pricing',
            'On-premises servers to avoid variable cloud costs',
          ],
          correctIndex: 1,
          explanation:
            'The serverless architecture is ideal for this variable workload. S3 handles uploads at any scale, Lambda processes images only when uploaded (paying per invocation), and DynamoDB scales on-demand. During quiet nighttime hours, the cost drops to near zero. Sizing EC2 for peak would waste money 99% of the time.',
        },
        {
          id: 'cloud-computing-basics__m4__q3',
          question:
            'An engineering team notices their monthly AWS bill increased by $5,000 unexpectedly. They have no tags on their resources and no budgets configured. What is the first step to diagnose the issue?',
          options: [
            'Immediately terminate all non-production instances',
            'Open Cost Explorer, filter by service and date range to identify which service caused the increase',
            'Contact AWS Support and ask them to explain the bill',
            'Switch all instances to Spot pricing to reduce costs',
          ],
          correctIndex: 1,
          explanation:
            'Cost Explorer lets you filter spending by service, date, region, and usage type to pinpoint exactly what caused the increase. Once identified, you can investigate the root cause (a new deployment, a forgotten test environment, a data transfer spike). Terminating resources blindly could cause outages, and contacting support is slower than self-service analysis.',
        },
        {
          id: 'cloud-computing-basics__m4__q4',
          question:
            'A data analytics team runs a nightly batch job that processes 2 TB of log files. The job takes 4 hours and can be restarted from a checkpoint if interrupted. Which EC2 pricing model should they use?',
          options: [
            'On-demand because the job only runs for 4 hours',
            'Reserved Instances for the consistent nightly schedule',
            'Spot Instances because the job is fault-tolerant with checkpointing',
            'Dedicated Hosts for compliance requirements',
          ],
          correctIndex: 2,
          explanation:
            'Spot Instances are perfect for this workload: it runs for a limited time, is fault-tolerant (can restart from checkpoints), and the 90% discount significantly reduces cost. Reserved Instances would waste money since the job only runs 4 out of 24 hours. On-demand works but is much more expensive than Spot for a workload that handles interruptions gracefully.',
        },
        {
          id: 'cloud-computing-basics__m4__q5',
          question:
            'A company\'s S3 storage costs have grown to $10,000/month. Investigation reveals that 80% of the data has not been accessed in over 6 months but must be retained for compliance. What is the most impactful optimization?',
          options: [
            'Delete all data older than 6 months',
            'Implement S3 Lifecycle policies to transition data older than 30 days to Standard-IA and older than 180 days to Glacier Deep Archive',
            'Compress all S3 objects to reduce their size',
            'Move all data to EBS volumes, which are cheaper for long-term storage',
          ],
          correctIndex: 1,
          explanation:
            'Lifecycle policies automate the transition to cheaper storage classes based on object age. Glacier Deep Archive is up to 95% cheaper than S3 Standard for long-term retention. The 80% of rarely accessed data would see dramatic cost reduction. Deletion is not an option due to compliance. EBS is actually more expensive than S3 for storage. Compression helps but lifecycle tiering has a far larger impact.',
        },
        {
          id: 'cloud-computing-basics__m4__q6',
          question:
            'A team deployed a microservices application across three AWS regions for global coverage. Their data transfer bill is $8,000/month. Which strategy would most effectively reduce this cost?',
          options: [
            'Consolidate to a single region to eliminate cross-region transfer',
            'Deploy CloudFront to cache content at edge locations, use VPC endpoints for AWS service traffic, and enable response compression',
            'Switch to a different cloud provider with cheaper data transfer',
            'Reduce the number of API calls between services',
          ],
          correctIndex: 1,
          explanation:
            'CloudFront reduces origin fetches by serving cached content from edge locations (and has lower data transfer rates than EC2). VPC endpoints keep AWS service traffic off the internet gateway, avoiding data transfer charges. Compression reduces the bytes transferred per request. Together, these architectural optimizations can cut data transfer costs by 50-70% while maintaining global coverage.',
        },
      ],
    },
  ],
};
