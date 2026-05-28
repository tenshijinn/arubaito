import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Gem, Loader2, X } from "lucide-react";
import { INK, CREAM, ACCENT, MUTED, BORDER, DISPLAY, MONO, cardStyle, labelStyle } from "@/lib/aesthetics";

interface NFT { id: string; name: string; image: string; collection: string | null; description: string }
interface NFTGalleryProps { walletAddress: string | null }

export const NFTGallery = ({ walletAddress }: NFTGalleryProps) => {
  const [nfts, setNfts] = useState<NFT[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedNFT, setSelectedNFT] = useState<NFT | null>(null);

  useEffect(() => { if (walletAddress) fetchNFTs(); }, [walletAddress]);

  const fetchNFTs = async () => {
    if (!walletAddress) return;
    setLoading(true); setError(null);
    try {
      const { data, error } = await supabase.functions.invoke('fetch-wallet-nfts', { body: { walletAddress } });
      if (error) throw error;
      setNfts(data.nfts || []);
    } catch { setError('Failed to load NFTs'); }
    finally { setLoading(false); }
  };

  const Header = () => (
    <>
      <div className="flex items-center justify-between mb-6">
        <span style={labelStyle()}>{"07 / NFTs"}</span>
        <span style={labelStyle()}>{nfts.length > 0 ? `${nfts.length} items` : "Collection"}</span>
      </div>
      <div className="flex items-center gap-2 mb-4">
        <Gem className="h-4 w-4" style={{ color: INK }} />
        <h3 style={{ fontFamily: DISPLAY, fontSize: 16, color: INK }}>NFT Collection</h3>
      </div>
    </>
  );

  if (!walletAddress) {
    return (
      <div style={cardStyle()} className="p-6">
        <Header />
        <div className="text-center py-8">
          <Gem className="h-10 w-10 mx-auto mb-3" style={{ color: "rgba(24,24,24,0.2)" }} />
          <p style={{ fontFamily: MONO, fontSize: 12, color: MUTED }}>No wallet to display NFTs</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div style={cardStyle()} className="p-6">
        <Header />
        <div className="flex items-center justify-center py-8"><Loader2 className="h-5 w-5 animate-spin" style={{ color: MUTED }} /></div>
      </div>
    );
  }

  return (
    <div style={cardStyle()} className="p-6">
      <Header />
      {error ? (
        <div className="text-center py-8"><p style={{ fontFamily: MONO, fontSize: 12, color: ACCENT }}>{error}</p></div>
      ) : nfts.length === 0 ? (
        <div className="text-center py-8">
          <Gem className="h-10 w-10 mx-auto mb-3" style={{ color: "rgba(24,24,24,0.2)" }} />
          <p style={{ fontFamily: MONO, fontSize: 12, color: MUTED }}>No NFTs found in this wallet</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {nfts.map((nft) => (
            <div
              key={nft.id}
              className="relative aspect-square rounded-[12px] overflow-hidden group cursor-pointer"
              style={{ border: `1px solid ${BORDER}` }}
              onClick={() => setSelectedNFT(nft)}
            >
              <img src={nft.image} alt={nft.name} className="w-full h-full object-cover transition-transform group-hover:scale-105"
                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
              <div className="absolute inset-x-0 bottom-0 p-2 opacity-0 group-hover:opacity-100 transition-opacity"
                style={{ background: "linear-gradient(to top, rgba(24,24,24,0.85), transparent)" }}>
                <p className="truncate" style={{ fontFamily: MONO, fontSize: 11, color: CREAM }}>{nft.name}</p>
                {nft.collection && (<p className="truncate" style={{ fontFamily: MONO, fontSize: 10, color: "rgba(239,226,201,0.7)" }}>{nft.collection}</p>)}
              </div>
            </div>
          ))}
        </div>
      )}

      {selectedNFT && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(24,24,24,0.85)" }} onClick={() => setSelectedNFT(null)}>
          <button className="absolute top-4 right-4 p-2 rounded-full" style={{ background: CREAM, color: INK }} onClick={() => setSelectedNFT(null)}><X className="h-5 w-5" /></button>
          <div className="max-w-lg w-full overflow-hidden rounded-[20px]" style={{ background: CREAM, border: `1.5px solid ${BORDER}` }} onClick={(e) => e.stopPropagation()}>
            <img src={selectedNFT.image} alt={selectedNFT.name} className="w-full aspect-square object-cover" />
            <div className="p-4">
              <h4 style={{ fontFamily: DISPLAY, fontSize: 20, color: INK }}>{selectedNFT.name}</h4>
              {selectedNFT.collection && (<p style={{ fontFamily: MONO, fontSize: 12, color: ACCENT, marginTop: 4 }}>{selectedNFT.collection}</p>)}
              {selectedNFT.description && (<p className="line-clamp-3 mt-2" style={{ fontFamily: MONO, fontSize: 12, color: MUTED }}>{selectedNFT.description}</p>)}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
