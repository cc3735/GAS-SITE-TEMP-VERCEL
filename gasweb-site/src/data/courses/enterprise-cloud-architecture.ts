import type { FullCourse } from '../courseContent';

export const enterpriseCloudArchitecture: FullCourse = {
  id: 'enterprise-cloud-architecture',
  instructorName: 'David Chen',
  instructorBio: 'Principal cloud architect with 16+ years designing multi-region enterprise solutions. AWS Solutions Architect Professional certified.',
  learningOutcomes: [
    'Design scalable, fault-tolerant cloud architectures',
    'Implement high availability and disaster recovery strategies',
    'Automate infrastructure with Infrastructure as Code tools',
    'Optimize enterprise cloud costs and governance',
  ],
  modules: [
    {
      id: 'enterprise-cloud-architecture__m1',
      title: 'Architecture Patterns',
      description: 'Learn enterprise cloud architecture patterns including microservices, event-driven, serverless, and multi-tier designs.',
      lessons: [
        {
          id: 'enterprise-cloud-architecture__m1__l1',
          title: 'Monoliths to Microservices',
          objectives: ['Compare monolithic, SOA, and microservices architectures', 'Identify when microservices are appropriate', 'Design service boundaries using domain-driven design'],
          estimatedMinutes: 25,
          keyTakeaways: ['Microservices trade deployment simplicity for operational complexity', 'Domain-driven design helps identify natural service boundaries', 'Start monolithic and extract services when complexity justifies it'],
          content: `## Monoliths to Microservices

### Monolithic Architecture

A **monolith** is a single deployable unit containing all application functionality. A traditional e-commerce application might have user management, product catalog, shopping cart, payment processing, and order management all in one codebase and deployment.

**Advantages:** Simple to develop, test, and deploy initially. One codebase, one database, one deployment pipeline. Easy to debug since all code is in one place.

**Disadvantages:** As the application grows, the codebase becomes unwieldy. A change to the payment module requires redeploying the entire application. Scaling requires scaling everything, even if only one component is under load. Technology choices are locked -- the entire application must use the same language and framework.

### Microservices Architecture

**Microservices** decompose the application into small, independently deployable services, each responsible for a specific business capability:

- **User Service** -- Authentication, profiles, preferences
- **Product Service** -- Catalog, search, inventory
- **Cart Service** -- Shopping cart management
- **Payment Service** -- Payment processing, refunds
- **Order Service** -- Order lifecycle, tracking, history

Each service has its own codebase, database, and deployment pipeline. Services communicate via APIs (REST, gRPC) or message queues.

**Advantages:**
- Independent deployment -- Update one service without touching others
- Technology diversity -- Each service can use the best language/framework for its needs
- Independent scaling -- Scale only the services under load
- Team autonomy -- Small teams own individual services end-to-end
- Fault isolation -- One service failing doesn't necessarily bring down the entire system

**Disadvantages:**
- Operational complexity -- Many services to deploy, monitor, and debug
- Network overhead -- Inter-service communication adds latency
- Data consistency -- Distributed transactions across services are hard
- Testing complexity -- Integration testing requires coordinating multiple services

### When to Use Microservices

Microservices are justified when:
- Your team is large enough to own individual services (typically 50+ developers)
- Different components have significantly different scaling requirements
- You need to deploy components independently at different cadences
- You have the operational maturity to manage distributed systems

**Start monolithic.** Extract microservices when specific pain points justify the complexity.

### Service Communication Patterns

**Synchronous (request/response):**
- REST APIs -- Simple, ubiquitous, HTTP-based
- gRPC -- High-performance binary protocol, strongly typed, ideal for service-to-service communication

**Asynchronous (event-driven):**
- Message queues (SQS, RabbitMQ) -- Point-to-point messaging
- Event streaming (Kafka, Kinesis) -- Publish-subscribe with event replay capability
- Event bus (EventBridge) -- Serverless event routing

**API Gateway** -- A single entry point that routes requests to appropriate services, handles authentication, rate limiting, and request/response transformation.`,
        },
        {
          id: 'enterprise-cloud-architecture__m1__l2',
          title: 'Event-Driven and Serverless Patterns',
          objectives: ['Design event-driven architectures with messaging systems', 'Implement serverless applications with AWS Lambda', 'Choose between synchronous and asynchronous processing'],
          estimatedMinutes: 25,
          keyTakeaways: ['Event-driven architectures decouple producers from consumers for better scalability', 'Serverless removes infrastructure management but introduces cold start latency', 'Use event sourcing and CQRS for complex domains requiring audit trails'],
          content: `## Event-Driven and Serverless Patterns

### Event-Driven Architecture (EDA)

In an event-driven architecture, components communicate by producing and consuming events rather than making direct API calls. An **event** is a notification that something happened: "OrderPlaced," "PaymentReceived," "InventoryUpdated."

**Key components:**
- **Event producers** -- Services that emit events when state changes
- **Event broker** -- Middleware that routes events (Kafka, EventBridge, SNS/SQS)
- **Event consumers** -- Services that react to events they're interested in

**Benefits:**
- **Loose coupling** -- Producers don't know or care about consumers
- **Scalability** -- Consumers process events at their own pace
- **Resilience** -- If a consumer is down, events queue up and are processed when it recovers
- **Extensibility** -- Add new consumers without modifying producers

**Event Sourcing** stores every state change as an immutable event rather than just the current state. To reconstruct the current state, replay all events in sequence. This provides a complete audit trail and enables temporal queries ("What was the account balance on March 1st?").

**CQRS (Command Query Responsibility Segregation)** separates read and write operations into different models. Writes go to the event store; reads come from materialized views optimized for queries. This allows independent scaling of read-heavy and write-heavy workloads.

### Serverless Architecture

**Serverless** doesn't mean "no servers" -- it means you don't manage them. Cloud providers handle provisioning, scaling, patching, and availability.

**AWS Lambda** is the most popular serverless compute platform:
- Functions triggered by events (API Gateway, S3, SQS, DynamoDB Streams, etc.)
- Pay only for execution time (billed per millisecond)
- Automatic scaling from zero to thousands of concurrent executions
- No infrastructure to manage
- Supports Python, Node.js, Java, Go, .NET, and custom runtimes

**Common serverless patterns:**

**API + Lambda + DynamoDB** -- Build REST APIs without managing any servers:
- API Gateway receives HTTP requests
- Lambda functions process business logic
- DynamoDB stores data (also serverless, scales automatically)

**Event Processing** -- Process events from queues or streams:
- SQS/SNS triggers Lambda for message processing
- S3 triggers Lambda when files are uploaded (image processing, ETL)
- EventBridge routes events between services

**Step Functions** -- Orchestrate multi-step workflows:
- Visual workflow designer
- Built-in error handling and retries
- Parallel execution and branching
- Wait states for human approval or time-based delays

**Serverless limitations:**
- **Cold starts** -- First invocation after idle period has higher latency (100ms-2s)
- **Execution time limits** -- Lambda max is 15 minutes
- **Stateless** -- No local state between invocations
- **Vendor lock-in** -- Tightly coupled to cloud provider's services
- **Debugging complexity** -- Harder to debug distributed serverless applications`,
        },
      ],
      quiz: [
        {
          id: 'enterprise-cloud-architecture__m1__q1',
          question: 'What is the main trade-off of microservices compared to monoliths?',
          options: ['Better performance for lower cost', 'Independent deployment for increased operational complexity', 'Simpler architecture for less scalability', 'Faster development for worse security'],
          correctIndex: 1,
          explanation: 'Microservices enable independent deployment and scaling but significantly increase operational complexity -- more services to deploy, monitor, debug, and coordinate.',
        },
        {
          id: 'enterprise-cloud-architecture__m1__q2',
          question: 'In event-driven architecture, what role does the event broker play?',
          options: ['It generates events', 'It routes events between producers and consumers', 'It stores the application database', 'It handles user authentication'],
          correctIndex: 1,
          explanation: 'The event broker (Kafka, EventBridge, SNS/SQS) receives events from producers and routes them to interested consumers, decoupling the two sides.',
        },
        {
          id: 'enterprise-cloud-architecture__m1__q3',
          question: 'What is a cold start in serverless computing?',
          options: ['When the data center loses power', 'Higher latency on first invocation after an idle period', 'When the function runs out of memory', 'When deployment fails'],
          correctIndex: 1,
          explanation: 'A cold start occurs when a serverless function is invoked after being idle -- the cloud provider must provision a new execution environment, adding 100ms-2s of latency.',
        },
        {
          id: 'enterprise-cloud-architecture__m1__q4',
          question: 'When should you consider extracting microservices from a monolith?',
          options: ['At the start of every project', 'When specific pain points justify the complexity', 'Only when the team has fewer than 5 developers', 'Never -- monoliths are always better'],
          correctIndex: 1,
          explanation: 'Best practice is to start monolithic and extract microservices when specific pain points (scaling needs, team size, deployment cadence) justify the additional operational complexity.',
        },
        {
          id: 'enterprise-cloud-architecture__m1__q5',
          question: 'What does CQRS separate?',
          options: ['Frontend and backend', 'Read and write operations into different models', 'Development and production environments', 'Testing and deployment'],
          correctIndex: 1,
          explanation: 'CQRS (Command Query Responsibility Segregation) separates read and write operations, allowing each to be optimized and scaled independently.',
        },
      ],
    },
    {
      id: 'enterprise-cloud-architecture__m2',
      title: 'High Availability',
      description: 'Design highly available cloud architectures with auto-scaling, load balancing, and multi-region strategies.',
      lessons: [
        {
          id: 'enterprise-cloud-architecture__m2__l1',
          title: 'Auto-Scaling and Load Balancing',
          objectives: ['Configure auto-scaling policies for variable workloads', 'Choose the right load balancer type for different applications', 'Design for horizontal scaling'],
          estimatedMinutes: 25,
          keyTakeaways: ['Horizontal scaling adds more instances; vertical scaling adds more resources to existing instances', 'Application Load Balancers route based on content; Network Load Balancers handle TCP/UDP at high throughput', 'Auto-scaling policies should use target tracking for steady-state and step scaling for burst traffic'],
          content: `## Auto-Scaling and Load Balancing

### Scaling Strategies

**Vertical scaling (scale up)** -- Add more CPU, RAM, or storage to an existing instance. Simple but has physical limits and requires downtime.

**Horizontal scaling (scale out)** -- Add more instances to handle the load. Requires stateless application design but has no theoretical limit and provides fault tolerance.

Cloud architecture strongly favors horizontal scaling. Design applications to be stateless so any instance can handle any request.

### AWS Auto Scaling

Auto Scaling Groups (ASGs) automatically adjust the number of EC2 instances:

**Scaling policies:**
- **Target tracking** -- Maintain a target metric value (e.g., keep CPU at 60%). ASG adds/removes instances automatically. Best for steady-state workloads.
- **Step scaling** -- Define scaling actions for different alarm thresholds (e.g., add 2 instances if CPU > 70%, add 4 if CPU > 90%). Good for burst traffic.
- **Scheduled scaling** -- Add capacity at known peak times (e.g., scale up before business hours, scale down at night).
- **Predictive scaling** -- Uses ML to predict demand based on historical patterns and pre-scales before load arrives.

**Configuration:**
- **Minimum capacity** -- Never go below this count (availability baseline)
- **Maximum capacity** -- Cost ceiling
- **Desired capacity** -- Current target (adjusted by scaling policies)
- **Cooldown period** -- Wait time between scaling actions to prevent thrashing
- **Health checks** -- Replace unhealthy instances automatically

### Elastic Load Balancing

Load balancers distribute traffic across multiple targets:

**Application Load Balancer (ALB)** -- Layer 7 (HTTP/HTTPS):
- Content-based routing (path, host header, query string)
- WebSocket support
- gRPC support
- Integration with WAF (Web Application Firewall)
- Best for: Web applications, microservices, API routing

**Network Load Balancer (NLB)** -- Layer 4 (TCP/UDP):
- Ultra-high performance (millions of requests per second)
- Static IP addresses
- Preserves source IP
- Best for: Real-time gaming, IoT, financial trading systems

**Gateway Load Balancer (GWLB)** -- Layer 3:
- Transparent network gateway for third-party virtual appliances
- Best for: Firewalls, IDS/IPS, deep packet inspection

### Designing for High Availability

**Multi-AZ deployment** -- Deploy instances across multiple Availability Zones (independent data centers within a region). If one AZ fails, instances in other AZs continue serving traffic.

**Health checks** -- Load balancers continuously check target health. Unhealthy targets are removed from the rotation and replaced by Auto Scaling.

**Connection draining** -- When an instance is being removed, allow in-flight requests to complete before termination (default: 300 seconds).

**Stateless design** -- Store session data externally (ElastiCache/Redis, DynamoDB) so any instance can handle any request. This enables seamless scaling and instance replacement.`,
        },
        {
          id: 'enterprise-cloud-architecture__m2__l2',
          title: 'Multi-Region and Disaster Recovery',
          objectives: ['Design multi-region architectures for global availability', 'Implement disaster recovery strategies with different RPO/RTO targets', 'Configure DNS-based failover with Route 53'],
          estimatedMinutes: 25,
          keyTakeaways: ['Multi-region architectures provide the highest availability but are the most complex and expensive', 'DR strategies range from backup/restore (cheapest, slowest) to active-active (most expensive, fastest)', 'Route 53 health checks and failover routing automate region-level failover'],
          content: `## Multi-Region and Disaster Recovery

### Why Multi-Region?

Single-region deployments are vulnerable to region-wide outages (rare but impactful). Multi-region architectures address:

- **Availability** -- Survive regional failures
- **Latency** -- Serve users from the closest region
- **Compliance** -- Keep data in specific geographic regions (GDPR, data residency laws)

### DR Strategies (by cost/complexity)

**Backup and Restore** -- Cheapest, highest RTO (hours):
- Regular backups to S3 with cross-region replication
- In a disaster, launch infrastructure in the DR region and restore from backups
- RTO: Hours | RPO: Last backup time

**Pilot Light** -- Low cost, moderate RTO:
- Core infrastructure running in DR region (database replicas, minimal compute)
- In a disaster, scale up compute resources in the DR region
- RTO: 30 minutes - 2 hours | RPO: Near-zero (continuous replication)

**Warm Standby** -- Moderate cost, lower RTO:
- Scaled-down but fully functional copy running in DR region
- In a disaster, scale up to full production capacity
- RTO: Minutes - 30 minutes | RPO: Near-zero

**Active-Active (Multi-Site)** -- Highest cost, lowest RTO:
- Full production capacity in multiple regions simultaneously
- Traffic distributed across regions via global load balancing
- In a "disaster," other regions absorb the failed region's traffic automatically
- RTO: Seconds | RPO: Zero (synchronous replication) or near-zero (async)

### Data Replication

**Synchronous replication** -- Data is written to both regions before acknowledging the write. Guarantees zero data loss (RPO=0) but adds latency to every write operation. Only practical within the same region or between nearby regions.

**Asynchronous replication** -- Data is written to the primary region and replicated to the DR region in the background. Lower latency but some data may be lost if the primary fails before replication completes (RPO = replication lag, typically seconds to minutes).

**AWS services with built-in replication:**
- **RDS Multi-AZ** -- Synchronous replication within a region
- **RDS Read Replicas** -- Asynchronous cross-region replication
- **DynamoDB Global Tables** -- Multi-region, active-active database
- **S3 Cross-Region Replication** -- Automatic object replication
- **Aurora Global Database** -- Sub-second cross-region replication

### DNS-Based Failover with Route 53

**Route 53 routing policies:**
- **Failover routing** -- Primary/secondary configuration with automatic failover based on health checks
- **Latency-based routing** -- Route users to the lowest-latency region
- **Geolocation routing** -- Route based on user geographic location
- **Weighted routing** -- Distribute traffic by percentage across regions

**Health checks** monitor endpoint availability and trigger automatic failover when the primary region becomes unhealthy.`,
        },
      ],
      quiz: [
        {
          id: 'enterprise-cloud-architecture__m2__q1',
          question: 'Which scaling approach adds more instances rather than more resources to existing instances?',
          options: ['Vertical scaling', 'Horizontal scaling', 'Diagonal scaling', 'Linear scaling'],
          correctIndex: 1,
          explanation: 'Horizontal scaling (scale out) adds more instances to handle increased load. It requires stateless application design but provides theoretically unlimited scaling capacity.',
        },
        {
          id: 'enterprise-cloud-architecture__m2__q2',
          question: 'Which DR strategy provides the fastest recovery time?',
          options: ['Backup and Restore', 'Pilot Light', 'Warm Standby', 'Active-Active'],
          correctIndex: 3,
          explanation: 'Active-Active (Multi-Site) provides the fastest recovery (seconds) because full production capacity is already running in multiple regions, with traffic automatically redirected.',
        },
        {
          id: 'enterprise-cloud-architecture__m2__q3',
          question: 'What is the main advantage of an Application Load Balancer over a Network Load Balancer?',
          options: ['Higher throughput', 'Content-based routing at Layer 7', 'Static IP addresses', 'Lower cost'],
          correctIndex: 1,
          explanation: 'ALBs operate at Layer 7 (HTTP/HTTPS) and can route based on content -- URL paths, host headers, query strings, and more. NLBs operate at Layer 4 and route based on IP/port only.',
        },
        {
          id: 'enterprise-cloud-architecture__m2__q4',
          question: 'Why must applications be stateless for effective horizontal scaling?',
          options: ['To reduce memory usage', 'So any instance can handle any request without session affinity', 'To simplify the code', 'Stateful apps cannot run on cloud instances'],
          correctIndex: 1,
          explanation: 'Stateless design means any instance can handle any request because session data is stored externally. This enables the load balancer to route to any healthy instance and allows auto-scaling to add/remove instances freely.',
        },
      ],
    },
    {
      id: 'enterprise-cloud-architecture__m3',
      title: 'Infrastructure as Code',
      description: 'Automate cloud infrastructure provisioning with Terraform, CloudFormation, and modern IaC practices.',
      lessons: [
        {
          id: 'enterprise-cloud-architecture__m3__l1',
          title: 'Terraform Fundamentals',
          objectives: ['Write Terraform configurations for AWS resources', 'Manage Terraform state and workspaces', 'Organize code with modules for reusability'],
          estimatedMinutes: 30,
          keyTakeaways: ['Terraform uses declarative HCL to define desired infrastructure state', 'State management is critical -- use remote backends like S3 for team collaboration', 'Modules encapsulate reusable infrastructure patterns'],
          content: `## Terraform Fundamentals

**Infrastructure as Code (IaC)** manages cloud resources through code rather than manual console clicks. This enables version control, code review, automated testing, and reproducible environments.

### Why Terraform?

**Terraform** by HashiCorp is the most popular IaC tool:
- **Multi-cloud** -- Works with AWS, Azure, GCP, and hundreds of other providers
- **Declarative** -- You describe the desired state; Terraform figures out how to get there
- **Plan before apply** -- Preview changes before executing them
- **State management** -- Tracks what exists and what needs to change
- **Large ecosystem** -- Thousands of providers and modules

### Core Concepts

**Providers** configure which cloud platform to interact with:
\`\`\`hcl
provider "aws" {
  region = "us-east-1"
}
\`\`\`

**Resources** define infrastructure components:
\`\`\`hcl
resource "aws_instance" "web" {
  ami           = "ami-0c55b159cbfafe1f0"
  instance_type = "t3.micro"

  tags = {
    Name = "WebServer"
  }
}
\`\`\`

**Variables** parameterize configurations:
\`\`\`hcl
variable "environment" {
  type    = string
  default = "dev"
}
\`\`\`

**Outputs** expose values from your configuration:
\`\`\`hcl
output "instance_ip" {
  value = aws_instance.web.public_ip
}
\`\`\`

### The Terraform Workflow

1. **terraform init** -- Initialize the working directory, download providers
2. **terraform plan** -- Preview what changes will be made (create, update, destroy)
3. **terraform apply** -- Execute the planned changes
4. **terraform destroy** -- Remove all managed resources

### State Management

Terraform maintains a **state file** that maps your configuration to real-world resources. This file tracks resource IDs, attributes, and dependencies.

**Remote state** stores the state file in a shared location:
\`\`\`hcl
terraform {
  backend "s3" {
    bucket         = "my-terraform-state"
    key            = "prod/terraform.tfstate"
    region         = "us-east-1"
    dynamodb_table = "terraform-locks"
    encrypt        = true
  }
}
\`\`\`

**State locking** (via DynamoDB) prevents concurrent modifications that could corrupt state.

### Modules

**Modules** are reusable infrastructure packages:

\`\`\`hcl
module "vpc" {
  source  = "terraform-aws-modules/vpc/aws"
  version = "5.0.0"

  name = "production-vpc"
  cidr = "10.0.0.0/16"

  azs             = ["us-east-1a", "us-east-1b"]
  private_subnets = ["10.0.1.0/24", "10.0.2.0/24"]
  public_subnets  = ["10.0.101.0/24", "10.0.102.0/24"]
}
\`\`\`

**Best practices:**
- Use the Terraform Registry for community-maintained modules
- Create custom modules for your organization's common patterns
- Version modules and use semantic versioning
- Keep modules focused -- one module per logical component`,
        },
        {
          id: 'enterprise-cloud-architecture__m3__l2',
          title: 'IaC Best Practices and GitOps',
          objectives: ['Implement IaC testing and validation', 'Design environment promotion workflows', 'Apply GitOps principles for infrastructure management'],
          estimatedMinutes: 25,
          keyTakeaways: ['IaC should follow the same code review and testing practices as application code', 'Environment promotion (dev → staging → prod) ensures changes are validated before production', 'GitOps uses Git as the single source of truth for both application and infrastructure state'],
          content: `## IaC Best Practices and GitOps

### Code Organization

**Repository structure:**
\`\`\`
infrastructure/
  modules/         # Reusable modules
    vpc/
    ecs-service/
    rds/
  environments/    # Environment-specific configurations
    dev/
    staging/
    prod/
  global/          # Shared resources (IAM, DNS)
\`\`\`

**Naming conventions:**
- Consistent resource naming: \`{project}-{environment}-{resource}\`
- Tag all resources with environment, team, cost center
- Use data sources to reference existing resources rather than hardcoding IDs

### Testing IaC

**Static analysis:**
- **terraform validate** -- Check syntax and configuration validity
- **tflint** -- Linter that catches common errors and enforces best practices
- **checkov/tfsec** -- Security scanning for misconfigurations (open security groups, unencrypted storage, etc.)

**Unit testing:**
- **Terratest** -- Go-based testing framework that deploys real infrastructure, validates it, and tears it down
- Test modules in isolation with known inputs and expected outputs

**Policy as Code:**
- **Sentinel** (HashiCorp) or **OPA/Rego** -- Define policies that Terraform plans must pass before applying
- Example: "No S3 buckets without encryption," "No instances without tags," "Max instance size is t3.xlarge in dev"

### Environment Promotion

Changes flow through environments:
1. **Dev** -- Developers test changes freely
2. **Staging** -- Mirrors production configuration at smaller scale
3. **Production** -- Live environment

Use **workspaces** or **separate state files** per environment. Same Terraform code, different variable values:
- Dev: smaller instances, single AZ, relaxed policies
- Prod: larger instances, multi-AZ, strict policies

### GitOps for Infrastructure

**GitOps** uses Git as the single source of truth:
- All infrastructure changes go through pull requests
- Code review is mandatory before any infrastructure modification
- Merged changes trigger automated deployment pipelines
- Git history provides a complete audit trail of every infrastructure change

**CI/CD pipeline for Terraform:**
1. PR opened → Run \`terraform plan\`, post plan output as PR comment
2. Team reviews the plan and approves
3. PR merged → Run \`terraform apply\` automatically
4. Notify team of successful/failed deployment

### Drift Detection

**Configuration drift** occurs when real infrastructure diverges from the code (manual changes, external modifications). Detect drift by:
- Running \`terraform plan\` periodically -- any differences indicate drift
- Using AWS Config rules to monitor resource configurations
- Alerting when drift is detected and remediating via the IaC pipeline`,
        },
      ],
      quiz: [
        {
          id: 'enterprise-cloud-architecture__m3__q1',
          question: 'What does "terraform plan" do?',
          options: ['Deploys infrastructure changes', 'Shows a preview of what changes will be made', 'Destroys all resources', 'Initializes the workspace'],
          correctIndex: 1,
          explanation: 'terraform plan creates an execution plan showing what changes will be made to infrastructure without actually making them, allowing review before applying.',
        },
        {
          id: 'enterprise-cloud-architecture__m3__q2',
          question: 'Why is remote state important for team collaboration?',
          options: ['It makes Terraform faster', 'It enables shared access and state locking to prevent conflicts', 'It reduces cloud costs', 'It encrypts all resources'],
          correctIndex: 1,
          explanation: 'Remote state stores the state file in a shared location (like S3) with locking (via DynamoDB) so team members can collaborate without state conflicts or corruption.',
        },
        {
          id: 'enterprise-cloud-architecture__m3__q3',
          question: 'What is configuration drift?',
          options: ['When Terraform code has syntax errors', 'When real infrastructure diverges from the code definition', 'When cloud costs increase unexpectedly', 'When DNS records change'],
          correctIndex: 1,
          explanation: 'Configuration drift occurs when actual infrastructure diverges from what\'s defined in IaC code, typically due to manual changes made outside the IaC pipeline.',
        },
        {
          id: 'enterprise-cloud-architecture__m3__q4',
          question: 'What is the primary principle of GitOps?',
          options: ['Using GitHub for all development', 'Git as the single source of truth for infrastructure state', 'Only using Git for version control', 'Automating Git commands'],
          correctIndex: 1,
          explanation: 'GitOps uses Git as the single source of truth -- all infrastructure changes go through PRs, code review, and automated deployment, with Git history providing a complete audit trail.',
        },
      ],
    },
    {
      id: 'enterprise-cloud-architecture__m4',
      title: 'Cost Management',
      description: 'Optimize enterprise cloud spending with pricing strategies, right-sizing, and governance tools.',
      lessons: [
        {
          id: 'enterprise-cloud-architecture__m4__l1',
          title: 'Cloud Pricing and Cost Optimization',
          objectives: ['Understand AWS pricing models and purchasing options', 'Implement right-sizing and resource optimization', 'Design cost-aware architectures'],
          estimatedMinutes: 25,
          keyTakeaways: ['Reserved Instances and Savings Plans can reduce compute costs by 40-72%', 'Right-sizing identifies over-provisioned resources that waste money', 'Tagging strategy is the foundation of cost allocation and accountability'],
          content: `## Cloud Pricing and Cost Optimization

Cloud costs can spiral quickly without governance. A well-designed cost optimization strategy can reduce cloud spend by 30-50% without impacting performance.

### AWS Pricing Models

**On-Demand** -- Pay by the hour/second with no commitment. Most flexible but most expensive. Good for unpredictable, short-term workloads.

**Reserved Instances (RIs)** -- Commit to 1 or 3 years for a significant discount:
- **Standard RI** -- Up to 72% discount, fixed instance type
- **Convertible RI** -- Up to 66% discount, can change instance type
- **Payment options** -- All upfront (biggest discount), partial upfront, no upfront

**Savings Plans** -- More flexible than RIs:
- **Compute Savings Plans** -- Apply to any EC2, Lambda, or Fargate usage. Up to 66% savings.
- **EC2 Instance Savings Plans** -- Locked to instance family in a region. Up to 72% savings.

**Spot Instances** -- Up to 90% discount for unused EC2 capacity. AWS can reclaim instances with 2-minute notice. Best for fault-tolerant workloads: batch processing, CI/CD, data analysis.

### Right-Sizing

Right-sizing identifies resources that are over-provisioned (paying for capacity you don't use):

- **AWS Compute Optimizer** -- Analyzes utilization and recommends optimal instance types
- **CloudWatch metrics** -- Monitor CPU, memory, network, and disk I/O utilization
- **Rule of thumb** -- If average CPU utilization is below 20%, the instance is likely over-sized

**Common findings:**
- Dev/test instances running production-sized instances (use t3.small instead of m5.xlarge)
- Databases provisioned for peak load but running at 10% average utilization
- Over-provisioned EBS volumes (100GB allocated, 20GB used)

### Cost-Aware Architecture Patterns

**Serverless for variable workloads** -- Lambda, API Gateway, DynamoDB scale to zero and charge only for actual usage. Perfect for APIs with unpredictable traffic.

**Spot Instances for batch processing** -- Use Spot for training ML models, running CI/CD builds, or processing large datasets. Implement checkpointing to resume interrupted jobs.

**S3 storage tiers** -- Automatically transition objects to cheaper tiers:
- S3 Standard → S3 Infrequent Access (after 30 days) → S3 Glacier (after 90 days) → Glacier Deep Archive (after 180 days)
- S3 Intelligent-Tiering automates this based on access patterns

**Auto-scaling to match demand** -- Scale down during off-peak hours. Schedule scaling policies for predictable patterns.

### Cost Governance

**Tagging strategy** -- Tag every resource with: Environment, Team, Project, CostCenter. This enables cost allocation reporting.

**AWS Budgets** -- Set spending alerts:
- Budget thresholds (alert at 80%, 100%, 120% of budget)
- Forecasted alerts (alert if projected spend will exceed budget)
- Automated actions (stop instances, apply SCPs)

**AWS Cost Explorer** -- Visualize and analyze spending patterns, identify cost drivers, and forecast future costs.

**Service Control Policies (SCPs)** in AWS Organizations -- Restrict which services and instance types can be used in specific accounts. Prevent developers from launching expensive instances in dev accounts.`,
        },
      ],
      quiz: [
        {
          id: 'enterprise-cloud-architecture__m4__q1',
          question: 'Which purchasing option offers the deepest discount but requires a 1-3 year commitment?',
          options: ['On-Demand', 'Spot Instances', 'Reserved Instances', 'Pay-as-you-go'],
          correctIndex: 2,
          explanation: 'Reserved Instances offer up to 72% discount with a 1 or 3-year commitment. Spot Instances can be cheaper but can be reclaimed by AWS at any time.',
        },
        {
          id: 'enterprise-cloud-architecture__m4__q2',
          question: 'What is the purpose of resource tagging for cost management?',
          options: ['To improve security', 'To enable cost allocation and accountability by team/project/environment', 'To speed up instance startup', 'To encrypt resources'],
          correctIndex: 1,
          explanation: 'Tags enable cost allocation reporting -- you can see exactly how much each team, project, or environment is spending, enabling accountability and optimization.',
        },
        {
          id: 'enterprise-cloud-architecture__m4__q3',
          question: 'When are Spot Instances appropriate?',
          options: ['For production databases', 'For fault-tolerant workloads like batch processing and CI/CD', 'For any workload that needs guaranteed availability', 'For DNS servers'],
          correctIndex: 1,
          explanation: 'Spot Instances can be reclaimed with 2-minute notice, so they\'re only appropriate for fault-tolerant workloads that can handle interruptions, like batch processing and CI/CD builds.',
        },
        {
          id: 'enterprise-cloud-architecture__m4__q4',
          question: 'If an EC2 instance averages 15% CPU utilization, what should you consider?',
          options: ['Adding more CPU', 'Right-sizing to a smaller instance type', 'Adding more memory', 'Nothing -- this is optimal'],
          correctIndex: 1,
          explanation: 'Average CPU below 20% typically indicates the instance is over-provisioned. Right-sizing to a smaller instance type maintains performance while reducing costs.',
        },
      ],
    },
  ],
};
