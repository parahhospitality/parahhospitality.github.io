(function (PH) {
  const $ = PH.$, h = PH.h, C = PH.config, db = PH.db, app = $("#app"), S = sessionStorage;
  let tab = "overview";
  const TABS = [["overview", "Overview"], ["hotel", "White Dove"], ["lounge", "Lounge"], ["apartment", "Apartment"], ["attendance", "Attendance"], ["data", "Data"]];
  const ok = m => PH.toast(m), bad = m => PH.toast(m, "err");

  /* ---------- sign in ---------- */
  function gate() {
    app.textContent = "";
    const f = h("form", { class: "card pad form gate", novalidate: true }, h("h2", {}, "Staff sign in"), h("p", { class: "hint" }, "Enter the staff PIN to manage rooms, tables, the apartment and attendance."),
      PH.field("pin", "Staff PIN", { type: "password", required: true, autocomplete: "current-password", inputmode: "numeric" }), h("button", { class: "btn", type: "submit" }, "Sign in"));
    f.addEventListener("submit", e => {
      e.preventDefault();
      const lock = +S.getItem("parah:lock") || 0; if (Date.now() < lock) return bad("Too many attempts. Try again in a minute.");
      if ($("#pin").value === C.staffPin) { S.setItem("parah:session", "1"); S.removeItem("parah:fails"); shell(); }
      else { const n = (+S.getItem("parah:fails") || 0) + 1; S.setItem("parah:fails", n); if (n >= 5) { S.setItem("parah:lock", Date.now() + 60000); S.setItem("parah:fails", 0); } $("#pin").classList.add("invalid"); bad("Incorrect PIN."); }
    });
    app.append(h("div", { class: "wrap" }, f)); $("#pin").focus();
  }

  function shell() {
    app.textContent = "";
    const tabs = h("div", { class: "tabs", role: "tablist" }, TABS.map(t => h("button", { role: "tab", "aria-selected": t[0] === tab, onclick: () => { tab = t[0]; shell(); } }, t[1] + (t[0] === "overview" && pending().length ? " (" + pending().length + ")" : ""))));
    app.append(h("div", { class: "wrap", style: "padding:34px 20px 70px" }, h("div", { class: "sbar" }, h("h1", { style: "font-size:2.4rem;margin:0" }, "Staff area"),
      h("button", { class: "btn ghost btn-sm", onclick: () => { S.removeItem("parah:session"); gate(); } }, "Sign out")), tabs, h("div", { id: "view" })));
    view();
  }
  const pending = () => db.requests().filter(r => r.status === "pending");
  function view() { const v = $("#view"); if (!v) return; v.textContent = ""; ({ overview, hotel, lounge, apartment, attendance, data })[tab](v); }

  /* ---------- overview ---------- */
  const label = r => { const d = r.data; return ({
    checkin: ["Check-in · room " + d.room, d.name + " · " + d.phone + " · arrives " + PH.fmt(d.arrival) + " for " + d.nights + " night(s)"],
    checkout: ["Check-out · room " + d.room, d.name],
    lodge: ["Apartment · " + PH.fmt(d.arrival), d.name + " · " + d.phone + " · " + d.nights + " night(s)"],
    hall: ["Event hall · " + PH.fmt(d.date), d.name + " · " + d.phone + " · " + d.event + " · " + d.guests + " guests"] })[r.type]; };
  function overview(v) {
    const r = PH.roomsSummary(), t = PH.tablesSummary(), a = PH.lodgeStatus(), att = db.attendance()[PH.today()] || {}, on = Object.keys(att).filter(k => !att[k].out).length;
    v.append(h("div", { class: "stat", style: "margin-bottom:28px" }, [[r.occupied + "/" + r.total, "Rooms occupied"], [t.occupied + "/" + t.total, "Tables occupied"], [a.label, "Apartment"], [on, "Staff on duty"]].map(x => h("div", {}, h("b", {}, x[0]), h("span", {}, x[1])))));
    const p = pending(); v.append(h("h3", {}, "Requests waiting (" + p.length + ")"));
    const box = h("div", { class: "card", style: "margin-bottom:30px" }); v.append(box);
    if (!p.length) box.append(PH.empty("No requests waiting."));
    p.forEach(q => { const l = label(q);
      box.append(h("div", { class: "req" }, h("div", {}, h("b", {}, l[0]), h("p", {}, l[1] + " · " + q.id)),
        h("div", { class: "btn-row" }, h("button", { class: "btn btn-sm", onclick: () => act(q.id, true) }, "Approve"), h("button", { class: "btn btn-sm danger", onclick: () => act(q.id, false) }, "Decline")))); });
    const done = db.requests().filter(x => x.status !== "pending").slice(0, 8);
    if (done.length) { v.append(h("h3", {}, "Recently handled")); v.append(h("div", { class: "card" }, done.map(q => h("div", { class: "req" }, h("div", {}, h("b", {}, label(q)[0]), h("p", {}, label(q)[1] + " · " + q.id)), PH.badge(q.status === "approved" ? "" : "muted", PH.statusText(q.status)))))); }
  }
  function act(id, yes) { const res = PH.resolveRequest(id, yes); (res.ok ? ok : bad)(res.msg); shell(); }

  /* ---------- hotel ---------- */
  function hotel(v) {
    const occ = db.rooms();
    v.append(h("div", { class: "tw" }, h("table", {}, h("thead", {}, h("tr", {}, ["Room", "Type", "Status", "Guest", "Phone", "Until", ""].map(x => h("th", {}, x)))),
      h("tbody", {}, C.rooms.map(r => { const o = occ[r.id];
        return h("tr", {}, h("td", {}, h("b", {}, r.id)), h("td", {}, r.type), h("td", {}, PH.badge(o ? "busy" : "", o ? "Occupied" : "Available")), h("td", {}, o ? o.guest : "–"), h("td", {}, o ? o.phone : "–"), h("td", {}, o ? PH.fmt(o.until) : "–"),
          h("td", {}, o ? h("button", { class: "btn btn-sm danger", onclick: () => { const x = db.rooms(); delete x[r.id]; db.setRooms(x); ok("Room " + r.id + " checked out."); shell(); } }, "Check out")
            : h("button", { class: "btn btn-sm", onclick: () => walkin(r.id) }, "Check in"))); })))));
  }
  function walkin(id) {
    const f = h("form", { class: "form", novalidate: true }, PH.field("wn", "Guest name", { required: true }), PH.field("wp", "Phone", { type: "tel", required: true }), PH.field("wd", "Nights", { type: "number", min: 1, max: 60, value: 1, required: true }));
    const close = PH.modal("Check in · room " + id, f, cl => [h("button", { class: "btn ghost btn-sm", onclick: cl }, "Cancel"), h("button", { class: "btn btn-sm", onclick: () => {
      if (!PH.validate(f)) return; const x = db.rooms(); x[id] = { guest: $("#wn").value.trim(), phone: $("#wp").value.trim(), since: PH.today(), until: PH.addDays(PH.today(), +$("#wd").value) }; db.setRooms(x); cl(); ok("Room " + id + " checked in."); shell(); } }, "Check in")]);
  }

  /* ---------- lounge ---------- */
  function toggle(v, title, items, key, on, off) {
    const l = db.lounge(); v.append(h("h3", { style: "margin-top:28px" }, title));
    v.append(h("div", { class: "grid g2" }, items.map(n => { const bad_ = l[key][n]; return h("div", { class: "card item" }, h("h4", {}, n), h("div", { class: "btn-row" }, PH.badge(bad_ ? "muted" : "", bad_ ? off : on),
      h("button", { class: "btn ghost btn-sm", "aria-label": "Toggle " + n, onclick: () => { const x = db.lounge(); x[key][n] = x[key][n] ? 0 : 1; db.setLounge(x); view(); } }, "Mark " + (bad_ ? on.toLowerCase() : off.toLowerCase())))); })));
  }
  function lounge(v) {
    const l = db.lounge(); v.append(h("h3", {}, "Tables"));
    const g = h("div", { class: "grid g4" }); v.append(g);
    for (let i = 1; i <= C.tables; i++) { const o = l.tables[i]; g.append(h("button", { class: "card tbl " + (o ? "busy" : "free"), style: "cursor:pointer;font:inherit", "aria-label": "Table " + i + (o ? " occupied" : " free") + ", tap to change",
      onclick: () => { const x = db.lounge(); x.tables[i] = x.tables[i] ? 0 : 1; db.setLounge(x); view(); } }, h("span", { class: "n" }, i), PH.badge(o ? "busy" : "", o ? "Occupied" : "Free"))); }
    toggle(v, "Arabian tea", C.tea.map(t => t.name), "tea", "Available", "Sold out");
    toggle(v, "Games", C.games.map(t => t.name), "games", "Free", "In use");
    v.append(h("h3", { style: "margin-top:28px" }, "Event hall bookings"));
    const box = h("div", { class: "card" }); v.append(box);
    const hall = l.hall.slice().sort((a, b) => a.date < b.date ? -1 : 1);
    if (!hall.length) box.append(PH.empty("No bookings."));
    hall.forEach(b => box.append(h("div", { class: "req" }, h("div", {}, h("b", {}, PH.fmt(b.date)), h("p", {}, [b.name, b.type, b.guests ? b.guests + " guests" : ""].filter(Boolean).join(" · "))),
      h("button", { class: "btn btn-sm danger", onclick: () => { const x = db.lounge(); x.hall = x.hall.filter(y => y !== b && !(y.date === b.date && y.name === b.name)); db.setLounge(x); view(); } }, "Remove"))));
    const f = h("form", { class: "card pad form", style: "margin-top:16px", novalidate: true }, h("h4", {}, "Add a booking"), h("div", { class: "row2" }, PH.field("bd", "Date", { type: "date", required: true, min: PH.today() }), PH.field("bn", "Name", { required: true })),
      PH.field("be", "Event", { required: true }), h("button", { class: "btn btn-sm", type: "submit", style: "justify-self:start" }, "Add booking"));
    f.addEventListener("submit", e => { e.preventDefault(); if (!PH.validate(f)) return; const x = db.lounge(); if (x.hall.some(y => y.date === $("#bd").value)) return bad("Already booked on that date."); x.hall.push({ date: $("#bd").value, name: $("#bn").value.trim(), type: $("#be").value.trim() }); db.setLounge(x); ok("Booking added."); view(); });
    v.append(f);
  }

  /* ---------- apartment ---------- */
  function apartment(v) {
    const l = db.lodge(), s = PH.lodgeStatus();
    v.append(h("div", { class: "card pad", style: "margin-bottom:22px" }, h("div", { class: "sbar", style: "margin:0" }, h("div", {}, PH.badge(s.state === "free" ? "" : "busy", s.label), h("h3", { style: "margin:8px 0 0" }, "Ministers Apartment"),
      l.current ? h("p", { style: "margin:4px 0 0;color:var(--muted)" }, l.current.guest + " · " + l.current.phone + " · until " + PH.fmt(l.current.until)) : null),
      l.current ? h("button", { class: "btn danger", onclick: () => { const x = db.lodge(); x.current = null; db.setLodge(x); ok("Apartment checked out and available."); shell(); } }, "Check out guest") : null)));
    if (!l.current) {
      const f = h("form", { class: "card pad form", style: "margin-bottom:22px", novalidate: true }, h("h4", {}, "Check in a guest now"), h("div", { class: "row2" }, PH.field("gn", "Guest name", { required: true }), PH.field("gp", "Phone", { type: "tel", required: true })),
        PH.field("gd", "Nights (max " + l.maxDays + ")", { type: "number", min: 1, max: l.maxDays, value: 1, required: true }), h("button", { class: "btn", type: "submit", style: "justify-self:start" }, "Check in"));
      f.addEventListener("submit", e => { e.preventDefault(); if (!PH.validate(f)) return; const n = +$("#gd").value, t = PH.today(), u = PH.addDays(t, n);
        if (PH.lodgeOverlaps(t, u)) return bad("This overlaps a reservation. Shorten the stay."); const x = db.lodge(); x.current = { guest: $("#gn").value.trim(), phone: $("#gp").value.trim(), from: t, until: u }; db.setLodge(x); ok("Guest checked in."); shell(); });
      v.append(f);
    }
    v.append(h("h3", {}, "Reservations")); const box = h("div", { class: "card", style: "margin-bottom:22px" }); v.append(box);
    if (!l.reservations.length) box.append(PH.empty("No reservations."));
    l.reservations.forEach((r, i) => box.append(h("div", { class: "req" }, h("div", {}, h("b", {}, PH.fmt(r.from) + " → " + PH.fmt(r.until)), h("p", {}, r.guest + " · " + r.phone)),
      h("div", { class: "btn-row" }, !l.current ? h("button", { class: "btn btn-sm", onclick: () => { const x = db.lodge(); x.current = { guest: r.guest, phone: r.phone, from: PH.today(), until: r.until }; x.reservations.splice(i, 1); db.setLodge(x); ok("Guest checked in."); shell(); } }, "Check in now") : null,
        h("button", { class: "btn btn-sm danger", onclick: () => { const x = db.lodge(); x.reservations.splice(i, 1); db.setLodge(x); shell(); } }, "Cancel")))));
    const f = h("form", { class: "card pad form", novalidate: true }, h("h4", {}, "Maximum stay"), PH.field("mx", "Days", { type: "number", min: 1, max: 365, value: l.maxDays, required: true }), h("button", { class: "btn ghost btn-sm", type: "submit", style: "justify-self:start" }, "Save"));
    f.addEventListener("submit", e => { e.preventDefault(); if (!PH.validate(f)) return; const x = db.lodge(); x.maxDays = +$("#mx").value; db.setLodge(x); ok("Maximum stay saved."); });
    v.append(f);
  }

  /* ---------- attendance ---------- */
  const mins = t => { const p = (t || "").split(":"); return p.length === 2 ? +p[0] * 60 + +p[1] : null; };
  function attendance(v) {
    const staff = db.staff(), att = db.attendance(), t = PH.today(), today = att[t] || {};
    const f = h("form", { class: "card pad form", style: "margin-bottom:22px", novalidate: true }, h("h4", {}, "Add a staff member"), h("div", { class: "row2" }, PH.field("sn", "Name", { required: true }), h("div", { style: "align-self:end" }, h("button", { class: "btn btn-sm", type: "submit" }, "Add"))));
    f.addEventListener("submit", e => { e.preventDefault(); if (!PH.validate(f)) return; const n = $("#sn").value.trim(), s = db.staff(); if (s.indexOf(n) > -1) return bad("Already on the list."); s.push(n); db.setStaff(s); ok(n + " added."); view(); });
    v.append(f, h("h3", {}, "Today · " + PH.fmt(t)));
    if (!staff.length) { v.append(PH.empty("Add your staff above to start taking attendance.")); return; }
    v.append(h("div", { class: "tw" }, h("table", {}, h("thead", {}, h("tr", {}, ["Staff", "Clock in", "Clock out", "", ""].map(x => h("th", {}, x)))),
      h("tbody", {}, staff.map(n => { const r = today[n];
        return h("tr", {}, h("td", {}, h("b", {}, n)), h("td", {}, r ? r.in : "–"), h("td", {}, r ? (r.out || "On duty") : "–"),
          h("td", {}, h("button", { class: "btn btn-sm", disabled: !!r, onclick: () => mark(n, "in") }, "Clock in")), h("td", {}, h("button", { class: "btn btn-sm ghost", disabled: !r || !!r.out, onclick: () => mark(n, "out") }, "Clock out"))); })))));
    const days = []; for (let i = 0; i < 7; i++) days.push(PH.addDays(t, -i));
    v.append(h("h3", { style: "margin-top:30px" }, "Last 7 days (hours worked)"), h("div", { class: "tw" }, h("table", {}, h("thead", {}, h("tr", {}, [h("th", {}, "Staff")].concat(days.map(d => h("th", {}, d.slice(5)))))),
      h("tbody", {}, staff.map(n => h("tr", {}, [h("td", {}, h("b", {}, n))].concat(days.map(d => { const r = (att[d] || {})[n]; if (!r) return h("td", {}, "–"); const a = mins(r.in), b = mins(r.out); return h("td", {}, b != null && a != null ? ((b - a) / 60).toFixed(1) : "In"); }))))))));
    v.append(h("p", { class: "hint", style: "margin-top:12px" }, "Remove a staff member: "), h("div", { class: "btn-row" }, staff.map(n => h("button", { class: "btn btn-sm ghost", onclick: () => { db.setStaff(db.staff().filter(x => x !== n)); view(); } }, n + " ×"))));
  }
  function mark(n, kind) { const a = db.attendance(), t = PH.today(); a[t] = a[t] || {}; if (kind === "in") a[t][n] = { in: PH.time(), out: "" }; else if (a[t][n]) a[t][n].out = PH.time(); db.setAttendance(a); ok(n + " clocked " + kind + " at " + PH.time()); view(); }

  /* ---------- data ---------- */
  function data(v) {
    v.append(h("p", { class: "notice" }, "Data is stored in this browser. Export a backup regularly. See the README to connect a shared database for all devices."),
      h("div", { class: "btn-row" }, h("button", { class: "btn", onclick: () => { const b = new Blob([JSON.stringify(db.exportAll(), null, 2)], { type: "application/json" }), a = h("a", { href: URL.createObjectURL(b), download: "parah-backup-" + PH.today() + ".json" }); document.body.append(a); a.click(); a.remove(); } }, "Export backup"),
        h("label", { class: "btn ghost", style: "cursor:pointer" }, "Import backup", h("input", { type: "file", accept: "application/json", style: "display:none", onchange: e => { const f = e.target.files[0]; if (!f) return; f.text().then(t => { try { db.importAll(JSON.parse(t)); ok("Backup restored."); shell(); } catch (x) { bad("That file is not a valid backup."); } }); } })),
        h("button", { class: "btn danger", onclick: () => PH.modal("Reset all data?", h("p", {}, "This clears every room, table, reservation, request and attendance record in this browser. It cannot be undone."), cl => [h("button", { class: "btn ghost btn-sm", onclick: cl }, "Cancel"), h("button", { class: "btn btn-sm", onclick: () => { db.resetAll(); cl(); ok("All data cleared."); shell(); } }, "Yes, reset")]) }, "Reset all data")));
  }

  PH.on(k => { if (S.getItem("parah:session") === "1" && !document.querySelector("dialog[open]") && !(document.activeElement && /INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName))) shell(); });
  S.getItem("parah:session") === "1" ? shell() : gate();
})(window.PH);
