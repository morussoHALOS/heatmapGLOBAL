import { Card, CardContent } from "@/components/ui/card";
import { useState } from "react";

type LegendItem = {
  label: string;
  color: string;
  accounts: number;
  tierSum: string;
};

type ArrLegendProps = {
  items?: LegendItem[];
  title?: string;
  position?: string;
};

export default function ArrLegend ({
  items = [
    { label: "≥ $100K", color: "bg-purple-500", accounts: 0, tierSum: "0" },
    { label: "$50K-100K", color: "bg-red-500", accounts: 0, tierSum: "0" },
    { label: "$25K-$50K", color: "bg-orange-500", accounts: 0, tierSum: "0" },
    { label: "$10K-$25K", color: "bg-yellow-500", accounts: 0, tierSum: "0" },
    { label: "\u2264 10K", color: "bg-green-500", accounts: 0, tierSum: "0" },
  ],
  title = "ARR Legend",
  position = "absolute bottom-3 left-3",
}: ArrLegendProps) {
  return (
    <Card className={`${position} z-[9000] p-3 w-fit shadow-md`}>
      <CardContent className="flex flex-col gap-2 p-0">
        <div className="text-center font-semibold text-sm mb-1">{title}</div>
        {items.map((item) => (
          <div key={item.label} className="flex items-center gap-2 text-xs">
            <span className={`w-4 h-4 rounded-sm ${item.color}`} />
            <span>{item.label} -- {item.accounts} accounts, ${item.tierSum.toLocaleString()}</span>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
