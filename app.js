const pantryBase = ["oil", "salt", "pepper", "garlic", "onion", "butter", "flour", "sugar", "milk", "eggs", "bread", "lemon", "parmesan"];
const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const cuisines = ["Italian", "World", "Asian", "Middle Eastern", "American", "European", "Comfort"];
const weights = ["Light", "Medium", "Heavy"];
const efforts = ["Low effort", "Normal", "Big cooking"];
const tags = ["vegetarian", "quick", "comfort", "fried", "soup", "rice", "pasta", "meat", "spicy", "summer"];
const stores = ["No preference", "Jumbo", "AH", "Lidl"];
const profileNames = ["Gioi", "Punzel", "Guest"];
const dishNames = ["Involtini con prosciutto, pane nel latte e sottiletta", "Risotto con cumino, verdure julienne, limone, feta e pistacchi", "Fiori di zucca fritti", "Poke", "Ragu genovese", "Ragu bolognese", "Mozzarella in carrozza", "Noodles cinesi vari", "Hamburger", "Risotto agli asparagi", "Risotto alla barbabietola", "Risotto alla zucca", "Risotto ai funghi", "Risotto allo zafferano", "Risotto ricotta, noci e pere", "Spaghetti alle lenticchie", "Burrito", "Burrito bowl", "Ribollita", "Panzanella", "Pappa al pomodoro", "Insalata di riso", "Pollo e patatine in friggitrice ad aria", "Amatriciana", "Carbonara", "Parmigiana", "Pasta alla Norma", "Aglio, olio e peperoncino", "Pasta al pesto", "Pasta al pesto di rucola", "Pasta zucchine e salsiccia", "Pasta funghi e salsiccia", "Pasta al tonno", "Lasagne", "Spaghetti con polpette", "Vellutata di zucca", "Zuppa di cipolle", "Pure e stufato", "Fagioli e salsiccia", "Insalata greca", "Shawarma con salsa tahini", "Falafel e hummus", "Pollo al curry", "Cavolfiore al curry indiano", "Butter Chicken con naan", "Chicken Biryani", "Green Curry thailandese", "Katsu Curry", "Bibimbap", "Kung Pao Chicken", "Fried Rice", "Udon", "Pho", "Nasi Goreng", "Beef Rendang", "Chicken Adobo", "Enchiladas", "Jambalaya", "Chili con carne", "Feijoada", "Goulash", "Bigos", "Stamppot con salsiccia", "Polpette svedesi", "Shepherd's Pie", "Moussaka", "Iskender Kebab", "Chicken Tagine", "Koshari", "Currywurst", "Pad Krapow", "Massaman Curry", "Mapo Tofu", "Dan Dan Noodles", "Japchae", "Bulgogi", "Tom Kha Gai", "Chicken Satay", "Laksa", "Mujadara", "Menemen"];
const ingredientHints = {
  risotto: ["carnaroli rice", "stock", "white wine"],
  pasta: ["pasta", "parmesan"],
  ragu: ["minced meat", "tomato", "celery", "carrot"],
  curry: ["chicken", "coconut milk", "curry spices", "basmati rice"],
  chicken: ["chicken"],
  pollo: ["chicken"],
  noodles: ["noodles", "soy sauce", "vegetables"],
  burrito: ["tortillas", "beans", "rice", "cheese"],
  zuppa: ["stock", "vegetables"],
  insalata: ["fresh vegetables"],
  hamburger: ["burger buns", "meat", "cheese", "lettuce"],
  falafel: ["chickpeas", "tahini", "pita"],
  poke: ["sushi rice", "salmon or tofu", "avocado", "edamame"],
  lasagne: ["lasagna sheets", "bechamel", "ragu", "mozzarella"],
  parmigiana: ["eggplant", "tomato", "mozzarella"],
  mozzarella: ["mozzarella", "sandwich bread", "eggs"],
  fiori: ["zucchini flowers", "batter"],
  pho: ["rice noodles", "stock", "fresh herbs"],
  biryani: ["basmati rice", "chicken", "spices"],
  bibimbap: ["rice", "vegetables", "eggs", "gochujang"],
  bulgogi: ["beef", "soy sauce", "rice"],
  koshari: ["rice", "lentils", "chickpeas", "tomato"],
  menemen: ["eggs", "tomatoes", "peppers"],
  shawarma: ["chicken", "pita", "tahini", "salad"],
  tagine: ["chicken", "lemon", "olives", "couscous"],
  moussaka: ["eggplant", "meat", "bechamel"],
  goulash: ["beef", "paprika", "potatoes"],
  chili: ["meat", "beans", "tomato"],
  carbonara: ["spaghetti", "guanciale", "pecorino", "eggs"],
  amatriciana: ["pasta", "guanciale", "tomato", "pecorino"]
};

const $ = id => document.getElementById(id);
const sessionId = Math.random().toString(36).slice(2);
const channel = "BroadcastChannel" in window ? new BroadcastChannel("food-hydra-house") : null;
let state = loadState();

if (channel) {
  channel.onmessage = event => {
    if (event.data?.type === "state" && event.data.source !== sessionId) {
      state = normalizeState(event.data.state);
      renderAll(false);
    }
  };
}

function uid() {
  return crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2) + Date.now();
}

function todayIndex() {
  const weekday = new Intl.DateTimeFormat("en-US", { weekday: "long", timeZone: "Europe/Amsterdam" }).format(new Date());
  return Math.max(0, days.indexOf(weekday));
}

function todayName() {
  return days[todayIndex()] || "today";
}

function freshState() {
  return {
    version: 2,
    planName: "HYDRA-WEEK",
    currentUser: localStorage.getItem("foodHydraUser") || "",
    activePerson: 0,
    people: profileNames.map((name, index) => ({
      id: name.toLowerCase(),
      name,
      active: index < 2,
      cooks: index === 0,
      likes: [],
      role: index === 2 ? "visitor" : "member"
    })),
    mealSearch: "",
    ingredientInput: "",
    inspireOpen: false,
    weekChooserOpen: false,
    detailDishId: "",
    detailEditMode: false,
    storePrefs: defaultStorePrefs(),
    storeSearch: "",
    pantryToBuy: {},
    targetDay: todayIndex(),
    shoppingDaysCount: 3,
    week: days.map(day => freshDay(day)),
    history: [],
    dishes: dishNames.map((name, index) => makeDish(name, index, "Seed list"))
  };
}

function loadState() {
  const fromUrl = new URLSearchParams(location.search).get("plan");
  if (fromUrl) {
    try { return normalizeState(JSON.parse(decodeURIComponent(escape(atob(fromUrl))))); } catch {}
  }
  try { return normalizeState(JSON.parse(localStorage.getItem("foodHydraState")) || freshState()); } catch { return freshState(); }
}

function normalizeState(input) {
  const base = freshState();
  if (!input || input.version !== 2) return base;
  return {
    ...base,
    ...input,
    people: ensureProfiles(input.people || base.people),
    week: (input.week || base.week).map((day, index) => normalizeDay(day, days[index] || day.day)),
    dishes: (input.dishes || base.dishes).map(dish => ({ addedBy: "Seed list", ...dish })),
    mealSearch: input.mealSearch || "",
    ingredientInput: input.ingredientInput || "",
    inspireOpen: Boolean(input.inspireOpen),
    weekChooserOpen: Boolean(input.weekChooserOpen),
    detailDishId: input.detailDishId || "",
    detailEditMode: false,
    storePrefs: { ...defaultStorePrefs(), ...(input.storePrefs || {}) },
    storeSearch: input.storeSearch || "",
    pantryToBuy: input.pantryToBuy || {},
    targetDay: Number.isInteger(input.targetDay) ? input.targetDay : todayIndex(),
    shoppingDaysCount: Math.min(7, Math.max(1, Number(input.shoppingDaysCount || 3)))
  };
}

