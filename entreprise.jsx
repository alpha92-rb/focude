/* ==========================================================
   entreprise.jsx — Alternance / professional workspace.
   Contacts à relancer · Livraisons & commandes · Tâches bureautiques.
   ========================================================== */

const Entreprise = () => {
  const s = useStore();
  const [modal, setModal] = React.useState(null); // 'contact' | 'delivery' | 'task'

  const contacts = s.contacts || [];
  const deliveries = s.deliveries || [];
  const proTasks = (s.tasks || []).filter((t) => t.domain === "pro");

  const contactsTodo = contacts.filter((c) => c.status !== "done");
  const deliveriesTodo = deliveries.filter((d) => d.status !== "received");
  const proTodo = proTasks.filter((t) => t.status !== "done");

  const dueToday = proQuests(s).length;

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1>Entreprise</h1>
          <div className="sub">ALTERNANCE • BUREAUTIQUE • CONTACTS • LIVRAISONS</div>
        </div>
        <div className="actions">
          <div className="stat-chip"><span className="dot" style={{ background: "var(--amber)", boxShadow: "0 0 8px var(--amber)" }}/><span className="label">À traiter auj.</span><span className="val mono">{dueToday}</span></div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14, marginBottom: 18 }}>
        <KpiMini title="Contacts" value={contactsTodo.length} sub="à relancer" tone="amber" highlight={contacts.some((c)=>c.status!=="done" && new Date(c.due).getTime() < now())}/>
        <KpiMini title="Livraisons" value={deliveriesTodo.length} sub="en attente" tone="amber"/>
        <KpiMini title="Bureautique" value={proTodo.length} sub="tâches pro" tone="cyan"/>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, alignItems: "start" }}>
        {/* Contacts */}
        <Card title="Contacts à relancer" meta={`${contactsTodo.length} en cours`} actions={
          <button className="btn sm primary" onClick={() => setModal("contact")}><Icon name="plus" size={12}/>Ajouter</button>
        }>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {contacts.length === 0 && <div className="muted center" style={{ padding: 24 }}>Aucun contact. Ajoute une relance.</div>}
            {contacts.map((c) => {
              const overdue = c.status !== "done" && new Date(c.due).getTime() < startOfToday();
              return (
                <div key={c.id} className={"pro-item" + (c.status === "done" ? " done" : "")}>
                  <div className={"checkbox" + (c.status === "done" ? " checked" : "")} onClick={() => { sfx.check(); actions.toggleContact(c.id); }}>
                    {c.status === "done" && <Icon name="check" size={12}/>}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="pro-title">{c.name} <span className="muted" style={{ fontWeight: 400 }}>· {c.org}</span></div>
                    <div className="muted" style={{ fontSize: 11.5, marginTop: 2 }}>{c.reason}</div>
                    <div className="meta" style={{ marginTop: 5 }}>
                      <span className={"prio " + c.prio}>{c.prio === "high" ? "Priorité haute" : c.prio === "med" ? "Moyenne" : "Basse"}</span>
                      <span className="dot"/>
                      <span className="time">{dueLabel(c.due, overdue)}</span>
                    </div>
                  </div>
                  <button className="btn icon sm ghost" aria-label="Supprimer le contact" onClick={() => actions.deleteContact(c.id)}><Icon name="trash" size={12}/></button>
                </div>
              );
            })}
          </div>
        </Card>

        {/* Livraisons */}
        <Card title="Livraisons & commandes" meta={`${deliveriesTodo.length} en attente`} actions={
          <button className="btn sm primary" onClick={() => setModal("delivery")}><Icon name="plus" size={12}/>Ajouter</button>
        }>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {deliveries.length === 0 && <div className="muted center" style={{ padding: 24 }}>Aucune commande. Ajoute une livraison.</div>}
            {deliveries.map((d) => {
              const overdue = d.status !== "received" && new Date(d.due).getTime() < startOfToday();
              return (
                <div key={d.id} className={"pro-item" + (d.status === "received" ? " done" : "")}>
                  <div className={"checkbox" + (d.status === "received" ? " checked" : "")} onClick={() => { sfx.check(); actions.toggleDelivery(d.id); }}>
                    {d.status === "received" && <Icon name="check" size={12}/>}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="pro-title">{d.label}</div>
                    <div className="muted" style={{ fontSize: 11.5, marginTop: 2 }}>{d.supplier} · réf. <span className="mono">{d.ref}</span></div>
                    <div className="meta" style={{ marginTop: 5 }}>
                      <span className={d.status === "received" ? "tag green" : "tag amber"}>{d.status === "received" ? "REÇU" : "À PASSER / SUIVRE"}</span>
                      <span className="dot"/>
                      <span className="time">{dueLabel(d.due, overdue)}</span>
                    </div>
                  </div>
                  <button className="btn icon sm ghost" aria-label="Supprimer la livraison" onClick={() => actions.deleteDelivery(d.id)}><Icon name="trash" size={12}/></button>
                </div>
              );
            })}
          </div>
        </Card>
      </div>

      {/* Tâches bureautiques */}
      <div style={{ marginTop: 16 }}>
        <Card title="Tâches bureautiques" meta={`${proTodo.length} à faire`} actions={
          <button className="btn sm primary" onClick={() => setModal("task")}><Icon name="plus" size={12}/>Ajouter</button>
        }>
          <div className="task-list" style={{ marginInline: -16 }}>
            {proTasks.length === 0 && <div className="muted" style={{ padding: 16 }}>Aucune tâche bureautique. Mails, documents, rapports…</div>}
            {proTasks.map((t) => <TaskRow key={t.id} task={t} subjects={s.subjects}/>)}
          </div>
        </Card>
      </div>

      {modal === "contact" && <AddContactModal onClose={() => setModal(null)}/>}
      {modal === "delivery" && <AddDeliveryModal onClose={() => setModal(null)}/>}
      {modal === "task" && <AddProTaskModal onClose={() => setModal(null)}/>}
    </div>
  );
};

