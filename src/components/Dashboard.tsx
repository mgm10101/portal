import React, { useState, useEffect } from 'react';
import { Users, DollarSign, Star, TrendingUp, AlertCircle, Calendar, TrendingDown, Clock, ArrowUpRight, HandCoins, BarChart3, ThumbsUp, ThumbsDown } from 'lucide-react';
import { supabase } from '../supabaseClient';
import { fetchInvoices } from '../services/financialService';
import { fetchExpenses } from '../services/expenseService';
import { Expense } from '../types/database';

interface DashboardProps {
  onSectionChange?: (section: string) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ onSectionChange }) => {
  const [studentCount, setStudentCount] = useState<number>(0);
  const [isLoadingCount, setIsLoadingCount] = useState(true);
  const [outstandingFees, setOutstandingFees] = useState<number>(0);
  const [totalReceivables, setTotalReceivables] = useState<number>(0);
  const [isLoadingFees, setIsLoadingFees] = useState(true);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [isLoadingExpenses, setIsLoadingExpenses] = useState(true);

  // Fetch total student count from database (Active students only)
  useEffect(() => {
    const fetchStudentCount = async () => {
      try {
        const { count, error } = await supabase
          .from('students')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'Active'); // Only count active students
        
        if (error) throw error;
        setStudentCount(count || 0);
      } catch (error) {
        console.error('Error fetching student count:', error);
        setStudentCount(0);
      } finally {
        setIsLoadingCount(false);
      }
    };

    fetchStudentCount();
  }, []);

  // Fetch invoices and calculate outstanding fees and total receivables
  useEffect(() => {
    const fetchInvoiceData = async () => {
      setIsLoadingFees(true);
      try {
        const invoices = await fetchInvoices();
        
        // Exclude Forwarded invoices from all calculations
        const nonForwardedInvoices = invoices.filter(i => i.status !== 'Forwarded');
        
        // Calculate Total Receivables as sum of all non-forwarded invoices' totalAmount
        // Only include invoices with due date within current year
        const currentYear = new Date().getFullYear();
        const totalRec = nonForwardedInvoices
          .filter(invoice => {
            if (!invoice.due_date) return false; // Exclude invoices without due date
            const dueYear = new Date(invoice.due_date).getFullYear();
            return dueYear === currentYear;
          })
          .reduce((sum, invoice) => sum + invoice.totalAmount, 0);
        setTotalReceivables(totalRec);
        
        // Calculate Outstanding Fees (Pending invoices' balanceDue, excluding Forwarded)
        const outstanding = nonForwardedInvoices
          .filter(i => i.status === 'Pending')
          .reduce((sum, invoice) => sum + invoice.balanceDue, 0);
        setOutstandingFees(outstanding);
      } catch (error) {
        console.error('Error fetching invoice data:', error);
        setOutstandingFees(0);
        setTotalReceivables(0);
      } finally {
        setIsLoadingFees(false);
      }
    };

    fetchInvoiceData();
  }, []);

  // Fetch expenses for weekly spending calculation
  useEffect(() => {
    const loadExpenses = async () => {
      setIsLoadingExpenses(true);
      try {
        const expensesData = await fetchExpenses();
        // Filter out voided expenses
        setExpenses(expensesData.filter(e => !e.is_voided));
      } catch (error) {
        console.error('Error fetching expenses:', error);
        setExpenses([]);
      } finally {
        setIsLoadingExpenses(false);
      }
    };

    loadExpenses();
  }, []);

  // Calculate percentage for outstanding fees
  const outstandingFeesPercentage = totalReceivables > 0 
    ? (outstandingFees / totalReceivables) * 100 
    : 0;
  
  const isOutstandingFeesHigh = outstandingFeesPercentage >= 20;
  
  const formatCurrency = (amount: number) => {
    return amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const stats = [
    {
      title: 'Total Students',
      value: isLoadingCount ? '...' : studentCount.toString(),
      change: '+12 from last year',
      changeType: 'positive',
      icon: Users,
      color: 'blue'
    },
    {
      title: 'Overdue Tasks',
      value: '7',
      change: 'see more',
      changeType: 'negative',
      icon: AlertCircle,
      color: 'red',
      clickable: true,
      navigateTo: 'tasks'
    },
    {
      title: 'Outstanding Fees',
      value: isLoadingFees ? '...' : `Ksh ${formatCurrency(outstandingFees)}`,
      change: isLoadingFees ? '...' : `${outstandingFeesPercentage.toFixed(1)}% of total receivables`,
      changeType: isOutstandingFeesHigh ? 'negative' : 'positive',
      showDownArrow: true,
      icon: DollarSign,
      changeIcon: isOutstandingFeesHigh ? ThumbsDown : ThumbsUp,
      color: isOutstandingFeesHigh ? 'red' : 'green'
    }
  ];

  const upcomingEvent = {
    title: 'Upcoming Event',
    eventName: 'Staff Meeting',
    date: 'Nov 28, 2025',
    timeRange: '2:00 PM - 4:00 PM',
    daysUntil: 7,
    icon: Calendar,
    color: 'purple'
  };

  // Calculate weekly spending data for past 4 weeks from real expense data
  const calculateWeeklySpending = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Get the start of the current week (Sunday)
    const currentWeekStart = new Date(today);
    currentWeekStart.setDate(today.getDate() - today.getDay());
    currentWeekStart.setHours(0, 0, 0, 0);
    
    const weeks = [];
    
    // Calculate spending for each of the past 4 weeks
    for (let i = 3; i >= 0; i--) {
      const weekStart = new Date(currentWeekStart);
      weekStart.setDate(currentWeekStart.getDate() - (i * 7));
      
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);
      weekEnd.setHours(23, 59, 59, 999);
      
      // Filter expenses for this week
      const weekExpenses = expenses.filter(expense => {
        const expenseDate = new Date(expense.expense_date);
        expenseDate.setHours(0, 0, 0, 0);
        return expenseDate >= weekStart && expenseDate <= weekEnd;
      });
      
      // Sum up the amounts for this week
      const weekAmount = weekExpenses.reduce((sum, expense) => sum + expense.amount, 0);
      
      // Determine label
      let label = '';
      if (i === 0) {
        label = 'This week';
      } else if (i === 1) {
        label = 'Last week';
      } else if (i === 2) {
        label = '2 weeks ago';
      } else {
        label = '3 weeks ago';
      }
      
      weeks.push({
        week: `Week ${4 - i}`,
        amount: weekAmount,
        label: label
      });
    }
    
    return weeks;
  };

  const weeklySpending = isLoadingExpenses 
    ? [
        { week: 'Week 1', amount: 0, label: '3 weeks ago' },
        { week: 'Week 2', amount: 0, label: '2 weeks ago' },
        { week: 'Week 3', amount: 0, label: 'Last week' },
        { week: 'Week 4', amount: 0, label: 'This week' }
      ]
    : calculateWeeklySpending();

  // Find max amount for scaling the bars (ensure at least 1 to avoid division by zero)
  const maxAmount = Math.max(1, ...weeklySpending.map(w => w.amount));
  
  // Check if all values are zero
  const allValuesZero = weeklySpending.every(w => w.amount === 0);

  // Colorful but harmonious color palette (4 colors)
  const barColors = [
    { from: 'from-blue-500', to: 'to-blue-400', hoverFrom: 'hover:from-blue-600', hoverTo: 'hover:to-blue-500' },
    { from: 'from-purple-500', to: 'to-purple-400', hoverFrom: 'hover:from-purple-600', hoverTo: 'hover:to-purple-500' },
    { from: 'from-orange-500', to: 'to-orange-400', hoverFrom: 'hover:from-orange-600', hoverTo: 'hover:to-orange-500' },
    { from: 'from-emerald-500', to: 'to-emerald-400', hoverFrom: 'hover:from-emerald-600', hoverTo: 'hover:to-emerald-500' }
  ];

  // Generate y-axis labels
  const generateYAxisLabels = () => {
    // When all values are zero, use fixed labels: 1000, 800, 600, 400, 200, 0
    if (allValuesZero) {
      return [1000, 800, 600, 400, 200, 0];
    }
    
    // Otherwise, generate labels based on maxAmount
    const labels = [];
    const steps = 5; // 5 horizontal lines
    for (let i = 0; i <= steps; i++) {
      const value = Math.round((maxAmount / steps) * (steps - i));
      labels.push(value);
    }
    return labels;
  };

  const yAxisLabels = generateYAxisLabels();
  
  // Use fixed max for scaling when all values are zero (for grid lines)
  const scaleMaxAmount = allValuesZero ? 1000 : maxAmount;

  const scheduledTasks = [
    {
      task: 'Generate Q1 financial report',
      dueDate: 'Feb 15, 2024',
      priority: 'high',
      status: 'in progress',
      assignedTo: 'John Kamau'
    },
    {
      task: 'Process monthly payroll',
      dueDate: 'Feb 28, 2024',
      priority: 'medium',
      status: 'pending',
      assignedTo: 'Sarah Wanjiku'
    },
    {
      task: 'Update student records',
      dueDate: 'Mar 5, 2024',
      priority: 'low',
      status: 'approved',
      assignedTo: 'David Omondi'
    },
    {
      task: 'Review behavioral reports',
      dueDate: 'Mar 10, 2024',
      priority: 'medium',
      status: 'completed',
      assignedTo: 'Mary Njeri'
    },
    {
      task: 'Schedule parent-teacher meetings',
      dueDate: 'Mar 15, 2024',
      priority: 'high',
      status: 'pending',
      assignedTo: 'Grace Muthoni'
    },
    {
      task: 'Order science lab equipment',
      dueDate: 'Mar 20, 2024',
      priority: 'medium',
      status: 'approved',
      assignedTo: 'Peter Otieno'
    },
    {
      task: 'Update curriculum materials',
      dueDate: 'Mar 25, 2024',
      priority: 'low',
      status: 'in progress',
      assignedTo: 'Anne Wangari'
    },
    {
      task: 'Organize sports day event',
      dueDate: 'Apr 1, 2024',
      priority: 'high',
      status: 'pending',
      assignedTo: 'James Kipchoge'
    },
    {
      task: 'Review library book inventory',
      dueDate: 'Apr 5, 2024',
      priority: 'low',
      status: 'approved',
      assignedTo: 'Lucy Akinyi'
    },
    {
      task: 'Conduct staff training session',
      dueDate: 'Apr 10, 2024',
      priority: 'high',
      status: 'completed',
      assignedTo: 'Michael Ochieng'
    }
  ];

  const StatCard = ({ stat }: { stat: any }) => {
    const handleClick = () => {
      if (stat.clickable && stat.navigateTo && onSectionChange) {
        onSectionChange(stat.navigateTo);
      }
    };

    return (
      <div className="bg-white p-6 md:p-4 rounded-lg shadow-sm border border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600 mb-1">{stat.title}</p>
            <p className="text-2xl font-normal text-gray-800">{stat.value}</p>
            {stat.clickable ? (
              <button
                onClick={handleClick}
                className={`flex items-center mt-2 text-sm ${
                  stat.changeType === 'positive' ? 'text-green-600' : 'text-red-600'
                } hover:underline cursor-pointer`}
              >
                {stat.change}
                <ArrowUpRight className="w-4 h-4 ml-1" />
              </button>
            ) : (
              <div className={`flex items-center mt-2 text-sm ${
                stat.changeType === 'positive' ? 'text-green-600' : 'text-red-600'
              }`}>
                {stat.changeIcon ? (
                  <stat.changeIcon className="w-4 h-4 mr-1" />
                ) : (
                  <TrendingUp className={`w-4 h-4 mr-1 ${
                    stat.showDownArrow || stat.changeType === 'negative' ? 'rotate-180' : ''
                  }`} />
                )}
                {stat.change}
              </div>
            )}
          </div>
          <div className={`p-3 rounded-full bg-${stat.color}-100`}>
            <stat.icon className={`w-6 h-6 text-${stat.color}-600`} />
          </div>
        </div>
      </div>
    );
  };

  const UpcomingEventCard = ({ event }: { event: any }) => (
    <div className="bg-white p-6 md:p-4 rounded-lg shadow-sm border border-gray-200">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm text-gray-600 mb-1">{event.title}</p>
          <p className="text-xl font-normal text-gray-800 mb-2">{event.eventName}</p>
          <div className="flex items-center mt-2 text-sm text-purple-600">
            <Clock className="w-3 h-3 mr-1" />
            <span>{event.daysUntil} days to go</span>
          </div>
        </div>
        <div className={`p-3 rounded-full bg-${event.color}-100`}>
          <event.icon className={`w-6 h-6 text-${event.color}-600`} />
        </div>
      </div>
    </div>
  );

  return (
    <div className="p-6 md:p-3 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-3 mb-8 md:mb-4">
          <StatCard stat={stats[0]} />
          <StatCard stat={stats[2]} />
          <UpcomingEventCard event={upcomingEvent} />
          <StatCard stat={stats[1]} />
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-3 mb-8 md:mb-4">
          {/* Weekly Spending */}
          <div className="lg:col-span-7 bg-white rounded-lg shadow-sm border border-gray-200 pl-6 pr-12 py-6 md:pl-4 md:pr-8 md:py-4">
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-800">Weekly Spending</h3>
            </div>
            <div className="overflow-x-auto">
              <div className="flex items-stretch h-64" style={{ minWidth: '500px' }}>
                {/* Y-axis labels */}
                <div className="flex flex-col justify-between pr-8 relative" style={{ paddingBottom: '2rem', height: '100%' }}>
                {/* Vertical line for y-axis - extends to x-axis */}
                <div className="absolute right-0 top-0 w-px bg-gray-300" style={{ height: 'calc(100% - 2rem)' }}></div>
                {yAxisLabels.map((label, index) => (
                  <div 
                    key={index} 
                    className="text-xs text-gray-500 font-medium whitespace-nowrap"
                    style={{ 
                      marginTop: index === 0 ? '0' : 'auto',
                      marginBottom: index === yAxisLabels.length - 1 ? '0' : 'auto'
                    }}
                  >
                    Ksh {label.toLocaleString()}
                  </div>
                ))}
                {/* X-axis line starting from y-axis at zero level */}
                <div className="absolute bottom-8 right-0 w-full border-b border-gray-300"></div>
              </div>

              {/* Chart area with bars */}
              <div className="flex-1 relative">
                {/* X-axis line extending from y-axis */}
                <div className="absolute bottom-8 left-0 right-0 border-b border-gray-300"></div>

                {/* Y-axis grid lines */}
                <div className="absolute top-0 bottom-8 left-0 right-0">
                  {yAxisLabels.map((label, index) => (
                    <div
                      key={index}
                      className="absolute left-0 right-0 border-t border-gray-200"
                      style={{ bottom: `${(label / scaleMaxAmount) * 100}%` }}
                    />
                  ))}
                </div>

                {/* Bars container with left padding for spacing from y-axis - bars aligned to x-axis at bottom */}
                <div className="flex items-end justify-between gap-8 pl-4 absolute bottom-8 left-0 right-0" style={{ height: 'calc(100% - 2.5rem)' }}>
                  {weeklySpending.map((week, index) => {
                    const barHeight = (week.amount / scaleMaxAmount) * 100;
                    const colors = barColors[index % barColors.length];
                    return (
                      <div key={index} className="flex-1 flex flex-col items-center h-full relative z-10">
                        <div className="w-full h-full flex items-end justify-center relative group">
                          <div
                            className={`bg-gradient-to-t ${colors.from} ${colors.to} ${colors.hoverFrom} ${colors.hoverTo} rounded-t-lg transition-all duration-300 hover:shadow-md cursor-pointer relative bar-element`}
                            style={{ height: `${barHeight}%`, width: '50%', minHeight: '8px' }}
                            onMouseEnter={(e) => {
                              const tooltip = e.currentTarget.querySelector('.bar-tooltip') as HTMLElement;
                              if (tooltip) {
                                const rect = e.currentTarget.getBoundingClientRect();
                                tooltip.style.left = `${rect.left + rect.width / 2}px`;
                                tooltip.style.top = `${rect.top - 8}px`;
                              }
                            }}
                          >
                            <div className="bar-tooltip fixed bg-gray-900 text-white text-xs font-medium px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none" style={{ zIndex: 9999, transform: 'translate(-50%, -100%)' }}>
                              Ksh {week.amount.toLocaleString()}
                              <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-full">
                                <div className="border-4 border-transparent border-t-gray-900"></div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* X-axis labels below the x-axis line */}
                <div className="absolute bottom-0 left-0 right-0 flex items-start justify-between gap-8 pl-4 pt-2">
                  {weeklySpending.map((week, index) => (
                    <div key={index} className="flex-1 text-center">
                      <p className="text-xs text-gray-500">{week.label}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            </div>
          </div>

          {/* Scheduled Tasks */}
          <div className="lg:col-span-5 bg-white rounded-lg shadow-sm border border-gray-200 p-6 md:p-4 flex flex-col" style={{ height: '400px' }}>
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Scheduled Tasks</h3>
            <div className="space-y-3 overflow-y-auto pr-2" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
              <style>
                {`
                  .space-y-3::-webkit-scrollbar {
                    display: none;
                  }
                `}
              </style>
              {scheduledTasks.map((task, index) => (
                <div key={index} className="border-l-4 border-blue-500 pl-4 py-2">
                  <div className="flex items-start justify-between mb-2">
                    <p className="text-sm font-medium text-gray-800 flex-1">{task.task}</p>
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full whitespace-nowrap ml-2 ${
                      task.status === 'completed' 
                        ? 'bg-green-100 text-green-800'
                        : task.status === 'in progress'
                        ? 'bg-blue-100 text-blue-800'
                        : task.status === 'approved'
                        ? 'bg-purple-100 text-purple-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {task.status}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center text-gray-500">
                      <Clock className="w-3 h-3 mr-1" />
                      <span>{task.dueDate}</span>
                    </div>
                    <p className="text-gray-600">
                      <span className="text-gray-400">Assigned to:</span> <span className="font-medium">{task.assignedTo}</span>
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 md:p-4">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Quick Actions</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <button 
              onClick={() => onSectionChange && onSectionChange('expenses')}
              className="p-4 border border-gray-200 rounded-lg hover:bg-red-50 hover:border-red-300 transition-colors cursor-pointer"
            >
              <TrendingDown className="w-6 h-6 text-red-600 mx-auto mb-2" />
              <span className="text-sm text-gray-700">Record Expense</span>
            </button>
            <button 
              onClick={() => onSectionChange && onSectionChange('invoices')}
              className="p-4 border border-gray-200 rounded-lg hover:bg-green-50 hover:border-green-300 transition-colors cursor-pointer"
            >
              <DollarSign className="w-6 h-6 text-green-600 mx-auto mb-2" />
              <span className="text-sm text-gray-700">Create Invoice</span>
            </button>
            <button 
              onClick={() => onSectionChange && onSectionChange('payroll')}
              className="p-4 border border-gray-200 rounded-lg hover:bg-blue-50 hover:border-blue-300 transition-colors cursor-pointer"
            >
              <HandCoins className="w-6 h-6 text-blue-600 mx-auto mb-2" />
              <span className="text-sm text-gray-700">Process Payroll</span>
            </button>
            <button 
              onClick={() => onSectionChange && onSectionChange('reports')}
              className="p-4 border border-gray-200 rounded-lg hover:bg-purple-50 hover:border-purple-300 transition-colors cursor-pointer"
            >
              <BarChart3 className="w-6 h-6 text-purple-600 mx-auto mb-2" />
              <span className="text-sm text-gray-700">Generate Report</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};