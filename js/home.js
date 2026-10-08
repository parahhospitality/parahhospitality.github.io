(function (PH) {
  const $ = PH.$, h = PH.h, C = PH.config;
  function status() {
    const r = PH.roomsSummary(), t = PH.tablesSummary(), a = PH.lodgeStatus();
    $("#c-rooms").textContent = r.free + " of " + r.total + " rooms available";
    $("#c-tables").textContent = t.free + " tables free";
    $("#c-lodge").textContent = "Apartment " + a.label.toLowerCase();
    $("#c-lodge-dot").className = a.state === "free" ? "" : "o";
    const set = (id, txt, ok) => { const e = $(id); e.textContent = txt; e.className = "badge" + (ok ? "" : " busy"); };
    set("#s-rooms", r.free + " rooms available", r.free > 0);
    set("#s-tables", t.free + " tables free", t.free > 0);
    set("#s-lodge", a.label, a.state === "free");
  }
  status(); PH.on(status);

  const photos = [["Hotel by night", "hotel-night", "tall"], ["Lobby", "hotel-lobby"], ["Cocktail bar", "bar"], ["Chess night", "chess"], ["Poolside", "pool"], ["Apartment kitchen", "apt-kitchen"], ["Apartment bedroom", "apt-bedroom"]];
  const g = $("#gallery");
  photos.forEach((p, i) => {
    const img = PH.pic(["assets/img/gallery-" + (i + 1) + ".jpg", "assets/img/stock/" + p[1] + ".svg"], p[0] + " at Parah Hospitality");
    g.append(h("button", { class: p[2] || "", "aria-label": "Enlarge photo: " + p[0], onclick: () => PH.modal(p[0], PH.pic([img.currentSrc || img.src], p[0])) }, img, h("span", { class: "cap" }, p[0])));
  });

  $("#contact-list").append(
    h("li", {}, h("a", { href: "tel:" + C.phone.replace(/\s/g, "") }, C.phone)),
    h("li", {}, h("a", { href: "mailto:" + C.email }, C.email)), h("li", {}, C.address));

  $("#contact-form").addEventListener("submit", e => {
    e.preventDefault();
    if (!PH.validate(e.target)) return PH.toast("Please fill in every field.", "err");
    const msg = "Hello Parah Hospitality, my name is " + $("#cn").value.trim() + " (" + $("#cp").value.trim() + "). " + $("#cm").value.trim();
    window.open("https://wa.me/" + C.whatsapp + "?text=" + encodeURIComponent(msg), "_blank", "noopener");
    e.target.reset();
  });
})(window.PH);
