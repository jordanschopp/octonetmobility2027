const menuButton=document.getElementById('mobileMenuButton');const navLinks=document.getElementById('navLinks');if(menuButton&&navLinks){menuButton.addEventListener('click',()=>navLinks.classList.toggle('open'))}document.querySelectorAll('.dropdown-button').forEach(button=>{button.addEventListener('click',event=>{const dropdown=event.currentTarget.closest('.dropdown');if(dropdown&&window.innerWidth<=960)dropdown.classList.toggle('open')})});document.querySelectorAll('.nav-links a').forEach(link=>{link.addEventListener('click',()=>{if(navLinks)navLinks.classList.remove('open')})});const signinPrompt=document.getElementById('signinPrompt');const loadingPanel=document.getElementById('loadingPanel');const accountDashboard=document.getElementById('accountDashboard');const accountGreeting=document.getElementById('accountGreeting');const accountSubGreeting=document.getElementById('accountSubGreeting');const emailInput=document.getElementById('email');const nameInput=document.getElementById('name');const authStatus=document.getElementById('authStatus');function getTimeGreeting(){const hour=new Date().getHours();if(hour<12)return'Good Morning';if(hour<18)return'Good Afternoon';return'Good Evening'}function cleanName(value){const name=(value||'').trim();if(!name)return'Customer';return name.split(' ')[0]}function showOnly(panel){if(signinPrompt)signinPrompt.classList.add('hidden');if(loadingPanel)loadingPanel.classList.add('hidden');if(accountDashboard)accountDashboard.classList.add('hidden');if(panel)panel.classList.remove('hidden')}function showLoading(){showOnly(loadingPanel)}function showSignedIn(userEmail,userName){const firstName=cleanName(userName||localStorage.getItem('octonet_name'));localStorage.setItem('octonet_signed_in','true');localStorage.setItem('octonet_email',userEmail||'preview@octonetmobility.com');localStorage.setItem('octonet_name',firstName);if(accountGreeting)accountGreeting.textContent=`${getTimeGreeting()}, ${firstName}!`;if(accountSubGreeting)accountSubGreeting.textContent='You are signed in to OctoNet Mobility.';showOnly(accountDashboard)}function showSignedOut(){localStorage.removeItem('octonet_signed_in');showOnly(signinPrompt)}const signinBtn=document.getElementById('signinBtn');const signoutBtn=document.getElementById('signoutBtn');const createBtn=document.getElementById('createBtn');const resetBtn=document.getElementById('resetBtn');if(signinBtn){signinBtn.addEventListener('click',()=>{const email=emailInput&&emailInput.value?emailInput.value:'preview@octonetmobility.com';const name=nameInput&&nameInput.value?nameInput.value:'Customer';showLoading();setTimeout(()=>showSignedIn(email,name),1200)})}if(signoutBtn)signoutBtn.addEventListener('click',showSignedOut);if(createBtn&&authStatus)createBtn.addEventListener('click',()=>authStatus.textContent='Create account selected. Firebase Auth can be connected when live accounts are ready.');if(resetBtn&&authStatus)resetBtn.addEventListener('click',()=>authStatus.textContent='Password reset selected. Firebase Auth can send reset emails once connected.');if(signinPrompt||accountDashboard){const signedIn=localStorage.getItem('octonet_signed_in')==='true';if(signedIn){showLoading();setTimeout(()=>showSignedIn(localStorage.getItem('octonet_email'),localStorage.getItem('octonet_name')),650)}else{showSignedOut()}}

const compatibilityTipBtn = document.getElementById("compatibilityTipBtn");
const compatibilityTip = document.getElementById("compatibilityTip");

if (compatibilityTipBtn && compatibilityTip) {
  compatibilityTipBtn.addEventListener("click", () => {
    compatibilityTip.classList.toggle("hidden");
  });
}


// Plan View Details toggles
const planDetailButtons = document.querySelectorAll('.plan-details-button');
planDetailButtons.forEach((button) => {
  button.addEventListener('click', () => {
    const targetId = button.getAttribute('aria-controls');
    const detailBox = document.getElementById(targetId);
    if (!detailBox) return;
    const isOpening = detailBox.classList.contains('hidden');
    detailBox.classList.toggle('hidden');
    button.setAttribute('aria-expanded', String(isOpening));
    button.textContent = isOpening ? 'Hide Details' : 'View Details';
  });
});


