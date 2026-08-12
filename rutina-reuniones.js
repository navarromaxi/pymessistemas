(() => {
  const manager = document.querySelector("[data-appointment-manager]");
  if (!manager) return;

  const API = "https://www.gymsistemas.com/api/public-online-training/entrenamiento_online/appointments";
  const form = manager.querySelector("[data-appointment-form]");
  const input = manager.querySelector("#appointment-cedula");
  const submit = manager.querySelector("[data-appointment-submit]");
  const status = manager.querySelector("[data-appointment-status]");
  const results = manager.querySelector("[data-appointment-results]");
  let cedula = "";
  let loading = false;
  const formatter = new Intl.DateTimeFormat("es-UY", { weekday: "long", day: "numeric", month: "long", hour: "2-digit", minute: "2-digit", hour12: false, timeZone: "America/Montevideo" });
  const dateFormatter = new Intl.DateTimeFormat("es-UY", { weekday: "long", day: "numeric", month: "long", timeZone: "America/Montevideo" });
  const timeFormatter = new Intl.DateTimeFormat("es-UY", { hour: "2-digit", minute: "2-digit", hour12: false, timeZone: "America/Montevideo" });

  const setStatus = (message, type = "info") => { status.textContent = message; status.dataset.type = type; };
  const setLoading = (value) => { loading = value; submit.disabled = value; submit.textContent = value ? "Buscando..." : "Ver mi reunión"; manager.querySelectorAll("button[data-action]").forEach((button) => { button.disabled = value; }); };
  const escapeHtml = (value) => String(value).replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" })[character]);

  function render(data) {
    const appointments = data.appointments || [];
    const slots = data.slots || [];
    results.hidden = false;
    results.innerHTML = `<div class="appointment-greeting"><strong>Hola, ${escapeHtml(data.clientName)}</strong><span>Gestioná tu charla desde acá.</span></div>${appointments.length ? `<section class="appointment-current"><p class="appointment-label">Tu reunión agendada</p>${appointments.map((appointment) => `<article><div><strong>${formatter.format(new Date(appointment.startsAt))}</strong><span>Si querés cambiarla, cancelala y elegí otro horario.</span></div><button type="button" class="appointment-cancel" data-action="cancel" data-id="${appointment.id}">Cancelar turno</button></article>`).join("")}</section>` : ""}<section class="appointment-slots"><div class="appointment-slots-head"><p class="appointment-label">${appointments.length ? "Otros horarios disponibles" : "Horarios disponibles"}</p><span>30 min por reunión</span></div>${slots.length ? `<div class="appointment-slots-grid">${slots.map((slot) => `<button type="button" data-action="book" data-slot="${slot}"><span>${dateFormatter.format(new Date(slot))}</span><strong>${timeFormatter.format(new Date(slot))}</strong></button>`).join("")}</div>` : `<p class="appointment-empty">No hay horarios disponibles por el momento. Volvé a intentar más tarde.</p>`}</section>`;
  }

  async function load() {
    const response = await fetch(`${API}?cedula=${encodeURIComponent(cedula)}`);
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.error || "No pudimos cargar tu reunión.");
    render(data);
  }

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    cedula = input.value.replace(/\D/g, "");
    if (!cedula) return setStatus("Ingresá una cédula válida.", "error");
    setLoading(true); setStatus("Buscando tu reunión...");
    try { await load(); setStatus("Estos son tus horarios y reuniones disponibles.", "success"); }
    catch (error) { results.hidden = true; setStatus(error.message, "error"); }
    finally { setLoading(false); }
  });

  results.addEventListener("click", async (event) => {
    const button = event.target.closest("button[data-action]");
    if (!button || loading) return;
    const action = button.dataset.action;
    if (action === "cancel" && !window.confirm("¿Querés cancelar esta reunión? Después podrás elegir otro horario.")) return;
    if (action === "book" && !window.confirm(`¿Confirmás la reunión para el ${formatter.format(new Date(button.dataset.slot))}?`)) return;
    setLoading(true); setStatus(action === "cancel" ? "Cancelando tu reunión..." : "Confirmando tu reunión...");
    try {
      const response = await fetch(API, { method: action === "cancel" ? "DELETE" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(action === "cancel" ? { cedula, appointmentId: button.dataset.id } : { cedula, startsAt: button.dataset.slot }) });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || "No pudimos gestionar tu reunión.");
      await load(); setStatus(action === "cancel" ? "Tu reunión fue cancelada. Ya podés elegir otro horario." : "Tu reunión quedó confirmada. Te enviaremos un recordatorio.", "success");
    } catch (error) { setStatus(error.message, "error"); }
    finally { setLoading(false); }
  });
})();
