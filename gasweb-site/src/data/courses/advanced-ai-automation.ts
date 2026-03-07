import type { FullCourse } from '../courseContent';

export const advancedAiAutomation: FullCourse = {
  id: 'advanced-ai-automation',
  instructorName: 'Dr. Alex Kim',
  instructorBio: 'ML engineer and AI systems architect. Led AI teams at two unicorn startups. AWS ML Specialty certified.',
  learningOutcomes: [
    'Design and implement LLM-powered applications with RAG and embeddings',
    'Build robust AI pipeline architectures for data processing and inference',
    'Deploy and scale ML models in production environments',
    'Implement MLOps practices for model monitoring and maintenance',
  ],
  modules: [
    {
      id: 'advanced-ai-automation__m1',
      title: 'LLM Integration',
      description: 'Learn to integrate large language models into applications using APIs, embeddings, RAG, and prompt chaining.',
      lessons: [
        {
          id: 'advanced-ai-automation__m1__l1',
          title: 'Working with LLM APIs',
          objectives: ['Design effective API integrations with OpenAI, Anthropic, and other providers', 'Implement streaming responses and error handling', 'Manage API costs and rate limits'],
          estimatedMinutes: 25,
          keyTakeaways: ['LLM APIs accept structured messages and return completions with usage metadata', 'Streaming reduces perceived latency for real-time applications', 'Token-based pricing requires careful prompt optimization and caching strategies'],
          content: `## Working with LLM APIs

Modern LLM APIs follow a common pattern: you send a sequence of messages (system prompt, user messages, assistant responses) and receive a completion. Understanding how to work with these APIs effectively is the foundation of building AI-powered applications.

### API Architecture

Most LLM providers (OpenAI, Anthropic, Google, Mistral) expose REST APIs with similar structures:

**Request structure:**
- **Model** -- Which model to use (e.g., gpt-4o, claude-sonnet-4-20250514, gemini-2.0-flash)
- **Messages** -- Array of conversation messages with roles (system, user, assistant)
- **Temperature** -- Controls randomness (0 = deterministic, 1 = creative)
- **Max tokens** -- Limits response length
- **Tools/Functions** -- Optional function definitions for tool use

**Response structure:**
- **Content** -- The model's generated text
- **Usage** -- Token counts (prompt tokens, completion tokens, total)
- **Finish reason** -- Why generation stopped (length, stop, tool_use)

### Streaming Responses

For user-facing applications, streaming dramatically improves perceived performance. Instead of waiting for the entire response, tokens are sent as they're generated:

\`\`\`
// Conceptual streaming pattern
const stream = await client.messages.create({
  model: 'claude-sonnet-4-20250514',
  messages: [{ role: 'user', content: 'Explain quantum computing' }],
  stream: true,
});

for await (const chunk of stream) {
  process.stdout.write(chunk.delta?.text || '');
}
\`\`\`

### Error Handling and Resilience

Production LLM integrations must handle:
- **Rate limits (429)** -- Implement exponential backoff with jitter
- **Timeouts** -- Set reasonable timeouts (30-120s depending on task complexity)
- **Content filters** -- Handle refusals gracefully with fallback responses
- **API outages** -- Consider multi-provider fallback (primary: Claude, fallback: GPT-4)
- **Malformed responses** -- Validate structured outputs before using them

### Cost Management

LLM API costs are based on tokens (roughly 4 characters per token):

**Optimization strategies:**
- **Prompt caching** -- Cache system prompts and common prefixes
- **Model selection** -- Use smaller models for simple tasks, large models for complex reasoning
- **Response length limits** -- Set appropriate max_tokens to avoid unnecessarily long responses
- **Batch processing** -- Use batch APIs for non-real-time workloads (typically 50% cheaper)
- **Semantic caching** -- Cache responses for semantically similar queries
- **Prompt compression** -- Remove redundant context, use concise instructions`,
        },
        {
          id: 'advanced-ai-automation__m1__l2',
          title: 'Retrieval-Augmented Generation (RAG)',
          objectives: ['Design a RAG pipeline with vector databases', 'Implement document chunking and embedding strategies', 'Optimize retrieval quality and relevance'],
          estimatedMinutes: 30,
          keyTakeaways: ['RAG grounds LLM responses in your organization\'s actual data', 'Chunk size, overlap, and embedding model choice significantly impact retrieval quality', 'Hybrid search (combining semantic and keyword search) often outperforms either alone'],
          content: `## Retrieval-Augmented Generation (RAG)

**RAG** combines the power of LLMs with your organization's knowledge base. Instead of relying solely on the model's training data, RAG retrieves relevant documents and includes them in the prompt, enabling accurate, up-to-date, and source-cited responses.

### The RAG Pipeline

1. **Document ingestion** -- Load documents from various sources (PDFs, websites, databases, APIs)
2. **Chunking** -- Split documents into smaller segments that fit within the model's context window
3. **Embedding** -- Convert each chunk into a high-dimensional vector using an embedding model
4. **Indexing** -- Store vectors in a vector database for efficient similarity search
5. **Retrieval** -- When a query arrives, embed the query and find the most similar document chunks
6. **Generation** -- Include retrieved chunks in the LLM prompt as context, generate a response

### Chunking Strategies

How you split documents dramatically affects retrieval quality:

**Fixed-size chunking** -- Split every N characters/tokens with overlap. Simple but may split mid-sentence or mid-concept.
- Typical chunk size: 500-1000 tokens
- Typical overlap: 50-200 tokens (ensures context isn't lost at boundaries)

**Semantic chunking** -- Split at natural boundaries (paragraphs, sections, headings). Preserves meaning better but produces variable-size chunks.

**Recursive chunking** -- Try splitting by paragraphs first, then sentences if chunks are too large. This is the most commonly used approach.

**Document-aware chunking** -- Understand document structure (tables, code blocks, lists) and keep related content together.

### Vector Databases

Vector databases are optimized for storing and querying high-dimensional vectors:

- **Pinecone** -- Fully managed, serverless, easy to start with
- **Weaviate** -- Open-source, supports hybrid search, GraphQL API
- **Qdrant** -- Open-source, high performance, supports filtering
- **ChromaDB** -- Lightweight, embedded, great for prototyping
- **pgvector** -- PostgreSQL extension, good if you already use Postgres

### Embedding Models

Embedding models convert text into vectors that capture semantic meaning:

- **OpenAI text-embedding-3-small/large** -- High quality, cost-effective
- **Cohere embed-v3** -- Strong multilingual support
- **Sentence-transformers** -- Open-source models you can self-host
- **Voyage AI** -- Specialized for code and technical content

### Improving RAG Quality

**Hybrid search** combines vector similarity with keyword matching (BM25). This catches both semantically similar content and exact term matches.

**Re-ranking** -- After initial retrieval, use a cross-encoder model to re-rank results for better relevance. Cohere Rerank and cross-encoder models from Hugging Face are popular choices.

**Query transformation** -- Reformulate user queries for better retrieval:
- **HyDE (Hypothetical Document Embedding)** -- Generate a hypothetical answer, embed it, and use that for search
- **Query decomposition** -- Break complex queries into sub-queries
- **Query expansion** -- Add synonyms and related terms

**Metadata filtering** -- Store metadata (date, author, category) with chunks and filter before similarity search to narrow the search space.

**Evaluation** -- Measure RAG quality with metrics like:
- **Retrieval precision/recall** -- Are the right documents being retrieved?
- **Faithfulness** -- Is the generated answer supported by the retrieved context?
- **Relevance** -- Does the answer address the user's question?`,
        },
        {
          id: 'advanced-ai-automation__m1__l3',
          title: 'Prompt Engineering for Production',
          objectives: ['Design robust system prompts for production applications', 'Implement structured outputs and output parsing', 'Apply prompt chaining for complex multi-step tasks'],
          estimatedMinutes: 25,
          keyTakeaways: ['Production prompts need explicit instructions, examples, and output format specifications', 'Structured outputs (JSON mode) enable reliable downstream processing', 'Prompt chaining breaks complex tasks into reliable, testable steps'],
          content: `## Prompt Engineering for Production

Production prompt engineering goes beyond getting good responses in a chat interface. It requires designing prompts that produce consistent, parseable, and reliable outputs across thousands of requests.

### System Prompt Design

A well-structured system prompt includes:

**Role and context** -- Define who the AI is and what it's doing:
"You are a customer support agent for Acme Corp. You help users with billing questions, account management, and technical issues."

**Instructions** -- Specific behavioral guidelines:
- What to do and what NOT to do
- How to handle edge cases
- When to escalate vs. answer directly
- Tone and style requirements

**Output format** -- Exactly how responses should be structured:
"Respond with a JSON object containing: answer (string), confidence (number 0-1), sources (array of strings), needs_escalation (boolean)"

**Examples (few-shot)** -- Concrete input/output pairs that demonstrate expected behavior. Including 2-5 examples significantly improves consistency.

### Structured Outputs

For programmatic consumption, you need reliable output formats:

**JSON mode** -- Most API providers support forcing JSON output:
- OpenAI: \`response_format: { type: "json_object" }\`
- Anthropic: Explicit JSON instructions in the prompt with tool_use

**Schema validation** -- Define expected schemas and validate responses:
- Use Zod, JSON Schema, or Pydantic to define expected structure
- Validate every response before processing
- Have fallback logic for invalid responses

**Tool use / Function calling** -- Define available tools with typed parameters. The model returns structured tool calls rather than free-text:

\`\`\`
tools: [{
  name: "search_products",
  description: "Search the product catalog",
  input_schema: {
    type: "object",
    properties: {
      query: { type: "string" },
      category: { type: "string", enum: ["electronics", "clothing", "books"] },
      max_price: { type: "number" }
    },
    required: ["query"]
  }
}]
\`\`\`

### Prompt Chaining

Complex tasks are more reliable when broken into sequential steps:

**Example: Document Analysis Pipeline**
1. **Extract** -- "Extract all key facts from this document as a bullet list"
2. **Classify** -- "Classify each fact into categories: financial, operational, legal, technical"
3. **Summarize** -- "Create an executive summary from the classified facts"
4. **Format** -- "Format the summary as a structured report with sections"

Each step receives the output of the previous step. Benefits:
- Each step is simpler and more reliable
- You can test and optimize each step independently
- Failed steps can be retried without re-running the entire chain
- Intermediate results can be cached and inspected

### Prompt Testing and Evaluation

Production prompts need systematic testing:

- **Test suites** -- Create diverse test cases covering normal inputs, edge cases, and adversarial inputs
- **Regression testing** -- Re-run test suites after prompt changes to catch regressions
- **A/B testing** -- Compare prompt versions on real traffic with metrics
- **Human evaluation** -- Have domain experts rate output quality on a rubric
- **Automated metrics** -- Use LLM-as-judge to evaluate response quality at scale`,
        },
      ],
      quiz: [
        {
          id: 'advanced-ai-automation__m1__q1',
          question: 'What is the primary purpose of RAG?',
          options: ['To train new language models', 'To ground LLM responses in specific knowledge sources', 'To reduce model size', 'To generate training data'],
          correctIndex: 1,
          explanation: 'RAG (Retrieval-Augmented Generation) retrieves relevant documents from a knowledge base and includes them in the LLM prompt, grounding responses in specific, up-to-date information.',
        },
        {
          id: 'advanced-ai-automation__m1__q2',
          question: 'Why is streaming important for user-facing LLM applications?',
          options: ['It reduces API costs', 'It improves model accuracy', 'It reduces perceived latency by showing tokens as they generate', 'It enables offline functionality'],
          correctIndex: 2,
          explanation: 'Streaming sends tokens to the user as they are generated, dramatically reducing perceived wait time even though total generation time is similar.',
        },
        {
          id: 'advanced-ai-automation__m1__q3',
          question: 'What does hybrid search combine in a RAG pipeline?',
          options: ['Two different LLMs', 'Vector similarity and keyword matching', 'CPU and GPU processing', 'Cloud and on-premise storage'],
          correctIndex: 1,
          explanation: 'Hybrid search combines semantic vector similarity search with traditional keyword matching (BM25), catching both conceptually similar and term-exact matches.',
        },
        {
          id: 'advanced-ai-automation__m1__q4',
          question: 'What is prompt chaining?',
          options: ['Linking multiple API keys together', 'Breaking complex tasks into sequential steps with each feeding the next', 'Sending the same prompt to multiple models', 'Encrypting prompts for security'],
          correctIndex: 1,
          explanation: 'Prompt chaining breaks complex tasks into sequential, simpler steps where each step receives the output of the previous one, improving reliability and testability.',
        },
        {
          id: 'advanced-ai-automation__m1__q5',
          question: 'Which chunk size is typically recommended for RAG document chunking?',
          options: ['50-100 tokens', '500-1000 tokens', '5000-10000 tokens', 'Entire documents'],
          correctIndex: 1,
          explanation: '500-1000 tokens is the typical recommended chunk size, balancing enough context for meaningful content with small enough size for precise retrieval.',
        },
      ],
    },
    {
      id: 'advanced-ai-automation__m2',
      title: 'AI Pipeline Architecture',
      description: 'Design and build data processing and inference pipelines for AI applications.',
      lessons: [
        {
          id: 'advanced-ai-automation__m2__l1',
          title: 'Data Ingestion and Feature Engineering',
          objectives: ['Design data ingestion pipelines for ML workloads', 'Implement feature engineering techniques', 'Handle data quality and preprocessing'],
          estimatedMinutes: 25,
          keyTakeaways: ['Data quality directly determines model quality -- garbage in, garbage out', 'Feature engineering transforms raw data into signals that models can learn from', 'Automated feature stores enable consistent features across training and inference'],
          content: `## Data Ingestion and Feature Engineering

The quality of your AI system depends more on your data pipeline than on your model architecture. This lesson covers how to build robust data ingestion systems and engineer features that maximize model performance.

### Data Ingestion Patterns

**Batch ingestion** processes data in scheduled intervals (hourly, daily). Use when real-time processing isn't needed and you're working with large datasets. Tools: Apache Spark, AWS Glue, dbt.

**Stream ingestion** processes data in real-time as it arrives. Essential for fraud detection, recommendation updates, and monitoring. Tools: Apache Kafka, AWS Kinesis, Apache Flink.

**Change Data Capture (CDC)** tracks changes in source databases and propagates them to the data pipeline. Useful for keeping ML features synchronized with operational databases without full table scans.

### Data Quality Checks

Before data enters your ML pipeline, validate it:

- **Schema validation** -- Ensure data conforms to expected types and structures
- **Null/missing value detection** -- Identify and handle missing data (impute, drop, or flag)
- **Distribution checks** -- Detect when data distributions shift from training data (data drift)
- **Outlier detection** -- Identify and handle anomalous values
- **Freshness checks** -- Verify data is up-to-date and not stale
- **Deduplication** -- Remove duplicate records

Tools like Great Expectations and Pandera automate data quality testing.

### Feature Engineering

**Feature engineering** transforms raw data into meaningful inputs for ML models:

**Numerical features:**
- **Normalization** -- Scale values to 0-1 range
- **Standardization** -- Transform to mean=0, std=1
- **Log transformation** -- Handle skewed distributions
- **Binning** -- Convert continuous values to categories

**Categorical features:**
- **One-hot encoding** -- Create binary columns for each category
- **Label encoding** -- Assign numeric IDs to categories
- **Target encoding** -- Replace categories with the mean of the target variable
- **Embedding** -- Learn dense vector representations (for high-cardinality categories)

**Text features:**
- **TF-IDF** -- Term frequency-inverse document frequency
- **Word embeddings** -- Word2Vec, GloVe
- **Sentence embeddings** -- Sentence-BERT, OpenAI embeddings

**Time-series features:**
- **Lag features** -- Previous values (t-1, t-2, etc.)
- **Rolling statistics** -- Moving averages, standard deviations
- **Calendar features** -- Day of week, month, holiday indicators

### Feature Stores

A **feature store** centralizes feature computation and serving:

- **Consistency** -- Same feature computation for training and inference
- **Reusability** -- Features computed once and shared across models
- **Versioning** -- Track feature definitions over time
- **Online/offline serving** -- Low-latency serving for real-time inference, batch serving for training

Popular feature stores: Feast (open-source), Tecton, Amazon SageMaker Feature Store.`,
        },
        {
          id: 'advanced-ai-automation__m2__l2',
          title: 'Training and Inference Pipelines',
          objectives: ['Design reproducible training pipelines', 'Build scalable inference architectures', 'Implement experiment tracking and model versioning'],
          estimatedMinutes: 25,
          keyTakeaways: ['Reproducible training requires tracking data, code, hyperparameters, and environment', 'Inference architecture depends on latency requirements and traffic patterns', 'Experiment tracking prevents lost knowledge and enables systematic improvement'],
          content: `## Training and Inference Pipelines

### Training Pipelines

A training pipeline automates the process of building ML models from data:

**Pipeline stages:**
1. **Data loading** -- Fetch data from the feature store or data warehouse
2. **Preprocessing** -- Apply transformations, handle missing values
3. **Train/test split** -- Divide data for training and evaluation (stratified for imbalanced datasets)
4. **Model training** -- Fit the model on training data with specified hyperparameters
5. **Evaluation** -- Compute metrics on the test set
6. **Model registration** -- If metrics pass thresholds, register the model in the model registry
7. **Notification** -- Alert team of results

**Orchestration tools:**
- **Apache Airflow** -- Industry standard for workflow orchestration, DAG-based
- **Prefect** -- Modern Python-native orchestration with better developer experience
- **Kubeflow Pipelines** -- Kubernetes-native ML pipeline orchestration
- **AWS Step Functions** -- Serverless workflow orchestration on AWS

### Experiment Tracking

Every training run should record:
- **Parameters** -- Hyperparameters, model architecture, training config
- **Metrics** -- Accuracy, F1, AUC, loss, custom business metrics
- **Artifacts** -- Model files, evaluation plots, confusion matrices
- **Data version** -- Which dataset version was used
- **Code version** -- Git commit hash
- **Environment** -- Python version, library versions, hardware used

**Tools:** MLflow, Weights & Biases (W&B), Neptune.ai, Comet ML

### Model Registry

A model registry is a centralized store for trained models:
- **Version management** -- Track model versions with metadata
- **Stage management** -- Models move through stages: Development → Staging → Production
- **Approval workflows** -- Require review before production deployment
- **Lineage tracking** -- Which data and code produced each model

### Inference Architecture

**Real-time inference** (synchronous, <100ms):
- REST API endpoint that accepts input and returns predictions
- Use model serving frameworks: TensorFlow Serving, TorchServe, Triton
- Deploy behind a load balancer for high availability
- Implement caching for repeated inputs

**Batch inference** (asynchronous, minutes to hours):
- Process large datasets on a schedule
- Store results in a database or data warehouse
- More cost-effective than real-time for non-urgent predictions

**Serverless inference:**
- AWS Lambda, Google Cloud Functions, Azure Functions
- Pay only for actual inference requests
- Auto-scales to zero when not in use
- Cold start latency can be an issue for large models

### Model Optimization for Inference

- **Quantization** -- Reduce model precision (FP32 → INT8) for faster inference with minimal accuracy loss
- **Pruning** -- Remove unimportant model weights
- **Distillation** -- Train a smaller "student" model to mimic a larger "teacher" model
- **ONNX Runtime** -- Optimize and accelerate models across hardware platforms
- **Batching** -- Group multiple requests for GPU efficiency`,
        },
      ],
      quiz: [
        {
          id: 'advanced-ai-automation__m2__q1',
          question: 'What is the purpose of a feature store?',
          options: ['To store raw data files', 'To centralize feature computation for consistency between training and inference', 'To store trained ML models', 'To manage API keys'],
          correctIndex: 1,
          explanation: 'A feature store centralizes feature computation and serving, ensuring the same feature logic is used consistently across training and real-time inference.',
        },
        {
          id: 'advanced-ai-automation__m2__q2',
          question: 'Which tool is the industry standard for ML workflow orchestration?',
          options: ['Docker', 'Apache Airflow', 'Kubernetes', 'Jenkins'],
          correctIndex: 1,
          explanation: 'Apache Airflow is the industry-standard tool for orchestrating ML workflows, using Directed Acyclic Graphs (DAGs) to define pipeline dependencies and schedules.',
        },
        {
          id: 'advanced-ai-automation__m2__q3',
          question: 'Model quantization reduces model precision to achieve what benefit?',
          options: ['Better accuracy', 'Faster inference with minimal accuracy loss', 'Larger model capacity', 'Better training convergence'],
          correctIndex: 1,
          explanation: 'Quantization reduces model precision (e.g., FP32 to INT8), making inference faster and reducing memory requirements with minimal impact on accuracy.',
        },
        {
          id: 'advanced-ai-automation__m2__q4',
          question: 'What should experiment tracking record?',
          options: ['Only the final accuracy metric', 'Parameters, metrics, artifacts, data version, and code version', 'Only the model weights', 'Only hyperparameters'],
          correctIndex: 1,
          explanation: 'Comprehensive experiment tracking records all parameters, metrics, artifacts, data versions, code versions, and environment details for full reproducibility.',
        },
        {
          id: 'advanced-ai-automation__m2__q5',
          question: 'When is batch inference preferred over real-time inference?',
          options: ['When sub-second latency is required', 'When processing large datasets on a schedule where immediate results aren\'t needed', 'When serving a single user', 'When the model is very small'],
          correctIndex: 1,
          explanation: 'Batch inference is preferred when predictions don\'t need to be immediate -- processing large datasets on a schedule is more cost-effective than maintaining always-on real-time endpoints.',
        },
      ],
    },
    {
      id: 'advanced-ai-automation__m3',
      title: 'Model Deployment',
      description: 'Deploy ML models to production with containerization, serving frameworks, and deployment strategies.',
      lessons: [
        {
          id: 'advanced-ai-automation__m3__l1',
          title: 'Containerization and Model Serving',
          objectives: ['Containerize ML models with Docker', 'Deploy models using serving frameworks', 'Implement health checks and graceful scaling'],
          estimatedMinutes: 25,
          keyTakeaways: ['Docker containers ensure consistent environments from development to production', 'Model serving frameworks handle batching, versioning, and multi-model serving', 'Health checks and readiness probes enable reliable auto-scaling'],
          content: `## Containerization and Model Serving

### Why Containers for ML?

ML models have complex dependencies -- specific Python versions, GPU drivers, CUDA versions, and library versions that must all be compatible. Docker containers encapsulate the entire runtime environment, eliminating "works on my machine" problems.

### Docker for ML Models

A typical ML model Dockerfile:

\`\`\`dockerfile
FROM python:3.11-slim

WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY model/ ./model/
COPY serve.py .

EXPOSE 8000
CMD ["uvicorn", "serve:app", "--host", "0.0.0.0", "--port", "8000"]
\`\`\`

**Best practices:**
- Use multi-stage builds to reduce image size
- Pin all dependency versions for reproducibility
- Use slim/distroless base images
- Cache pip downloads in a separate layer
- Include health check endpoints

### Model Serving Frameworks

**FastAPI** -- Lightweight Python web framework, excellent for simple model APIs. Easy to add input validation with Pydantic, automatic OpenAPI docs, and async support.

**TensorFlow Serving** -- High-performance serving for TensorFlow models. Supports model versioning, batching, and gRPC/REST APIs. Production-ready and battle-tested at Google scale.

**TorchServe** -- PyTorch's model serving framework. Supports custom handlers, multi-model serving, A/B testing, and dynamic batching.

**NVIDIA Triton** -- Supports multiple frameworks (TensorFlow, PyTorch, ONNX, Python). Optimized for GPU inference with dynamic batching, model ensembles, and concurrent model execution.

### Deployment on Kubernetes

For production scale, Kubernetes manages container orchestration:

- **Deployment** -- Manages replicas and rolling updates
- **Service** -- Load balances traffic across replicas
- **HPA (Horizontal Pod Autoscaler)** -- Scales based on CPU/GPU utilization or custom metrics
- **Readiness probes** -- Only send traffic to pods that have loaded the model and are ready
- **Liveness probes** -- Restart pods that become unresponsive
- **Resource limits** -- Set CPU/memory/GPU limits to prevent resource contention

### GPU Considerations

- Use NVIDIA GPU Operator for Kubernetes GPU support
- Implement GPU sharing (MIG on A100, time-slicing) for smaller models
- Monitor GPU utilization to right-size instances
- Consider serverless GPU options (Modal, RunPod) for variable workloads`,
        },
        {
          id: 'advanced-ai-automation__m3__l2',
          title: 'Deployment Strategies and Testing',
          objectives: ['Implement canary and blue-green deployment strategies', 'Design A/B tests for model comparison', 'Build rollback procedures for failed deployments'],
          estimatedMinutes: 25,
          keyTakeaways: ['Canary deployments gradually shift traffic to catch issues before full rollout', 'A/B testing provides statistical evidence for model comparison', 'Automated rollback triggers prevent bad models from impacting users'],
          content: `## Deployment Strategies and Testing

Deploying a new ML model to production is inherently risky -- the model may perform differently on real-world data than on test data. Deployment strategies mitigate this risk.

### Blue-Green Deployment

Maintain two identical environments:
- **Blue** -- Current production version
- **Green** -- New version being deployed

Process:
1. Deploy the new model to the Green environment
2. Run validation tests on Green
3. Switch traffic from Blue to Green (instant switch)
4. Keep Blue running as a rollback target
5. Once confirmed, decommission Blue

**Pros:** Instant rollback, zero downtime
**Cons:** Requires double the infrastructure during deployment

### Canary Deployment

Gradually shift traffic from the old model to the new model:

1. Deploy new model alongside the current one
2. Route 5% of traffic to the new model
3. Monitor error rates, latency, and business metrics
4. If metrics are healthy, increase to 25%, then 50%, then 100%
5. If metrics degrade at any stage, roll back immediately

**Automated canary analysis:**
- Define success criteria (error rate < 0.1%, p99 latency < 200ms, business metric within 5% of baseline)
- Use tools like Flagger (Kubernetes), AWS CodeDeploy, or Argo Rollouts to automate traffic shifting and rollback

### Shadow Deployment

Route real production traffic to both the old and new model simultaneously, but only serve responses from the old model. Log the new model's predictions for analysis without any user impact.

This is the safest approach for high-stakes applications but requires extra compute resources.

### A/B Testing for Models

A/B testing provides statistical evidence for model comparison:

1. **Define hypothesis** -- "New model improves click-through rate by 5%"
2. **Split traffic** -- Randomly assign users to control (old model) or treatment (new model)
3. **Collect data** -- Run for sufficient duration to achieve statistical significance
4. **Analyze results** -- Use statistical tests (t-test, chi-squared) to determine if differences are significant
5. **Make decision** -- Deploy winner to 100% or iterate

**Important:** Ensure the user assignment is consistent (same user always sees the same model) to avoid confusion and invalid data.

### Monitoring During Deployment

During any deployment, monitor:
- **Error rates** -- Sudden spike indicates a problem
- **Latency** -- p50, p95, p99 response times
- **Business metrics** -- Conversion rates, engagement, revenue
- **Model-specific metrics** -- Prediction distribution, confidence scores
- **Resource utilization** -- CPU, memory, GPU usage

Set alerts with automatic rollback triggers for critical metric violations.`,
        },
      ],
      quiz: [
        {
          id: 'advanced-ai-automation__m3__q1',
          question: 'What advantage does canary deployment provide over blue-green deployment?',
          options: ['Faster deployment', 'Gradual traffic shifting to catch issues early', 'Less infrastructure cost', 'Better model accuracy'],
          correctIndex: 1,
          explanation: 'Canary deployment gradually shifts traffic (e.g., 5% → 25% → 100%), allowing you to detect issues with real traffic before the new model serves all users.',
        },
        {
          id: 'advanced-ai-automation__m3__q2',
          question: 'What is the purpose of a shadow deployment?',
          options: ['To deploy models faster', 'To run a new model on real traffic without serving its responses to users', 'To reduce compute costs', 'To encrypt model predictions'],
          correctIndex: 1,
          explanation: 'Shadow deployment sends real traffic to both old and new models but only serves the old model\'s responses, allowing risk-free comparison of the new model\'s behavior.',
        },
        {
          id: 'advanced-ai-automation__m3__q3',
          question: 'Why are readiness probes important for ML model deployments on Kubernetes?',
          options: ['They train the model faster', 'They ensure traffic only reaches pods that have loaded the model and are ready to serve', 'They reduce deployment time', 'They compress the model'],
          correctIndex: 1,
          explanation: 'Readiness probes prevent traffic from being sent to pods that are still loading the model into memory, which could cause errors or timeouts during startup.',
        },
        {
          id: 'advanced-ai-automation__m3__q4',
          question: 'Which model serving framework supports multiple ML frameworks including TensorFlow, PyTorch, and ONNX?',
          options: ['FastAPI', 'TorchServe', 'TensorFlow Serving', 'NVIDIA Triton'],
          correctIndex: 3,
          explanation: 'NVIDIA Triton Inference Server supports multiple frameworks (TensorFlow, PyTorch, ONNX, Python backends) and is optimized for GPU inference with dynamic batching.',
        },
      ],
    },
    {
      id: 'advanced-ai-automation__m4',
      title: 'MLOps & Monitoring',
      description: 'Implement MLOps practices for continuous model improvement, monitoring, and maintenance.',
      lessons: [
        {
          id: 'advanced-ai-automation__m4__l1',
          title: 'Model Monitoring and Drift Detection',
          objectives: ['Implement monitoring for model performance in production', 'Detect and respond to data and concept drift', 'Design alerting strategies for ML systems'],
          estimatedMinutes: 25,
          keyTakeaways: ['Model performance degrades over time as real-world data patterns change', 'Data drift monitors input distributions; concept drift monitors the relationship between inputs and outputs', 'Automated retraining pipelines respond to drift without manual intervention'],
          content: `## Model Monitoring and Drift Detection

Models that perform perfectly at deployment will degrade over time. Real-world data changes, user behavior evolves, and the patterns the model learned become stale. Monitoring detects these changes before they impact business outcomes.

### Types of Drift

**Data drift (covariate shift)** -- The distribution of input features changes. Example: A model trained on summer customer data sees different patterns in winter. Input features like "outdoor activity" shift dramatically.

**Concept drift** -- The relationship between inputs and outputs changes. Example: A fraud detection model trained before a new payment method was introduced. The definition of "fraudulent" behavior changes.

**Prediction drift** -- The distribution of model predictions changes, even if inputs haven't shifted. This can indicate internal model issues.

### Monitoring Strategy

**Operational monitoring** (is the system running?):
- Request latency (p50, p95, p99)
- Error rates and types
- Throughput (requests per second)
- Resource utilization (CPU, memory, GPU)
- Queue depth and processing lag

**Model performance monitoring** (is the model still accurate?):
- **With ground truth** -- When you eventually receive true labels (e.g., fraud confirmed/denied), compare predictions against actuals. Calculate accuracy, precision, recall, F1 over time.
- **Without ground truth** -- Monitor prediction distributions, confidence scores, and feature distributions. Statistical tests (KS test, PSI) detect when distributions shift significantly from the training baseline.

**Business metric monitoring** (is the model still valuable?):
- Conversion rates, revenue impact, user engagement
- These are the ultimate measure of model value

### Automated Retraining

When drift is detected, automated retraining pipelines can respond:

1. **Trigger** -- Drift detector or scheduled interval triggers retraining
2. **Data collection** -- Gather recent data with labels
3. **Training** -- Retrain model on updated data
4. **Evaluation** -- Compare new model against current production model on a holdout set
5. **Deployment** -- If the new model performs better, deploy via canary
6. **Notification** -- Alert the team of the retraining event and results

### Tools for ML Monitoring

- **Evidently AI** -- Open-source ML monitoring with drift detection and dashboards
- **Whylabs** -- ML monitoring platform with automated profiling
- **Prometheus + Grafana** -- General-purpose monitoring adapted for ML metrics
- **Amazon SageMaker Model Monitor** -- AWS-native model monitoring
- **Arize AI** -- ML observability platform with embedding drift detection`,
        },
        {
          id: 'advanced-ai-automation__m4__l2',
          title: 'CI/CD for Machine Learning',
          objectives: ['Design CI/CD pipelines for ML model development', 'Implement automated testing for ML code and models', 'Manage ML infrastructure as code'],
          estimatedMinutes: 25,
          keyTakeaways: ['ML CI/CD extends traditional CI/CD with data validation, model testing, and model registry integration', 'Automated tests should cover data quality, model performance, and integration', 'Infrastructure as Code ensures reproducible ML environments'],
          content: `## CI/CD for Machine Learning

Traditional CI/CD focuses on code testing and deployment. ML CI/CD adds layers for data validation, model testing, and model deployment -- creating a comprehensive automation pipeline.

### ML CI/CD Pipeline

**Continuous Integration (CI):**
1. **Code linting and formatting** -- flake8, black, isort for Python
2. **Unit tests** -- Test data preprocessing functions, feature engineering logic, API endpoints
3. **Data validation** -- Run data quality checks on new data
4. **Model training** -- Train model on a small dataset to verify the pipeline works
5. **Model evaluation** -- Run model against a benchmark test set, compare metrics against thresholds

**Continuous Delivery/Deployment (CD):**
1. **Model registration** -- Push passing models to the model registry
2. **Integration tests** -- Test the model in a staging environment with realistic traffic
3. **Performance tests** -- Verify latency and throughput meet requirements
4. **Deployment** -- Deploy to production using canary or blue-green strategy
5. **Post-deployment validation** -- Verify the deployed model produces expected outputs

### Testing ML Systems

**Unit tests:**
- Data preprocessing functions handle edge cases
- Feature engineering produces expected output shapes and types
- Model loading and prediction work correctly

**Integration tests:**
- End-to-end pipeline produces valid predictions
- API accepts expected input formats and returns correct output schemas
- Model interacts correctly with feature stores and databases

**Model quality tests:**
- Accuracy/F1/AUC exceeds minimum thresholds
- Performance is stable across data subgroups (fairness testing)
- No significant regression compared to the current production model
- Model behaves reasonably on known edge cases

**Data tests:**
- Schema validation (correct columns, types)
- Distribution checks (no unexpected shifts)
- Completeness checks (missing value thresholds)
- Freshness checks (data is recent enough)

### Infrastructure as Code for ML

Manage ML infrastructure reproducibly:

- **Terraform/Pulumi** -- Provision cloud resources (GPU instances, databases, storage)
- **Docker** -- Containerize training and serving environments
- **Kubernetes manifests/Helm charts** -- Define deployment configurations
- **DVC (Data Version Control)** -- Track datasets and model files alongside code in Git
- **MLflow Projects** -- Package ML code with its dependencies

### The MLOps Maturity Model

**Level 0: Manual** -- Data scientists manually train and deploy models. No automation, no monitoring.

**Level 1: ML Pipeline Automation** -- Automated training pipeline, experiment tracking, model registry. Manual deployment decisions.

**Level 2: CI/CD Pipeline Automation** -- Automated testing, deployment, and monitoring. Automated retraining triggered by drift detection. Full production-grade MLOps.

Most organizations are between Level 0 and Level 1. The goal is to progress toward Level 2 incrementally, automating the most impactful steps first.`,
        },
      ],
      quiz: [
        {
          id: 'advanced-ai-automation__m4__q1',
          question: 'What is concept drift?',
          options: ['When model code has bugs', 'When the relationship between inputs and outputs changes over time', 'When hardware performance degrades', 'When training takes too long'],
          correctIndex: 1,
          explanation: 'Concept drift occurs when the relationship between input features and target outcomes changes over time, meaning the patterns the model learned are no longer valid.',
        },
        {
          id: 'advanced-ai-automation__m4__q2',
          question: 'What additional testing does ML CI/CD require beyond traditional CI/CD?',
          options: ['Only faster build times', 'Data validation, model performance testing, and model registry integration', 'Only container scanning', 'Only security testing'],
          correctIndex: 1,
          explanation: 'ML CI/CD extends traditional CI/CD with data quality validation, model performance testing against benchmarks, and integration with model registries.',
        },
        {
          id: 'advanced-ai-automation__m4__q3',
          question: 'At MLOps Maturity Level 2, what triggers model retraining?',
          options: ['Manual decision by data scientists', 'Calendar schedule only', 'Automated drift detection', 'Customer complaints'],
          correctIndex: 2,
          explanation: 'At Level 2 maturity, automated monitoring detects data or concept drift and triggers retraining pipelines without manual intervention.',
        },
        {
          id: 'advanced-ai-automation__m4__q4',
          question: 'Which tool is used for versioning datasets alongside code in Git?',
          options: ['Docker', 'Terraform', 'DVC (Data Version Control)', 'Jenkins'],
          correctIndex: 2,
          explanation: 'DVC (Data Version Control) integrates with Git to track large datasets and model files, enabling reproducible ML experiments with versioned data.',
        },
        {
          id: 'advanced-ai-automation__m4__q5',
          question: 'Why should ML models be monitored for business metrics, not just accuracy?',
          options: ['Business metrics are easier to compute', 'A model can be technically accurate but fail to deliver business value', 'Business metrics don\'t change over time', 'Accuracy is not important'],
          correctIndex: 1,
          explanation: 'A model might maintain high accuracy while failing to improve the business metric it was designed to optimize. Business metrics (revenue, conversions, engagement) are the ultimate measure of model value.',
        },
      ],
    },
  ],
};
