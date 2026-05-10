import React, { useMemo, useState } from "react";
import {
  Alert,
  Button,
  Card,
  Col,
  Empty,
  Form,
  Input,
  InputNumber,
  Modal,
  Popconfirm,
  Progress,
  Row,
  Space,
  Statistic,
  Table,
  Tag,
  Typography,
} from "antd";
import {
  CalendarOutlined,
  DeleteOutlined,
  DollarOutlined,
  EditOutlined,
  PlusOutlined,
} from "@ant-design/icons";

const { Text } = Typography;

const getCurrentMonth = () => {
  return new Date().toISOString().substring(0, 7);
};

const formatMoney = (value) => {
  return `$${Number(value || 0).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};

const formatMonth = (value) => {
  if (!value) return "-";

  const [year, month] = value.split("-");

  return new Date(Number(year), Number(month) - 1).toLocaleString("en-US", {
    month: "long",
    year: "numeric",
  });
};

const getMonthSpending = (expenses, month) => {
  return expenses
    .filter((item) => item.date?.startsWith(month))
    .reduce((sum, item) => sum + Number(item.amount || 0), 0);
};

const BudgetPanel = ({ budgets, expenses, loading, onCreate, onUpdate, onDelete }) => {
  const [form] = Form.useForm();

  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonth());
  const [modalOpen, setModalOpen] = useState(false);
  const [editingBudget, setEditingBudget] = useState(null);
  const [saving, setSaving] = useState(false);

  const selectedBudget = budgets.find((item) => item.month === selectedMonth);

  const monthSpending = useMemo(() => {
    return getMonthSpending(expenses, selectedMonth);
  }, [expenses, selectedMonth]);

  const budgetLimit = Number(selectedBudget?.limit || 0);
  const remaining = budgetLimit - monthSpending;

  const actualUsedPercent = budgetLimit > 0 ? (monthSpending / budgetLimit) * 100 : 0;
  const progressPercent = Math.min(actualUsedPercent, 100);
  const overPercent = Math.max(actualUsedPercent - 100, 0);

  const isOverBudget = selectedBudget && monthSpending > budgetLimit;

  const openAddModal = () => {
    setEditingBudget(null);
    setModalOpen(true);

    form.setFieldsValue({
      month: selectedMonth,
      limit: null,
      note: "",
    });
  };

  const openEditModal = (record) => {
    setEditingBudget(record);
    setModalOpen(true);

    form.setFieldsValue({
      month: record.month,
      limit: record.limit,
      note: record.note,
    });
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingBudget(null);
    form.resetFields();
  };

  const handleSubmit = async (values) => {
    setSaving(true);

    try {
      const success = editingBudget
        ? await onUpdate(editingBudget._id, values)
        : await onCreate(values);

      if (success) {
        setSelectedMonth(values.month);
        closeModal();
      }
    } finally {
      setSaving(false);
    }
  };

  const columns = [
    {
      title: "Month",
      dataIndex: "month",
      key: "month",
      render: (value) => (
        <Space>
          <CalendarOutlined />
          <span>{formatMonth(value)}</span>
        </Space>
      ),
    },
    {
      title: "Budget Limit",
      dataIndex: "limit",
      key: "limit",
      render: (value) => <strong>{formatMoney(value)}</strong>,
      sorter: (a, b) => Number(a.limit) - Number(b.limit),
    },
    {
      title: "Note",
      dataIndex: "note",
      key: "note",
      render: (value) => value || "-",
    },
    {
      title: "Status",
      key: "status",
      render: (_, record) => {
        const spent = getMonthSpending(expenses, record.month);
        const over = spent > Number(record.limit);

        return <Tag color={over ? "red" : "green"}>{over ? "Over Budget" : "On Track"}</Tag>;
      },
    },
    {
      title: "Action",
      key: "action",
      render: (_, record) => (
        <Space>
          <Button icon={<EditOutlined />} onClick={() => openEditModal(record)} />

          <Popconfirm
            title="Delete this budget?"
            description="This budget record will be removed."
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
    <Space direction="vertical" size={20} style={{ width: "100%" }}>
      <div className="budget-toolbar">
        <Text className="budget-section-title">Monthly Budget</Text>

        <Space wrap>
          <Input
            type="month"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value || getCurrentMonth())}
            className="budget-month-input"
          />

          <Button type="primary" icon={<PlusOutlined />} onClick={openAddModal}>
            Add Budget
          </Button>
        </Space>
      </div>

      {!selectedBudget && (
        <Alert
          type="info"
          showIcon
          className="page-alert"
          message="No budget set for this month"
          description="Add a budget for the selected month to track your spending progress."
        />
      )}

      <Row gutter={[16, 16]}>
        <Col xs={24} md={8}>
          <Card className="budget-card" variant="borderless">
            <Statistic
              title="Budget Limit"
              value={budgetLimit}
              precision={2}
              prefix={<DollarOutlined />}
            />
          </Card>
        </Col>

        <Col xs={24} md={8}>
          <Card className="budget-card spent-card" variant="borderless">
            <Statistic
              title="Spent This Month"
              value={monthSpending}
              precision={2}
              prefix={<DollarOutlined />}
            />
          </Card>
        </Col>

        <Col xs={24} md={8}>
          <Card
            className={isOverBudget ? "budget-card over-card" : "budget-card good-card"}
            variant="borderless"
          >
            <Statistic
              title={isOverBudget ? "Over Budget By" : "Remaining"}
              value={Math.abs(remaining)}
              precision={2}
              prefix={<DollarOutlined />}
            />
          </Card>
        </Col>
      </Row>

      <Card className="budget-progress-card" variant="borderless">
        <div className="budget-progress-header">
          <div>
            <Text strong>{formatMonth(selectedMonth)}</Text>
            <br />

            <Text type="secondary">
              {selectedBudget
                ? `You have used ${actualUsedPercent.toFixed(1)}% of this month's budget.`
                : "Create a budget to start tracking this month."}
            </Text>

            {selectedBudget && isOverBudget && (
              <div className="budget-progress-meta">
                {formatMoney(Math.abs(remaining))} over budget · {overPercent.toFixed(1)}% over
              </div>
            )}
          </div>

          {selectedBudget && (
            <Tag color={isOverBudget ? "red" : "green"}>
              {isOverBudget ? "Over Budget" : "On Track"}
            </Tag>
          )}
        </div>

        <Progress
          percent={Number(progressPercent.toFixed(1))}
          status={isOverBudget ? "exception" : "active"}
          format={() => (selectedBudget ? `${actualUsedPercent.toFixed(1)}%` : "0%")}
        />
      </Card>

      <Card title="Budget Records" className="content-card" variant="borderless">
        {budgets.length === 0 ? (
          <Empty description="No budget records yet." />
        ) : (
          <Table
            rowKey="_id"
            dataSource={budgets}
            columns={columns}
            loading={loading}
            pagination={{ pageSize: 6 }}
          />
        )}
      </Card>

      <Modal
        title={editingBudget ? "Edit Budget" : "Add Budget"}
        open={modalOpen}
        onCancel={closeModal}
        onOk={() => form.submit()}
        okText={editingBudget ? "Update" : "Add"}
        confirmLoading={saving}
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item
            name="month"
            label="Month"
            rules={[{ required: true, message: "Please select a month." }]}
          >
            <Input type="month" />
          </Form.Item>

          <Form.Item
            name="limit"
            label="Budget Limit ($)"
            rules={[
              { required: true, message: "Please enter a budget limit." },
              {
                validator: (_, value) => {
                  if (value === undefined || value === null || value === "") {
                    return Promise.resolve();
                  }

                  if (Number(value) > 0) {
                    return Promise.resolve();
                  }

                  return Promise.reject(new Error("Budget limit must be greater than 0."));
                },
              },
            ]}
          >
            <InputNumber
              precision={2}
              prefix="$"
              style={{ width: "100%" }}
              placeholder="e.g. 1200"
            />
          </Form.Item>

          <Form.Item name="note" label="Note">
            <Input.TextArea rows={3} placeholder="Optional: rent, transport, food or study costs" />
          </Form.Item>
        </Form>
      </Modal>
    </Space>
  );
};

export default BudgetPanel;
