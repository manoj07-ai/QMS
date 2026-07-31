'use client';

import React from 'react';
import { Package } from 'lucide-react';
import CollapsibleSection from './CollapsibleSection';
import { Input } from '@/shared/components/ui/FormField';
import { useAppDispatch, useAppSelector } from '@/store';
import { updateField, confirmAiField } from '@/store/complaintSlice';
import type { ComplaintFormFields } from '@/types';

export default function ProductSection() {
  const dispatch = useAppDispatch();
  const fields   = useAppSelector((s) => s.complaint.current.fields);
  const errors   = useAppSelector((s) => s.complaint.validationErrors);

  // Helper to dispatch updateField for a given key
  function handleChange<K extends keyof ComplaintFormFields>(key: K) {
    return (e: React.ChangeEvent<HTMLInputElement>) => {
      dispatch(updateField({ key, value: e.target.value as never }));
      if (fields[key].meta.isAiFilled) dispatch(confirmAiField(key));
    };
  }

  const isComplete = Boolean(
    fields.productName.value &&
    fields.batchLotNumber.value &&
    fields.expiryDate.value
  );

  return (
    <CollapsibleSection
      id="section-product"
      title="Product & Batch Identification"
      subtitle="Specify the product, strength, and batch details"
      icon={<Package size={15} />}
      isComplete={isComplete}
    >
      {/* Row 1 */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
        <Input
          label="Product Name"
          required
          placeholder="e.g. Amoxicillin Trihydrate"
          value={fields.productName.value}
          aiMeta={fields.productName.meta}
          error={errors.productName}
          onChange={handleChange('productName')}
        />
        <Input
          label="Product Strength / Grade"
          placeholder="e.g. 500 mg / Capsule"
          value={fields.productStrength.value}
          aiMeta={fields.productStrength.meta}
          onChange={handleChange('productStrength')}
        />
      </div>

      {/* Row 2 */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
        <Input
          label="Batch / Lot Number"
          required
          placeholder="e.g. AMX-2026-B047"
          value={fields.batchLotNumber.value}
          aiMeta={fields.batchLotNumber.meta}
          error={errors.batchLotNumber}
          onChange={handleChange('batchLotNumber')}
        />
        <Input
          label="Quantity Affected"
          placeholder="e.g. 240 units"
          value={fields.quantityAffected.value}
          aiMeta={fields.quantityAffected.meta}
          onChange={handleChange('quantityAffected')}
        />
      </div>

      {/* Row 3 */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
        <Input
          label="Manufacturing Date"
          type="date"
          value={fields.manufacturingDate.value}
          aiMeta={fields.manufacturingDate.meta}
          onChange={handleChange('manufacturingDate')}
        />
        <Input
          label="Expiry Date"
          type="date"
          value={fields.expiryDate.value}
          aiMeta={fields.expiryDate.meta}
          onChange={handleChange('expiryDate')}
        />
      </div>
    </CollapsibleSection>
  );
}
