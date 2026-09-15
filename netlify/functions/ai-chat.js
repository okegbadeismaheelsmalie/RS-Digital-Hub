/**
 * Netlify Function: AI Chatbot Backend for RS Digital Hub 👑
 * 
 * Secure server-side interface to Google Gemini API with built-in
 * RS Digital Hub agency knowledge, Royal Smalie founder info,
 * and resilient local fallback.
 */

const RS_SYSTEM_INSTRUCTION = `You are the official conversational AI assistant for RS Digital Hub 👑, an elite digital technology agency founded and led by Royal Smalie.

BRAND & IDENTITY:
- Agency Name: RS Digital Hub 👑
- Founder & Lead Solutions Architect: Royal Smalie
- Motto: "Transforming Ideas into High-Impact Digital Realities"
- Location: Nigeria (serving clients across Nigeria, Africa, and globally)
- Tone: Professional, warm, helpful, transparent, and polite. Use the 👑 crown emoji respectfully.

APPROVED SERVICES & PRICING (NIGERIAN NAIRA ₦):
Strictly adhere to these approved agency baselines. DO NOT invent unauthorized discounts or random figures:
1. 🌐 Website Development:
   - Starter: ₦50,000 - ₦75,000 (3-5 responsive pages, modern design, SEO essentials, 2-3 weeks)
   - Standard: ₦95,000 - ₦150,000 (Dynamic CMS, blog/portfolio, interactive elements, 3-4 weeks)
   - Corporate / E-Commerce: ₦150,000 - ₦300,000+ (Full payment gateway, user auth, product management, 4-6 weeks)
2. 🎨 Graphic Design & Brand Identity:
   - Starter: ₦15,000 - ₦25,000 (Vector logo, color palette, 3-5 days)
   - Standard: ₦35,000 - ₦50,000 (Complete branding guidelines, social kits, stationery, 5-7 days)
   - Premium: ₦60,000+ (Comprehensive corporate identity pack, 1-2 weeks)
3. 🤖 AI Solutions & Intelligent Chatbots:
   - Starter: ₦80,000 (Custom website FAQ bot, prompt engineering, 2-3 weeks)
   - Standard: ₦150,000 (WhatsApp/Web assistant, lead capture, integrations, 3-4 weeks)
   - Enterprise: ₦250,000+ (Autonomous workflow automation, bespoke knowledge base, 4-6 weeks)
4. 📱 Web Applications & Portals:
   - Starter: ₦120,000 (Custom tool, user dashboard, auth, 3-4 weeks)
   - Standard: ₦250,000 (Full-stack SaaS, relational database, role-based access, 4-6 weeks)
   - Complex: ₦450,000+ (Custom enterprise management platforms, 6-10 weeks)
5. 💻 Professional Computer & Digital Skills Training:
   - Starting from ₦30,000 / month (Web Development, Python, Graphic Design, Microsoft Office)
6. 🛠 Technical Maintenance & Support:
   - Starting from ₦25,000 (Security hardening, speed optimization, regular backups, bug fixes)

PAYMENT & WORKFLOW POLICY:
- 50% commitment deposit required to commence development; remaining 50% balance due upon final milestone review.
- Approved payments are processed strictly via Direct Bank Transfer (OPay / First Bank of Nigeria) through the Customer Portal.
- Clients can track progress in real-time on the Customer Dashboard (/dashboard) from SUBMITTED to COMPLETED.

CONTACT & ACTIONS:
- WhatsApp: +234 911 703 5399 (Royal Smalie direct)
- Email: okegbadeismaheelsmalie@gmail.com
- Interactive Tools: Encourage users to use the "Project Estimator" on the homepage for instant real-time cost calculation.

RESPONSE GUIDELINES:
- Keep answers concise, helpful, and formatted with bullet points where appropriate (max 2-3 short paragraphs).
- End every response with 2 or 3 relevant quick reply suggestions formatted exactly like:
  [QR: Suggestion 1 | Suggestion 2 | Suggestion 3]
`;

/**
 * Deterministic local fallback when Gemini is unavailable or key is not set.
 */
