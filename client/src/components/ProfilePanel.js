import React, { useEffect, useState } from "react";
import {
  Button,
  Card,
  Col,
  Form,
  Input,
  Popconfirm,
  Radio,
  Row,
  Space,
  Tag,
  Typography,
} from "antd";
import { DeleteOutlined, EditOutlined, UserOutlined } from "@ant-design/icons";
import { AVATAR_OPTIONS, getAvatarValue } from "../constants/avatarOptions";

const { Text, Title } = Typography;

const ProfilePanel = ({ currentUser, onUpdateProfile, onDeactivateAccount }) => {
  const [profileForm] = Form.useForm();

  const [isEditing, setIsEditing] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [deactivating, setDeactivating] = useState(false);

  const avatarValue = getAvatarValue(currentUser?.avatar);

  useEffect(() => {
    profileForm.setFieldsValue({
      username: currentUser?.username,
      email: currentUser?.email,
      avatar: avatarValue,
    });
  }, [currentUser, avatarValue, profileForm]);

  const handleEditProfile = () => {
    profileForm.setFieldsValue({
      username: currentUser?.username,
      email: currentUser?.email,
      avatar: avatarValue,
    });

    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    profileForm.setFieldsValue({
      username: currentUser?.username,
      email: currentUser?.email,
      avatar: avatarValue,
    });

    setIsEditing(false);
  };

  const handleProfileSubmit = async (values) => {
    setSavingProfile(true);

    try {
      const success = await onUpdateProfile(values);

      if (success) {
        setIsEditing(false);
      }
    } finally {
      setSavingProfile(false);
    }
  };

  const handleDeactivate = async () => {
    setDeactivating(true);

    try {
      await onDeactivateAccount();
    } finally {
      setDeactivating(false);
    }
  };

  return (
    <Row gutter={[20, 20]}>
      <Col xs={24} md={8}>
        <Card className="profile-card compact-profile-card" variant="borderless">
          <div className={`profile-avatar avatar-${avatarValue}`}>
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

      <Col xs={24} md={16}>
        <Space direction="vertical" size={20} style={{ width: "100%" }}>
          <Card title="Account Details" className="content-card" variant="borderless">
            {!isEditing ? (
              <Space direction="vertical" size={18} style={{ width: "100%" }}>
                <div className="profile-info-list">
                  <div className="profile-info-row">
                    <Text type="secondary" className="profile-info-label">
                      Username
                    </Text>
                    <Text className="profile-info-value">{currentUser?.username}</Text>
                  </div>

                  <div className="profile-info-row">
                    <Text type="secondary" className="profile-info-label">
                      Email
                    </Text>
                    <Text className="profile-info-value">{currentUser?.email}</Text>
                  </div>

                  <div className="profile-info-row">
                    <Text type="secondary" className="profile-info-label">
                      Avatar
                    </Text>
                    <Space>
                      <span className={`mini-avatar avatar-${avatarValue}`}>
                        <UserOutlined />
                      </span>
                      <Text className="profile-info-value">
                        {AVATAR_OPTIONS.find((item) => item.value === avatarValue)?.label}
                      </Text>
                    </Space>
                  </div>

                  <div className="profile-info-row">
                    <Text type="secondary" className="profile-info-label">
                      Role
                    </Text>
                    <Tag color={currentUser?.role === "admin" ? "blue" : "default"}>
                      {currentUser?.role === "admin" ? "Admin" : "User"}
                    </Tag>
                  </div>
                </div>

                <Button type="primary" icon={<EditOutlined />} onClick={handleEditProfile}>
                  Edit Profile
                </Button>
              </Space>
            ) : (
              <Form form={profileForm} layout="vertical" onFinish={handleProfileSubmit}>
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

                <Form.Item
                  name="avatar"
                  label="Avatar"
                  rules={[{ required: true, message: "Please select an avatar." }]}
                >
                  <Radio.Group className="avatar-picker">
                    {AVATAR_OPTIONS.map((item) => (
                      <Radio.Button key={item.value} value={item.value}>
                        <Space>
                          <span className={`mini-avatar avatar-${item.value}`}>
                            <UserOutlined />
                          </span>
                          {item.label}
                        </Space>
                      </Radio.Button>
                    ))}
                  </Radio.Group>
                </Form.Item>

                <Space>
                  <Button type="primary" htmlType="submit" loading={savingProfile}>
                    Save Changes
                  </Button>

                  <Button onClick={handleCancelEdit}>Cancel</Button>
                </Space>
              </Form>
            )}
          </Card>

          {currentUser?.role !== "admin" && (
            <Card title="Account Actions" className="account-action-card" variant="borderless">
              <Space direction="vertical" size={12} style={{ width: "100%" }}>
                <Text type="secondary">
                  Deactivating your account will log you out and stop this account from logging in
                  again.
                </Text>

                <Popconfirm
                  title="Deactivate this account?"
                  description="This action will disable your account."
                  okText="Deactivate"
                  cancelText="Cancel"
                  okButtonProps={{ danger: true, loading: deactivating }}
                  onConfirm={handleDeactivate}
                >
                  <Button danger icon={<DeleteOutlined />}>
                    Deactivate Account
                  </Button>
                </Popconfirm>
              </Space>
            </Card>
          )}
        </Space>
      </Col>
    </Row>
  );
};

export default ProfilePanel;
