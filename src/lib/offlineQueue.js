/**
 * File d'attente hors-ligne pour la collecte de données terrain.
 *
 * Portée assumée et honnête : ceci ne rend pas TOUTE l'application
 * utilisable hors-ligne (la plupart des écrans ont besoin du serveur pour
 * afficher des données à jour). Ce module cible précisément le cas d'usage
 * décrit — une équipe en zone rurale, connexion instable, qui doit pouvoir
 * enregistrer une remontée terrain (activité, bénéficiaires touchés) même
 * sans réseau, avec synchronisation automatique dès que la connexion
 * revient.
 *
 * Stockage : localStorage (simple, synchrone, suffisant pour de petites
 * quantités de texte en attente — pas besoin d'IndexedDB pour ce volume).
 */

const QUEUE_KEY = "gpo_offline_activity_updates";

function readQueue() {
  try {
    const raw = localStorage.getItem(QUEUE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function writeQueue(queue) {
  try {
    localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
  } catch {
    // Stockage plein ou indisponible (navigation privée) — on abandonne
    // silencieusement plutôt que de casser la saisie en cours.
  }
}

/** Ajoute une remontée terrain à la file d'attente locale, en attendant la connexion. */
export function queueActivityUpdate(activityId, payload) {
  const queue = readQueue();
  queue.push({ id: `${Date.now()}-${Math.random().toString(36).slice(2)}`, activityId, payload, queuedAt: new Date().toISOString() });
  writeQueue(queue);
  return queue.length;
}

/** Nombre de remontées en attente de synchronisation. */
export function pendingActivityUpdatesCount() {
  return readQueue().length;
}

/**
 * Tente d'envoyer chaque remontée en attente au serveur. Les envois réussis
 * sont retirés de la file ; les échecs (toujours hors-ligne, par exemple)
 * restent en attente pour la prochaine tentative.
 */
export async function syncQueuedActivityUpdates(createActivityUpdateFn) {
  const queue = readQueue();
  if (queue.length === 0) return { synced: 0, remaining: 0 };

  const stillQueued = [];
  let synced = 0;
  for (const item of queue) {
    try {
      await createActivityUpdateFn(item.activityId, item.payload);
      synced += 1;
    } catch {
      stillQueued.push(item);
    }
  }
  writeQueue(stillQueued);
  return { synced, remaining: stillQueued.length };
}
