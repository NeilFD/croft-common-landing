import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  Upload, 
  Trash2, 
  Edit, 
  Save, 
  Eye, 
  EyeOff, 
  GripVertical, 
  X, 
  CheckCircle, 
  Circle,
  Move,
  Image as ImageIcon
} from 'lucide-react';
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
  const [showDrafts, setShowDrafts] = useState(true);
  const [showPublished, setShowPublished] = useState(true);
  const [selectedImages, setSelectedImages] = useState<Set<string>>(new Set());
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [dragging, setDragging] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const carouselTypes = [
    'main_hero', 
    'beer_hero', 
    'cafe_hero', 
    'cocktails_hero', 
    'kitchens_hero', 
    'hall_hero', 
    'community_hero',
    'common_room_hero'
  ];

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

  const uploadImage = async (file: File, carouselName: string) => {
    if (!user) return;

    setUploading(true);
    setUploadProgress(0);

    try {
      // Validate file
      if (!['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(file.type)) {
        throw new Error('Invalid file type. Please upload JPEG, PNG, WebP, or GIF images.');
      }

      if (file.size > 50 * 1024 * 1024) { // 50MB limit
        throw new Error('File too large. Please upload images under 50MB.');
      }

      // Create unique filename
      const fileExt = file.name.split('.').pop();
      const fileName = `${carouselName}/${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;

      // Upload to storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('cms-images')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('cms-images')
        .getPublicUrl(fileName);

      // Get the next sort order
      const existingImages = getImagesByCarousel(carouselName);
      const nextSortOrder = Math.max(0, ...existingImages.map(img => img.sort_order)) + 1;

      // Insert into database (as draft by default)
      const { data: dbData, error: dbError } = await supabase
        .from('cms_images')
        .insert({
          asset_type: 'carousel_image' as const,
          carousel_name: carouselName,
          image_url: publicUrl,
          title: file.name.replace(/\.[^/.]+$/, ""), // Remove extension
          alt_text: file.name.replace(/\.[^/.]+$/, ""),
          sort_order: nextSortOrder,
          published: false, // Default to draft
          created_by: user.id
        })
        .select()
        .single();

      if (dbError) throw dbError;

      setImages(prev => [...prev, dbData]);
      toast.success('Image uploaded successfully as draft');
      
    } catch (error: any) {
      console.error('Error uploading image:', error);
      toast.error(error.message || 'Failed to upload image');
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const updateImage = async (imageId: string, updates: any) => {
    try {
      console.log('🖼️ Updating image:', imageId, 'with updates:', updates);
      
      const { error } = await supabase
        .from('cms_images')
        .update(updates)
        .eq('id', imageId);

      if (error) throw error;

      setImages(prev => {
        const updatedImages = prev.map(img => 
          img.id === imageId ? { ...img, ...updates } : img
        );
        console.log('🖼️ Updated images state:', updatedImages.find(img => img.id === imageId));
        return updatedImages;
      });

      toast.success('Image updated successfully');
      setEditingImage(null);
    } catch (error) {
      console.error('Error updating image:', error);
      toast.error('Failed to update image');
    }
  };

  const deleteImage = async (imageId: string) => {
    try {
      const image = images.find(img => img.id === imageId);
      if (!image) return;

      // Delete from database
      const { error: dbError } = await supabase
        .from('cms_images')
        .delete()
        .eq('id', imageId);

      if (dbError) throw dbError;

      // Try to delete from storage (if it exists in our bucket)
      if (image.image_url.includes('cms-images')) {
        const fileName = image.image_url.split('/').pop();
        if (fileName) {
          await supabase.storage
            .from('cms-images')
            .remove([`${image.carousel_name}/${fileName}`]);
        }
      }

      setImages(prev => prev.filter(img => img.id !== imageId));
      toast.success('Image deleted successfully');
    } catch (error) {
      console.error('Error deleting image:', error);
      toast.error('Failed to delete image');
    }
  };

  const togglePublishImage = async (imageId: string, published: boolean) => {
    await updateImage(imageId, { published });
  };

  const bulkPublish = async () => {
    try {
      const { error } = await supabase
        .from('cms_images')
        .update({ published: true })
        .in('id', Array.from(selectedImages));

      if (error) throw error;

      setImages(prev => prev.map(img => 
        selectedImages.has(img.id) ? { ...img, published: true } : img
      ));

      setSelectedImages(new Set());
      toast.success(`Published ${selectedImages.size} images`);
    } catch (error) {
      console.error('Error bulk publishing:', error);
      toast.error('Failed to publish images');
    }
  };

  const bulkDelete = async () => {
    if (!confirm(`Delete ${selectedImages.size} selected images?`)) return;

    try {
      for (const imageId of selectedImages) {
        await deleteImage(imageId);
      }
      setSelectedImages(new Set());
    } catch (error) {
      console.error('Error bulk deleting:', error);
      toast.error('Failed to delete images');
    }
  };

  const reorderImages = async (carouselName: string, newOrder: CMSImage[]) => {
    try {
      const updates = newOrder.map((img, index) => ({
        id: img.id,
        sort_order: index
      }));

      for (const update of updates) {
        await supabase
          .from('cms_images')
          .update({ sort_order: update.sort_order })
          .eq('id', update.id);
      }

      setImages(prev => prev.map(img => {
        const update = updates.find(u => u.id === img.id);
        return update ? { ...img, sort_order: update.sort_order } : img;
      }));

      toast.success('Images reordered successfully');
    } catch (error) {
      console.error('Error reordering images:', error);
      toast.error('Failed to reorder images');
    }
  };

  const getImagesByCarousel = (carouselName: string) => {
    return images
      .filter(img => img.carousel_name === carouselName)
      .filter(img => {
        if (!showDrafts && !img.published) return false;
        if (!showPublished && img.published) return false;
        return true;
      })
      .sort((a, b) => a.sort_order - b.sort_order);
  };

  const handleDragStart = (e: React.DragEvent, imageId: string) => {
    setDragging(imageId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, imageId: string) => {
    e.preventDefault();
    setDragOver(imageId);
  };

  const handleDragEnd = () => {
    setDragging(null);
    setDragOver(null);
  };

  const handleDrop = (e: React.DragEvent, targetImageId: string, carouselName: string) => {
    e.preventDefault();
    
    if (!dragging || dragging === targetImageId) return;

    const carouselImages = getImagesByCarousel(carouselName);
    const draggedImage = carouselImages.find(img => img.id === dragging);
    const targetImage = carouselImages.find(img => img.id === targetImageId);

    if (!draggedImage || !targetImage) return;

    const newOrder = [...carouselImages];
    const draggedIndex = newOrder.findIndex(img => img.id === dragging);
    const targetIndex = newOrder.findIndex(img => img.id === targetImageId);

    // Remove dragged item and insert at target position
    newOrder.splice(draggedIndex, 1);
    newOrder.splice(targetIndex, 0, draggedImage);

    reorderImages(carouselName, newOrder);
    handleDragEnd();
  };

  const handleFileSelect = (carouselName: string) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.multiple = true;
    input.accept = 'image/*';
    input.onchange = (e) => {
      const files = (e.target as HTMLInputElement).files;
      if (files) {
        Array.from(files).forEach(file => uploadImage(file, carouselName));
      }
    };
    input.click();
  };

  if (loading) {
    return <div className="text-center py-8">Loading images...</div>;
  }

  const draftCount = images.filter(img => !img.published).length;
  const publishedCount = images.filter(img => img.published).length;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Image & Carousel Management</span>
            <div className="flex items-center gap-2">
              <Badge variant="secondary">{draftCount} drafts</Badge>
              <Badge variant="default">{publishedCount} published</Badge>
            </div>
          </CardTitle>
          <p className="text-muted-foreground">
            Upload, manage, and reorder carousel images. Images are saved as drafts by default.
          </p>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4 items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowDrafts(!showDrafts)}
                className={showDrafts ? 'bg-muted' : ''}
              >
                <EyeOff className="h-4 w-4 mr-2" />
                {showDrafts ? 'Hide' : 'Show'} Drafts
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowPublished(!showPublished)}
                className={showPublished ? 'bg-muted' : ''}
              >
                <Eye className="h-4 w-4 mr-2" />
                {showPublished ? 'Hide' : 'Show'} Published
              </Button>
            </div>

            {selectedImages.size > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">
                  {selectedImages.size} selected
                </span>
                <Button variant="outline" size="sm" onClick={bulkPublish}>
                  Publish Selected
                </Button>
                <Button variant="outline" size="sm" onClick={bulkDelete}>
                  Delete Selected
                </Button>
                <Button variant="outline" size="sm" onClick={() => setSelectedImages(new Set())}>
                  Clear Selection
                </Button>
              </div>
            )}
          </div>

          {uploading && (
            <div className="mt-4">
              <div className="flex items-center gap-2 mb-2">
                <Upload className="h-4 w-4" />
                <span className="text-sm">Uploading image...</span>
              </div>
              <Progress value={uploadProgress} className="w-full" />
            </div>
          )}
        </CardContent>
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
              <Button 
                variant="outline" 
                className="w-full sm:w-auto"
                onClick={() => handleFileSelect(carousel)}
                disabled={uploading}
              >
                <Upload className="h-4 w-4 mr-2" />
                Add New Images
              </Button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {getImagesByCarousel(carousel).map((image) => (
                <Card 
                  key={image.id}
                  className={`relative ${dragOver === image.id ? 'border-primary' : ''}`}
                  draggable
                  onDragStart={(e) => handleDragStart(e, image.id)}
                  onDragOver={(e) => handleDragOver(e, image.id)}
                  onDragEnd={handleDragEnd}
                  onDrop={(e) => handleDrop(e, image.id, carousel)}
                >
                  <CardContent className="p-4">
                    {/* Selection checkbox and status indicators */}
                    <div className="absolute top-2 left-2 z-10 flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0 bg-black/70 hover:bg-black/80 border border-white/20 rounded-full shadow-lg backdrop-blur-sm"
                        onClick={() => {
                          const newSelection = new Set(selectedImages);
                          if (newSelection.has(image.id)) {
                            newSelection.delete(image.id);
                          } else {
                            newSelection.add(image.id);
                          }
                          setSelectedImages(newSelection);
                        }}
                      >
                        {selectedImages.has(image.id) ? (
                          <CheckCircle className="h-4 w-4 text-green-400" />
                        ) : (
                          <Circle className="h-4 w-4 text-white/80" />
                        )}
                      </Button>
                    </div>

                    <div className="absolute top-2 right-2 z-10 flex items-center gap-2">
                      {!image.published && (
                        <Badge variant="secondary" className="text-xs bg-orange-500/90 text-white border-0 shadow-lg">Draft</Badge>
                      )}
                      <Badge variant="outline" className="text-xs bg-black/70 text-white border-white/20 shadow-lg backdrop-blur-sm">#{image.sort_order}</Badge>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0 bg-background/80 hover:bg-background cursor-move"
                      >
                        <GripVertical className="h-4 w-4" />
                      </Button>
                    </div>

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
                        
                        <div className="flex flex-wrap gap-2 pt-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setEditingImage(image.id)}
                            className="flex-1 min-h-[36px]"
                          >
                            <Edit className="h-3 w-3 mr-1" />
                            Edit
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => togglePublishImage(image.id, !image.published)}
                            className="flex-1 min-h-[36px]"
                          >
                            {image.published ? (
                              <>
                                <EyeOff className="h-3 w-3 mr-1" />
                                Unpublish
                              </>
                            ) : (
                              <>
                                <Eye className="h-3 w-3 mr-1" />
                                Publish
                              </>
                            )}
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => deleteImage(image.id)}
                            className="min-h-[36px]"
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
                    <ImageIcon className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground mb-4">
                      No images found for this carousel.
                    </p>
                    <Button
                      variant="outline"
                      onClick={() => handleFileSelect(carousel)}
                      disabled={uploading}
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      Upload First Image
                    </Button>
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

  console.log('🎬 EditableImageForm initialized with:', {
    imageId: image.id,
    title: image.title,
    description: image.description,
    alt_text: image.alt_text,
    stateDescription: description
  });

  const handleSave = () => {
    console.log('🔧 EditableImageForm handleSave called with:', {
      title,
      description,
      alt_text: altText,
      sort_order: sortOrder,
    });
    
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
        onChange={(e) => {
          console.log('📝 Description input changed:', e.target.value);
          setDescription(e.target.value);
        }}
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
        <Button variant="outline" size="sm" onClick={onCancel} className="flex-1 min-h-[36px]">
          Cancel
        </Button>
        <Button size="sm" onClick={handleSave} className="flex-1 min-h-[36px]">
          <Save className="h-3 w-3 mr-1" />
          Save
        </Button>
      </div>
    </div>
  );
};

export default ImageManager;