function startOfToday() { const d = new Date(); d.setHours(0,0,0,0); return d.getTime(); }
function dueLabel(dueKey, overdue) {
  const due = new Date(dueKey); due.setHours(0,0,0,0);
  const days = Math.round((due.getTime() - startOfToday()) / dayMs);
  if (days === 0) return "Aujourd'hui";
  if (days < 0) return `En retard de ${Math.abs(days)} j`;
  if (days === 1) return "Demain";
  return `Dans ${days} j`;
}

const AddContactModal = ({ onClose }) => {
  const [name, setName] = React.useState("");
  const [org, setOrg] = React.useState("");
  const [reason, setReason] = React.useState("");
  const [prio, setPrio] = React.useState("med");
  const [due, setDue] = React.useState(() => new Date().toISOString().slice(0, 10));
  const submit = () => {
    if (!name.trim()) return;
    actions.addContact({ name, org, reason, prio, due });
    pushToast({ kind: "default", text: `Contact ajouté — apparaîtra dans les quêtes le jour prévu.` });
    onClose();
  };
  return (
    <Modal title="Nouveau contact à relancer" onClose={onClose} actions={
      <><button className="btn ghost" onClick={onClose}>Annuler</button><button className="btn primary" onClick={submit}>Ajouter</button></>
    }>
      <div><label className="field-label">Nom / interlocuteur</label>
        <input className="input" autoFocus value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex. M. Dubois"/></div>
      <div><label className="field-label">Société / service</label>
        <input className="input" value={org} onChange={(e) => setOrg(e.target.value)} placeholder="Ex. Service Achats"/></div>
      <div><label className="field-label">Motif</label>
        <input className="input" value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Ex. Relancer pour le devis"/></div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <div><label className="field-label">Priorité</label>
          <select className="select" value={prio} onChange={(e) => setPrio(e.target.value)}>
            <option value="low">Basse</option><option value="med">Moyenne</option><option value="high">Haute</option>
          </select></div>
        <div><label className="field-label">Échéance</label>
          <input className="input" type="date" value={due} onChange={(e) => setDue(e.target.value)}/></div>
      </div>
    </Modal>
  );
};

const AddDeliveryModal = ({ onClose }) => {
  const [label, setLabel] = React.useState("");
  const [supplier, setSupplier] = React.useState("");
  const [ref, setRef] = React.useState("");
  const [due, setDue] = React.useState(() => new Date().toISOString().slice(0, 10));
  const submit = () => {
    if (!label.trim()) return;
    actions.addDelivery({ label, supplier, ref, due });
    pushToast({ kind: "default", text: `Livraison ajoutée au suivi.` });
    onClose();
  };
  return (
    <Modal title="Nouvelle livraison / commande" onClose={onClose} actions={
      <><button className="btn ghost" onClick={onClose}>Annuler</button><button className="btn primary" onClick={submit}>Ajouter</button></>
    }>
      <div><label className="field-label">Objet / contenu</label>
        <input className="input" autoFocus value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Ex. Commande capteurs PT100 (×12)"/></div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <div><label className="field-label">Fournisseur</label>
          <input className="input" value={supplier} onChange={(e) => setSupplier(e.target.value)} placeholder="Ex. RS Components"/></div>
        <div><label className="field-label">Référence / N° de bon</label>
          <input className="input" value={ref} onChange={(e) => setRef(e.target.value)} placeholder="Ex. BC-2041"/></div>
      </div>
      <div><label className="field-label">Date prévue</label>
        <input className="input" type="date" value={due} onChange={(e) => setDue(e.target.value)}/></div>
    </Modal>
  );
};

const AddProTaskModal = ({ onClose }) => {
  const [title, setTitle] = React.useState("");
  const [prio, setPrio] = React.useState("med");
  const [category, setCategory] = React.useState("daily");
  const [duration, setDuration] = React.useState(30);
  const submit = () => {
    if (!title.trim()) return;
    actions.addTask({ title, domain: "pro", prio, category, duration: parseInt(duration) || 30 });
    pushToast({ kind: "default", text: `Tâche bureautique ajoutée.` });
    onClose();
  };
  return (
    <Modal title="Nouvelle tâche bureautique" onClose={onClose} actions={
      <><button className="btn ghost" onClick={onClose}>Annuler</button><button className="btn primary" onClick={submit}>Créer</button></>
    }>
      <div><label className="field-label">Intitulé</label>
        <input className="input" autoFocus value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ex. Rédiger le compte-rendu de réunion"/></div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
        <div><label className="field-label">Priorité</label>
          <select className="select" value={prio} onChange={(e) => setPrio(e.target.value)}>
            <option value="low">Basse</option><option value="med">Moyenne</option><option value="high">Haute</option>
          </select></div>
        <div><label className="field-label">Catégorie</label>
          <select className="select" value={category} onChange={(e) => setCategory(e.target.value)}>
            <option value="daily">Quotidien</option><option value="backlog">Backlog</option>
          </select></div>
        <div><label className="field-label">Durée (min)</label>
          <input className="input" type="number" value={duration} onChange={(e) => setDuration(e.target.value)}/></div>
      </div>
    </Modal>
  );
};

Object.assign(window, { Entreprise });
