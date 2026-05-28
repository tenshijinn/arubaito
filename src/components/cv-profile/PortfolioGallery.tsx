import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Images, Plus, X, Loader2 } from "lucide-react";
import { INK, CREAM, MUTED, BORDER, DISPLAY, MONO, SANS, cardStyle, labelStyle } from "@/lib/aesthetics";

interface PortfolioImage { id: string; image_path: string; display_order: number }
interface PortfolioGalleryProps { analysisId: string; isOwner: boolean }
const MAX_IMAGES = 6;

export const PortfolioGallery = ({ analysisId, isOwner }: PortfolioGalleryProps) => {
  const [images, setImages] = useState<PortfolioImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  useEffect(() => { fetchImages(); }, [analysisId]);

  const fetchImages = async () => {
    const { data, error } = await supabase.from('cv_portfolio_images').select('*').eq('analysis_id', analysisId).order('display_order', { ascending: true });
    if (!error) setImages(data || []);
    setLoading(false);
  };

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (images.length >= MAX_IMAGES) return toast.error(`Maximum ${MAX_IMAGES} images allowed`);
    if (!file.type.startsWith('image/')) return toast.error('Please upload an image file');
    if (file.size > 5 * 1024 * 1024) return toast.error('Image must be less than 5MB');
    setUploading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${analysisId}/${Date.now()}.${fileExt}`;
      const { error: uploadError } = await supabase.storage.from('cv-portfolio').upload(fileName, file);
      if (uploadError) throw uploadError;
      const { data: { publicUrl } } = supabase.storage.from('cv-portfolio').getPublicUrl(fileName);
      const { error: insertError } = await supabase.from('cv_portfolio_images').insert({ analysis_id: analysisId, user_id: user.id, image_path: publicUrl, display_order: images.length });
      if (insertError) throw insertError;
      toast.success('Image uploaded');
      fetchImages();
    } catch { toast.error('Failed to upload image'); }
    finally { setUploading(false); }
  };

  const handleDelete = async (imageId: string, imagePath: string) => {
    try {
      const pathMatch = imagePath.match(/cv-portfolio\/(.+)$/);
      if (pathMatch) await supabase.storage.from('cv-portfolio').remove([pathMatch[1]]);
      const { error } = await supabase.from('cv_portfolio_images').delete().eq('id', imageId);
      if (error) throw error;
      toast.success('Image removed');
      fetchImages();
    } catch { toast.error('Failed to remove image'); }
  };

  if (loading) {
    return (
      <div style={cardStyle()} className="p-6">
        <div className="flex items-center justify-center py-8"><Loader2 className="h-5 w-5 animate-spin" style={{ color: MUTED }} /></div>
      </div>
    );
  }

  return (
    <div style={cardStyle()} className="p-6">
      <div className="flex items-center justify-between mb-6">
        <span style={labelStyle()}>{"06 / Portfolio"}</span>
        <span style={labelStyle()}>{`${images.length}/${MAX_IMAGES}`}</span>
      </div>

      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Images className="h-4 w-4" style={{ color: INK }} />
          <h3 style={{ fontFamily: DISPLAY, fontSize: 16, color: INK }}>Portfolio</h3>
        </div>
        {isOwner && images.length < MAX_IMAGES && (
          <label className="cursor-pointer">
            <input type="file" accept="image/*" onChange={handleUpload} className="hidden" disabled={uploading} />
            <span
              className="px-4 py-2 rounded-full text-xs inline-flex items-center gap-1.5 transition-opacity hover:opacity-80"
              style={{ background: INK, color: CREAM, fontFamily: SANS }}
            >
              {uploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : (<><Plus className="h-3.5 w-3.5" />Add</>)}
            </span>
          </label>
        )}
      </div>

      {images.length === 0 ? (
        <div className="text-center py-8">
          <Images className="h-10 w-10 mx-auto mb-3" style={{ color: "rgba(24,24,24,0.2)" }} />
          <p style={{ fontFamily: MONO, fontSize: 12, color: MUTED }}>{isOwner ? 'Add up to 6 portfolio images' : 'No portfolio images'}</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {images.map((img) => (
            <div
              key={img.id}
              className="relative aspect-square rounded-[12px] overflow-hidden group cursor-pointer"
              style={{ border: `1px solid ${BORDER}` }}
              onClick={() => setSelectedImage(img.image_path)}
            >
              <img src={img.image_path} alt="Portfolio" className="w-full h-full object-cover transition-transform group-hover:scale-105" />
              {isOwner && (
                <button
                  onClick={(e) => { e.stopPropagation(); handleDelete(img.id, img.image_path); }}
                  className="absolute top-2 right-2 p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                  style={{ background: INK, color: CREAM }}
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {selectedImage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(24,24,24,0.85)" }} onClick={() => setSelectedImage(null)}>
          <button className="absolute top-4 right-4 p-2 rounded-full" style={{ background: CREAM, color: INK }} onClick={() => setSelectedImage(null)}>
            <X className="h-5 w-5" />
          </button>
          <img src={selectedImage} alt="Portfolio enlarged" className="max-w-full max-h-[90vh] object-contain rounded-[16px]" />
        </div>
      )}
    </div>
  );
};
