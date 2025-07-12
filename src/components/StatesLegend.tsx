import { Card, CardContent } from "./ui/card";
import { REGION_MAP } from "../lib/region-utils";
import { STATE_ABBREVIATIONS } from "../lib/state-utils";
import type { RegionKey } from "../lib/region-utils";

// Create a reverse mapping from full state names to abbreviations
const FULL_NAME_TO_ABBR = Object.fromEntries(
  Object.entries(STATE_ABBREVIATIONS).map(([abbr, fullName]) => [fullName.toUpperCase(), abbr])
);

export function getRegionFromState(stateNameOrAbbr: string): RegionKey {
  const upper = stateNameOrAbbr.trim().toUpperCase(); // Normalize to upper case
  let abbr: string;

  // If it's already two characters, it might be an abbreviation
  if (upper.length === 2 && STATE_ABBREVIATIONS[upper]) {
    abbr = upper;
  } else {
    // Convert full name to abbreviation using the reverse mapping
    abbr = FULL_NAME_TO_ABBR[upper] || upper;
  }

  console.log("Normalized state:", upper);
  console.log("Abbreviation found:", abbr);
  console.log("Region mapping lookup:", REGION_MAP[abbr]);

  return REGION_MAP[abbr] ?? "International"; // Return the region based on abbreviation
}

type Row = {
  STATE?: string;
  "MAXIO  LOCAL ARR AT END OF MONTH  C"?: string;
};

export type StateGroupItem = {
  label: string;
  color: string;
  accounts: number;
  totalARR: number;
};

export function computeRegionStats(rows: Row[]): StateGroupItem[] {
  const initial: Record<RegionKey, StateGroupItem> = {
    Carolina: { label: "Carolina", color: "bg-red-500", accounts: 0, totalARR: 0 },
    Chiara: { label: "Chiara", color: "bg-blue-500", accounts: 0, totalARR: 0 },
    Arash: { label: "Arash", color: "bg-green-500", accounts: 0, totalARR: 0 },
    International: { label: "International", color: "bg-gray-500", accounts: 0, totalARR: 0 },
  };

  console.log("🔍 Processing rows for region stats:", rows.length);

  // Process each row
  for (const [index, row] of rows.entries()) {
    const rawState = row.STATE?.trim();
    const arrRaw = row["MAXIO  LOCAL ARR AT END OF MONTH  C"];
    
    if (!rawState || !arrRaw) {
      console.log(`⚠️  Row ${index}: Missing state or ARR`, { rawState, arrRaw });
      continue;
    }

    // Improved number parsing - handle currency symbols and commas
    const cleanedArr = arrRaw.replace(/[$,]/g, '').trim();
    const arrValue = Number(cleanedArr);
    
    if (isNaN(arrValue) || arrValue < 0) {
      console.log(`⚠️  Row ${index}: Invalid ARR value`, { rawState, arrRaw, cleanedArr, arrValue });
      continue;
    }

    const regionKey: RegionKey = getRegionFromState(rawState);
    initial[regionKey].accounts += 1;
    initial[regionKey].totalARR += arrValue;
    
    console.log(`✅ Row ${index}: ${rawState} → ${regionKey}, ARR: ${arrValue}`);
  }

  console.log("📊 Final region stats:", initial);

  // Sort with International last, others by totalARR descending
  return Object.values(initial).sort((a, b) => {
    if (a.label === "International") return 1;
    if (b.label === "International") return -1;
    return b.totalARR - a.totalARR;
  });
}

type Props = {
  items: StateGroupItem[];
  title?: string;
  position?: string;
  showEmpty?: boolean;
  className?: string;
};

export default function StatesLegend({
  items,
  title = "Regional ARR Breakdown",
  position = "absolute top-19 left-2",
  showEmpty = false,
  className = "",
}: Props) {
  // Filter out empty regions unless showEmpty is true
  const displayItems = showEmpty ? items : items.filter(item => item.accounts > 0);
  
  // Calculate totals for summary
  const totalAccounts = displayItems.reduce((sum, item) => sum + item.accounts, 0);
  const totalARR = displayItems.reduce((sum, item) => sum + item.totalARR, 0);

  // Format currency without rounding
  const formatCurrency = (value: number): string => {
    return `${value.toLocaleString()}`;
  };

  return (
    <Card className={`${position} z-[9000] p-2 w-fit shadow-md bg-white/90 backdrop-blur-sm ${className}`}>
      <CardContent className="flex flex-col gap-0.5 p-0">
        <div className="font-semibold text-xs mb-1 border-b pb-1">
          {title}
        </div>
        
        {displayItems.length === 0 ? (
          <div className="text-xs text-gray-500 italic">No data available</div>
        ) : (
          <>
            {displayItems.map((item) => (
              <div key={item.label} className="flex items-center gap-1.5 text-xs py-0.5">
                <span className={`w-3 h-3 rounded-sm ${item.color} flex-shrink-0`} />
                <span className="min-w-0 text-xs">
                  <span className="font-medium">{item.label}</span>
                  <span className="text-gray-600 ml-1">
                    — {item.accounts} accounts, ${formatCurrency(item.totalARR)}
                  </span>
                </span>
              </div>
            ))}
            
            {/* Summary row */}
            {displayItems.length > 1 && (
              <div className="flex items-center gap-1.5 text-xs py-0.5 mt-0.5 pt-1 border-t font-medium">
                <span className="w-3 h-3 rounded-sm bg-black/20 flex-shrink-0" />
                <span className="text-xs">
                  Total — {totalAccounts} accounts, ${formatCurrency(totalARR)}
                </span>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}