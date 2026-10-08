/* Shared UI: header, footer, toasts, modals, helpers. */
(function (PH) {
  const C = PH.config;
  PH.$ = (s, r) => (r || document).querySelector(s);
  PH.$$ = (s, r) => Array.from((r || document).querySelectorAll(s));
  PH.h = function (tag, attrs) {
    const e = document.createElement(tag), kids = Array.prototype.slice.call(arguments, 2);
    for (const k in attrs || {}) {
      const v = attrs[k]; if (v == null || v === false) continue;
      if (k === "class") e.className = v; else if (k === "text") e.textContent = v;
      else if (k.indexOf("on") === 0) e.addEventListener(k.slice(2), v); else e.setAttribute(k, v === true ? "" : v);
    }
    [].concat.apply([], kids).forEach(c => { if (c == null || c === false) return; e.append(c.nodeType ? c : document.createTextNode(c)); });
    return e;
  };
  const h = PH.h, $ = PH.$;

  const NAV = [["index.html", "Home", "home"], ["white-dove.html", "White Dove", "white-dove"],
    ["cash-out-lounge.html", "Cash Out Lounge", "lounge"], ["ministers-apartment.html", "Ministers Apartment", "lodge"]];

  function layout() {
    const page = document.body.dataset.page, hd = $("#site-header"), ft = $("#site-footer");
    if (hd) {
      const links = NAV.map(n => '<a href="' + n[0] + '"' + (n[2] === page ? ' aria-current="page"' : "") + ">" + n[1] + "</a>").join("");
      hd.innerHTML = '<header class="site-header"><div class="wrap bar"><a class="logo" href="index.html" aria-label="Parah Hospitality home">' +
        '<img src="assets/logo.svg" alt="" width="38" height="44"><span>Parah<small>Hospitality</small></span></a>' +
        '<button class="burger" aria-expanded="false" aria-controls="menu" aria-label="Open menu"><span></span><span></span><span></span></button>' +
        '<nav id="menu" class="menu" aria-label="Main">' + links + '<a class="btn btn-sm" href="index.html#contact">Contact us</a></nav></div></header>';
      const b = $(".burger"), m = $("#menu");
      b.addEventListener("click", () => { const o = m.classList.toggle("open"); b.setAttribute("aria-expanded", o); b.setAttribute("aria-label", o ? "Close menu" : "Open menu"); });
      m.addEventListener("click", e => { if (e.target.tagName === "A") { m.classList.remove("open"); b.setAttribute("aria-expanded", false); } });
      window.addEventListener("scroll", () => $(".site-header").classList.toggle("scrolled", window.scrollY > 8), { passive: true });
    }
    if (ft) {
      ft.innerHTML = '<footer class="site-footer"><div class="wrap fgrid"><div><div class="flogo">Parah Hospitality</div>' +
        "<p>Lounge, lodges, games and bars. A warm welcome across three places.</p></div>" +
        '<div><h4>Explore</h4><ul>' + NAV.map(n => '<li><a href="' + n[0] + '">' + n[1] + "</a></li>").join("") + '<li><a href="staff.html">Staff area</a></li></ul></div>' +
        '<div><h4>Contact</h4><ul><li><a href="tel:' + C.phone.replace(/\s/g, "") + '">' + C.phone + '</a></li><li><a href="mailto:' + C.email + '">' + C.email + "</a></li><li>" + C.address + "</li></ul></div></div>" +
        '<div class="wrap copy">© ' + new Date().getFullYear() + " Parah Hospitality. All rights reserved.</div></footer>";
    }
    if (!$("#toasts")) document.body.append(h("div", { id: "toasts", "aria-live": "polite" }));
    const io = "IntersectionObserver" in window ? new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } }), { threshold: .12 }) : null;
    PH.$$(".reveal").forEach(el => io ? io.observe(el) : el.classList.add("in"));
    PH.$$("img[data-chain]").forEach(img => PH.chain(img, img.dataset.chain.split("|")));
  }

  /* Real photographs from Unsplash (free to use under the Unsplash License) used for the demo.
     key -> [Unsplash photo id, illustration fallback]. Replace by adding your own files to assets/img/. */
  PH.STOCK = {
    "hotel-exterior": ["1455587734955-081b22074882", "hotel-exterior"], "hotel-night": ["1542314831-068cd1dbfeeb", "hotel-exterior"],
    "hotel-lobby": ["1759038085950-1234ca8f5fed", "hotel-lobby"], "hotel-room": ["1618773928121-c32242e63f39", "hotel-room"],
    "hotel-room2": ["1611892440504-42a792e24d32", "hotel-room2"], "apt-bedroom": ["1631049421450-348ccd7f8949", "apt-bedroom"],
    "apt-living": ["1618221195710-dd6b41faaea6", "apt-living"], "apt-kitchen": ["1622372738946-62e02505feb3", "apt-kitchen"],
    "apt-exterior": ["1535827841776-24afc1e255ac", "apt-exterior"], "bar": ["1718184139636-7bb9ebcd1e08", "bar"],
    "tea-set": ["1715017245474-5533582014a3", "tea-set"], "chess": ["1585038021831-8afd9f9ab27f", "chess"],
    "lounge-interior": ["1641924676093-42e61835bbe2", "lounge-interior"], "pool": ["1551882547-ff40c63fe5fa", "lounge-interior"]
  };
  const expand = urls => [].concat.apply([], urls.map(u => { const k = (u.match(/stock\/([\w-]+)\.svg$/) || [])[1], s = k && PH.STOCK[k];
    return s ? ["https://images.unsplash.com/photo-" + s[0] + "?auto=format&fit=crop&w=1400&q=75", "assets/img/stock/" + s[1] + ".svg"] : [u]; }));
  /* Image with fallbacks: tries each URL in turn (your own photo first, then the built-in illustration), then a warm placeholder. */
  PH.chain = function (img, urls) {
    urls = expand(urls); let i = 0;
    img.addEventListener("error", function f() { i++; if (i < urls.length) { img.src = urls[i]; return; } img.removeEventListener("error", f); img.replaceWith(h("div", { class: "ph-img", role: "img", "aria-label": img.alt || "" })); });
    img.src = urls[0];
  };
  PH.pic = function (urls, alt, attrs) { const img = h("img", Object.assign({ alt: alt, loading: "lazy" }, attrs)); PH.chain(img, urls); return img; };

  PH.toast = function (msg, type) {
    const t = h("div", { class: "toast " + (type || "ok"), role: "status" }, msg);
    $("#toasts").append(t); setTimeout(() => t.classList.add("out"), 3600); setTimeout(() => t.remove(), 4000);
  };

  PH.modal = function (title, body, actions) {
    const dlg = h("dialog", { class: "modal", "aria-label": title });
    const close = () => { dlg.close(); dlg.remove(); };
    dlg.append(h("div", { class: "modal-in" }, h("div", { class: "modal-head" }, h("h3", { text: title }), h("button", { class: "x", "aria-label": "Close", onclick: close }, "×")), body,
      actions ? h("div", { class: "modal-act" }, actions(close)) : null));
    dlg.addEventListener("click", e => { if (e.target === dlg) close(); });
    dlg.addEventListener("cancel", () => dlg.remove());
    document.body.append(dlg); dlg.showModal(); return close;
  };

  PH.badge = (state, text) => h("span", { class: "badge " + state }, text);
  PH.empty = text => h("p", { class: "empty" }, text);
  PH.price = r => r.price ? C.currency + r.price.toLocaleString() + " / night" : "Ask for rate";
  PH.field = function (id, label, attrs, hint) {
    const tag = attrs && attrs.tag || "input"; const a = Object.assign({ id, name: id }, attrs); delete a.tag;
    return h("div", { class: "field" }, h("label", { for: id }, label), h(tag, a), hint ? h("small", { text: hint }) : null);
  };
  PH.validate = function (form) {
    let ok = true;
    PH.$$("[required]", form).forEach(f => {
      const bad = !String(f.value).trim() || (f.checkValidity && !f.checkValidity());
      f.classList.toggle("invalid", bad); f.setAttribute("aria-invalid", bad); if (bad && ok) { f.focus(); ok = false; }
    });
    return ok;
  };
  PH.statusText = s => ({ pending: "Waiting for staff", approved: "Confirmed", declined: "Declined" })[s] || s;

  document.addEventListener("DOMContentLoaded", layout);
})(window.PH);
