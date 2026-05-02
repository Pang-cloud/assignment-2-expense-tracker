import React from 'react';
import { Table, Button, Space, Tag, Popconfirm } from 'antd';
import { EditOutlined, DeleteOutlined } from '@ant-design/icons';

// Category color mapping for visual distinction
const CATEGORIES = ['Food', 'Transport', 'Shopping', 'Entertainment', 'Health', 'Education', 'Utilities', 'Other'];
const CATEGORY_COLORS = {
  Food: 'orange', Transport: 'blue', Shopping: 'purple',
  Entertainment: 'magenta', Health: 'green', Education: 'cyan',
  Utilities: 'gold', Other: 'default',
};

// Displays all expense records in a sortable, filterable table
const ExpenseTable = ({ expenses, loading, onEdit, onDelete, searchTerm = '' }) => {
  // Filter by expense item (title) in real-time as user types
  const filteredExpenses = searchTerm.trim()
    ? expenses.filter((item) =>
        item.title?.toLowerCase().includes(searchTerm.trim().toLowerCase())
      )
    : expenses;
  const columns = [
    {
      title: 'Date',
      dataIndex: 'date',
      key: 'date',
      sorter: (a, b) => a.date.localeCompare(b.date),
    },
    { title: 'Title', dataIndex: 'title', key: 'title' },
    {
      title: 'Category',
      dataIndex: 'category',
      key: 'category',
      render: (cat) => <Tag color={CATEGORY_COLORS[cat] || 'default'}>{cat}</Tag>,
      filters: CATEGORIES.map((cat) => ({ text: cat, value: cat })),
      onFilter: (value, record) => record.category === value,
    },
    {
      title: 'Amount',
      dataIndex: 'amount',
      key: 'amount',
      render: (val) => `$${val?.toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
      sorter: (a, b) => a.amount - b.amount,
    },
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
      render: (val) => val || '-',
    },
    {
      title: 'Action',
      key: 'action',
      render: (_, record) => (
        <Space size="middle">
          <Button icon={<EditOutlined />} onClick={() => onEdit(record)} />
          <Popconfirm
            title="Delete this expense?"
            description="This action cannot be undone."
            onConfirm={() => onDelete(record._id)}
            okText="Delete"
            cancelText="Cancel"
            okButtonProps={{ danger: true }}
          >
            <Button danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <Table
      dataSource={filteredExpenses}
      columns={columns}
      rowKey="_id"
      loading={loading}
      pagination={{ pageSize: 10 }}
      locale={{
        emptyText: searchTerm.trim() ? `No results found for "${searchTerm}"` : 'No data',
      }}
    />
  );
};

export default ExpenseTable;
