import React from 'react';
import { Modal, Form, Input, InputNumber, DatePicker, Select } from 'antd';

// Predefined category options for the dropdown
const CATEGORIES = ['Food', 'Transport', 'Shopping', 'Entertainment', 'Health', 'Education', 'Utilities', 'Other'];

// Modal form for adding or editing an expense record
const ExpenseForm = ({ visible, onCancel, onSubmit, editingItem, form }) => {
  return (
    <Modal
      title={editingItem ? 'Edit Expense' : 'Add New Expense'}
      open={visible}
      onCancel={onCancel}
      onOk={() => form.submit()}
      okText={editingItem ? 'Update' : 'Add'}
      cancelText="Cancel"
    >
      <Form form={form} layout="vertical" onFinish={onSubmit}>
        <Form.Item name="date" label="Date" rules={[{ required: true, message: 'Please select a date!' }]}>
          <DatePicker style={{ width: '100%' }} />
        </Form.Item>
        <Form.Item name="title" label="Title" rules={[{ required: true, message: 'Please enter a title!' }]}>
          <Input placeholder="e.g. Sydney Cafe" />
        </Form.Item>
        <Form.Item name="category" label="Category" rules={[{ required: true, message: 'Please select a category!' }]}>
          <Select
            placeholder="Select a category"
            style={{ width: '100%' }}
            options={CATEGORIES.map((cat) => ({ label: cat, value: cat }))}
          />
        </Form.Item>
        <Form.Item name="amount" label="Amount ($)" rules={[{ required: true, message: 'Please enter the amount!' }]}>
          <InputNumber style={{ width: '100%' }} prefix="$" min={0} precision={2} />
        </Form.Item>
        <Form.Item name="description" label="Description">
          <Input.TextArea placeholder="Optional: add notes about this expense" rows={3} />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default ExpenseForm;
