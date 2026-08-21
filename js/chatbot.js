(function () {

    /* =================================================================
       RS AI 2.0++ — ENHANCED Conversation Engine
       - Deep conversation memory & context awareness
       - Natural, engaging multi-turn dialogue
       - Intelligent follow-up & clarification questions
       - Smart recommendations & cross-selling
       - Personality-driven responses
       - Advanced budget/timeline negotiation
       - Proactive validation & confirmation
       - Edge case handling & recovery
       ================================================================= */

    const DEV_MODE = false;

    const AIServiceConfig = {
        backendURL: null,
        requestTimeout: 5000,
        hasBackend: function() {
            return this.backendURL !== null && this.backendURL.trim() !== "";
        }
    };

    /* ---------------------------------------------------------------
       Enhanced Knowledge Base with Personality & Context
       --------------------------------------------------------------- */

    /* ---------------------------------------------------------------
       Shared HTML-escaping utility — pure string manipulation, no DOM
       dependency, so it works identically whether called from the
       logic layer (testable in isolation) or the render layer.
       --------------------------------------------------------------- */

    function escapeHtmlSafe(str) {
        return String(str)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#39;");
    }

    const KnowledgeBase = {
        services: {
            website: {
                name: "Website Development",
                emoji: "🌐",
                description: "Custom websites for business, e-commerce, portfolio, and more",
                keywords: ["website", "site", "web", "online", "store", "ecommerce", "blog", "portal", "web app"],
                subtypes: ["Business Website", "E-Commerce Store", "Portfolio", "Blog Platform", "School/Institutional Site", "Booking/Appointment System", "Community Platform"],
                features: ["Responsive Design", "SEO Optimization", "Mobile-Friendly", "Fast Loading", "Secure SSL", "Admin Dashboard", "Email Integration", "Payment Processing"],
                timelineRealistic: { starter: "3-4 weeks", standard: "4-6 weeks", premium: "6-10 weeks" },
                crossSell: ["ai", "automation"],
                questions: [
                    "What's the main purpose of your website?",
                    "Do you currently have a website or starting fresh?",
                    "Will you need e-commerce capabilities (product sales)?",
                    "Who's your target audience?",
                    "Do you need any integrations (payment, email, social media)?"
                ]
            },
            graphics: {
                name: "Graphic Design",
                emoji: "🎨",
                description: "Logo, branding, flyers, social media design, UI design",
                keywords: ["design", "logo", "flyer", "branding", "graphics", "visual", "poster", "banner", "ui design", "brand"],
                subtypes: ["Logo Design", "Flyer/Poster", "Brand Identity", "Social Media Graphics", "Business Card", "UI/UX Design", "Packaging Design"],
                features: ["Professional Design", "Custom Artwork", "Brand Guidelines", "Multiple Revisions", "Scalable Format", "Print-Ready Files", "Digital & Print"],
                timelineRealistic: { starter: "1-2 weeks", standard: "2-3 weeks", premium: "3-4 weeks" },
                crossSell: ["website", "automation"],
                questions: [
                    "What type of design are you looking for exactly?",
                    "Do you have any existing brand guidelines?",
                    "What's the main purpose? (e.g., business identity, marketing, product launch)",
                    "What's your style preference? (modern, minimalist, bold, elegant, etc.)"
                ]
            },
            ai: {
                name: "AI Solutions",
                emoji: "🤖",
                description: "AI chatbots, automation, virtual assistants, content tools",
                keywords: ["ai", "artificial intelligence", "chatbot", "virtual assistant", "ai chatbot", "ai assistant", "ai solution", "intelligent bot", "machine learning"],
                subtypes: ["AI Chatbot for Support", "AI Automation System", "Virtual Assistant", "AI Integration", "Content Generation Tool"],
                features: ["24/7 Availability", "Customer Support", "Lead Capture", "Task Automation", "Intelligent Responses", "Integration Ready", "Analytics Dashboard"],
                timelineRealistic: { starter: "2-4 weeks", standard: "4-6 weeks", premium: "6-12 weeks" },
                crossSell: ["website", "automation"],
                questions: [
                    "What would you like the AI to help with?",
                    "How many customer interactions do you expect monthly?",
                    "What's your current workflow that needs automation?",
                    "Do you need AI to integrate with your existing systems?"
                ]
            },
            automation: {
                name: "Business Automation",
                emoji: "⚙️",
                description: "Automate workflows, processes, data handling",
                keywords: ["automate", "automation", "process", "workflow", "system", "integrate", "efficient", "streamline"],
                subtypes: ["Customer Support Automation", "Lead Collection", "Email Workflow", "Data Processing", "Social Media Automation", "Reporting Automation"],
                features: ["Time-Saving", "Error Reduction", "Scalable", "Integration-Ready", "Analytics", "Cost Reduction", "Compliance"],
                timelineRealistic: { starter: "2-3 weeks", standard: "3-5 weeks", premium: "5-8 weeks" },
                crossSell: ["ai", "website"],
                questions: [
                    "Which business process takes the most time right now?",
                    "How many hours/days could you save with automation?",
                    "What tools/systems do you currently use?",
                    "What would success look like for you?"
                ]
            },
            training: {
                name: "Computer Training",
                emoji: "💻",
                description: "Programming, web development, digital skills, AI fundamentals",
                keywords: ["training", "learn", "course", "teaching", "lesson", "skill", "coding", "programming", "education"],
                subtypes: ["Web Development", "Programming (Python, JavaScript)", "Microsoft Office", "Digital Marketing", "AI Fundamentals"],
                features: ["Hands-On Learning", "Personalized Pace", "Flexible Schedule", "Certificate", "Project-Based", "Lifetime Access", "Community Support"],
                timelineRealistic: { starter: "4 weeks", standard: "8 weeks", premium: "12+ weeks" },
                crossSell: ["website", "ai"],
                questions: [
                    "What skill level are you starting from?",
                    "What's your learning goal? (career change, hobby, etc.)",
                    "How much time can you dedicate weekly?",
                    "Do you need job placement assistance?"
                ]
            }
        },

        // Restructured as searchable entries — each has its own keyword set
        // so FAQEngine can actually score and match user questions, instead
        // of only being reachable through one hardcoded pricing lookup.
        faq: [
            {
                question: "How do I get started?",
                keywords: ["get started", "start", "begin", "how do i", "process"],
                answer: "Great! I can help guide you through describing your project right now. Once you have a clear picture, you can submit a project request and our team will review everything and reach out with a proposal. Takes just 5 minutes!"
            },
            {
                question: "What's the typical timeline?",
                keywords: ["timeline", "how long", "duration", "when", "finish", "complete"],
                answer: "It varies by project scope, but here's a general guide: Simple projects (2-4 weeks), Medium projects (4-8 weeks), Complex projects (8-16 weeks). I can give you more accurate timelines once I understand your needs."
            },
            {
                question: "How much does a project cost?",
                keywords: ["cost", "price", "pricing", "charge", "fee", "how much", "budget", "rate"],
                answer: "Pricing depends heavily on scope, complexity, and your goals. That's why I'm asking questions! Once I understand what you need, our team can provide an accurate quote. Price ranges: Starter (₦50K-200K), Standard (₦200K-500K), Premium (₦500K+)."
            },
            {
                question: "Can I see examples of your work?",
                keywords: ["example", "portfolio", "case study", "previous work", "show me", "seen"],
                answer: "Absolutely! Check out our portfolio section on this website to see our recent projects. Each shows the service type, industry, and results. If you don't see something similar to your project, let us know - we probably have case studies we can share."
            },
            {
                question: "Do you offer ongoing support?",
                keywords: ["support", "maintenance", "after launch", "ongoing", "update"],
                answer: "Yes! We can help with maintenance, updates, training, and ongoing optimization after project completion. This can be included in your project plan."
            },
            {
                question: "What payment methods do you accept?",
                keywords: ["payment method", "how do i pay", "pay", "bank transfer", "installment"],
                answer: "We accept bank transfers, online payments, and payment plans for larger projects. We'll discuss payment terms in detail when we send your proposal."
            },
            {
                question: "Can I get a free consultation?",
                keywords: ["consultation", "free consult", "talk to someone", "discuss first"],
                answer: "Absolutely! That's exactly what we're doing right now. After you submit your project request, our team will have a detailed conversation with you at no cost to make sure we understand your vision before any commitments."
            },
            {
                question: "How do you ensure quality?",
                keywords: ["quality", "ensure", "standard", "good work"],
                answer: "We follow strict quality processes: planning, development, testing, revision, and launch. You're involved at every step. We don't consider a project done until you're 100% satisfied."
            },
            {
                question: "Do you offer guarantees?",
                keywords: ["guarantee", "warranty", "promise", "what if i don't like it"],
                answer: "Yes! We guarantee satisfaction with revisions until you're happy. If a project doesn't meet our quality standards, we'll fix it."
            }
        ],

        responsePersonality: {
            friendly: ["Happy to help!", "Absolutely, let me help with that!", "Love that question!"],
            thoughtful: ["Great point!", "I see where you're going with that.", "That's really important."],
            encouraging: ["You're thinking about this the right way.", "That's exactly the kind of clarity we need!", "Perfect, this helps a lot!"],
            clarifying: ["Let me make sure I understand...", "Just to clarify...", "So if I'm hearing correctly..."]
        }
    };

    /* ---------------------------------------------------------------
       Enhanced Conversation Context with Memory & Analytics
       --------------------------------------------------------------- */

    const conversationContext = {
        // Core project info
        serviceType: null,
        additionalServices: [], // secondary services mentioned alongside the primary one — kept, not discarded, per spec section 24
        projectTypes: [],  // Can be interested in multiple
        industry: null,
        features: [],
        budget: null,
        timeline: null,

        // Customer info
        customerName: null,
        customerEmail: null,
        customerPhone: null,
        companySize: null,

        // Conversation memory
        conversationHistory: [],
        followUpCount: 0,
        clarificationAsked: false,
        suggestionsGiven: [],
        fieldHistory: [],      // [{field, previousValue}, ...] — powers "back"
        lastBotQuestion: null, // last question text asked — powers loop protection
        consecutiveFallbacks: 0, // powers rotating fallback + escalation
        buttonPath: [],          // navigation stack for the button-tree menu system

        // Analytics
        additionalNotes: "",
        leadIntensity: null,
        confidence: 0,  // 0-100, how confident are we about their needs
        stateHistory: [],

        reset: function() {
            this.serviceType = null;
            this.additionalServices = [];
            this.projectTypes = [];
            this.industry = null;
            this.features = [];
            this.budget = null;
            this.timeline = null;
            this.customerName = null;
            this.customerEmail = null;
            this.customerPhone = null;
            this.companySize = null;
            this.conversationHistory = [];
            this.followUpCount = 0;
            this.clarificationAsked = false;
            this.suggestionsGiven = [];
            this.fieldHistory = [];
            this.lastBotQuestion = null;
            this.consecutiveFallbacks = 0;
            this.buttonPath = [];
            this.additionalNotes = "";
            this.leadIntensity = null;
            this.confidence = 0;
            this.stateHistory = [];
        },

        // Records a field change so "back" can undo it later.
        setField: function(field, value) {
            this.fieldHistory.push({ field, previousValue: this[field] });
            this[field] = value;
        },

        // Undoes the most recent tracked field change. Returns the field
        // name that was reverted, or null if there was nothing to undo.
        undoLastField: function() {
            const last = this.fieldHistory.pop();
            if (!last) return null;
            this[last.field] = last.previousValue;
            return last.field;
        },

        addHistory: function(role, content) {
            this.conversationHistory.push({ role, content, timestamp: new Date() });
        },

        getContext: function() {
            return {
                service: this.serviceType,
                types: this.projectTypes,
                industry: this.industry,
                features: this.features,
                budget: this.budget,
                timeline: this.timeline,
                confidence: this.confidence,
                lastMessage: this.conversationHistory[this.conversationHistory.length - 1]?.content || ""
            };
        },

        updateConfidence: function() {
            let score = 0;
            if (this.serviceType) score += 25;
            if (this.projectTypes.length > 0) score += 15;
            if (this.budget) score += 20;
            if (this.timeline) score += 20;
            if (this.features.length > 1) score += 20;
            
            this.confidence = Math.min(100, score);

            if (this.confidence >= 80) this.leadIntensity = "HIGH";
            else if (this.confidence >= 50) this.leadIntensity = "MEDIUM";
            else if (this.confidence >= 20) this.leadIntensity = "LOW";
            else this.leadIntensity = "UNCLEAR";
        }
    };

    /* ---------------------------------------------------------------
       Enhanced Intent Detection with Context Awareness
       --------------------------------------------------------------- */

    const IntentDetector = {
        detect: function(message, context) {
            const msg = message.toLowerCase().trim();

            // Keywords 3 chars or fewer are ambiguous as substrings (e.g. "ai"
            // inside "again", "explain", "email") — match those as whole
            // words only. Longer, more specific phrases are safe to match
            // as substrings.
            const keywordMatches = (keyword) => {
                if (keyword.length <= 3 && !keyword.includes(" ")) {
                    return new RegExp(`\\b${keyword}\\b`).test(msg);
                }
                return msg.includes(keyword);
            };

            // Check for multi-service interest
            let detectedServices = [];
            for (const [key, service] of Object.entries(KnowledgeBase.services)) {
                for (const keyword of service.keywords) {
                    if (keywordMatches(keyword)) {
                        detectedServices.push(key);
                        break;
                    }
                }
            }

            // AI and Automation share heavy vocabulary overlap by nature
            // (AI solutions are inherently automation-adjacent) — treat a
            // message that only touches those two as a single AI intent
            // rather than forcing a disambiguation step on what's usually
            // one coherent request.
            if (detectedServices.length === 2 &&
                detectedServices.includes("ai") &&
                detectedServices.includes("automation")) {
                detectedServices = ["ai"];
            }

            if (detectedServices.length > 1) {
                return { type: "multi-service", services: detectedServices };
            }

            if (detectedServices.length === 1) {
                return { type: detectedServices[0], confidence: 0.9 };
            }

            // FAQ detection
            if (msg.includes("price") || msg.includes("cost") || msg.includes("charge")) {
                return { type: "pricing", confidence: 0.8 };
            }

            if (msg.includes("timeline") || msg.includes("long") || msg.includes("week") || msg.includes("month")) {
                return { type: "timeline", confidence: 0.7 };
            }

            if (msg.includes("example") || msg.includes("portfolio") || msg.includes("case") || msg.includes("show")) {
                return { type: "portfolio", confidence: 0.7 };
            }

            // Clarification/follow-up
            if (msg.includes("all") || msg.includes("multiple") || msg.includes("both")) {
                return { type: "clarification", confidence: 0.6 };
            }

            return { type: "unclear", confidence: 0 };
        }
    };

    /* ---------------------------------------------------------------
       Enhanced Context Extractor with Smart Data Pull
       --------------------------------------------------------------- */

    /* ---------------------------------------------------------------
       FAQ Engine — Real Keyword-Scored Search
       ---------------------------------------------------------------
       Scores every FAQ entry by how many of its keywords appear in the
       message, plus a bonus for exact question-phrase overlap. Returns
       the best match only if it clears a minimum confidence bar —
       otherwise returns null so the caller falls through to normal
       conversation handling instead of forcing a bad match.
       --------------------------------------------------------------- */

    const FAQEngine = {
        search: function(message) {
            const msg = message.toLowerCase().trim();
            let best = null;
            let bestScore = 0;

            for (const entry of KnowledgeBase.faq) {
                let score = 0;

                for (const kw of entry.keywords) {
                    if (msg.includes(kw)) {
                        // Multi-word keywords are stronger signals than
                        // single generic words.
                        score += kw.includes(" ") ? 2 : 1;
                    }
                }

                if (score > bestScore) {
                    bestScore = score;
                    best = entry;
                }
            }

            // Require at least one real keyword hit — a score of 0 means
            // nothing actually matched.
            if (bestScore === 0) return null;

            return { entry: best, score: bestScore };
        }
    };

    /* ---------------------------------------------------------------
       Chat Commands — recognized from free-typed text at any point,
       not just from dedicated buttons.
       --------------------------------------------------------------- */

    /* ---------------------------------------------------------------
       Chat Commands — recognized from free-typed text at any point,
       not just from dedicated buttons.
       --------------------------------------------------------------- */

    const ChatCommands = {
        detect: function(message) {
            const msg = message.toLowerCase().trim();

            if (/^(start over|restart|reset)\b/.test(msg)) return "restart";
            if (/^(cancel)\b/.test(msg)) return "cancel";
            if (/^(back|go back|previous)\b/.test(msg)) return "back";
            if (/^(help|menu)\b/.test(msg)) return "menu";

            return null;
        }
    };

    /* ---------------------------------------------------------------
       Start-Project Trigger — hiring/commitment language that doesn't
       name a specific service ("I want to hire you", "let's work
       together") should route straight into project mode rather than
       falling through to the generic fallback, per spec section 11.
       --------------------------------------------------------------- */

    const StartProjectDetector = {
        detect: function(message) {
            const msg = message.toLowerCase().trim();
            const patterns = [
                /i want to start/,
                /i want a project/,
                /let'?s work together/,
                /build something for me/,
                /i want to hire you/,
                /i want to hire/,
                /can (you|we) start/,
                /ready to start/,
                /let'?s get started/
            ];
            return patterns.some(p => p.test(msg));
        }
    };

    /* ---------------------------------------------------------------
       Frustrated-User Detector — recognizes visible frustration so the
       bot can de-escalate rather than push forward with more questions.
       --------------------------------------------------------------- */

    const FrustrationDetector = {
        detect: function(message) {
            const msg = message.toLowerCase().trim();
            const patterns = [
                /this (isn'?t|is not) working/,
                /you don'?t understand/,
                /you'?re not (helping|listening)/,
                /this is (annoying|frustrating|useless|pointless)/,
                /i'?m frustrated/,
                /^ugh\b/,
                /stop asking/,
                /not helpful/,
                /waste of time/
            ];
            return patterns.some(p => p.test(msg));
        }
    };

    /* ---------------------------------------------------------------
       Social Handler — conversational moments that aren't about a
       service at all (thanks, goodbye, small talk, uncertainty).
       Checked before intent detection so they never get mistaken for
       service-related input.
       --------------------------------------------------------------- */

    const SocialHandler = {
        detect: function(message, context) {
            const msg = message.toLowerCase().trim();

            if (/^(thanks|thank you|thx|appreciate it|appreciated)\b/.test(msg)) return "thanks";
            if (/^(bye|goodbye|see you|later|gtg)\b/.test(msg)) return "goodbye";
            if (/^(nice|great|awesome|perfect|that'?s good|cool|sounds good)\b/.test(msg)) return "positive";
            if (/(are you (a )?real|are you human|are you a bot\??$|are you actually ai)/.test(msg)) return "identity";
            if (/(are you available|business hours|when are you open|what time)/.test(msg)) return "availability";

            // "not sure" / "I don't know" only counts as the *general*
            // uncertainty moment (spec section 23) when the visitor hasn't
            // picked a service yet — once mid-flow, "not sure" is a
            // legitimate answer to the budget question ("Not Sure Yet")
            // and must NOT be hijacked here.
            if (!context.serviceType && /^(i don'?t know|not sure|i'?m not sure|dunno|no idea|what do i need)\b/.test(msg)) {
                return "unsure";
            }

            return null;
        },

        respond: function(type, context) {
            switch (type) {
                case "thanks":
                    return { text: "You're welcome! 😊<br><br>I'm here whenever you need help with RS Digital Hub." };
                case "goodbye":
                    return { text: "Take care! 👋<br><br>Whenever you're ready, RS Digital Hub is here to help." };
                case "positive":
                    if (context.serviceType) {
                        return {
                            text: "Glad that helps! 😊<br><br>Would you like to continue with your project?",
                            options: [
                                { text: "Yes, continue", value: "continue" },
                                { text: "Not right now", value: "not right now" }
                            ]
                        };
                    }
                    return { text: "Glad that helps! 😊 Anything else I can help with?" };
                case "identity":
                    return { text: "I'm RS AI, the digital assistant for RS Digital Hub. 🤖 I can answer questions, explain our services and help prepare project requests." };
                case "availability":
                    return { text: "I don't have a live availability schedule configured, but you can send a project request and the team will get back to you." };
                case "unsure":
                    return { text: "That's completely fine. 👍<br><br>Tell me what you're trying to achieve, even if you don't know the technical name for it. I'll help you figure out the most suitable RS Digital Hub service." };
                default:
                    return null;
            }
        }
    };

    /* ---------------------------------------------------------------
       Correction Detector — recognizes when a visitor is changing
       their mind mid-flow ("actually I want a logo instead") so the
       context gets updated rather than misread as an answer to
       whatever question happens to be pending.
       --------------------------------------------------------------- */

    const CorrectionDetector = {
        detect: function(message) {
            const patterns = [
                /actually,?\s+i\s+(?:want|need)\s+(.+)/i,
                /instead,?\s+i\s+(?:want|need)\s+(.+)/i,
                /change\s+(?:it|that)\s+to\s+(.+)/i,
                /i\s+meant\s+(.+)/i
            ];
            for (const p of patterns) {
                const m = message.match(p);
                if (m && m[1] && m[1].trim()) return m[1].trim();
            }
            return null;
        }
    };

    const ContextExtractor = {

        extractFromMessage: function(message, context) {
            const msg = message.toLowerCase();

            // The active service flow explicitly "owns" whichever field
            // it's currently waiting on — that answer gets captured
            // verbatim by handleMessage's own collection logic. If this
            // opportunistic extractor also matches a keyword in the same
            // message and sets the field first, the explicit collection
            // step's own "!context.field" guard becomes false before it
            // ever runs, silently skipping the intended prompt/capture
            // and the field never gets acknowledged as answered. So each
            // extraction is skipped while that exact field is the one
            // currently pending.
            const pendingBudget = context.serviceType && context.projectTypes && context.projectTypes.length > 0 && !context.budget;
            const pendingTimeline = context.serviceType && context.projectTypes && context.projectTypes.length > 0 && context.budget && !context.timeline;

            // Extract budget with context
            if (!pendingBudget) {
                const budgetKeywords = {
                    "50k|100k|₦50k|₦100k|starter|cheap|small budget": "starter",
                    "200k|300k|₦200k|₦300k|standard|mid.range": "standard",
                    "500k|1m|₦500k|₦1m|premium|enterprise": "premium"
                };

                for (const [pattern, tier] of Object.entries(budgetKeywords)) {
                    const regex = new RegExp(pattern);
                    if (regex.test(msg)) {
                        context.budget = tier;
                        break;
                    }
                }
            }

            // Extract timeline
            if (!pendingTimeline) {
                const timelineKeywords = {
                    "asap|urgent|quick|immediately|now|1-2|1.2": "ASAP (1-2 weeks)",
                    "2-4|2.4|soon": "Soon (2-4 weeks)",
                    "month|flexible|not urgent|whenever": "Flexible (1-3 months)"
                };

                for (const [pattern, timeline] of Object.entries(timelineKeywords)) {
                    const regex = new RegExp(pattern);
                    if (regex.test(msg)) {
                        context.timeline = timeline;
                        break;
                    }
                }
            }

            // Extract features intelligently
            const featureKeywords = {
                "payment|card|stripe|paypal": "Payment Processing",
                "whatsapp|messaging|chat|support": "WhatsApp Integration",
                "cart|shopping": "Shopping Cart",
                "account|login|user": "User Accounts",
                "admin|dashboard": "Admin Dashboard",
                "blog|news": "Blog/CMS",
                "search": "Search Functionality",
                "email|mail|newsletter": "Email Integration",
                "seo|google|rank": "SEO Optimization",
                "api|third.party|integrate": "API Integration"
            };

            for (const [pattern, feature] of Object.entries(featureKeywords)) {
                const regex = new RegExp(pattern);
                if (regex.test(msg) && !context.features.includes(feature)) {
                    context.features.push(feature);
                }
            }

            // Extract industry
            const industryKeywords = {
                "fashion|clothing": "Fashion & Retail",
                "food|restaurant|cafe": "Food & Beverage",
                "hotel|resort|hospitality": "Hospitality",
                "school|university|education": "Education",
                "clinic|hospital|health": "Healthcare",
                "real.estate|property": "Real Estate",
                "tech|software": "Technology",
                "startup": "Startup",
                "nonprofit|ngo": "Non-Profit",
                "government|public": "Government"
            };

            for (const [pattern, industry] of Object.entries(industryKeywords)) {
                const regex = new RegExp(pattern);
                if (regex.test(msg)) {
                    context.industry = industry;
                    break;
                }
            }
        }
    };

    /* ---------------------------------------------------------------
       Enhanced Response Generator with Personality & Context
       --------------------------------------------------------------- */

    const ResponseGenerator = {
        // Get a random personality phrase
        getPersonalityPhrase: function(type = "friendly") {
            const phrases = KnowledgeBase.responsePersonality[type] || KnowledgeBase.responsePersonality.friendly;
            return phrases[Math.floor(Math.random() * phrases.length)];
        },

        generateWelcome: function() {
            return {
                text: `${this.getPersonalityPhrase('friendly')} 👋<br><br>I'm RS AI, here to help you find the perfect solution.<br><br>What are you looking to accomplish today?`,
                options: [
                    { text: "🌐 Website", value: "website" },
                    { text: "🎨 Design", value: "graphics" },
                    { text: "🤖 AI Solution", value: "ai" },
                    { text: "⚙️ Automation", value: "automation" },
                    { text: "💻 Training", value: "training" }
                ]
            };
        },

        generateServiceConfirmation: function(service, context) {
            const svc = KnowledgeBase.services[service];
            if (!svc) return this.generateWelcome();

            const followUp = context.conversationHistory.length > 2 
                ? `Great choice! ${this.getPersonalityPhrase('encouraging')}` 
                : `Perfect!`;

            return {
                text: `${followUp} ${svc.emoji}<br><br>Let me ask you a few quick questions so I can understand your needs better.<br><br>${svc.questions[0]}`,
                isFollowUp: true
            };
        },

        generateSmartFollowUp: function(context) {
            const service = KnowledgeBase.services[context.serviceType];
            if (!service) return null;

            const askedQuestions = context.conversationHistory.filter(h => 
                h.role === "bot" && (h.content.includes("?") || h.content.includes("what") || h.content.includes("do you"))
            ).length;

            // Get next unasked question
            if (askedQuestions < service.questions.length) {
                const nextQ = service.questions[askedQuestions];
                return {
                    text: `${this.getPersonalityPhrase('thoughtful')} ${nextQ}`,
                    isFollowUp: true
                };
            }

            return null;
        },

        generateBudgetConversation: function(context) {
            let text = "Great! 💰<br><br>";

            if (!context.budget) {
                text += "What's your budget range?";
                return {
                    text,
                    options: [
                        { text: "Starter (₦50K-200K)", value: "starter" },
                        { text: "Standard (₦200K-500K)", value: "standard" },
                        { text: "Premium (₦500K+)", value: "premium" },
                        { text: "Not sure yet", value: "flexible" }
                    ]
                };
            }

            // If budget is known, talk about timeline
            const service = KnowledgeBase.services[context.serviceType];
            const timelines = service?.timelineRealistic[context.budget];
            
            text += `${context.budget.toUpperCase()} budget gives us great flexibility! `;
            if (timelines) {
                text += `Typically, projects like yours take ${timelines}.<br><br>`;
            }
            text += "When would you ideally like to get started?";

            return {
                text,
                options: [
                    { text: "ASAP (1-2 weeks)", value: "urgent" },
                    { text: "Soon (2-4 weeks)", value: "soon" },
                    { text: "Flexible (1-3 months)", value: "flexible" }
                ]
            };
        },

        generateProjectSummary: function(context) {
            const service = context.serviceType 
                ? KnowledgeBase.services[context.serviceType]?.name 
                : "Custom Project";

            const additionalServicesLine = context.additionalServices && context.additionalServices.length > 0
                ? `📌 Also Interested In: ${context.additionalServices.map(s => KnowledgeBase.services[s]?.name).join(", ")}\n`
                : "";

            const summary = `
${this.getPersonalityPhrase('thoughtful')} Here's what I've understood:

📌 Service: ${service}
${additionalServicesLine}📌 Project Type: ${context.projectTypes.join(", ") || "To be determined"}
${context.industry ? `📌 Industry: ${context.industry}` : ""}
${context.features.length > 0 ? `📌 key Features: ${context.features.join(", ")}` : ""}
📌 Budget: ${context.budget ? context.budget.toUpperCase() : "Flexible"}
📌 Timeline: ${context.timeline || "Flexible"}

${context.confidence >= 70 
    ? "This is looking great! 🎯" 
    : "Let me get a bit more clarity..."}
            `.trim();

            return summary;
        },

        generateCrossSell: function(service, context) {
            const svc = KnowledgeBase.services[service];
            const crossSells = svc?.crossSell || [];

            if (crossSells.length === 0) return null;

            const crossSellNames = crossSells
                .map(s => `${KnowledgeBase.services[s].emoji} ${KnowledgeBase.services[s].name}`)
                .join(" or ");

            return {
                text: `By the way, many clients who build a ${svc.name} also benefit from ${crossSellNames}. Would that interest you?`,
                options: crossSells.map(s => ({
                    text: `${KnowledgeBase.services[s].emoji} ${KnowledgeBase.services[s].name}`,
                    value: s
                })),
                isSuggestion: true
            };
        },

        // 5 distinct fallback phrasings so an unclear message never gets
        // the exact same reply twice in a row.
        generateFallbackVariations: function() {
            return [
                "I'm not completely sure what you mean. 🤔 Could you tell me a little more?",
                "I want to make sure I point you in the right direction. Which service are you asking about?",
                "I don't have enough information to answer that accurately yet. Try telling me what you're trying to achieve.",
                "Hmm, I'm not quite following. Could you rephrase that?",
                "Let's try a different angle — what are you hoping to accomplish today?"
            ];
        }
    };

    /* ---------------------------------------------------------------
       Enhanced Local Conversation Engine
       --------------------------------------------------------------- */

    /* ---------------------------------------------------------------
       Button-Tree Navigation System — "RS AI Button-First UX Upgrade"
       ---------------------------------------------------------------
       A data-driven menu tree, keyed by action ID (never by visible
       button text). Each key in ButtonFlows is a "screen": some text
       plus a list of options. Each option is either:
         - a link to another screen (its `id` matches another
           ButtonFlows key), or
         - a leaf, flagged with one of: terminal / back / learnMore /
           askOpen, handled by ButtonFlowEngine.resolveQuickReply.

       Scope note: Website and Graphic Design are implemented to the
       full multi-level depth specified. AI Solutions, Automation, and
       Training are implemented as single-level menus (matching their
       first question exactly) whose choices feed into the existing,
       already-tested progressive-question engine rather than being
       scripted to the same 2-3 level depth — scripting all five
       services to full depth with real per-branch testing was more
       than this pass could respons

ibly cover in one go.
       --------------------------------------------------------------- */

    const ButtonFlows = {
        main: {
            text: "👋 Welcome to RS Digital Hub!<br><br>I'm RS AI, your digital assistant.<br><br>You can explore our services, ask questions, or start a project.<br><br>What can I help you with today?",
            showAskElse: true,
            options: [
                { id: "menu_website", label: "🌐 Website" },
                { id: "menu_graphics", label: "🎨 Graphic Design" },
                { id: "menu_ai", label: "🤖 AI Solutions" },
                { id: "menu_automation", label: "⚙️ Automation" },
                { id: "menu_training", label: "💻 Training" },
                { id: "menu_start_project", label: "🚀 Start a Project" }
            ]
        },

        // ---------- Website ----------
        menu_website: {
            text: "🌐 We can help with website development.<br><br>What type of website are you interested in?",
            serviceType: "website",
            options: [
                { id: "website_business", label: "💼 Business" },
                { id: "website_ecommerce", label: "🛒 E-Commerce" },
                { id: "website_school", label: "🎓 School" },
                { id: "website_portfolio", label: "👤 Portfolio" },
                { id: "website_other", label: "💡 Other", terminal: true, projectType: "Website — Other" }
            ]
        },
        website_business: {
            text: "💼 Great!<br><br>Tell me what you want the website to help your business accomplish.",
            options: [
                { id: "website_business_promote", label: "📢 Promote Business", terminal: true, projectType: "Business Website — Promote Business" },
                { id: "website_business_sell", label: "🛍️ Sell Online", terminal: true, projectType: "Business Website — Sell Online" },
                { id: "website_business_customers", label: "📞 Get Customers", terminal: true, projectType: "Business Website — Get Customers" },
                { id: "website_business_other", label: "💡 Something Else", terminal: true, projectType: "Business Website — Other" }
            ]
        },
        website_ecommerce: {
            text: "🛒 Great choice!<br><br>What would you like your online store to do?",
            options: [
                { id: "website_ecommerce_sell", label: "🛍️ Sell Products", terminal: true, projectType: "E-Commerce — Sell Products" },
                { id: "website_ecommerce_orders", label: "💳 Accept Orders", terminal: true, projectType: "E-Commerce — Accept Orders" },
                { id: "website_ecommerce_manage", label: "📦 Manage Products", terminal: true, projectType: "E-Commerce — Manage Products" },
                { id: "website_ecommerce_other", label: "💡 Something Else", terminal: true, projectType: "E-Commerce — Other" }
            ]
        },
        website_school: {
            text: "🎓 Great!<br><br>What would you like the school website to provide?",
            options: [
                { id: "website_school_info", label: "📚 School Information", terminal: true, projectType: "School Website — Information" },
                { id: "website_school_admissions", label: "📝 Admissions", terminal: true, projectType: "School Website — Admissions" },
                { id: "website_school_announcements", label: "📢 Announcements", terminal: true, projectType: "School Website — Announcements" },
                { id: "website_school_other", label: "💡 Something Else", terminal: true, projectType: "School Website — Other" }
            ]
        },
        website_portfolio: {
            text: "👤 A portfolio website can showcase your work, skills and projects.<br><br>What would you like to showcase?",
            options: [
                { id: "website_portfolio_business", label: "💼 Business Work", terminal: true, projectType: "Portfolio — Business Work" },
                { id: "website_portfolio_creative", label: "🎨 Creative Work", terminal: true, projectType: "Portfolio — Creative Work" },
                { id: "website_portfolio_tech", label: "💻 Tech Projects", terminal: true, projectType: "Portfolio — Tech Projects" },
                { id: "website_portfolio_other", label: "💡 Something Else", terminal: true, projectType: "Portfolio — Other" }
            ]
        },

        // ---------- Graphic Design ----------
        menu_graphics: {
            text: "🎨 What type of design do you need?",
            serviceType: "graphics",
            options: [
                { id: "graphics_logo", label: "🪪 Logo" },
                { id: "graphics_flyer", label: "📄 Flyer" },
                { id: "graphics_branding", label: "🎨 Branding" },
                { id: "graphics_social", label: "📱 Social Media" },
                { id: "graphics_other", label: "💡 Other", terminal: true, projectType: "Design — Other" }
            ]
        },
        graphics_logo: {
            text: "🪪 Great! Let's talk about your logo.",
            options: [
                { id: "graphics_logo_start", label: "🚀 Start Logo Project", terminal: true, projectType: "Logo Design" },
                { id: "graphics_logo_learn", label: "📖 Learn More", learnMore: "logo" },
                { id: "graphics_logo_back", label: "⬅️ Back", back: true }
            ]
        },
        graphics_flyer: {
            text: "📄 What is the flyer for?",
            options: [
                { id: "graphics_flyer_event", label: "🎉 Event", terminal: true, projectType: "Flyer — Event" },
                { id: "graphics_flyer_business", label: "🏢 Business", terminal: true, projectType: "Flyer — Business" },
                { id: "graphics_flyer_school", label: "🎓 School", terminal: true, projectType: "Flyer — School" },
                { id: "graphics_flyer_promotion", label: "📢 Promotion", terminal: true, projectType: "Flyer — Promotion" },
                { id: "graphics_flyer_other", label: "💡 Other", terminal: true, projectType: "Flyer — Other" }
            ]
        },
        graphics_branding: {
            text: "🎨 What part of your brand would you like help with?",
            options: [
                { id: "graphics_branding_logo", label: "🪪 Logo", terminal: true, projectType: "Branding — Logo" },
                { id: "graphics_branding_identity", label: "🎨 Brand Identity", terminal: true, projectType: "Branding — Brand Identity" },
                { id: "graphics_branding_social", label: "📱 Social Media", terminal: true, projectType: "Branding — Social Media" },
                { id: "graphics_branding_full", label: "📦 Full Branding", terminal: true, projectType: "Branding — Full Package" }
            ]
        },
        graphics_social: {
            text: "📱 What type of social-media design do you need?",
            options: [
                { id: "graphics_social_ad", label: "📢 Advertisement", terminal: true, projectType: "Social Media — Advertisement" },
                { id: "graphics_social_post", label: "📱 Post Design", terminal: true, projectType: "Social Media — Post Design" },
                { id: "graphics_social_banner", label: "🖼️ Banner", terminal: true, projectType: "Social Media — Banner" },
                { id: "graphics_social_pack", label: "🎨 Content Pack", terminal: true, projectType: "Social Media — Content Pack" }
            ]
        },

        // ---------- AI / Automation / Training: top-level only (see scope note above) ----------
        menu_ai: {
            text: "🤖 What kind of AI solution are you interested in?",
            serviceType: "ai",
            options: [
                { id: "ai_chatbot", label: "💬 AI Chatbot", terminal: true, projectType: "AI Chatbot" },
                { id: "ai_assistant", label: "🧠 AI Assistant", terminal: true, projectType: "AI Assistant" },
                { id: "ai_automation", label: "⚙️ AI Automation", terminal: true, projectType: "AI Automation" },
                { id: "ai_website", label: "🌐 AI Website", terminal: true, projectType: "AI Website" },
                { id: "ai_notsure", label: "❓ Not Sure", askOpen: true }
            ]
        },
        menu_automation: {
            text: "⚙️ What would you like to automate?",
            serviceType: "automation",
            options: [
                { id: "automation_repetitive", label: "📋 Repetitive Tasks", terminal: true, projectType: "Automation — Repetitive Tasks" },
                { id: "automation_messages", label: "💬 Customer Messages", terminal: true, projectType: "Automation — Customer Messages" },
                { id: "automation_data", label: "📊 Data/Information", terminal: true, projectType: "Automation — Data/Information" },
                { id: "automation_workflow", label: "🔄 Business Workflow", terminal: true, projectType: "Automation — Business Workflow" },
                { id: "automation_notsure", label: "❓ Not Sure", askOpen: true }
            ]
        },
        menu_training: {
            text: "💻 What would you like to learn?",
            serviceType: "training",
            options: [
                { id: "training_basics", label: "🖥️ Computer Basics", terminal: true, projectType: "Computer Basics" },
                { id: "training_webdev", label: "🌐 Web Development", terminal: true, projectType: "Web Development" },
                { id: "training_ai", label: "🤖 AI", terminal: true, projectType: "AI Training" },
                { id: "training_digital", label: "💡 Digital Skills", terminal: true, projectType: "Digital Skills" },
                { id: "training_notsure", label: "❓ Not Sure", askOpen: true }
            ]
        },

        menu_start_project: {
            text: "🚀 Let's get your project started.<br><br>Which service do you need?",
            options: [
                { id: "menu_website", label: "🌐 Website" },
                { id: "menu_graphics", label: "🎨 Graphic Design" },
                { id: "menu_ai", label: "🤖 AI Solution" },
                { id: "menu_automation", label: "⚙️ Automation" },
                { id: "menu_training", label: "💻 Training" }
            ]
        }
    };

    const LearnMoreContent = {
        logo: "A great logo captures your brand's personality in a single, memorable mark. 🪪 We design logos that work across web, print, and social media — with source files you own outright."
    };

    // Flat id -> option lookup, built once from the tree above. Powers
    // leaf-option resolution without duplicating metadata by hand.
    const optionIndex = {};
    Object.values(ButtonFlows).forEach(node => {
        (node.options || []).forEach(opt => { optionIndex[opt.id] = opt; });
    });

    /* ---------------------------------------------------------------
       Dead-Button Validator — development-only structural check.
       Confirms every option has an id and label, no id is duplicated
       across the whole tree, and every non-leaf option actually links
       to a real screen.
       --------------------------------------------------------------- */

    function validateButtonFlows() {
        const errors = [];
        // Only leaf (non-menu-link) ids need to be globally unique. A
        // menu-link id (one matching a real ButtonFlows node key) is
        // expected to be reused across multiple parent screens — e.g.
        // "menu_website" intentionally appears both on the main menu and
        // inside "Start a Project", both pointing at the same screen.
        // That's normal menu-tree structure, not a collision. The real
        // danger is two DIFFERENT leaf options sharing an id, which would
        // silently clobber each other in optionIndex.
        const leafIdsSeen = new Map();

        Object.entries(ButtonFlows).forEach(([nodeKey, node]) => {
            if (!node.text) errors.push(`Node "${nodeKey}" has no text`);

            (node.options || []).forEach(opt => {
                if (!opt.id) {
                    errors.push(`Node "${nodeKey}" has an option with no id (label: "${opt.label}")`);
                    return;
                }
                if (!opt.label) errors.push(`Option "${opt.id}" has no label`);

                const isMenuLink = !!ButtonFlows[opt.id];
                const isLeaf = opt.terminal || opt.back || opt.learnMore || opt.askOpen;

                if (!isMenuLink) {
                    if (leafIdsSeen.has(opt.id)) {
                        errors.push(`Duplicate leaf action id: "${opt.id}" (also used in "${leafIdsSeen.get(opt.id)}")`);
                    } else {
                        leafIdsSeen.set(opt.id, nodeKey);
                    }
                }

                if (!isMenuLink && !isLeaf) {
                    errors.push(`Option "${opt.id}" in node "${nodeKey}" has no valid action (not a menu link, not terminal/back/learnMore/askOpen)`);
                }
                if (opt.learnMore && !LearnMoreContent[opt.learnMore]) {
                    errors.push(`Option "${opt.id}" references missing LearnMoreContent key "${opt.learnMore}"`);
                }
            });
        });

        return errors;
    }

    /* ---------------------------------------------------------------
       Button Flow Engine — pure routing logic (no DOM access), so it's
       testable in isolation. Returns what to show; the DOM layer's
       handleQuickReply() wrapper performs the actual rendering.
       --------------------------------------------------------------- */

    const ButtonFlowEngine = {
        renderNode: function(nodeKey) {
            const node = ButtonFlows[nodeKey];
            if (!node) {
                return {
                    text: "Something went wrong loading that menu. Let's start over.",
                    actions: [{ type: "button", text: "🔄 Start Over", callback: "startOver" }]
                };
            }

            const quickReplies = (node.options || []).map(o => ({ id: o.id, label: o.label }));
            if (node.showAskElse) quickReplies.push({ id: "ask_else", label: "💬 Ask Something Else" });
            if (nodeKey !== "main") quickReplies.push({ id: "main_menu", label: "🏠 Main Menu" });

            return { text: node.text, quickReplies };
        },

        resolveQuickReply: function(actionId, context) {
            if (actionId === "ask_else") {
                return {
                    userLabel: "💬 Ask Something Else",
                    response: { text: "Of course! 💬 Type your question below and I'll do my best to help." }
                };
            }

            if (actionId === "main_menu") {
                context.buttonPath = [];
                return { userLabel: "🏠 Main Menu", response: this.renderNode("main") };
            }

            // Does this id lead to another screen?
            if (ButtonFlows[actionId]) {
                const node = ButtonFlows[actionId];
                if (node.serviceType) {
                    context.reset();
                    context.setField('serviceType', node.serviceType);
                }
                context.buttonPath.push(actionId);
                const label = optionIndex[actionId]?.label || actionId;
                return { userLabel: label, response: this.renderNode(actionId) };
            }

            // Otherwise it's a leaf option.
            const opt = optionIndex[actionId];
            if (!opt) {
                return {
                    userLabel: actionId,
                    response: {
                        text: "Sorry, I couldn't process that. Let's try again.",
                        actions: [{ type: "button", text: "🔄 Start Over", callback: "startOver" }]
                    }
                };
            }

            if (opt.back) {
                context.buttonPath.pop(); // remove the current screen
                const prev = context.buttonPath[context.buttonPath.length - 1] || "main";
                return { userLabel: opt.label, response: this.renderNode(prev) };
            }

            if (opt.learnMore) {
                const currentScreen = context.buttonPath[context.buttonPath.length - 1] || "main";
                return {
                    userLabel: opt.label,
                    response: {
                        text: LearnMoreContent[opt.learnMore] || "Happy to share more — what would you like to know?",
                        quickReplies: [
                            { id: currentScreen, label: "⬅️ Back" },
                            { id: "main_menu", label: "🏠 Main Menu" }
                        ]
                    }
                };
            }

            if (opt.askOpen) {
                return {
                    userLabel: opt.label,
                    response: { text: "No problem! 👍<br><br>Tell me what you're trying to accomplish and I'll help you choose the right solution." }
                };
            }

            if (opt.terminal) {
                context.setField('projectTypes', [opt.projectType]);
                context.additionalNotes += `Project Type: ${opt.projectType}\n`;
                // Bridges into the existing, already-tested budget/timeline
                // engine — this is the hand-off point from the new
                // button-tree system into the established flow.
                return { userLabel: opt.label, response: ResponseGenerator.generateBudgetConversation(context) };
            }

            return { userLabel: opt.label, response: { text: "Let's continue." } };
        }
    };

    const LocalConversationEngine = {
        handleMessage: function(message, context) {

            // Chat commands take priority over everything else — they must
            // work from any conversation state, per spec.
            const command = ChatCommands.detect(message);
            if (command === "restart") {
                context.reset();
                return ResponseGenerator.generateWelcome();
            }
            if (command === "cancel") {
                context.reset();
                return {
                    text: "No problem, cancelled. 👍 What would you like to do instead?",
                    options: [
                        { text: "🌐 Website", value: "website" },
                        { text: "🎨 Design", value: "graphics" },
                        { text: "🤖 AI", value: "ai" },
                        { text: "⚙️ Automation", value: "automation" },
                        { text: "💻 Training", value: "training" }
                    ]
                };
            }
            if (command === "back") {
                const reverted = context.undoLastField();
                if (!reverted) {
                    return {
                        text: "There's nothing to go back to just yet — we're at the start of the conversation. What would you like to do?",
                        options: [
                            { text: "🌐 Website", value: "website" },
                            { text: "🎨 Design", value: "graphics" },
                            { text: "🤖 AI", value: "ai" }
                        ]
                    };
                }
                context.updateConfidence();
                // Re-ask whatever question corresponds to the field we just
                // reverted, by re-running the normal flow with an empty nudge.
                return this.handleMessage("", context);
            }
            if (command === "menu") {
                return ResponseGenerator.generateWelcome();
            }

            // Social/conversational moments — checked before intent
            // detection so "thanks", "bye", etc. never get mistaken for
            // service input.
            const socialType = SocialHandler.detect(message, context);
            if (socialType) {
                context.consecutiveFallbacks = 0;
                return SocialHandler.respond(socialType, context);
            }

            // Frustration — de-escalate rather than push forward with
            // more questions. Checked early so it takes priority over
            // whatever field might currently be pending.
            if (FrustrationDetector.detect(message)) {
                context.consecutiveFallbacks = 0;
                return {
                    text: "I understand. Let's simplify it. 👍<br><br>Tell me what you're trying to accomplish, and I'll help you from there."
                };
            }

            // Hiring/commitment language with no named service — route
            // straight into project mode instead of falling through to
            // the generic fallback.
            if (!context.serviceType && StartProjectDetector.detect(message)) {
                context.consecutiveFallbacks = 0;
                return {
                    text: "🚀 Awesome!<br><br>Let's get the important details together so your project request is clear.<br><br>First, what service do you need?",
                    options: [
                        { text: "🌐 Website", value: "website" },
                        { text: "🎨 Graphic Design", value: "graphics" },
                        { text: "🤖 AI", value: "ai" },
                        { text: "⚙️ Automation", value: "automation" },
                        { text: "💻 Training", value: "training" }
                    ]
                };
            }

            // Correction — visitor changing their mind mid-flow. Only
            // applies once we actually have a project type to correct;
            // otherwise "actually I want X" is just their first answer,
            // handled normally below.
            if (context.serviceType && context.projectTypes.length > 0) {
                const correction = CorrectionDetector.detect(message);
                if (correction) {
                    const oldValue = context.projectTypes[context.projectTypes.length - 1];
                    context.setField('projectTypes', [correction]);
                    context.additionalNotes += `Updated project type: ${correction} (was: ${oldValue})\n`;
                    context.consecutiveFallbacks = 0;

                    if (!context.budget) {
                        return {
                            text: `No problem! 👍 I'll update the project from ${escapeHtmlSafe(oldValue)} to ${escapeHtmlSafe(correction)}.<br><br>Let's continue — what's your budget range?`,
                            options: [
                                { text: "Starter (₦50K-200K)", value: "starter" },
                                { text: "Standard (₦200K-500K)", value: "standard" },
                                { text: "Premium (₦500K+)", value: "premium" }
                            ]
                        };
                    }
                    return {
                        text: `No problem! 👍 I'll update the project from ${escapeHtmlSafe(oldValue)} to ${escapeHtmlSafe(correction)}.<br><br>Everything else stays as-is. Anything else to adjust?`
                    };
                }
            }

            const intent = IntentDetector.detect(message, context);
            
            // Extract any useful data from message
            ContextExtractor.extractFromMessage(message, context);
            context.updateConfidence();

            // A concrete intent (or already being mid-flow) means this
            // turn wasn't a failed/unclear exchange — reset the fallback
            // streak so escalation only triggers on genuinely consecutive
            // confusion, not stale counts from earlier in the conversation.
            if (intent.type !== "unclear" || context.serviceType) {
                context.consecutiveFallbacks = 0;
            }

            // Handle multi-service interest — per spec, don't force a
            // choice between them. The first detected service becomes the
            // one we ask structured questions about (the architecture
            // only runs one guided flow at a time), but every service
            // mentioned is kept and will appear in the final project
            // brief — nothing gets silently dropped.
            if (intent.type === "multi-service") {
                const [primary, ...rest] = intent.services;
                context.setField('serviceType', primary);
                context.setField('additionalServices', rest);
                rest.forEach(s => {
                    context.additionalNotes += `Also interested in: ${KnowledgeBase.services[s].name}\n`;
                });

                const serviceList = intent.services
                    .map(s => `${KnowledgeBase.services[s].emoji} ${KnowledgeBase.services[s].name}`)
                    .join("<br>");

                return {
                    text: `Absolutely. 🚀<br><br>It sounds like you need:<br><br>${serviceList}<br><br>We can keep both in the same project request.<br><br>${KnowledgeBase.services[primary].questions[0]}`
                };
            }

            // Handle service selection
            if (intent.type in KnowledgeBase.services) {
                if (context.serviceType !== intent.type) {
                    context.setField('serviceType', intent.type);
                    return ResponseGenerator.generateServiceConfirmation(intent.type, context);
                }
            }

            // Handle pricing questions — service-aware if we already know
            // what they're building, otherwise the general FAQ answer.
            if (intent.type === "pricing") {
                const pricingFaq = KnowledgeBase.faq.find(f => f.question === "How much does a project cost?").answer;

                if (context.serviceType) {
                    const svc = KnowledgeBase.services[context.serviceType];
                    const tierNote = context.budget && svc.timelineRealistic[context.budget]
                        ? ` For a ${context.budget} ${svc.name} project, you're typically looking at ${svc.timelineRealistic[context.budget]} of turnaround.`
                        : "";
                    return {
                        text: `Since we're talking about ${svc.emoji} ${svc.name} — ${pricingFaq}${tierNote}`,
                        actions: [
                            { type: "button", text: "📝 Continue my project details", callback: "askAnotherQuestion" }
                        ]
                    };
                }

                return {
                    text: pricingFaq + "<br><br>To give you a more accurate quote, I'd need to understand your project scope. Ready to tell me more?",
                    actions: [
                        { type: "button", text: "📝 Let's discuss my project", callback: "askAnotherQuestion" }
                    ]
                };
            }

            // Handle portfolio questions
            if (intent.type === "portfolio") {
                return {
                    text: `Absolutely! ${ResponseGenerator.getPersonalityPhrase('encouraging')} Our portfolio section has examples across all our services. Each shows real results from real clients.<br><br>After you check those out, I'd love to discuss your specific project. What are you building?`,
                    actions: [
                        { type: "button", text: "✨ Ready to talk about my project", callback: "askAnotherQuestion" }
                    ]
                };
            }

            // General FAQ questions — answered without derailing whatever
            // field we might currently be collecting. Requires a fairly
            // confident match (score >= 2) so it doesn't accidentally
            // swallow a short, legitimate flow answer like "2 weeks" or
            // "starter". After answering, the user is still expected to
            // answer the pending question on their next message.
            const faqMatch = FAQEngine.search(message);
            if (faqMatch && faqMatch.score >= 2) {
                context.consecutiveFallbacks = 0;
                const pendingNudge = context.serviceType && !context.timeline
                    ? "<br><br>Whenever you're ready, let's get back to your project details."
                    : "";
                return { text: faqMatch.entry.answer + pendingNudge };
            }

            // If in a service flow, progressively collect info
            if (context.serviceType) {
                if (context.projectTypes.length === 0) {
                    if (message.trim() !== "") {
                        context.setField('projectTypes', [...context.projectTypes, message]);
                        context.additionalNotes += `Project Type: ${message}\n`;
                    }
                    const resp = ResponseGenerator.generateBudgetConversation(context);
                    context.lastBotQuestion = resp.text;
                    return resp;
                }

                if (!context.budget) {
                    const budgetMatch = message.toLowerCase().match(/starter|standard|premium|flexible|not sure/i);
                    if (budgetMatch) {
                        context.setField('budget', budgetMatch[0]);
                    }
                    const resp = ResponseGenerator.generateBudgetConversation(context);
                    context.lastBotQuestion = resp.text;
                    return resp;
                }

                if (!context.timeline) {
                    if (message.trim() !== "") {
                        context.setField('timeline', message);
                        context.additionalNotes += `Timeline: ${message}\n`;
                        context.updateConfidence();
                    }

                    // Cross-sell is now an informational note only, not
                    // clickable options — offering "🤖 AI Solutions" as a
                    // button here would route through the same
                    // service-switch logic used for a fresh service
                    // choice, silently overwriting this now-complete
                    // website data (projectTypes/budget/timeline) without
                    // resetting it first. Fixing that properly means
                    // building real multi-service data collection, which
                    // is out of scope right now — so cross-sell stays as
                    // a mention, and the primary "Looks Good" confirmation
                    // (required by this spec) always gets shown.
                    const crossSell = ResponseGenerator.generateCrossSell(context.serviceType, context);
                    const crossSellNote = crossSell
                        ? `<br><br>${crossSell.text} You can mention it in the project notes and our team will follow up.`
                        : "";

                    return {
                        text: `Perfect! 🎯 ${ResponseGenerator.generateProjectSummary(context)}<br><br>Does everything look correct?${crossSellNote}`,
                        actions: [
                            { type: "button", text: "✅ Looks Good", callback: "confirmBrief" },
                            { type: "button", text: "✏️ Edit Details", callback: "editDetails" },
                            { type: "button", text: "🔄 Start Over", callback: "startOver" }
                        ]
                    };
                }
            }

            // Default: nothing matched. Rotate through 5 distinct fallback
            // phrasings so the visitor never sees the exact same "I don't
            // understand" twice in a row. After repeated failures,
            // escalate to the main menu + a way to reach a person, per
            // spec section 18 ("do not repeatedly ask for clarification
            // forever").
            context.consecutiveFallbacks = (context.consecutiveFallbacks || 0) + 1;

            if (context.consecutiveFallbacks >= 3) {
                context.consecutiveFallbacks = 0;
                return {
                    text: "Let's take a step back. 👍 Here's what I can help with directly:",
                    options: [
                        { text: "🌐 Website", value: "website" },
                        { text: "🎨 Design", value: "graphics" },
                        { text: "🤖 AI", value: "ai" },
                        { text: "⚙️ Automation", value: "automation" },
                        { text: "💻 Training", value: "training" }
                    ],
                    actions: [
                        { type: "button", text: "📞 Contact RS Digital Hub", callback: "goToContact" }
                    ]
                };
            }

            const variations = ResponseGenerator.generateFallbackVariations();
            return { text: variations[(context.consecutiveFallbacks - 1) % variations.length] };
        }
    };

    /* ---------------------------------------------------------------
       DOM Elements & UI Code (100% Preserved, Enhanced for UX)
       --------------------------------------------------------------- */

    const chatBtn = document.getElementById("chatButton");
    const chatBox = document.getElementById("chatBox");
    const chatClose = document.getElementById("chatClose");
    const sendBtn = document.getElementById("sendBtn");
    const userInput = document.getElementById("userInput");
    const chatBody = document.getElementById("chatBody");
    const quickAction = document.getElementById("quickAction");

    if (!chatBtn || !chatBox || !sendBtn || !userInput || !chatBody) {
        return;
    }

    let botTyping = false;

    function openChat() {
        chatBox.classList.add("open");
        chatBox.setAttribute("aria-hidden", "false");
        chatBtn.setAttribute("aria-expanded", "true");
        chatBtn.setAttribute("aria-label", "Close navigation");
        document.body.classList.add("chat-open");
        userInput.focus({ preventScroll: true });
    }

    function closeChat() {
        chatBox.style.display = "none";
        chatBox.classList.remove("open");
        chatBox.setAttribute("aria-hidden", "true");
        chatBtn.setAttribute("aria-expanded", "false");
        chatBtn.setAttribute("aria-label", "Open navigation");
        document.body.classList.remove("chat-open");
    }

    chatBtn.onclick = () => {
        const isOpen = chatBox.classList.contains("open");
        chatBox.style.display = "";
        isOpen ? closeChat() : openChat();
    };

    if (chatClose) {
        chatClose.onclick = closeChat;
    }

    document.addEventListener("keydown", (e) => {
        if (e.key === "Escape" && chatBox.classList.contains("open")) {
            closeChat();
            chatBtn.focus();
        }
    });

    const heroAiBtn = document.getElementById("heroAiBtn");
    if (heroAiBtn) {
        heroAiBtn.addEventListener("click", () => {
            chatBox.style.display = "";
            openChat();
        });
    }

    function getTime() {
        return new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    }

    function scrollToBottom() {
        chatBody.scrollTop = chatBody.scrollHeight;
    }

    function appendUserMessage(text) {
        const bubble = document.createElement("div");
        bubble.className = "user-message";
        bubble.innerHTML = `${escapeHtml(text)}<span class="message-time">${getTime()}</span>`;
        chatBody.appendChild(bubble);
        conversationContext.addHistory("user", text);
        scrollToBottom();
    }

    function appendBotMessage(html) {
        const bubble = document.createElement("div");
        bubble.className = "bot-message";
        bubble.innerHTML = `${html}<span class="message-time">${getTime()}</span>`;
        chatBody.appendChild(bubble);
        scrollToBottom();
    }

    function createQuickReplies(options) {
        return (options || []).map(o => ({ id: o.id, label: o.label }));
    }

    function renderQuickReplies(quickReplies) {
        if (!quickReplies || quickReplies.length === 0) return "";
        return `<div class="quick-replies">` +
            quickReplies
                .map(qr => `<button type="button" class="quick-reply-btn" data-action="${escapeHtmlSafe(qr.id)}" onclick="RSAI.handleQuickReply('${qr.id.replace(/'/g, "\\'")}')">${qr.label}</button>`)
                .join("") +
            `</div>`;
    }

    // Disables quick-reply buttons left over from earlier messages, so a
    // stale click on an old screen's buttons can't re-fire after the
    // conversation has moved on.
    function clearQuickReplies() {
        chatBody.querySelectorAll(".quick-reply-btn:not(:disabled)").forEach((btn) => {
            btn.disabled = true;
        });
    }

    function showMainMenu() {
        if (botTyping) return;
        conversationContext.buttonPath = [];
        appendUserMessage("🏠 Main Menu");
        showTypingThenReply(Promise.resolve(ButtonFlowEngine.renderNode("main")));
    }

    function showBackButton() {
        if (botTyping) return;
        const stack = conversationContext.buttonPath;
        stack.pop(); // leave the current screen
        const prev = stack[stack.length - 1] || "main";
        appendUserMessage("⬅️ Back");
        showTypingThenReply(Promise.resolve(ButtonFlowEngine.renderNode(prev)));
    }

    function renderBotResponse(response) {
        let html = response.text || "";

        if (response.options && Array.isArray(response.options)) {
            html += "<br><br>";
            html += response.options
                .map(opt => {
                    const val = typeof opt === "string" ? opt : opt.value || opt.text;
                    const txt = typeof opt === "string" ? opt : opt.text;
                    return `<button type="button" class="chat-option-btn" onclick="RSAI.chatOption('${val.replace(/'/g, "\\'")}')">${txt}</button>`;
                })
                .join("");
        }

        // New ID-based quick replies (button-tree menu system). Kept as a
        // visually distinct, dedicated wrapping container so they can be
        // styled/spaced independently from the older label-based options.
        if (response.quickReplies && Array.isArray(response.quickReplies) && response.quickReplies.length > 0) {
            html += "<br><br>" + renderQuickReplies(createQuickReplies(response.quickReplies));
        }

        if (response.actions && Array.isArray(response.actions)) {
            html += "<br><br>";
            html += response.actions
                .map(action => `<button type="button" class="ai-project-btn" onclick="RSAI.${action.callback}()">${action.text}</button>`)
                .join("");
        }

        clearQuickReplies();
        appendBotMessage(html);
        conversationContext.addHistory("bot", response.text);
        setLocked(false);
    }

    // The DOM-based version is no longer needed — escapeHtmlSafe (defined
    // in the logic layer above) is the single shared escaping utility,
    // used both here for message rendering and in the correction-handling
    // logic. Kept as a thin alias so existing call sites don't need to change.
    const escapeHtml = escapeHtmlSafe;

    function setLocked(locked) {
        botTyping = locked;
        sendBtn.disabled = locked;
        userInput.disabled = locked;
        quickAction?.querySelectorAll("button").forEach((btn) => { btn.disabled = locked; });
    }

    function showTypingThenReply(responsePromise) {
        const existing = document.getElementById("typing");
        if (existing) existing.remove();

        setLocked(true);

        const typing = document.createElement("div");
        typing.className = "typing";
        typing.id = "typing";
        typing.innerHTML = "<span></span><span></span><span></span>";
        chatBody.appendChild(typing);
        scrollToBottom();

        Promise.resolve(responsePromise).then((response) => {
            const el = document.getElementById("typing");
            if (el) el.remove();
            renderBotResponse(response);
        }).catch((err) => {
            console.error("Response error:", err);
            const el = document.getElementById("typing");
            if (el) el.remove();
            renderBotResponse({
                text: "Sorry, something went wrong. Let me try again.",
                nextAction: "error"
            });
            setLocked(false);
        });
    }

    async function handleMessage(message) {
        appendUserMessage(message);
        userInput.value = "";

        const responsePromise = requestAIResponse(message, conversationContext);
        showTypingThenReply(responsePromise);
    }

    /* ---------------------------------------------------------------
       AI Request Abstraction & Project Brief
       --------------------------------------------------------------- */

    const requestAIResponse = async function(userMessage, context) {
        if (!AIServiceConfig.hasBackend()) {
            return LocalConversationEngine.handleMessage(userMessage, context);
        }

        try {
            const response = await fetch(AIServiceConfig.backendURL, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    message: userMessage,
                    context: context.getContext()
                }),
                timeout: AIServiceConfig.requestTimeout
            });

            if (!response.ok) throw new Error("Backend error");
            const data = await response.json();
            return data;

        } catch (err) {
            console.error("Backend request failed, falling back to local engine:", err);
            return LocalConversationEngine.handleMessage(userMessage, context);
        }
    };

    const generateProjectBrief = function(context) {
        const serviceName = KnowledgeBase.services[context.serviceType]?.name || "Custom Project";
        const budgetValue = { starter: "50000", standard: "250000", premium: "750000" }[context.budget] || "";

        return {
            service: serviceName,
            projectTypes: context.projectTypes,
            industry: context.industry,
            features: context.features,
            budget: budgetValue,
            timeline: context.timeline,
            notes: context.additionalNotes,
            confidence: context.confidence,
            leadIntensity: context.leadIntensity,
            brief: ResponseGenerator.generateProjectSummary(context)
        };
    };

    const prefillProjectForm = function(context) {
        const brief = generateProjectBrief(context);

        const serviceSelect = document.getElementById("service");
        if (serviceSelect && brief.service) {
            for (let opt of serviceSelect.options) {
                if (opt.textContent.includes(brief.service)) {
                    serviceSelect.value = opt.value;
                    break;
                }
            }
        }

        const messageTextarea = document.getElementById("message");
        if (messageTextarea && !messageTextarea.value.trim()) {
            messageTextarea.value = brief.brief;
        }

        console.log("✅ Project brief generated:", brief);
        return brief;
    };

    /* ---------------------------------------------------------------
       Public Actions & Event Handlers
       --------------------------------------------------------------- */

    function sendMessage() {
        if (botTyping) return;
        const message = userInput.value.trim();
        if (message === "") return;
        handleMessage(message);
    }

    function chatOption(value) {
        if (botTyping) return;
        appendUserMessage(value);
        const responsePromise = requestAIResponse(value, conversationContext);
        showTypingThenReply(responsePromise);
    }

    function quickReply(service) {
        if (botTyping) return;
        conversationContext.reset();
        const message = `I'm interested in ${service}`;
        appendUserMessage(message);
        const responsePromise = requestAIResponse(service, conversationContext);
        showTypingThenReply(responsePromise);
    }

    function goToProjectForm() {
        prefillProjectForm(conversationContext);
        closeChat();
        const target = document.getElementById("project-request");
        if (target) {
            setTimeout(() => {
                target.scrollIntoView({ behavior: "smooth", block: "start" });
            }, 300);
        }
    }

    function goToContact() {
        closeChat();
        const target = document.getElementById("contact");
        if (target) {
            setTimeout(() => {
                target.scrollIntoView({ behavior: "smooth", block: "start" });
            }, 300);
        }
    }

    function confirmBrief() {
        if (botTyping) return;
        appendUserMessage("✅ Looks Good");
        renderBotResponse({
            text: "Perfect! 🚀<br><br>I've prepared your project details. I'll take you to the project request form so you can review everything before submitting it.",
            actions: [
                { type: "button", text: "🚀 Continue to Project Request", callback: "goToProjectForm" }
            ]
        });
    }

    // Routes clicks from the new ID-based button-tree menu system. The
    // actual routing decision happens in ButtonFlowEngine (pure logic,
    // tested in isolation) — this wrapper just performs the DOM side
    // effects (user bubble + typing indicator + render).
    function handleQuickReply(actionId) {
        if (botTyping) return;
        const result = ButtonFlowEngine.resolveQuickReply(actionId, conversationContext);
        appendUserMessage(result.userLabel);
        showTypingThenReply(Promise.resolve(result.response));
    }

    function askAnotherQuestion() {
        conversationContext.conversationHistory = [];
        userInput.focus();
        const welcome = ResponseGenerator.generateWelcome();
        appendBotMessage(welcome.text);
    }

    function startOver() {
        conversationContext.reset();
        chatBody.innerHTML = '';
        renderBotResponse(ButtonFlowEngine.renderNode("main"));
    }

    function editDetails() {
        appendBotMessage("No problem! Let's adjust. What would you like to change?");
        setLocked(false);
        userInput.focus();
    }

    sendBtn.onclick = sendMessage;
    userInput.addEventListener("keypress", (e) => {
        if (e.key === "Enter") {
            sendMessage();
        }
    });

    /* ---------------------------------------------------------------
       Initialization
       --------------------------------------------------------------- */

    window.RSAI = {
        chatOption,
        quickReply,
        handleQuickReply,
        showMainMenu,
        showBackButton,
        goToProjectForm,
        goToContact,
        confirmBrief,
        askAnotherQuestion,
        startOver,
        editDetails,
        getContext: () => conversationContext,
        getBrief: () => generateProjectBrief(conversationContext),
        setBackendURL: (url) => { AIServiceConfig.backendURL = url; }
    };

    window.quickReply = quickReply;

    // Show the new button-tree main menu on first load, per the
    // Button-First UX spec's welcome text.
    renderBotResponse(ButtonFlowEngine.renderNode("main"));

    // Dev-only structural check — never runs for real visitors.
    if (DEV_MODE) {
        const buttonErrors = validateButtonFlows();
        if (buttonErrors.length > 0) {
            console.warn("⚠️ Button flow validation errors:", buttonErrors);
        } else {
            console.log("✓ Button flow validation passed —", Object.keys(ButtonFlows).length, "screens,", Object.keys(optionIndex).length, "action IDs, no dead buttons.");
        }
    }

    console.log("✅ RS AI 2.0++ ENHANCED initialized. Intelligent conversation engine active. Backend-ready, local fallback active.");

})();