function defaultStorePrefs() {
  return {
    parmesan: "Jumbo",
    parmisan: "Jumbo",
    parmigiano: "Jumbo",
    pasta: "AH",
    noodles: "Lidl",
    "soy sauce": "Lidl",
    tahini: "Lidl",
    "coconut milk": "Lidl",
    rice: "AH",
    "basmati rice": "AH"
  };
}

function freshDay(day) {
  return { day, dishId: "", forcedProposalId: "", attendance: {}, cook: "", note: "", chosenBy: "", servings: 2, proposals: [], filters: emptyFilters() };
}

function normalizeDay(day, fallbackName) {
  return { ...freshDay(fallbackName), ...day, filters: { ...emptyFilters(), ...(day.filters || {}) }, proposals: (day.proposals || []).map(p => ({ votes: [], ...p })), servings: Number(day.servings) || 2 };
}

function emptyFilters() {
  return { cuisine: [], weight: [], effort: [], tags: [] };
}

function ensureProfiles(people) {
  const cleaned = people.map((person, index) => ({
    id: person.id || person.name.toLowerCase().replace(/\s+/g, "-"),
    name: person.name,
    active: person.active ?? index < 2,
    cooks: person.cooks ?? false,
    likes: person.likes || [],
    role: person.role || "member"
  }));
  profileNames.forEach((name, index) => {
    if (!cleaned.some(person => person.name === name)) {
      cleaned.splice(index, 0, { id: name.toLowerCase(), name, active: index < 2, cooks: index === 0, likes: [], role: index === 2 ? "visitor" : "member" });
    }
  });
  return cleaned;
}

function save(broadcast = true) {
  state.planName = $("planName")?.value || state.planName;
  localStorage.setItem("foodHydraState", JSON.stringify(state));
  if (state.currentUser) localStorage.setItem("foodHydraUser", state.currentUser);
  $("syncStatus").textContent = "Saved at " + new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  if (broadcast && channel) channel.postMessage({ type: "state", source: sessionId, state });
}

function currentPerson() {
  return state.people.find(person => person.name === state.currentUser) || state.people[state.activePerson] || state.people[0];
}

function avatarForName(name) {
  const key = String(name || "").toLowerCase();
  if (key === "punzel") return "assets/punzel-avatar.png";
  if (key === "gioi") return "assets/gioi-avatar.png";
  return "";
}

function nameWithAvatar(name, extraClass = "") {
  const src = avatarForName(name);
  const safeName = escapeAttr(name);
  return `<span class="avatarName ${extraClass}">${src ? `<img class="avatar" src="${src}" alt="${safeName}">` : ""}<span>${safeName}</span></span>`;
}

function formatVoters(votes = []) {
  return votes.length ? votes.map(name => nameWithAvatar(name, "tinyAvatar")).join("") : "no votes";
}

function setUser(name) {
  state.currentUser = name;
  const index = state.people.findIndex(person => person.name === name);
  if (index >= 0) state.activePerson = index;
  $("loginScreen").classList.add("hidden");
  renderAll();
}

function makeDish(name, index = 0, addedBy = currentPerson()?.name || "Seed list") {
  const lower = name.toLowerCase();
  const cuisine = detectCuisine(lower);
  return {
    id: uid(),
    name,
    cuisine,
    weight: detectWeight(lower),
    effort: detectEffort(lower),
    tags: detectTags(lower, cuisine),
    main: detectIngredients(lower, name),
    pantry: pantryBase.filter((_, i) => i % 3 === index % 3).slice(0, 5),
    favorite: true,
    times: 0,
    addedBy
  };
}

function detectCuisine(lower) {
  if (/(curry|biryani|katsu|thai|krapow|massaman|tom kha|satay|laksa|rendang|adobo|nasi|pho|udon|bibimbap|kung|mapo|dan dan|japchae|bulgogi|noodles)/.test(lower)) return "Asian";
  if (/(shawarma|falafel|hummus|tagine|koshari|mujadara|menemen|kebab)/.test(lower)) return "Middle Eastern";
  if (/(burrito|enchiladas|jambalaya|chili|hamburger)/.test(lower)) return "American";
  if (/(goulash|bigos|stamppot|svedesi|shepherd|moussaka|greca|currywurst)/.test(lower)) return "European";
  if (/(poke|feijoada)/.test(lower)) return "World";
  return "Italian";
}

function detectTags(lower, cuisine) {
  const out = [];
  if (/(risotto|riso|poke|biryani|fried rice|nasi|bibimbap|koshari)/.test(lower)) out.push("rice");
  if (/(pasta|spaghetti|lasagne|noodles|udon|pho|dan dan|japchae)/.test(lower)) out.push("pasta");
  if (/(zuppa|vellutata|ribollita|pappa|pho|tom kha|laksa)/.test(lower)) out.push("soup");
  if (/(fritti|fritta|carrozza|patatine|katsu)/.test(lower)) out.push("fried");
  if (/(pollo|chicken|manzo|beef|salsiccia|ragu|hamburger|kebab|stufato|carne|prosciutto)/.test(lower)) out.push("meat");
  if (/(curry|krapow|rendang|mapo|dan dan|shawarma|chili)/.test(lower)) out.push("spicy");
  if (/(panzanella|insalata|poke|greca)/.test(lower)) out.push("summer");
  if (!out.includes("meat")) out.push("vegetarian");
  if (/(aglio|poke|insalata|panzanella|pasta al tonno|fried rice|menemen|hamburger)/.test(lower)) out.push("quick");
  if (/(lasagne|carbonara|parmigiana|ragu|stufato|goulash|shepherd|butter|hamburger)/.test(lower)) out.push("comfort");
  if (cuisine !== "Italian") out.push("world");
  return [...new Set(out)];
}

function detectEffort(lower) {
  if (/(lasagne|ragu|genovese|biryani|rendang|tagine|parmigiana|stufato|moussaka|bigos)/.test(lower)) return "Big cooking";
  if (/(poke|aglio|insalata|panzanella|tonno|fried rice|hamburger|menemen|friggitrice)/.test(lower)) return "Low effort";
  return "Normal";
}

function detectWeight(lower) {
  if (/(fritti|carrozza|carbonara|lasagne|parmigiana|hamburger|butter|rendang|chili|salsiccia|stufato|currywurst|polpette)/.test(lower)) return "Heavy";
  if (/(insalata|poke|panzanella|vellutata|zuppa|greca|cavolfiore|pappa)/.test(lower)) return "Light";
  return "Medium";
}

function detectIngredients(lower, name) {
  const found = new Set();
  Object.entries(ingredientHints).forEach(([key, items]) => {
    if (lower.includes(key)) items.forEach(item => found.add(item));
  });
  name.split(/[, ]+/).filter(word => word.length > 5).slice(0, 3).forEach(word => found.add(word.toLowerCase()));
  return [...found].slice(0, 7);
}

function renderAll(shouldSave = true) {
  $("loginScreen").classList.toggle("hidden", Boolean(state.currentUser));
  $("planName").value = state.planName || "HYDRA-WEEK";
  renderProfile();
  renderPeople();
  renderFilters();
  renderMyPage();
  renderChoiceBuilder();
  renderWeek();
  renderWeekChooserPopup();
  renderRecommendations();
  renderIngredientAI();
  renderShopping();
  renderStorePreferences();
  renderStats();
  renderLibrary();
  renderTips();
  if (shouldSave) save();
}

function renderProfile() {
  const person = currentPerson();
  $("currentProfileLabel").innerHTML = person ? `Signed in as ${nameWithAvatar(person.name, "inlineAvatar")}` : "Signed in";
  $("profileBadge").innerHTML = person ? nameWithAvatar(person.name, "badgeAvatar") : "Guest";
  $("profileSummary").textContent = canManagePlan() ? "You can manage the plan, force dinners, edit dishes, and update store preferences." : "External user mode: you can mark availability, propose dinners, and vote, but Gioi or Punzel keep final control.";
  const chosen = state.week.filter(day => day.chosenBy === person?.name).length;
  const cooking = state.week.filter(day => day.cook === person?.name).length;
  const added = state.dishes.filter(dish => dish.addedBy === person?.name).length;
  $("personalQuickStats").innerHTML = statPill("Picked", chosen) + statPill("Cooking", cooking) + statPill("Added", added);
  $("myPageTitle").textContent = `${person?.name || "My"}'s page`;
  $("markEatenBtn").disabled = !canManagePlan();
  $("resetStoresBtn").disabled = !canManagePlan();
}

