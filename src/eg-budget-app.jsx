import React, { useState, useEffect, useCallback } from 'react';
import { PlusCircle, TrendingUp, TrendingDown, CreditCard, Users, Calendar, Trash2, DollarSign, Target } from 'lucide-react';

// Utility function to generate unique IDs
const generateId = () => `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

const EGBudgetApp = () => {
  const [currentMonth, setCurrentMonth] = useState(new Date().toISOString().slice(0, 7));
  const [members, setMembers] = useState([]);
  const [categories, setCategories] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [debts, setDebts] = useState([]);
  const [monthlyIncomes, setMonthlyIncomes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAnalytics, setShowAnalytics] = useState(false);
  
  // Modal states
  const [showMemberModal, setShowMemberModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showTransactionModal, setShowTransactionModal] = useState(false);
  const [showDebtModal, setShowDebtModal] = useState(false);
  const [showIncomeModal, setShowIncomeModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  
  // Form states
  const [newMember, setNewMember] = useState({ name: '' });
  const [editingIncome, setEditingIncome] = useState({ memberId: '', amount: '' });
  const [newCategory, setNewCategory] = useState({ name: '', budget: '', type: 'expense', memberIds: [], isHousehold: true });
  const [newTransaction, setNewTransaction] = useState({ 
    categoryId: '', 
    amount: '', 
    description: '', 
    memberIds: [],
    isJoint: true,
    date: new Date().toISOString().slice(0, 10)
  });
  const [selectedMemberFilter, setSelectedMemberFilter] = useState('');
  const [newDebt, setNewDebt] = useState({ 
    name: '', 
    balance: '', 
    payment: '', 
    memberIds: [],
    isJoint: true,
    type: 'credit-card'
  });

  // Load data from storage
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const membersData = localStorage.getItem('eg-budget-members');
      const categoriesData = localStorage.getItem('eg-budget-categories');
      const transactionsData = localStorage.getItem('eg-budget-transactions');
      const debtsData = localStorage.getItem('eg-budget-debts');
      const incomesData = localStorage.getItem('eg-budget-incomes');

      if (membersData) setMembers(JSON.parse(membersData));
      if (categoriesData) setCategories(JSON.parse(categoriesData));
      if (transactionsData) setTransactions(JSON.parse(transactionsData));
      if (debtsData) setDebts(JSON.parse(debtsData));
      if (incomesData) setMonthlyIncomes(JSON.parse(incomesData));
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveData = useCallback(async () => {
    try {
      localStorage.setItem('eg-budget-members', JSON.stringify(members));
      localStorage.setItem('eg-budget-categories', JSON.stringify(categories));
      localStorage.setItem('eg-budget-transactions', JSON.stringify(transactions));
      localStorage.setItem('eg-budget-debts', JSON.stringify(debts));
      localStorage.setItem('eg-budget-incomes', JSON.stringify(monthlyIncomes));
    } catch (error) {
      console.error('Error saving data:', error);
    }
  }, [members, categories, transactions, debts, monthlyIncomes]);

  // Save data whenever it changes
  useEffect(() => {
    if (!isLoading) {
      saveData();
    }
  }, [isLoading, saveData]);

  // Member operations
  const addMember = () => {
    if (newMember.name) {
      setMembers([...members, { 
        id: generateId(), 
        name: newMember.name
      }]);
      setNewMember({ name: '' });
      setShowMemberModal(false);
    }
  };

  const deleteMember = (id) => {
    setMembers(members.filter(m => m.id !== id));
  };

  // Income operations
  const getMemberIncome = (memberId) => {
    const income = monthlyIncomes.find(i => i.memberId === memberId && i.month === currentMonth);
    return income ? income.amount : 0;
  };

  const updateIncome = () => {
    if (editingIncome.memberId && editingIncome.amount) {
      const existingIndex = monthlyIncomes.findIndex(
        i => i.memberId === editingIncome.memberId && i.month === currentMonth
      );
      
      if (existingIndex >= 0) {
        const updated = [...monthlyIncomes];
        updated[existingIndex] = {
          ...updated[existingIndex],
          amount: parseFloat(editingIncome.amount)
        };
        setMonthlyIncomes(updated);
      } else {
        setMonthlyIncomes([...monthlyIncomes, {
          id: generateId(),
          memberId: editingIncome.memberId,
          month: currentMonth,
          amount: parseFloat(editingIncome.amount)
        }]);
      }
      
      setEditingIncome({ memberId: '', amount: '' });
      setShowIncomeModal(false);
    }
  };

  const openIncomeModal = (memberId) => {
    const currentIncome = getMemberIncome(memberId);
    setEditingIncome({ memberId, amount: currentIncome || '' });
    setShowIncomeModal(true);
  };

  // Category operations
  const addCategory = () => {
    if (newCategory.name && newCategory.budget) {
      if (editingCategory) {
        // Update existing category
        setCategories(categories.map(cat => 
          cat.id === editingCategory.id 
            ? { 
                ...cat,
                name: newCategory.name, 
                budget: parseFloat(newCategory.budget),
                type: newCategory.type,
                memberIds: newCategory.memberIds,
                isHousehold: newCategory.isHousehold
              }
            : cat
        ));
        setEditingCategory(null);
      } else {
        // Add new category
        setCategories([...categories, { 
          id: generateId(), 
          name: newCategory.name, 
          budget: parseFloat(newCategory.budget),
          type: newCategory.type,
          memberIds: newCategory.memberIds,
          isHousehold: newCategory.isHousehold
        }]);
      }
      setNewCategory({ name: '', budget: '', type: 'expense', memberIds: [], isHousehold: true });
      setShowCategoryModal(false);
    }
  };

  const openEditCategory = (category) => {
    setEditingCategory(category);
    setNewCategory({
      name: category.name,
      budget: category.budget.toString(),
      type: category.type,
      memberIds: category.memberIds || [],
      isHousehold: category.isHousehold || false
    });
    setShowCategoryModal(true);
  };

  const deleteCategory = (id) => {
    setCategories(categories.filter(c => c.id !== id));
  };

  const toggleCategoryMemberSelection = (memberId) => {
    const currentIds = newCategory.memberIds || [];
    if (currentIds.includes(memberId)) {
      const newIds = currentIds.filter(id => id !== memberId);
      setNewCategory({
        ...newCategory,
        memberIds: newIds,
        isHousehold: newIds.length === 0 || newIds.length === members.length
      });
    } else {
      const newIds = [...currentIds, memberId];
      setNewCategory({
        ...newCategory,
        memberIds: newIds,
        isHousehold: newIds.length === members.length
      });
    }
  };

  const setAllCategoryMembers = () => {
    setNewCategory({
      ...newCategory,
      memberIds: members.map(m => m.id),
      isHousehold: true
    });
  };

  // Transaction operations
  const addTransaction = () => {
    if (newTransaction.categoryId && newTransaction.amount && newTransaction.memberIds.length > 0) {
      // If it's from a joint card, assign to all members
      const finalMemberIds = newTransaction.isFromJointCard 
        ? members.map(m => m.id) 
        : newTransaction.memberIds;
      
      setTransactions([...transactions, {
        id: generateId(),
        categoryId: newTransaction.categoryId,
        amount: parseFloat(newTransaction.amount),
        description: newTransaction.description,
        memberIds: finalMemberIds,
        isJoint: finalMemberIds.length > 1,
        isFromJointCard: newTransaction.isFromJointCard || false,
        date: newTransaction.date,
        month: newTransaction.date.slice(0, 7)
      }]);
      setNewTransaction({ 
        categoryId: '', 
        amount: '', 
        description: '', 
        memberIds: [],
        isJoint: true,
        isFromJointCard: false,
        date: new Date().toISOString().slice(0, 10)
      });
      setShowTransactionModal(false);
      setSelectedMemberFilter('');
    }
  };

  const deleteTransaction = (id) => {
    setTransactions(transactions.filter(t => t.id !== id));
  };

  // Debt operations
  const addDebt = () => {
    if (newDebt.name && newDebt.balance && newDebt.payment && newDebt.memberIds.length > 0) {
      setDebts([...debts, {
        id: generateId(),
        name: newDebt.name,
        balance: parseFloat(newDebt.balance),
        payment: parseFloat(newDebt.payment),
        memberIds: newDebt.memberIds,
        isJoint: newDebt.isJoint,
        type: newDebt.type
      }]);
      setNewDebt({ 
        name: '', 
        balance: '', 
        payment: '', 
        memberIds: [],
        isJoint: true,
        type: 'credit-card'
      });
      setShowDebtModal(false);
    }
  };

  const deleteDebt = (id) => {
    setDebts(debts.filter(d => d.id !== id));
    // Also remove any transactions for this debt
    setTransactions(transactions.filter(t => t.debtId !== id));
  };

  // Calculations
  const getTotalIncome = () => {
    return monthlyIncomes
      .filter(income => income.month === currentMonth)
      .reduce((sum, income) => sum + income.amount, 0);
  };

  const getTotalBudget = () => {
    const categoryBudget = categories.reduce((sum, cat) => sum + cat.budget, 0);
    const debtPayments = getTotalDebtPayments();
    return categoryBudget + debtPayments;
  };

  const getMonthTransactions = () => {
    return transactions.filter(t => t.month === currentMonth);
  };

  const getCategorySpending = (categoryId, memberId = null) => {
    const categoryTransactions = getMonthTransactions().filter(t => t.categoryId === categoryId);
    
    if (memberId) {
      // Get spending for a specific member
      return categoryTransactions
        .filter(t => t.memberIds.includes(memberId))
        .reduce((sum, t) => {
          // If transaction is split among multiple members, divide equally
          const splitCount = t.memberIds.length;
          return sum + (t.amount / splitCount);
        }, 0);
    }
    
    // Get total spending for category
    return categoryTransactions.reduce((sum, t) => sum + t.amount, 0);
  };

  const getTotalDebtPayments = () => {
    return debts.reduce((sum, debt) => sum + debt.payment, 0);
  };

  const getTotalSpending = () => {
    return getMonthTransactions().reduce((sum, t) => sum + t.amount, 0);
  };

  const getBudgetPerformance = (categoryId, spent, budgeted) => {
    const percentage = (spent / budgeted) * 100;
    return {
      percentage,
      status: percentage > 100 ? 'over' : percentage > 80 ? 'warning' : 'good'
    };
  };

  const getMemberTotalBudget = (memberId) => {
    const categoryBudget = categories
      .filter(cat => cat.memberIds && cat.memberIds.includes(memberId))
      .reduce((sum, cat) => {
        // If category is assigned to multiple members, split budget equally
        const splitCount = cat.memberIds.length;
        return sum + (cat.budget / splitCount);
      }, 0);
    
    const memberDebtPayments = debts
      .filter(debt => debt.memberIds && debt.memberIds.includes(memberId))
      .reduce((sum, debt) => {
        // If debt is assigned to multiple members, split payment equally
        const splitCount = debt.memberIds.length;
        return sum + (debt.payment / splitCount);
      }, 0);
    
    return categoryBudget + memberDebtPayments;
  };

  const getMemberTotalSpending = (memberId) => {
    const transactionSpending = getMonthTransactions()
      .filter(t => t.memberIds.includes(memberId))
      .reduce((sum, t) => {
        // Split transaction amount equally among assigned members
        const splitCount = t.memberIds.length;
        return sum + (t.amount / splitCount);
      }, 0);
    
    return transactionSpending;
  };

  const isDebtPaidThisMonth = (debtId) => {
    return transactions.some(t => t.debtId === debtId && t.month === currentMonth);
  };

  const toggleDebtPayment = (debtId) => {
    const debt = debts.find(d => d.id === debtId);
    if (!debt) return;

    const existingTransaction = transactions.find(
      t => t.debtId === debtId && t.month === currentMonth
    );

    if (existingTransaction) {
      // Remove the debt payment transaction
      setTransactions(transactions.filter(t => t.id !== existingTransaction.id));
    } else {
      // Create a debt payment transaction
      setTransactions([...transactions, {
        id: generateId(),
        categoryId: null, // No category for debt payments
        debtId: debtId,
        amount: debt.payment,
        description: `${debt.name} payment`,
        memberIds: debt.memberIds,
        isJoint: debt.isJoint,
        date: new Date(currentMonth + '-01').toISOString().slice(0, 10),
        month: currentMonth,
        isDebtPayment: true
      }]);
    }
  };

  const getFilteredCategories = () => {
    if (!selectedMemberFilter) {
      return [];
    }
    
    // Return categories that are either:
    // 1. Household categories (assigned to all members)
    // 2. Categories assigned to the selected member
    return categories.filter(cat => 
      cat.isHousehold || 
      (cat.memberIds && cat.memberIds.includes(selectedMemberFilter))
    );
  };

  const toggleDebtMemberSelection = (memberId) => {
    const currentIds = newDebt.memberIds || [];
    if (currentIds.includes(memberId)) {
      setNewDebt({
        ...newDebt,
        memberIds: currentIds.filter(id => id !== memberId),
        isJoint: currentIds.length - 1 > 1
      });
    } else {
      const newIds = [...currentIds, memberId];
      setNewDebt({
        ...newDebt,
        memberIds: newIds,
        isJoint: newIds.length > 1
      });
    }
  };

  if (isLoading) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        background: '#f5f5f5',
        fontFamily: 'system-ui, -apple-system, sans-serif'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ 
            width: '48px', 
            height: '48px', 
            border: '4px solid #e0e0e0',
            borderTopColor: '#2563eb',
            borderRadius: '50%',
            animation: 'spin 0.8s linear infinite',
            margin: '0 auto 16px'
          }}></div>
          <p style={{ fontSize: '15px', color: '#666', fontWeight: '500' }}>Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: '#f5f5f5',
      fontFamily: 'system-ui, -apple-system, "Segoe UI", sans-serif',
      color: '#1a1a1a',
      padding: '24px'
    }}>
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        .card {
          animation: fadeIn 0.3s ease-out;
        }
        
        button {
          transition: all 0.15s ease;
        }
        
        button:hover:not(:disabled) {
          transform: translateY(-1px);
        }
        
        button:active:not(:disabled) {
          transform: translateY(0);
        }
        
        .progress-bar {
          transition: width 0.5s ease;
        }
        
        input, select {
          transition: border-color 0.15s ease, box-shadow 0.15s ease;
        }
        
        input:focus, select:focus {
          outline: none;
          border-color: #2563eb;
          box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
        }
      `}</style>

      <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
        {/* Header */}
        <header style={{ 
          marginBottom: '32px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div>
            <h1 style={{ 
              fontSize: '28px',
              fontWeight: '700',
              margin: '0 0 4px 0',
              color: '#1a1a1a'
            }}>
              E&G Budget
            </h1>
            <p style={{ 
              fontSize: '14px', 
              color: '#666',
              margin: 0
            }}>
              Track your household finances
            </p>
          </div>
          
          {/* Month Selector */}
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '10px',
            background: '#fff',
            padding: '10px 16px',
            borderRadius: '8px',
            border: '1px solid #e0e0e0'
          }}>
            <Calendar size={18} color="#666" />
            <input
              type="month"
              value={currentMonth}
              onChange={(e) => setCurrentMonth(e.target.value)}
              style={{
                padding: '6px 10px',
                fontSize: '14px',
                background: '#f9f9f9',
                border: '1px solid #e0e0e0',
                borderRadius: '6px',
                color: '#1a1a1a',
                fontWeight: '500'
              }}
            />
          </div>
        </header>

        {/* Summary Stats */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: '16px',
          marginBottom: '32px'
        }}>
          <div className="card" style={{
            background: '#fff',
            border: '1px solid #e0e0e0',
            padding: '20px',
            borderRadius: '8px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
              <div style={{ 
                background: '#10b981',
                borderRadius: '8px',
                padding: '8px',
                display: 'flex'
              }}>
                <TrendingUp size={20} color="#fff" strokeWidth={2.5} />
              </div>
              <h3 style={{ 
                margin: 0, 
                fontSize: '13px',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                color: '#666',
                fontWeight: '600'
              }}>
                Income
              </h3>
            </div>
            <p style={{ 
              margin: 0, 
              fontSize: '28px', 
              fontWeight: '700',
              color: '#1a1a1a'
            }}>
              ${getTotalIncome().toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
          </div>

          <div className="card" style={{
            background: '#fff',
            border: '1px solid #e0e0e0',
            padding: '20px',
            borderRadius: '8px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
              <div style={{ 
                background: '#3b82f6',
                borderRadius: '8px',
                padding: '8px',
                display: 'flex'
              }}>
                <Target size={20} color="#fff" strokeWidth={2.5} />
              </div>
              <h3 style={{ 
                margin: 0, 
                fontSize: '13px',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                color: '#666',
                fontWeight: '600'
              }}>
                Budget
              </h3>
            </div>
            <p style={{ 
              margin: 0, 
              fontSize: '28px', 
              fontWeight: '700',
              color: '#1a1a1a'
            }}>
              ${getTotalBudget().toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
          </div>

          <div 
            className="card" 
            onClick={() => setShowAnalytics(true)}
            style={{
            background: '#fff',
            border: '1px solid #e0e0e0',
            padding: '20px',
            borderRadius: '8px',
            cursor: 'pointer',
            transition: 'all 0.2s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.1)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = 'none';
          }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
              <div style={{ 
                background: '#ef4444',
                borderRadius: '8px',
                padding: '8px',
                display: 'flex'
              }}>
                <TrendingDown size={20} color="#fff" strokeWidth={2.5} />
              </div>
              <h3 style={{ 
                margin: 0, 
                fontSize: '13px',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                color: '#666',
                fontWeight: '600'
              }}>
                Spending
              </h3>
            </div>
            <p style={{ 
              margin: 0, 
              fontSize: '28px', 
              fontWeight: '700',
              color: '#1a1a1a'
            }}>
              ${getTotalSpending().toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
            <p style={{ 
              margin: '8px 0 0 0', 
              fontSize: '12px', 
              color: '#3b82f6',
              fontWeight: '500'
            }}>
              Click for details →
            </p>
          </div>

          <div className="card" style={{
            background: '#fff',
            border: '1px solid #e0e0e0',
            padding: '20px',
            borderRadius: '8px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
              <div style={{ 
                background: '#8b5cf6',
                borderRadius: '8px',
                padding: '8px',
                display: 'flex'
              }}>
                <CreditCard size={20} color="#fff" strokeWidth={2.5} />
              </div>
              <h3 style={{ 
                margin: 0, 
                fontSize: '13px',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                color: '#666',
                fontWeight: '600'
              }}>
                Debt Payments
              </h3>
            </div>
            <p style={{ 
              margin: 0, 
              fontSize: '28px', 
              fontWeight: '700',
              color: '#1a1a1a'
            }}>
              ${getTotalDebtPayments().toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
          </div>

          {/* Quick Add Transaction Card */}
          <div 
            className="card" 
            onClick={() => {
              if (categories.length > 0 && members.length > 0) {
                setShowTransactionModal(true);
              }
            }}
            style={{
            background: categories.length === 0 || members.length === 0 
              ? 'linear-gradient(135deg, #f5f5f5 0%, #e0e0e0 100%)'
              : 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
            border: '1px solid #e0e0e0',
            padding: '20px',
            borderRadius: '8px',
            cursor: categories.length === 0 || members.length === 0 ? 'not-allowed' : 'pointer',
            transition: 'all 0.2s ease',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            textAlign: 'center'
          }}
          onMouseEnter={(e) => {
            if (categories.length > 0 && members.length > 0) {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(37, 99, 235, 0.3)';
            }
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = 'none';
          }}
          >
            <div style={{ 
              background: categories.length === 0 || members.length === 0 ? '#999' : '#fff',
              borderRadius: '50%',
              padding: '12px',
              display: 'flex',
              marginBottom: '12px'
            }}>
              <PlusCircle size={24} color={categories.length === 0 || members.length === 0 ? '#fff' : '#2563eb'} strokeWidth={2.5} />
            </div>
            <h3 style={{ 
              margin: '0 0 4px 0', 
              fontSize: '16px',
              fontWeight: '700',
              color: categories.length === 0 || members.length === 0 ? '#666' : '#fff'
            }}>
              Add Transaction
            </h3>
            <p style={{ 
              margin: 0, 
              fontSize: '12px',
              color: categories.length === 0 || members.length === 0 ? '#999' : 'rgba(255, 255, 255, 0.8)'
            }}>
              {categories.length === 0 || members.length === 0 
                ? 'Add members & categories first' 
                : 'Quick add expense'}
            </p>
          </div>
        </div>

        {/* Main Content Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '20px', marginBottom: '20px' }}>
          {/* Household Members */}
          <div className="card" style={{
            background: '#fff',
            border: '1px solid #e0e0e0',
            borderRadius: '8px',
            padding: '20px'
          }}>
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              marginBottom: '20px'
            }}>
              <h2 style={{ 
                margin: 0, 
                fontSize: '18px',
                fontWeight: '700',
                color: '#1a1a1a'
              }}>
                Members
              </h2>
              <button
                onClick={() => setShowMemberModal(true)}
                style={{
                  background: '#2563eb',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '8px 14px',
                  color: '#fff',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '14px',
                  fontWeight: '600'
                }}
              >
                <PlusCircle size={16} />
                Add
              </button>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {members.length === 0 ? (
                <div style={{ 
                  textAlign: 'center', 
                  padding: '32px 16px',
                  color: '#999',
                  background: '#fafafa',
                  borderRadius: '6px',
                  border: '1px dashed #e0e0e0'
                }}>
                  <Users size={32} color="#ccc" style={{ marginBottom: '8px' }} />
                  <p style={{ margin: 0, fontSize: '14px', fontWeight: '500' }}>No members yet</p>
                </div>
              ) : (
                members.map(member => (
                  <div key={member.id} style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '14px',
                    background: '#fafafa',
                    border: '1px solid #f0f0f0',
                    borderRadius: '6px'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{
                        width: '36px',
                        height: '36px',
                        borderRadius: '50%',
                        background: '#2563eb',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#fff',
                        fontWeight: '600',
                        fontSize: '14px'
                      }}>
                        {member.name.charAt(0).toUpperCase()}
                      </div>
                      <span style={{ fontSize: '15px', fontWeight: '600', color: '#1a1a1a' }}>{member.name}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <button
                        onClick={() => openIncomeModal(member.id)}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          color: '#10b981',
                          cursor: 'pointer',
                          padding: '4px 8px',
                          borderRadius: '4px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          fontSize: '15px',
                          fontWeight: '700'
                        }}
                      >
                        ${getMemberIncome(member.id).toLocaleString()}
                        <DollarSign size={14} />
                      </button>
                      <button
                        onClick={() => deleteMember(member.id)}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          color: '#ef4444',
                          cursor: 'pointer',
                          padding: '4px',
                          borderRadius: '4px',
                          display: 'flex'
                        }}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Budget Categories */}
          <div className="card" style={{
            background: '#fff',
            border: '1px solid #e0e0e0',
            borderRadius: '8px',
            padding: '20px'
          }}>
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              marginBottom: '16px'
            }}>
              <h2 style={{ 
                margin: 0, 
                fontSize: '18px',
                fontWeight: '700',
                color: '#1a1a1a'
              }}>
                Categories
              </h2>
              <button
                onClick={() => setShowCategoryModal(true)}
                style={{
                  background: '#2563eb',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '8px 14px',
                  color: '#fff',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '14px',
                  fontWeight: '600'
                }}
              >
                <PlusCircle size={16} />
                Add
              </button>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {categories.length === 0 ? (
                <div style={{ 
                  textAlign: 'center', 
                  padding: '32px 16px',
                  color: '#999',
                  background: '#fafafa',
                  borderRadius: '6px',
                  border: '1px dashed #e0e0e0'
                }}>
                  <Target size={32} color="#ccc" style={{ marginBottom: '8px' }} />
                  <p style={{ margin: 0, fontSize: '14px', fontWeight: '500' }}>No categories yet</p>
                </div>
              ) : (
                categories.map(category => {
                  const spent = getCategorySpending(category.id);
                  const performance = getBudgetPerformance(category.id, spent, category.budget);
                  
                  return (
                    <div key={category.id} style={{
                      padding: '10px 12px',
                      background: '#fafafa',
                      border: '1px solid #f0f0f0',
                      borderRadius: '6px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = '#f0f0f0';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = '#fafafa';
                    }}
                    onClick={() => openEditCategory(category)}
                    >
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                          <span style={{ fontSize: '14px', fontWeight: '600', color: '#1a1a1a' }}>{category.name}</span>
                          <span style={{ fontSize: '11px', color: '#999' }}>
                            {category.isHousehold ? '· Household' : 
                             `· ${category.memberIds.map(id => members.find(m => m.id === id)?.name).join(', ')}`}
                          </span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <div style={{ flex: 1, maxWidth: '200px' }}>
                            <div style={{ 
                              width: '100%', 
                              height: '4px', 
                              background: '#f0f0f0', 
                              borderRadius: '2px',
                              overflow: 'hidden'
                            }}>
                              <div 
                                className="progress-bar"
                                style={{ 
                                  width: `${Math.min(performance.percentage, 100)}%`,
                                  height: '100%',
                                  background: performance.status === 'over' ? '#ef4444' : 
                                             performance.status === 'warning' ? '#f59e0b' : '#10b981',
                                  borderRadius: '2px'
                                }}
                              />
                            </div>
                          </div>
                          <div style={{ fontSize: '12px', color: '#666', whiteSpace: 'nowrap' }}>
                            ${spent.toFixed(0)} / ${category.budget.toFixed(0)}
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteCategory(category.id);
                        }}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          color: '#ef4444',
                          cursor: 'pointer',
                          padding: '4px',
                          borderRadius: '4px',
                          display: 'flex',
                          flexShrink: 0
                        }}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Member Budget Summary */}
        {members.length > 0 && (
          <div className="card" style={{
            background: '#fff',
            border: '1px solid #e0e0e0',
            borderRadius: '8px',
            padding: '20px',
            marginBottom: '20px'
          }}>
            <h2 style={{ 
              margin: '0 0 20px 0', 
              fontSize: '18px',
              fontWeight: '700',
              color: '#1a1a1a'
            }}>
              Member Budget Summary
            </h2>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '14px' }}>
              {members.map(member => {
                const income = getMemberIncome(member.id);
                const budget = getMemberTotalBudget(member.id);
                const spending = getMemberTotalSpending(member.id);
                const remaining = income - spending;
                const budgetUsed = budget > 0 ? (spending / budget) * 100 : 0;
                
                return (
                  <div key={member.id} style={{
                    padding: '16px',
                    background: '#fafafa',
                    border: '1px solid #f0f0f0',
                    borderRadius: '6px'
                  }}>
                    <div style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '10px', 
                      marginBottom: '12px',
                      paddingBottom: '12px',
                      borderBottom: '1px solid #e0e0e0'
                    }}>
                      <div style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '50%',
                        background: '#2563eb',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#fff',
                        fontWeight: '600',
                        fontSize: '13px'
                      }}>
                        {member.name.charAt(0).toUpperCase()}
                      </div>
                      <div style={{ fontWeight: '600', fontSize: '15px', color: '#1a1a1a' }}>
                        {member.name}
                      </div>
                    </div>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                        <span style={{ color: '#666' }}>Income</span>
                        <span style={{ fontWeight: '600', color: '#10b981' }}>
                          ${income.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                        <span style={{ color: '#666' }}>Budget</span>
                        <span style={{ fontWeight: '600', color: '#3b82f6' }}>
                          ${budget.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                        <span style={{ color: '#666' }}>Spending</span>
                        <span style={{ fontWeight: '600', color: '#ef4444' }}>
                          ${spending.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                      <div style={{ 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        fontSize: '13px',
                        marginTop: '4px',
                        paddingTop: '8px',
                        borderTop: '1px solid #e0e0e0'
                      }}>
                        <span style={{ color: '#666', fontWeight: '600' }}>Remaining</span>
                        <span style={{ 
                          fontWeight: '700', 
                          color: remaining >= 0 ? '#10b981' : '#ef4444'
                        }}>
                          ${remaining.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                      
                      {budget > 0 && (
                        <div style={{ marginTop: '8px' }}>
                          <div style={{ 
                            width: '100%', 
                            height: '6px', 
                            background: '#f0f0f0', 
                            borderRadius: '3px',
                            overflow: 'hidden'
                          }}>
                            <div 
                              className="progress-bar"
                              style={{ 
                                width: `${Math.min(budgetUsed, 100)}%`,
                                height: '100%',
                                background: budgetUsed > 100 ? '#ef4444' : 
                                           budgetUsed > 80 ? '#f59e0b' : '#10b981',
                                borderRadius: '3px'
                              }}
                            />
                          </div>
                          <div style={{ 
                            marginTop: '4px', 
                            fontSize: '11px', 
                            textAlign: 'right', 
                            fontWeight: '600',
                            color: budgetUsed > 100 ? '#ef4444' : 
                                   budgetUsed > 80 ? '#f59e0b' : '#10b981'
                          }}>
                            {budgetUsed.toFixed(1)}% of budget
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Debts and Credit Cards */}
        <div className="card" style={{
          background: '#fff',
          border: '1px solid #e0e0e0',
          borderRadius: '8px',
          padding: '20px',
          marginBottom: '20px'
        }}>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            marginBottom: '20px'
          }}>
            <h2 style={{ 
              margin: 0, 
              fontSize: '18px',
              fontWeight: '700',
              color: '#1a1a1a'
            }}>
              Debts & Credit Cards
            </h2>
            <button
              onClick={() => setShowDebtModal(true)}
              style={{
                background: '#2563eb',
                border: 'none',
                borderRadius: '6px',
                padding: '8px 14px',
                color: '#fff',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '14px',
                fontWeight: '600'
              }}
            >
              <PlusCircle size={16} />
              Add
            </button>
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '14px' }}>
            {debts.length === 0 ? (
              <div style={{ 
                textAlign: 'center', 
                padding: '32px 16px',
                color: '#999',
                background: '#fafafa',
                borderRadius: '6px',
                border: '1px dashed #e0e0e0',
                gridColumn: '1 / -1'
              }}>
                <CreditCard size={32} color="#ccc" style={{ marginBottom: '8px' }} />
                <p style={{ margin: 0, fontSize: '14px', fontWeight: '500' }}>No debts tracked</p>
              </div>
            ) : (
              debts.map(debt => (
                <div key={debt.id} style={{
                  padding: '16px',
                  background: '#fafafa',
                  border: '1px solid #f0f0f0',
                  borderRadius: '6px'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', alignItems: 'start' }}>
                    <div>
                      <div style={{ fontSize: '15px', fontWeight: '600', marginBottom: '4px', color: '#1a1a1a' }}>{debt.name}</div>
                      <div style={{ fontSize: '11px', color: '#666', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: '600' }}>
                        {debt.type === 'credit-card' ? 'Credit Card' : debt.type === 'loan' ? 'Loan' : 'Debt'}
                        {debt.isJoint ? ' • Joint' : ` • ${members.find(m => debt.memberIds.includes(m.id))?.name}`}
                      </div>
                    </div>
                    <button
                      onClick={() => deleteDebt(debt.id)}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: '#ef4444',
                        cursor: 'pointer',
                        padding: '4px',
                        borderRadius: '4px',
                        display: 'flex'
                      }}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                  
                  <div style={{ marginTop: '12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                      <span style={{ fontSize: '12px', color: '#666', fontWeight: '500' }}>Balance</span>
                      <span style={{ fontSize: '15px', color: '#ef4444', fontWeight: '700' }}>
                        ${debt.balance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                      <span style={{ fontSize: '12px', color: '#666', fontWeight: '500' }}>Payment</span>
                      <span style={{ fontSize: '15px', color: '#8b5cf6', fontWeight: '700' }}>
                        ${debt.payment.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                    
                    <label style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '8px',
                      background: isDebtPaidThisMonth(debt.id) ? '#d1fae5' : '#fff',
                      border: `1px solid ${isDebtPaidThisMonth(debt.id) ? '#10b981' : '#e0e0e0'}`,
                      borderRadius: '6px',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease'
                    }}>
                      <input
                        type="checkbox"
                        checked={isDebtPaidThisMonth(debt.id)}
                        onChange={() => toggleDebtPayment(debt.id)}
                        style={{ 
                          width: '16px', 
                          height: '16px', 
                          cursor: 'pointer',
                          accentColor: '#10b981'
                        }}
                      />
                      <span style={{ 
                        fontSize: '12px', 
                        fontWeight: '600',
                        color: isDebtPaidThisMonth(debt.id) ? '#059669' : '#666'
                      }}>
                        {isDebtPaidThisMonth(debt.id) ? 'Paid this month' : 'Mark as paid'}
                      </span>
                    </label>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Transactions */}
        <div className="card" style={{
          background: '#fff',
          border: '1px solid #e0e0e0',
          borderRadius: '8px',
          padding: '20px'
        }}>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            marginBottom: '20px'
          }}>
            <h2 style={{ 
              margin: 0, 
              fontSize: '18px',
              fontWeight: '700',
              color: '#1a1a1a'
            }}>
              Transactions
            </h2>
            <button
              onClick={() => setShowTransactionModal(true)}
              disabled={categories.length === 0 || members.length === 0}
              style={{
                background: categories.length === 0 || members.length === 0 ? '#e0e0e0' : '#2563eb',
                border: 'none',
                borderRadius: '6px',
                padding: '8px 14px',
                color: categories.length === 0 || members.length === 0 ? '#999' : '#fff',
                cursor: categories.length === 0 || members.length === 0 ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '14px',
                fontWeight: '600'
              }}
            >
              <PlusCircle size={16} />
              Add
            </button>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {getMonthTransactions().length === 0 ? (
              <div style={{ 
                textAlign: 'center', 
                padding: '32px 16px',
                color: '#999',
                background: '#fafafa',
                borderRadius: '6px',
                border: '1px dashed #e0e0e0'
              }}>
                <DollarSign size={32} color="#ccc" style={{ marginBottom: '8px' }} />
                <p style={{ margin: 0, fontSize: '14px', fontWeight: '500' }}>No transactions this month</p>
              </div>
            ) : (
              getMonthTransactions()
                .sort((a, b) => new Date(b.date) - new Date(a.date))
                .map(transaction => {
                  const category = categories.find(c => c.id === transaction.categoryId);
                  const isDebtPayment = transaction.isDebtPayment || transaction.debtId;
                  const debt = isDebtPayment ? debts.find(d => d.id === transaction.debtId) : null;
                  const memberNames = transaction.memberIds
                    .map(id => members.find(m => m.id === id)?.name)
                    .filter(Boolean)
                    .join(', ');
                  
                  return (
                    <div key={transaction.id} style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '14px',
                      background: isDebtPayment ? '#f3e5f5' : '#fafafa',
                      border: `1px solid ${isDebtPayment ? '#ce93d8' : '#f0f0f0'}`,
                      borderRadius: '6px'
                    }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '15px', fontWeight: '600', marginBottom: '4px', color: '#1a1a1a' }}>
                          {isDebtPayment ? (
                            <>
                              {debt?.name || 'Deleted Debt'} Payment
                              {!debt && <span style={{ color: '#ef4444', marginLeft: '8px', fontSize: '12px' }}>(Debt deleted)</span>}
                            </>
                          ) : (
                            <>
                              {category?.name || 'Unknown'}
                              {transaction.description && (
                                <span style={{ color: '#666', marginLeft: '8px', fontSize: '14px', fontWeight: '400' }}>
                                  • {transaction.description}
                                </span>
                              )}
                            </>
                          )}
                        </div>
                        <div style={{ fontSize: '12px', color: '#666' }}>
                          {new Date(transaction.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} • {memberNames} 
                          {transaction.isJoint && <span style={{ fontWeight: '600' }}> (Joint)</span>}
                          {transaction.isFromJointCard && (
                            <span style={{ 
                              marginLeft: '6px',
                              padding: '2px 6px',
                              background: '#eff6ff',
                              border: '1px solid #2563eb',
                              borderRadius: '3px',
                              fontSize: '10px',
                              fontWeight: '600',
                              color: '#2563eb',
                              textTransform: 'uppercase',
                              letterSpacing: '0.5px'
                            }}>
                              Joint Card
                            </span>
                          )}
                        </div>
                      </div>
                      
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <span style={{ 
                          fontSize: '16px', 
                          fontWeight: '700',
                          color: isDebtPayment ? '#8b5cf6' : '#ef4444'
                        }}>
                          ${transaction.amount.toFixed(2)}
                        </span>
                        <button
                          onClick={() => deleteTransaction(transaction.id)}
                          style={{
                            background: 'transparent',
                            border: 'none',
                            color: '#ef4444',
                            cursor: 'pointer',
                            padding: '4px',
                            borderRadius: '4px',
                            display: 'flex'
                          }}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  );
                })
            )}
          </div>
        </div>
      </div>

      {/* Modals */}
      {showMemberModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.4)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: '#fff',
            borderRadius: '8px',
            padding: '28px',
            width: '90%',
            maxWidth: '450px',
            boxShadow: '0 10px 40px rgba(0, 0, 0, 0.15)'
          }}>
            <h3 style={{ 
              margin: '0 0 20px 0', 
              fontSize: '20px',
              fontWeight: '700',
              color: '#1a1a1a'
            }}>
              Add Member
            </h3>
            
            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', color: '#666', fontWeight: '600' }}>
                Name
              </label>
              <input
                type="text"
                value={newMember.name}
                onChange={(e) => setNewMember({ ...newMember, name: e.target.value })}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  background: '#fff',
                  border: '1px solid #e0e0e0',
                  borderRadius: '6px',
                  color: '#1a1a1a',
                  fontSize: '14px'
                }}
                placeholder="Member name"
              />
            </div>
            
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => {
                  setShowMemberModal(false);
                  setNewMember({ name: '' });
                }}
                style={{
                  padding: '10px 20px',
                  background: '#f5f5f5',
                  border: '1px solid #e0e0e0',
                  borderRadius: '6px',
                  color: '#666',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '600'
                }}
              >
                Cancel
              </button>
              <button
                onClick={addMember}
                style={{
                  padding: '10px 20px',
                  background: '#2563eb',
                  border: 'none',
                  borderRadius: '6px',
                  color: '#fff',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '600'
                }}
              >
                Add Member
              </button>
            </div>
          </div>
        </div>
      )}

      {showCategoryModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.4)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: '#fff',
            borderRadius: '8px',
            padding: '28px',
            width: '90%',
            maxWidth: '450px',
            boxShadow: '0 10px 40px rgba(0, 0, 0, 0.15)'
          }}>
            <h3 style={{ 
              margin: '0 0 20px 0', 
              fontSize: '20px',
              fontWeight: '700',
              color: '#1a1a1a'
            }}>
              {editingCategory ? 'Edit Category' : 'Add Category'}
            </h3>
            
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', color: '#666', fontWeight: '600' }}>
                Category Name
              </label>
              <input
                type="text"
                value={newCategory.name}
                onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  background: '#fff',
                  border: '1px solid #e0e0e0',
                  borderRadius: '6px',
                  color: '#1a1a1a',
                  fontSize: '14px'
                }}
                placeholder="e.g., Groceries, Utilities"
              />
            </div>
            
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', color: '#666', fontWeight: '600' }}>
                Monthly Budget
              </label>
              <input
                type="number"
                value={newCategory.budget}
                onChange={(e) => setNewCategory({ ...newCategory, budget: e.target.value })}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  background: '#fff',
                  border: '1px solid #e0e0e0',
                  borderRadius: '6px',
                  color: '#1a1a1a',
                  fontSize: '14px'
                }}
                placeholder="0.00"
                step="0.01"
              />
            </div>
            
            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', marginBottom: '10px', fontSize: '13px', color: '#666', fontWeight: '600' }}>
                Assign to
              </label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '10px',
                  background: newCategory.isHousehold && newCategory.memberIds.length === members.length ? '#eff6ff' : '#fafafa',
                  border: `1px solid ${newCategory.isHousehold && newCategory.memberIds.length === members.length ? '#2563eb' : '#f0f0f0'}`,
                  borderRadius: '6px',
                  cursor: 'pointer'
                }}>
                  <input
                    type="radio"
                    checked={newCategory.isHousehold && newCategory.memberIds.length === members.length}
                    onChange={setAllCategoryMembers}
                    style={{ 
                      width: '16px', 
                      height: '16px', 
                      cursor: 'pointer',
                      accentColor: '#2563eb'
                    }}
                  />
                  <span style={{ fontSize: '14px', fontWeight: '500' }}>Household (split evenly)</span>
                </label>
                
                {members.map(member => (
                  <label key={member.id} style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '10px',
                    background: newCategory.memberIds.includes(member.id) && !newCategory.isHousehold ? '#eff6ff' : '#fafafa',
                    border: `1px solid ${newCategory.memberIds.includes(member.id) && !newCategory.isHousehold ? '#2563eb' : '#f0f0f0'}`,
                    borderRadius: '6px',
                    cursor: 'pointer'
                  }}>
                    <input
                      type="checkbox"
                      checked={newCategory.memberIds.includes(member.id)}
                      onChange={() => toggleCategoryMemberSelection(member.id)}
                      style={{ 
                        width: '16px', 
                        height: '16px', 
                        cursor: 'pointer',
                        accentColor: '#2563eb'
                      }}
                    />
                    <span style={{ fontSize: '14px', fontWeight: '500' }}>{member.name}</span>
                  </label>
                ))}
              </div>
            </div>
            
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => {
                  setShowCategoryModal(false);
                  setNewCategory({ name: '', budget: '', type: 'expense', memberIds: [], isHousehold: true });
                  setEditingCategory(null);
                }}
                style={{
                  padding: '10px 20px',
                  background: '#f5f5f5',
                  border: '1px solid #e0e0e0',
                  borderRadius: '6px',
                  color: '#666',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '600'
                }}
              >
                Cancel
              </button>
              <button
                onClick={addCategory}
                style={{
                  padding: '10px 20px',
                  background: '#2563eb',
                  border: 'none',
                  borderRadius: '6px',
                  color: '#fff',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '600'
                }}
              >
                {editingCategory ? 'Update Category' : 'Add Category'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showTransactionModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.4)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          overflowY: 'auto',
          padding: '20px'
        }}>
          <div style={{
            background: '#fff',
            borderRadius: '8px',
            padding: '28px',
            width: '90%',
            maxWidth: '450px',
            margin: 'auto',
            boxShadow: '0 10px 40px rgba(0, 0, 0, 0.15)'
          }}>
            <h3 style={{ 
              margin: '0 0 20px 0', 
              fontSize: '20px',
              fontWeight: '700',
              color: '#1a1a1a'
            }}>
              Add Transaction
            </h3>
            
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '10px', fontSize: '13px', color: '#666', fontWeight: '600' }}>
                Who is this transaction for?
              </label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {members.map(member => (
                  <label key={member.id} style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '10px',
                    background: selectedMemberFilter === member.id ? '#eff6ff' : '#fafafa',
                    border: `1px solid ${selectedMemberFilter === member.id ? '#2563eb' : '#f0f0f0'}`,
                    borderRadius: '6px',
                    cursor: 'pointer'
                  }}>
                    <input
                      type="radio"
                      checked={selectedMemberFilter === member.id}
                      onChange={() => {
                        setSelectedMemberFilter(member.id);
                        setNewTransaction({ 
                          ...newTransaction, 
                          memberIds: [member.id],
                          isJoint: false,
                          categoryId: '' // Reset category when member changes
                        });
                      }}
                      style={{ 
                        width: '16px', 
                        height: '16px', 
                        cursor: 'pointer',
                        accentColor: '#2563eb'
                      }}
                    />
                    <span style={{ fontSize: '14px', fontWeight: '500' }}>{member.name}</span>
                  </label>
                ))}
              </div>
            </div>
            
            {selectedMemberFilter && (
              <>
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', color: '#666', fontWeight: '600' }}>
                    Category
                  </label>
                  <select
                    value={newTransaction.categoryId}
                    onChange={(e) => setNewTransaction({ ...newTransaction, categoryId: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      background: '#fff',
                      border: '1px solid #e0e0e0',
                      borderRadius: '6px',
                      color: '#1a1a1a',
                      fontSize: '14px'
                    }}
                  >
                    <option value="">Select category</option>
                    {getFilteredCategories().map(cat => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name} {cat.isHousehold ? '(Household)' : ''}
                      </option>
                    ))}
                  </select>
                  {getFilteredCategories().length === 0 && (
                    <p style={{ fontSize: '12px', color: '#999', margin: '6px 0 0 0', fontStyle: 'italic' }}>
                      No categories available for this member. Add categories assigned to {members.find(m => m.id === selectedMemberFilter)?.name} or household.
                    </p>
                  )}
                </div>
            
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', color: '#666', fontWeight: '600' }}>
                Amount
              </label>
              <input
                type="number"
                value={newTransaction.amount}
                onChange={(e) => setNewTransaction({ ...newTransaction, amount: e.target.value })}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  background: '#fff',
                  border: '1px solid #e0e0e0',
                  borderRadius: '6px',
                  color: '#1a1a1a',
                  fontSize: '14px'
                }}
                placeholder="0.00"
                step="0.01"
              />
            </div>
            
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', color: '#666', fontWeight: '600' }}>
                Description (Optional)
              </label>
              <input
                type="text"
                value={newTransaction.description}
                onChange={(e) => setNewTransaction({ ...newTransaction, description: e.target.value })}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  background: '#fff',
                  border: '1px solid #e0e0e0',
                  borderRadius: '6px',
                  color: '#1a1a1a',
                  fontSize: '14px'
                }}
                placeholder="Note"
              />
            </div>
            
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', color: '#666', fontWeight: '600' }}>
                Date
              </label>
              <input
                type="date"
                value={newTransaction.date}
                onChange={(e) => setNewTransaction({ ...newTransaction, date: e.target.value })}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  background: '#fff',
                  border: '1px solid #e0e0e0',
                  borderRadius: '6px',
                  color: '#1a1a1a',
                  fontSize: '14px'
                }}
              />
            </div>
            
            <div style={{ marginBottom: '24px' }}>
              <label style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '12px',
                background: newTransaction.isFromJointCard ? '#eff6ff' : '#fafafa',
                border: `1px solid ${newTransaction.isFromJointCard ? '#2563eb' : '#f0f0f0'}`,
                borderRadius: '6px',
                cursor: 'pointer'
              }}>
                <input
                  type="checkbox"
                  checked={newTransaction.isFromJointCard || false}
                  onChange={(e) => setNewTransaction({ 
                    ...newTransaction, 
                    isFromJointCard: e.target.checked 
                  })}
                  style={{ 
                    width: '16px', 
                    height: '16px', 
                    cursor: 'pointer',
                    accentColor: '#2563eb'
                  }}
                />
                <div>
                  <span style={{ fontSize: '14px', fontWeight: '600', color: '#1a1a1a' }}>
                    Paid with joint card
                  </span>
                  <p style={{ margin: '2px 0 0 0', fontSize: '12px', color: '#666' }}>
                    Split equally between all household members
                  </p>
                </div>
              </label>
            </div>
            </>
            )}
            
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => {
                  setShowTransactionModal(false);
                  setNewTransaction({ 
                    categoryId: '', 
                    amount: '', 
                    description: '', 
                    memberIds: [],
                    isJoint: true,
                    date: new Date().toISOString().slice(0, 10)
                  });
                  setSelectedMemberFilter('');
                }}
                style={{
                  padding: '10px 20px',
                  background: '#f5f5f5',
                  border: '1px solid #e0e0e0',
                  borderRadius: '6px',
                  color: '#666',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '600'
                }}
              >
                Cancel
              </button>
              <button
                onClick={addTransaction}
                style={{
                  padding: '10px 20px',
                  background: '#2563eb',
                  border: 'none',
                  borderRadius: '6px',
                  color: '#fff',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '600'
                }}
              >
                Add Transaction
              </button>
            </div>
          </div>
        </div>
      )}

      {showDebtModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.4)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          overflowY: 'auto',
          padding: '20px'
        }}>
          <div style={{
            background: '#fff',
            borderRadius: '8px',
            padding: '28px',
            width: '90%',
            maxWidth: '450px',
            margin: 'auto',
            boxShadow: '0 10px 40px rgba(0, 0, 0, 0.15)'
          }}>
            <h3 style={{ 
              margin: '0 0 20px 0', 
              fontSize: '20px',
              fontWeight: '700',
              color: '#1a1a1a'
            }}>
              Add Debt
            </h3>
            
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', color: '#666', fontWeight: '600' }}>
                Type
              </label>
              <select
                value={newDebt.type}
                onChange={(e) => setNewDebt({ ...newDebt, type: e.target.value })}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  background: '#fff',
                  border: '1px solid #e0e0e0',
                  borderRadius: '6px',
                  color: '#1a1a1a',
                  fontSize: '14px'
                }}
              >
                <option value="credit-card">Credit Card</option>
                <option value="loan">Loan</option>
                <option value="other">Other Debt</option>
              </select>
            </div>
            
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', color: '#666', fontWeight: '600' }}>
                Name
              </label>
              <input
                type="text"
                value={newDebt.name}
                onChange={(e) => setNewDebt({ ...newDebt, name: e.target.value })}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  background: '#fff',
                  border: '1px solid #e0e0e0',
                  borderRadius: '6px',
                  color: '#1a1a1a',
                  fontSize: '14px'
                }}
                placeholder="e.g., Chase Card"
              />
            </div>
            
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', color: '#666', fontWeight: '600' }}>
                Balance
              </label>
              <input
                type="number"
                value={newDebt.balance}
                onChange={(e) => setNewDebt({ ...newDebt, balance: e.target.value })}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  background: '#fff',
                  border: '1px solid #e0e0e0',
                  borderRadius: '6px',
                  color: '#1a1a1a',
                  fontSize: '14px'
                }}
                placeholder="0.00"
                step="0.01"
              />
            </div>
            
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', color: '#666', fontWeight: '600' }}>
                Monthly Payment
              </label>
              <input
                type="number"
                value={newDebt.payment}
                onChange={(e) => setNewDebt({ ...newDebt, payment: e.target.value })}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  background: '#fff',
                  border: '1px solid #e0e0e0',
                  borderRadius: '6px',
                  color: '#1a1a1a',
                  fontSize: '14px'
                }}
                placeholder="0.00"
                step="0.01"
              />
            </div>
            
            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', marginBottom: '10px', fontSize: '13px', color: '#666', fontWeight: '600' }}>
                Assign to Members
              </label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {members.map(member => (
                  <label key={member.id} style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '10px',
                    background: newDebt.memberIds.includes(member.id) ? '#eff6ff' : '#fafafa',
                    border: `1px solid ${newDebt.memberIds.includes(member.id) ? '#2563eb' : '#f0f0f0'}`,
                    borderRadius: '6px',
                    cursor: 'pointer'
                  }}>
                    <input
                      type="checkbox"
                      checked={newDebt.memberIds.includes(member.id)}
                      onChange={() => toggleDebtMemberSelection(member.id)}
                      style={{ 
                        width: '16px', 
                        height: '16px', 
                        cursor: 'pointer',
                        accentColor: '#2563eb'
                      }}
                    />
                    <span style={{ fontSize: '14px', fontWeight: '500' }}>{member.name}</span>
                  </label>
                ))}
              </div>
            </div>
            
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => {
                  setShowDebtModal(false);
                  setNewDebt({ 
                    name: '', 
                    balance: '', 
                    payment: '', 
                    memberIds: [],
                    isJoint: true,
                    type: 'credit-card'
                  });
                }}
                style={{
                  padding: '10px 20px',
                  background: '#f5f5f5',
                  border: '1px solid #e0e0e0',
                  borderRadius: '6px',
                  color: '#666',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '600'
                }}
              >
                Cancel
              </button>
              <button
                onClick={addDebt}
                style={{
                  padding: '10px 20px',
                  background: '#2563eb',
                  border: 'none',
                  borderRadius: '6px',
                  color: '#fff',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '600'
                }}
              >
                Add Debt
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Income Modal */}
      {showIncomeModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.4)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: '#fff',
            borderRadius: '8px',
            padding: '28px',
            width: '90%',
            maxWidth: '450px',
            boxShadow: '0 10px 40px rgba(0, 0, 0, 0.15)'
          }}>
            <h3 style={{ 
              margin: '0 0 20px 0', 
              fontSize: '20px',
              fontWeight: '700',
              color: '#1a1a1a'
            }}>
              Update Monthly Income
            </h3>
            
            <div style={{ marginBottom: '8px', fontSize: '13px', color: '#666' }}>
              {members.find(m => m.id === editingIncome.memberId)?.name} • {new Date(currentMonth + '-01').toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            </div>
            
            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', color: '#666', fontWeight: '600' }}>
                Income Amount
              </label>
              <input
                type="number"
                value={editingIncome.amount}
                onChange={(e) => setEditingIncome({ ...editingIncome, amount: e.target.value })}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  background: '#fff',
                  border: '1px solid #e0e0e0',
                  borderRadius: '6px',
                  color: '#1a1a1a',
                  fontSize: '14px'
                }}
                placeholder="0.00"
                step="0.01"
                autoFocus
              />
            </div>
            
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => {
                  setShowIncomeModal(false);
                  setEditingIncome({ memberId: '', amount: '' });
                }}
                style={{
                  padding: '10px 20px',
                  background: '#f5f5f5',
                  border: '1px solid #e0e0e0',
                  borderRadius: '6px',
                  color: '#666',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '600'
                }}
              >
                Cancel
              </button>
              <button
                onClick={updateIncome}
                style={{
                  padding: '10px 20px',
                  background: '#2563eb',
                  border: 'none',
                  borderRadius: '6px',
                  color: '#fff',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '600'
                }}
              >
                Update Income
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Analytics Screen */}
      {showAnalytics && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: '#f5f5f5',
          zIndex: 2000,
          overflowY: 'auto',
          padding: '24px'
        }}>
          <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
            {/* Header */}
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              marginBottom: '32px'
            }}>
              <div>
                <h2 style={{ 
                  fontSize: '24px',
                  fontWeight: '700',
                  margin: '0 0 4px 0',
                  color: '#1a1a1a'
                }}>
                  Budget Analytics
                </h2>
                <p style={{ 
                  fontSize: '14px', 
                  color: '#666',
                  margin: 0
                }}>
                  {new Date(currentMonth + '-01').toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                </p>
              </div>
              <button
                onClick={() => setShowAnalytics(false)}
                style={{
                  background: '#fff',
                  border: '1px solid #e0e0e0',
                  borderRadius: '6px',
                  padding: '10px 20px',
                  color: '#666',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '600'
                }}
              >
                ← Back
              </button>
            </div>

            {/* Overall Summary */}
            <div style={{
              background: '#fff',
              border: '1px solid #e0e0e0',
              borderRadius: '8px',
              padding: '24px',
              marginBottom: '24px'
            }}>
              <h3 style={{ 
                fontSize: '18px',
                fontWeight: '700',
                margin: '0 0 20px 0',
                color: '#1a1a1a'
              }}>
                Monthly Overview
              </h3>
              
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '24px' }}>
                <div>
                  <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px', fontWeight: '600' }}>Total Income</div>
                  <div style={{ fontSize: '24px', fontWeight: '700', color: '#10b981' }}>
                    ${getTotalIncome().toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px', fontWeight: '600' }}>Total Budget</div>
                  <div style={{ fontSize: '24px', fontWeight: '700', color: '#3b82f6' }}>
                    ${getTotalBudget().toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px', fontWeight: '600' }}>Total Spending</div>
                  <div style={{ fontSize: '24px', fontWeight: '700', color: '#ef4444' }}>
                    ${getTotalSpending().toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px', fontWeight: '600' }}>Remaining</div>
                  <div style={{ 
                    fontSize: '24px', 
                    fontWeight: '700', 
                    color: getTotalIncome() - getTotalSpending() >= 0 ? '#10b981' : '#ef4444' 
                  }}>
                    ${(getTotalIncome() - getTotalSpending()).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </div>
                </div>
              </div>

              {/* Visual Chart */}
              <div style={{ 
                height: '40px', 
                background: '#f0f0f0', 
                borderRadius: '6px',
                overflow: 'hidden',
                position: 'relative',
                marginBottom: '12px'
              }}>
                {getTotalIncome() > 0 && (
                  <>
                    <div style={{
                      position: 'absolute',
                      left: 0,
                      top: 0,
                      height: '100%',
                      width: `${Math.min((getTotalSpending() / getTotalIncome()) * 100, 100)}%`,
                      background: 'linear-gradient(90deg, #ef4444 0%, #dc2626 100%)',
                      transition: 'width 0.5s ease'
                    }} />
                    <div style={{
                      position: 'absolute',
                      left: 0,
                      top: 0,
                      height: '100%',
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#fff',
                      fontSize: '13px',
                      fontWeight: '700',
                      textShadow: '0 1px 2px rgba(0,0,0,0.3)',
                      zIndex: 1
                    }}>
                      {((getTotalSpending() / getTotalIncome()) * 100).toFixed(1)}% of income spent
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Category Breakdown Table */}
            <div style={{
              background: '#fff',
              border: '1px solid #e0e0e0',
              borderRadius: '8px',
              padding: '24px',
              marginBottom: '24px'
            }}>
              <h3 style={{ 
                fontSize: '18px',
                fontWeight: '700',
                margin: '0 0 20px 0',
                color: '#1a1a1a'
              }}>
                Category Breakdown
              </h3>
              
              {categories.length === 0 ? (
                <p style={{ color: '#999', textAlign: 'center', padding: '20px' }}>No categories to display</p>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ borderBottom: '2px solid #e0e0e0' }}>
                        <th style={{ textAlign: 'left', padding: '12px 8px', fontSize: '13px', fontWeight: '600', color: '#666' }}>Category</th>
                        <th style={{ textAlign: 'left', padding: '12px 8px', fontSize: '13px', fontWeight: '600', color: '#666' }}>Assigned To</th>
                        <th style={{ textAlign: 'right', padding: '12px 8px', fontSize: '13px', fontWeight: '600', color: '#666' }}>Budget</th>
                        <th style={{ textAlign: 'right', padding: '12px 8px', fontSize: '13px', fontWeight: '600', color: '#666' }}>Spent</th>
                        <th style={{ textAlign: 'right', padding: '12px 8px', fontSize: '13px', fontWeight: '600', color: '#666' }}>Remaining</th>
                        <th style={{ textAlign: 'right', padding: '12px 8px', fontSize: '13px', fontWeight: '600', color: '#666' }}>% Used</th>
                        <th style={{ padding: '12px 8px', fontSize: '13px', fontWeight: '600', color: '#666', width: '180px' }}>Progress</th>
                      </tr>
                    </thead>
                    <tbody>
                      {categories.map(category => {
                        const spent = getCategorySpending(category.id);
                        const remaining = category.budget - spent;
                        const percentUsed = (spent / category.budget) * 100;
                        const status = percentUsed > 100 ? 'over' : percentUsed > 80 ? 'warning' : 'good';
                        
                        return (
                          <tr key={category.id} style={{ borderBottom: '1px solid #f0f0f0' }}>
                            <td style={{ padding: '14px 8px', fontSize: '14px', fontWeight: '600', color: '#1a1a1a' }}>
                              {category.name}
                            </td>
                            <td style={{ padding: '14px 8px', fontSize: '13px', color: '#666' }}>
                              {category.isHousehold ? 'Household' : 
                               category.memberIds.map(id => members.find(m => m.id === id)?.name).join(', ')}
                            </td>
                            <td style={{ padding: '14px 8px', fontSize: '14px', fontWeight: '600', color: '#3b82f6', textAlign: 'right' }}>
                              ${category.budget.toFixed(2)}
                            </td>
                            <td style={{ padding: '14px 8px', fontSize: '14px', fontWeight: '600', color: '#ef4444', textAlign: 'right' }}>
                              ${spent.toFixed(2)}
                            </td>
                            <td style={{ 
                              padding: '14px 8px', 
                              fontSize: '14px', 
                              fontWeight: '600', 
                              color: remaining >= 0 ? '#10b981' : '#ef4444',
                              textAlign: 'right'
                            }}>
                              ${remaining.toFixed(2)}
                            </td>
                            <td style={{ 
                              padding: '14px 8px', 
                              fontSize: '14px', 
                              fontWeight: '600',
                              color: status === 'over' ? '#ef4444' : status === 'warning' ? '#f59e0b' : '#10b981',
                              textAlign: 'right'
                            }}>
                              {percentUsed.toFixed(1)}%
                            </td>
                            <td style={{ padding: '14px 8px' }}>
                              <div style={{ 
                                width: '100%', 
                                height: '8px', 
                                background: '#f0f0f0', 
                                borderRadius: '4px',
                                overflow: 'hidden'
                              }}>
                                <div style={{ 
                                  width: `${Math.min(percentUsed, 100)}%`,
                                  height: '100%',
                                  background: status === 'over' ? '#ef4444' : status === 'warning' ? '#f59e0b' : '#10b981',
                                  borderRadius: '4px',
                                  transition: 'width 0.5s ease'
                                }} />
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                    <tfoot>
                      <tr style={{ borderTop: '2px solid #e0e0e0', fontWeight: '700' }}>
                        <td style={{ padding: '14px 8px', fontSize: '14px', color: '#1a1a1a' }} colSpan="2">Total</td>
                        <td style={{ padding: '14px 8px', fontSize: '14px', color: '#3b82f6', textAlign: 'right' }}>
                          ${getTotalBudget().toFixed(2)}
                        </td>
                        <td style={{ padding: '14px 8px', fontSize: '14px', color: '#ef4444', textAlign: 'right' }}>
                          ${getTotalSpending().toFixed(2)}
                        </td>
                        <td style={{ 
                          padding: '14px 8px', 
                          fontSize: '14px', 
                          color: getTotalBudget() - getTotalSpending() >= 0 ? '#10b981' : '#ef4444',
                          textAlign: 'right'
                        }}>
                          ${(getTotalBudget() - getTotalSpending()).toFixed(2)}
                        </td>
                        <td colSpan="2"></td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              )}
            </div>

            {/* Member-by-Member Breakdown */}
            {members.length > 0 && (
              <div style={{
                background: '#fff',
                border: '1px solid #e0e0e0',
                borderRadius: '8px',
                padding: '24px'
              }}>
                <h3 style={{ 
                  fontSize: '18px',
                  fontWeight: '700',
                  margin: '0 0 20px 0',
                  color: '#1a1a1a'
                }}>
                  Member-by-Member Analysis
                </h3>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                  {members.map(member => {
                    const income = getMemberIncome(member.id);
                    const budget = getMemberTotalBudget(member.id);
                    const spending = getMemberTotalSpending(member.id);
                    const remaining = income - spending;
                    const percentSpent = income > 0 ? (spending / income) * 100 : 0;
                    
                    return (
                      <div key={member.id} style={{
                        padding: '20px',
                        background: '#fafafa',
                        border: '1px solid #f0f0f0',
                        borderRadius: '8px'
                      }}>
                        <div style={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          gap: '12px',
                          marginBottom: '16px',
                          paddingBottom: '16px',
                          borderBottom: '1px solid #e0e0e0'
                        }}>
                          <div style={{
                            width: '40px',
                            height: '40px',
                            borderRadius: '50%',
                            background: '#2563eb',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#fff',
                            fontWeight: '700',
                            fontSize: '16px'
                          }}>
                            {member.name.charAt(0).toUpperCase()}
                          </div>
                          <h4 style={{ margin: 0, fontSize: '18px', fontWeight: '700', color: '#1a1a1a' }}>
                            {member.name}
                          </h4>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '16px', marginBottom: '16px' }}>
                          <div>
                            <div style={{ fontSize: '11px', color: '#666', marginBottom: '4px', fontWeight: '600', textTransform: 'uppercase' }}>Income</div>
                            <div style={{ fontSize: '20px', fontWeight: '700', color: '#10b981' }}>
                              ${income.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                            </div>
                          </div>
                          <div>
                            <div style={{ fontSize: '11px', color: '#666', marginBottom: '4px', fontWeight: '600', textTransform: 'uppercase' }}>Budget</div>
                            <div style={{ fontSize: '20px', fontWeight: '700', color: '#3b82f6' }}>
                              ${budget.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                            </div>
                          </div>
                          <div>
                            <div style={{ fontSize: '11px', color: '#666', marginBottom: '4px', fontWeight: '600', textTransform: 'uppercase' }}>Spending</div>
                            <div style={{ fontSize: '20px', fontWeight: '700', color: '#ef4444' }}>
                              ${spending.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                            </div>
                          </div>
                          <div>
                            <div style={{ fontSize: '11px', color: '#666', marginBottom: '4px', fontWeight: '600', textTransform: 'uppercase' }}>Remaining</div>
                            <div style={{ 
                              fontSize: '20px', 
                              fontWeight: '700', 
                              color: remaining >= 0 ? '#10b981' : '#ef4444' 
                            }}>
                              ${remaining.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                            </div>
                          </div>
                        </div>

                        {/* Visual breakdown */}
                        {income > 0 && (
                          <div>
                            <div style={{ 
                              height: '32px', 
                              background: '#f0f0f0', 
                              borderRadius: '6px',
                              overflow: 'hidden',
                              position: 'relative',
                              marginBottom: '8px'
                            }}>
                              <div style={{
                                position: 'absolute',
                                left: 0,
                                top: 0,
                                height: '100%',
                                width: `${Math.min(percentSpent, 100)}%`,
                                background: percentSpent > 100 ? '#ef4444' : 
                                           percentSpent > 80 ? '#f59e0b' : '#10b981',
                                transition: 'width 0.5s ease'
                              }} />
                              <div style={{
                                position: 'absolute',
                                left: 0,
                                top: 0,
                                height: '100%',
                                width: '100%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: percentSpent > 20 ? '#fff' : '#666',
                                fontSize: '12px',
                                fontWeight: '700',
                                textShadow: percentSpent > 20 ? '0 1px 2px rgba(0,0,0,0.3)' : 'none',
                                zIndex: 1
                              }}>
                                {percentSpent.toFixed(1)}% of income spent
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default EGBudgetApp;