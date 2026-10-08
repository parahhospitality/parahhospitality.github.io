/* Data layer. Today it saves to the browser (localStorage) so the project runs on any static host.
   To go live with real shared data, replace the read/write functions with calls to your API (see README). */
window.PH = window.PH || {};
(function (PH) {
  const C = window.PH_CONFIG, P = "parah:", subs = [];
  const read = (k, d) => { try { const v = localStorage.getItem(P + k); return v ? JSON.parse(v) : d; } catch (e) { return d; } };
  const write = (k, v) => { try { localStorage.setItem(P + k, JSON.stringify(v)); } catch (e) {} emit(k); };
  const emit = k => subs.forEach(f => f(k));
  window.addEventListener("storage", e => { if (e.key && e.key.indexOf(P) === 0) emit(e.key.slice(P.length)); });

  PH.config = C;
  PH.on = f => subs.push(f);
  PH.iso = d => d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
  PH.today = () => PH.iso(new Date());
  PH.addDays = (iso, n) => { const d = new Date(iso + "T12:00:00"); d.setDate(d.getDate() + n); return PH.iso(d); };
  PH.fmt = iso => iso ? new Date(iso + "T12:00:00").toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short", year: "numeric" }) : "";
  PH.time = () => new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });

  PH.db = {
    rooms: () => read("rooms", {}),                       // { "101": {guest, phone, since, until} }
    setRooms: v => write("rooms", v),
    lounge: () => Object.assign({ tables: {}, tea: {}, games: {}, hall: [] }, read("lounge", {})),
    setLounge: v => write("lounge", v),                   // tables{n:1=occupied}, tea{name:1=sold out}, games{name:1=in use}, hall[{date,name,type}]
    lodge: () => Object.assign({ maxDays: C.lodge.maxDays, current: null, reservations: [] }, read("lodge", {})),
    setLodge: v => write("lodge", v),
    requests: () => read("requests", []),
    setRequests: v => write("requests", v),
    staff: () => read("staff", []),
    setStaff: v => write("staff", v),
    attendance: () => read("attendance", {}),             // { "2026-10-08": { "Ada": {in, out} } }
    setAttendance: v => write("attendance", v),
    exportAll: () => { const o = {}; ["rooms", "lounge", "lodge", "requests", "staff", "attendance"].forEach(k => o[k] = read(k, null)); return o; },
    importAll: o => { Object.keys(o || {}).forEach(k => { if (o[k] != null) write(k, o[k]); }); },
    resetAll: () => { ["rooms", "lounge", "lodge", "requests", "staff", "attendance"].forEach(k => { try { localStorage.removeItem(P + k); } catch (e) {} emit(k); }); }
  };

  /* Apartment helpers: busy = checked-in stay or approved reservation. "until" is the check-out date. */
  PH.lodgeStays = function () {
    const l = PH.db.lodge(), list = [];
    if (l.current) list.push({ from: l.current.from, until: l.current.until, kind: "occupied" });
    l.reservations.forEach(r => list.push({ from: r.from, until: r.until, kind: "reserved" }));
    return list;
  };
  PH.lodgeStatus = function () {
    const t = PH.today(), l = PH.db.lodge();
    if (l.current) return { state: "occupied", label: "Occupied", free: l.current.until, max: l.maxDays };
    const r = l.reservations.find(x => x.from <= t && t < x.until);
    if (r) return { state: "reserved", label: "Reserved", free: r.until, max: l.maxDays };
    return { state: "free", label: "Available", free: t, max: l.maxDays };
  };
  PH.lodgeOverlaps = function (from, until) { return PH.lodgeStays().some(s => from < s.until && s.from < until); };

  PH.roomsSummary = function () {
    const occ = PH.db.rooms(), total = C.rooms.length, o = C.rooms.filter(r => occ[r.id]).length;
    return { total, occupied: o, free: total - o };
  };
  PH.tablesSummary = function () {
    const t = PH.db.lounge().tables, n = C.tables; let o = 0;
    for (let i = 1; i <= n; i++) if (t[i]) o++;
    return { total: n, occupied: o, free: n - o };
  };

  /* Guest requests (check-in, check-out, apartment, hall) wait here until staff approve them. */
  PH.addRequest = function (type, data) {
    const list = PH.db.requests();
    const id = "PH-" + Math.random().toString(36).slice(2, 7).toUpperCase();
    const req = { id, type, data, status: "pending", created: new Date().toISOString() };
    list.unshift(req); PH.db.setRequests(list); return req;
  };
  PH.findRequest = id => PH.db.requests().find(r => r.id === String(id || "").trim().toUpperCase());

  /* Applies an approved request to the live data. Returns {ok, msg}. */
  PH.applyRequest = function (req) {
    const d = req.data;
    if (req.type === "checkin") {
      const rooms = PH.db.rooms();
      if (rooms[d.room]) return { ok: false, msg: "Room " + d.room + " is already occupied." };
      rooms[d.room] = { guest: d.name, phone: d.phone, since: d.arrival, until: PH.addDays(d.arrival, d.nights) };
      PH.db.setRooms(rooms); return { ok: true, msg: d.name + " checked in to room " + d.room + "." };
    }
    if (req.type === "checkout") {
      const rooms = PH.db.rooms(); delete rooms[d.room]; PH.db.setRooms(rooms);
      return { ok: true, msg: "Room " + d.room + " is now available." };
    }
    if (req.type === "lodge") {
      const until = PH.addDays(d.arrival, d.nights);
      if (PH.lodgeOverlaps(d.arrival, until)) return { ok: false, msg: "Those dates are no longer free." };
      const l = PH.db.lodge(); l.reservations.push({ from: d.arrival, until, guest: d.name, phone: d.phone });
      PH.db.setLodge(l); return { ok: true, msg: "Apartment reserved for " + d.name + "." };
    }
    if (req.type === "hall") {
      const l = PH.db.lounge();
      if (l.hall.some(h => h.date === d.date)) return { ok: false, msg: "The hall is already booked on that date." };
      l.hall.push({ date: d.date, name: d.name, type: d.event, guests: d.guests, phone: d.phone });
      PH.db.setLounge(l); return { ok: true, msg: "Event hall booked for " + PH.fmt(d.date) + "." };
    }
    return { ok: false, msg: "Unknown request." };
  };
  PH.resolveRequest = function (id, approve) {
    const list = PH.db.requests(), req = list.find(r => r.id === id);
    if (!req) return { ok: false, msg: "Request not found." };
    let res = { ok: true, msg: "Request declined." };
    if (approve) { res = PH.applyRequest(req); if (!res.ok) return res; }
    req.status = approve ? "approved" : "declined"; req.resolved = new Date().toISOString();
    PH.db.setRequests(list); return res;
  };
})(window.PH);