// Website Tools: device checker, savings calculator, recommendations
const deviceNameInput = document.getElementById('deviceName');
const deviceUnlocked = document.getElementById('deviceUnlocked');
const checkDeviceBtn = document.getElementById('checkDeviceBtn');
const deviceResult = document.getElementById('deviceResult');
const compatibleDevices = ['iphone xr','iphone xs','iphone 11','iphone 12','iphone 13','iphone 14','iphone 15','iphone 16','iphone 17','iphone se 2020','iphone se 2022','galaxy s20','galaxy s21','galaxy s22','galaxy s23','galaxy s24','galaxy s25','galaxy z flip','galaxy z fold','pixel 4','pixel 5','pixel 6','pixel 7','pixel 8','pixel 9','pixel fold'];
const olderDevices = ['iphone 6','iphone 7','iphone 8','galaxy s8','galaxy s9','pixel 1','pixel 2'];
if (checkDeviceBtn && deviceResult) {
  checkDeviceBtn.addEventListener('click', () => {
    const model = (deviceNameInput?.value || '').toLowerCase().trim();
    const unlocked = !!deviceUnlocked?.checked;
    let message = '';
    if (!model) message = '<strong>Enter your device first.</strong><br>Type your phone model to check eSIM compatibility.';
    else if (compatibleDevices.some(d => model.includes(d)) && unlocked) message = '<strong>Likely eSIM compatible.</strong><br>Your device appears compatible and marked as unlocked. Final compatibility depends on exact model, region, and carrier settings.';
    else if (compatibleDevices.some(d => model.includes(d))) message = '<strong>Possibly compatible.</strong><br>Your phone likely supports eSIM, but it should be carrier unlocked before using travel eSIM service.';
    else if (olderDevices.some(d => model.includes(d))) message = '<strong>Possibly unsupported.</strong><br>Older devices may not support eSIM. Check for an EID or Add eSIM option in settings.';
    else message = '<strong>Needs manual confirmation.</strong><br>Check your settings for Add eSIM or an EID number.';
    deviceResult.innerHTML = message;
    deviceResult.classList.remove('hidden');
  });
}

const calculateSavingsBtn = document.getElementById('calculateSavingsBtn');
const savingsResult = document.getElementById('savingsResult');
if (calculateSavingsBtn && savingsResult) {
  calculateSavingsBtn.addEventListener('click', () => {
    const roaming = Number(document.getElementById('roamingCost')?.value || 0);
    const days = Number(document.getElementById('travelDays')?.value || 0);
    const octo = Number(document.getElementById('octonetPrice')?.value || 0);
    const carrier = roaming * days;
    const savings = Math.max(carrier - octo, 0);
    savingsResult.innerHTML = `<strong>Traditional roaming:</strong> $${carrier.toFixed(2)} CAD<br><strong>OctoNet preview plan:</strong> $${octo.toFixed(2)} CAD<br><strong>Estimated savings:</strong> $${savings.toFixed(2)} CAD`;
    savingsResult.classList.remove('hidden');
  });
}

const recommendationResult = document.getElementById('recommendationResult');
document.querySelectorAll('.recommendation-card').forEach(card => {
  card.addEventListener('click', () => {
    if (!recommendationResult) return;
    recommendationResult.innerHTML = `<strong>${card.dataset.recommendation}</strong><br><span>This is a preview recommendation based on common travel usage patterns.</span>`;
    recommendationResult.classList.remove('hidden');
  });
});

const accountEmailLine = document.getElementById('accountEmailLine');
if (accountEmailLine && localStorage.getItem('octonet_email')) accountEmailLine.textContent = localStorage.getItem('octonet_email');

