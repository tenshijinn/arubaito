import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Images, Plus, X, Loader2 } from "lucide-react";

interface PortfolioImage {
  id: string;
  image_path: string;
  display_order: number;
}

interface PortfolioGalleryProps {
  analysisId: string;
  isOwner: boolean;
}

const MAX_IMAGES = 6;

export const PortfolioGallery = ({ analysisId, isOwner }: PortfolioGalleryProps) => {
  const [images, setImages] = useState<PortfolioImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  useEffect(() => {
    fetchImages();
  }, [analysisId]);

  const fetchImages = async () => {
    const { data, error } = await supabase
      .from('cv_portfolio_images')
      .select('*')
      .eq('analysis_id', analysisId)
      .order('display_order', { ascending: true });

    if (error) {
      console.error('Error fetching portfolio images:', error);
    } else {
      setImages(data || []);
    }
    setLoading(false);
  };

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (images.length >= MAX_IMAGES) {
      toast.error(`Maximum ${MAX_IMAGES} images allowed`);
      return;
    }

    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be less than 5MB');
      return;
    }

    setUploading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${analysisId}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('cv-portfolio')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('cv-portfolio')
        .getPublicUrl(fileName);

      const { error: insertError } = await supabase
        .from('cv_portfolio_images')
        .insert({
          analysis_id: analysisId,
          user_id: user.id,
          image_path: publicUrl,
          display_order: images.length,
        });

      if (insertError) throw insertError;

      toast.success('Image uploaded');
      fetchImages();
    } catch (error: any) {
      console.error('Upload error:', error);
      toast.error('Failed to upload image');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (imageId: string, imagePath: string) => {
    try {
      // Extract the file path from the full URL
      const pathMatch = imagePath.match(/cv-portfolio\/(.+)$/);
      if (pathMatch) {
        await supabase.storage.from('cv-portfolio').remove([pathMatch[1]]);
      }

      const { error } = await supabase
        .from('cv_portfolio_images')
        .delete()
        .eq('id', imageId);

      if (error) throw error;

      toast.success('Image removed');
      fetchImages();
    } catch (error) {
      console.error('Delete error:', error);
      toast.error('Failed to remove image');
    }
  };

  if (loading) {
    return (
      <Card className="p-6 bg-transparent border-border/30 backdrop-blur-sm">
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6 bg-transparent border-border/30 backdrop-blur-sm">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Images className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-bold">Portfolio</h3>
        </div>
        {isOwner && images.length < MAX_IMAGES && (
          <label className="cursor-pointer">
            <input
              type="file"
              accept="image/*"
              onChange={handleUpload}
              className="hidden"
              disabled={uploading}
            />
            <Button variant="outline" size="sm" disabled={uploading} asChild>
              <span>
                {uploading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <Plus className="h-4 w-4 mr-1" />
                    Add
                  </>
                )}
              </span>
            </Button>
          </label>
        )}
      </div>

      {images.length === 0 ? (
        <div className="text-center py-8">
          <Images className="h-12 w-12 mx-auto text-muted-foreground/30 mb-3" />
          <p className="text-sm text-muted-foreground">
            {isOwner ? 'Add up to 6 portfolio images' : 'No portfolio images'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {images.map((img) => (
            <div 
              key={img.id} 
              className="relative aspect-square rounded-lg overflow-hidden group cursor-pointer"
              onClick={() => setSelectedImage(img.image_path)}
            >
              <img
                src={img.image_path}
                alt="Portfolio"
                className="w-full h-full object-cover transition-transform group-hover:scale-105"
              />
              {isOwner && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(img.id, img.image_path);
                  }}
                  className="absolute top-2 right-2 p-1 bg-destructive/90 text-destructive-foreground rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Lightbox */}
      {selectedImage && (
        <div 
          className="fixed inset-0 z-50 bg-background/90 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setSelectedImage(null)}
        >
          <button
            className="absolute top-4 right-4 p-2 bg-muted rounded-full"
            onClick={() => setSelectedImage(null)}
          >
            <X className="h-5 w-5" />
          </button>
          <img
            src={selectedImage}
            alt="Portfolio enlarged"
            className="max-w-full max-h-[90vh] object-contain rounded-lg"
          />
        </div>
      )}
    </Card>
  );
};