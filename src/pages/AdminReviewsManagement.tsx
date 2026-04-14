import React, { useState } from 'react';
import { Star, Plus, Edit, Trash2, Eye, EyeOff, X, Check } from 'lucide-react';
import {
  useGetWebsiteReviewsQuery,
  useCreateWebsiteReviewMutation,
  useUpdateWebsiteReviewMutation,
  useDeleteWebsiteReviewMutation,
  type WebsiteReviewDto,
} from '../store/api/websiteReviewApi';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { ErrorMessage } from '../components/ErrorMessage';
import { toast } from 'sonner';

const AdminReviewsManagement: React.FC = () => {
  const [showModal, setShowModal] = useState(false);
  const [editingReview, setEditingReview] = useState<WebsiteReviewDto | null>(null);
  const [formData, setFormData] = useState({
    customerName: '',
    rating: 5,
    reviewText: '',
    isActive: true,
    displayOrder: 0,
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const { data: reviews, isLoading, error, refetch } = useGetWebsiteReviewsQuery({ page: 1, size: 100 });
  const [createReview, { isLoading: creating }] = useCreateWebsiteReviewMutation();
  const [updateReview, { isLoading: updating }] = useUpdateWebsiteReviewMutation();
  const [deleteReview, { isLoading: deleting }] = useDeleteWebsiteReviewMutation();

  const validateForm = () => {
    const errors: Record<string, string> = {};

    if (!formData.customerName.trim()) {
      errors.customerName = 'Customer name is required';
    } else if (formData.customerName.length > 100) {
      errors.customerName = 'Customer name must not exceed 100 characters';
    }

    if (formData.rating < 1 || formData.rating > 5) {
      errors.rating = 'Rating must be between 1 and 5';
    }

    if (!formData.reviewText.trim()) {
      errors.reviewText = 'Review text is required';
    } else if (formData.reviewText.length < 10) {
      errors.reviewText = 'Review must be at least 10 characters';
    } else if (formData.reviewText.length > 1000) {
      errors.reviewText = 'Review must not exceed 1000 characters';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleOpenModal = (review?: WebsiteReviewDto) => {
    if (review) {
      setEditingReview(review);
      setFormData({
        customerName: review.customerName,
        rating: review.rating,
        reviewText: review.reviewText,
        isActive: review.isActive,
        displayOrder: review.displayOrder,
      });
    } else {
      setEditingReview(null);
      setFormData({
        customerName: '',
        rating: 5,
        reviewText: '',
        isActive: true,
        displayOrder: reviews ? reviews.length : 0,
      });
    }
    setFormErrors({});
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingReview(null);
    setFormData({
      customerName: '',
      rating: 5,
      reviewText: '',
      isActive: true,
      displayOrder: 0,
    });
    setFormErrors({});
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      if (editingReview) {
        await updateReview({
          id: editingReview.id,
          review: { ...formData, id: editingReview.id },
        }).unwrap();
      } else {
        await createReview(formData).unwrap();
      }
      handleCloseModal();
      refetch();
    } catch (error: any) {
      console.error('Failed to save review:', error);
      setFormErrors({ submit: error.data?.message || 'Failed to save review' });
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this review?')) {
      return;
    }

    try {
      await deleteReview(id).unwrap();
      refetch();
    } catch (error) {
      console.error('Failed to delete review:', error);
      toast.error('Failed to delete review');
    }
  };

  const handleToggleActive = async (review: WebsiteReviewDto) => {
    try {
      await updateReview({
        id: review.id,
        review: { ...review, isActive: !review.isActive },
      }).unwrap();
      refetch();
    } catch (error) {
      console.error('Failed to toggle review status:', error);
      toast.error('Failed to update review status');
    }
  };

  const sortedReviews = reviews ? [...reviews].sort((a, b) => a.displayOrder - b.displayOrder) : [];

  if (isLoading) {
    return <LoadingSpinner fullScreen message="Loading reviews..." />;
  }

  if (error) {
    return <ErrorMessage fullScreen message="Failed to load reviews" onRetry={refetch} />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Website Reviews Management</h2>
          <p className="text-gray-600 mt-1">Manage customer testimonials displayed on homepage</p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="bg-primary-600 text-white px-6 py-3 rounded-lg hover:bg-primary-700 transition flex items-center font-semibold shadow-md"
        >
          <Plus className="w-5 h-5 mr-2" />
          Add New Review
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm mb-1">Total Reviews</p>
              <p className="text-3xl font-bold text-gray-900">{reviews?.length || 0}</p>
            </div>
            <Star className="w-12 h-12 text-primary-600" />
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm mb-1">Active Reviews</p>
              <p className="text-3xl font-bold text-green-600">
                {reviews?.filter((r) => r.isActive).length || 0}
              </p>
            </div>
            <Eye className="w-12 h-12 text-green-600" />
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm mb-1">Inactive Reviews</p>
              <p className="text-3xl font-bold text-gray-600">
                {reviews?.filter((r) => !r.isActive).length || 0}
              </p>
            </div>
            <EyeOff className="w-12 h-12 text-gray-600" />
          </div>
        </div>
      </div>

      {/* Reviews Table */}
      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Order</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Customer</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Rating</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Review</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Status</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {sortedReviews.map((review) => (
                <tr key={review.id} className="hover:bg-gray-50 transition">
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">{review.displayOrder}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-indigo-600 rounded-full flex items-center justify-center text-white font-bold mr-3">
                        {review.customerName.charAt(0)}
                      </div>
                      <span className="font-medium text-gray-900">{review.customerName}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      {[...Array(review.rating)].map((_, i) => (
                        <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                      ))}
                      <span className="ml-2 text-sm text-gray-600">({review.rating})</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm text-gray-700 line-clamp-2 max-w-md">{review.reviewText}</p>
                  </td>
                  <td className="px-6 py-4">
                    <button
                      onClick={() => handleToggleActive(review)}
                      className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center ${
                        review.isActive
                          ? 'bg-green-100 text-green-800 hover:bg-green-200'
                          : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                      } transition`}
                    >
                      {review.isActive ? (
                        <>
                          <Eye className="w-3 h-3 mr-1" />
                          Active
                        </>
                      ) : (
                        <>
                          <EyeOff className="w-3 h-3 mr-1" />
                          Inactive
                        </>
                      )}
                    </button>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleOpenModal(review)}
                        className="p-2 text-primary-600 hover:bg-primary-50 rounded-lg transition"
                        title="Edit"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(review.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                        title="Delete"
                        disabled={deleting}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {sortedReviews.length === 0 && (
            <div className="text-center py-12">
              <Star className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 text-lg">No reviews yet</p>
              <p className="text-gray-400 text-sm">Add your first customer review to display on homepage</p>
            </div>
          )}
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h3 className="text-2xl font-bold text-gray-900">
                {editingReview ? 'Edit Review' : 'Add New Review'}
              </h3>
              <button
                onClick={handleCloseModal}
                className="text-gray-400 hover:text-gray-600 transition"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {formErrors.submit && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-800">
                  {formErrors.submit}
                </div>
              )}

              {/* Customer Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Customer Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.customerName}
                  onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition ${
                    formErrors.customerName ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="e.g., Rahul Shah"
                />
                {formErrors.customerName && (
                  <p className="text-red-500 text-sm mt-1">{formErrors.customerName}</p>
                )}
              </div>

              {/* Rating */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Rating <span className="text-red-500">*</span>
                </label>
                <div className="flex items-center space-x-2">
                  {[1, 2, 3, 4, 5].map((rating) => (
                    <button
                      key={rating}
                      type="button"
                      onClick={() => setFormData({ ...formData, rating })}
                      className="transition"
                    >
                      <Star
                        className={`w-8 h-8 ${
                          rating <= formData.rating
                            ? 'fill-yellow-400 text-yellow-400'
                            : 'text-gray-300'
                        }`}
                      />
                    </button>
                  ))}
                  <span className="text-gray-600 ml-2">({formData.rating} stars)</span>
                </div>
                {formErrors.rating && (
                  <p className="text-red-500 text-sm mt-1">{formErrors.rating}</p>
                )}
              </div>

              {/* Review Text */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Review Text <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={formData.reviewText}
                  onChange={(e) => setFormData({ ...formData, reviewText: e.target.value })}
                  rows={4}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition resize-none ${
                    formErrors.reviewText ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Enter the customer's review feedback..."
                />
                <div className="flex justify-between items-center mt-1">
                  {formErrors.reviewText ? (
                    <p className="text-red-500 text-sm">{formErrors.reviewText}</p>
                  ) : (
                    <p className="text-gray-500 text-sm">Minimum 10 characters</p>
                  )}
                  <p className="text-gray-500 text-sm">{formData.reviewText.length}/1000</p>
                </div>
              </div>

              {/* Display Order */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Display Order
                </label>
                <input
                  type="number"
                  min="0"
                  value={formData.displayOrder}
                  onChange={(e) => setFormData({ ...formData, displayOrder: parseInt(e.target.value) || 0 })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition"
                />
                <p className="text-gray-500 text-sm mt-1">Lower numbers appear first on homepage</p>
              </div>

              {/* Active Status */}
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                />
                <label htmlFor="isActive" className="ml-2 text-sm font-medium text-gray-700">
                  Display on homepage (Active)
                </label>
              </div>

              {/* Actions */}
              <div className="flex space-x-3 pt-4">
                <button
                  type="submit"
                  disabled={creating || updating}
                  className="flex-1 bg-primary-600 text-white py-3 rounded-lg hover:bg-primary-700 transition font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  {creating || updating ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                      Saving...
                    </>
                  ) : (
                    <>
                      <Check className="w-5 h-5 mr-2" />
                      {editingReview ? 'Update Review' : 'Add Review'}
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition font-semibold"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminReviewsManagement;