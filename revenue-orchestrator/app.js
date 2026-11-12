const $ = (selector) => document.querySelector(selector);
const form = $("#intakeForm");
const result = $("#result");
const serviceSelect = $("#service");
const scopeField = $("#scope");
$("#year").textContent = new Date().getFullYear();

function openApp(service) {
  if (service) serviceSelect.value = service;
  $("#app").scrollIntoView({ behavior: "smooth", block: "start" });
  setTimeout(() => form.elements.name.focus({ preventScroll: true }), 450);
}
document.querySelectorAll("[data-open-app]").forEach((button) => button.addEventListener("click", () => openApp()));
document.querySelectorAll("[data-service]").forEach((button) => button.addEventListener("click", () => openApp(button.dataset.service)));

const welcome = "Welcome to DVA Studio! I can help you scope creative design, websites, cybersecurity visual diagrams, or AI workflow concepts. What are you looking to create?";
$("#speakWelcome").addEventListener("click", () => speak(welcome));

function speak(message) {
  if (!("speechSynthesis" in window)) {
    $("#voiceStatus").textContent = "Text-to-speech is not available in this browser.";
    return;
  }
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(message);
  utterance.rate = 0.96;
  window.speechSynthesis.speak(utterance);
}

$("#voiceInput").addEventListener("click", () => {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  const status = $("#voiceStatus");
  if (!SpeechRecognition) {
    status.textContent = "Voice recognition is not supported here. You can type your project details instead.";
    return;
  }
  const recognition = new SpeechRecognition();
  recognition.lang = "en-US";
  recognition.interimResults = false;
  recognition.maxAlternatives = 1;
  status.textContent = "Listening… speak clearly, then pause.";
  recognition.onresult = (event) => {
    const transcript = event.results[0][0].transcript;
    scopeField.value = [scopeField.value, transcript].filter(Boolean).join(" ");
    status.textContent = "Voice notes added to your project description.";
  };
  recognition.onerror = (event) => { status.textContent = "Voice input stopped: " + event.error + ". You can type instead."; };
  recognition.onend = () => { if (status.textContent === "Listening… speak clearly, then pause.") status.textContent = "Listening ended."; };
  recognition.start();
});

function classify(data) {
  const text = [data.service, data.scope, data.industry].join(" ").toLowerCase();
  const sensitiveTerms = /confidential|proprietary|secret|credential|password|access token|api key|private key|patient record|personal data|customer data|internal network|production ip|restricted data/;
  const securitySensitive = data.sensitive || sensitiveTerms.test(text);
  const technical = /cyber|security|network|automation|agent|workflow|integration|infrastructure|architecture|ai /;
  let route = "Creative services intake";
  let packageName = "Creative Project Discovery";
  if (/cybersecurity|cyber|network|security/.test(text)) {
    route = "Technical visual workflow";
    packageName = "Cyber Visual Intelligence — scope to be confirmed";
  } else if (/ai automation|automation|agent|workflow/.test(text)) {
    route = "AI & workflow automation";
    packageName = "AI Workflow Discovery — scope to be confirmed";
  } else if (/website|ux|ui|digital experience/.test(text)) {
    route = "Web & digital experience";
    packageName = "Digital Experience Discovery";
  } else if (/brand|logo|graphic|design/.test(text)) {
    route = "Brand & design workflow";
    packageName = "Brand Identity Discovery";
  } else if (technical.test(text)) {
    route = "Technical discovery";
    packageName = "Technical Project Discovery";
  }
  if (securitySensitive) route = "HUMAN REVIEW REQUIRED";
  return { route, packageName, securitySensitive };
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]);
}

let latestBrief = null;
form.addEventListener("submit", (event) => {
  event.preventDefault();
  const data = Object.fromEntries(new FormData(form).entries());
  data.sensitive = $("#sensitive").checked;
  const decision = classify(data);
  latestBrief = {
    projectId: "DVA-" + new Date().toISOString().replace(/[-:.TZ]/g, "").slice(0, 14),
    createdAt: new Date().toISOString(),
    client: { name: data.name, business: data.business || "", email: data.email },
    project: {
      service: data.service, description: data.scope, timeline: data.timeline,
      budget: data.budget, industry: data.industry || ""
    },
    orchestration: {
      route: decision.route, recommendedDiscoveryPackage: decision.packageName,
      humanReviewRequired: decision.securitySensitive,
      status: decision.securitySensitive ? "Awaiting human review" : "Discovery summary prepared"
    },
    integrations: { watsonxOrchestrate: "not connected", crm: "not connected", calendar: "not connected", invoicing: "not connected" }
  };

  result.hidden = false;
  result.innerHTML = `
    <span class="route-label ${decision.securitySensitive ? "warning-label" : ""}">${decision.securitySensitive ? "⚠ HUMAN REVIEW REQUIRED" : "✓ INTAKE CLASSIFIED"}</span>
    <h4>Project discovery summary</h4>
    <p><b>Suggested route:</b> ${escapeHtml(decision.route)}</p>
    <p><b>Starting package:</b> ${escapeHtml(decision.packageName)}</p>
    <p><b>Client:</b> ${escapeHtml(data.name)} · ${escapeHtml(data.business || "Independent client")}</p>
    <p><b>Service:</b> ${escapeHtml(data.service)}</p>
    <p><b>Timeline / budget:</b> ${escapeHtml(data.timeline)} · ${escapeHtml(data.budget)}</p>
    <p><b>Next step:</b> ${decision.securitySensitive ? "Pause automated processing. A studio representative must review the request and arrange a secure channel before any sensitive details are shared." : "A studio representative should confirm deliverables, availability, final pricing, and the proposal before work begins."}</p>
    <p><b>Demo limitation:</b> This summary is generated in your browser only. It has not been sent to DVA Studio, IBM watsonx, a CRM, calendar, or payment provider.</p>
    <div class="result-actions"><button type="button" id="copyBrief">Copy summary</button><button type="button" id="downloadBrief">Download intake JSON</button><button type="button" id="speakBrief">🔊 Read summary</button></div>`;
  $("#copyBrief").addEventListener("click", async () => {
    const text = summaryText(latestBrief);
    try { await navigator.clipboard.writeText(text); $("#copyBrief").textContent = "Copied ✓"; }
    catch { $("#copyBrief").textContent = "Copy unavailable"; }
  });
  $("#downloadBrief").addEventListener("click", () => {
    const blob = new Blob([JSON.stringify(latestBrief, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url; link.download = latestBrief.projectId + "-intake.json"; link.click();
    URL.revokeObjectURL(url);
  });
  $("#speakBrief").addEventListener("click", () => speak(summaryText(latestBrief)));
  result.scrollIntoView({ behavior: "smooth", block: "nearest" });
});

function summaryText(brief) {
  return `DVA project intake. Client: ${brief.client.name}. Business: ${brief.client.business || "Not provided"}. Service: ${brief.project.service}. Route: ${brief.orchestration.route}. Package: ${brief.orchestration.recommendedDiscoveryPackage}. Human review required: ${brief.orchestration.humanReviewRequired ? "Yes" : "No"}. Status: ${brief.orchestration.status}. Description: ${brief.project.description}`;
}

form.addEventListener("reset", () => {
  result.hidden = true;
  latestBrief = null;
  $("#voiceStatus").textContent = "Voice input depends on browser support and permission.";
});