// OctoCare Website Chatbot
(function(){
  const backendURL = 'https://octocare-gemini-backend-production.up.railway.app/api/octocare-chat';
  const pricingContext = `You are OctoCare, the support assistant for OctoNet Mobility.
Use current OctoNet Mobility preview pricing only.
USA: Travel Starter 3GB/15 days $12 CAD, Travel Basic 5GB/30 days $18 CAD, Travel Plus 10GB/30 days $28 CAD, Travel Max 20GB/30 days $45 CAD, Travel Ultra 50GB/30 days $78 CAD.
Europe: Europe Starter 3GB/15 days $16 CAD, Europe Basic 5GB/30 days $25 CAD, Europe Plus 10GB/30 days $38 CAD, Europe Max 20GB/30 days $62 CAD, Europe Ultra 50GB/30 days $99 CAD.
Mexico & Caribbean: Trip Starter 3GB/15 days $19 CAD, Vacation 5GB/30 days $30 CAD, Vacation Plus 10GB/30 days $48 CAD, Vacation Max 20GB/30 days $78 CAD.
Canada Visitor: Visitor Starter 3GB/15 days $15 CAD, Visitor Basic 5GB/30 days $24 CAD, Visitor Plus 10GB/30 days $38 CAD, Visitor Max 20GB/30 days $62 CAD.
Global / World Pass: World Starter 3GB/15 days $25 CAD, World Basic 5GB/30 days $38 CAD, World Plus 10GB/30 days $58 CAD, World Max 20GB/30 days $92 CAD.
Rules: plans are data-only travel eSIM previews. No phone number, calling, texting, port-ins, or emergency calling. Pricing, taxes, coverage, hotspot support, and availability may change before launch. Keep replies short, friendly, and customer-first.`;

  const launcher = document.createElement('button');
  launcher.className = 'octocare-launcher';
  launcher.type = 'button';
  launcher.innerHTML = '✦ Ask OctoCare';
  launcher.setAttribute('aria-label','Open OctoCare chat');

  const chat = document.createElement('aside');
  chat.className = 'octocare-chat';
  chat.setAttribute('aria-label','OctoCare chat assistant');
  chat.innerHTML = `
    <div class="octocare-head">
      <div><strong>OctoCare AI</strong><span>Travel eSIM help, plans, setup, and device checks.</span></div>
      <button class="octocare-close" type="button" aria-label="Close OctoCare">×</button>
    </div>
    <div class="octocare-messages" id="octocareMessages"></div>
    <div>
      <div class="octocare-suggestions">
        <button class="octocare-chip" type="button">What are the USA plans?</button>
        <button class="octocare-chip" type="button">Is this data-only?</button>
        <button class="octocare-chip" type="button">Which plan is best?</button>
      </div>
      <div class="octocare-disclaimer">Preview assistant. Final service details may change before launch.</div>
      <form class="octocare-form" id="octocareForm">
        <input class="octocare-input" id="octocareInput" placeholder="Ask about plans, setup, or devices..." autocomplete="off" />
        <button class="octocare-send" type="submit">Ask</button>
      </form>
    </div>`;
  document.body.appendChild(launcher);
  document.body.appendChild(chat);

  const messages = chat.querySelector('#octocareMessages');
  const form = chat.querySelector('#octocareForm');
  const input = chat.querySelector('#octocareInput');
  const close = chat.querySelector('.octocare-close');

  function addBubble(text, role='bot') {
    const bubble = document.createElement('div');
    bubble.className = `octocare-bubble ${role}`;
    bubble.textContent = text;
    messages.appendChild(bubble);
    messages.scrollTop = messages.scrollHeight;
  }
  function openChat(){
    chat.classList.add('open');
    launcher.style.display = 'none';
    setTimeout(()=>input.focus(), 80);
    if (!messages.dataset.started) {
      addBubble('Hi, I’m OctoCare. Ask me about OctoNet plans, travel eSIMs, setup, device compatibility, or support.');
      messages.dataset.started = 'true';
    }
  }
  function closeChat(){ chat.classList.remove('open'); launcher.style.display = 'flex'; }
  launcher.addEventListener('click', openChat);
  close.addEventListener('click', closeChat);

  async function sendQuestion(question){
    addBubble(question, 'user');
    const typing = document.createElement('div');
    typing.className = 'octocare-bubble bot';
    typing.textContent = 'OctoCare is typing...';
    messages.appendChild(typing);
    messages.scrollTop = messages.scrollHeight;
    try {
      const response = await fetch(backendURL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: `${pricingContext}\n\nCustomer question: ${question}` })
      });
      if (!response.ok) throw new Error('Bad response');
      const data = await response.json();
      typing.remove();
      addBubble(data.reply || 'OctoCare could not answer that right now.');
    } catch (error) {
      typing.remove();
      addBubble('OctoCare could not connect right now. Please try again later or contact hello.octonetmobility@gmail.com.');
    }
  }

  form.addEventListener('submit', (event)=>{
    event.preventDefault();
    const question = input.value.trim();
    if (!question) return;
    input.value = '';
    sendQuestion(question);
  });
  chat.querySelectorAll('.octocare-chip').forEach(chip=>{
    chip.addEventListener('click', ()=>sendQuestion(chip.textContent.trim()));
  });
})();
