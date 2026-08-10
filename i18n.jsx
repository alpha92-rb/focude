/* ==========================================================
   i18n.jsx — Traduction FR/EN.

   Volontairement plat (pas d'imbrication) : chaque texte est une clé
   "domaine.nom" dans un dictionnaire par langue. `t("clé")` cherche dans la
   langue active, retombe sur le français si absent, puis sur la clé
   elle-même en dernier recours (jamais un écran vide).

   Préférence stockée à part de `profile` (localStorage direct) : elle doit
   être lisible avant même qu'un compte existe, pour les écrans d'onboarding
   et de connexion.
   ========================================================== */

const LANG_KEY = "focude_lang_v1";
const LANGS = ["fr", "en"];

function detectLang() {
  try {
    const saved = localStorage.getItem(LANG_KEY);
    if (saved && LANGS.includes(saved)) return saved;
  } catch {}
  return (navigator.language || "fr").toLowerCase().startsWith("en") ? "en" : "fr";
}

let currentLang = detectLang();
const langListeners = new Set();

function setLang(l) {
  if (!LANGS.includes(l) || l === currentLang) return;
  currentLang = l;
  try { localStorage.setItem(LANG_KEY, l); } catch {}
  langListeners.forEach((fn) => fn());
}
function getLang() { return currentLang; }

function useLang() {
  const [, force] = React.useReducer((x) => x + 1, 0);
  React.useEffect(() => {
    langListeners.add(force);
    return () => langListeners.delete(force);
  }, []);
  return [currentLang, setLang];
}

