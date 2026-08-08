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

    message = message.toLowerCase();

    let reply = "";

    if (message.includes("hello") || message.includes("hi")) {

        reply = "👋 Hello! Welcome to RS Digital Hub. How can I help you today?";

    } else if (message.includes("website")) {

        reply = `🌐Excellent!
        what kind of website do you need?
        
        * Business
        * Portfolio
        * E-Commerce
        * School`;
        chatState = "waitingForWebsiteType";

    } else if (message.includes("design")) {

        reply = "🎨 We create logos, flyers, branding and social media designs.";

    } else if (message.includes("ai")) {

        reply = "🤖 We build AI-powered solutions and smart business tools.";

    } else if (message.includes("price")) {

        reply = "💰 Pricing depends on your project. Tell me what you'd like to build.";

    } else {

        reply = "😊 Thanks for your message. Royal Smalie will review your request and get back to you.";
    message = message.toLowerCase();
    let reply = "";
    if (chatState === "waitingForWebsiteType") {

        reply = `Awesome! A ${message} website sounds great. 👌

How many pages would you like?

• 1–5
• 6–10
• More than 10`;

        chatState = "waitingForPages";

    }

    // Your other if statements continue here...

    }
    // Show typing animation
chatBody.innerHTML += `
<div class="typing" id="typing">
    <span></span>
    <span></span>
    <span></span>
</div>
`;

   setTimeout(() => {

    document.getElementById("typing").remove();

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
function quickReply(service) {

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
