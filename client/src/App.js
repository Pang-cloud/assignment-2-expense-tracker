import React, { useEffect, useState } from "react";
import "./App.css";
import {
  Layout,
  Form,
  Button,
  Card,
  Statistic,
  Row,
  Col,
  Tabs,
  Alert,
  App as AntApp,
  Input,
  Space,
  Tag,
  Typography,
  ConfigProvider,
} from "antd";
import {
  PlusOutlined,
  DollarOutlined,
  AppstoreOutlined,
  CalendarOutlined,
  UnorderedListOutlined,
  SearchOutlined,
  LogoutOutlined,
  UserOutlined,
  SafetyCertificateOutlined,
  FileTextOutlined,
  TeamOutlined,
} from "@ant-design/icons";
import moment from "moment";

import {
  registerUser,
  loginUser,
  logoutUser,
  getProfile,
  updateProfile,
  getExpenses,
  createExpense,
  updateExpense,
  deleteExpense,
  getBudgets,
  createBudget,
  updateBudget,
  deleteBudget,
  getAdminUsers,
  updateAdminUser,
  getAdminActivities,
} from "./services/api";

import ExpenseTable from "./components/ExpenseTable";
import ExpenseForm from "./components/ExpenseForm";
import CategorySummary from "./components/CategorySummary";
import MonthlyTrend from "./components/MonthlyTrend";
import BudgetPanel from "./components/BudgetPanel";
import AdminPanel from "./components/AdminPanel";

const { Header, Content } = Layout;
const { Title, Text } = Typography;

