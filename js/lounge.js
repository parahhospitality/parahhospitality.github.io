(function (PH) {
  const $ = PH.$, h = PH.h, C = PH.config, db = PH.db;
  function draw() {
    const l = db.lounge(), s = PH.tablesSummary();
    $("#t-free").textContent = s.free; $("#t-occ").textContent = s.occupied;
    const tb = $("#tables"); tb.textContent = "";
    for (let i = 1; i <= C.tables; i++) { const o = l.tables[i];
      tb.append(h("div", { class: "card tbl " + (o ? "busy" : "free") }, h("span", { class: "n" }, i), h("small", {}, "Table"), h("div", {}, PH.badge(o ? "busy" : "", o ? "Occupied" : "Free")))); }
    const list = (id, items, key, on, off) => { const box = $(id); box.textContent = "";
      items.forEach(it => { const bad = l[key][it.name];
        box.append(h("div", { class: "card item" + (bad ? " off" : "") }, h("div", {}, h("h4", {}, it.name), h("p", {}, it.desc)), PH.badge(bad ? "muted" : "", bad ? off : on))); }); };
    list("#tea", C.tea, "tea", "Available", "Sold out");
    list("#games", C.games, "games", "Free", "In use");
    const t = PH.today(), booked = l.hall.filter(x => x.date >= t).map(x => x.date).sort();
    $("#hall-status").textContent = ""; $("#hall-status").append(PH.badge(booked[0] === t ? "busy" : "", booked[0] === t ? "Booked today" : "Free today"));
    const hd = $("#hall-dates"); hd.textContent = "";
    if (!booked.length) hd.append(h("span", { class: "hint" }, "No upcoming bookings yet."));
    booked.forEach(d => hd.append(h("span", { class: "chip" }, PH.fmt(d))));
  }
  function hallForm() {
    const c = $("#hall-card"); c.textContent = "";
    const f = h("form", { class: "form", novalidate: true }, h("h3", {}, "Event hall enquiry"),
      PH.field("hn", "Your name", { required: true, autocomplete: "name" }), PH.field("hp", "Phone number", { type: "tel", required: true, autocomplete: "tel" }),
      h("div", { class: "row2" }, PH.field("hd", "Event date", { type: "date", required: true, min: PH.today() }), PH.field("hg", "Guests", { type: "number", required: true, min: 1, max: 1000 })),
      PH.field("he", "Type of event", { required: true, placeholder: "Birthday, meeting, naming…" }),
      h("button", { class: "btn", type: "submit" }, "Send enquiry"));
    c.append(f);
    f.addEventListener("submit", e => {
      e.preventDefault(); if (!PH.validate(f)) return PH.toast("Please check the highlighted fields.", "err");
      const date = $("#hd").value;
      if (db.lounge().hall.some(x => x.date === date)) { $("#hd").classList.add("invalid"); return PH.toast("The hall is already booked on that date. Please choose another.", "err"); }
      const r = PH.addRequest("hall", { name: $("#hn").value.trim(), phone: $("#hp").value.trim(), date, guests: +$("#hg").value, event: $("#he").value.trim() });
      c.textContent = ""; c.append(h("div", { class: "success" }, h("h3", {}, "Enquiry sent"), h("p", {}, "We will call you to confirm " + PH.fmt(date) + "."), h("div", { class: "code" }, r.id), h("button", { class: "btn ghost btn-sm", onclick: hallForm }, "Send another")));
    });
  }
  draw(); hallForm(); PH.on(k => { if (k === "lounge") draw(); });
})(window.PH);
