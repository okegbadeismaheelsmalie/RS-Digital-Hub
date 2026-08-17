(function () {

    const chatBtn = document.getElementById("chatButton");
    const chatBox = document.getElementById("chatBox");
    const chatClose = document.getElementById("chatClose");
    const sendBtn = document.getElementById("sendBtn");
    const userInput = document.getElementById("userInput");
    const chatBody = document.getElementById("chatBody");
    const quickAction = document.getElementById("quickAction");

    // Bail out safely if the chatbot markup isn't present on this page.
    if (!chatBtn || !chatBox || !sendBtn || !userInput || !chatBody) {
        return;
    }

    let chatState = "normal";
    let botTyping = false;

    /* ---------------------------------------------------------------
       Open / Close
    --------------------------------------------------------------- */

    function openChat() {
        chatBox.classList.add("open");
        chatBox.setAttribute("aria-hidden", "false");
        chatBtn.setAttribute("aria-expanded", "true");
        userInput.focus();
    }

    function closeChat() {
        chatBox.style.display = "none";
        chatBox.classList.remove("open");
        chatBox.setAttribute("aria-hidden", "true");
        chatBtn.setAttribute("aria-expanded", "false");
    }

    chatBtn.onclick = () => {
        const isOpen = chatBox.classList.contains("open");
        chatBox.style.display = "";
        isOpen ? closeChat() : openChat();
    };

    if (chatClose) {
        chatClose.onclick = closeChat;
    }

    const heroAiBtn = document.getElementById("heroAiBtn");
    if (heroAiBtn) {
        heroAiBtn.addEventListener("click", () => {
            chatBox.style.display = "";
            openChat();
        });
    }

    /* ---------------------------------------------------------------
       Helpers
    --------------------------------------------------------------- */

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
        scrollToBottom();
    }

    function appendBotMessage(html) {
        const bubble = document.createElement("div");
        bubble.className = "bot-message";
        bubble.innerHTML = `${html}<span class="message-time">${getTime()}</span>`;
        chatBody.appendChild(bubble);
        scrollToBottom();
    }

    function escapeHtml(str) {
        const div = document.createElement("div");
        div.textContent = str;
        return div.innerHTML;
    }

    function setLocked(locked) {
        botTyping = locked;
        sendBtn.disabled = locked;
        userInput.disabled = locked;
        quickAction?.querySelectorAll("button").forEach((btn) => { btn.disabled = locked; });
    }

    function showTypingThenReply(replyHtml, nextState) {
        // Prevent duplicate typing indicators if one is already present.
        const existing = document.getElementById("typing");
        if (existing) existing.remove();

        setLocked(true);

        const typing = document.createElement("div");
        typing.className = "typing";
        typing.id = "typing";
        typing.innerHTML = "<span></span><span></span><span></span>";
        chatBody.appendChild(typing);
        scrollToBottom();

        setTimeout(() => {
            const el = document.getElementById("typing");
            if (el) el.remove();

            if (typeof nextState !== "undefined") {
                chatState = nextState;
            }

            appendBotMessage(replyHtml);
            setLocked(false);
        }, 700);
    }

    function optionButtons(options) {
        return options
            .map((opt) => `<button type="button" class="chat-option-btn" onclick="RSAI.chatOption('${opt.replace(/'/g, "\\'")}')">${opt}</button>`)
            .join("");
    }

    /* ---------------------------------------------------------------
       Conversation flows
    --------------------------------------------------------------- */

    function handleMessage(rawMessage) {
        const message = rawMessage.toLowerCase().trim();
        let reply = "";
        let nextState = "normal";

        if (chatState === "waitingForWebsiteType") {
            reply = `Awesome! A <strong>${escapeHtml(rawMessage)}</strong> website sounds great. 👌<br><br>
                How many pages would you like?<br>
                ${optionButtons(["1–5", "6–10", "More than 10"])}`;
            nextState = "waitingForPages";

        } else if (chatState === "waitingForPages") {
            reply = `Perfect! 👍<br><br>
                How would you describe your project budget?<br>
                ${optionButtons(["Starter", "Standard", "Premium"])}`;
            nextState = "waitingForBudget";

        } else if (chatState === "waitingForBudget") {
            reply = `Great choice! 🚀 We have the information we need.<br><br>
                Ready to tell us about your project?<br><br>
                <button type="button" class="ai-project-btn" onclick="RSAI.goToProjectForm()">🚀 Start Project Request</button>`;
            nextState = "normal";

        } else if (chatState === "waitingForDesignType") {
            reply = `Nice! 🎨 A <strong>${escapeHtml(rawMessage)}</strong> design sounds great.<br><br>
                What is the design for?<br>
                ${optionButtons(["Business", "Personal", "Event", "Social Media"])}`;
            nextState = "waitingForDesignPurpose";

        } else if (chatState === "waitingForDesignPurpose") {
            reply = `Perfect! 🚀 We have the basic details for your design project.<br>
                You can continue by submitting your project request below.<br><br>
                <button type="button" class="ai-project-btn" onclick="RSAI.goToProjectForm()">🚀 Start Project Request</button>`;
            nextState = "normal";

        } else if (chatState === "waitingForAIType") {
            reply = `Excellent! 🚀 A <strong>${escapeHtml(rawMessage)}</strong> solution is something we can help you build.<br><br>
                What would you like to do next?<br>
                <button type="button" class="ai-project-btn" onclick="RSAI.goToProjectForm()">🚀 Start a Project Request</button>
                <button type="button" class="ai-project-btn" onclick="RSAI.askAnotherQuestion()">💬 Ask Another Question</button>`;
            nextState = "normal";

        } else if (chatState === "waitingForTrainingConfirm") {
            if (message.includes("yes") || message.includes("start") || message.includes("sure")) {
                reply = `Great! 🚀 Let's get your training request started.<br><br>
                    <button type="button" class="ai-project-btn" onclick="RSAI.goToProjectForm()">🚀 Start Project Request</button>`;
            } else {
                reply = `No problem 😊 Feel free to ask me anything else about our training programs or other services.`;
            }
            nextState = "normal";

        } else if (message.includes("hello") || message.includes("hi")) {
            reply = "👋 Hello! Welcome to RS Digital Hub. How can I help you today?";

        } else if (message.includes("website")) {
            reply = `🌐 Excellent! What kind of website do you need?<br>
                ${optionButtons(["Business", "Portfolio", "E-Commerce", "School"])}`;
            nextState = "waitingForWebsiteType";

        } else if (message.includes("design") || message.includes("graphic")) {
            reply = `🎨 Great choice! What type of graphic design do you need?<br>
                ${optionButtons(["Logo", "Flyer", "Branding", "Social Media Design"])}`;
            nextState = "waitingForDesignType";

        } else if (message.includes("ai")) {
            reply = `🤖 Great choice! What kind of AI solution are you looking for?<br>
                ${optionButtons(["AI Website", "AI Chatbot", "AI Automation", "Other"])}`;
            nextState = "waitingForAIType";

        } else if (message.includes("price") || message.includes("pricing") || message.includes("cost")) {
            reply = "💰 Pricing depends on your project. Tell me what you'd like to build and I'll point you in the right direction.";

        } else if (message.includes("training") || message.includes("computer")) {
            reply = `💻 We provide computer training and digital skills development.<br><br>
                We can help with areas such as:<br>
                • Computer fundamentals<br>
                • Microsoft Office<br>
                • Internet &amp; digital skills<br>
                • Web development<br>
                • Programming basics<br>
                • Other digital skills<br><br>
                Would you like to start a training request?<br>
                <button type="button" class="ai-project-btn" onclick="RSAI.goToProjectForm()">🚀 Start Project Request</button>
                <button type="button" class="ai-project-btn" onclick="RSAI.askAnotherQuestion()">💬 Ask Another Question</button>`;
            nextState = "normal";

        } else {
            reply = "😊 Thanks for your message. Royal Smalie will review your request and get back to you.";
        }

        showTypingThenReply(reply, nextState);
    }

    /* ---------------------------------------------------------------
       Public actions (exposed for inline onclick handlers)
    --------------------------------------------------------------- */

    function sendMessage() {
        if (botTyping) return;

        const message = userInput.value.trim();
        if (message === "") return;

        appendUserMessage(message);
        userInput.value = "";
        handleMessage(message);
    }

    function quickReply(service) {
        if (botTyping) return;

        // Always reset conversation state before an independent quick action,
        // so a previous flow (e.g. AI) can never corrupt a new one (e.g. Training).
        chatState = "normal";

        const message = "I want to know about " + service;
        appendUserMessage(message);
        handleMessage(service);
    }

    function chatOption(value) {
        if (botTyping) return;

        appendUserMessage(value);
        handleMessage(value);
    }

    function goToProjectForm() {
        closeChat();
        const target = document.getElementById("project-request");
        if (target) {
            target.scrollIntoView({ behavior: "smooth", block: "start" });
        } else {
            window.location.hash = "project-request";
        }
    }

    function askAnotherQuestion() {
        chatState = "normal";
        userInput.focus();
        appendBotMessage("Sure! 😊 What would you like to know?");
    }

    /* ---------------------------------------------------------------
       Wire up events
    --------------------------------------------------------------- */

    sendBtn.onclick = sendMessage;

    userInput.addEventListener("keypress", (e) => {
        if (e.key === "Enter") {
            sendMessage();
        }
    });

    // Expose the functions used by inline onclick attributes (quick actions,
    // chat option buttons, and bot-generated CTA buttons).
    window.RSAI = { quickReply, chatOption, goToProjectForm, askAnotherQuestion };
    window.quickReply = quickReply;

})();

