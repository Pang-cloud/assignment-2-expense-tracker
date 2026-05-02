import React from 'react';
import { Table, Empty } from 'antd';

// Displays total spending grouped by month in descending order
const MonthlyTrend = ({ expenses }) => {
  if (expenses.length === 0) {
    return <Empty description="No expenses recorded yet." />;
  }

  // Aggregate totals per year-month (YYYY-MM)
  const map = expenses.reduce((acc, item) => {
    if (!item.date) return acc;
    const month = item.date.substring(0, 7);
    if (!acc[month]) acc[month] = { count: 0, total: 0 };
    acc[month].count += 1;
    acc[month].total += item.amount || 0;
    return acc;
  }, {});

  const data = Object.entries(map)
    .map(([month, { count, total }]) => ({ month, count, total }))
    .sort((a, b) => b.month.localeCompare(a.month)); // Most recent month first

  const columns = [
    {
      title: 'Month',
      dataIndex: 'month',
      key: 'month',
      render: (val) => {
        const [year, month] = val.split('-');
        return new Date(year, month - 1).toLocaleString('en-US', { month: 'long', year: 'numeric' });
      },
    },
    { title: 'Transactions', dataIndex: 'count', key: 'count' },
    {
      title: 'Total Spent',
      dataIndex: 'total',
      key: 'total',
      render: (val) => `$${val.toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
    },
  ];

  return (
    <Table
      dataSource={data}
      columns={columns}
      rowKey="month"
      pagination={false}
    />
  );
};

export default MonthlyTrend;
