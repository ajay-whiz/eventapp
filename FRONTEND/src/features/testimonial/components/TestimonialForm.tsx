import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm, FormProvider, Controller, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Layout from '../../../layouts/Layout';
import Breadcrumbs from '../../../components/common/BreadCrumb';
import { Form } from '../../../components/common/Form';
import { InputGroup } from '../../../components/molecules/InputGroup';
import { Button } from '../../../components/atoms/Button';
import { FormError } from '../../../components/atoms/FormError';
import ImageUpload from '../../../components/atoms/ImageUpload';
import { useToast } from '../../../components/atoms/Toast';
import { ROUTING } from '../../../constants/routes';
import { testimonialSchema, type TestimonialSchemaType } from '../schemas/testimonial.schema';
import { useTestimonial } from '../hooks/useTestimonial';
import { useTestimonialActions } from '../hooks/useTestimonialActions';
import StarRating from './StarRating';

const TestimonialForm: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const toast = useToast();
  const isEditMode = Boolean(id);

  const { selectedTestimonial, formLoading, loading } = useTestimonial();
  const { fetchTestimonialById, addTestimonial, updateTestimonial, uploadAvatar } =
    useTestimonialActions();

  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  const methods = useForm<TestimonialSchemaType>({
    resolver: zodResolver(testimonialSchema),
    mode: 'onChange',
    reValidateMode: 'onChange',
    defaultValues: {
      name: '',
      designation: '',
      message: '',
      avatarUrl: '',
      rating: 5,
    },
  });

  const {
    formState: { errors },
    reset,
    control,
    setValue,
    watch,
  } = methods;

  const rating = watch('rating');
  const avatarUrl = watch('avatarUrl');
  const [name, designation, message, watchedRating] = useWatch({
    control,
    name: ['name', 'designation', 'message', 'rating'],
  });

  useEffect(() => {
    if (id) {
      fetchTestimonialById(id);
    }
  }, [id, fetchTestimonialById]);

  useEffect(() => {
    if (isEditMode && selectedTestimonial) {
      reset({
        name: selectedTestimonial.name || '',
        designation: selectedTestimonial.designation || '',
        message: selectedTestimonial.message || '',
        avatarUrl: selectedTestimonial.avatarUrl || '',
        rating: selectedTestimonial.rating || 5,
      });
    }
  }, [isEditMode, selectedTestimonial, reset]);

  const isSubmitting = formLoading || uploadingAvatar;

  const canSubmit = useMemo(() => {
    return Boolean(
      name?.trim() &&
        designation?.trim() &&
        message?.trim() &&
        watchedRating >= 1 &&
        watchedRating <= 5,
    );
  }, [name, designation, message, watchedRating]);

  const onSubmit = async (data: TestimonialSchemaType) => {
    try {
      let finalAvatarUrl = data.avatarUrl?.trim() || '';

      if (avatarFile) {
        setUploadingAvatar(true);
        finalAvatarUrl = await uploadAvatar(avatarFile);
        setUploadingAvatar(false);
      }

      const payload: TestimonialSchemaType = {
        name: data.name.trim(),
        designation: data.designation.trim(),
        message: data.message.trim(),
        rating: data.rating,
        ...(finalAvatarUrl ? { avatarUrl: finalAvatarUrl } : {}),
      };

      if (isEditMode && id) {
        await updateTestimonial(id, payload);
        toast.success('Testimonial updated successfully');
      } else {
        await addTestimonial(payload);
        toast.success('Testimonial created successfully');
      }

      navigate(`/${ROUTING.TESTIMONIALS}`);
    } catch (err: any) {
      setUploadingAvatar(false);
      const errorMessage =
        err?.response?.data?.message || err?.message || 'Failed to save testimonial';
      toast.error(errorMessage);
    }
  };

  if (isEditMode && loading && !selectedTestimonial) {
    return (
      <Layout>
        <div className="p-6 text-gray-600">Loading testimonial...</div>
      </Layout>
    );
  }

  return (
    <Layout>
      <h2 className="text-xl font-semibold mb-2">
        {isEditMode ? 'Edit Testimonial' : 'Add Testimonial'}
      </h2>
      <Breadcrumbs />

      <div className="text-gray-800 shadow-sm mt-5 max-w-3xl border border-neutral-100 bg-white rounded-xl p-6">
        <FormProvider {...methods}>
          <Form<TestimonialSchemaType>
            mode="onSubmit"
            schema={testimonialSchema}
            onSubmit={onSubmit}
            className="bg-white text-gray-800"
          >
            <div className="grid grid-cols-1 gap-5">
              <InputGroup
                label="Name"
                name="name"
                placeholder="Enter name"
                required
                error={errors.name?.message}
              />

              <InputGroup
                label="Designation"
                name="designation"
                placeholder="e.g. CEO, ABC Company"
                required
                error={errors.designation?.message}
              />

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Message <span className="text-red-500">*</span>
                </label>
                <Controller
                  name="message"
                  control={control}
                  render={({ field }) => (
                    <textarea
                      {...field}
                      rows={5}
                      placeholder="Enter testimonial message"
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                    />
                  )}
                />
                <FormError message={errors.message?.message} />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Avatar</label>
                <ImageUpload
                  existingImageUrl={avatarUrl}
                  onFileSelect={(file) => {
                    setAvatarFile(file);
                    setValue('avatarUrl', '', { shouldValidate: true });
                  }}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Rating <span className="text-red-500">*</span>
                </label>
                <Controller
                  name="rating"
                  control={control}
                  render={({ field }) => (
                    <StarRating
                      value={field.value || 0}
                      onChange={(value) => field.onChange(value)}
                    />
                  )}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Selected rating: {rating || 0} / 5
                </p>
                <FormError message={errors.rating?.message} />
              </div>

              <div className="flex items-center gap-3 pt-2">
                <Button
                  type="submit"
                  disabled={!canSubmit || isSubmitting}
                  className="bg-sky-500 hover:bg-sky-600 text-white"
                >
                  {isSubmitting
                    ? 'Saving...'
                    : isEditMode
                      ? 'Update Testimonial'
                      : 'Add Testimonial'}
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => navigate(`/${ROUTING.TESTIMONIALS}`)}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </Form>
        </FormProvider>
      </div>
    </Layout>
  );
};

export default TestimonialForm;
