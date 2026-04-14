import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables: VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are required');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

/**
 * Upload a vehicle image to Supabase Storage
 * @param file - The image file to upload
 * @param vehicleId - The ID of the vehicle
 * @returns Public URL of the uploaded image
 */
export async function uploadVehicleImage(file: File, vehicleId: number): Promise<string> {
  const fileExt = file.name.split('.').pop();
  const fileName = `${vehicleId}/${Date.now()}.${fileExt}`;
  const filePath = `${fileName}`;

  const { error } = await supabase.storage
    .from('vehicle-images')
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: false,
    });

  if (error) {
    throw new Error(`Upload failed: ${error.message}`);
  }

  // Get public URL
  const { data: { publicUrl } } = supabase.storage
    .from('vehicle-images')
    .getPublicUrl(filePath);

  return publicUrl;
}

/**
 * Delete a vehicle image from Supabase Storage
 * @param imageUrl - The public URL of the image to delete
 */
export async function deleteVehicleImage(imageUrl: string): Promise<void> {
  try {
    // Extract file path from URL
    // URL format: https://wgzuxebehzhvfjycshqs.supabase.co/storage/v1/object/public/vehicle-images/123/1234567890.jpg
    const urlParts = imageUrl.split('/vehicle-images/');
    if (urlParts.length < 2) {
      console.warn('Invalid image URL format:', imageUrl);
      return;
    }

    const filePath = urlParts[1];

    const { error } = await supabase.storage
      .from('vehicle-images')
      .remove([filePath]);

    if (error) {
      console.error('Failed to delete image from storage:', error);
      throw error;
    }
  } catch (error) {
    console.error('Error in deleteVehicleImage:', error);
    throw error;
  }
}