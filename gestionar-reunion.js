(() => {
  const API = "https://www.gymsistemas.com/api/public-online-training/entrenamiento_online/appointments";
  const form = document.querySelector("[data-meeting-form]");
  const input = document.querySelector("#meeting-cedula");
  const submit = document.querySelector("[data-meeting-submit]");
  const status = document.querySelector("[data-meeting-status]");
  const results = document.querySelector("[data-meeting-results]");
  let cedula = ""; let data = null; let selectedDate = ""; let loading = false;
  const full = new Intl.DateTimeFormat("es-UY", { weekday: "long", day: "numeric", month: "long", hour: "2-digit", minute: "2-digit", hour12: false, timeZone: "America/Montevideo" });
  const day = new Intl.DateTimeFormat("es-UY", { weekday: "short", day: "numeric", month: "short", timeZone: "America/Montevideo" });
  const time = new Intl.DateTimeFormat("es-UY", { hour: "2-digit", minute: "2-digit", hour12: false, timeZone: "America/Montevideo" });
  const dateKey = (value) => new Intl.DateTimeFormat("en-CA", { year: "numeric", month: "2-digit", day: "2-digit", timeZone: "America/Montevideo" }).format(new Date(value));
  const esc = (value) => String(value).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" })[c]);
  const setStatus = (message, kind = "info") => { status.textContent = message; status.dataset.kind = kind; };
  const setLoading = (value) => { loading = value; submit.disabled = value; submit.textContent = value ? "Buscando…" : "Continuar"; document.querySelectorAll("button[data-action]").forEach((button) => { button.disabled = value; }); };

  function render() {
    const appointments = data.appointments || [];
    const grouped = (data.slots || []).reduce((all, slot) => { const key = dateKey(slot); (all[key] ||= []).push(slot); return all; }, {});
    const dates = Object.keys(grouped);
    if (!selectedDate || !grouped[selectedDate]) selectedDate = dates[0] || "";
    const options = dates.map((key) => `<option value="${key}" ${key === selectedDate ? "selected" : ""}>${day.format(new Date(grouped[key][0]))} · ${grouped[key].length} horarios</option>`).join("");
    const times = (grouped[selectedDate] || []).map((slot) => `<button type="button" data-action="book" data-slot="${slot}" class="meeting-time">${time.format(new Date(slot))}</button>`).join("");
    results.hidden = false;
    results.innerHTML = `<div class="meeting-greeting"><strong>Hola, ${esc(data.clientName)}</strong><span>Acá podés gestionar tu charla.</span></div>${appointments.length ? `<section class="meeting-current"><p>Tu reunión agendada</p>${appointments.map((appointment) => `<article><div><strong>${full.format(new Date(appointment.startsAt))}</strong><span>¿Necesitás cambiarla? Cancelala y elegí otro día.</span></div><button type="button" data-action="cancel" data-id="${appointment.id}">Cancelar reunión</button></article>`).join("")}</section>` : ""}<section class="meeting-availability"><div class="availability-title"><div><p>Elegí un día</p><span>Después seleccioná el horario que te quede mejor.</span></div><em>30 min</em></div>${dates.length ? `<label class="meeting-day-select"><span>Fecha disponible</span><select data-day-select>${options}</select></label><div class="meeting-times"><p>${day.format(new Date(grouped[selectedDate][0]))}</p><div>${times}</div></div>` : `<div class="meeting-empty">No hay horarios disponibles por ahora. Volvé a intentar más tarde.</div>`}</section>`;
  }
  async function load() { const response = await fetch(`${API}?cedula=${encodeURIComponent(cedula)}`); const payload = await response.json().catch(() => ({})); if (!response.ok) throw new Error(payload.error || "No pudimos cargar tu reunión."); data = payload; render(); }
  form.addEventListener("submit", async (event) => { event.preventDefault(); cedula = input.value.replace(/\D/g, ""); if (!cedula) return setStatus("Ingresá una cédula válida.", "error"); setLoading(true); setStatus("Buscando tu agenda…"); try { await load(); setStatus("Elegí el día y horario que te quede mejor.", "success"); } catch (error) { results.hidden = true; setStatus(error.message, "error"); } finally { setLoading(false); } });
  results.addEventListener("change", (event) => { const select = event.target.closest("[data-day-select]"); if (!select) return; selectedDate = select.value; render(); });
  results.addEventListener("click", async (event) => { const button = event.target.closest("button[data-action]"); if (!button || loading) return; const cancel = button.dataset.action === "cancel"; if (!window.confirm(cancel ? "¿Querés cancelar esta reunión? Después podrás elegir otro horario." : `¿Confirmás la reunión para el ${full.format(new Date(button.dataset.slot))}?`)) return; setLoading(true); setStatus(cancel ? "Cancelando tu reunión…" : "Confirmando tu reunión…"); try { const response = await fetch(API, { method: cancel ? "DELETE" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(cancel ? { cedula, appointmentId: button.dataset.id } : { cedula, startsAt: button.dataset.slot }) }); const payload = await response.json().catch(() => ({})); if (!response.ok) throw new Error(payload.error || "No pudimos gestionar tu reunión."); await load(); setStatus(cancel ? "Tu reunión fue cancelada. Elegí un día para agendar otra." : "Tu reunión quedó confirmada. Te enviaremos un recordatorio.", "success"); } catch (error) { setStatus(error.message, "error"); } finally { setLoading(false); } });
  const initialCedula = new URLSearchParams(window.location.search).get("cedula") || ""; if (initialCedula) { input.value = initialCedula; form.requestSubmit(); }
})();
