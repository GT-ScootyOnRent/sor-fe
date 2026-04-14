// import React, { useState } from 'react';
// import { Upload, X, Star, Trash2, Loader2 } from 'lucide-react';
// import { toast } from 'sonner';
// import { uploadVehicleImage, deleteVehicleImage } from '../lib/supabase';
// import {
//   useGetVehicleImagesQuery,
//   useCreateVehicleImageMutation,
//   useUpdateVehicleImageMutation,
//   useDeleteVehicleImageMutation,
// } from '../store/api/vehicleImageApi';

// interface VehicleImageUploadProps {
//   vehicleId: number;
// }

// export const VehicleImageUpload: React.FC<VehicleImageUploadProps> = ({ vehicleId }) => {
//   const [uploading, setUploading] = useState(false);
  
//   const { data: images = [], isLoading } = useGetVehicleImagesQuery(vehicleId);
//   const [createImage] = useCreateVehicleImageMutation();
//   const [updateImage] = useUpdateVehicleImageMutation();
//   const [deleteImageMutation] = useDeleteVehicleImageMutation();

//   const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
//     const files = e.target.files;
//     if (!files || files.length === 0) return;

//     setUploading(true);

//     try {
//       for (let i = 0; i < files.length; i++) {
//         const file = files[i];
        
//         // Validate file type
//         if (!file.type.startsWith('image/')) {
//           toast.error(`${file.name} is not an image file`);
//           continue;
//         }

//         // Validate file size (max 5MB)
//         if (file.size > 5 * 1024 * 1024) {
//           toast.error(`${file.name} is too large (max 5MB)`);
//           continue;
//         }

//         // Upload to Supabase Storage
//         const imageUrl = await uploadVehicleImage(file, vehicleId);

//         // Save to database
//         await createImage({
//           vehicleId,
//           imageUrl,
//           isPrimary: images.length === 0, // First image is primary
//           displayOrder: images.length,
//         }).unwrap();

//         toast.success(`${file.name} uploaded successfully`);
//       }
//     } catch (error: any) {
//       toast.error(error.message || 'Failed to upload images');
//     } finally {
//       setUploading(false);
//       // Reset input
//       e.target.value = '';
//     }
//   };

//   const handleSetPrimary = async (imageId: number) => {
//     try {
//       // Remove primary from all images
//       for (const img of images) {
//         if (img.isPrimary && img.id !== imageId) {
//           await updateImage({
//             id: img.id!,
//             image: { ...img, isPrimary: false },
//           }).unwrap();
//         }
//       }

//       // Set new primary
//       const image = images.find((img) => img.id === imageId);
//       if (image) {
//         await updateImage({
//           id: imageId,
//           image: { ...image, isPrimary: true },
//         }).unwrap();
//         toast.success('Primary image updated');
//       }
//     } catch (error: any) {
//       toast.error('Failed to set primary image');
//     }
//   };

//   const handleDelete = async (imageId: number, imageUrl: string) => {
//     if (!confirm('Are you sure you want to delete this image?')) return;

//     try {
//       // Delete from storage
//       await deleteVehicleImage(imageUrl);
      
//       // Delete from database
//       await deleteImageMutation({ id: imageId, vehicleId }).unwrap();
      
//       toast.success('Image deleted successfully');
//     } catch (error: any) {
//       toast.error('Failed to delete image');
//     }
//   };

//   if (isLoading) {
//     return (
//       <div className="flex justify-center items-center p-8">
//         <Loader2 className="w-6 h-6 animate-spin text-primary-600" />
//       </div>
//     );
//   }

//   return (
//     <div className="space-y-4">
//       <div className="flex items-center justify-between">
//         <h3 className="text-lg font-semibold text-gray-900">Vehicle Images</h3>
//         <label className="cursor-pointer bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition flex items-center">
//           <Upload className="w-4 h-4 mr-2" />
//           {uploading ? 'Uploading...' : 'Upload Images'}
//           <input
//             type="file"
//             multiple
//             accept="image/*"
//             onChange={handleFileUpload}
//             disabled={uploading}
//             className="hidden"
//           />
//         </label>
//       </div>

//       {/* Images Grid */}
//       <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
//         {images
//           .sort((a, b) => a.displayOrder - b.displayOrder)
//           .map((image) => (
//             <div
//               key={image.id}
//               className="relative group rounded-lg overflow-hidden border-2 border-gray-200 hover:border-primary-500 transition"
//             >
//               <img
//                 src={image.imageUrl}
//                 alt="Vehicle"
//                 className="w-full h-40 object-cover"
//               />
              
//               {/* Primary Badge */}
//               {image.isPrimary && (
//                 <div className="absolute top-2 left-2 bg-yellow-500 text-white px-2 py-1 rounded text-xs font-semibold flex items-center">
//                   <Star className="w-3 h-3 mr-1 fill-current" />
//                   Primary
//                 </div>
//               )}

//               {/* Actions */}
//               <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition flex items-center justify-center opacity-0 group-hover:opacity-100">
//                 <div className="flex gap-2">
//                   {!image.isPrimary && (
//                     <button
//                       onClick={() => handleSetPrimary(image.id!)}
//                       className="bg-yellow-500 text-white p-2 rounded-full hover:bg-yellow-600 transition"
//                       title="Set as Primary"
//                     >
//                       <Star className="w-4 h-4" />
//                     </button>
//                   )}
//                   <button
//                     onClick={() => handleDelete(image.id!, image.imageUrl)}
//                     className="bg-red-600 text-white p-2 rounded-full hover:bg-red-700 transition"
//                     title="Delete Image"
//                   >
//                     <Trash2 className="w-4 h-4" />
//                   </button>
//                 </div>
//               </div>
//             </div>
//           ))}
//       </div>

//       {images.length === 0 && (
//         <div className="text-center py-12 border-2 border-dashed border-gray-300 rounded-lg">
//           <Upload className="w-12 h-12 mx-auto text-gray-400 mb-3" />
//           <p className="text-gray-600">No images uploaded yet</p>
//           <p className="text-sm text-gray-500 mt-1">Click "Upload Images" to add photos</p>
//         </div>
//       )}
//     </div>
//   );
// };