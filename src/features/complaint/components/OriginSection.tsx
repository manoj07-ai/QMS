'use client';

import React from 'react';
import { UserCircle2 } from 'lucide-react';
import CollapsibleSection from './CollapsibleSection';
import { Input, Select } from '@/shared/components/ui/FormField';
import { useAppDispatch, useAppSelector } from '@/store';
import { updateField, confirmAiField } from '@/store/complaintSlice';
import { COMPLAINT_SOURCE_OPTIONS } from '@/data/mockData';

export default function OriginSection() {
  const dispatch = useAppDispatch();
  const fields   = useAppSelector((s) => s.complaint.current.fields);
  const errors   = useAppSelector((s) => s.complaint.validationErrors);

  const source       = fields.complaintSource;
  const customerName = fields.customerName;
  const isComplete   = Boolean(source.value && customerName.value);

  return (
    <CollapsibleSection
      id="section-origin"
      title="Origin & Customer Details"
      subtitle="Identify the complaint source and customer"
      icon={<UserCircle2 size={15} />}
      isComplete={isComplete}
    >
      <Select
        label="Complaint Source"
        required
        options={COMPLAINT_SOURCE_OPTIONS}
        value={source.value}
        aiMeta={source.meta}
        error={errors.complaintSource}
        onChange={(e) => {
          dispatch(updateField({ key: 'complaintSource', value: e.target.value as never }));
          if (source.meta.isAiFilled) dispatch(confirmAiField('complaintSource'));
        }}
      />
      <Input
        label="Customer Name"
        required
        placeholder="e.g. MedCare Distributors Pvt. Ltd."
        value={customerName.value}
        aiMeta={customerName.meta}
        error={errors.customerName}
        onChange={(e) => {
          dispatch(updateField({ key: 'customerName', value: e.target.value }));
          if (customerName.meta.isAiFilled) dispatch(confirmAiField('customerName'));
        }}
      />
    </CollapsibleSection>
  );
}
