# FreshRoute Agent  
## Product Requirements Document (PRD)

| Document field | Details |
|---|---|
| Product name | FreshRoute Agent |
| Product category | AI-powered agricultural market intelligence, produce-quality assessment, logistics coordination, and transaction-execution platform |
| Primary market | Pakistan, beginning with high-volume horticulture and perishable-produce corridors |
| Primary users | Farmers, produce traders, commission agents, collection-center operators, buyers, transporters, cold-storage providers, operations teams |
| Platforms | Mobile web, Android application, WhatsApp, admin web portal, partner portal, APIs |
| Initial language support | Urdu, Roman Urdu, English |
| Product stage | MVP → Pilot → Marketplace → Intelligence platform |
| Core value proposition | Help produce sellers decide the best market, timing, buyer, transport, and storage option—then execute and monitor the sale workflow |
| Product principle | “Do not just recommend. Analyze → compare → contact → book → monitor → alert.” |

***

# 1. Executive Summary

FreshRoute Agent is an AI-powered operating system for fresh-produce selling and post-harvest coordination. A farmer, trader, or collection-center worker can upload a produce photo, send a WhatsApp message, share a voice note, or use the application to describe an available lot.

For example:

> “I have 800 kg tomatoes in Multan. They will be ready tomorrow.”

FreshRoute Agent converts that unstructured message into a structured produce lot, analyzes visible quality, checks market price data, estimates spoilage risk, finds matching buyers and logistics providers, compares sell-now versus store-and-sell-later outcomes, and recommends an execution plan.

After user approval, the platform sends buyer inquiries, requests transporter quotations, reserves storage, tracks delivery, monitors changing prices and conditions, and alerts the user if a better option or an operational issue appears.

