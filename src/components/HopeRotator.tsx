import { useEffect, useState } from "react";

const ITEMS: { name: string; color: string }[] = [
  { name: "$BTC", color: "#F7931A" },
  { name: "$SOL", color: "#14F195" },
  { name: "$ETH", color: "#627EEA" },
  { name: "$USDC", color: "#2775CA" },
  { name: "$XRP", color: "#23292F" },
  { name: "$LINK", color: "#2A5ADA" },
  { name: "$BNB", color: "#F3BA2F" },
  { name: "$AVAX", color: "#E84142" },
  { name: "$SUI", color: "#6FBCF0" },
  { name: "$MATIC", color: "#8247E5" },
  { name: "$ARB", color: "#28A0F0" },
  { name: "$OP", color: "#FF0420" },
  { name: "$BASE", color: "#0052FF" },
  { name: "$AAVE", color: "#B6509E" },
  { name: "$UNI", color: "#FF007A" },
  { name: "$MKR", color: "#1AAB9B" },
  { name: "$ONDO", color: "#000000" },
  { name: "$HYPE", color: "#50D2C2" },
  { name: "$JUP", color: "#C7F284" },
  { name: "$RAY", color: "#8C6EEF" },
  { name: "$ASTR", color: "#4F46E5" },
  { name: "$PERC", color: "#F97316" },
  { name: "$L1X", color: "#FF6B00" },
];

export const HopeRotator = ({ intervalMs = 350 }: { intervalMs?: number }) => {
  const [i, setI] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setI((p) => (p + 1) % ITEMS.length), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);
  const item = ITEMS[i];
  return (
    <span
      key={i}
      style={{ color: item.color, fontStyle: "italic" }}
      className="inline-block animate-fade-in"
    >
      {item.name}
    </span>
  );
};
