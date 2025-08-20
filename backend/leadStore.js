// Простое хранилище лидов в памяти процесса с автоочисткой

const leads = new Map(); // leadId -> { data, createdAt }
const TTL_MS = 24 * 60 * 60 * 1000; // 24 часа

function setLead(leadId, data) {
  leads.set(leadId, { data, createdAt: Date.now() });
}

function getLead(leadId) {
  const entry = leads.get(leadId);
  if (!entry) return null;
  return entry.data;
}

function deleteLead(leadId) {
  leads.delete(leadId);
}

// Периодическая очистка устаревших лидов
setInterval(() => {
  const now = Date.now();
  for (const [id, entry] of leads.entries()) {
    if (now - entry.createdAt > TTL_MS) {
      leads.delete(id);
    }
  }
}, 60 * 60 * 1000); // раз в час

module.exports = { setLead, getLead, deleteLead };


