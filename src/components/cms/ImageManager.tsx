import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Upload, Trash2, Edit, Save } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

interface CMSImage {
  id: string;
  asset_type: string;
  page: string | null;
  carousel_name: string | null;
  title: string | null;
  description: string | null;
  image_url: string;
  alt_text: string | null;
  sort_order: number;
  published: boolean;
}

const ImageManager = () => {
  const { user } = useAuth();
  const [images, setImages] = useState<CMSImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingImage, setEditingImage] = useState<string | null>(null);

  const carouselTypes = ['main_hero', 'beer_hero', 'cafe_hero', 'cocktails_hero', 'kitchens_hero', 'hall_hero', 'community_hero'];

  useEffect(() => {
    fetchImages();
  }, []);

  const fetchImages = async () => {
    try {
      const { data, error } = await supabase
        .from('cms_images')
        .select('*')
        .order('carousel_name', { ascending: true })
        .order('sort_order', { ascending: true });

      if (error) throw error;
      setImages(data || []);
    } catch (error) {
      console.error('Error fetching images:', error);
      toast.error('Failed to load images');
    } finally {
      setLoading(false);
    }
  };

  const updateImage = async (imageId: string, updates: any) => {
    try {
      const { error } = await supabase
        .from('cms_images')
        .update(updates)
        .eq('id', imageId);

      if (error) throw error;

      setImages(prev => prev.map(img => 
        img.id === imageId ? { ...img, ...updates } : img
      ));

      toast.success('Image updated successfully');
      setEditingImage(null);
    } catch (error) {
      console.error('Error updating image:', error);
      toast.error('Failed to update image');
    }
  };

  const deleteImage = async (imageId: string) => {
    try {
      const { error } = await supabase
        .from('cms_images')
        .delete()
        .eq('id', imageId);

      if (error) throw error;

      setImages(prev => prev.filter(img => img.id !== imageId));
      toast.success('Image deleted successfully');
    } catch (error) {
      console.error('Error deleting image:', error);
      toast.error('Failed to delete image');
    }
  };

  const getImagesByCarousel = (carouselName: string) => {
    return images.filter(img => img.carousel_name === carouselName);
  };

  if (loading) {
    return <div className="text-center py-8">Loading images...</div>;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Image & Carousel Management</CardTitle>
          <p className="text-muted-foreground">
            Manage hero carousel images, reorder them, and update metadata.
          </p>
        </CardHeader>
      </Card>

      <Tabs defaultValue={carouselTypes[0]} className="space-y-6">
        <div className="overflow-x-auto -mx-3 sm:mx-0 px-3 sm:px-0">
          <TabsList className="inline-flex h-10 items-center justify-start rounded-md bg-muted p-1 text-muted-foreground min-w-max w-full sm:w-auto">
            {carouselTypes.map((carousel) => (
              <TabsTrigger key={carousel} value={carousel} className="text-xs whitespace-nowrap px-2 sm:px-3 min-h-[44px] sm:min-h-auto">
                {carousel.replace('_hero', '').replace('_', ' ')}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        {carouselTypes.map((carousel) => (
          <TabsContent key={carousel} value={carousel} className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
              <h3 className="text-lg font-semibold capitalize">
                {carousel.replace('_', ' ')} Images
              </h3>
              <Button variant="outline" className="w-full sm:w-auto">
                <Upload className="h-4 w-4 mr-2" />
                Add New Image
              </Button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {getImagesByCarousel(carousel).map((image) => (
                <Card key={image.id}>
                  <CardContent className="p-4">
                    <div className="aspect-video bg-muted rounded-md mb-3 overflow-hidden">
                      <img
                        src={image.image_url}
                        alt={image.alt_text || 'Hero image'}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = '/placeholder.svg';
                        }}
                      />
                    </div>

                    {editingImage === image.id ? (
                      <EditableImageForm
                        image={image}
                        onSave={(updates) => updateImage(image.id, updates)}
                        onCancel={() => setEditingImage(null)}
                      />
                    ) : (
                        <div className="space-y-2">
                          <h4 className="font-medium break-words">
                            {image.title || 'Untitled'}
                          </h4>
                          <p className="text-sm text-muted-foreground break-words">
                            {image.description || 'No description'}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Order: {image.sort_order}
                          </p>
                          
                          <div className="flex flex-col sm:flex-row gap-2 pt-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setEditingImage(image.id)}
                              className="flex-1 min-h-[44px] sm:min-h-auto"
                            >
                              <Edit className="h-3 w-3 mr-1" />
                              Edit
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => deleteImage(image.id)}
                              className="flex-1 min-h-[44px] sm:min-h-auto"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                    )}
                  </CardContent>
                </Card>
              ))}
              
              {getImagesByCarousel(carousel).length === 0 && (
                <Card className="col-span-full">
                  <CardContent className="text-center py-8">
                    <p className="text-muted-foreground">
                      No images found for this carousel.
                      <br />
                      Try importing content first or add new images.
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
};

interface EditableImageFormProps {
  image: CMSImage;
  onSave: (updates: Partial<CMSImage>) => void;
  onCancel: () => void;
}

const EditableImageForm = ({ image, onSave, onCancel }: EditableImageFormProps) => {
  const [title, setTitle] = useState(image.title || '');
  const [description, setDescription] = useState(image.description || '');
  const [altText, setAltText] = useState(image.alt_text || '');
  const [sortOrder, setSortOrder] = useState(image.sort_order);

  const handleSave = () => {
    onSave({
      title,
      description,
      alt_text: altText,
      sort_order: sortOrder,
    });
  };

  return (
    <div className="space-y-3">
      <Input
        placeholder="Image title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        className="w-full"
      />
      <Input
        placeholder="Description"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        className="w-full"
      />
      <Input
        placeholder="Alt text"
        value={altText}
        onChange={(e) => setAltText(e.target.value)}
        className="w-full"
      />
      <Input
        type="number"
        placeholder="Sort order"
        value={sortOrder}
        onChange={(e) => setSortOrder(parseInt(e.target.value) || 0)}
        className="w-full"
      />
      
      <div className="flex flex-col sm:flex-row gap-2">
        <Button variant="outline" size="sm" onClick={onCancel} className="flex-1 min-h-[44px] sm:min-h-auto">
          Cancel
        </Button>
        <Button size="sm" onClick={handleSave} className="flex-1 min-h-[44px] sm:min-h-auto">
          <Save className="h-3 w-3 mr-1" />
          Save
        </Button>
      </div>
    </div>
  );
};

export default ImageManager;