function getLocalFallback(query) {
  const q = String(query || "").toLowerCase().trim();
  let text = "";
  let quickReplies = [];

  if (q.includes("price") || q.includes("cost") || q.includes("how much") || q.includes("budget") || q.includes("rate") || q.includes("naira") || q.includes("₦")) {
    text = `At <strong>RS Digital Hub 👑</strong>, our pricing is transparent and tailored to your project scope:<br><br>
• 🌐 <strong>Website Development:</strong> Starter from ₦50,000 | Corporate/E-Commerce from ₦150,000<br>
• 🎨 <strong>Graphic Design:</strong> Logo & branding starting from ₦15,000<br>
• 🤖 <strong>AI Solutions & Chatbots:</strong> Starting from ₦80,000<br>
• 📱 <strong>Web Applications:</strong> Custom portals starting from ₦120,000<br><br>
You can also use our interactive <strong>Project Estimator</strong> on this page for an instant, real-time calculation!`;
    quickReplies = [
      { id: "Project Estimator", label: "📐 Project Estimator" },
      { id: "Start My Project", label: "🚀 Start My Project" },
      { id: "Talk to Royal Smalie", label: "👑 Talk to Royal Smalie" }
    ];
  } else if (q.includes("estimator") || q.includes("calculate") || q.includes("quote")) {
    text = `Our interactive <strong>Project Cost & Timeline Estimator</strong> is available right on this homepage! Select your service, tier, and desired features to receive an immediate transparent quote range.`;
    quickReplies = [
      { id: "estimator", label: "📐 Go to Estimator" },
      { id: "srv_web", label: "🌐 Website Development" },
      { id: "srv_graphic", label: "🎨 Graphic Design" }
    ];
  } else if (q.includes("who is") || q.includes("about") || q.includes("royal smalie") || q.includes("founder") || q.includes("owner")) {
    text = `<strong>RS Digital Hub 👑</strong> is founded and directed by <strong>Royal Smalie</strong>, a passionate digital technology creator and full-stack solutions architect based in Nigeria. We build high-impact websites, web applications, brand identities, and AI automation for clients worldwide.`;
    quickReplies = [
      { id: "srv_web", label: "🌐 View Services" },
      { id: "estimator", label: "📐 Project Estimator" },
      { id: "Talk to Royal Smalie", label: "👑 Contact Founder" }
    ];
  } else if (q.includes("pay") || q.includes("bank") || q.includes("account") || q.includes("transfer") || q.includes("invoice")) {
    text = `Payments for RS Digital Hub projects are handled securely through approved Bank Transfer (OPay / First Bank of Nigeria). A 50% commencement deposit is standard, with the balance due upon final milestone review in your Customer Dashboard.`;
    quickReplies = [
      { id: "login", label: "🔐 Customer Portal" },
      { id: "Start My Project", label: "🚀 Start Project" },
      { id: "Talk to Royal Smalie", label: "💬 Contact on WhatsApp" }
    ];
  } else if (q.includes("contact") || q.includes("whatsapp") || q.includes("phone") || q.includes("email") || q.includes("call")) {
    text = `You can reach Royal Smalie and the RS Digital Hub team directly:<br><br>
• 📱 <strong>WhatsApp:</strong> <a href="https://wa.me/2349117035399" target="_blank" rel="noopener" style="color:var(--primary,#00e5ff);">+234 911 703 5399</a><br>
• 📧 <strong>Email:</strong> okegbadeismaheelsmalie@gmail.com<br>
• 💬 <strong>Client Portal:</strong> Active 24/7 in your dashboard`;
    quickReplies = [
      { id: "Talk to Royal Smalie", label: "💬 Open WhatsApp Chat" },
      { id: "Start My Project", label: "🚀 Start Project Request" }
    ];
  } else if (q.includes("service") || q.includes("what do you do") || q.includes("offer")) {
    text = `RS Digital Hub offers 6 core digital services:<br><br>
1. 🌐 <strong>Website Development</strong> (Corporate, E-Commerce, Portfolios)<br>
2. 🎨 <strong>Graphic Design & Brand Identity</strong> (Logos, Guidelines, Social)<br>
3. 🤖 <strong>AI Solutions & Smart Chatbots</strong> (Virtual assistants, automation)<br>
4. 📱 <strong>Web Applications & Portals</strong> (Full-stack SaaS, dashboards)<br>
5. 💻 <strong>Computer & Code Training</strong> (From fundamentals to web dev)<br>
6. 🛠 <strong>Technical Support & Maintenance</strong>`;
    quickReplies = [
      { id: "srv_web", label: "🌐 Website Development" },
      { id: "srv_graphic", label: "🎨 Graphic Design" },
      { id: "srv_ai", label: "🤖 AI Solutions" }
    ];
  } else {
    text = `Welcome to <strong>RS Digital Hub 👑</strong>! We turn bold ideas into high-impact digital realities with modern web development, branding, AI automation, and custom web applications.<br><br>
How can I assist you with your project today?`;
    quickReplies = [
      { id: "Project Estimator", label: "📐 Project Estimator" },
      { id: "srv_web", label: "🌐 Explore Services" },
      { id: "Talk to Royal Smalie", label: "👑 Talk to Royal Smalie" }
    ];
  }

  return { success: true, text, quickReplies };
}

/**
 * Parses Gemini response text to extract [QR: Option 1 | Option 2] if present.
 */