The product addresses a meaningful economic problem in Pakistan: post-harvest losses associated with weak storage, transport, cold-chain, and market-linkage systems are estimated in the billions of dollars annually. Some studies also estimate that 30–40% of fruit and vegetable output can be lost across the value chain. [brecorder](https://www.brecorder.com/news/40435653)

***

# 2. Problem Statement

## 2.1 Current User Problems

Farmers and produce traders frequently make selling decisions using incomplete, delayed, or informal information.

They often do not know:

- Which market currently offers the best realizable price.
- Whether the reported market price is actually achievable after commission, transport, loading, and wastage.
- Whether to sell immediately, wait, store, or move produce to another market.
- Whether their produce quality qualifies for a premium buyer.
- How much produce is likely to spoil during waiting, transport, or storage.
- Which transporter has a suitable available vehicle.
- Whether refrigerated transport or cold storage is required and affordable.
- What buyer documentation, grade standards, packaging, or delivery windows are required.
- How to coordinate farmers, traders, buyers, drivers, storage operators, and laborers over fragmented WhatsApp messages and phone calls.
- Whether a booked buyer or transporter has changed terms, delayed, cancelled, or failed to respond.

## 2.2 Current Workflow Problems

The current workflow is fragmented:

```text
Farmer harvests produce
        ↓
Calls local trader or mandi commission agent
        ↓
Gets informal verbal prices
        ↓
Searches manually for truck/loader/storage
        ↓
Negotiates repeatedly on phone or WhatsApp
        ↓
Moves produce with uncertain demand and pricing
        ↓
Faces spoilage, rejection, delays, or forced low-price sale
```

The result is usually one or more of the following:

- Lower realized price.
- Product spoilage.
- Buyer rejection because of grade mismatch.
- Higher transport cost.
- Delayed payment.
- Unused storage capacity.
- Wasted time in coordination.
- No reliable transaction record.
- No data trail to improve future decisions.

## 2.3 Opportunity

FreshRoute Agent creates value by turning disconnected agricultural decisions into a data-supported and operationally executable workflow.

The platform is not merely a crop-advisory chatbot. It acts as a controlled transaction agent that can:

1. Understand the produce lot.
2. Estimate quality and risk.
3. Find the economically best route.
4. Contact suitable counterparties.
5. Secure approvals.
6. Book logistics and storage.
7. Track the execution.
8. Alert users to changes or exceptions.

***

# 3. Product Vision

## 3.1 Vision Statement

> Enable every farmer and produce trader to sell perishable produce through an intelligent, trusted, and execution-capable digital agent.

## 3.2 Mission

Reduce post-harvest losses, improve realized selling prices, and make agricultural logistics and buyer access more transparent for Pakistan’s produce ecosystem.

## 3.3 Product Principles

- **Action over information:** Recommendations must lead directly to executable actions.
- **Human approval for commitments:** The system must never sell, book, or commit funds without explicit user authorization.
- **Explainable recommendations:** Users must see why one option is recommended over another.
- **Low-friction interaction:** The product must work for users who are comfortable with WhatsApp, voice notes, and photos rather than complex forms.
- **Local context first:** Support Urdu, Roman Urdu, mandi-specific practices, local units, crop grades, and regional logistics realities.
- **Trust and auditability:** Every offer, approval, booking, and status change must be recorded.
- **Graceful degradation:** When live data is unavailable, the product should clearly label estimates, cached data, or manually sourced information.

***

# 4. Product Goals

## 4.1 Primary Goals

- Improve the net realized revenue per produce lot.
- Reduce avoidable produce spoilage.
- Reduce time spent coordinating buyers, transporters, and storage providers.
- Increase access to reliable market and logistics information.
- Improve the fill rate of buyer demand and logistics capacity.
- Create a verified data network of produce lots, buyers, transporters, cold storages, and completed transactions.

## 4.2 Secondary Goals

- Help farmers meet buyer quality requirements.
- Improve utilization of cold storage and transport capacity.
- Generate regional price and supply intelligence.
- Build a trusted marketplace for agricultural trade and logistics.
- Create data infrastructure for future offerings such as financing, insurance, certification, and export facilitation.

## 4.3 Non-Goals for MVP

The initial MVP will not:

- Guarantee market prices.
- Guarantee produce quality, yield, or buyer acceptance.
- Replace physical inspection for premium/export-grade purchases.
- Provide lending or insurance underwriting.
- Process direct buyer-to-farmer payments as the primary transaction method.
- Conduct autonomous price negotiation without explicit user-defined rules.
- Provide legal certification itself.
- Serve every crop from day one.

***

# 5. Target Users and Personas

## 5.1 Farmer

### Profile

A small or medium farmer with 200 kg to 20,000 kg of produce, often selling through local traders, mandis, aggregators, or collection centers.

### Needs

- A simple way to learn where and when to sell.
- Better price visibility.
- Confidence that transport is available.
- Help understanding quality and buyer requirements.
- A workflow that works through WhatsApp and voice messages.

### Pain Points

- Limited access to multiple markets.
- Information asymmetry.
- Urgent need to sell perishable produce.
- Lack of cold storage.
- Dependence on local intermediaries.
- Limited comfort with complex digital applications.

***

## 5.2 Produce Trader / Wholesaler

### Profile

A trader handling frequent lots from farms and selling to mandis, retailers, restaurants, processors, and distributors.

### Needs

- Fast buyer matching.
- Lot-level profitability comparison.
- Centralized deal and logistics tracking.
- Better forecasting of supply, demand, and price movement.
- Ability to coordinate multiple workers.

### Pain Points

- High volume of calls and WhatsApp messages.
- Missed buyer inquiries.
- Weak traceability.
- Delayed transport confirmation.
- Difficulty tracking partial loads and delivery status.

***

## 5.3 Collection-Center Operator

### Profile

An organization collecting produce from multiple farms, grading, consolidating, and selling in bulk.

### Needs

- Lot intake and quality classification.
- Aggregation planning.
- Storage and dispatch coordination.
- Buyer demand matching.
- Staff workflow management.

### Pain Points

- Inconsistent quality records.
- Manual inventory tracking.
- Lack of buyer-side demand visibility.
- Difficulty forecasting packing and dispatch needs.

***

## 5.4 Buyer / Retailer / Processor

### Profile

A supermarket, restaurant group, wholesaler, food processor, exporter, or distributor buying defined quantities with quality and delivery requirements.

### Needs

- Reliable supply.
- Standardized quality information.
- Timely delivery.
- Transparent pricing.
- Supplier reliability.

### Pain Points

- Inconsistent quality.
- Last-minute shortages.
- Lack of traceability.
- Long supplier coordination cycles.
- Limited visibility into upcoming supply.

***

## 5.5 Transporter

### Profile

A truck owner, driver, logistics broker, refrigerated-vehicle operator, or small fleet manager.

### Needs

- More predictable load demand.
- Better route utilization.
- Fewer empty return trips.
- Digital proof of booking and completion.
- Clear pickup and delivery instructions.

***

## 5.6 Cold-Storage Provider

### Profile

A cold-room owner or warehouse operator with perishable storage capacity.

### Needs

- Increase capacity utilization.
- Receive structured booking requests.
- Know crop, quantity, temperature range, duration, and arrival time.
- Reduce phone-based booking confusion.

***

# 6. User Stories

## 6.1 Farmer User Stories

- As a farmer, I want to upload a photo of my tomatoes so the system can identify the crop and visible quality.
- As a farmer, I want to send a voice note in Urdu instead of completing a long form.
- As a farmer, I want to know whether I should sell today or store until tomorrow.
- As a farmer, I want to compare net earnings across different markets after transport and spoilage costs.
- As a farmer, I want the system to find an available transporter.
- As a farmer, I want to approve a buyer message before it is sent.
- As a farmer, I want immediate alerts if my buyer cancels or my vehicle is delayed.

## 6.2 Trader User Stories

- As a trader, I want to create multiple produce lots and see their recommended markets.
- As a trader, I want to compare transporters by price, availability, vehicle type, and reliability.
- As a trader, I want to message multiple buyers from one dashboard.
- As a trader, I want to see my expected margin before confirming a transaction.
- As a trader, I want to track all active lots, bookings, payments, and deliveries.

## 6.3 Buyer User Stories

- As a buyer, I want to define procurement requirements for crop, grade, quantity, location, and delivery window.
- As a buyer, I want to receive only relevant supply offers.
- As a buyer, I want photos, estimated grade, quantity, and expected arrival time before accepting an offer.
- As a buyer, I want to confirm, reject, or counteroffer through WhatsApp or the portal.

## 6.4 Transporter User Stories

- As a transporter, I want to receive load opportunities matching my vehicle and route.
- As a transporter, I want pickup and destination details before accepting a booking.
- As a transporter, I want to update arrival, pickup, in-transit, delay, and delivered status.
- As a transporter, I want digital proof of delivery.

***

# 7. Product Scope

## 7.1 MVP Crop Scope

The MVP should launch with a limited set of high-volume and highly perishable crops:

- Tomatoes.
- Potatoes.
- Onions.
- Mangoes.
- Kinnow.
- Bananas.
- Green chilies.
- Okra.
- Leafy vegetables.

Tomatoes should be the flagship crop because quality variability, short shelf life, price volatility, and frequent transport needs make the value proposition obvious.

## 7.2 MVP Geography

Recommended launch geography:

- Multan.
- Lahore.
- Faisalabad.
- Islamabad/Rawalpindi.
- Karachi.
- Surrounding farm-to-mandi corridors.

The first pilot should focus on one crop corridor, such as:

```text
Multan farms
     ↓
Multan mandi / collection center
     ↓
Lahore / Islamabad / Karachi buyers
```

## 7.3 Channel Scope

- Android application.
- Mobile web application.
- WhatsApp Business integration.
- Admin portal.
- Buyer portal.
- Transporter portal.
- Cold-storage partner portal.

***

# 8. Core Product Modules

| Module | Purpose |
|---|---|
| Produce Lot Intake | Capture crop, quantity, location, timing, images, quality, and seller intent |
| AI Vision Analysis | Identify crop and estimate visible quality indicators |
| Conversational Agent | Ask clarifying questions and guide user decisions |
| Market Intelligence | Retrieve market price, demand, historical trends, and buyer offers |
| Spoilage Risk Engine | Estimate likely loss from waiting, heat, handling, transport, and storage |
| Recommendation Engine | Compare sale, storage, transport, and buyer options |
| Buyer Marketplace | Match lots with qualified buyers |
| Logistics Marketplace | Match lots with transporters and storage providers |
| Workflow Orchestrator | Execute approved messages, bookings, reminders, and monitoring jobs |
| Notifications Engine | Send WhatsApp, SMS, push, and call-escalation alerts |
| Order Tracking | Track lot status from availability through payment and delivery |
| Admin and Operations Portal | Monitor users, quality, disputes, exceptions, and marketplace operations |
| Analytics and Reporting | Report prices, performance, spoilage, revenue, fill rates, and operational metrics |

***

# 9. End-to-End Application Workflow

## 9.1 Primary Workflow

```text
User submits photo / voice note / text
        ↓
FreshRoute ingests and validates the request
        ↓
AI extracts crop, quantity, location, readiness date, and visible quality
        ↓
Agent asks only required clarifying questions
        ↓
System creates a structured produce lot
        ↓
Market, buyer, transport, weather, and storage data are retrieved
        ↓
Spoilage and revenue scenarios are calculated
        ↓
Agent creates ranked action recommendations
        ↓
User selects an action or asks the agent to execute
        ↓
Agent drafts messages / booking requests
        ↓
User explicitly approves the outbound action
        ↓
System contacts buyers, transporters, and storage providers
        ↓
Responses are captured and ranked
        ↓
User approves final counterparty and commercial terms
        ↓
Booking and order records are created
        ↓
Agent monitors delivery, delays, buyer changes, and pricing changes
        ↓
User receives alerts and exception recommendations
        ↓
Delivery is confirmed and transaction is closed
        ↓
User is prompted for outcome feedback and quality verification
```

***

## 9.2 Example: Tomato Selling Flow

### Input

```text
User message:
“I have 800 kg tomatoes in Multan. They will be ready tomorrow.”

Attachments:
3 tomato photos
Optional voice note
```

### Step 1: Agent Extraction

The system extracts:

```json
{
  "crop": "tomato",
  "quantity_kg": 800,
  "location_city": "Multan",
  "harvest_ready_date": "2026-08-30",
  "seller_type": "farmer",
  "confidence": {
    "crop": 0.96,
    "quantity": 0.87,
    "location": 0.92,
    "harvest_date": 0.91
  }
}
```

### Step 2: Vision Analysis

The vision model analyzes uploaded photos for:

- Crop type.
- Ripeness stage.
- Visible bruising.
- Surface defects.
- Color consistency.
- Size variation.
- Packaging condition.
- Presence of mold or visible disease symptoms.
- Approximate grade confidence.

Gemini’s multimodal capabilities can perform image understanding, image classification, visual question answering, and object detection workflows, making it appropriate for initial produce-image interpretation. [business.whatsapp](https://business.whatsapp.com/products/business-platform)

Example result:

```json
{
  "crop_type": "tomato",
  "quality_grade_estimate": "B",
  "ripeness": "medium-high",
  "visible_defect_rate_estimate": 0.08,
  "packaging_condition": "unconfirmed",
  "confidence_score": 0.74,
  "human_review_required": false
}
```

### Step 3: Clarifying Questions

The agent should ask only questions that materially affect the recommendation.

Example WhatsApp exchange:

```text
FreshRoute:
I found tomatoes with medium-to-high ripeness. To recommend the best option, please confirm:

1. Are they packed in crates, sacks, or loose?
2. Do you have shade or cold storage available overnight?
3. Is 800 kg the final expected quantity?
4. Can the load leave Multan tomorrow morning?
```

### Step 4: Data Enrichment

The system retrieves:

- Mandi market prices.
- Buyer demand and open requests.
- Buyer grade requirements.
- Transporter capacity and quotes.
- Cold-storage availability and cost.
- Distance and travel time.
- Current and forecast weather.
- Historical price movement.
- Crop-specific spoilage coefficients.
- Seller reliability and previous transaction history.

### Step 5: Financial Scenario Comparison

The system produces scenarios.

| Scenario | Market / Buyer | Gross Revenue | Transport | Storage | Estimated Spoilage | Commission | Expected Net Revenue | Risk |
|---|---:|---:|---:|---:|---:|---:|---:|---|
| Sell today | Local Multan mandi | PKR X | PKR X | PKR 0 | 3% | PKR X | PKR X | Low |
| Sell tomorrow | Lahore wholesale buyer | PKR X | PKR X | PKR 0 | 8% | PKR X | PKR X | Medium |
| Store one day | Multan cold storage + buyer | PKR X | PKR X | PKR X | 4% | PKR X | PKR X | Medium |
| Premium buyer | Retail buyer in Lahore | PKR X | PKR X | PKR X | 6% | PKR X | PKR X | Medium-High |

### Step 6: Recommendation

Example response:

```text
Recommended action: Sell tomorrow morning to Buyer A in Lahore.

Why:
- Expected net revenue is estimated to be 13% higher than selling locally.
- The buyer accepts Grade B tomatoes.
- Refrigerated transport is not essential for the estimated 7-hour route, but crate packaging is strongly recommended.
- Storing for two days is not recommended because spoilage risk increases materially.
- Buyer A has an 82% historical acceptance rate and can take the full 800 kg lot.
```

### Step 7: Execution Approval

```text
FreshRoute:
Would you like me to:

1. Send an offer to Buyer A for 800 kg?
2. Request a quote from 3 transporters?
3. Reserve 1 day of cold storage as backup?

No message or booking will be sent without your approval.
```

### Step 8: User Approval

```text
User:
Yes, contact Buyer A and ask transporters.
```

### Step 9: Agent Action

The orchestration engine:

- Creates buyer inquiry tasks.
- Sends WhatsApp message templates.
- Requests transporter availability.
- Starts response timeout timers.
- Records all outbound communication.
- Updates the lot timeline.

### Step 10: Confirmation and Booking

Once buyer and transporter respond:

```text
FreshRoute:
Buyer A accepted 800 kg at PKR X/kg.
Transporter B can collect at 7:00 AM for PKR X.
Estimated arrival: 2:30 PM.

Expected net revenue: PKR X.

Approve this sale and transport booking?
```

The user approves. Only then does the platform create the confirmed order and booking.

### Step 11: Monitoring

The system monitors:

- Driver pickup status.
- Vehicle location if GPS is available.
- Temperature if cold-chain sensors are available.
- Buyer delivery window.
- Traffic and route disruption.
- Buyer cancellation signals.
- Market-price movement.
- Delay risk.
- Delivery confirmation.

### Step 12: Completion

The delivery is closed once:

- Buyer confirms receipt.
- Quantity is verified.
- Quality acceptance or rejection is recorded.
- Final sale price is recorded.
- Payment status is updated.
- User feedback is captured.

***

# 10. User Flow

## 10.1 Farmer App User Flow

```text
Open FreshRoute App / WhatsApp
        ↓
Tap “Sell Produce”
        ↓
Upload photo or record voice note
        ↓
Enter or dictate produce information
        ↓
AI extracts lot details
        ↓
Confirm details / answer clarifying questions
        ↓
View recommendation options
        ↓
Select “Sell Now,” “Store,” “Find Buyer,” or “Compare Markets”
        ↓
Review expected earnings and risk
        ↓
Approve buyer outreach / transport quote / storage booking
        ↓
Review responses
        ↓
Approve final transaction
        ↓
Track pickup and delivery
        ↓
Confirm outcome and payment
```

## 10.2 Buyer User Flow

```text
Buyer creates demand request
        ↓
Defines crop, quality, quantity, location, date, and price preference
        ↓
FreshRoute matches available produce lots
        ↓
Buyer receives supply offers
        ↓
Buyer reviews photos, AI-estimated quality, seller profile, delivery ETA, and price
        ↓
Buyer accepts, declines, or counteroffers
        ↓
FreshRoute coordinates transport and delivery
        ↓
Buyer confirms receipt and quality outcome
```

## 10.3 Transporter User Flow

```text
Transporter registers vehicle and service area
        ↓
Sets availability and price parameters
        ↓
Receives matching load requests
        ↓
Reviews pickup, destination, timing, load weight, and handling requirements
        ↓
Accepts or declines
        ↓
Updates vehicle status
        ↓
Uploads proof of pickup/delivery
        ↓
Receives performance rating and payment status
```

***

# 11. Agentic Workflow Design

## 11.1 Agent Responsibilities

The FreshRoute Agent must be able to:

- Interpret natural-language requests.
- Process images and optional video.
- Extract structured lot data.
- Identify missing critical data.
- Ask concise clarification questions.
- Call approved internal and external tools.
- Generate financially grounded recommendations.
- Explain tradeoffs.
- Request user approval before irreversible actions.
- Track long-running workflows.
- Detect exceptions.
- Re-plan when conditions change.
- Escalate to human operations when confidence or risk is low.

## 11.2 Agent State Machine

```text
DRAFT
        ↓
INTAKE_RECEIVED
        ↓
PENDING_CLARIFICATION
        ↓
READY_FOR_ANALYSIS
        ↓
ANALYZING
        ↓
OPTIONS_GENERATED
        ↓
AWAITING_USER_DECISION
        ↓
OUTREACH_PENDING_APPROVAL
        ↓
OUTREACH_IN_PROGRESS
        ↓
OFFERS_RECEIVED
        ↓
AWAITING_FINAL_APPROVAL
        ↓
BOOKED
        ↓
PICKUP_PENDING
        ↓
IN_TRANSIT
        ↓
DELIVERED
        ↓
PAYMENT_PENDING
        ↓
COMPLETED
```

Exception states:

```text
LOW_CONFIDENCE
BUYER_CANCELLED
TRANSPORT_DELAYED
STORAGE_UNAVAILABLE
QUALITY_DISPUTE
PAYMENT_DISPUTE
HUMAN_REVIEW_REQUIRED
CANCELLED
```

## 11.3 Agent Decision Framework

The agent should evaluate the following variables:

```text
Expected Net Revenue
=
(Expected Selling Price × Accepted Quantity)
− Transport Cost
− Storage Cost
− Commission
− Packaging Cost
− Estimated Spoilage Cost
− Delay Penalty
− Other Handling Costs
```

The agent should rank options using a weighted decision score:

```text
Recommendation Score
=
Revenue Weight
+ Buyer Reliability Weight
+ Logistics Reliability Weight
+ Quality Match Weight
− Spoilage Risk Weight
− Delay Risk Weight
− Payment Risk Weight
```

An example conceptual scoring function:

```text
Final Score =
0.40 × normalized_expected_net_revenue
+ 0.15 × buyer_reliability
+ 0.15 × logistics_reliability
+ 0.10 × quality_requirement_match
+ 0.10 × payment_terms_score
− 0.10 × spoilage_risk
```

Weights must be configurable by crop, user type, and user preferences.

For example, a small farmer may prioritize cash payment and low risk, while a large collection center may prioritize margin and delivery capacity.

***

# 12. Data Flow Architecture

## 12.1 High-Level Data Flow

```text
User App / WhatsApp / Web Portal
        ↓
API Gateway
        ↓
Authentication and User Context Layer
        ↓
Intake Service
        ↓
Media Processing Service
        ↓
AI Orchestration Layer
        ↓
Lot Management Service
        ↓
Data Enrichment Services
        ├── Market Price Service
        ├── Buyer Matching Service
        ├── Transport Matching Service
        ├── Cold Storage Matching Service
        ├── Weather Service
        ├── Mapping and Routing Service
        └── Risk and Forecasting Service
        ↓
Recommendation Engine
        ↓
Approval Service
        ↓
Workflow Orchestrator
        ↓
Messaging / Booking / Tracking Services
        ↓
Notification Service
        ↓
Operational Database + Analytics Warehouse
```

## 12.2 Produce Lot Data Flow

```text
Image / voice / text submitted
        ↓
Raw media stored in object storage
        ↓
Speech-to-text converts voice note to transcript
        ↓
Vision model analyzes produce photo
        ↓
LLM extracts structured entities
        ↓
Lot record is created
        ↓
Validation engine checks required fields
        ↓
Clarification questions are generated if fields are missing
        ↓
User confirms lot details
        ↓
Lot becomes eligible for pricing, matching, and recommendation
```

## 12.3 Market Data Flow

```text
Market data source
        ↓
Data ingestion service
        ↓
Validation and normalization
        ↓
Price database
        ↓
Historical time-series warehouse
        ↓
Forecasting model
        ↓
Market price API
        ↓
Recommendation engine
```

Market inputs may include:

- Official mandi price data where available.
- Partner uploads.
- Buyer offers.
- Trader-submitted transactions.
- Manual field-agent data.
- Historical FreshRoute completed sales.
- Public and private market data feeds.

Every price should carry:

```json
{
  "crop": "tomato",
  "grade": "B",
  "market": "Multan",
  "price_per_kg": 0,
  "currency": "PKR",
  "source": "market_feed",
  "observed_at": "timestamp",
  "confidence": 0.82,
  "data_freshness_minutes": 45
}
```

## 12.4 Recommendation Data Flow

```text
Structured lot
        +
Market price data
        +
Buyer demand
        +
Transport availability
        +
Storage availability
        +
Weather and temperature data
        +
Historical spoilage data
        +
Route time and cost
        ↓
Scenario engine
        ↓
Expected net revenue calculation
        ↓
Spoilage-risk prediction
        ↓
Counterparty ranking
        ↓
Recommendation generator
        ↓
User-facing action plan
```

## 12.5 Post-Booking Data Flow

```text
Confirmed order
        ↓
Booking service
        ↓
Transporter / storage provider notification
        ↓
Pickup event
        ↓
GPS / driver status / manual updates
        ↓
Exception detection
        ↓
User alert
        ↓
Delivery proof
        ↓
Buyer acceptance / rejection
        ↓
Payment status
        ↓
Final transaction outcome
        ↓
Training and analytics pipeline
```

***

# 13. Technical Architecture

## 13.1 Architecture Principles

- API-first.
- Event-driven for long-running workflows.
- Mobile-first and WhatsApp-native.
- Modular services with clear ownership.
- Secure-by-default handling of user and transaction data.
- Human-in-the-loop for high-impact actions.
- Observability across all AI and transactional workflows.
- Support for offline and low-bandwidth conditions.

## 13.2 Recommended Technology Stack

| Layer | Recommended Technology |
|---|---|
| Mobile application | React Native or Flutter |
| Web application | Next.js / React |
| Backend APIs | Python FastAPI and/or Node.js with NestJS |
| AI orchestration | Python, LangGraph, Temporal workflows, custom tool orchestration |
| Vision and LLM | Google Gemini API for multimodal reasoning and image understanding |
| Speech-to-text | Google Speech-to-Text, Whisper, or Gemini audio capabilities where appropriate |
| Database | PostgreSQL |
| Geospatial queries | PostGIS |
| Cache and session store | Redis |
| Object storage | Google Cloud Storage, AWS S3, or Cloudflare R2 |
| Vector search | pgvector, Pinecone, or Weaviate |
| Event streaming | Kafka, Google Pub/Sub, AWS SNS/SQS, or RabbitMQ |
| Workflow engine | Temporal |
| Search | Elasticsearch / OpenSearch |
| Analytics warehouse | BigQuery, ClickHouse, Snowflake, or PostgreSQL initially |
| Data transformation | dbt |
| Model training | Python, scikit-learn, XGBoost, PyTorch |
| MLOps | MLflow, Vertex AI, or SageMaker |
| Maps and routing | Google Maps Platform, Mapbox, or local logistics routing provider |
| Messaging | WhatsApp Business Platform, SMS gateway, push notifications |
| Authentication | Auth0, Firebase Auth, Clerk, or custom JWT/OAuth solution |
| Cloud infrastructure | Google Cloud Platform, AWS, or Azure |
| Containerization | Docker |
| Orchestration | Kubernetes, Cloud Run, ECS, or managed container service |
| Monitoring | Datadog, Grafana, Prometheus, Sentry, OpenTelemetry |
| CI/CD | GitHub Actions, GitLab CI, or CircleCI |

WhatsApp Business Platform is suitable for sending and receiving user messages programmatically and for operating business messaging at scale. [brecorder](https://www.brecorder.com/news/40436339)

***

# 14. Backend Services

## 14.1 API Gateway

Responsibilities:

- Request routing.
- Authentication.
- API rate limits.
- Request logging.
- API version management.
- Security headers.
- Webhook validation.

## 14.2 Authentication Service

Responsibilities:

- Phone-number login.
- WhatsApp identity linking.
- OTP verification.
- Role-based access control.
- Session management.
- Consent management.
- Device registration.

Roles:

- Farmer.
- Trader.
- Buyer.
- Collection-center operator.
- Transporter.
- Storage provider.
- Field agent.
- Operations admin.
- Super admin.

## 14.3 Lot Management Service

Responsibilities:

- Create, update, and archive produce lots.
- Maintain lot state.
- Store quality assessment.
- Track ownership.
- Manage documents and images.
- Record inventory quantity changes.
- Link lots to buyer offers and orders.

## 14.4 AI Orchestration Service

Responsibilities:

- Receive user intent.
- Invoke speech, vision, LLM, forecast, and ranking models.
- Build structured prompts.
- Call internal tools.
- Track tool outputs.
- Generate explanations.
- Enforce user approval gates.
- Route low-confidence cases to human review.

## 14.5 Market Intelligence Service

Responsibilities:

- Ingest price feeds.
- Normalize crop names and grades.
- Maintain historical price time series.
- Calculate market trends.
- Produce price confidence scores.
- Serve market comparisons.

## 14.6 Spoilage Risk Service

Responsibilities:

- Estimate probability of spoilage.
- Calculate expected quantity loss.
- Explain top risk factors.
- Update risk as weather and timing change.
- Apply crop-specific deterioration models.

## 14.7 Matching Service

Responsibilities:

- Find buyers matching crop, grade, quantity, delivery window, and destination.
- Find transporters matching capacity, route, availability, vehicle type, and temperature needs.
- Find storage providers matching capacity, crop, temperature, and time duration.
- Rank counterparties by suitability and reliability.

## 14.8 Booking Service

Responsibilities:

- Create booking requests.
- Manage booking statuses.
- Prevent double booking.
- Store terms and conditions.
- Handle cancellations.
- Generate booking references.

## 14.9 Notification Service

Responsibilities:

- WhatsApp notifications.
- SMS fallback.
- Push notifications.
- Email for enterprise users.
- Voice-call escalation for severe exceptions.
- Template management.
- Delivery status tracking.

## 14.10 Order Tracking Service

Responsibilities:

- Pickup status.
- Loading status.
- In-transit status.
- Delay status.
- Delivery status.
- Quantity received.
- Quality acceptance.
- Payment status.
- Dispute status.

***

# 15. AI System Design

## 15.1 AI Components

| AI Component | Purpose |
|---|---|
| Multimodal Vision Model | Crop recognition, visible quality analysis, defect detection, packaging assessment |
| Conversational LLM | Natural-language understanding, question generation, explanation, multilingual interaction |
| Entity Extraction Model | Convert unstructured text and voice into structured lot data |
| Spoilage Prediction Model | Predict expected quality loss and quantity loss |
| Price Forecasting Model | Estimate near-term price movement by market and crop |
| Buyer Ranking Model | Rank buyer opportunities by net revenue and likelihood of completion |
| Logistics Ranking Model | Rank transport and storage options by cost, feasibility, and reliability |
| Anomaly Detection Model | Detect suspicious prices, abnormal route delays, and unusual quality claims |
| Retrieval System | Retrieve buyer requirements, SOPs, market data, policies, and previous transaction context |

## 15.2 Vision Model Requirements

The vision model should identify:

- Crop category.
- Approximate maturity/ripeness.
- Surface defects.
- Color distribution.
- Bruising.
- Mold or decay indicators.
- Size consistency.
- Packaging quality.
- Crate versus sack versus loose produce.
- Image quality and whether another image is required.

The model must not claim laboratory-grade quality certification. It should communicate:

```text
“This is a visual estimate from the uploaded images. Final buyer acceptance may vary after physical inspection.”
```

## 15.3 LLM Agent Requirements

The agent must:

- Understand Urdu, Roman Urdu, and English.
- Handle short informal messages.
- Avoid requesting unnecessary information.
- Use structured tool calls instead of inventing market data.
- Distinguish between facts, predictions, and assumptions.
- Explain uncertainty.
- Ask approval before messaging or booking.
- Preserve context within an active produce lot.
- Never falsely state that a booking or sale is confirmed.
- Provide actionable next steps.

## 15.4 Retrieval-Augmented Generation

The agent should use RAG for:

- Crop-specific storage recommendations.
- Buyer requirement documents.
- Grade definitions.
- Packaging instructions.
- Partner policies.
- Transport and storage SOPs.
- Frequently asked user questions.
- Marketplace rules.
- Government and certification documentation guidance.

The retrieval system should never be used as the sole source of time-sensitive market prices. Prices must come from the market intelligence service with timestamp and freshness metadata.

***

# 16. AI Model Training Strategy

## 16.1 Initial Approach

The first version should use foundation models and rules rather than attempting to train every model from zero.

Recommended initial approach:

- Use Gemini for image understanding and multilingual conversational interaction.
- Use structured prompting and function calling for lot extraction.
- Use rule-based spoilage models initially.
- Train simple tabular machine-learning models as transaction data accumulates.
- Add human review for low-confidence visual assessments and high-value lots.

Gemini supports multimodal input, including image understanding tasks such as classification, visual question answering, and object detection. [business.whatsapp](https://business.whatsapp.com/products/business-platform)

## 16.2 Training Data Requirements

### Produce Image Dataset

For every image, collect:

```text
Crop type
Variety
Location
Harvest date
Image timestamp
Lighting condition
Packaging type
Visible defects
Actual grade
Buyer acceptance result
Spoilage outcome
Final sale price
```

### Transaction Dataset

For every completed lot, collect:

```text
Lot ID
Crop
Variety
Quantity
Grade
Origin
Destination
Harvest date
Packing type
Storage duration
Transport type
Route duration
Temperature exposure
Market price at decision time
Final selling price
Buyer type
Buyer acceptance
Rejected quantity
Spoilage quantity
Payment duration
Transaction completion status
```

### Logistics Dataset

For every transport booking, collect:

```text
Vehicle type
Refrigerated/non-refrigerated
Capacity
Pickup time
Actual pickup time
Expected delivery time
Actual delivery time
Route
Distance
Delay reasons
Temperature data if available
Driver reliability
Vehicle reliability
Delivery proof
```

## 16.3 Model Training Phases

### Phase 1: Foundation and Rules

- Gemini vision for image understanding.
- LLM extraction and conversational workflows.
- Crop-specific rule tables for estimated spoilage.
- Rule-based buyer and transporter matching.
- Manual market data upload.
- Human operations review.

### Phase 2: Supervised Models

Train models for:

- Crop quality grade prediction.
- Spoilage probability.
- Expected rejection probability.
- Buyer acceptance likelihood.
- Transporter reliability.
- Price movement prediction.

### Phase 3: Optimization Models

Build models for:

- Net-revenue optimization.
- Dynamic market routing.
- Storage duration optimization.
- Buyer-offer ranking.
- Supply-demand forecasting.
- Route and load consolidation.

### Phase 4: Continuous Learning

- Feed delivery outcome data back into models.
- Compare predicted versus actual spoilage.
- Compare recommended versus actual net revenue.
- Retrain seasonally and by region.
- Maintain separate crop and geography performance reports.

## 16.4 Human-in-the-Loop Process

Human review is mandatory when:

- Vision confidence is below a configurable threshold.
- Lot value exceeds a configured threshold.
- Buyer requirements are strict or export-related.
- User disputes the recommendation.
- Price data is stale or conflicting.
- The system detects possible fraud.
- There is a large quality mismatch between photo estimate and buyer feedback.

***

# 17. Spoilage Prediction Engine

## 17.1 Purpose

Estimate the chance and expected amount of produce spoilage under different sale, storage, and transport scenarios.

## 17.2 Input Variables

- Crop type.
- Variety.
- Harvest date and time.
- Ripeness.
- Visible quality.
- Packaging type.
- Current temperature.
- Forecast temperature.
- Humidity where available.
- Storage availability.
- Storage temperature.
- Transport type.
- Transport duration.
- Route delays.
- Handling quality.
- Distance.
- Buyer delivery time.
- Historical spoilage data.

## 17.3 Output

```json
{
  "spoilage_risk_score": 0.38,
  "estimated_loss_percentage": 0.07,
  "estimated_loss_kg": 56,
  "confidence": 0.72,
  "risk_drivers": [
    "Medium-high ripeness",
    "Expected daytime temperature above recommended range",
    "Non-refrigerated transport",
    "8-hour expected wait before delivery"
  ],
  "recommended_mitigation": [
    "Use ventilated crates",
    "Dispatch before 8 AM",
    "Avoid storing longer than 24 hours",
    "Keep produce shaded before pickup"
  ]
}
```

## 17.4 Initial Rules

The MVP can use crop-specific rules such as:

```text
If tomato ripeness is high
and ambient temperature is high
and storage is unavailable
and expected delivery is delayed,
then increase spoilage risk.

If produce is in sacks rather than ventilated crates,
then increase bruising and heat-retention risk.

If a cold-storage facility is available
and expected market-price increase exceeds storage cost plus expected loss,
then compare storage as a viable option.
```

These rules should be validated with agricultural experts before deployment.

***

# 18. Revenue Comparison Engine

## 18.1 Required Calculations

For each option, calculate:

- Gross sale value.
- Expected accepted quantity.
- Expected rejected quantity.
- Estimated spoilage quantity.
- Transport cost.
- Storage cost.
- Packaging cost.
- Labor/loading cost.
- Market commission.
- Platform fee.
- Payment delay risk.
- Expected net revenue.
- Confidence score.

## 18.2 Example Formula

\[
\text{Expected Net Revenue} =
(\text{Buyer Price} \times \text{Expected Accepted Quantity})
- \text{Transport Cost}
- \text{Storage Cost}
- \text{Commission}
- \text{Packaging Cost}
- \text{Handling Cost}
- \text{Platform Fee}
\]

Where:

\[
\text{Expected Accepted Quantity} =
\text{Original Quantity}
\times
(1 - \text{Estimated Spoilage Rate} - \text{Estimated Rejection Rate})
\]

## 18.3 Recommendation Display

The user should see simple language:

```text
Option A: Sell locally today
Expected net earnings: PKR 78,000
Risk: Low
Payment: Same day

Option B: Send to Lahore tomorrow
Expected net earnings: PKR 88,500
Risk: Medium
Payment: 2–3 days
Why: Higher price, but additional transport and spoilage risk

Recommended: Option B
Estimated benefit over local sale: PKR 10,500
```

***

# 19. Marketplace Design

## 19.1 Buyer Marketplace

Buyer profiles must include:

- Buyer name.
- Buyer category.
- Location.
- Crops purchased.
- Grade preferences.
- Minimum and maximum quantity.
- Delivery windows.
- Payment terms.
- Historical acceptance rate.
- Response rate.
- Cancellation rate.
- Ratings.
- Verification status.
- Documents required.

## 19.2 Transport Marketplace

Transporter profiles must include:

- Vehicle type.
- Capacity.
- Refrigerated/non-refrigerated.
- Covered/open vehicle.
- Service regions.
- Route preferences.
- Current location.
- Availability window.
- Quote method.
- Rating.
- On-time percentage.
- Cancellation rate.
- GPS capability.
- Insurance and verification documents.

## 19.3 Storage Marketplace

Storage profiles must include:

- Facility location.
- Total capacity.
- Available capacity.
- Temperature ranges.
- Supported crops.
- Daily cost.
- Handling fees.
- Minimum booking duration.
- Operating hours.
- Loading/unloading support.
- Verification status.
- Ratings.
- Crop-specific restrictions.

***

# 20. Functional Requirements

## 20.1 Authentication and Onboarding

| Requirement ID | Requirement |
|---|---|
| FR-001 | Users must be able to register using a Pakistani mobile number |
| FR-002 | Users must be able to authenticate through OTP |
| FR-003 | Users must select a role during onboarding |
| FR-004 | Users must be able to switch or add business roles where authorized |
| FR-005 | The system must collect consent for data processing and messaging |
| FR-006 | Partners must complete verification before receiving marketplace priority |

## 20.2 Produce Lot Creation

| Requirement ID | Requirement |
|---|---|
| FR-010 | Users must create a produce lot through photo, text, voice, or structured form input |
| FR-011 | The system must support quantity in kg, maund, crate, bag, and ton |
| FR-012 | The system must normalize quantities into kilograms internally |
| FR-013 | Users must specify or confirm origin location |
| FR-014 | Users must specify harvest readiness time |
| FR-015 | The system must allow multiple photos per lot |
| FR-016 | Users must be able to edit lot details before sending buyer inquiries |
| FR-017 | The system must maintain a complete audit trail of changes |

## 20.3 AI Analysis

| Requirement ID | Requirement |
|---|---|
| FR-020 | The system must identify likely crop type from photos |
| FR-021 | The system must estimate visible quality indicators |
| FR-022 | The system must display confidence levels for AI output |
| FR-023 | The system must allow users to override AI-estimated crop or grade |
| FR-024 | The agent must ask for clarification when critical information is missing |
| FR-025 | The system must flag low-confidence assessments for review |

## 20.4 Market Intelligence

| Requirement ID | Requirement |
|---|---|
| FR-030 | The system must display prices by market, crop, grade, and timestamp |
| FR-031 | The system must distinguish live, delayed, estimated, and user-submitted prices |
| FR-032 | The system must show price trends where historical data exists |
| FR-033 | The system must calculate net revenue rather than only headline price |
| FR-034 | The system must support uploaded/simulated market datasets during MVP |

## 20.5 Buyer Matching

| Requirement ID | Requirement |
|---|---|
| FR-040 | The system must match lots to eligible buyers |
| FR-041 | Matching must account for crop, grade, quantity, location, timing, and buyer requirements |
| FR-042 | The system must display buyer reliability metrics |
| FR-043 | The system must allow users to select one or multiple buyers for outreach |
| FR-044 | The system must prevent buyer identity disclosure before required verification where marketplace policy requires it |

## 20.6 Transport and Storage

| Requirement ID | Requirement |
|---|---|
| FR-050 | The system must find transporters matching load capacity and route |
| FR-051 | The system must distinguish refrigerated and non-refrigerated options |
| FR-052 | The system must calculate transport cost in the net-revenue scenario |
| FR-053 | The system must search available storage capacity |
| FR-054 | The system must display storage price, duration, temperature range, and location |
| FR-055 | The system must support booking requests only after approval |

## 20.7 Messaging and Approval

| Requirement ID | Requirement |
|---|---|
| FR-060 | The system must draft buyer and provider messages |
| FR-061 | The user must explicitly approve outbound commercial messages |
| FR-062 | The system must preserve the exact approved message content |
| FR-063 | The system must track message delivery and response status |
| FR-064 | The system must support WhatsApp, SMS, push, and email channels |
| FR-065 | The system must use approved messaging templates where required |

## 20.8 Order Management

| Requirement ID | Requirement |
|---|---|
| FR-070 | The system must create an order after buyer and seller confirmation |
| FR-071 | The system must support partial quantity acceptance |
| FR-072 | The system must support cancellation and reason capture |
| FR-073 | The system must track pickup, transit, delivery, and payment states |
| FR-074 | The system must store proof-of-delivery images and documents |
| FR-075 | The system must allow disputes to be opened and reviewed |

## 20.9 Notifications

| Requirement ID | Requirement |
|---|---|
| FR-080 | The system must notify users of buyer responses |
| FR-081 | The system must notify users of transporter acceptance or decline |
| FR-082 | The system must alert users about delivery delays |
| FR-083 | The system must alert users when price movement changes recommendation materially |
| FR-084 | The system must support reminder escalation for unresponsive counterparties |
| FR-085 | Users must be able to configure notification preferences |

***

# 21. Non-Functional Requirements

## 21.1 Performance

| Requirement | Target |
|---|---|
| Basic lot intake response | Under 3 seconds excluding media upload |
| Image analysis initial response | Under 30 seconds under normal load |
| Recommendation generation | Under 90 seconds for standard scenarios |
| Buyer/transport matching | Under 15 seconds |
| Notification dispatch | Under 10 seconds after event creation |
| App first meaningful load | Under 4 seconds on moderate mobile network |
| API p95 latency | Under 500 ms for standard read endpoints |

## 21.2 Availability

| System | Target Availability |
|---|---|
| Authentication | 99.9% |
| Lot intake | 99.5% |
| Messaging queue | 99.5% |
| Recommendation service | 99.0% |
| Admin portal | 99.0% |
| Analytics dashboards | 98.5% |

## 21.3 Scalability

The system must support:

- At least 10,000 monthly active users in pilot-ready architecture.
- At least 100,000 produce lots per month in scale-ready architecture.
- Seasonal traffic surges.
- Asynchronous processing for image analysis and bookings.
- Horizontal scaling of stateless API services.
- Queue-based handling of long-running tasks.

## 21.4 Security

- Encrypt data in transit using TLS.
- Encrypt sensitive data at rest.
- Use secure OTP authentication.
- Store secrets in a managed secret vault.
- Apply least-privilege access control.
- Log administrative actions.
- Sign and validate webhooks.
- Rate-limit public APIs.
- Protect against injection, SSRF, IDOR, and common OWASP risks.
- Conduct periodic security reviews and penetration testing.

## 21.5 Privacy

- Collect only necessary user and transaction data.
- Obtain consent for communication and location data.
- Allow users to request deletion where legally and operationally appropriate.
- Limit exact farm-location visibility according to marketplace policy.
- Redact personal information from model-training datasets where feasible.
- Keep separate permissions for user-facing and internal operational data.

## 21.6 Accessibility and Usability

- Support Urdu and Roman Urdu.
- Provide voice-first intake.
- Use large buttons and simple language.
- Support low-bandwidth image compression.
- Provide offline draft creation.
- Minimize typing requirements.
- Use clear explanations instead of technical AI terminology.

***

# 22. Database Design

## 22.1 Core Entities

```text
User
Organization
Farm
ProduceLot
LotMedia
QualityAssessment
MarketPrice
BuyerRequirement
BuyerOffer
Transporter
Vehicle
TransportQuote
StorageFacility
StorageQuote
Booking
Order
Shipment
DeliveryProof
PaymentRecord
Dispute
Notification
AgentConversation
AgentAction
ApprovalRecord
AuditLog
```

## 22.2 Example Produce Lot Schema

```sql
CREATE TABLE produce_lots (
    id UUID PRIMARY KEY,
    seller_id UUID NOT NULL,
    organization_id UUID,
    crop_type VARCHAR(100) NOT NULL,
    crop_variety VARCHAR(100),
    quantity_kg DECIMAL(12,2) NOT NULL,
    estimated_grade VARCHAR(50),
    seller_confirmed_grade VARCHAR(50),
    origin_latitude DECIMAL(10,7),
    origin_longitude DECIMAL(10,7),
    origin_city VARCHAR(100),
    harvest_ready_at TIMESTAMP,
    storage_available BOOLEAN DEFAULT FALSE,
    packaging_type VARCHAR(100),
    lot_status VARCHAR(50) NOT NULL,
    ai_confidence_score DECIMAL(5,4),
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL
);
```

## 22.3 Example Order Schema

```sql
CREATE TABLE orders (
    id UUID PRIMARY KEY,
    produce_lot_id UUID NOT NULL,
    seller_id UUID NOT NULL,
    buyer_id UUID NOT NULL,
    agreed_quantity_kg DECIMAL(12,2) NOT NULL,
    agreed_price_per_kg DECIMAL(12,2) NOT NULL,
    estimated_total_value DECIMAL(14,2),
    final_total_value DECIMAL(14,2),
    currency VARCHAR(10) DEFAULT 'PKR',
    order_status VARCHAR(50) NOT NULL,
    payment_status VARCHAR(50) NOT NULL,
    pickup_at TIMESTAMP,
    delivered_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL
);
```

## 22.4 Audit Log Requirements

Every significant event must be logged:

```text
Who performed the action
What action was performed
When it happened
What object was affected
Previous value
New value
Whether the action was AI-generated
Whether user approval was obtained
Associated transaction ID
```

***

# 23. API Design

## 23.1 Core API Endpoints

### Lot Management

```http
POST /v1/lots
GET /v1/lots/{lot_id}
PATCH /v1/lots/{lot_id}
POST /v1/lots/{lot_id}/media
POST /v1/lots/{lot_id}/analyze
GET /v1/lots/{lot_id}/recommendations
```

### Buyer Matching

```http
GET /v1/lots/{lot_id}/buyer-matches
POST /v1/lots/{lot_id}/buyer-outreach/draft
POST /v1/lots/{lot_id}/buyer-outreach/approve
GET /v1/lots/{lot_id}/offers
```

### Logistics

```http
GET /v1/lots/{lot_id}/transport-matches
GET /v1/lots/{lot_id}/storage-matches
POST /v1/transport-bookings/draft
POST /v1/transport-bookings/approve
POST /v1/storage-bookings/draft
POST /v1/storage-bookings/approve
```

### Orders

```http
POST /v1/orders
GET /v1/orders/{order_id}
PATCH /v1/orders/{order_id}/status
POST /v1/orders/{order_id}/delivery-proof
POST /v1/orders/{order_id}/disputes
```

### Agent

```http
POST /v1/agent/messages
GET /v1/agent/conversations/{conversation_id}
POST /v1/agent/actions/{action_id}/approve
POST /v1/agent/actions/{action_id}/reject
```

***

# 24. WhatsApp Integration

## 24.1 WhatsApp Use Cases

- Receive farmer text, image, video, and voice-note inputs.
- Ask clarification questions.
- Send recommendations.
- Send approval prompts.
- Send buyer inquiries.
- Send transporter and storage booking requests.
- Send pickup and delivery notifications.
- Handle buyer confirmations and counteroffers.
- Escalate exceptions.

WhatsApp Business Platform is designed for programmatic business messaging and can support the communication layer required for this workflow. [brecorder](https://www.brecorder.com/news/40436339)

## 24.2 Example WhatsApp Conversation

```text
Farmer:
I have 800 kg tomatoes in Multan. Ready tomorrow.

FreshRoute:
Please send 2–3 photos of the tomatoes. Also tell me:
1. Are they in crates or sacks?
2. Can they leave before 9 AM tomorrow?
3. Do you have storage available tonight?

Farmer:
[Uploads photos]
They are in crates. No storage. Can leave 7 AM.

FreshRoute:
I found 3 selling options. The best expected return is a buyer in Lahore.

Expected net earnings: PKR 88,500
Estimated spoilage risk: 7%
Transport cost: PKR 9,000
Buyer reliability: High

Would you like me to contact this buyer and request transport quotes?

[Yes, contact] [Show other options]
```

## 24.3 Approval Requirement

Outbound actions with commercial consequences must require explicit approval:

- Buyer offer.
- Counteroffer.
- Transport booking.
- Storage booking.
- Cancellation.
- Price acceptance.
- Contract/document submission.
- Payment request.

***

# 25. Admin Portal Requirements

## 25.1 Admin Dashboard

The admin dashboard must show:

- Active produce lots.
- Lots requiring human review.
- Pending buyer offers.
- Pending transporter requests.
- Delayed shipments.
- Buyer and transporter cancellation rates.
- Market-data freshness.
- System health.
- Revenue metrics.
- Top crops and regions.
- Disputes and escalations.

## 25.2 Operations Workflow

```text
New low-confidence lot
        ↓
Operations queue
        ↓
Human reviewer verifies crop / quality / details
        ↓
Reviewer corrects data or contacts user
        ↓
Lot returns to recommendation flow
```

## 25.3 Partner Verification

Admin users must be able to verify:

- Buyer business identity.
- Transporter identity and vehicle documents.
- Cold-storage facility documents.
- Bank/payment details where applicable.
- Trade history.
- Operational location.

***

# 26. Trust, Safety, and Fraud Prevention

## 26.1 Fraud Risks

- Fake produce listings.
- Fake buyer offers.
- Fake transporter availability.
- Price manipulation.
- Quantity fraud.
- Payment fraud.
- Delivery proof fraud.
- Fake storage capacity.
- Misrepresentation of crop quality.

## 26.2 Mitigation Measures

- Phone and identity verification.
- Partner verification badges.
- Document verification.
- Transaction history.
- Ratings and reliability scores.
- GPS and timestamp validation where possible.
- Image metadata analysis where legally appropriate.
- Proof-of-delivery workflows.
- Escrow or payment-partner integration in future versions.
- Risk scoring for abnormal behavior.
- Human review for high-value transactions.

***

# 27. Metrics and KPIs

## 27.1 North Star Metric

**Incremental net value realized per completed produce lot through FreshRoute.**

## 27.2 User Metrics

- Monthly active farmers.
- Monthly active traders.
- Produce lots created.
- Repeat lot creation rate.
- Recommendation acceptance rate.
- Buyer outreach approval rate.
- Booking completion rate.
- User retention by crop season.
- WhatsApp-to-app conversion rate.

## 27.3 Economic Metrics

- Gross merchandise value.
- Platform revenue.
- Average transaction value.
- Average commission per transaction.
- Net revenue uplift compared with local-market baseline.
- Estimated spoilage avoided.
- Cold-storage utilization.
- Transport fill rate.
- Buyer fill rate.

## 27.4 Operational Metrics

- Time from lot creation to recommendation.
- Time from recommendation to buyer response.
- Time from buyer confirmation to pickup.
- Delivery success rate.
- On-time delivery rate.
- Buyer cancellation rate.
- Transporter cancellation rate.
- Dispute rate.
- Human-review rate.

## 27.5 AI Metrics

- Crop-recognition accuracy.
- Quality-estimation agreement with human graders.
- Spoilage-prediction calibration.
- Price-forecast error.
- Recommendation acceptance rate.
- Recommendation-to-success conversion rate.
- Hallucination rate.
- Tool-call success rate.
- Low-confidence escalation rate.

***

# 28. Business Model

## 28.1 Revenue Streams

| Revenue Stream | Description |
|---|---|
| Transaction commission | Percentage fee on completed produce transactions |
| Transport booking fee | Commission on successful transporter bookings |
| Storage booking fee | Commission on successful cold-storage bookings |
| SaaS subscriptions | Monthly plans for traders, buyers, collection centers, and enterprises |
| Premium analytics | Market intelligence, price forecasting, supply visibility, and operational dashboards |
| Enterprise API | APIs for banks, insurers, agri-input firms, cooperatives, and procurement companies |
| Verification services | Paid verification or premium profile for buyers, transporters, and storage providers |
| Finance referral | Referral fee for working-capital, invoice-finance, or insurance partners |
| Featured buyer demand | Paid promotion for verified buyer demand requests |

## 28.2 Suggested Pricing Model

### Farmers

- Free basic market and advisory access.
- Low commission only on successfully completed agent-assisted transactions.
- Optional premium services for priority matching or on-call operations support.

### Traders and Collection Centers

- Monthly subscription.
- Per-transaction commission.
- Team dashboard and multi-user access.
- Premium analytics package.

### Buyers

- Free initial onboarding.
- Subscription for procurement dashboard.
- Buyer posting fee or successful sourcing fee.
- Premium supplier intelligence.

### Transporters and Storage Providers

- Free basic listing.
- Commission per completed booking.
- Premium ranking/visibility package.
- Fleet and capacity management subscription.

## 28.3 Illustrative Unit Economics

```text
Average produce transaction value: PKR 150,000
Platform transaction commission: 1.5%
Revenue per transaction: PKR 2,250

Transport booking value: PKR 15,000
Transport commission: 5%
Revenue per transport booking: PKR 750

Total potential revenue for one completed transaction:
PKR 3,000+ before subscription and analytics revenue
```

The commission should be justified by measurable user value, such as higher realized price, lower spoilage, lower coordination time, or more reliable buyer access.

***

# 29. Go-To-Market Strategy

## 29.1 Launch Strategy

Start with a narrow, controlled marketplace:

- One crop cluster.
- One or two farm-to-market corridors.
- Verified buyers.
- Verified transporters.
- Selected cold-storage providers.
- Dedicated human operations team.
- Manual market-data validation.

## 29.2 Pilot Proposal

### Pilot Crop

Tomatoes.

### Pilot Location

Multan to Lahore and Multan to Islamabad/Rawalpindi.

### Pilot Users

- 50 farmers.
- 10 traders/collection centers.
- 20 buyers.
- 20 transporters.
- 5 storage facilities.

### Pilot Duration

12 weeks.

### Pilot Success Criteria

- 500+ produce lots created.
- 100+ completed transactions.
- 20%+ recommendation-to-transaction conversion.
- 10%+ average net-revenue improvement versus the user’s baseline.
- 15%+ reduction in estimated spoilage for participating lots.
- 70%+ user satisfaction among active users.

## 29.3 Acquisition Channels

- Mandi commission agents.
- Agricultural input dealers.
- Farmer organizations and cooperatives.
- Collection centers.
- WhatsApp referral loops.
- Agricultural extension programs.
- NGOs and development programs.
- Buyer procurement partnerships.
- Cold-chain and logistics partners.

***

# 30. Product Roadmap

## Phase 0: Discovery and Validation

Duration: 4–6 weeks.

- Interview farmers, traders, buyers, transporters, and storage providers.
- Map actual selling workflows.
- Identify top crops and corridors.
- Validate willingness to pay.
- Gather initial market-price data.
- Build partner pipeline.
- Define quality taxonomy.

## Phase 1: MVP

Duration: 8–12 weeks.

- User onboarding.
- Produce-lot creation.
- Photo upload.
- Basic Gemini-based crop and visible-quality analysis.
- Text/voice intake.
- Manual/uploaded market-price data.
- Sell-now versus store comparison.
- Buyer matching.
- Transporter matching.
- WhatsApp communication.
- User approval workflow.
- Basic order tracking.
- Admin portal.

## Phase 2: Pilot Marketplace

Duration: 3–6 months.

- Verified buyer network.
- Transport booking.
- Cold-storage booking.
- Live market feeds.
- Price trends.
- Reliability scores.
- Driver tracking.
- Buyer counteroffers.
- Dispute handling.
- Operational analytics.

## Phase 3: Intelligence and Automation

Duration: 6–12 months.

- Crop-specific spoilage models.
- Price forecasting.
- Dynamic routing.
- Load consolidation.
- Automated re-planning.
- Payment integrations.
- Digital quality certificates.
- Finance and insurance integrations.
- Enterprise APIs.

## Phase 4: Platform Expansion

Duration: 12+ months.

- More crops.
- More regions.
- Export workflows.
- Traceability.
- Farm-level supply forecasting.
- Carbon and waste analytics.
- Regional cross-border trade tools.

***

# 31. MVP Acceptance Criteria

The MVP is ready for pilot when:

- A user can create a produce lot from text and at least one photo.
- The system can identify a supported crop with confidence scoring.
- The system can ask follow-up questions.
- The system can create a sell-now versus store comparison.
- The system can show market price data with timestamps.
- The system can recommend at least one buyer and one transport option.
- The system can draft WhatsApp outreach messages.
- No buyer message or booking can occur without user approval.
- The system can track a transaction from inquiry through delivery.
- Admin users can review low-confidence cases.
- Every agent action and approval is auditable.
- Basic analytics report lots, recommendations, outreach, bookings, and completed transactions.

***

# 32. Risks and Mitigations

| Risk | Impact | Mitigation |
|---|---|---|
| Inaccurate market prices | Poor recommendations and loss of trust | Display source, timestamp, confidence, and freshness; use multiple sources; allow manual validation |
| AI quality misclassification | Buyer rejection and user dissatisfaction | Confidence thresholds, human review, user override, clear visual-estimate disclaimer |
| Low user trust | Weak adoption | Explain recommendations, show net-revenue breakdown, use local partners, enable human support |
| Transport unreliability | Delivery failure | Ratings, verification, backup transporter matching, penalties and cancellation tracking |
| Buyer cancellation | Revenue loss and spoilage | Buyer reliability scores, deposits in later phases, rapid rematching workflow |
| Low smartphone literacy | Poor product adoption | WhatsApp-first workflow, voice input, simple UI, field-agent support |
| Incomplete data | Weak predictions | Start with rules and operational data collection; improve models over time |
| Seasonal market volatility | Recommendation errors | Real-time data refresh, uncertainty display, alert-based re-planning |
| Fraud | Financial and reputational risk | Verification, audit logs, reliability scoring, manual review, proof of delivery |
| Regulatory or policy limitations | Messaging disruption | Follow messaging platform policy, use approved templates, maintain SMS fallback |

***

# 33. Why Judges Will Remember FreshRoute Agent

FreshRoute Agent stands out because it is not another agricultural information chatbot.

It is an **execution agent** that transforms a simple farmer message into a complete commercial workflow:

```text
Photo / voice note / text
        ↓
AI quality analysis
        ↓
Market and revenue comparison
        ↓
Spoilage-risk estimate
        ↓
Buyer, transport, and storage matching
        ↓
User-approved outreach
        ↓
Booking and coordination
        ↓
Delivery tracking
        ↓
Real-time alerts and re-planning
```

The product is memorable because it connects multiple disconnected problems—quality assessment, market intelligence, logistics, storage, buyer coordination, and transaction monitoring—into one practical workflow.

It has a clear social and commercial outcome:

> **Better farmer income, lower produce waste, faster market access, and more efficient agricultural logistics.**

The use of multimodal AI is practical rather than decorative: Gemini can interpret produce photos and support conversational intake, while the rest of the system converts that understanding into real business decisions and controlled actions. [business.whatsapp](https://business.whatsapp.com/products/business-platform)

***

# 34. Final Product Positioning

> **FreshRoute Agent is an AI-powered selling and logistics copilot for fresh produce. It helps farmers and traders decide where, when, and how to sell—and then executes the buyer, transport, storage, tracking, and alert workflow with user approval.**

It is the intelligence and execution layer between the farm, mandi, buyer, transporter, and cold-storage ecosystem.