function statPill(label, value) {
  return `<span><strong>${value}</strong>${label}</span>`;
}

function renderPeople() {
  $("activePersonSelect").innerHTML = state.people.map((person, index) => `<option value="${index}" ${index === state.activePerson ? "selected" : ""}>${person.name}</option>`).join("");
  $("peopleList").innerHTML = state.people.map((person, index) => `
    <div class="personRow">
      <div class="personEdit">${nameWithAvatar(person.name)}<input data-person-name="${index}" value="${person.name}" aria-label="Person name"></div>
      <label class="toggle"><input type="checkbox" data-person-active="${index}" ${person.active ? "checked" : ""}> dinner</label>
      <span></span>
      <label class="toggle"><input type="checkbox" data-person-cooks="${index}" ${person.cooks ? "checked" : ""} ${canCook(person) ? "" : "disabled"}> ${canCook(person) ? "cooks" : "guest"}</label>
    </div>
  `).join("");
}

function canCook(person) {
  return person.id === "gioi" || person.id === "punzel";
}

function canManagePlan() {
  return canCook(currentPerson());
}

function chip(group, value) {
  const filters = selectedDay().filters;
  return `<button class="chip ${filters[group].includes(value) ? "active" : ""}" data-filter-group="${group}" data-filter-value="${value}">${value}</button>`;
}

function selectedDay() {
  return state.week[state.targetDay] || state.week[0];
}

function renderFilters() {
  $("cuisineFilters").innerHTML = cuisines.map(value => chip("cuisine", value)).join("");
  $("weightFilters").innerHTML = weights.map(value => chip("weight", value)).join("");
  $("effortFilters").innerHTML = efforts.map(value => chip("effort", value)).join("");
  $("tagFilters").innerHTML = tags.map(value => chip("tags", value)).join("");
}

function renderMyPage() {
  const person = currentPerson();
  $("myAvailability").innerHTML = state.week.map((day, index) => {
    const checked = day.attendance[person.name] ?? person.active;
    return `<button class="availabilityItem ${checked ? "isYes" : "isNo"}" data-my-attendance-toggle="${index}"><span>${day.day}</span><strong>${checked ? "YES" : "NO"}</strong></button>`;
  }).join("");
  const allLikes = [...cuisines, ...tags];
  $("myLikes").innerHTML = allLikes.map(value => `<button class="chip ${person.likes?.includes(value) ? "active" : ""}" data-like="${value}">${value}</button>`).join("");
  const myDishes = state.dishes.filter(dish => dish.addedBy === person.name);
  $("myDishes").innerHTML = myDishes.length ? myDishes.map(dish => `<p>${dish.name}</p>`).join("") : "<p>No dishes added by you yet.</p>";
  const myMeals = state.week.map(day => ({ ...day, dish: state.dishes.find(dish => dish.id === day.dishId) }))
    .filter(day => day.dish && (day.chosenBy === person.name || day.cook === person.name || (day.attendance[person.name] ?? person.active)));
  $("myMeals").innerHTML = myMeals.length ? myMeals.map(day => `<p><strong>${day.day}</strong> ${day.dish.name}${day.cook === person.name ? " · you cook" : ""}</p>`).join("") : "<p>No upcoming meals for you yet.</p>";
}

function renderChoiceBuilder() {
  $("targetDaySelect").innerHTML = state.week.map((day, index) => `<option value="${index}" ${index === state.targetDay ? "selected" : ""}>${day.day}</option>`).join("");
  $("mealSearch").value = state.mealSearch || "";
  $("inspirationPanel").classList.toggle("hidden", !state.inspireOpen);
  renderDayProposals();
}

function renderIngredientAI() {
  $("ingredientInput").value = state.ingredientInput || "";
  const matches = ingredientMatches();
  $("ingredientResults").innerHTML = matches.length
    ? matches.slice(0, 12).map(ingredientCard).join("")
    : "<article class=\"dishCard\"><h3>Write a few ingredients</h3><p class=\"mutedText\">The matcher will compare them with the dish library and suggest the strongest combinations.</p></article>";
}

function ingredientTokens() {
  return (state.ingredientInput || "").toLowerCase().split(/[,;\n]+/).map(item => item.trim()).filter(Boolean);
}

function ingredientMatches() {
  const tokens = ingredientTokens();
  if (!tokens.length) return [];
  const existing = state.dishes.map(dish => {
    const haystack = [dish.name, dish.cuisine, ...dish.tags, ...dish.main, ...dish.pantry].join(" ").toLowerCase();
    const name = dish.name.toLowerCase();
    const main = dish.main.join(" ").toLowerCase();
    const tagText = [dish.cuisine, ...dish.tags].join(" ").toLowerCase();
    const hits = tokens.filter(token => haystack.includes(token) || token.split(/\s+/).some(part => part.length > 3 && haystack.includes(part)));
    const nameHits = tokens.filter(token => name.includes(token));
    const mainHits = tokens.filter(token => main.includes(token));
    const tagHits = tokens.filter(token => tagText.includes(token));
    const score = Math.round(nameHits.length * 32 + mainHits.length * 22 + tagHits.length * 12 + hits.length * 7 + (dish.times ? 3 : 0));
    return { ...dish, invented: false, ingredientHits: [...new Set(hits)], ingredientScore: Math.min(100, score) };
  }).filter(dish => dish.ingredientHits.length);
  return [...existing, ...inventedRecipeIdeas(tokens)]
    .sort((a, b) => b.ingredientScore - a.ingredientScore || b.ingredientHits.length - a.ingredientHits.length || a.name.localeCompare(b.name));
}

function inventedRecipeIdeas(tokens) {
  const has = word => tokens.some(token => token.includes(word));
  const ideas = [];
  const protein = tokens.find(token => /(chicken|pollo|beef|tofu|eggs|egg|beans|ceci|lentils|fish|salmon|tuna)/.test(token)) || tokens[0];
  const carb = tokens.find(token => /(rice|pasta|noodle|bread|potato|tortilla|naan|couscous)/.test(token));
  const veg = tokens.find(token => /(zucchini|pepper|tomato|onion|mushroom|carrot|eggplant|spinach|asparagus|pumpkin)/.test(token));
  const creamy = tokens.find(token => /(feta|cream|cheese|yogurt|coconut|milk|butter)/.test(token));
  if (protein && carb) ideas.push(makeInventedDish(`${title(protein)} ${title(carb)} skillet`, [protein, carb, veg, creamy].filter(Boolean), ["quick", "comfort"]));
  if (has("rice") || has("riso")) ideas.push(makeInventedDish(`Fried rice with ${title(protein || veg || "vegetables")}`, [protein, "rice", veg, "soy sauce"].filter(Boolean), ["rice", "quick"]));
  if (has("pasta")) ideas.push(makeInventedDish(`Pasta with ${title(veg || protein || "pantry sauce")}`, ["pasta", veg, protein, creamy].filter(Boolean), ["pasta", "quick"]));
  if (has("coconut") || has("curry")) ideas.push(makeInventedDish(`${title(protein || veg || "vegetable")} coconut curry`, [protein, veg, "coconut milk", "curry spices"].filter(Boolean), ["spicy", "rice"]));
  ideas.push(makeInventedDish(`Clean-out-the-fridge bowl`, tokens.slice(0, 6), ["quick"]));
  return ideas;
}

