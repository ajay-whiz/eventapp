import React, { useEffect, useMemo, useState } from 'react';
import { Button } from '../../../components/atoms/Button';
import { useToast } from '../../../components/atoms/Toast';
import Modal from '../../../components/common/Modal';
import { ConfirmModal } from '../../../components/molecules/ConfirmModal';
import { useServiceCategory } from '../hooks/useServiceCategory';
import { useServiceCategoryActions } from '../hooks/useServiceCategoryActions';
import FormInputModalBody from './FormInputModalBody';

interface FormInputManagerProps {
  categoryId?: string;
  categoryName?: string;
  category?: string;
  heading?: string;
  addButtonLabel?: string;
  emptyStateMessage?: string;
}

type InputSummary = {
  id: string;
  label: string;
  active?: boolean;
  minrange?: number;
  maxrange?: number;
};

const FormInputManager: React.FC<FormInputManagerProps> = ({
  categoryId = '',
  categoryName = '',
  category,
  heading = 'Form inputs',
  addButtonLabel = '+ Add form input',
  emptyStateMessage = 'No inputs added yet.',
}) => {
  const { formInputs, formInputsLoading } = useServiceCategory();
  const { getServiceCategoryFormInputs, removeServiceCategoryFormInput } = useServiceCategoryActions();
  const toast = useToast();

  const [showModal, setShowModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [inputToEdit, setInputToEdit] = useState<InputSummary | null>(null);
  const [inputToDelete, setInputToDelete] = useState<InputSummary | null>(null);

  useEffect(() => {
    if (!categoryId) return;
    getServiceCategoryFormInputs(categoryId, 1, 50, '');
  }, [categoryId, getServiceCategoryFormInputs]);

  const sanitizedInputs = useMemo<InputSummary[]>(() => {
    if (!Array.isArray(formInputs)) return [];
    return formInputs
      .filter(Boolean)
      .map((input: any) => ({
        id: input.id ?? input._id ?? input.key ?? `${input.label || 'input'}-${Math.random().toString(36).slice(2, 8)}`,
        label: input.label ?? '-',
        active:
          typeof input.active === 'boolean'
            ? input.active
            : typeof input.isActive === 'boolean'
              ? input.isActive
              : undefined,
        minrange: typeof input.minrange === 'number' ? input.minrange : undefined,
        maxrange: typeof input.maxrange === 'number' ? input.maxrange : undefined,
      }));
  }, [formInputs]);

  const refreshInputs = async () => {
    if (!categoryId) return;
    await getServiceCategoryFormInputs(categoryId, 1, 50, '');
  };

  const handleDelete = async () => {
    if (!inputToDelete) return;
    try {
      await removeServiceCategoryFormInput(inputToDelete.id);
      toast.success('Form input deleted successfully');
      await refreshInputs();
    } catch {
      // Errors are handled downstream (toasts dispatched in hook)
    } finally {
      setInputToDelete(null);
    }
  };

  const headingSection = (
    <div className="flex items-center justify-between">
      <h3 className="text-lg font-semibold text-gray-900">{heading}</h3>
      <Button
        type="button"
        variant="primary"
        onClick={() => setShowModal(true)}
        disabled={!categoryId}
      >
        {addButtonLabel}
      </Button>
    </div>
  );

  return (
    <div className="grid grid-cols-1 gap-4">
      {headingSection}

      {!categoryId ? (
        <p className="text-sm text-gray-500">Select a service category to manage inputs.</p>
      ) : formInputsLoading ? (
        <p className="text-sm text-gray-500">Loading inputs...</p>
      ) : sanitizedInputs.length === 0 ? (
        <p className="text-sm text-gray-500">{emptyStateMessage}</p>
      ) : (
        <div className="rounded-md border border-gray-100 divide-y divide-gray-100">
          {sanitizedInputs.map((input) => (
            <div key={input.id} className="flex items-center justify-between p-3">
              <div className="flex flex-col">
                <span className="font-medium text-gray-900">{input.label}</span>
                <span className="text-xs text-gray-500">Min: {input.minrange ?? '-'} • Max: {input.maxrange ?? '-'}</span>
              </div>
              <div className="flex items-center gap-3">
                {input.active === true && (
                  <span className="px-2 py-0.5 rounded-full text-xs bg-green-50 text-green-700 border border-green-200">
                    Active
                  </span>
                )}
                {input.active === false && (
                  <span className="px-2 py-0.5 rounded-full text-xs bg-red-50 text-red-700 border border-red-200">
                    Inactive
                  </span>
                )}
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    setInputToEdit(input);
                    setShowEditModal(true);
                  }}
                >
                  Edit
                </Button>
                <Button
                  type="button"
                  variant="danger"
                  size="sm"
                  onClick={() => setInputToDelete(input)}
                >
                  Delete
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        size="md"
        title="Add Booking Request Form Input"
      >
        <FormInputModalBody
          categoryId={categoryId}
          categoryName={categoryName}
          category={category}
          onCancel={() => setShowModal(false)}
          onCreated={async () => {
            setShowModal(false);
            await refreshInputs();
          }}
        />
      </Modal>

      <Modal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setInputToEdit(null);
        }}
        size="md"
        title="Edit Booking Request Form Input"
      >
        <FormInputModalBody
          categoryId={categoryId}
          categoryName={categoryName}
          category={category}
          editingInput={inputToEdit}
          onCancel={() => {
            setShowEditModal(false);
            setInputToEdit(null);
          }}
          onCreated={async () => {
            setShowEditModal(false);
            setInputToEdit(null);
            await refreshInputs();
          }}
        />
      </Modal>

      <ConfirmModal
        isOpen={Boolean(inputToDelete)}
        onClose={() => setInputToDelete(null)}
        onConfirm={handleDelete}
        title="Confirm Deletion"
        message={
          inputToDelete
            ? `Are you sure you want to delete the form input: ${inputToDelete.label}?`
            : ''
        }
        confirmLabel="Delete"
        cancelLabel="Cancel"
      />
    </div>
  );
};

export default FormInputManager;
