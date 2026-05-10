import React from "react";
import { Button, Popconfirm, Space, Table, Tag } from "antd";
import { DeleteOutlined, EditOutlined } from "@ant-design/icons";

const formatMoney = (value) => {
  return `$${Number(value || 0).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};

const ExpenseTable = ({ expenses, loading, onEdit, onDelete, searchTerm }) => {
  const filteredExpenses = expenses.filter((item) => {
    const keyword = searchTerm.trim().toLowerCase();

    if (!keyword) {
      return true;
    }

    return (
      item.title?.toLowerCase().includes(keyword) ||
      item.category?.toLowerCase().includes(keyword) ||
      item.description?.toLowerCase().includes(keyword)
    );
  });

  const columns = [
    {
      title: "Title",
      dataIndex: "title",
      key: "title",
      render: (value) => <strong>{value}</strong>,
    },
    {
      title: "Category",
      dataIndex: "category",
      key: "category",
      render: (value) => <Tag color="blue">{value}</Tag>,
    },
    {
      title: "Amount",
      dataIndex: "amount",
      key: "amount",
      render: (value) => <strong>{formatMoney(value)}</strong>,
      sorter: (a, b) => Number(a.amount) - Number(b.amount),
    },
    {
      title: "Date",
      dataIndex: "date",
      key: "date",
      sorter: (a, b) => new Date(a.date) - new Date(b.date),
    },
    {
      title: "Description",
      dataIndex: "description",
      key: "description",
      render: (value) => value || "-",
    },
    {
      title: "Action",
      key: "action",
      align: "center",
      render: (_, record) => (
        <Space>
          <Button icon={<EditOutlined />} onClick={() => onEdit(record)} />

          <Popconfirm
            title="Delete this expense?"
            description="This expense record will be removed."
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
      rowKey="_id"
      dataSource={filteredExpenses}
      columns={columns}
      loading={loading}
      pagination={{
        pageSize: 10,
        showSizeChanger: false,
      }}
    />
  );
};

export default ExpenseTable;
