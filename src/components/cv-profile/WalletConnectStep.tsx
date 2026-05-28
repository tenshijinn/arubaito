import { Wallet, CheckCircle2, ArrowRight, Search, Blocks, X, Activity, Gem, Link2 } from "lucide-react";
import { useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { useAccount, useDisconnect } from "wagmi";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { INK, CREAM, ACCENT, MUTED, BORDER, DISPLAY, MONO, SANS, cardStyle, labelStyle } from "@/lib/aesthetics";

export interface WalletAddresses { solana: string | null; evm: string | null }

interface WalletConnectStepProps {
  onContinue: (wallets: WalletAddresses) => void;
  onSkip: () => void;
}

export const WalletConnectStep = ({ onContinue, onSkip }: WalletConnectStepProps) => {
  const { publicKey, connected: solanaConnected, disconnect: disconnectSolana } = useWallet();
  const { address: evmAddress, isConnected: evmConnected } = useAccount();
  const { disconnect: disconnectEvm } = useDisconnect();

  const solanaAddress = publicKey?.toBase58() || null;
  const hasAnyWallet = solanaConnected || evmConnected;

  const benefits = [
    { icon: Activity, title: "On-Chain Activity Score", description: "Transaction history across 15+ chains contributes to your CV Score" },
    { icon: Link2, title: "Cross-Chain Verification", description: "Solana + 14 EVM chains scanned for comprehensive credentials" },
    { icon: Blocks, title: "Developer Proof", description: "Testnet/devnet activity recognized as builder credentials" },
    { icon: Gem, title: "Bluechip Detection", description: "Interactions with top protocols boost your score" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h3 style={{ fontFamily: DISPLAY, fontSize: 20, color: INK }}>Select Wallets to Scan</h3>
        <p className="mt-1" style={{ fontFamily: MONO, fontSize: 12, color: MUTED, lineHeight: 1.6 }}>
          Optionally connect your Solana or EVM wallet.<br />Your on-chain history will be scanned and combined with your CV.
        </p>
      </div>

      {/* Benefit pills */}
      <div className="flex flex-wrap gap-2">
        {benefits.map((benefit, index) => (
          <div
            key={index}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full"
            style={{ border: `1.5px solid ${BORDER}`, background: "transparent" }}
            title={benefit.description}
          >
            <benefit.icon className="h-3.5 w-3.5" style={{ color: INK }} />
            <span style={{ fontFamily: MONO, fontSize: 11, color: INK, letterSpacing: "0.04em" }}>
              {benefit.title}
            </span>
          </div>
        ))}
      </div>


      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Solana */}
        <div style={cardStyle()} className="p-6">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: INK }}>
                <span style={{ fontFamily: MONO, fontSize: 11, color: CREAM, letterSpacing: "0.1em" }}>SOL</span>
              </div>
              <div>
                <h3 style={{ fontFamily: DISPLAY, fontSize: 16, color: INK }}>Solana Wallet</h3>
                <p style={{ fontFamily: MONO, fontSize: 10, color: MUTED }}>Phantom, Solflare, etc.</p>
              </div>
            </div>

            {solanaConnected && solanaAddress ? (
              <div className="space-y-2">
                <div className="flex items-center gap-3 p-3 rounded-[12px]" style={{ background: INK }}>
                  <CheckCircle2 className="h-4 w-4 shrink-0" style={{ color: CREAM }} />
                  <div className="flex-1 min-w-0">
                    <p style={{ fontFamily: MONO, fontSize: 10, color: "rgba(239,226,201,0.7)", letterSpacing: "0.12em", textTransform: "uppercase" }}>Connected</p>
                    <p className="truncate" style={{ fontFamily: MONO, fontSize: 11, color: CREAM }}>{solanaAddress}</p>
                  </div>
                </div>
                <button onClick={() => disconnectSolana()} className="w-full px-4 py-2 rounded-full text-xs transition-colors inline-flex items-center justify-center gap-2"
                  style={{ background: "transparent", color: INK, border: `1.5px solid ${BORDER}`, fontFamily: SANS }}>
                  <X className="h-3.5 w-3.5" /> Disconnect
                </button>
              </div>
            ) : (
              <div className="flex justify-center"><WalletMultiButton className="!rounded-full !h-10 !px-5 !text-sm" /></div>
            )}
          </div>
        </div>

        {/* EVM */}
        <div style={cardStyle()} className="p-6">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: INK }}>
                <span style={{ fontFamily: MONO, fontSize: 11, color: CREAM, letterSpacing: "0.1em" }}>EVM</span>
              </div>
              <div>
                <h3 style={{ fontFamily: DISPLAY, fontSize: 16, color: INK }}>EVM Wallet</h3>
                <p style={{ fontFamily: MONO, fontSize: 10, color: MUTED }}>MetaMask, Rainbow, etc.</p>
              </div>
            </div>

            {evmConnected && evmAddress ? (
              <div className="space-y-2">
                <div className="flex items-center gap-3 p-3 rounded-[12px]" style={{ background: INK }}>
                  <CheckCircle2 className="h-4 w-4 shrink-0" style={{ color: CREAM }} />
                  <div className="flex-1 min-w-0">
                    <p style={{ fontFamily: MONO, fontSize: 10, color: "rgba(239,226,201,0.7)", letterSpacing: "0.12em", textTransform: "uppercase" }}>Connected</p>
                    <p className="truncate" style={{ fontFamily: MONO, fontSize: 11, color: CREAM }}>{evmAddress}</p>
                  </div>
                </div>
                <button onClick={() => disconnectEvm()} className="w-full px-4 py-2 rounded-full text-xs transition-colors inline-flex items-center justify-center gap-2"
                  style={{ background: "transparent", color: INK, border: `1.5px solid ${BORDER}`, fontFamily: SANS }}>
                  <X className="h-3.5 w-3.5" /> Disconnect
                </button>
              </div>
            ) : (
              <ConnectButton.Custom>
                {({ openConnectModal }) => (
                  <button onClick={openConnectModal} className="w-full px-5 py-2.5 rounded-full text-sm transition-opacity hover:opacity-80"
                    style={{ background: INK, color: CREAM, fontFamily: SANS }}>
                    Connect EVM Wallet
                  </button>
                )}
              </ConnectButton.Custom>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center justify-end gap-3 pt-2">
        {hasAnyWallet && (
          <button
            onClick={() => onContinue({ solana: solanaAddress, evm: evmAddress || null })}
            className="px-6 py-3 rounded-full text-sm transition-opacity hover:opacity-80 inline-flex items-center justify-center gap-2"
            style={{ background: ACCENT, color: CREAM, fontFamily: SANS }}
          >
            Continue With Wallet <ArrowRight className="h-4 w-4" />
          </button>
        )}
        <button
          onClick={onSkip}
          className="px-6 py-3 rounded-full text-sm transition-colors"
          style={{ background: "transparent", color: INK, border: `1.5px solid ${BORDER}`, fontFamily: SANS }}
        >
          Skip
        </button>
      </div>
    </div>
  );
};

    </div>
  );
};
