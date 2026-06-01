import { useEffect, useState } from "react";

const ITEMS: { name: string; color: string }[] = [
  { name: "Bitcoin", color: "#F7931A" },
  { name: "Solana", color: "#14F195" },
  { name: "Ethereum", color: "#627EEA" },
  { name: "USDC", color: "#2775CA" },
  { name: "XRP", color: "#23292F" },
  { name: "Chainlink", color: "#2A5ADA" },
  { name: "BNB", color: "#F3BA2F" },
  { name: "Avalanche", color: "#E84142" },
  { name: "Sui", color: "#6FBCF0" },
  { name: "Polygon", color: "#8247E5" },
  { name: "Arbitrum", color: "#28A0F0" },
  { name: "Optimism", color: "#FF0420" },
  { name: "Base", color: "#0052FF" },
  { name: "Aave", color: "#B6509E" },
  { name: "Uniswap", color: "#FF007A" },
  { name: "Maker", color: "#1AAB9B" },
  { name: "Ondo", color: "#000000" },
  { name: "Hyperliquid", color: "#50D2C2" },
  { name: "Jupiter", color: "#C7F284" },
  { name: "Raydium", color: "#8C6EEF" },
  { name: "Aster", color: "#4F46E5" },
  { name: "Percolator", color: "#F97316" },
];

export const HopeRotator = ({ intervalMs = 700 }: { intervalMs?: number }) => {
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
