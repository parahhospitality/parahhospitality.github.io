(function (PH) {
  const $ = PH.$, $$ = PH.$$, h = PH.h, C = PH.config, db = PH.db;
  let filter = "all", type = "All", tab = "in", preselect = null;
  const types = ["All"].concat(C.rooms.map(r => r.type).filter((t, i, a) => a.indexOf(t) === i));

  $("#types").append(...types.map(t => h("button", { "aria-pressed": t === type, "data-t": t, onclick: () => { type = t; draw(); } }, t)));
  $$("[data-f]").forEach(b => b.addEventListener("click", () => { filter = b.dataset.f; draw(); }));
  $$(".tabs [data-t]").forEach(b => b.addEventListener("click", () => { tab = b.dataset.t; form(); }));

  function draw() {
    const occ = db.rooms(), s = PH.roomsSummary();
    $("#n-free").textContent = s.free; $("#n-occ").textContent = s.occupied;
    $$("[data-f]").forEach(b => b.setAttribute("aria-pressed", b.dataset.f === filter));
    $$("#types button").forEach(b => b.setAttribute("aria-pressed", b.dataset.t === type));
    const box = $("#rooms"); box.textContent = "";
    const list = C.rooms.filter(r => (type === "All" || r.type === type) && (filter === "all" || (filter === "free") === !occ[r.id]));
    if (!list.length) box.append(PH.empty("No rooms match this filter."));
    list.forEach(r => {
      const o = occ[r.id];
      box.append(h("div", { class: "card room " + (o ? "busy" : "free"), id: "room-" + r.id },
        h("span", { class: "n" }, r.id), h("small", {}, r.type + " · " + PH.price(r)),
        PH.badge(o ? "busy" : "", o ? "Occupied" : "Available"),
        o ? h("small", {}, o.until ? "Expected free: " + PH.fmt(o.until) : "") : h("button", { class: "btn btn-sm", onclick: () => { preselect = r.id; tab = "in"; form(); $("#panel").scrollIntoView({ behavior: "smooth", block: "start" }); } }, "Request room")));
    });
    if (!$("#tab-body").children.length) form(); else refreshSelects();
  }

  function refreshSelects() {
    const occ = db.rooms(), sel = $("#room-in");
    if (sel) { const v = sel.value; sel.textContent = ""; C.rooms.filter(r => !occ[r.id]).forEach(r => sel.append(h("option", { value: r.id }, "Room " + r.id + " (" + r.type + ")"))); if (v) sel.value = v; }
  }

  function form() {
    $$(".tabs [data-t]").forEach(b => b.setAttribute("aria-selected", b.dataset.t === tab));
    const body = $("#tab-body"); body.textContent = "";
    const occ = db.rooms();
    if (tab === "in") {
      const free = C.rooms.filter(r => !occ[r.id]);
      if (!free.length) return body.append(PH.empty("All rooms are occupied right now. Please check again later or call us."));
      const f = h("form", { class: "form", novalidate: true },
        h("p", { class: "hint" }, "Send your details. Staff will confirm your room and call you."),
        PH.field("room-in", "Room", { tag: "select", required: true }),
        PH.field("name-in", "Full name", { required: true, autocomplete: "name" }),
        PH.field("phone-in", "Phone number", { type: "tel", required: true, autocomplete: "tel", pattern: "[0-9+ ]{7,}" }),
        h("div", { class: "row2" }, PH.field("arr-in", "Arrival date", { type: "date", required: true, min: PH.today(), value: PH.today() }),
          PH.field("nights-in", "Nights", { type: "number", required: true, min: 1, max: 60, value: 1 })),
        h("button", { class: "btn", type: "submit" }, "Send check-in request"));
      body.append(f); refreshSelects(); if (preselect) { $("#room-in").value = preselect; preselect = null; }
      f.addEventListener("submit", e => {
        e.preventDefault(); if (!PH.validate(f)) return PH.toast("Please check the highlighted fields.", "err");
        const room = $("#room-in").value; if (db.rooms()[room]) { PH.toast("Sorry, that room was just taken.", "err"); return form(); }
        done(PH.addRequest("checkin", { room, name: $("#name-in").value.trim(), phone: $("#phone-in").value.trim(), arrival: $("#arr-in").value, nights: +$("#nights-in").value }),
          "We will confirm room " + room + " shortly.");
      });
    } else if (tab === "out") {
      const taken = C.rooms.filter(r => occ[r.id]);
      if (!taken.length) return body.append(PH.empty("No rooms are occupied at the moment."));
      const f = h("form", { class: "form", novalidate: true },
        h("p", { class: "hint" }, "Enter the room you are leaving and the name it was booked under."),
        PH.field("room-out", "Your room", { tag: "select", required: true }),
        PH.field("name-out", "Name on the booking", { required: true }),
        h("button", { class: "btn", type: "submit" }, "Send check-out request"));
      body.append(f); taken.forEach(r => $("#room-out").append(h("option", { value: r.id }, "Room " + r.id)));
      f.addEventListener("submit", e => {
        e.preventDefault(); if (!PH.validate(f)) return PH.toast("Please fill in every field.", "err");
        const room = $("#room-out").value, rec = db.rooms()[room], n = $("#name-out").value.trim().toLowerCase();
        if (!rec || !rec.guest.toLowerCase().split(/\s+/).some(w => w.length > 1 && n.indexOf(w) > -1)) { $("#name-out").classList.add("invalid"); return PH.toast("That name does not match room " + room + ".", "err"); }
        done(PH.addRequest("checkout", { room, name: $("#name-out").value.trim() }), "Staff will confirm your check-out for room " + room + ".");
      });
    } else {
      const f = h("form", { class: "form", novalidate: true }, h("p", { class: "hint" }, "Enter the reference code you received."),
        PH.field("code", "Reference code", { required: true, placeholder: "PH-XXXXX" }), h("button", { class: "btn", type: "submit" }, "Check status"), h("div", { id: "track-out" }));
      body.append(f);
      f.addEventListener("submit", e => {
        e.preventDefault(); const r = PH.findRequest($("#code").value), o = $("#track-out"); o.textContent = "";
        o.append(r ? h("div", { class: "notice" }, h("b", {}, PH.statusText(r.status)), " · " + (r.type === "checkin" ? "Check-in" : r.type === "checkout" ? "Check-out" : "Request") + " for room " + (r.data.room || "")) : h("div", { class: "notice" }, "We could not find that code. Please check it and try again."));
      });
    }
  }

  function done(req, msg) {
    const b = $("#tab-body"); b.textContent = "";
    b.append(h("div", { class: "success" }, h("h3", {}, "Request sent"), h("p", {}, msg), h("div", { class: "code" }, req.id),
      h("p", { class: "hint" }, "Keep this code. Use the Track tab to see when staff confirm it."), h("button", { class: "btn ghost btn-sm", onclick: form }, "Make another request")));
    PH.toast("Request sent. Code " + req.id);
  }

  draw(); PH.on(k => { if (k === "rooms") draw(); });
  if (location.hash.indexOf("#room-") === 0) setTimeout(() => { const e = $(location.hash); if (e) e.scrollIntoView({ block: "center" }); }, 200);
})(window.PH);
