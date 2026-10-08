(function (PH) {
  const $ = PH.$, h = PH.h, db = PH.db;
  function cal(y, m) {
    const stays = PH.lodgeStays(), first = new Date(y, m, 1), days = new Date(y, m + 1, 0).getDate(), t = PH.today();
    const g = h("div", { class: "cg" }, ["M", "T", "W", "T", "F", "S", "S"].map(d => h("b", {}, d)));
    for (let i = 0; i < (first.getDay() + 6) % 7; i++) g.append(h("span", { class: "x" }));
    for (let d = 1; d <= days; d++) {
      const iso = PH.iso(new Date(y, m, d)), s = stays.find(x => x.from <= iso && iso < x.until);
      g.append(h("span", { class: (s ? (s.kind === "occupied" ? "o" : "r") : "") + (iso === t ? " t" : "") + (iso < t ? " p" : ""), "aria-label": PH.fmt(iso) + (s ? ", " + s.kind : ", free") }, d));
    }
    return h("div", { class: "card cal" }, h("h4", {}, first.toLocaleDateString("en-GB", { month: "long", year: "numeric" })), g);
  }
  function draw() {
    const s = PH.lodgeStatus(), l = db.lodge(), now = new Date();
    $("#a-badge").textContent = ""; $("#a-badge").append(PH.badge(s.state === "free" ? "" : s.state === "reserved" ? "warn" : "busy", s.label));
    $("#a-title").textContent = s.state === "free" ? "Available to book" : "Not available right now";
    $("#a-sub").textContent = s.state === "free" ? "Choose your dates below." : "Free again after check-out on " + PH.fmt(s.free) + ".";
    $("#a-max").textContent = l.maxDays; $("#a-next").textContent = PH.fmt(s.free).replace(/^\w+, /, "");
    const c = $("#cals"); c.textContent = ""; for (let i = 0; i < 3; i++) c.append(cal(now.getFullYear(), now.getMonth() + i));
    form();
  }
  function form() {
    const p = $("#panel"), s = PH.lodgeStatus(), l = db.lodge(), keep = p.querySelector("form");
    if (keep && document.activeElement && keep.contains(document.activeElement)) return;
    p.textContent = "";
    const min = s.free > PH.today() ? s.free : PH.today();
    const f = h("form", { class: "form", novalidate: true }, h("h3", {}, "Request your dates"),
      h("p", { class: "hint" }, "The whole apartment is yours. Maximum stay is " + l.maxDays + " days. Earliest arrival: " + PH.fmt(min) + "."),
      PH.field("an", "Full name", { required: true, autocomplete: "name" }), PH.field("ap", "Phone number", { type: "tel", required: true, autocomplete: "tel" }),
      h("div", { class: "row2" }, PH.field("ad", "Arrival date", { type: "date", required: true, min, value: min }), PH.field("ag", "Nights", { type: "number", required: true, min: 1, max: l.maxDays, value: 1 })),
      h("p", { class: "hint", id: "a-end" }), h("button", { class: "btn", type: "submit" }, "Send request"));
    p.append(f);
    const upd = () => { const d = $("#ad").value, n = +$("#ag").value; $("#a-end").textContent = d && n ? "Check-out date: " + PH.fmt(PH.addDays(d, n)) : ""; };
    $("#ad").addEventListener("input", upd); $("#ag").addEventListener("input", upd); upd();
    f.addEventListener("submit", e => {
      e.preventDefault(); if (!PH.validate(f)) return PH.toast("Please check the highlighted fields.", "err");
      const d = $("#ad").value, n = +$("#ag").value;
      if (n > l.maxDays) { $("#ag").classList.add("invalid"); return PH.toast("The maximum stay is " + l.maxDays + " days.", "err"); }
      if (PH.lodgeOverlaps(d, PH.addDays(d, n))) { $("#ad").classList.add("invalid"); return PH.toast("Those dates overlap an existing stay. Please pick other dates.", "err"); }
      const r = PH.addRequest("lodge", { name: $("#an").value.trim(), phone: $("#ap").value.trim(), arrival: d, nights: n });
      p.textContent = ""; p.append(h("div", { class: "success" }, h("h3", {}, "Request sent"), h("p", {}, PH.fmt(d) + " for " + n + (n > 1 ? " nights" : " night") + ". We will call to confirm."), h("div", { class: "code" }, r.id), h("p", { class: "hint" }, "Keep this code for your records."), h("button", { class: "btn ghost btn-sm", onclick: form }, "Make another request")));
    });
  }
  draw(); PH.on(k => { if (k === "lodge") draw(); });
})(window.PH);
