import React from 'react';
import { Input } from '../atoms/Input';
import { SelectGroup } from '../molecules/SelectGroup';
import type { DynamicFormField } from '../../types/Vendor';
import { RadioGroup, RadioGroupItem } from '../ui/radio-group';
import { Label } from '../ui/label';
import { Button } from '../atoms/Button';
import MultiImageUpload from '../atoms/MultiImageUpload';
import { FieldErrorMessage } from './FieldErrorMessage';
import { FieldLabel } from './FieldLabel';
import {
    fieldErrorBorder,
    getDynamicFieldButtonLabel,
    getFieldDisplayLabel,
    getFieldOptions,
    isFieldRequired,
} from '../../utils/validateDynamicField';

interface DynamicFieldRendererProps {
    field: DynamicFormField;
    value: any;
    onChange: (value: any) => void;
    error?: string;
}

const DynamicFieldForm: React.FC<DynamicFieldRendererProps> = ({
    field,
    value,
    onChange,
    error
}) => {
    const displayLabel = getFieldDisplayLabel(field);
    const hasError = fieldErrorBorder(error);

    switch (field.type) {
        case 'text':
        case 'email':
        case 'number':
            return (
                <div className="col-span-1">
                    <FieldLabel field={field} htmlFor={field.id} />
                    <Input
                        id={field.id}
                        type={field.type}
                        placeholder={field.placeholder || `Enter ${displayLabel.toLowerCase()}`}
                        value={value || ''}
                        onChange={(e) => onChange(e.target.value)}
                        error={hasError}
                    />
                    <FieldErrorMessage error={error} />
                </div>
            );

        case 'textarea':
            return (
                <div className="col-span-1">
                    <FieldLabel field={field} htmlFor={field.id} />
                    <textarea
                        id={field.id}
                        rows={4}
                        className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:border-transparent ${hasError ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-sky-500'
                            }`}
                        placeholder={field.placeholder || `Enter ${displayLabel.toLowerCase()}`}
                        value={value || ''}
                        onChange={(e) => onChange(e.target.value)}
                    />
                    <FieldErrorMessage error={error} />
                </div>
            );

        case 'select':
        case 'dropdown': {
            const selectOptions = field.options || field.metadata?.options || [];
            const normalizedSelectOptions = Array.isArray(selectOptions)
                ? selectOptions.map(opt =>
                    typeof opt === "string"
                        ? { label: opt, value: opt }
                        : opt
                )
                : [];

            const selectedOption = value
                ? normalizedSelectOptions.find(opt => opt.value === value || opt.label === value)
                : null;

            const selectValue = selectedOption
                ? [{ label: selectedOption.label, value: selectedOption.value }]
                : value
                    ? [{ label: String(value), value: String(value) }]
                    : [];

            return (
                <div className="col-span-1">
                    <SelectGroup
                        label={displayLabel}
                        options={normalizedSelectOptions}
                        value={selectValue}
                        onChange={(selected) => {
                            const selectedValue = Array.isArray(selected) ? selected[0]?.value : '';
                            onChange(selectedValue);
                        }}
                        isMulti={false}
                        error={error}
                        required={isFieldRequired(field)}
                    />
                </div>
            );
        }

        case 'checkbox': {
            const checkboxOptions = getFieldOptions(field);
            return (
                <div className="col-span-1">
                    <FieldLabel field={field} />
                    <div className="space-y-2">
                        {checkboxOptions.map((option) => (
                            <div key={option.value} className="flex items-center">
                                <input
                                    type="checkbox"
                                    id={`${field.id}_${option.value}`}
                                    checked={Array.isArray(value) ? value.includes(option.value) : false}
                                    onChange={(e) => {
                                        const currentValues = Array.isArray(value) ? value : [];
                                        if (e.target.checked) {
                                            onChange([...currentValues, option.value]);
                                        } else {
                                            onChange(currentValues.filter((v: string) => v !== option.value));
                                        }
                                    }}
                                    className="h-4 w-4 text-sky-600 focus:ring-sky-500 border-gray-300 rounded-sm"
                                />
                                <label
                                    htmlFor={`${field.id}_${option.value}`}
                                    className="ml-2 block text-sm text-gray-900 whitespace-nowrap"
                                >
                                    {option.label}
                                </label>
                            </div>
                        ))}
                    </div>
                    <FieldErrorMessage error={error} />
                </div>
            );
        }

        case 'date':
            return (
                <div className="col-span-1">
                    <FieldLabel field={field} htmlFor={field.id} />
                    <Input
                        id={field.id}
                        type="date"
                        value={value || ''}
                        onChange={(e) => onChange(e.target.value)}
                        error={hasError}
                    />
                    <FieldErrorMessage error={error} />
                </div>
            );

        case 'radio': {
            const normalizedOptions = (field.options || field.metadata?.options || []).map((opt: any) =>
                typeof opt === "string" ? { label: opt, value: opt } : opt
            );
            return (
                <div className="col-span-1">
                    <FieldLabel field={field} />
                    <RadioGroup value={value} onValueChange={onChange}>
                        {normalizedOptions.map((option, index) => (
                            <div key={index} className="flex items-center space-x-2">
                                <RadioGroupItem value={option.value} id={`${field.id}-${index}`} />
                                <Label
                                    htmlFor={`${field.id}-${index}`}
                                    className="font-semibold text-gray-800 cursor-pointer"
                                >
                                    {option.label}
                                </Label>
                            </div>
                        ))}
                    </RadioGroup>
                    <FieldErrorMessage error={error} />
                </div>
            );
        }

        case 'button':
            return (
                <div className="col-span-1">
                    <button
                        id={field.id}
                        type="button"
                        onClick={() => onChange && onChange(field.id)}
                        className="px-4 py-2 bg-sky-600 text-white font-medium text-sm rounded-md hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2 transition-colors duration-200"
                    >
                        {getDynamicFieldButtonLabel(field)}
                    </button>
                    <FieldErrorMessage error={error} />
                </div>
            );

        case 'button-group': {
            const groupValues = Array.isArray(value) ? value : [''];
            return (
                <div className="col-span-1">
                    <FieldLabel field={field} />
                    <div className="space-y-2">
                        {groupValues.map((val: string, index: number) => (
                            <div key={index} className="flex items-center gap-2">
                                <Input
                                    id={`${field.id}_${index}`}
                                    type="text"
                                    placeholder={field.placeholder || `Enter ${displayLabel.toLowerCase()}`}
                                    value={val || ''}
                                    onChange={(e) => {
                                        const newValues = [...groupValues];
                                        newValues[index] = e.target.value;
                                        onChange(newValues);
                                    }}
                                    error={hasError}
                                />
                                {index > 0 && (
                                    <button
                                        type="button"
                                        onClick={() => {
                                            const newValues = groupValues.filter((_: any, i: number) => i !== index);
                                            onChange(newValues.length > 0 ? newValues : ['']);
                                        }}
                                        className="shrink-0 px-2 py-1 text-red-600 hover:text-red-800 hover:bg-red-50 border border-gray-300 rounded-md bg-white"
                                        title="Remove field"
                                        aria-label="Remove field"
                                    >
                                        ✕
                                    </button>
                                )}
                            </div>
                        ))}
                        <Button
                            type="button"
                            variant="muted"
                            onClick={() => {
                                const newValues = [...groupValues, ''];
                                onChange(newValues);
                            }}
                            className="flex items-center gap-1 px-3 py-1 text-sky-600 hover:text-sky-800 hover:bg-sky-50 rounded text-sm font-medium"
                        >
                            <span className="text-lg">+</span>
                            Add More
                        </Button>
                    </div>
                    <FieldErrorMessage error={error} />
                </div>
            );
        }

        case 'multi-select': {
            const rawOptions = field.options || field.metadata?.options || [];
            const normalizedMultiOptions = Array.isArray(rawOptions)
                ? rawOptions.map((opt) =>
                    typeof opt === 'string' ? { label: opt, value: opt } : opt
                )
                : [];
            const normalizedMultiValue = Array.isArray(value)
                ? value.map((v: string) => {
                    const match = normalizedMultiOptions.find(
                        (opt) => opt.value === v || opt.label === v
                    );
                    return match || { label: String(v), value: String(v) };
                })
                : [];

            return (
                <div className="col-span-1">
                    <SelectGroup
                        label={displayLabel}
                        options={normalizedMultiOptions}
                        value={normalizedMultiValue}
                        onChange={(selected) => onChange(selected.map((item) => item.value))}
                        isMulti={true}
                        error={error}
                        required={isFieldRequired(field)}
                    />
                </div>
            );
        }

        case 'date-range': {
            const dateRange = value || { startDate: '', endDate: '' };
            return (
                <div className="col-span-1">
                    <FieldLabel field={field} />
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-xs text-gray-600 mb-1">Start Date</label>
                            <Input
                                id={`${field.id}_start`}
                                type="date"
                                value={dateRange.startDate || ''}
                                onChange={(e) => {
                                    onChange({
                                        ...dateRange,
                                        startDate: e.target.value
                                    });
                                }}
                                error={hasError}
                            />
                        </div>
                        <div>
                            <label className="block text-xs text-gray-600 mb-1">End Date</label>
                            <Input
                                id={`${field.id}_end`}
                                type="date"
                                value={dateRange.endDate || ''}
                                onChange={(e) => {
                                    onChange({
                                        ...dateRange,
                                        endDate: e.target.value
                                    });
                                }}
                                error={hasError}
                            />
                        </div>
                    </div>
                    <FieldErrorMessage error={error} />
                </div>
            );
        }

        case 'MultiImageUpload':
            return (
                <div className="col-span-1">
                    <FieldLabel field={field} />
                    <MultiImageUpload
                        isSingleMode={false}
                        onImagesChange={onChange}
                        initialImages={Array.isArray(value) ? value : []}
                        acceptedFormats={field.validation?.invalidType?.value ?
                            field.validation.invalidType.value.split(',') :
                            ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
                        }
                    />
                    <FieldErrorMessage error={error} />
                </div>
            );

        default:
            return (
                <div className="col-span-1">
                    <FieldLabel field={field} htmlFor={field.id} />
                    <Input
                        id={field.id}
                        placeholder={field.placeholder || `Enter ${displayLabel.toLowerCase()}`}
                        value={value || ''}
                        onChange={(e) => onChange(e.target.value)}
                        error={hasError}
                    />
                    <FieldErrorMessage error={error} />
                </div>
            );
    }
}

export default DynamicFieldForm;
