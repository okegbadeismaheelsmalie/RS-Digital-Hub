const chatBtn = document.querySelector(".chat-button");
const chatBox = document.querySelector(".chat-box");
const sendBtn = document.getElementById("sendBtn");
const userInput = document.getElementById("userInput");
const chatBody = document.querySelector(".chat-body");
let chatState ="normal";
// Open & Close Chat
chatBtn.onclick = () => {
    chatBox.style.display =
        chatBox.style.display === "block" ? "none" : "block";
};
// Safe AI Close Button
const chatClose = document.getElementById("chatClose");
if (chatClose) {
    chatClose.onclick = () => {
        chatBox.style.display = "none";
    };
}
// Send Message
sendBtn.onclick = sendMessage;

userInput.addEventListener("keypress", function (e) {
    if (e.key === "Enter") {
        sendMessage();
    }
});

function sendMessage() {

    let message = userInput.value.trim();

    if (message === "") return;

    chatBody.innerHTML += `
<div class="user-message">

${message}

<span class="message-time">

${getTime()}

</span>

</div>
`;

    botReply(message);

    userInput.value = "";

    chatBody.scrollTop = chatBody.scrollHeight;
}
function getTime(){

return new Date().toLocaleTimeString([],{

hour:"2-digit",

minute:"2-digit"

});

}


function botReply(message) {

    message = message.toLowerCase().trim();

    let reply = "";

    // WEBSITE PROJECT FLOW
    if (chatState === "waitingForWebsiteType") {

        reply = `Awesome! A ${message} website sounds great. 👌

How many pages would you like?

• 1–5
• 6–10
• More than 10`;

        chatState = "waitingForPages";

    }
else if (chatState === "WaitingForAIType") {
    reply = `Excellent! 🚀
A ${message} solution is something we can help you build.
what would you like to do next?
🚀Start a project Request
💻Ask another question`;
    chatState = "normal";
    }
    else if (chatState === "waitingForDesignType"){
    reply = `Nice!🎨
    A ${message} design sounds great.
    Whats is the design for?
    •	Business 
    •	Personal 
    •	Event 
    •	Social media`;
    chatState = "waitingForDesignPurpose";
}
    // PAGE COUNT
    else if (chatState === "waitingForPages") {

        reply = `Perfect! 👍

How would you describe your project budget?

• Starter
• Standard
• Premium`;

        chatState = "waitingForBudget";

    }
else if (chatState === "waitingForDesignPurpose") {
    reply = `Perfect!🚀
    We have the basic details for your design project.
    You can continue by submitting your project request below.
    
    <br><br>
    
    <a href="#project-request" class="ai-project-btn">
    🚀 Start Project Request
    </a>`;
    chatState = "normal";
}
    // BUDGET
    else if (chatState === "waitingForBudget") {

        reply = `Great choice! 🚀

We have the information we need.

Ready to tell us about your project?

<br><br>

<button class="ai-project-btn" onclick="goToProjectForm()">
    🚀 Start Project Request
</button>`;


        chatState = "normal";

    }
    // AI CHATBOT
    else if (message.includes("ai chatbot")) {
        reply = `Excellent! 🚀
A ${message} solution is something we can help you build.
what would you like to do next?
<button class="ai-project-btn" onclick="goToProjectForm()">
🚀Start a project Request
</button>
<button class="ai-project-btn" onclick="askAnotherQuestion()">
💻Ask another question
</button>`;
chatState = "normal";
    }
    // NORMAL CHAT
    else if (message.includes("hello") || message.includes("hi")) {

        reply = "👋 Hello! Welcome to RS Digital Hub. How can I help you today?";

    }

    else if (message.includes("website")) {

        reply = `🌐 Excellent!

What kind of website do you need?

• Business
• Portfolio
• E-Commerce
• School`;

        chatState = "waitingForWebsiteType";

    }
    else if (
    message.includes("design") ||
    message.includes("graphic") ||
    message.includes("graphics")
) {

    reply = `🎨 Great choice!

What type of graphic design do you need?

• Logo
• Flyer
• Branding
• Social Media Design`;

    chatState = "waitingForDesignType";
}

    else if (message.includes("ai")) {

        reply = `🤖 Great Choice!
        What kind of AI solution are you looking for?

        •	AI website 
        •	AI Chatbot
        •	AI Automation 
        •	Other`; 

            chatState = "waitingForAIType";
    }

    else if (message.includes("price") || message.includes("pricing")) {

        reply = "💰 Pricing depends on your project. Tell me what you'd like to build.";

    }

    else if (message.includes("training") || message.includes("computer")) {

        reply = "💻 We provide computer training and digital skills development.";

    }

    else {

        reply = "😊 Thanks for your message. Royal Smalie will review your request and get back to you.";

    }

    // TYPING ANIMATION
    chatBody.innerHTML += `
        <div class="typing" id="typing">
            <span></span>
            <span></span>
            <span></span>
        </div>
    `;

    setTimeout(() => {

        const typing = document.getElementById("typing");

        if (typing) {
            typing.remove();
        }

        chatBody.innerHTML += `
            <div class="bot-message">

                ${reply}

                <span class="message-time">
                    ${getTime()}
                </span>

            </div>
        `;

        chatBody.scrollTop = chatBody.scrollHeight;

    }, 700);
}
function goToProjectForm() {
    window.location.href = "#projectForm"
}
function quickReply(service) {
    // Reset any previous conversation flow
    const message = "I want to know about " + service;
    
    chatBody.innerHTML += `
        <div class="user-message">
            ${message}
            <span class="message-time">
                ${getTime()}
            </span>
        </div>
    `;

    botReply(service);

    chatBody.scrollTop = chatBody.scrollHeight;
}
function askAnotherQuestion() {
chatState = "normal";

userInput.focus();

chatBody.innerHTML += `
<div class="bot-message">
Sure! 😊 What would you like to know?
<span class="message-time">
${getTime()}
</span>
</div>
`;
chatBody.scrollTop = chatBody.scrollHeight;
}