function parseGeminiResponse(rawText, fallbackQuery) {
  if (!rawText) return getLocalFallback(fallbackQuery);

  let cleanText = rawText;
  let quickReplies = [];

  const qrMatch = rawText.match(/\[QR:\s*(.*?)\]/i);
  if (qrMatch && qrMatch[1]) {
    const items = qrMatch[1].split("|").map(s => s.trim()).filter(Boolean);
    quickReplies = items.slice(0, 4).map(label => ({
      id: label.replace(/^[^\w\s]+/, '').trim() || label,
      label
    }));
    cleanText = rawText.replace(/\[QR:\s*.*?\]/gi, "").trim();
  }

  // Convert basic markdown to clean HTML for the chatbot bubble
  cleanText = cleanText
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.*?)\*/g, "<em>$1</em>")
    .replace(/\n\n/g, "<br><br>")
    .replace(/\n•\s*/g, "<br>• ")
    .replace(/\n-\s*/g, "<br>• ")
    .replace(/\n/g, "<br>");

  // Ensure there are always friendly quick reply options
  if (!quickReplies || quickReplies.length === 0) {
    const fallback = getLocalFallback(fallbackQuery);
    quickReplies = fallback.quickReplies;
  }

  return {
    success: true,
    text: cleanText,
    quickReplies
  };
}

/**
 * Calls Gemini API securely using the server-side GEMINI_API_KEY environment variable.
 */
async function callGemini(userMessage, context) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || !apiKey.trim()) {
    console.warn("GEMINI_API_KEY is not configured in server environment. Using local fallback.");
    return getLocalFallback(userMessage);
  }

  // Cap message length to prevent prompt overflow
  const sanitizedMessage = String(userMessage || "").trim().substring(0, 500);
  if (!sanitizedMessage) {
    return getLocalFallback("");
  }

  const promptContents = [
    {
      role: "user",
      parts: [
        {
          text: `Context:\n- Selected Service: ${context?.service || "None"}\n- Budget Range: ${context?.budget || "Unspecified"}\n- Features: ${(context?.features || []).join(", ") || "None"}\n\nClient inquiry: "${sanitizedMessage}"`
        }
      ]
    }
  ];

  // Try modern Gemini model with abort timeout
  const modelsToTry = ["gemini-3.6-flash", "gemini-2.5-flash", "gemini-1.5-flash"];
  for (const model of modelsToTry) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 7000);

      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
      const response = await fetch(url, {
        method: "POST",
        signal: controller.signal,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          systemInstruction: {
            parts: [{ text: RS_SYSTEM_INSTRUCTION }]
          },
          contents: promptContents,
          generationConfig: {
            temperature: 0.6,
            maxOutputTokens: 1500
          }
        })
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errText = await response.text();
        console.warn(`Gemini model ${model} returned status ${response.status}:`, errText.substring(0, 100));
        continue;
      }

      const data = await response.json();
      const candidate = data.candidates?.[0];
      const replyText = candidate?.content?.parts?.[0]?.text;

      if (replyText) {
        return parseGeminiResponse(replyText, sanitizedMessage);
      }
    } catch (err) {
      console.warn(`Gemini request failed on ${model}:`, err.message);
    }
  }

  // Fall back smoothly if external API call cannot be completed
  return getLocalFallback(sanitizedMessage);
}

/**
 * Common handler for processing AI chat requests.
 */
export async function handleAiChatRequest(body) {
  const message = body?.message || "";
  const context = body?.context || {};

  if (!message || typeof message !== "string" || !message.trim()) {
    return {
      error: "Message cannot be empty."
    };
  }

  return await callGemini(message, context);
}

/**
 * Netlify Functions v2 default export (Web Request/Response API)
 */
export default async (request) => {
  if (request.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization"
      }
    });
  }

  if (request.method !== "POST") {
    return new Response(
      JSON.stringify({ error: "Method not allowed" }),
      {
        status: 405,
        headers: { "Content-Type": "application/json" }
      }
    );
  }

  try {
    const body = await request.json();
    const result = await handleAiChatRequest(body);
    const statusCode = result.error ? 400 : 200;

    return new Response(
      JSON.stringify(result),
      {
        status: statusCode,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*"
        }
      }
    );
  } catch (err) {
    console.error("Netlify AI chat error:", err.message);
    return new Response(
      JSON.stringify(getLocalFallback("")),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*"
        }
      }
    );
  }
};

/**
 * Netlify Functions v1 legacy handler compatibility
 */
export const handler = async (event) => {
  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 204,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type"
      }
    };
  }

  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ error: "Method not allowed" })
    };
  }

  try {
    const body = typeof event.body === "string" ? JSON.parse(event.body) : (event.body || {});
    const result = await handleAiChatRequest(body);
    const statusCode = result.error ? 400 : 200;

    return {
      statusCode,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*"
      },
      body: JSON.stringify(result)
    };
  } catch (err) {
    console.error("Netlify handler error:", err.message);
    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*"
      },
      body: JSON.stringify(getLocalFallback(""))
    };
  }
};
