/* Parah Hospitality - site configuration.
   Edit this file to change contact details, rooms, tables, menu items and the staff PIN. */
window.PH_CONFIG = {
  brand: "Parah Hospitality",
  phone: "+234 000 000 0000",
  whatsapp: "2340000000000",          // digits only, with country code, no +
  email: "hello@parahhospitality.com",
  address: "Add your street address, city, Nigeria",
  staffPin: "2468",                    // CHANGE THIS before launch (see README, "Security")
  currency: "₦",
  rooms: [
    { id: "101", type: "Standard", price: null }, { id: "102", type: "Standard", price: null },
    { id: "103", type: "Standard", price: null }, { id: "104", type: "Standard", price: null },
    { id: "105", type: "Standard", price: null }, { id: "106", type: "Standard", price: null },
    { id: "107", type: "Standard", price: null }, { id: "108", type: "Standard", price: null },
    { id: "201", type: "Deluxe", price: null },   { id: "202", type: "Deluxe", price: null },
    { id: "203", type: "Deluxe", price: null },   { id: "204", type: "Deluxe", price: null },
    { id: "205", type: "Deluxe", price: null },   { id: "206", type: "Deluxe", price: null },
    { id: "207", type: "Deluxe", price: null },   { id: "208", type: "Deluxe", price: null }
  ],
  tables: 12,
  tea: [
    { name: "Karak chai", desc: "Strong tea simmered with milk and cardamom." },
    { name: "Moroccan mint tea", desc: "Green tea with fresh mint, lightly sweetened." },
    { name: "Saudi shai", desc: "Black tea served the traditional way, with sugar on the side." },
    { name: "Arabic coffee (qahwa)", desc: "Light roast coffee spiced with cardamom." },
    { name: "Saffron tea", desc: "Fragrant tea infused with saffron threads." },
    { name: "Cardamom tea", desc: "A warm, soothing cup with whole cardamom pods." }
  ],
  games: [
    { name: "Table tennis", desc: "Friendly rallies on a full-size table." },
    { name: "Chess", desc: "Boards and clocks ready at your table." },
    { name: "Ludo", desc: "A classic for groups of up to four." },
    { name: "Dice games", desc: "Quick rounds while you wait for your order." }
  ],
  lodge: { maxDays: 30 }
};
