import React from "react";
import {
  Button,
  Card,
  Col,
  Empty,
  Row,
  Space,
  Statistic,
  Switch,
  Table,
  Tag,
  Typography,
} from "antd";
import {
  HistoryOutlined,
  ReloadOutlined,
  SafetyCertificateOutlined,
  TeamOutlined,
  UserOutlined,
  UserSwitchOutlined,
} from "@ant-design/icons";
import { getAvatarValue } from "../constants/avatarOptions";

const { Text } = Typography;

const formatDateTime = (value) => {
  if (!value) return "-";

  return new Date(value).toLocaleString("en-AU", {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const getActionColor = (action) => {
  const value = String(action || "").toUpperCase();

  if (value.includes("DELETE") || value.includes("DEACTIVATE") || value.includes("DISABLED")) {
    return "red";
  }

  if (value.includes("UPDATE")) {
    return "orange";
  }

  if (value.includes("CREATE") || value.includes("REGISTER")) {
    return "green";
  }

  if (value.includes("LOGIN") || value.includes("LOGOUT")) {
    return "blue";
  }

  if (value.includes("BUDGET")) {
    return "purple";
  }

  return "default";
};

const AdminPanel = ({
  users,
  activities,
  usersLoading,
  activitiesLoading,
  currentUser,
  onUpdateUser,
  onRefresh,
}) => {
  const currentUserId = currentUser?._id || currentUser?.id;

  const activeUsers = users.filter((user) => user.isActive).length;
  const adminUsers = users.filter((user) => user.role === "admin").length;

  const userColumns = [
    {
      title: "User",
      key: "user",
      render: (_, record) => {
        const isCurrentUser = (record._id || record.id) === currentUserId;
        const avatar = getAvatarValue(record.avatar);

        return (
          <Space>
            <span className={`mini-avatar avatar-${avatar}`}>
              <UserOutlined />
            </span>

            <Space direction="vertical" size={2}>
              <Space>
                <Text strong>{record.username}</Text>
                {isCurrentUser && <Tag color="blue">You</Tag>}
              </Space>

              <Text type="secondary">{record.email}</Text>
            </Space>
          </Space>
        );
      },
    },
    {
      title: "Role",
      dataIndex: "role",
      key: "role",
      align: "center",
      render: (value) => (
        <Tag color={value === "admin" ? "blue" : "default"}>
          {value === "admin" ? "Admin" : "User"}
        </Tag>
      ),
    },
    {
      title: "Status",
      dataIndex: "isActive",
      key: "isActive",
      align: "center",
      render: (value, record) => {
        const isCurrentUser = (record._id || record.id) === currentUserId;
        const canChangeStatus = record.role === "user" && !isCurrentUser;

        return (
          <Switch
            checked={value}
            disabled={!canChangeStatus}
            checkedChildren="Active"
            unCheckedChildren="Inactive"
            onChange={(checked) => onUpdateUser(record._id, { isActive: checked })}
          />
        );
      },
    },
    {
      title: "Created",
      dataIndex: "createdAt",
      key: "createdAt",
      render: (value) => <Text type="secondary">{formatDateTime(value)}</Text>,
    },
  ];

  const activityColumns = [
    {
      title: "Time",
      dataIndex: "createdAt",
      key: "createdAt",
      width: 180,
      render: (value) => <Text type="secondary">{formatDateTime(value)}</Text>,
    },
    {
      title: "User",
      dataIndex: "userId",
      key: "userId",
      render: (user) => {
        if (!user || typeof user === "string") {
          return <Text type="secondary">Unknown user</Text>;
        }

        return (
          <Space direction="vertical" size={2}>
            <Text strong>{user.username}</Text>
            <Text type="secondary">{user.email}</Text>
          </Space>
        );
      },
    },
    {
      title: "Action",
      dataIndex: "action",
      key: "action",
      align: "center",
      render: (value) => <Tag color={getActionColor(value)}>{value}</Tag>,
    },
    {
      title: "Details",
      dataIndex: "details",
      key: "details",
      render: (value) => value || "-",
    },
  ];

  return (
    <Space direction="vertical" size={20} style={{ width: "100%" }}>
      <div className="admin-panel-heading">
        <div>
          <Text className="admin-panel-title">Admin Panel</Text>
          <Text type="secondary" className="admin-panel-subtitle">
            Manage normal user accounts and review activity records.
          </Text>
        </div>

        <Button icon={<ReloadOutlined />} onClick={onRefresh}>
          Refresh
        </Button>
      </div>

      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={6}>
          <Card className="admin-stat-card" variant="borderless">
            <Statistic title="Total Users" value={users.length} prefix={<TeamOutlined />} />
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <Card className="admin-stat-card active-admin-card" variant="borderless">
            <Statistic title="Active Users" value={activeUsers} prefix={<UserSwitchOutlined />} />
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <Card className="admin-stat-card role-admin-card" variant="borderless">
            <Statistic
              title="Admin Accounts"
              value={adminUsers}
              prefix={<SafetyCertificateOutlined />}
            />
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <Card className="admin-stat-card log-admin-card" variant="borderless">
            <Statistic
              title="Activity Logs"
              value={activities.length}
              prefix={<HistoryOutlined />}
            />
          </Card>
        </Col>
      </Row>

      <Card title="User Management" className="content-card" variant="borderless">
        {users.length === 0 ? (
          <Empty description="No users found." />
        ) : (
          <Table
            rowKey="_id"
            columns={userColumns}
            dataSource={users}
            loading={usersLoading}
            pagination={{
              pageSize: 10,
              showSizeChanger: false,
            }}
          />
        )}
      </Card>

      <Card title="Activity Logs" className="content-card" variant="borderless">
        {activities.length === 0 ? (
          <Empty description="No activity logs found." />
        ) : (
          <Table
            rowKey="_id"
            columns={activityColumns}
            dataSource={activities}
            loading={activitiesLoading}
            pagination={{
              pageSize: 10,
              showSizeChanger: false,
            }}
          />
        )}
      </Card>
    </Space>
  );
};

export default AdminPanel;
