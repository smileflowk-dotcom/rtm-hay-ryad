"use strict";

(() => {
  const urls = {
    publicData: "data/rtm-public.json",
    knowledge: "data/rtm-knowledge.json",
    rules: "data/rtm-rules.json",
    analyses: "data/rtm-analyses.json",
    decisions: "data/rtm-decisions.json"
  };

  const runtime = {
    data: null,
    knowledge: null,
    rules: null,
    analysisSchema: null,
    decisionConfig: null,
    currentObjectId: null,
    analyses: [],
    generatedAt: null
  };

  const escapeHtml = (value) => String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

  const formatDate = (value) => {
    if (!value) return "Non renseignée";
    return new Intl.DateTimeFormat("fr-FR", {
      dateStyle: "medium",
      timeStyle: "short",
      timeZone: "Europe/Paris"
    }).format(new Date(value));
  };

  const formatNumber = (value) => new Intl.NumberFormat("fr-FR").format(value);

  const formatDateWithSeconds = (value) => new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "medium",
    timeStyle: "medium",
    timeZone: "Europe/Paris"
  }).format(new Date(value));

  async function loadJson(url) {
    const response = await fetch(url, { cache: "no-store" });
    if (!response.ok) throw new Error(`${url} indisponible (${response.status})`);
    return response.json();
  }

  function sourceFor(data, sourceId) {
    return data.sources.find((source) => source.id === sourceId);
  }

  function safeExternalLink(url, label) {
    return typeof url === "string" && url.startsWith("https://")
      ? `<a href="${escapeHtml(url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(label)}</a>`
      : escapeHtml(label);
  }

  function storageState() {
    const empty = { decisions: {}, analysis_statuses: {}, verification_requests: {} };
    try {
      const key = runtime.decisionConfig?.persistence?.key;
      if (!key) return empty;
      const parsed = JSON.parse(localStorage.getItem(key) || "null");
      return parsed && typeof parsed === "object"
        ? { ...empty, ...parsed }
        : empty;
    } catch {
      return empty;
    }
  }

  function saveStorageState(state) {
    const key = runtime.decisionConfig?.persistence?.key;
    if (!key) return false;
    try {
      localStorage.setItem(key, JSON.stringify(state));
      return true;
    } catch {
      return false;
    }
  }

  function daysSince(value, referenceDate = new Date()) {
    const reviewedAt = new Date(value);
    if (Number.isNaN(reviewedAt.getTime())) return null;
    return Math.max(0, Math.floor((referenceDate - reviewedAt) / 86_400_000));
  }

  function evaluateRule(record, object, rule, generatedAt = new Date().toISOString()) {
    const sources = Array.isArray(record.sources) ? record.sources : [];
    const evidence = Array.isArray(record.evidence) ? record.evidence : [];
    const contradictions = Array.isArray(record.contradictions) ? record.contradictions : [];
    const references = new Set();
    let triggered = false;
    let conditionDetails = "Condition non reconnue.";
    let finding = "Condition non déclenchée.";
    let confidence = "ELEVE";
    let demonstration = false;

    switch (rule.condition_type) {
      case "missing_sources":
        triggered = sources.length === 0;
        conditionDetails = `${sources.length} source(s) référencée(s) dans le dossier.`;
        finding = triggered
          ? "Aucune source n'est référencée dans le dossier pilote."
          : "Au moins une source traçable est référencée.";
        sources.forEach((source) => references.add(source.source_id));
        break;
      case "missing_public_evidence": {
        const publicEvidence = evidence.filter((item) => item.status === "PUBLIC");
        const declaredCount = record.evidence_summary?.declared_count || 0;
        triggered = publicEvidence.length === 0;
        conditionDetails = `${publicEvidence.length} preuve(s) publique(s) consultable(s) ; ${declaredCount} preuve(s) déclarée(s) dans l'état public assaini.`;
        finding = triggered
          ? "Aucune preuve n'est consultable dans le MVO public ; cela ne prouve pas son absence dans le RSU interne."
          : "Une preuve publique consultable est reliée au dossier.";
        record.documents?.forEach((document) => references.add(document.document_id));
        break;
      }
      case "stale_review": {
        const age = daysSince(record.last_reviewed_at);
        const threshold = rule.parameters?.maximum_age_days || 365;
        triggered = age === null || age > threshold;
        conditionDetails = age === null
          ? "Date de dernière revue absente ou invalide."
          : `Dernière revue il y a ${age} jour(s) ; seuil ${threshold} jour(s).`;
        finding = triggered
          ? "Le dossier doit être revu avant un usage décisionnel."
          : "La dernière revue reste dans le seuil configuré.";
        references.add(record.record_id);
        break;
      }
      case "recorded_contradiction":
        triggered = contradictions.length > 0;
        demonstration = contradictions.some((item) => item.data_nature === "Donnée de démonstration");
        confidence = demonstration ? "FAIBLE" : "ELEVE";
        conditionDetails = `${contradictions.length} contradiction(s) explicitement enregistrée(s).`;
        finding = triggered
          ? `${demonstration ? "Donnée de démonstration : " : ""}deux valeurs incompatibles demandent une vérification humaine.`
          : "Aucune contradiction n'est enregistrée dans le dossier.";
        contradictions.forEach((item) => references.add(item.contradiction_id));
        break;
      case "object_not_validated":
        triggered = object.status !== "VALIDE";
        conditionDetails = `Statut public examiné : ${object.status || "NON_RENSEIGNE"}.`;
        finding = triggered
          ? "Le statut public ne permet pas de considérer l'objet comme validé."
          : "Le statut public de l'objet est VALIDE.";
        references.add(object.id);
        break;
      default:
        triggered = false;
    }

    const analysisId = `AN-${object.id}-${rule.rule_id}`;
    const localState = storageState();
    return {
      analysis_id: analysisId,
      object_reference: object.id,
      rule_id: rule.rule_id,
      rule_name: rule.name,
      finding,
      severity: triggered ? rule.severity : "INFO",
      rule_severity: rule.severity,
      evidence_references: [...references],
      confidence,
      generated_at: generatedAt,
      analysis_status: triggered ? "A_EXAMINER" : "NON_DECLENCHEE",
      human_validation: localState.analysis_statuses[analysisId] || "EN_ATTENTE",
      condition_details: conditionDetails,
      recommendation: rule.recommendation,
      triggered,
      data_nature: demonstration ? "Donnée de démonstration" : "Analyse automatique explicable"
    };
  }

  function evaluateAll(records, objects, rules, generatedAt = new Date().toISOString()) {
    return records.flatMap((record) => {
      const object = objects.find((item) => item.id === record.object_reference);
      if (!object) return [];
      return rules.filter((rule) => rule.enabled)
        .map((rule) => evaluateRule(record, object, rule, generatedAt));
    });
  }

  function severityClass(severity) {
    if (severity === "CRITIQUE" || severity === "ELEVE") return "critical";
    if (severity === "MOYEN") return "warn";
    return "good";
  }

  function dashboardMetric(label, value) {
    return `<div class="decision-metric"><span>${escapeHtml(label)}</span><strong>${escapeHtml(formatNumber(value))}</strong></div>`;
  }

  async function renderFourLayerDashboard() {
    const host = document.querySelector("#four-layer-dashboard");
    if (!host) return;
    const [data, knowledge, ruleConfig, decisionConfig] = await Promise.all([
      loadJson(urls.publicData), loadJson(urls.knowledge), loadJson(urls.rules), loadJson(urls.decisions)
    ]);
    runtime.decisionConfig = decisionConfig;
    const analyses = evaluateAll(knowledge.records, data.objects, ruleConfig.rules);
    const triggered = analyses.filter((analysis) => analysis.triggered);
    const local = storageState();
    const unresolved = triggered.filter((analysis) => !local.decisions[analysis.analysis_id]);
    const toVerify = knowledge.records.filter((record) =>
      record.missing_information.length > 0 || record.verification_requests.length > 0
    ).length;
    const demonstrationVerification = knowledge.records.filter((record) =>
      record.verification_requests.some((request) => request.data_nature === "Donnée de démonstration")
    ).length;

    host.innerHTML = `
      <div class="decision-dashboard-grid">
        <article class="decision-group">
          <p class="eyebrow dark">Connaissance</p>
          <h3>Documenter</h3>
          <div class="decision-metric-grid">
            ${dashboardMetric("Objets pilotes documentés", knowledge.records.filter((record) => record.knowledge_status === "documenté").length)}
            ${dashboardMetric(`Objets à vérifier (${demonstrationVerification} démo)`, toVerify)}
            ${dashboardMetric("Objets validés", data.objects.filter((object) => object.status === "VALIDE").length)}
            ${dashboardMetric("Objets contestés", knowledge.records.filter((record) => record.knowledge_status === "contesté").length)}
          </div>
        </article>
        <article class="decision-group">
          <p class="eyebrow dark">Intelligence</p>
          <h3>Analyser</h3>
          <div class="decision-metric-grid">
            ${dashboardMetric("Alertes critiques", triggered.filter((analysis) => analysis.severity === "CRITIQUE").length)}
            ${dashboardMetric("Contradictions de démonstration", triggered.filter((analysis) => analysis.rule_id === "R-004").length)}
            ${dashboardMetric("Preuves publiques manquantes", triggered.filter((analysis) => analysis.rule_id === "R-002").length)}
            ${dashboardMetric("Analyses à examiner", unresolved.length)}
          </div>
        </article>
        <article class="decision-group human">
          <p class="eyebrow dark">Décision</p>
          <h3>Agir humainement</h3>
          <div class="decision-metric-grid">
            ${dashboardMetric("Décisions urgentes", unresolved.filter((analysis) => analysis.severity === "CRITIQUE").length)}
            ${dashboardMetric("Décisions à examiner", unresolved.length)}
            ${dashboardMetric("Vérifications demandées", Object.keys(local.verification_requests).length)}
            ${dashboardMetric("Décisions traitées", Object.values(local.decisions).filter((decision) => decision.decision_status === "TRAITE_LOCAL").length)}
          </div>
        </article>
      </div>
      <p class="local-storage-note">${escapeHtml(decisionConfig.persistence.disclaimer)}</p>
      <p><a class="button" href="object.html?id=${encodeURIComponent(data.objects[0].id)}">Ouvrir le premier dossier quatre couches</a></p>`;
    host.dataset.ready = "true";
  }

  function setupTabs() {
    const tabs = [...document.querySelectorAll("[data-layer-tab]")];
    const panels = [...document.querySelectorAll("[data-layer-panel]")];
    tabs.forEach((tab) => tab.addEventListener("click", () => {
      tabs.forEach((item) => item.setAttribute("aria-selected", String(item === tab)));
      panels.forEach((panel) => { panel.hidden = panel.dataset.layerPanel !== tab.dataset.layerTab; });
    }));
  }

  function renderTerritory(object, data) {
    const coordinates = object.coordinates
      ? `${object.coordinates.latitude}, ${object.coordinates.longitude}`
      : "Non renseignée dans le MVO public";
    const sources = object.source_ids.map((sourceId) => {
      const source = sourceFor(data, sourceId);
      return `<li>${safeExternalLink(source?.url, source?.organization || source?.title || sourceId)} <span class="tag">${escapeHtml(sourceId)}</span></li>`;
    }).join("");
    document.querySelector("#territory-content").innerHTML = `
      <div class="layer-heading"><span class="layer-number">1</span><div><p class="eyebrow dark">Territoire — observer</p><h3>${escapeHtml(object.name)}</h3></div></div>
      <div class="fact-grid">
        <div><span>Type</span><strong>${escapeHtml(object.type)}</strong></div>
        <div><span>Territoire déclaré</span><strong>${escapeHtml(object.territory)}</strong></div>
        <div><span>Localisation</span><strong>${escapeHtml(coordinates)}</strong></div>
        <div><span>Statut territorial</span><strong>Objet RTM documenté</strong></div>
        <div><span>Statut de vérification</span><strong>${escapeHtml(object.status)}</strong></div>
        <div><span>Date de l'état public</span><strong>${escapeHtml(formatDate(object.updated_at))}</strong></div>
        <div><span>Identifiant objet</span><strong>${escapeHtml(object.id)}</strong></div>
        <div><span>RTM-ID</span><strong>${escapeHtml(object.rtm_id)}</strong></div>
      </div>
      <section class="knowledge-card"><h4>Sources territoriales référencées</h4><ul class="source-list">${sources}</ul></section>
      <p class="muted">Lien OSM : aucun objet OpenStreetMap n'est rattaché automatiquement à ce dossier RTM.</p>
      <p><a class="button secondary" href="map.html">Retour à la carte</a></p>`;
  }

  function renderKnowledge(record, data) {
    const sourceItems = record.sources.map((item) => {
      const source = sourceFor(data, item.source_id);
      const label = source?.organization || source?.title || item.source_id;
      return `<li><strong>${safeExternalLink(source?.url, label)}</strong><br><span class="muted">Origine : ${escapeHtml(item.source_id)} · Statut : ${escapeHtml(source?.availability || "NON_RENSEIGNE")} · ${escapeHtml(item.data_nature)}</span></li>`;
    }).join("");
    const documentItems = record.documents.map((item) =>
      `<li><strong>${safeExternalLink(item.url, item.title)}</strong><br><span class="muted">Origine : ${escapeHtml(item.source_id)} · Statut : ${escapeHtml(item.status)} · ${escapeHtml(item.data_nature)}</span></li>`
    ).join("");
    const historyItems = record.version_history.map((item) =>
      `<li><strong>${escapeHtml(item.change)}</strong><br><span class="muted">${escapeHtml(formatDate(item.date))} · Origine : ${escapeHtml(item.origin)}</span></li>`
    ).join("");
    const validationItems = record.validation_events.map((item) =>
      `<li><strong>${escapeHtml(item.status)}</strong><br><span class="muted">${escapeHtml(formatDate(item.occurred_at))} · Origine : ${escapeHtml(item.origin)} · ${escapeHtml(item.data_nature)}</span></li>`
    ).join("");
    const missingItems = record.missing_information.length
      ? record.missing_information.map((item) => `<li>${escapeHtml(item.label)} <span class="tag warn">${escapeHtml(item.status)}</span></li>`).join("")
      : "<li>Aucune lacune structurelle supplémentaire enregistrée.</li>";
    const contradictionItems = record.contradictions.length
      ? record.contradictions.map((item) => `<li><span class="tag demo">${escapeHtml(item.data_nature)}</span> ${escapeHtml(item.note)}<br><span class="muted">Champ : ${escapeHtml(item.field)} · Valeurs : ${item.values.map(escapeHtml).join(" / ")}</span></li>`).join("")
      : "<li>Aucune contradiction enregistrée.</li>";

    document.querySelector("#knowledge-content").innerHTML = `
      <div class="layer-heading"><span class="layer-number">2</span><div><p class="eyebrow dark">Connaissance — documenter</p><h3>Dossier ${escapeHtml(record.record_id)}</h3></div></div>
      <div class="knowledge-stat-grid">
        <div><span>Statut</span><strong>${escapeHtml(record.knowledge_status)}</strong></div>
        <div><span>Confiance</span><strong>${escapeHtml(record.confidence_level)}</strong></div>
        <div><span>Dernière revue</span><strong>${escapeHtml(formatDate(record.last_reviewed_at))}</strong></div>
        <div><span>Observations terrain</span><strong>${escapeHtml(record.observations.length)}</strong></div>
      </div>
      <div class="knowledge-grid">
        <section class="knowledge-card"><h4>Sources</h4><ul>${sourceItems}</ul></section>
        <section class="knowledge-card"><h4>Documents</h4><ul>${documentItems}</ul></section>
        <section class="knowledge-card"><h4>Preuves</h4><p><strong>${escapeHtml(record.evidence.length)} preuve publique consultable</strong></p><p class="muted">${escapeHtml(record.evidence_summary.note)}</p></section>
        <section class="knowledge-card"><h4>Observations</h4><p>Aucune observation terrain réelle publiée.</p></section>
        <section class="knowledge-card"><h4>Validations</h4><ul>${validationItems}</ul></section>
        <section class="knowledge-card"><h4>Historique</h4><ul>${historyItems}</ul></section>
        <section class="knowledge-card"><h4>Informations manquantes</h4><ul>${missingItems}</ul></section>
        <section class="knowledge-card"><h4>Contradictions</h4><ul>${contradictionItems}</ul></section>
      </div>`;
  }

  function renderAnalyses() {
    const host = document.querySelector("#analysis-results");
    const current = runtime.analyses.filter((analysis) => analysis.object_reference === runtime.currentObjectId);
    const triggered = current.filter((analysis) => analysis.triggered);
    const summary = document.querySelector("#analysis-run-summary");
    summary.dataset.generatedAt = runtime.generatedAt;
    summary.innerHTML = `
      <strong>${current.length} règles exécutées</strong> · ${triggered.length} déclenchée(s) · ${escapeHtml(formatDateWithSeconds(runtime.generatedAt))}`;
    host.innerHTML = current.map((analysis) => `
      <article class="analysis-card ${analysis.triggered ? "triggered" : "clear"}" data-analysis-id="${escapeHtml(analysis.analysis_id)}">
        <div class="analysis-card-heading">
          <div><p class="eyebrow dark">${escapeHtml(analysis.rule_id)}</p><h4>${escapeHtml(analysis.rule_name)}</h4></div>
          <div><span class="tag ${severityClass(analysis.severity)}">${escapeHtml(analysis.severity)}</span> ${analysis.data_nature === "Donnée de démonstration" ? '<span class="tag demo">Donnée de démonstration</span>' : ""}</div>
        </div>
        <p><strong>${analysis.triggered ? "Règle déclenchée" : "Règle non déclenchée"}</strong> — ${escapeHtml(analysis.finding)}</p>
        <dl class="analysis-details">
          <div><dt>Condition examinée</dt><dd>${escapeHtml(analysis.condition_details)}</dd></div>
          <div><dt>Confiance</dt><dd>${escapeHtml(analysis.confidence)}</dd></div>
          <div><dt>Références examinées</dt><dd>${escapeHtml(analysis.evidence_references.join(", ") || "Aucune")}</dd></div>
          <div><dt>Recommandation</dt><dd>${escapeHtml(analysis.recommendation)}</dd></div>
          <div><dt>Validation humaine</dt><dd>${escapeHtml(analysis.human_validation)}</dd></div>
        </dl>
      </article>`).join("");
  }

  function priorityFor(severity) {
    if (severity === "CRITIQUE") return "URGENTE";
    if (severity === "ELEVE") return "HAUTE";
    return "NORMALE";
  }

  function currentTriggeredAnalyses() {
    return runtime.analyses.filter((analysis) =>
      analysis.object_reference === runtime.currentObjectId && analysis.triggered
    );
  }

  function renderDecisionPanel(preferredAnalysisId) {
    const picker = document.querySelector("#decision-analysis-picker");
    const analyses = currentTriggeredAnalyses();
    const previous = preferredAnalysisId || picker.value;
    picker.innerHTML = analyses.length
      ? analyses.map((analysis) => `<option value="${escapeHtml(analysis.analysis_id)}">${escapeHtml(analysis.rule_id)} · ${escapeHtml(analysis.rule_name)}</option>`).join("")
      : '<option value="">Aucune analyse déclenchée</option>';
    if (analyses.some((analysis) => analysis.analysis_id === previous)) picker.value = previous;
    const selected = analyses.find((analysis) => analysis.analysis_id === picker.value) || analyses[0];
    const actions = document.querySelectorAll("[data-decision-action]");
    actions.forEach((button) => { button.disabled = !selected; });
    if (!selected) {
      document.querySelector("#decision-detail").innerHTML = "<p>Aucune analyse ne nécessite de décision pour cet objet.</p>";
      return;
    }
    picker.value = selected.analysis_id;
    const decision = storageState().decisions[selected.analysis_id];
    document.querySelector("#decision-detail").innerHTML = `
      <article class="decision-card">
        <p><span class="tag demo">Donnée de démonstration</span> <span class="tag ${severityClass(selected.severity)}">Priorité ${escapeHtml(priorityFor(selected.severity))}</span></p>
        <dl class="analysis-details">
          <div><dt>Problème concerné</dt><dd>${escapeHtml(selected.finding)}</dd></div>
          <div><dt>Recommandation automatique</dt><dd>${escapeHtml(selected.recommendation)}</dd></div>
          <div><dt>Justification</dt><dd>${escapeHtml(selected.condition_details)}</dd></div>
          <div><dt>Preuves ou références</dt><dd>${escapeHtml(selected.evidence_references.join(", ") || "Aucune preuve publique consultable")}</dd></div>
          <div><dt>Responsable</dt><dd>${escapeHtml(decision?.responsible_party || "À désigner — Donnée de démonstration")}</dd></div>
          <div><dt>Statut</dt><dd>${escapeHtml(decision?.decision_status || "EN_ATTENTE")}</dd></div>
          <div><dt>Décision humaine</dt><dd>${escapeHtml(decision?.human_decision || "Aucune décision enregistrée")}</dd></div>
          <div><dt>Décidée le</dt><dd>${decision?.decided_at ? escapeHtml(formatDate(decision.decided_at)) : "Non décidée"}</dd></div>
        </dl>
      </article>`;
  }

  function recordDecision(action) {
    const analysisId = document.querySelector("#decision-analysis-picker").value;
    const analysis = runtime.analyses.find((item) => item.analysis_id === analysisId);
    if (!analysis) return;
    const labels = {
      APPROUVER: ["APPROUVE_LOCAL", "Action proposée approuvée localement"],
      REJETER: ["REJETE_LOCAL", "Action proposée rejetée localement"],
      DEMANDER_VERIFICATION: ["VERIFICATION_DEMANDEE", "Vérification humaine demandée localement"],
      MARQUER_TRAITE: ["TRAITE_LOCAL", "Analyse marquée comme traitée localement"]
    };
    const [decisionStatus, humanDecision] = labels[action];
    const state = storageState();
    state.decisions[analysisId] = {
      decision_id: `DEC-DEMO-${runtime.currentObjectId}-${analysis.rule_id}`,
      object_reference: runtime.currentObjectId,
      analysis_references: [analysisId],
      proposed_action: analysis.recommendation,
      priority: priorityFor(analysis.severity),
      rationale: analysis.finding,
      evidence_references: analysis.evidence_references,
      responsible_party: "À désigner — Donnée de démonstration",
      decision_status: decisionStatus,
      human_decision: humanDecision,
      decided_at: new Date().toISOString(),
      follow_up_date: null,
      data_nature: "Donnée de démonstration — enregistrement local"
    };
    state.analysis_statuses[analysisId] = decisionStatus;
    if (action === "DEMANDER_VERIFICATION") state.verification_requests[analysisId] = true;
    else delete state.verification_requests[analysisId];
    const saved = saveStorageState(state);
    runtime.analyses = evaluateAll(runtime.knowledge.records, runtime.data.objects, runtime.rules.rules, runtime.generatedAt);
    renderAnalyses();
    renderDecisionPanel(analysisId);
    document.querySelector("#decision-feedback").textContent = saved
      ? "Décision enregistrée localement pour cette démonstration."
      : "Le navigateur n'autorise pas l'enregistrement local.";
  }

  function resetLocalDecisions() {
    const key = runtime.decisionConfig?.persistence?.key;
    try { if (key) localStorage.removeItem(key); } catch { /* Aucun autre stockage n'est modifié. */ }
    runtime.analyses = evaluateAll(runtime.knowledge.records, runtime.data.objects, runtime.rules.rules, runtime.generatedAt);
    renderAnalyses();
    renderDecisionPanel();
    document.querySelector("#decision-feedback").textContent = "Décisions et statuts locaux réinitialisés.";
  }

  function rerunAnalyses() {
    runtime.generatedAt = new Date().toISOString();
    runtime.analyses = evaluateAll(runtime.knowledge.records, runtime.data.objects, runtime.rules.rules, runtime.generatedAt);
    renderAnalyses();
    renderDecisionPanel();
  }

  function renderObject(objectId) {
    const object = runtime.data.objects.find((item) => item.id === objectId) || runtime.data.objects[0];
    const record = runtime.knowledge.records.find((item) => item.object_reference === object.id);
    if (!record) throw new Error(`Dossier absent pour ${object.id}`);
    runtime.currentObjectId = object.id;
    history.replaceState(null, "", `object.html?id=${encodeURIComponent(object.id)}`);
    document.title = `RTM — ${object.name}`;
    document.querySelector("#object-title").textContent = object.name;
    document.querySelector("#object-summary").innerHTML = `
      <span>Objet : <strong>${escapeHtml(object.id)}</strong></span>
      <span>RTM-ID : <strong>${escapeHtml(object.rtm_id)}</strong></span>
      <span>Statut : <strong class="status">${escapeHtml(object.status)}</strong></span>`;
    document.querySelector("#object-selector").value = object.id;
    renderTerritory(object, runtime.data);
    renderKnowledge(record, runtime.data);
    rerunAnalyses();
    document.querySelector("main").dataset.ready = "true";
  }

  async function renderObjectPage() {
    const [data, knowledge, rules, analysisSchema, decisionConfig] = await Promise.all([
      loadJson(urls.publicData),
      loadJson(urls.knowledge),
      loadJson(urls.rules),
      loadJson(urls.analyses),
      loadJson(urls.decisions)
    ]);
    Object.assign(runtime, { data, knowledge, rules, analysisSchema, decisionConfig });
    const selector = document.querySelector("#object-selector");
    selector.innerHTML = data.objects.map((object) =>
      `<option value="${escapeHtml(object.id)}">${escapeHtml(object.name)}</option>`
    ).join("");
    selector.addEventListener("change", () => renderObject(selector.value));
    document.querySelector("#rerun-analysis").addEventListener("click", rerunAnalyses);
    document.querySelector("#decision-analysis-picker").addEventListener("change", () => renderDecisionPanel());
    document.querySelectorAll("[data-decision-action]").forEach((button) =>
      button.addEventListener("click", () => recordDecision(button.dataset.decisionAction))
    );
    document.querySelector("#reset-local-decisions").addEventListener("click", resetLocalDecisions);
    setupTabs();
    const requestedId = new URLSearchParams(location.search).get("id");
    renderObject(requestedId);
  }

  async function boot() {
    try {
      if (document.body.dataset.page === "dashboard") await renderFourLayerDashboard();
      if (document.body.dataset.page === "object") await renderObjectPage();
    } catch (error) {
      const main = document.querySelector("main");
      const message = document.createElement("p");
      message.className = "error";
      message.textContent = `Erreur du parcours quatre couches : ${error.message}`;
      main.prepend(message);
    }
  }

  window.RTMFourLayers = { evaluateRule, evaluateAll, storageState, ready: boot() };
})();