const DICT = {
  fr: {
    "nav.dashboard": "Tableau de bord", "nav.pomodoro": "Pomodoro", "nav.revisions": "Répétition espacée",
    "nav.tasks": "Tâches", "nav.entreprise": "Entreprise", "nav.exams": "Examens", "nav.media": "Vidéo / Musique",
    "nav.profile": "Profil", "nav.settings": "Réglages", "nav.reset": "Réinitialiser", "nav.workspace": "Espace de travail",
    "nav.system": "Système",

    "topbar.student": "Étudiant", "topbar.rank": "Rang", "topbar.streak": "Streak", "topbar.account": "Compte",

    "common.cancel": "Annuler", "common.confirm": "Confirmer", "common.save": "Enregistrer", "common.add": "Ajouter",
    "common.create": "Créer", "common.delete": "Supprimer", "common.continue": "Continuer →", "common.back": "← Retour",
    "common.yes": "Oui", "common.no": "Non", "common.optional": "facultatif", "common.close": "Fermer",
    "common.loading": "Chargement…",

    "onb.title": "Focude", "onb.subtitle": "Système de progression intellectuelle",
    "onb.welcome.h": "Bienvenue.", "onb.welcome.p": "Avant l'initialisation, le système a besoin de connaître son utilisateur. Toutes les données restent en local sur cette machine.",
    "onb.name.label": "Prénom ou pseudonyme", "onb.avatar.label": "Photo de profil (facultatif)",
    "onb.avatar.add": "Ajouter une photo", "onb.avatar.change": "Changer",
    "onb.field.h": "Ton domaine.", "onb.field.p": "Filière, études, métier, passion — ce que tu veux. Ça sert juste à personnaliser l'appli, jamais à en limiter l'usage.",
    "onb.field.label": "Domaine (facultatif)",
    "onb.year.h": "Année / niveau.", "onb.year.p": "Permet d'adapter la complexité initiale de l'arbre de connaissances et la suggestion d'intervalles de révision.",
    "onb.year1": "Année 1", "onb.year1sub": "Fondamentaux", "onb.year2": "Année 2", "onb.year2sub": "Approfondissement",
    "onb.year3": "Année 3", "onb.year3sub": "Spécialisation", "onb.yearOther": "Autre", "onb.yearOtherSub": "Pas d'année précise",
    "onb.subjects.h": "Tes matières.",
    "onb.subjects.p": "Ce que tu veux suivre séparément — pas forcément scolaire : un cours, un sport, un projet perso, ta vie pro… Tu pourras en ajouter, renommer ou supprimer à tout moment depuis les Réglages.",
    "onb.subjects.addLabel": "Ajouter une matière", "onb.subjects.placeholder": "Ex. Électronique, Sport, Perso…",
    "onb.subjects.hint": "Rien d'obligatoire ici — tu peux continuer sans matière et en ajouter plus tard.",
    "onb.work.h": "Tu travailles ?", "onb.work.p": "En parallèle de tes études ou à côté — alternance, job étudiant, activité pro. Si oui, un espace dédié (contacts, livraisons, tâches pro) apparaît dans le menu.",
    "onb.work.yes": "Oui, je travaille", "onb.work.yesSub": "Ajoute l'onglet Entreprise", "onb.work.no": "Non", "onb.work.noSub": "Pas d'onglet Entreprise — ajoutable plus tard dans Réglages",
    "onb.mode.h": "Mode de démarrage.", "onb.mode.p": "Commencer avec des chapitres et tâches d'exemple, ou repartir d'une page blanche.",
    "onb.mode.fresh": "Démarrage propre", "onb.mode.freshSub": "Tes matières, niveau 1, XP zéro, molécule minimale. Tu construis tout.",
    "onb.mode.demo": "Avec données d'exemple", "onb.mode.demoSub": "10 chapitres, 7 tâches, 5 DS, 90 jours de Pomodoro simulés (exemple type études d'ingénieur). Pour explorer le système avant de l'utiliser.",
    "onb.mode.recommended": "RECOMMANDÉ", "onb.mode.demoTag": "DÉMO",
    "onb.step": "ÉTAPE", "onb.init": "Initialiser le système",
    "onb.footer1": "SAUVEGARDE LOCALE · AUCUNE DONNÉE ENVOYÉE", "onb.footer2": "MULTI-DOMAINE · MATIÈRES PERSONNALISABLES",
    "onb.welcomeToast": "Bienvenue {name} — ta molécule est calibrée.",

    "auth.system": "FOCUDE", "auth.private": "ACCÈS PRIVÉ", "auth.required": "AUTHENTIFICATION REQUISE",
    "auth.data": "DONNÉES", "auth.encrypted": "CHIFFRÉES PAR UTILISATEUR", "auth.sync": "SYNCHRO", "auth.syncDesc": "TÉLÉPHONE ↔ ORDINATEUR",
    "auth.signup.h": "Créer ton compte.", "auth.reset.h": "Mot de passe oublié.", "auth.signin.h": "Connexion.",
    "auth.signup.p": "Ton espace est strictement privé : personne d'autre ne peut lire tes chapitres, tâches ou statistiques — même en connaissant l'adresse du site.",
    "auth.reset.p": "Indique ton e-mail, tu recevras un lien pour choisir un nouveau mot de passe.",
    "auth.signin.p": "Connecte-toi pour retrouver ton travail sur tous tes appareils.",
    "auth.email": "Adresse e-mail", "auth.password": "Mot de passe", "auth.confirmPassword": "Confirmer le mot de passe",
    "auth.createAccount": "Créer un compte", "auth.haveAccount": "J'ai déjà un compte", "auth.forgot": "Oublié ?",
    "auth.sendLink": "Envoyer le lien", "auth.signin": "Se connecter", "auth.footer1": "ACCÈS PROTÉGÉ PAR MOT DE PASSE", "auth.footer2": "SYNCHRO CHIFFRÉE · TLS",

    "applock.locked": "APPLICATION VERROUILLÉE", "applock.msg": "Déverrouille avec Face ID, Touch ID ou le code de l'appareil.",
    "applock.unlock": "Déverrouiller", "applock.checking": "Vérification…",

    "profile.title": "Profil", "profile.subtitle": "PHOTO · ASSIDUITÉ · PROGRESSION",
    "profile.changePhoto": "Changer la photo", "profile.addPhoto": "Ajouter une photo",
    "profile.totalTime": "Temps total", "profile.dailyAvg": "Moy. quot.", "profile.regularity": "Régularité",
    "profile.level": "Niveau", "profile.last90": "90 derniers jours", "profile.reviewsRespected": "révisions respectées",
    "profile.activity": "Activité — 12 derniers mois", "profile.heatmapStyle": "style heatmap", "profile.less": "Moins", "profile.more": "Plus",
    "profile.productivityCurve": "Courbe de productivité", "profile.last30": "30 derniers jours",
    "profile.bySubject": "Répartition par matière", "profile.cumulated": "cumulées",
    "profile.history": "Historique des sessions", "profile.recent": "dernières activités", "profile.max30": "30 ENTRÉES MAX",
    "profile.freeSession": "Session libre", "profile.account": "Compte",

    "settings.title": "Réglages", "settings.subtitle": "PROFIL • CHARGE DE TRAVAIL • SAUVEGARDE",
    "settings.profile": "Profil", "settings.displayName": "Nom affiché", "settings.domain": "Domaine",
    "settings.yearLevel": "Année / niveau", "settings.workToggle": "Je travaille (alternance, job, activité pro)",
    "settings.workToggleDesc": "Ajoute ou retire l'onglet Entreprise dans le menu.",
    "settings.language": "Langue", "settings.languageDesc": "S'applique immédiatement, sur cet appareil.",
    "settings.subjects": "Matières", "settings.subjectsMeta": "LIBRES · PAS FORCÉMENT SCOLAIRES",
    "settings.subjectsDesc": "Un cours, un sport, un projet perso, ta vie pro… Ce que tu veux suivre séparément dans tes tâches, chapitres et examens.",
    "settings.subjectsEmpty": "Aucune matière pour l'instant.", "settings.subjectsPlaceholder": "Ex. Sport, Perso, Automatique…",
    "settings.security": "Sécurité", "settings.securityMeta": "VERROUILLAGE DE L'APPAREIL", "settings.biometric": "Face ID / Touch ID / code",

    "dash.title": "Tableau de bord", "dash.startPomodoro": "Démarrer un Pomodoro", "dash.reviewNow": "Réviser maintenant",
    "dash.molecule.title": "Structure cognitive", "dash.molecule.tier": "PALIER", "dash.molecule.atoms": "ATOMES",
    "dash.molecule.next": "SUIVANT", "dash.molecule.maxTier": "PALIER MAXIMAL",
    "dash.molecule.hintTouch": "GLISSEZ · TOUCHEZ", "dash.molecule.hintMouse": "SURVOLEZ · DÉPLACEZ LA SOURIS",
    "dash.today": "Aujourd'hui", "dash.sessions": "sessions",
    "dash.streak": "Streak", "dash.streakDays": "jours", "dash.streakActive": "discipline active", "dash.streakInactive": "reprends aujourd'hui",
    "dash.memory": "Mémoire", "dash.chaptersActive": "chapitres actifs", "dash.avgRetention": "Rétention moyenne",
    "dash.focus": "Focus du jour", "dash.remaining": "restantes", "dash.seeAll": "Voir tout →",
    "dash.noTasks": "Aucune tâche prévue. Profitez-en pour réviser.",
    "dash.deferred": "révision reportée à demain — charge du jour plafonnée pour ne pas te surcharger.",
    "dash.deferredPlural": "révisions reportées à demain — charge du jour plafonnée pour ne pas te surcharger.",
    "dash.nextReviews": "Prochaines révisions", "dash.toDo": "à faire", "dash.rev": "RÉV.", "dash.mem": "MEM",
    "dash.noUrgentReviews": "Aucune révision urgente.",
    "dash.upcomingExams": "Examens à venir", "dash.scheduled": "programmés", "dash.coef": "COEF", "dash.noExams": "Aucun examen programmé.",

    "system.eyebrow": "SYSTÈME", "system.title": "ÉVOLUTION DU NOYAU", "system.tier": "PALIER",
    "system.newRank": "Votre noyau a débloqué un nouveau rang :", "system.hint": "TOUCHER POUR FERMER",
  },
  en: {
    "nav.dashboard": "Dashboard", "nav.pomodoro": "Pomodoro", "nav.revisions": "Spaced repetition",
    "nav.tasks": "Tasks", "nav.entreprise": "Work", "nav.exams": "Exams", "nav.media": "Video / Music",
    "nav.profile": "Profile", "nav.settings": "Settings", "nav.reset": "Reset", "nav.workspace": "Workspace",
    "nav.system": "System",

    "topbar.student": "Student", "topbar.rank": "Rank", "topbar.streak": "Streak", "topbar.account": "Account",

    "common.cancel": "Cancel", "common.confirm": "Confirm", "common.save": "Save", "common.add": "Add",
    "common.create": "Create", "common.delete": "Delete", "common.continue": "Continue →", "common.back": "← Back",
    "common.yes": "Yes", "common.no": "No", "common.optional": "optional", "common.close": "Close",
    "common.loading": "Loading…",

    "onb.title": "Focude", "onb.subtitle": "Intellectual progression system",
    "onb.welcome.h": "Welcome.", "onb.welcome.p": "Before initializing, the system needs to know its user. All data stays local on this machine.",
    "onb.name.label": "First name or nickname", "onb.avatar.label": "Profile picture (optional)",
    "onb.avatar.add": "Add a photo", "onb.avatar.change": "Change",
    "onb.field.h": "Your field.", "onb.field.p": "Major, studies, job, hobby — whatever you want. It only personalizes the app, never limits how you use it.",
    "onb.field.label": "Field (optional)",
    "onb.year.h": "Year / level.", "onb.year.p": "Adapts the initial complexity of the knowledge tree and the suggested review intervals.",
    "onb.year1": "Year 1", "onb.year1sub": "Fundamentals", "onb.year2": "Year 2", "onb.year2sub": "Deepening",
    "onb.year3": "Year 3", "onb.year3sub": "Specialization", "onb.yearOther": "Other", "onb.yearOtherSub": "No specific year",
    "onb.subjects.h": "Your subjects.",
    "onb.subjects.p": "Whatever you want to track separately — not necessarily academic: a course, a sport, a personal project, your work life… You can add, rename, or delete them anytime from Settings.",
    "onb.subjects.addLabel": "Add a subject", "onb.subjects.placeholder": "E.g. Electronics, Sport, Personal…",
    "onb.subjects.hint": "Nothing required here — you can continue without any subject and add some later.",
    "onb.work.h": "Do you work?", "onb.work.p": "Alongside your studies or otherwise — apprenticeship, student job, professional activity. If yes, a dedicated space (contacts, deliveries, work tasks) shows up in the menu.",
    "onb.work.yes": "Yes, I work", "onb.work.yesSub": "Adds the Work tab", "onb.work.no": "No", "onb.work.noSub": "No Work tab — can be added later in Settings",
    "onb.mode.h": "Startup mode.", "onb.mode.p": "Start with example chapters and tasks, or from a blank slate.",
    "onb.mode.fresh": "Clean start", "onb.mode.freshSub": "Your subjects, level 1, zero XP, minimal molecule. You build everything.",
    "onb.mode.demo": "With example data", "onb.mode.demoSub": "10 chapters, 7 tasks, 5 exams, 90 days of simulated Pomodoro (engineering-student example). To explore the system before using it for real.",
    "onb.mode.recommended": "RECOMMENDED", "onb.mode.demoTag": "DEMO",
    "onb.step": "STEP", "onb.init": "Initialize the system",
    "onb.footer1": "LOCAL STORAGE · NO DATA SENT", "onb.footer2": "MULTI-DOMAIN · CUSTOMIZABLE SUBJECTS",
    "onb.welcomeToast": "Welcome {name} — your molecule is calibrated.",

    "auth.system": "FOCUDE", "auth.private": "PRIVATE ACCESS", "auth.required": "AUTHENTICATION REQUIRED",
    "auth.data": "DATA", "auth.encrypted": "ENCRYPTED PER USER", "auth.sync": "SYNC", "auth.syncDesc": "PHONE ↔ COMPUTER",
    "auth.signup.h": "Create your account.", "auth.reset.h": "Forgot password.", "auth.signin.h": "Sign in.",
    "auth.signup.p": "Your space is strictly private: no one else can read your chapters, tasks, or stats — not even knowing the site's address.",
    "auth.reset.p": "Enter your email, you'll get a link to choose a new password.",
    "auth.signin.p": "Sign in to pick up your work on every device.",
    "auth.email": "Email address", "auth.password": "Password", "auth.confirmPassword": "Confirm password",
    "auth.createAccount": "Create an account", "auth.haveAccount": "I already have an account", "auth.forgot": "Forgot?",
    "auth.sendLink": "Send the link", "auth.signin": "Sign in", "auth.footer1": "PASSWORD-PROTECTED ACCESS", "auth.footer2": "ENCRYPTED SYNC · TLS",

    "applock.locked": "APP LOCKED", "applock.msg": "Unlock with Face ID, Touch ID, or your device passcode.",
    "applock.unlock": "Unlock", "applock.checking": "Checking…",

    "profile.title": "Profile", "profile.subtitle": "PHOTO · CONSISTENCY · PROGRESS",
    "profile.changePhoto": "Change photo", "profile.addPhoto": "Add a photo",
    "profile.totalTime": "Total time", "profile.dailyAvg": "Daily avg.", "profile.regularity": "Regularity",
    "profile.level": "Level", "profile.last90": "last 90 days", "profile.reviewsRespected": "reviews on time",
    "profile.activity": "Activity — last 12 months", "profile.heatmapStyle": "heatmap style", "profile.less": "Less", "profile.more": "More",
    "profile.productivityCurve": "Productivity curve", "profile.last30": "last 30 days",
    "profile.bySubject": "By subject", "profile.cumulated": "total",
    "profile.history": "Session history", "profile.recent": "recent activity", "profile.max30": "30 ENTRIES MAX",
    "profile.freeSession": "Free session", "profile.account": "Account",

    "settings.title": "Settings", "settings.subtitle": "PROFILE • WORKLOAD • BACKUP",
    "settings.profile": "Profile", "settings.displayName": "Display name", "settings.domain": "Field",
    "settings.yearLevel": "Year / level", "settings.workToggle": "I work (apprenticeship, job, professional activity)",
    "settings.workToggleDesc": "Adds or removes the Work tab from the menu.",
    "settings.language": "Language", "settings.languageDesc": "Applies immediately, on this device.",
    "settings.subjects": "Subjects", "settings.subjectsMeta": "FREE-FORM · NOT NECESSARILY ACADEMIC",
    "settings.subjectsDesc": "A course, a sport, a personal project, your work life… Whatever you want to track separately in your tasks, chapters, and exams.",
    "settings.subjectsEmpty": "No subjects yet.", "settings.subjectsPlaceholder": "E.g. Sport, Personal, Circuits…",
    "settings.security": "Security", "settings.securityMeta": "DEVICE LOCK", "settings.biometric": "Face ID / Touch ID / passcode",

    "dash.title": "Dashboard", "dash.startPomodoro": "Start a Pomodoro", "dash.reviewNow": "Review now",
    "dash.molecule.title": "Cognitive structure", "dash.molecule.tier": "TIER", "dash.molecule.atoms": "ATOMS",
    "dash.molecule.next": "NEXT", "dash.molecule.maxTier": "MAX TIER",
    "dash.molecule.hintTouch": "SWIPE · TOUCH", "dash.molecule.hintMouse": "HOVER · MOVE THE MOUSE",
    "dash.today": "Today", "dash.sessions": "sessions",
    "dash.streak": "Streak", "dash.streakDays": "days", "dash.streakActive": "active discipline", "dash.streakInactive": "start again today",
    "dash.memory": "Memory", "dash.chaptersActive": "active chapters", "dash.avgRetention": "Average retention",
    "dash.focus": "Today's focus", "dash.remaining": "remaining", "dash.seeAll": "See all →",
    "dash.noTasks": "No tasks planned. Take the time to review.",
    "dash.deferred": "review deferred to tomorrow — today's load capped so you don't overload.",
    "dash.deferredPlural": "reviews deferred to tomorrow — today's load capped so you don't overload.",
    "dash.nextReviews": "Upcoming reviews", "dash.toDo": "to do", "dash.rev": "REV.", "dash.mem": "MEM",
    "dash.noUrgentReviews": "No urgent reviews.",
    "dash.upcomingExams": "Upcoming exams", "dash.scheduled": "scheduled", "dash.coef": "COEF", "dash.noExams": "No exam scheduled.",

    "system.eyebrow": "SYSTEM", "system.title": "CORE EVOLUTION", "system.tier": "TIER",
    "system.newRank": "Your core has unlocked a new rank:", "system.hint": "TAP TO CLOSE",
  },
};

function t(key, vars) {
  let str = (DICT[currentLang] && DICT[currentLang][key]) ?? DICT.fr[key] ?? key;
  if (vars) Object.keys(vars).forEach((k) => { str = str.replace(`{${k}}`, vars[k]); });
  return str;
}

Object.assign(window, { t, useLang, setLang, getLang, LANGS });
