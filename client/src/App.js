import React, { useState, useEffect } from 'react';
import {
  Layout, Form, Button, Card, Statistic, Row, Col,
  Tabs, Alert, App as AntApp, Input
} from 'antd';
import { PlusOutlined, DollarOutlined, AppstoreOutlined, CalendarOutlined, UnorderedListOutlined, SearchOutlined } from '@ant-design/icons';
import moment from 'moment';
import { getExpenses, createExpense, updateExpense, deleteExpense } from './services/api';
import ExpenseTable from './components/ExpenseTable';
import ExpenseForm from './components/ExpenseForm';
import CategorySummary from './components/CategorySummary';
import MonthlyTrend from './components/MonthlyTrend';

const { Header, Content } = Layout;

// Inner component so we can use AntApp.useApp() for message notifications
const AppContent = () => {
  const { message } = AntApp.useApp();

  const [expenses, setExpenses] = useState([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [form] = Form.useForm();

  // Fetch all expenses from the backend on mount
  useEffect(() => {
    fetchExpenses();
  }, []);

  const fetchExpenses = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getExpenses();
      setExpenses(res.data);
    } catch (err) {
      setError('Unable to connect to the server. Please make sure the backend is running.');
      message.error('Failed to load data.');
    } finally {
      setLoading(false);
    }
  };

  // Handle both create and update operations
  const handleAddOrEdit = async (values) => {
    try {
      const data = { ...values, date: values.date.format('YYYY-MM-DD') };
      if (editingItem) {
        await updateExpense(editingItem._id, data);
        message.success('Expense updated successfully!');
      } else {
        await createExpense(data);
        message.success('Expense added successfully!');
      }
      setIsModalVisible(false);
      form.resetFields();
      setEditingItem(null);
      fetchExpenses();
    } catch (err) {
      message.error('Failed to save. Please try again.');
    }
  };

  // Delete a single expense record by ID
  const handleDelete = async (id) => {
    try {
      await deleteExpense(id);
      message.success('Expense deleted.');
      fetchExpenses();
    } catch (err) {
      message.error('Failed to delete.');
    }
  };

  // Open the edit modal pre-filled with the selected record
  const handleEdit = (record) => {
    setEditingItem(record);
    setIsModalVisible(true);
    form.setFieldsValue({ ...record, date: moment(record.date) });
  };

  const handleModalClose = () => {
    setIsModalVisible(false);
    setEditingItem(null);
    form.resetFields();
  };

  // Summary statistics for the header cards
  const totalAmount = expenses.reduce((sum, item) => sum + (item.amount || 0), 0);
  const thisMonth = new Date().toISOString().substring(0, 7);
  const monthlyTotal = expenses
    .filter((item) => item.date?.startsWith(thisMonth))
    .reduce((sum, item) => sum + (item.amount || 0), 0);

  const tabItems = [
    {
      key: 'all',
      label: <span><UnorderedListOutlined /> All Expenses</span>,
      children: (
        <>
          <Input
            placeholder="Search by expense item (title)..."
            prefix={<SearchOutlined style={{ color: '#bfbfbf' }} />}
            allowClear
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ marginBottom: 16, maxWidth: 360 }}
          />
          <ExpenseTable
            expenses={expenses}
            loading={loading}
            onEdit={handleEdit}
            onDelete={handleDelete}
            searchTerm={searchTerm}
          />
        </>
      ),
    },
    {
      key: 'category',
      label: <span><AppstoreOutlined /> By Category</span>,
      children: <CategorySummary expenses={expenses} />,
    },
    {
      key: 'monthly',
      label: <span><CalendarOutlined /> Monthly Trends</span>,
      children: <MonthlyTrend expenses={expenses} />,
    },
  ];

  return (
    <Layout style={{ minHeight: '100vh', background: '#f0f2f5' }}>
      <Header style={{ background: '#001529', display: 'flex', alignItems: 'center', padding: '0 24px' }}>
        <h2 style={{ color: 'white', margin: 0 }}>My Expense Tracker</h2>
      </Header>
      <Content style={{ padding: '24px' }}>

        {/* Error banner shown when the backend API is unreachable */}
        {error && (
          <Alert description={error} type="error" showIcon style={{ marginBottom: 16 }} />
        )}

        {/* Summary statistic cards */}
        <Row gutter={16} style={{ marginBottom: '24px' }}>
          <Col xs={24} sm={8}>
            <Card variant="borderless">
              <Statistic
                title="Total Expenses"
                value={totalAmount}
                precision={2}
                prefix={<DollarOutlined />}
                styles={{ value: { color: '#cf1322' } }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={8}>
            <Card variant="borderless">
              <Statistic
                title="This Month"
                value={monthlyTotal}
                precision={2}
                prefix={<DollarOutlined />}
                styles={{ value: { color: '#fa8c16' } }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={8}>
            <Card variant="borderless">
              <Statistic title="Total Records" value={expenses.length} />
            </Card>
          </Col>
        </Row>

        {/* Main content card with tabbed views */}
        <Card
          variant="borderless"
          extra={
            <Button type="primary" icon={<PlusOutlined />} onClick={() => setIsModalVisible(true)}>
              Add New
            </Button>
          }
        >
          <Tabs items={tabItems} />
        </Card>

        {/* Add / Edit expense modal */}
        <ExpenseForm
          visible={isModalVisible}
          onCancel={handleModalClose}
          onSubmit={handleAddOrEdit}
          editingItem={editingItem}
          form={form}
        />

      </Content>
    </Layout>
  );
};

// Wrap with AntApp to enable App.useApp() hooks (message, modal, notification)
const App = () => (
  <AntApp>
    <AppContent />
  </AntApp>
);

export default App;