function makeInventedDish(name, ingredients, extraTags) {
  return {
    id: `invented-${name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
    name,
    cuisine: "Invented",
    weight: "Medium",
    effort: ingredients.length > 5 ? "Normal" : "Low effort",
    tags: [...new Set(["invented", ...extraTags])],
    main: ingredients,
    pantry: ["oil", "salt", "pepper"],
    addedBy: "Ingredients AI",
    times: 0,
    invented: true,
    ingredientHits: ingredients,
    ingredientScore: Math.min(100, 55 + ingredients.length * 8)
  };
}

function title(value) {
  return String(value).split(" ").map(part => part.charAt(0).toUpperCase() + part.slice(1)).join(" ");
}

function ingredientCard(dish) {
  const query = encodeURIComponent(`${dish.name} recipe`);
  const openAttr = dish.invented ? "" : `data-open-dish="${dish.id}"`;
  const button = dish.invented ? `<button data-save-invented="${dish.id}">Save and propose</button>` : `<button data-plan-dish="${dish.id}">Propose for ${selectedDay().day}</button>`;
  return `<article class="dishCard clickableDish" ${openAttr}><div class="dishTop"><h3>${dish.name}</h3><span class="foodIcon">${dish.ingredientScore}</span></div><p class="mutedText">${dish.invented ? "New idea from your ingredients" : "Matched"}: ${dish.ingredientHits.join(", ")}</p><div class="meta"><span class="tag">${dish.cuisine}</span><span class="tag">${dish.effort}</span>${dish.tags.slice(0, 3).map(tag => `<span class="tag">${tag}</span>`).join("")}</div><div class="score"><span style="width:${dish.ingredientScore}%"></span></div>${button}<a class="recipeLink" href="https://www.google.com/search?q=${query}" target="_blank" rel="noreferrer">Search Google recipes</a></article>`;
}

function renderDayProposals() {
  const day = selectedDay();
  const proposals = day.proposals || [];
  $("proposalTitle").textContent = `Options for ${day.day}`;
  $("servingTag").textContent = `${day.servings} people`;
  $("dayProposals").innerHTML = proposals.length
    ? proposals.map(proposalHtml).join("")
    : "<p class=\"mutedText\">No options yet. Type a dish, use filters, or hit inspire me.</p>";
}

function proposalHtml(proposal) {
  const dish = state.dishes.find(item => item.id === proposal.dishId);
  if (!dish) return "";
  const picked = selectedDay().dishId === dish.id ? " selected" : "";
  const forced = selectedDay().forcedProposalId === proposal.id;
  const voted = (proposal.votes || []).includes(currentPerson().name);
  const forceButton = canManagePlan() ? `<button data-pick-proposal="${proposal.id}" class="${forced ? "primaryBtn" : ""}">${forced ? "UNFORCE" : "FORCE"}</button>` : "";
  return `<article class="proposalItem${picked}"><div data-open-dish="${dish.id}"><strong>${dish.name}</strong><span>proposed by ${nameWithAvatar(proposal.proposedBy, "tinyAvatar")} · ${(proposal.votes || []).length} vote${(proposal.votes || []).length === 1 ? "" : "s"}${forced ? " · forced" : ""}</span><span class="voterLine">${formatVoters(proposal.votes || [])}</span></div><button data-vote-proposal="${proposal.id}" class="${voted ? "primaryBtn" : ""}">VOTE</button>${forceButton}</article>`;
}

function plannedDishes() {
  return state.week.map(day => state.dishes.find(dish => dish.id === day.dishId)).filter(Boolean);
}

function scoreDish(dish) {
  let score = 48;
  score += Math.max(0, 18 - dish.times * 5);
  const filters = selectedDay().filters;
  score += filters.cuisine.includes(dish.cuisine) ? 20 : 0;
  score += filters.weight.includes(dish.weight) ? 12 : 0;
  score += filters.effort.includes(dish.effort) ? 12 : 0;
  score += filters.tags.filter(tag => dish.tags.includes(tag)).length * 9;
  const active = state.people[state.activePerson] || currentPerson();
  if (active?.likes?.some(like => dish.tags.includes(like) || dish.cuisine === like)) score += 14;
  if (dish.effort === "Big cooking" && state.people.filter(person => person.active && person.cooks).length === 0) score -= 24;
  if (dish.weight === "Heavy" && plannedDishes().filter(item => item.weight === "Heavy").length >= 2) score -= 18;
  return Math.max(8, Math.min(100, score));
}

function filteredDishes() {
  return state.dishes.map(dish => ({ ...dish, score: scoreDish(dish) })).filter(dish => {
    const f = selectedDay().filters;
    const q = (state.mealSearch || "").trim().toLowerCase();
    const searchable = [dish.name, dish.cuisine, dish.weight, dish.effort, dish.addedBy, ...dish.tags, ...dish.main].join(" ").toLowerCase();
    return (!q || searchable.includes(q))
      && (!f.cuisine.length || f.cuisine.includes(dish.cuisine))
      && (!f.weight.length || f.weight.includes(dish.weight))
      && (!f.effort.length || f.effort.includes(dish.effort))
      && (!f.tags.length || f.tags.every(tag => dish.tags.includes(tag)));
  }).sort((a, b) => b.score - a.score || a.times - b.times || a.name.localeCompare(b.name));
}

function renderWeek() {
  $("weekGrid").innerHTML = state.week.map((day, dayIndex) => {
    const present = state.people.map(person => attendanceControl(day, dayIndex, person)).join("");
    const cooks = cookControl(day, dayIndex);
    const dish = state.dishes.find(item => item.id === day.dishId);
    const proposals = (day.proposals || []).map(proposal => proposalHtmlForWeek(day, proposal)).join("");
    const manager = canManagePlan();
    const missing = missingCoreAnswers(day);
    return `<article class="weekCard"><div class="dayTitle"><strong>${day.day}</strong><div class="dayActions"><button data-plan-day="${dayIndex}" title="Propose dinner">Propose</button>${missing.length ? `<button class="whatsappBtn" data-remind-day="${dayIndex}">WhatsApp reminder</button>` : ""}</div></div><div class="attendance">${present}</div><div class="mealSlot"><div class="mealHeader"><span>Selected dinner</span>${dish ? `<button data-open-dish="${dish.id}" class="mealName">${dish.name}</button>` : "<span class='tag warn'>open</span>"}</div>${cooks}<label class="servingInput">People for dinner <input type="number" min="1" max="20" data-day-servings="${dayIndex}" value="${day.servings}" ${manager ? "" : "disabled"}></label><div class="meta">${day.chosenBy ? `<span class="tag">picked by ${nameWithAvatar(day.chosenBy, "tinyAvatar")}</span>` : ""}</div></div><div class="miniProposalList">${proposals || "<span class='mutedText'>No proposals yet</span>"}</div>${manager ? `<button data-clear-day="${dayIndex}" class="ghostDanger">Clear day</button>` : ""}</article>`;
  }).join("");
}

function attendanceControl(day, dayIndex, person) {
  const value = day.attendance[person.name] === undefined ? "unknown" : day.attendance[person.name] ? "yes" : "no";
  const options = [["yes", "YES"], ["no", "NO"], ["unknown", "?"]];
  return `<div class="attendanceRow"><span>${nameWithAvatar(person.name, "tinyAvatar")}</span><div class="miniSwitch">${options.map(([option, label]) => `<button class="${value === option ? "active" : ""}" data-day-attendance="${dayIndex}" data-person="${escapeAttr(person.name)}" data-attendance-value="${option}">${label}</button>`).join("")}</div></div>`;
}

function cookControl(day, dayIndex) {
  const manager = canManagePlan();
  const options = state.people.filter(canCook);
  return `<div class="cookPicker"><span>Cook</span><div class="personChips"><button class="${!day.cook ? "active" : ""}" data-day-cook-toggle="${dayIndex}" data-cook-name="" ${manager ? "" : "disabled"}>Unassigned</button>${options.map(person => `<button class="${day.cook === person.name ? "active" : ""}" data-day-cook-toggle="${dayIndex}" data-cook-name="${escapeAttr(person.name)}" ${manager ? "" : "disabled"}>${nameWithAvatar(person.name, "tinyAvatar")}</button>`).join("")}</div></div>`;
}

function missingCoreAnswers(day) {
  return state.people.filter(person => canCook(person) && day.attendance[person.name] === undefined).map(person => person.name);
}

function reminderText(day) {
  const missing = missingCoreAnswers(day);
  return `Food Hydra House reminder: ${missing.join(" and ")} still needs to say if they are coming for dinner on ${day.day}.`;
}

function renderWeekChooserPopup() {
  const box = $("weekChooserPopup");
  if (!state.weekChooserOpen) {
    box.classList.add("hidden");
    box.innerHTML = "";
    return;
  }
  const day = selectedDay();
  box.classList.remove("hidden");
  box.innerHTML = `<div class="panelTitle"><h3>Search a dish for ${day.day}</h3><button id="closeWeekChooserBtn" class="textBtn">Close</button></div><div class="choiceRow"><label>Dish idea <input id="weekMealSearch" value="${escapeAttr(state.mealSearch || "")}" placeholder="Type a dish, ingredient, cuisine, or tag"></label><label>People for dinner <input type="number" min="1" max="20" data-day-servings="${state.targetDay}" value="${day.servings}"></label></div><div class="choiceActions"><button id="weekUseTypedDishBtn" class="primaryBtn">Propose this dish</button><button id="weekInspireBtn">Farmi ispirare</button><button id="weekClearSearchBtn">Clear</button></div><div class="inspirationPanel ${state.inspireOpen ? "" : "hidden"}"><div class="panelTitle"><h3>Filters for ${day.day}</h3><button id="resetFiltersInlineBtn" class="textBtn">Reset</button></div><p class="question">Cuisine</p><div class="chipGroup">${cuisines.map(value => chip("cuisine", value)).join("")}</div><p class="question">Weight</p><div class="chipGroup">${weights.map(value => chip("weight", value)).join("")}</div><p class="question">Cooking energy</p><div class="chipGroup">${efforts.map(value => chip("effort", value)).join("")}</div><p class="question">Tags</p><div class="chipGroup">${tags.map(value => chip("tags", value)).join("")}</div></div><div class="proposalPanel"><div class="panelTitle"><h3>Proposals for ${day.day}</h3><span class="tag">${day.servings} people</span></div><div class="proposalList">${(day.proposals || []).length ? day.proposals.map(proposalHtml).join("") : "<p class='mutedText'>No proposals yet.</p>"}</div></div><div class="dishGrid">${filteredDishes().slice(0, 8).map(dishCard).join("")}</div>`;
}

function escapeAttr(value) {
  return String(value).replaceAll("&", "&amp;").replaceAll('"', "&quot;").replaceAll("<", "&lt;");
}

function proposalHtmlForWeek(day, proposal) {
  const dish = state.dishes.find(item => item.id === proposal.dishId);
  if (!dish) return "";
  const picked = day.dishId === dish.id ? " selected" : "";
  const forced = day.forcedProposalId === proposal.id;
  const voters = formatVoters(proposal.votes || []);
  const forceButton = canManagePlan() ? `<button data-pick-proposal="${proposal.id}" class="${forced ? "primaryBtn" : ""}">${forced ? "UNFORCE" : "FORCE"}</button>` : "";
  return `<article class="weekProposal${picked}"><button data-vote-proposal="${proposal.id}">VOTE</button><strong data-open-dish="${dish.id}">${dish.name}</strong><span>${(proposal.votes || []).length} vote${(proposal.votes || []).length === 1 ? "" : "s"}: ${voters}${forced ? " · forced" : ""}</span>${forceButton}</article>`;
}

function foodIcon(dish) {
  if (dish.tags.includes("pasta")) return "PA";
  if (dish.tags.includes("rice")) return "RI";
  if (dish.tags.includes("soup")) return "SO";
  if (dish.tags.includes("fried")) return "FR";
  if (dish.tags.includes("spicy")) return "SP";
  return dish.cuisine.slice(0, 2).toUpperCase();
}

function dishCard(dish) {
  return `<article class="dishCard clickableDish" data-open-dish="${dish.id}"><div class="dishTop"><h3>${dish.name}</h3><span class="foodIcon">${foodIcon(dish)}</span></div><div class="meta"><span class="tag">${dish.cuisine}</span><span class="tag">${dish.weight}</span><span class="tag">${dish.effort}</span><span class="tag">by ${dish.addedBy}</span>${dish.tags.slice(0, 4).map(tag => `<span class="tag">${tag}</span>`).join("")}</div><div class="score" title="Recommendation score"><span style="width:${dish.score || scoreDish(dish)}%"></span></div><button data-plan-dish="${dish.id}">PROPOSE + VOTE for ${selectedDay().day}</button></article>`;
}

function renderRecommendations() {
  $("recommendations").innerHTML = filteredDishes().slice(0, 18).map(dishCard).join("");
}

function listHtml(map) {
  if (!map.size) return "<p>Nothing yet. Plan a few dinners first.</p>";
  return `<ul>${[...map.entries()].sort().map(([item, count]) => `<li>${item}${count > 1 ? ` x${count}` : ""}</li>`).join("")}</ul>`;
}

function renderShopping() {
  const main = new Map();
  const pantry = new Map();
  $("todayLabel").textContent = `Today in Amsterdam: ${todayName()}`;
  document.querySelectorAll("[data-shopping-days]").forEach(button => button.classList.toggle("active", Number(button.dataset.shoppingDays) === state.shoppingDaysCount));
  shoppingDays().forEach(day => {
    const dish = winningDishForDay(day);
    if (!dish) return;
    const servings = Number(day.servings) || 1;
    dish.main.forEach(item => main.set(item, (main.get(item) || 0) + servings));
    dish.pantry.forEach(item => {
      const key = item.toLowerCase();
      const target = state.pantryToBuy[key] ? main : pantry;
      target.set(item, (target.get(item) || 0) + servings);
    });
  });
  const bestStore = bestStoreForTrip(main);
  $("shoppingList").innerHTML = `<article class="shoppingCard"><h3>Winning dinners</h3>${listHtml(new Map(shoppingDays().map(day => { const dish = winningDishForDay(day); return dish ? [`${day.day}: ${dish.name} (${day.servings} people)`, 1] : null; }).filter(Boolean)))}</article><article class="shoppingCard"><h3>Best store: ${bestStore}</h3>${listHtml(main)}</article><article class="shoppingCard"><h3>Probably already at home</h3>${pantryChecklist(pantry)}</article>`;
}

function groceryText() {
  const main = new Map();
  const pantry = new Map();
  shoppingDays().forEach(day => {
    const dish = winningDishForDay(day);
    if (!dish) return;
    const servings = Number(day.servings) || 1;
    dish.main.forEach(item => main.set(item, (main.get(item) || 0) + servings));
    dish.pantry.forEach(item => {
      const key = item.toLowerCase();
      const target = state.pantryToBuy[key] ? main : pantry;
      target.set(item, (target.get(item) || 0) + servings);
    });
  });
  const bestStore = bestStoreForTrip(main);
  const lines = [`Food Hydra House grocery list`, `Best store: ${bestStore}`, ""];
  [...main.entries()].sort().forEach(([item, count]) => lines.push(`- ${item}${count > 1 ? ` x${count}` : ""}`));
  if (pantry.size) {
    lines.push("", "Probably at home:");
    [...pantry.entries()].sort().forEach(([item, count]) => lines.push(`- ${item}${count > 1 ? ` x${count}` : ""}`));
  }
  return lines.join("\n");
}

function pantryChecklist(map) {
  if (!map.size) return "<p>Nothing here.</p>";
  return `<div class="pantryChecklist">${[...map.entries()].sort().map(([item, count]) => `<label><input type="checkbox" data-pantry-buy="${escapeAttr(item.toLowerCase())}"> add ${item}${count > 1 ? ` x${count}` : ""} to buy list</label>`).join("")}</div>`;
}

function bestStoreForTrip(items) {
  const scores = Object.fromEntries(stores.filter(store => store !== "No preference").map(store => [store, 0]));
  [...items.entries()].forEach(([item, count]) => {
    const store = storeForItem(item);
    if (store !== "No preference") scores[store] = (scores[store] || 0) + count;
  });
  const ranked = Object.entries(scores).sort((a, b) => b[1] - a[1]);
  return ranked[0]?.[1] ? ranked[0][0] : "No preference";
}

function storeForItem(item) {
  const direct = state.storePrefs[item.toLowerCase()];
  if (direct) return direct;
  const fuzzy = Object.entries(state.storePrefs).find(([key]) => item.toLowerCase().includes(key));
  return fuzzy?.[1] || "No preference";
}

function allIngredients() {
  const set = new Set();
  state.dishes.forEach(dish => [...dish.main, ...dish.pantry].forEach(item => set.add(item.toLowerCase())));
  Object.keys(defaultStorePrefs()).forEach(item => set.add(item));
  return [...set].sort();
}

function renderStorePreferences() {
  $("storeSearch").value = state.storeSearch || "";
  const q = (state.storeSearch || "").toLowerCase();
  const ingredients = allIngredients().filter(item => !q || item.includes(q));
  $("storePreferenceList").innerHTML = ingredients.map(item => `<label class="storeRow"><span>${item}</span><select data-store-item="${escapeAttr(item)}">${stores.map(store => `<option value="${store}" ${storeForItem(item) === store ? "selected" : ""}>${store}</option>`).join("")}</select></label>`).join("");
}

function winningDishForDay(day) {
  const proposals = day.proposals || [];
  const forced = proposals.find(proposal => proposal.id === day.forcedProposalId);
  if (forced) return state.dishes.find(dish => dish.id === forced.dishId);
  const sorted = proposals.slice().sort((a, b) => (b.votes || []).length - (a.votes || []).length);
  const winner = sorted.find(proposal => (proposal.votes || []).length > 0) || proposals.find(proposal => proposal.dishId === day.dishId);
  return state.dishes.find(dish => dish.id === (winner?.dishId || day.dishId));
}

function shoppingDays() {
  return state.week.slice(todayIndex(), todayIndex() + state.shoppingDaysCount);
}

function countBy(items, key) {
  return items.reduce((acc, item) => {
    acc[item[key]] = (acc[item[key]] || 0) + 1;
    return acc;
  }, {});
}

function bars(data, total) {
  const rows = Object.entries(data);
  if (!rows.length) return "<p>No data yet.</p>";
  return rows.map(([label, value]) => `<div class="barRow"><span>${label}</span><div class="bar"><span style="width:${Math.round(value / total * 100)}%"></span></div><strong>${value}</strong></div>`).join("");
}

function renderStats() {
  const planned = plannedDishes();
  const heavy = planned.filter(dish => dish.weight === "Heavy").length;
  const repeated = state.dishes.slice().sort((a, b) => b.times - a.times).slice(0, 5).filter(dish => dish.times > 0);
  const pickedBy = countBy(state.week.filter(day => day.chosenBy).map(day => ({ chosenBy: day.chosenBy })), "chosenBy");
  const cookCounts = countCookedDinners();
  const effortCounts = countEffortPoints();
  $("statsBoard").innerHTML = `<article class="statCard"><h3>Dinners chosen</h3><div class="bigNumber">${planned.length}/7</div><p>${7 - planned.length ? `${7 - planned.length} still open` : "Week complete"}</p></article><article class="statCard"><h3>Cooked dinners</h3>${bars(cookCounts, Math.max(1, ...Object.values(cookCounts)))}</article><article class="statCard"><h3>Effort-weighted cooking</h3>${bars(effortCounts, Math.max(1, ...Object.values(effortCounts)))}</article><article class="statCard"><h3>Cuisine variety</h3>${bars(countBy(planned, "cuisine"), planned.length || 1)}</article><article class="statCard"><h3>Cooking energy</h3>${bars(countBy(planned, "effort"), planned.length || 1)}</article><article class="statCard"><h3>Balance</h3><div class="bigNumber">${heavy}</div><p>heavy dinners. ${heavy > 2 ? "Maybe add a soup or salad." : "Looks manageable."}</p></article><article class="statCard"><h3>Most repeated</h3>${repeated.length ? listHtml(new Map(repeated.map(dish => [dish.name, dish.times]))) : "<p>Mark weeks as eaten to build history.</p>"}</article><article class="statCard"><h3>Picked by</h3>${bars(pickedBy, state.week.length || 1)}</article>`;
}

function effortMultiplier(effort) {
  return effort === "Big cooking" ? 3 : effort === "Normal" ? 2 : 1;
}

function countCookedDinners() {
  const counts = {};
  state.history.forEach(entry => (entry.cooked || []).forEach(item => counts[item.cook] = (counts[item.cook] || 0) + 1));
  state.week.forEach(day => {
    if (day.cook && winningDishForDay(day)) counts[day.cook] = (counts[day.cook] || 0) + 1;
  });
  return counts;
}

function countEffortPoints() {
  const counts = {};
  state.history.forEach(entry => (entry.cooked || []).forEach(item => counts[item.cook] = (counts[item.cook] || 0) + item.effortPoints));
  state.week.forEach(day => {
    const dish = winningDishForDay(day);
    if (day.cook && dish) counts[day.cook] = (counts[day.cook] || 0) + effortMultiplier(dish.effort);
  });
  return counts;
}

function renderLibrary() {
  const q = ($("dishSearch")?.value || "").toLowerCase();
  const items = state.dishes.filter(dish => !q || [dish.name, dish.cuisine, dish.weight, dish.effort, dish.addedBy, ...dish.tags].join(" ").toLowerCase().includes(q));
  $("dishLibrary").innerHTML = items.slice().sort((a, b) => a.name.localeCompare(b.name)).map(dish => dishCard({ ...dish, score: scoreDish(dish) })).join("");
}

function renderTips() {
  const planned = plannedDishes();
  const tips = [];
  if (!planned.length) tips.push("Start with two low-effort dinners and one more special weekend meal.");
  if (planned.filter(dish => dish.cuisine !== "Italian").length < 2) tips.push("Add a few world dishes so the week is not only pasta and risotto.");
  if (planned.filter(dish => dish.effort === "Low effort").length < 2) tips.push("Keep at least two low-effort dinners. Future you will be grateful.");
  if (planned.filter(dish => dish.weight === "Light").length < 2) tips.push("A lighter dinner in the middle of the week keeps the plan balanced.");
  if (state.people.filter(person => person.active).length > 1 && state.week.some(day => !day.cook)) tips.push("Assign cooks on busy days so nobody has to negotiate at the last minute.");
  $("smartTips").innerHTML = tips.slice(0, 4).map(tip => `<p>${tip}</p>`).join("");
}

function firstFreeDay() {
  return state.week.find(day => !day.dishId) || state.week[0];
}

function targetDay() {
  return state.week[state.targetDay] || firstFreeDay();
}

function assignDish(dishId, day = targetDay()) {
  if (!canManagePlan()) return;
  day.dishId = dishId;
  const proposal = (day.proposals || []).find(item => item.dishId === dishId);
  day.forcedProposalId = proposal?.id || "";
  day.chosenBy = currentPerson().name;
  renderAll();
}

function proposeDish(dishId, day = targetDay()) {
  day.proposals = day.proposals || [];
  if (!day.proposals.some(proposal => proposal.dishId === dishId)) {
    day.proposals.push({ id: uid(), dishId, proposedBy: currentPerson().name, votes: [currentPerson().name], createdAt: new Date().toISOString() });
  }
  renderAll();
}

function voteProposal(proposalId) {
  const day = state.week.find(item => (item.proposals || []).some(proposal => proposal.id === proposalId));
  if (!day) return;
  const proposal = day.proposals.find(item => item.id === proposalId);
  const voter = currentPerson().name;
  proposal.votes = proposal.votes || [];
  if (proposal.votes.includes(voter)) {
    proposal.votes = proposal.votes.filter(name => name !== voter);
  } else {
    day.proposals.forEach(item => item.votes = (item.votes || []).filter(name => name !== voter));
    proposal.votes.push(voter);
  }
  const winner = winningDishForDay(day);
  if (winner) {
    day.dishId = winner.id;
    day.chosenBy = "votes";
  }
  renderAll();
}

function pickProposal(proposalId) {
  if (!canManagePlan()) return;
  const day = state.week.find(item => (item.proposals || []).some(proposal => proposal.id === proposalId));
  if (!day) return;
  const proposal = day.proposals.find(item => item.id === proposalId);
  if (day.forcedProposalId === proposalId) {
    day.forcedProposalId = "";
    const winner = winningDishForDay(day);
    day.dishId = winner?.id || "";
    day.chosenBy = winner ? "votes" : "";
  } else {
    day.forcedProposalId = proposalId;
    day.dishId = proposal.dishId;
    day.chosenBy = currentPerson().name;
  }
  renderAll();
}

function useTypedDish() {
  const name = (state.mealSearch || "").trim();
  if (!name) return;
  let dish = state.dishes.find(item => item.name.toLowerCase() === name.toLowerCase());
  if (!dish) {
    dish = makeDish(name, state.dishes.length, currentPerson().name);
    state.dishes.push(dish);
  }
  proposeDish(dish.id, targetDay());
}

function openDishDetail(dishId) {
  const dish = state.dishes.find(item => item.id === dishId);
  if (!dish) return;
  state.detailDishId = dishId;
  $("detailTitle").textContent = dish.name;
  $("detailOwner").textContent = `by ${dish.addedBy}`;
  $("detailName").value = dish.name;
  $("detailCuisine").value = dish.cuisine;
  $("detailWeight").innerHTML = weights.map(value => `<option value="${value}" ${dish.weight === value ? "selected" : ""}>${value}</option>`).join("");
  $("detailEffort").innerHTML = efforts.map(value => `<option value="${value}" ${dish.effort === value ? "selected" : ""}>${value}</option>`).join("");
  $("detailTags").value = dish.tags.join(", ");
  $("detailMain").value = dish.main.join(", ");
  $("detailPantry").value = dish.pantry.join(", ");
  $("detailDay").innerHTML = state.week.map((day, index) => `<option value="${index}" ${index === state.targetDay ? "selected" : ""}>${day.day}</option>`).join("");
  state.detailEditMode = false;
  renderDetailEditMode();
  $("dishDetailDialog").showModal();
}

function renderDetailEditMode() {
  const editable = state.detailEditMode && canManagePlan();
  ["detailName", "detailCuisine", "detailWeight", "detailEffort", "detailTags", "detailMain", "detailPantry"].forEach(id => {
    $(id).disabled = !editable;
  });
  $("detailEditBtn").classList.toggle("hidden", editable || !canManagePlan());
  $("detailSaveBtn").classList.toggle("hidden", !editable);
  $("detailPlanBtn").classList.toggle("hidden", !canManagePlan());
}

function saveDishDetail() {
  if (!canManagePlan()) return;
  const dish = state.dishes.find(item => item.id === state.detailDishId);
  if (!dish) return;
  dish.name = $("detailName").value.trim() || dish.name;
  dish.cuisine = $("detailCuisine").value.trim() || dish.cuisine;
  dish.weight = $("detailWeight").value;
  dish.effort = $("detailEffort").value;
  dish.tags = $("detailTags").value.split(",").map(value => value.trim()).filter(Boolean);
  dish.main = $("detailMain").value.split(",").map(value => value.trim()).filter(Boolean);
  dish.pantry = $("detailPantry").value.split(",").map(value => value.trim()).filter(Boolean);
}

function detailDay() {
  state.targetDay = Number($("detailDay").value);
  return state.week[state.targetDay];
}

function suggestForDay(dayIndex) {
  const used = new Set(state.week.map(day => day.dishId).filter(Boolean));
  const pick = filteredDishes().find(dish => !used.has(dish.id)) || filteredDishes()[0] || state.dishes[0];
  if (!state.week[dayIndex].cook) state.week[dayIndex].cook = state.people.find(person => person.active && person.cooks)?.name || "";
  proposeDish(pick.id, state.week[dayIndex]);
}

function inspireForSelectedDay() {
  state.mealSearch = "";
  state.inspireOpen = true;
  state.weekChooserOpen = true;
  renderAll();
}

function encodedState() {
  save(false);
  return btoa(unescape(encodeURIComponent(JSON.stringify(state))));
}

async function copyText(text) {
  await navigator.clipboard.writeText(text);
  $("syncStatus").textContent = "Copied to clipboard";
}

document.addEventListener("click", event => {
  const dishOpener = event.target.closest("[data-open-dish]");
  const clickedButton = event.target.closest("button");
  const clickedLink = event.target.closest("a");
  if (dishOpener && !clickedButton && !clickedLink) {
    openDishDetail(dishOpener.dataset.openDish);
    return;
  }
  const target = event.target.closest("button");
  if (!target) return;
  if (target.dataset.login) setUser(target.dataset.login);
  if (target.dataset.openDish) {
    openDishDetail(target.dataset.openDish);
    return;
  }
  if (target.dataset.filterGroup) {
    const group = target.dataset.filterGroup;
    const value = target.dataset.filterValue;
    const filters = selectedDay().filters;
    const list = filters[group];
    filters[group] = list.includes(value) ? list.filter(item => item !== value) : [...list, value];
    renderAll();
  }
  if (target.dataset.like) {
    const person = currentPerson();
    person.likes = person.likes || [];
    person.likes = person.likes.includes(target.dataset.like) ? person.likes.filter(item => item !== target.dataset.like) : [...person.likes, target.dataset.like];
    renderAll();
  }
  if (target.dataset.shoppingDays) {
    state.shoppingDaysCount = Number(target.dataset.shoppingDays);
    renderAll();
  }
  if (target.dataset.myAttendanceToggle) {
    const day = state.week[Number(target.dataset.myAttendanceToggle)];
    const person = currentPerson();
    const current = day.attendance[person.name] ?? person.active;
    day.attendance[person.name] = !current;
    renderAll();
  }
  if (target.dataset.dayAttendance) {
    const day = state.week[Number(target.dataset.dayAttendance)];
    const value = target.dataset.attendanceValue;
    if (value === "unknown") delete day.attendance[target.dataset.person];
    else day.attendance[target.dataset.person] = value === "yes";
    renderAll();
  }
  if (target.dataset.dayCookToggle) {
    if (!canManagePlan()) return;
    state.week[Number(target.dataset.dayCookToggle)].cook = target.dataset.cookName;
    renderAll();
  }
  if (target.dataset.remindDay) {
    const message = reminderText(state.week[Number(target.dataset.remindDay)]);
    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, "_blank");
  }
  if (target.dataset.planDay) {
    state.targetDay = Number(target.dataset.planDay);
    state.inspireOpen = true;
    state.weekChooserOpen = true;
    renderAll();
  }
  if (target.dataset.planDish) {
    event.stopPropagation();
    proposeDish(target.dataset.planDish, targetDay());
    return;
  }
  if (target.dataset.saveInvented) {
    const idea = ingredientMatches().find(dish => dish.id === target.dataset.saveInvented);
    if (idea) {
      const dish = { ...idea, id: uid(), addedBy: currentPerson().name, invented: false, ingredientScore: undefined, ingredientHits: undefined };
      state.dishes.push(dish);
      proposeDish(dish.id, targetDay());
    }
    return;
  }
  if (target.dataset.voteProposal) voteProposal(target.dataset.voteProposal);
  if (target.dataset.pickProposal) pickProposal(target.dataset.pickProposal);
  if (target.dataset.suggestDay) suggestForDay(Number(target.dataset.suggestDay));
  if (target.dataset.clearDay) {
    if (!canManagePlan()) return;
    const day = state.week[Number(target.dataset.clearDay)];
    day.dishId = "";
    day.chosenBy = "";
    day.proposals = [];
    renderAll();
  }
  if (target.id === "closeWeekChooserBtn") {
    state.weekChooserOpen = false;
    renderAll();
  }
  if (target.id === "weekUseTypedDishBtn") useTypedDish();
  if (target.id === "weekInspireBtn") {
    inspireForSelectedDay();
  }
  if (target.id === "weekClearSearchBtn") {
    state.mealSearch = "";
    renderAll();
  }
  if (target.id === "resetFiltersInlineBtn") {
    selectedDay().filters = emptyFilters();
    renderAll();
  }
});

document.addEventListener("change", event => {
  const t = event.target;
  if (t.id === "activePersonSelect") state.activePerson = Number(t.value);
  if (t.id === "targetDaySelect") state.targetDay = Number(t.value);
  if (t.dataset.personActive) state.people[Number(t.dataset.personActive)].active = t.checked;
  if (t.dataset.personCooks && canCook(state.people[Number(t.dataset.personCooks)])) state.people[Number(t.dataset.personCooks)].cooks = t.checked;
  if (t.dataset.dayDish) {
    const day = state.week[Number(t.dataset.dayDish)];
    day.dishId = t.value;
    day.chosenBy = t.value ? currentPerson().name : "";
  }
  if (t.dataset.dayCook) state.week[Number(t.dataset.dayCook)].cook = t.value;
  if (t.dataset.dayServings) state.week[Number(t.dataset.dayServings)].servings = Math.max(1, Number(t.value) || 1);
  if (t.dataset.dayAttendance) {
    const day = state.week[Number(t.dataset.dayAttendance)];
    if (t.value === "") delete day.attendance[t.dataset.person];
    else day.attendance[t.dataset.person] = t.value === "yes";
  }
  if (t.dataset.myAttendance) state.week[Number(t.dataset.myAttendance)].attendance[currentPerson().name] = t.checked;
  if (t.dataset.storeItem && canManagePlan()) state.storePrefs[t.dataset.storeItem] = t.value;
  if (t.dataset.pantryBuy) state.pantryToBuy[t.dataset.pantryBuy] = t.checked;
  renderAll();
});

document.addEventListener("input", event => {
  const t = event.target;
  if (t.dataset.personName) state.people[Number(t.dataset.personName)].name = t.value || "Person";
  if (t.id === "dishSearch") renderLibrary();
  if (t.id === "storeSearch") {
    state.storeSearch = t.value;
    renderStorePreferences();
  }
  if (t.id === "weekMealSearch") {
    state.mealSearch = t.value;
    renderWeekChooserPopup();
  }
  if (t.id === "ingredientInput") {
    state.ingredientInput = t.value;
    renderIngredientAI();
  }
  if (t.id === "mealSearch") {
    state.mealSearch = t.value;
    renderRecommendations();
  }
  if (t.id === "planName") state.planName = t.value;
  save();
});

document.querySelectorAll(".tab").forEach(tab => tab.addEventListener("click", () => {
  document.querySelectorAll(".tab,.tabPanel").forEach(item => item.classList.remove("active"));
  tab.classList.add("active");
  $(`${tab.dataset.tab}Tab`).classList.add("active");
}));

$("switchProfileBtn").addEventListener("click", () => {
  state.currentUser = "";
  localStorage.removeItem("foodHydraUser");
  $("loginScreen").classList.remove("hidden");
  save();
});
$("addPersonBtn").addEventListener("click", () => {
  const guests = state.people.filter(person => person.role === "visitor" && person.name !== "Guest").length + 1;
  state.people.push({ id: uid(), name: `Guest ${guests}`, active: true, cooks: false, likes: [], role: "visitor" });
  renderAll();
});
$("resetFiltersBtn").addEventListener("click", () => {
  selectedDay().filters = emptyFilters();
  renderAll();
});
$("saveMyPrefsBtn").addEventListener("click", () => save());
$("autoPlanBtn").addEventListener("click", () => days.forEach((_, index) => suggestForDay(index)));
$("surpriseBtn").addEventListener("click", () => proposeDish(filteredDishes()[0]?.id || state.dishes[0].id, targetDay()));
$("useTypedDishBtn").addEventListener("click", useTypedDish);
$("helpMeChooseBtn").addEventListener("click", () => {
  inspireForSelectedDay();
});
$("clearMealSearchBtn").addEventListener("click", () => {
  state.mealSearch = "";
  renderAll();
});
$("matchIngredientsBtn").addEventListener("click", () => renderIngredientAI());
$("clearIngredientsBtn").addEventListener("click", () => {
  state.ingredientInput = "";
  renderAll();
});
$("proposeIngredientBestBtn").addEventListener("click", () => {
  const best = ingredientMatches()[0];
  if (best) proposeDish(best.id, targetDay());
});
$("resetStoresBtn").addEventListener("click", () => {
  if (!canManagePlan()) return;
  state.storePrefs = defaultStorePrefs();
  renderAll();
});
$("copyShoppingBtn").addEventListener("click", () => copyText(groceryText() || "Empty list"));
$("whatsappShoppingBtn").addEventListener("click", () => {
  window.open(`https://wa.me/?text=${encodeURIComponent(groceryText())}`, "_blank");
});
$("copyCodeBtn").addEventListener("click", () => copyText(encodedState()));
$("copyLinkBtn").addEventListener("click", () => copyText(`${location.origin}${location.pathname}?plan=${encodedState()}`));
$("importCodeBtn").addEventListener("click", () => {
  const payload = prompt("Paste the shared plan code here");
  if (!payload) return;
  try {
    state = normalizeState(JSON.parse(decodeURIComponent(escape(atob(payload)))));
    renderAll();
  } catch {
    alert("That plan code is not valid.");
  }
});
$("newWeekBtn").addEventListener("click", () => {
  if (!confirm("Clear only this week while keeping people, dishes, and history?")) return;
  state.week = days.map(day => freshDay(day));
  renderAll();
});
$("markEatenBtn").addEventListener("click", () => {
  if (!canManagePlan()) return;
  const eaten = state.week.map(day => ({ day, dish: winningDishForDay(day), cook: day.cook })).filter(item => item.dish);
  eaten.forEach(item => item.dish.times += 1);
  state.history.push({ date: new Date().toISOString(), by: currentPerson().name, dishes: eaten.map(item => item.dish.name), cooked: eaten.filter(item => item.cook).map(item => ({ cook: item.cook, dish: item.dish.name, effort: item.dish.effort, effortPoints: effortMultiplier(item.dish.effort) })) });
  renderAll();
});
$("addDishBtn").addEventListener("click", () => $("dishDialog").showModal());
$("saveDishBtn").addEventListener("click", event => {
  const name = $("newDishName").value.trim();
  if (!name) return;
  event.preventDefault();
  const dish = makeDish(name, state.dishes.length, currentPerson().name);
  dish.cuisine = $("newDishCuisine").value.trim() || dish.cuisine;
  const main = $("newDishMain").value.split(",").map(value => value.trim()).filter(Boolean);
  const pantry = $("newDishPantry").value.split(",").map(value => value.trim()).filter(Boolean);
  if (main.length) dish.main = main;
  if (pantry.length) dish.pantry = pantry;
  state.dishes.push(dish);
  $("dishForm").reset();
  $("dishDialog").close();
  renderAll();
});
$("detailSaveBtn").addEventListener("click", event => {
  event.preventDefault();
  saveDishDetail();
  $("dishDetailDialog").close();
  renderAll();
});
$("detailEditBtn").addEventListener("click", event => {
  event.preventDefault();
  state.detailEditMode = true;
  renderDetailEditMode();
});
$("detailProposeBtn").addEventListener("click", event => {
  event.preventDefault();
  saveDishDetail();
  proposeDish(state.detailDishId, detailDay());
  $("dishDetailDialog").close();
});
$("detailPlanBtn").addEventListener("click", event => {
  event.preventDefault();
  saveDishDetail();
  assignDish(state.detailDishId, detailDay());
  $("dishDetailDialog").close();
});

renderAll(false);
