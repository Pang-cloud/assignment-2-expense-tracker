import React from 'react';
import { Table, Tag, Empty } from 'antd';

const CATEGORY_COLORS = {
  Food: 'orange', Transport: 'blue', Shopping: 'purple',
  Entertainment: 'magenta', Health: 'green', Education: 'cyan',
  Utilities: 'gold', Other: 'default',
};

// Displays total spending grouped by category with percentage share
const CategorySummary = ({ expenses }) => {
  if (expenses.length === 0) {
    return <Empty description="No expenses recorded yet." />;
  }

  // Aggregate totals per category
  const totalAmount = expenses.reduce((sum, item) => sum + (item.amount || 0), 0);
  const map = expenses.reduce((acc, item) => {
    const cat = item.category || 'Uncategorized';
    if (!acc[cat]) acc[cat] = { count: 0, total: 0 };
    acc[cat].count += 1;
    acc[cat].total += item.amount || 0;
    return acc;
  }, {});

  const data = Object.entries(map)
    .map(([category, { count, total }]) => ({
      category,
      count,
      total,
    }))
    .sort((a, b) => b.total - a.total);

  const columns = [
    {
      title: 'Category',
      dataIndex: 'category',
      key: 'category',
      render: (cat) => <Tag color={CATEGORY_COLORS[cat] || 'default'}>{cat}</Tag>,
    },
    { title: 'Items', dataIndex: 'count', key: 'count' },
    {
      title: 'Total Amount',
      dataIndex: 'total',
      key: 'total',
      render: (val) => `$${val.toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
    },
  ];

  return (
    <Table
      dataSource={data}
      columns={columns}
      rowKey="category"
      pagination={false}
      summary={() => (
        <Table.Summary.Row>
          <Table.Summary.Cell><strong>Total</strong></Table.Summary.Cell>
          <Table.Summary.Cell>{expenses.length}</Table.Summary.Cell>
          <Table.Summary.Cell>
            <strong>${totalAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}</strong>
          </Table.Summary.Cell>
        </Table.Summary.Row>
      )}
    />
  );
};

export default CategorySummary;
