export type RegionKey = "Carolina" | "Chiara" | "Arash" | "International"; // Adjusted to include "South" as per the screenshot regions

export const REGION_MAP: Record<string, RegionKey> = {
  // 🔴 Carolina
  AK: "Carolina", WA: "Carolina", OR: "Carolina", CA: "Carolina", NV: "Carolina",
  ID: "Carolina", MT: "Carolina", WY: "Carolina", UT: "Carolina", AZ: "Carolina",
  NM: "Carolina", CO: "Carolina",  HI: "Carolina", KS: "Carolina", NE: "Carolina",
  ND: "Carolina", SD: "Carolina", MI: "Carolina", WI: "Carolina", MN: "Carolina",

  // 🔵 Chiara
    FL: "Chiara",
   AR: "Chiara", LA: "Chiara", MS: "Chiara", GA: "Chiara",
  AL: "Chiara",    SC: "Chiara", 
  TX: "Chiara",  OK: "Chiara",

  // 🟢 Arash
  VA: "Arash", MO: "Arash", IA: "Arash",  IL: "Arash",
  WV: "Arash", MD: "Arash", DE: "Arash", PA: "Arash", NJ: "Arash",
  NY: "Arash", CT: "Arash", RI: "Arash", MA: "Arash", VT: "Arash",
  NH: "Arash", ME: "Arash", DC: "Arash", KY: "Arash", IN: "Arash",
  OH: "Arash", TN: "Arash", NC: "Arash",

  
};