const AppContent = () => {
  const { message } = AntApp.useApp();

  const savedUser = localStorage.getItem("user");

  const [currentUser, setCurrentUser] = useState(savedUser ? JSON.parse(savedUser) : null);

  const [authMode, setAuthMode] = useState("login");
  const [authLoading, setAuthLoading] = useState(false);

  const [expenses, setExpenses] = useState([]);
  const [budgets, setBudgets] = useState([]);
  const [adminUsers, setAdminUsers] = useState([]);
  const [activities, setActivities] = useState([]);

  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingItem, setEditingItem] = useState(null);

  const [loading, setLoading] = useState(false);
  const [budgetLoading, setBudgetLoading] = useState(false);
  const [adminUsersLoading, setAdminUsersLoading] = useState(false);
  const [activitiesLoading, setActivitiesLoading] = useState(false);
  const [error, setError] = useState(null);

  const [searchTerm, setSearchTerm] = useState("");

  const [expenseForm] = Form.useForm();
  const [authForm] = Form.useForm();
  const [profileForm] = Form.useForm();

  // Save user info after login or register
  const saveUser = (user) => {
    setCurrentUser(user);
    localStorage.setItem("user", JSON.stringify(user));
  };

  // Clear local login data after logout or expired token
  const clearLogin = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setCurrentUser(null);
    setExpenses([]);
    setBudgets([]);
    setAdminUsers([]);
    setActivities([]);
  };

  // Load expenses for the logged-in user
  const fetchExpenses = async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await getExpenses();
      setExpenses(res.data);
    } catch (err) {
      if (err.response?.status === 401) {
        clearLogin();
        message.error("Please login again.");
      } else {
        setError("Unable to connect to the server. Please make sure the backend is running.");
        message.error("Failed to load data.");
      }
    } finally {
      setLoading(false);
    }
  };

  // Load budgets for the logged-in user
  const fetchBudgets = async () => {
    setBudgetLoading(true);

    try {
      const res = await getBudgets();
      setBudgets(res.data);
    } catch (err) {
      if (err.response?.status === 401) {
        clearLogin();
        message.error("Please login again.");
      } else {
        message.error("Failed to load budgets.");
      }
    } finally {
      setBudgetLoading(false);
    }
  };

  // Admin only: load user accounts
  const fetchAdminUsers = async () => {
    setAdminUsersLoading(true);

    try {
      const res = await getAdminUsers();
      setAdminUsers(res.data);
    } catch (err) {
      if (err.response?.status === 401) {
        clearLogin();
        message.error("Please login again.");
      } else if (err.response?.status === 403) {
        message.error("Admin access is required.");
      } else {
        message.error("Failed to load users.");
      }
    } finally {
      setAdminUsersLoading(false);
    }
  };

  // Admin only: load activity logs
  const fetchAdminActivities = async () => {
    setActivitiesLoading(true);

    try {
      const res = await getAdminActivities();
      setActivities(res.data);
    } catch (err) {
      if (err.response?.status === 401) {
        clearLogin();
        message.error("Please login again.");
      } else if (err.response?.status === 403) {
        message.error("Admin access is required.");
      } else {
        message.error("Failed to load activity logs.");
      }
    } finally {
      setActivitiesLoading(false);
    }
  };

  // Get the latest user profile from the backend
  const fetchProfile = async () => {
    try {
      const res = await getProfile();

      const user = {
        ...res.data,
        id: res.data._id,
      };

      saveUser(user);

      profileForm.setFieldsValue({
        username: user.username,
        email: user.email,
      });
    } catch (err) {
      clearLogin();
    }
  };

  useEffect(() => {
    if (!currentUser) {
      return;
    }

    fetchProfile();
    fetchExpenses();
    fetchBudgets();

    if (currentUser.role === "admin") {
      fetchAdminUsers();
      fetchAdminActivities();
    }

    // This only needs to run once after loading a saved login
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (currentUser) {
      profileForm.setFieldsValue({
        username: currentUser.username,
        email: currentUser.email,
      });
    }
  }, [currentUser, profileForm]);

  // Login or register based on the selected mode
  const handleAuthSubmit = async (values) => {
    setAuthLoading(true);

    try {
      const res = authMode === "login" ? await loginUser(values) : await registerUser(values);
      const user = res.data.user;

      localStorage.setItem("token", res.data.token);
      saveUser(user);

      authForm.resetFields();
      message.success(authMode === "login" ? "Login successful." : "Account created.");

      fetchExpenses();
      fetchBudgets();

      if (user.role === "admin") {
        fetchAdminUsers();
        fetchAdminActivities();
      }
    } catch (err) {
      const errorMessage = err.response?.data?.error || "Something went wrong. Please try again.";
      message.error(errorMessage);
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logoutUser();
    } catch (err) {
      // Still logout on the frontend if the backend request fails
    }

    clearLogin();
    message.success("Logged out.");
  };

  const handleAddOrEdit = async (values) => {
    try {
      const data = {
        ...values,
        date: values.date.format("YYYY-MM-DD"),
      };

      if (editingItem) {
        await updateExpense(editingItem._id, data);
        message.success("Expense updated successfully.");
      } else {
        await createExpense(data);
        message.success("Expense added successfully.");
      }

      setIsModalVisible(false);
      expenseForm.resetFields();
      setEditingItem(null);

      fetchExpenses();
    } catch (err) {
      const errorMessage = err.response?.data?.error || "Failed to save. Please try again.";
      message.error(errorMessage);
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteExpense(id);
      message.success("Expense deleted.");

      fetchExpenses();
    } catch (err) {
      message.error("Failed to delete.");
    }
  };

  const handleCreateBudget = async (values) => {
    try {
      await createBudget(values);
      message.success("Budget added successfully.");

      await fetchBudgets();
      return true;
    } catch (err) {
      const errorMessage = err.response?.data?.error || "Failed to add budget.";
      message.error(errorMessage);
      return false;
    }
  };

  const handleUpdateBudget = async (id, values) => {
    try {
      await updateBudget(id, values);
      message.success("Budget updated successfully.");

      await fetchBudgets();
      return true;
    } catch (err) {
      const errorMessage = err.response?.data?.error || "Failed to update budget.";
      message.error(errorMessage);
      return false;
    }
  };

  const handleDeleteBudget = async (id) => {
    try {
      await deleteBudget(id);
      message.success("Budget deleted.");

      await fetchBudgets();
    } catch (err) {
      const errorMessage = err.response?.data?.error || "Failed to delete budget.";
      message.error(errorMessage);
    }
  };

  const handleAdminUserUpdate = async (id, data) => {
    try {
      await updateAdminUser(id, data);
      message.success("User account updated.");

      await fetchAdminUsers();
      await fetchAdminActivities();

      return true;
    } catch (err) {
      const errorMessage = err.response?.data?.error || "Failed to update user.";
      message.error(errorMessage);

      await fetchAdminUsers();
      return false;
    }
  };

  const handleRefreshAdmin = async () => {
    await fetchAdminUsers();
    await fetchAdminActivities();

    message.success("Admin data refreshed.");
  };

  const handleEdit = (record) => {
    setEditingItem(record);
    setIsModalVisible(true);

    expenseForm.setFieldsValue({
      ...record,
      date: moment(record.date),
    });
  };

  const handleModalClose = () => {
    setIsModalVisible(false);
    setEditingItem(null);
    expenseForm.resetFields();
  };

  const handleUpdateProfile = async (values) => {
    try {
      const res = await updateProfile(values);

      const user = {
        ...res.data,
        id: res.data._id,
      };

      saveUser(user);
      message.success("Profile updated.");
    } catch (err) {
      const errorMessage = err.response?.data?.error || "Failed to update profile.";
      message.error(errorMessage);
    }
  };

  const totalAmount = expenses.reduce((sum, item) => sum + Number(item.amount || 0), 0);

  const thisMonth = new Date().toISOString().substring(0, 7);

  const monthlyTotal = expenses
    .filter((item) => item.date?.startsWith(thisMonth))
    .reduce((sum, item) => sum + Number(item.amount || 0), 0);

  const expenseCount = expenses.length;
  const averageAmount = expenseCount > 0 ? totalAmount / expenseCount : 0;

  const tabItems = [
    {
      key: "all",
      label: (
        <span>
          <UnorderedListOutlined /> All Expenses
        </span>
      ),
      children: (
        <>
          <div className="table-toolbar">
            <Input
              placeholder="Search by expense item..."
              prefix={<SearchOutlined />}
              allowClear
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />

            <Button type="primary" icon={<PlusOutlined />} onClick={() => setIsModalVisible(true)}>
              Add New
            </Button>
          </div>

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
      key: "category",
      label: (
        <span>
          <AppstoreOutlined /> By Category
        </span>
      ),
      children: <CategorySummary expenses={expenses} />,
    },
    {
      key: "budget",
      label: (
        <span>
          <DollarOutlined /> Budgets
        </span>
      ),
      children: (
        <BudgetPanel
          budgets={budgets}
          expenses={expenses}
          loading={budgetLoading}
          onCreate={handleCreateBudget}
          onUpdate={handleUpdateBudget}
          onDelete={handleDeleteBudget}
        />
      ),
    },
    {
      key: "monthly",
      label: (
        <span>
          <CalendarOutlined /> Monthly Trends
        </span>
      ),
      children: <MonthlyTrend expenses={expenses} />,
    },
    ...(currentUser?.role === "admin"
      ? [
          {
            key: "admin",
            label: (
              <span>
                <TeamOutlined /> Admin Panel
              </span>
            ),
            children: (
              <AdminPanel
                users={adminUsers}
                activities={activities}
                usersLoading={adminUsersLoading}
                activitiesLoading={activitiesLoading}
                currentUser={currentUser}
                onUpdateUser={handleAdminUserUpdate}
                onRefresh={handleRefreshAdmin}
              />
            ),
          },
        ]
      : []),
    {
      key: "profile",
      label: (
        <span>
          <UserOutlined /> Profile
        </span>
      ),
      children: (
        <Row gutter={[20, 20]}>
          <Col xs={24} md={9}>
            <Card className="profile-card" variant="borderless">
              <div className="profile-avatar">
                <UserOutlined />
              </div>

              <Title level={4} className="profile-name">
                {currentUser?.username}
              </Title>

              <Text className="profile-email">{currentUser?.email}</Text>

              <Tag color={currentUser?.role === "admin" ? "blue" : "default"}>
                {currentUser?.role === "admin" ? "Admin Account" : "User Account"}
              </Tag>
            </Card>
          </Col>

          <Col xs={24} md={15}>
            <Card title="Account Details" className="content-card" variant="borderless">
              <Form form={profileForm} layout="vertical" onFinish={handleUpdateProfile}>
                <Form.Item
                  name="username"
                  label="Username"
                  rules={[{ required: true, message: "Please enter your username." }]}
                >
                  <Input />
                </Form.Item>

                <Form.Item
                  name="email"
                  label="Email"
                  rules={[{ required: true, message: "Please enter your email." }]}
                >
                  <Input />
                </Form.Item>

                <Button type="primary" htmlType="submit">
                  Save Changes
                </Button>
              </Form>
            </Card>
          </Col>
        </Row>
      ),
    },
  ];

  if (!currentUser) {
    return (
      <Layout className="app-layout">
        <Header className="app-header">
          <div className="header-title-group">
            <h2>My Expense Tracker</h2>
          </div>
        </Header>

        <Content className="auth-content">
          <Card className="auth-card" variant="borderless">
            <Space direction="vertical" size={18} style={{ width: "100%" }}>
              <div className="auth-title-block">
                <SafetyCertificateOutlined className="auth-icon" />

                <Title level={3} style={{ marginBottom: 4 }}>
                  {authMode === "login" ? "Login" : "Create Account"}
                </Title>

                <Text type="secondary">
                  {authMode === "login"
                    ? "Enter your account details to continue."
                    : "Register a new account for your expense records."}
                </Text>
              </div>

              <div className="auth-switch">
                <Button
                  type={authMode === "login" ? "primary" : "default"}
                  onClick={() => {
                    setAuthMode("login");
                    authForm.resetFields();
                  }}
                >
                  Login
                </Button>

                <Button
                  type={authMode === "register" ? "primary" : "default"}
                  onClick={() => {
                    setAuthMode("register");
                    authForm.resetFields();
                  }}
                >
                  Register
                </Button>
              </div>

              <Form form={authForm} layout="vertical" onFinish={handleAuthSubmit}>
                {authMode === "register" && (
                  <Form.Item
                    name="username"
                    label="Username"
                    rules={[{ required: true, message: "Please enter a username." }]}
                  >
                    <Input placeholder="e.g. Pang" />
                  </Form.Item>
                )}

                <Form.Item
                  name="email"
                  label="Email"
                  rules={[{ required: true, message: "Please enter your email." }]}
                >
                  <Input placeholder="e.g. pang@test.com" />
                </Form.Item>

                <Form.Item
                  name="password"
                  label="Password"
                  rules={[{ required: true, message: "Please enter your password." }]}
                >
                  <Input.Password placeholder="At least 6 characters" />
                </Form.Item>

                <Button type="primary" htmlType="submit" loading={authLoading} block>
                  {authMode === "login" ? "Login" : "Register"}
                </Button>
              </Form>
            </Space>
          </Card>
        </Content>
      </Layout>
    );
  }

  return (
    <Layout className="app-layout">
      <Header className="app-header">
        <div className="header-title-group">
          <h2>My Expense Tracker</h2>
        </div>

        <Space size={12}>
          <Tag color={currentUser.role === "admin" ? "blue" : "default"}>
            {currentUser.role === "admin" ? "Admin" : "User"}
          </Tag>

          <div className="user-badge">
            <UserOutlined />
            <span>{currentUser.username}</span>
          </div>

          <Button icon={<LogoutOutlined />} onClick={handleLogout}>
            Logout
          </Button>
        </Space>
      </Header>

      <Content className="app-content">
        {error && <Alert description={error} type="error" showIcon className="page-alert" />}

        <Row gutter={[16, 16]} className="summary-row">
          <Col xs={24} sm={12} lg={6}>
            <Card className="summary-card total-card" variant="borderless">
              <Statistic
                title="Total Expenses"
                value={totalAmount}
                precision={2}
                prefix={<DollarOutlined />}
              />
            </Card>
          </Col>

          <Col xs={24} sm={12} lg={6}>
            <Card className="summary-card month-card" variant="borderless">
              <Statistic
                title="This Month"
                value={monthlyTotal}
                precision={2}
                prefix={<DollarOutlined />}
              />
            </Card>
          </Col>

          <Col xs={24} sm={12} lg={6}>
            <Card className="summary-card entries-card" variant="borderless">
              <Statistic
                title="Expense Entries"
                value={expenseCount}
                prefix={<FileTextOutlined />}
              />
            </Card>
          </Col>

          <Col xs={24} sm={12} lg={6}>
            <Card className="summary-card average-card" variant="borderless">
              <Statistic
                title="Average per Entry"
                value={averageAmount}
                precision={2}
                prefix={<DollarOutlined />}
              />
            </Card>
          </Col>
        </Row>

        <Card className="main-card" variant="borderless">
          <Tabs items={tabItems} />
        </Card>

        <ExpenseForm
          visible={isModalVisible}
          onCancel={handleModalClose}
          onSubmit={handleAddOrEdit}
          editingItem={editingItem}
          form={expenseForm}
        />
      </Content>
    </Layout>
  );
};

const App = () => (
  <ConfigProvider
    theme={{
      token: {
        colorPrimary: "#1677ff",
        borderRadius: 10,
        fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif",
      },
    }}
  >
    <AntApp>
      <AppContent />
    </AntApp>
  </ConfigProvider>
);

export default App;
