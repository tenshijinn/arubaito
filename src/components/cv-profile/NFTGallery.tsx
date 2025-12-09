import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { Gem, Loader2, X } from "lucide-react";

interface NFT {
  id: string;
  name: string;
  image: string;
  collection: string | null;
  description: string;
}

interface NFTGalleryProps {
  walletAddress: string | null;
}

export const NFTGallery = ({ walletAddress }: NFTGalleryProps) => {
  const [nfts, setNfts] = useState<NFT[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedNFT, setSelectedNFT] = useState<NFT | null>(null);

  useEffect(() => {
    if (walletAddress) {
      fetchNFTs();
    }
  }, [walletAddress]);

  const fetchNFTs = async () => {
    if (!walletAddress) return;
    
    setLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase.functions.invoke('fetch-wallet-nfts', {
        body: { walletAddress },
      });

      if (error) throw error;
      
      setNfts(data.nfts || []);
      if (data.error) {
        console.log('NFT fetch warning:', data.error);
      }
    } catch (err: any) {
      console.error('Error fetching NFTs:', err);
      setError('Failed to load NFTs');
    } finally {
      setLoading(false);
    }
  };

  if (!walletAddress) {
    return (
      <Card className="p-6 bg-card/50 backdrop-blur-sm">
        <div className="flex items-center gap-2 mb-4">
          <Gem className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-bold">NFT Collection</h3>
        </div>
        <div className="text-center py-8">
          <Gem className="h-12 w-12 mx-auto text-muted-foreground/30 mb-3" />
          <p className="text-sm text-muted-foreground">
            No wallet to display NFTs
          </p>
        </div>
      </Card>
    );
  }

  if (loading) {
    return (
      <Card className="p-6 bg-card/50 backdrop-blur-sm">
        <div className="flex items-center gap-2 mb-4">
          <Gem className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-bold">NFT Collection</h3>
        </div>
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6 bg-card/50 backdrop-blur-sm">
      <div className="flex items-center gap-2 mb-4">
        <Gem className="h-5 w-5 text-primary" />
        <h3 className="text-lg font-bold">NFT Collection</h3>
        {nfts.length > 0 && (
          <span className="text-xs text-muted-foreground">({nfts.length})</span>
        )}
      </div>

      {error ? (
        <div className="text-center py-8">
          <p className="text-sm text-destructive">{error}</p>
        </div>
      ) : nfts.length === 0 ? (
        <div className="text-center py-8">
          <Gem className="h-12 w-12 mx-auto text-muted-foreground/30 mb-3" />
          <p className="text-sm text-muted-foreground">
            No NFTs found in this wallet
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {nfts.map((nft) => (
            <div
              key={nft.id}
              className="relative aspect-square rounded-lg overflow-hidden group cursor-pointer bg-muted"
              onClick={() => setSelectedNFT(nft)}
            >
              <img
                src={nft.image}
                alt={nft.name}
                className="w-full h-full object-cover transition-transform group-hover:scale-105"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
              <div className="absolute inset-x-0 bottom-0 p-2 bg-gradient-to-t from-background/90 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                <p className="text-xs font-medium truncate">{nft.name}</p>
                {nft.collection && (
                  <p className="text-xs text-muted-foreground truncate">{nft.collection}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* NFT Detail Modal */}
      {selectedNFT && (
        <div
          className="fixed inset-0 z-50 bg-background/90 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setSelectedNFT(null)}
        >
          <button
            className="absolute top-4 right-4 p-2 bg-muted rounded-full"
            onClick={() => setSelectedNFT(null)}
          >
            <X className="h-5 w-5" />
          </button>
          <div className="max-w-lg w-full bg-card rounded-xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <img
              src={selectedNFT.image}
              alt={selectedNFT.name}
              className="w-full aspect-square object-cover"
            />
            <div className="p-4">
              <h4 className="font-bold text-lg">{selectedNFT.name}</h4>
              {selectedNFT.collection && (
                <p className="text-sm text-primary">{selectedNFT.collection}</p>
              )}
              {selectedNFT.description && (
                <p className="text-sm text-muted-foreground mt-2 line-clamp-3">
                  {selectedNFT.description}
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </Card>
  );
};