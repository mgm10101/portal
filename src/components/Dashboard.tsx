import React from 'react';
import { Users, DollarSign, Star, TrendingUp, AlertCircle, Calendar } from 'lucide-react';

export const Dashboard: React.FC = () => {
  const stats = [
    {
      title: 'Total Students',
      value: '342',
      change: '+12',
      changeType: 'positive',
      icon: Users,
      color: 'blue'
    },
    {
      title: 'Monthly Revenue',
      value: '$38,500',
      change: '+8%',
      changeType: 'positive',
      icon: DollarSign,
      color: 'green'
    },
    {
      title: 'Average Behavior',
      value: '4.2/5',
      change: '+0.3',
      changeType: 'positive',
      icon: Star,
      color: 'yellow'
    },
    {
      title: 'Outstanding Fees',
      value: '$25,840',
      change: '-5%',
      changeType: 'negative',
      icon: AlertCircle,
      color: 'red'
    }
  ];

  const recentActivities = [
    {
      type: 'payment',
      message: 'Payment received from John Smith - $1,200',
      time: '2 hours ago',
      icon: DollarSign,
      color: 'text-green-600 bg-green-100'
    },
    {
      type: 'incident',
      message: 'Behavioral incident recorded - Michael Davis',
      time: '4 hours ago',
      icon: AlertCircle,
      color: 'text-red-600 bg-red-100'
    },
    {
      type: 'enrollment',
      message: 'New student enrolled - Sarah Wilson',
      time: '1 day ago',
      icon: Users,
      color: 'text-blue-600 bg-blue-100'
    },
    {
      type: 'invoice',
      message: 'Invoice created for Grade 10 students',
      time: '2 days ago',
      icon: Calendar,
      color: 'text-purple-600 bg-purple-100'
    }
  ];

  const upcomingTasks = [
    {
      task: 'Generate Q1 financial report',
      dueDate: 'Feb 15, 2024',
      priority: 'high'
    },
    {
      task: 'Process monthly payroll',
      dueDate: 'Feb 28, 2024',
      priority: 'medium'
    },
    {
      task: 'Update student records',
      dueDate: 'Mar 5, 2024',
      priority: 'low'
    },
    {
      task: 'Review behavioral reports',
      dueDate: 'Mar 10, 2024',
      priority: 'medium'
    }
  ];

  const StatCard = ({ stat }: { stat: any }) => (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-600 mb-1">{stat.title}</p>
          <p className="text-2xl font-bold text-gray-800">{stat.value}</p>
          <div className={`flex items-center mt-2 text-sm ${
            stat.changeType === 'positive' ? 'text-green-600' : 'text-red-600'
          }`}>
            <TrendingUp className={`w-4 h-4 mr-1 ${
              stat.changeType === 'positive' ? '' : 'rotate-180'
            }`} />
            {stat.change}
          </div>
        </div>
        <div className={`p-3 rounded-full bg-${stat.color}-100`}>
          <stat.icon className={`w-6 h-6 text-${stat.color}-600`} />
        </div>
      </div>
    </div>
  );

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Dashboard</h1>
          <p className="text-gray-600">Welcome back! Here's what's happening at your school.</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat, index) => (
            <StatCard key={index} stat={stat} />
          ))}
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Recent Activity */}
          <div className="lg:col-span-2 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Recent Activity</h3>
            <div className="space-y-4">
              {recentActivities.map((activity, index) => (
                <div key={index} className="flex items-center">
                  <div className={`p-2 rounded-full ${activity.color} mr-4`}>
                    <activity.icon className="w-4 h-4" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-800">{activity.message}</p>
                    <p className="text-xs text-gray-500">{activity.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Upcoming Tasks */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Upcoming Tasks</h3>
            <div className="space-y-3">
              {upcomingTasks.map((task, index) => (
                <div key={index} className="border-l-4 border-blue-500 pl-4 py-2">
                  <p className="text-sm font-medium text-gray-800">{task.task}</p>
                  <div className="flex items-center justify-between mt-1">
                    <p className="text-xs text-gray-500">{task.dueDate}</p>
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                      task.priority === 'high' 
                        ? 'bg-red-100 text-red-800'
                        : task.priority === 'medium'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-green-100 text-green-800'
                    }`}>
                      {task.priority}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Quick Actions</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <button className="p-4 border border-gray-200 rounded-lg hover:bg-blue-50 hover:border-blue-300 transition-colors">
              <Users className="w-6 h-6 text-blue-600 mx-auto mb-2" />
              <span className="text-sm text-gray-700">Add Student</span>
            </button>
            <button className="p-4 border border-gray-200 rounded-lg hover:bg-green-50 hover:border-green-300 transition-colors">
              <DollarSign className="w-6 h-6 text-green-600 mx-auto mb-2" />
              <span className="text-sm text-gray-700">Create Invoice</span>
            </button>
            <button className="p-4 border border-gray-200 rounded-lg hover:bg-yellow-50 hover:border-yellow-300 transition-colors">
              <Star className="w-6 h-6 text-yellow-600 mx-auto mb-2" />
              <span className="text-sm text-gray-700">Record Behavior</span>
            </button>
            <button className="p-4 border border-gray-200 rounded-lg hover:bg-purple-50 hover:border-purple-300 transition-colors">
              <TrendingUp className="w-6 h-6 text-purple-600 mx-auto mb-2" />
              <span className="text-sm text-gray-700">Generate Report</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};