// Payroll Management JavaScript

let employees = [];
let payrollRecords = [];
let expenses = [];
let projects = [];

// Initialize page
document.addEventListener('DOMContentLoaded', function() {
    checkAuth();
    loadProjects();
    loadEmployees();
    loadPayrollRecords();
    loadExpenses();
    setupEventListeners();
    setDefaultDates();
    setupTabs();
});

function setupTabs() {
    // Tab switching functionality
    const tabButtons = document.querySelectorAll('.tab-button');
    const tabContents = document.querySelectorAll('.tab-content');

    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            const tabName = button.id.replace('Tab', '');
            
            // Remove active class from all tabs and contents
            tabButtons.forEach(btn => btn.classList.remove('active', 'border-red-500', 'text-red-600'));
            tabButtons.forEach(btn => btn.classList.add('border-transparent', 'text-gray-500'));
            tabContents.forEach(content => content.classList.add('hidden'));

            // Add active class to clicked tab
            button.classList.add('active', 'border-red-500', 'text-red-600');
            button.classList.remove('border-transparent', 'text-gray-500');

            // Show corresponding content
            const content = document.getElementById(tabName + 'Content');
            if (content) {
                content.classList.remove('hidden');
            }

            // Load data for the selected tab
            switch(tabName) {
                case 'employees':
                    updateEmployeeStats();
                    break;
                case 'payroll':
                    updatePayrollStats();
                    break;
                case 'expenses':
                    updateExpenseStats();
                    break;
                case 'analytics':
                    updateAnalytics();
                    break;
            }
        });
    });
}

function setupEventListeners() {
    // Form submissions
    const addEmployeeForm = document.getElementById('addEmployeeForm');
    if (addEmployeeForm) {
        addEmployeeForm.addEventListener('submit', handleEmployeeSubmit);
    }

    const processPayrollForm = document.getElementById('processPayrollForm');
    if (processPayrollForm) {
        processPayrollForm.addEventListener('submit', handlePayrollSubmit);
    }

    const addExpenseForm = document.getElementById('addExpenseForm');
    if (addExpenseForm) {
        addExpenseForm.addEventListener('submit', handleExpenseSubmit);
    }

    // Dynamic form updates
    const payrollEmployee = document.getElementById('payrollEmployee');
    if (payrollEmployee) {
        payrollEmployee.addEventListener('change', updatePayrollEmployee);
    }

    const payrollPeriod = document.getElementById('payrollPeriod');
    if (payrollPeriod) {
        payrollPeriod.addEventListener('change', updatePayrollPeriod);
    }

    // Payroll calculation inputs
    const bonuses = document.getElementById('bonuses');
    const deductions = document.getElementById('deductions');
    const overtimeHours = document.getElementById('overtimeHours');
    const baseAmount = document.getElementById('baseAmount');

    if (bonuses) bonuses.addEventListener('input', calculatePayrollTotal);
    if (deductions) deductions.addEventListener('input', calculatePayrollTotal);
    if (overtimeHours) overtimeHours.addEventListener('input', calculatePayrollTotal);
    if (baseAmount) baseAmount.addEventListener('input', calculatePayrollTotal);
}

function setDefaultDates() {
    const today = new Date().toISOString().split('T')[0];
    const startDate = document.getElementById('startDate');
    const paymentDate = document.getElementById('paymentDate');
    const expenseDate = document.getElementById('expenseDate');

    if (startDate) startDate.value = today;
    if (paymentDate) paymentDate.value = today;
    if (expenseDate) expenseDate.value = today;
}

// Load data functions
async function loadProjects() {
    try {
        const response = await fetch('/api/projects');
        if (response.ok) {
            projects = await response.json();
            updateProjectSelects();
        }
    } catch (error) {
        console.error('Error loading projects:', error);
        projects = [];
    }
}

function updateProjectSelects() {
    const selects = ['employeeProject', 'expenseProject'];
    selects.forEach(selectId => {
        const select = document.getElementById(selectId);
        if (select) {
            // Clear existing options except the first one
            while (select.children.length > 1) {
                select.removeChild(select.lastChild);
            }
            
            projects.forEach(project => {
                const option = document.createElement('option');
                option.value = project.id;
                option.textContent = project.name;
                select.appendChild(option);
            });
        }
    });
}

async function loadEmployees() {
    try {
        const response = await fetch('/api/employees');
        if (response.ok) {
            employees = await response.json();
        } else {
            employees = [];
        }
        displayEmployees(employees);
        updateEmployeeStats();
        updatePayrollEmployeeSelect();
    } catch (error) {
        console.error('Error loading employees:', error);
        employees = [];
        displayEmployees([]);
        updateEmployeeStats();
    }
}

async function loadPayrollRecords() {
    try {
        const response = await fetch('/api/payroll');
        if (response.ok) {
            payrollRecords = await response.json();
        } else {
            payrollRecords = [];
        }
        displayPayrollRecords(payrollRecords);
        updatePayrollStats();
    } catch (error) {
        console.error('Error loading payroll records:', error);
        payrollRecords = [];
        displayPayrollRecords([]);
        updatePayrollStats();
    }
}

async function loadExpenses() {
    try {
        const response = await fetch('/api/expenses');
        if (response.ok) {
            expenses = await response.json();
        } else {
            expenses = [];
        }
        displayExpenses(expenses);
        updateExpenseStats();
    } catch (error) {
        console.error('Error loading expenses:', error);
        expenses = [];
        displayExpenses([]);
        updateExpenseStats();
    }
}

// Employee management functions
async function handleEmployeeSubmit(e) {
    e.preventDefault();
    
    const formData = {
        name: document.getElementById('employeeName').value,
        type: document.getElementById('employeeType').value,
        project_id: document.getElementById('employeeProject').value || null,
        salary: parseFloat(document.getElementById('baseSalary').value),
        payment_type: document.getElementById('paymentType').value,
        phone: document.getElementById('employeePhone').value,
        id_number: document.getElementById('employeeId').value,
        start_date: document.getElementById('startDate').value,
        notes: document.getElementById('employeeNotes').value
    };

    try {
        const response = await fetch('/api/employees', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
        });

        if (response.ok) {
            showNotification('تم إضافة الموظف بنجاح', 'success');
            document.getElementById('addEmployeeForm').reset();
            setDefaultDates();
            loadEmployees();
        } else {
            const error = await response.json();
            showNotification(error.error || 'حدث خطأ أثناء إضافة الموظف', 'error');
        }
    } catch (error) {
        console.error('Error adding employee:', error);
        showNotification('حدث خطأ أثناء إضافة الموظف', 'error');
    }
}

function displayEmployees(employeesToShow) {
    const tbody = document.getElementById('employeesTableBody');
    if (!tbody) return;
    
    tbody.innerHTML = '';

    if (employeesToShow.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="6" class="px-6 py-4 text-center text-gray-500">
                    <i class="fas fa-users text-4xl mb-2"></i>
                    <p>لا يوجد موظفين حتى الآن</p>
                </td>
            </tr>
        `;
        return;
    }

    employeesToShow.forEach(employee => {
        const row = document.createElement('tr');
        const project = projects.find(p => p.id == employee.project_id);
        
        row.innerHTML = `
            <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">${employee.name}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${employee.type}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${project ? project.name : 'غير محدد'}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${formatCurrency(employee.salary)}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${employee.payment_type}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                <button class="text-indigo-600 hover:text-indigo-900 ml-2" onclick="editEmployee(${employee.id})">تعديل</button>
                <button class="text-red-600 hover:text-red-900" onclick="deleteEmployee(${employee.id})">حذف</button>
            </td>
        `;
        tbody.appendChild(row);
    });
}

function updateEmployeeStats() {
    const actorsCount = employees.filter(e => e.type === 'ممثل' || e.type === 'مساعد ممثل').length;
    const crewCount = employees.filter(e => ['مخرج', 'منتج', 'فني صوت', 'فني إضاءة', 'مصور', 'مونتير', 'كاتب سيناريو', 'مساعد إخراج', 'فنان مكياج', 'مصمم أزياء', 'مصمم ديكور'].includes(e.type)).length;
    const stageWorkersCount = employees.filter(e => ['عامل مسرح', 'أمن', 'عامل نظافة', 'سائق'].includes(e.type)).length;
    const totalCount = employees.length;

    const actorsCountEl = document.getElementById('actorsCount');
    const crewCountEl = document.getElementById('crewCount');
    const stageWorkersCountEl = document.getElementById('stageWorkersCount');
    const totalEmployeesCountEl = document.getElementById('totalEmployeesCount');

    if (actorsCountEl) actorsCountEl.textContent = actorsCount;
    if (crewCountEl) crewCountEl.textContent = crewCount;
    if (stageWorkersCountEl) stageWorkersCountEl.textContent = stageWorkersCount;
    if (totalEmployeesCountEl) totalEmployeesCountEl.textContent = totalCount;
}

// Payroll management functions
function updatePayrollEmployeeSelect() {
    const select = document.getElementById('payrollEmployee');
    if (!select) return;
    
    // Clear existing options except the first one
    while (select.children.length > 1) {
        select.removeChild(select.lastChild);
    }
    
    employees.forEach(employee => {
        const option = document.createElement('option');
        option.value = employee.id;
        option.textContent = `${employee.name} - ${employee.type}`;
        option.dataset.salary = employee.salary;
        option.dataset.paymentType = employee.payment_type;
        select.appendChild(option);
    });
}

function updatePayrollEmployee() {
    const select = document.getElementById('payrollEmployee');
    const selectedOption = select.options[select.selectedIndex];
    const baseAmountInput = document.getElementById('baseAmount');
    
    if (selectedOption && selectedOption.dataset.salary && baseAmountInput) {
        baseAmountInput.value = selectedOption.dataset.salary;
        calculatePayrollTotal();
    }
}

function calculatePayrollTotal() {
    const baseAmount = parseFloat(document.getElementById('baseAmount')?.value) || 0;
    const bonuses = parseFloat(document.getElementById('bonuses')?.value) || 0;
    const deductions = parseFloat(document.getElementById('deductions')?.value) || 0;
    const overtimeHours = parseFloat(document.getElementById('overtimeHours')?.value) || 0;
    
    // Calculate overtime pay (assuming 50% extra per hour)
    const overtimePay = overtimeHours * (baseAmount / 160) * 1.5; // Assuming 160 hours per month
    
    const total = baseAmount + bonuses + overtimePay - deductions;
    const totalInput = document.getElementById('totalPayroll');
    if (totalInput) {
        totalInput.value = total.toFixed(2);
    }
}

function calculatePayroll() {
    calculatePayrollTotal();
    showNotification('تم حساب الراتب', 'success');
}

async function handlePayrollSubmit(e) {
    e.preventDefault();
    
    const formData = {
        employee_id: document.getElementById('payrollEmployee').value,
        period: document.getElementById('payrollPeriod').value,
        base_amount: parseFloat(document.getElementById('baseAmount').value),
        bonus: parseFloat(document.getElementById('bonuses').value) || 0,
        deductions: parseFloat(document.getElementById('deductions').value) || 0,
        overtime: parseFloat(document.getElementById('overtimeHours').value) || 0,
        total: parseFloat(document.getElementById('totalPayroll').value),
        payment_date: document.getElementById('paymentDate').value,
        notes: document.getElementById('payrollNotes').value
    };

    try {
        const response = await fetch('/api/payroll', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
        });

        if (response.ok) {
            showNotification('تم معالجة الراتب بنجاح', 'success');
            document.getElementById('processPayrollForm').reset();
            setDefaultDates();
            loadPayrollRecords();
        } else {
            const error = await response.json();
            showNotification(error.error || 'حدث خطأ أثناء معالجة الراتب', 'error');
        }
    } catch (error) {
        console.error('Error processing payroll:', error);
        showNotification('حدث خطأ أثناء معالجة الراتب', 'error');
    }
}

function displayPayrollRecords(recordsToShow) {
    const tbody = document.getElementById('payrollTableBody');
    if (!tbody) return;
    
    tbody.innerHTML = '';

    if (recordsToShow.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="8" class="px-6 py-4 text-center text-gray-500">
                    <i class="fas fa-money-bill-wave text-4xl mb-2"></i>
                    <p>لا توجد رواتب مسجلة حتى الآن</p>
                </td>
            </tr>
        `;
        return;
    }

    recordsToShow.forEach(record => {
        const row = document.createElement('tr');
        const employee = employees.find(e => e.id == record.employee_id);
        
        row.innerHTML = `
            <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">${employee ? employee.name : 'غير محدد'}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${record.period}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${formatCurrency(record.base_amount)}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${formatCurrency(record.bonus || 0)}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${formatCurrency(record.deductions || 0)}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${formatCurrency(record.total)}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(record.status || 'pending')}">
                    ${getStatusText(record.status || 'pending')}
                </span>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                <button class="text-indigo-600 hover:text-indigo-900 ml-2" onclick="editPayroll(${record.id})">تعديل</button>
                <button class="text-red-600 hover:text-red-900" onclick="deletePayroll(${record.id})">حذف</button>
            </td>
        `;
        tbody.appendChild(row);
    });
}

function updatePayrollStats() {
    const monthlyTotal = payrollRecords.reduce((sum, record) => sum + (record.total || 0), 0);
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    
    const currentMonthRecords = payrollRecords.filter(record => {
        const recordDate = new Date(record.payment_date);
        return recordDate.getMonth() === currentMonth && recordDate.getFullYear() === currentYear;
    });
    
    const currentMonthTotal = currentMonthRecords.reduce((sum, record) => sum + (record.total || 0), 0);
    const pendingTotal = payrollRecords.filter(r => r.status === 'pending').reduce((sum, record) => sum + (record.total || 0), 0);
    const paidTotal = payrollRecords.filter(r => r.status === 'paid').reduce((sum, record) => sum + (record.total || 0), 0);

    const totalMonthlyPayrollEl = document.getElementById('totalMonthlyPayroll');
    const thisMonthPayrollEl = document.getElementById('thisMonthPayroll');
    const pendingPayrollEl = document.getElementById('pendingPayroll');
    const paidPayrollEl = document.getElementById('paidPayroll');

    if (totalMonthlyPayrollEl) totalMonthlyPayrollEl.textContent = formatCurrency(monthlyTotal);
    if (thisMonthPayrollEl) thisMonthPayrollEl.textContent = formatCurrency(currentMonthTotal);
    if (pendingPayrollEl) pendingPayrollEl.textContent = formatCurrency(pendingTotal);
    if (paidPayrollEl) paidPayrollEl.textContent = formatCurrency(paidTotal);
}

// Expense management functions
async function handleExpenseSubmit(e) {
    e.preventDefault();
    
    const formData = {
        category: document.getElementById('expenseCategory').value,
        project_id: document.getElementById('expenseProject').value || null,
        description: document.getElementById('expenseDescription').value,
        amount: parseFloat(document.getElementById('expenseAmount').value),
        date: document.getElementById('expenseDate').value,
        vendor: document.getElementById('expenseVendor').value,
        receipt: document.getElementById('invoiceNumber').value,
        payment_method: document.getElementById('paymentMethod').value,
        status: document.getElementById('expenseStatus').value,
        notes: document.getElementById('expenseNotes').value
    };

    try {
        const response = await fetch('/api/expenses', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
        });

        if (response.ok) {
            showNotification('تم إضافة المصروف بنجاح', 'success');
            document.getElementById('addExpenseForm').reset();
            setDefaultDates();
            loadExpenses();
        } else {
            const error = await response.json();
            showNotification(error.error || 'حدث خطأ أثناء إضافة المصروف', 'error');
        }
    } catch (error) {
        console.error('Error adding expense:', error);
        showNotification('حدث خطأ أثناء إضافة المصروف', 'error');
    }
}

function displayExpenses(expensesToShow) {
    const tbody = document.getElementById('expensesTableBody');
    if (!tbody) return;
    
    tbody.innerHTML = '';

    if (expensesToShow.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" class="px-6 py-4 text-center text-gray-500">
                    <i class="fas fa-receipt text-4xl mb-2"></i>
                    <p>لا توجد مصروفات مسجلة حتى الآن</p>
                </td>
            </tr>
        `;
        return;
    }

    expensesToShow.forEach(expense => {
        const row = document.createElement('tr');
        const project = projects.find(p => p.id == expense.project_id);
        
        row.innerHTML = `
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${formatDate(expense.date)}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${expense.category}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">${expense.description}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${formatCurrency(expense.amount)}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${project ? project.name : 'غير محدد'}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(expense.status)}">
                    ${getStatusText(expense.status)}
                </span>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                <button class="text-indigo-600 hover:text-indigo-900 ml-2" onclick="editExpense(${expense.id})">تعديل</button>
                <button class="text-red-600 hover:text-red-900" onclick="deleteExpense(${expense.id})">حذف</button>
            </td>
        `;
        tbody.appendChild(row);
    });
}

function updateExpenseStats() {
    const totalExpenses = expenses.reduce((sum, expense) => sum + (expense.amount || 0), 0);
    const today = new Date().toISOString().split('T')[0];
    const todayExpenses = expenses.filter(e => e.date === today).reduce((sum, expense) => sum + (expense.amount || 0), 0);
    
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    const monthExpenses = expenses.filter(expense => {
        const expenseDate = new Date(expense.date);
        return expenseDate.getMonth() === currentMonth && expenseDate.getFullYear() === currentYear;
    }).reduce((sum, expense) => sum + (expense.amount || 0), 0);
    
    const pendingExpenses = expenses.filter(e => e.status === 'معلق').reduce((sum, expense) => sum + (expense.amount || 0), 0);

    const totalExpensesEl = document.getElementById('totalExpenses');
    const todayExpensesEl = document.getElementById('todayExpenses');
    const monthExpensesEl = document.getElementById('monthExpenses');
    const pendingExpensesEl = document.getElementById('pendingExpenses');

    if (totalExpensesEl) totalExpensesEl.textContent = formatCurrency(totalExpenses);
    if (todayExpensesEl) todayExpensesEl.textContent = formatCurrency(todayExpenses);
    if (monthExpensesEl) monthExpensesEl.textContent = formatCurrency(monthExpenses);
    if (pendingExpensesEl) pendingExpensesEl.textContent = formatCurrency(pendingExpenses);
}

// Analytics functions
function updateAnalytics() {
    const avgMonthlySalary = employees.length > 0 ? employees.reduce((sum, emp) => sum + emp.salary, 0) / employees.length : 0;
    const avgDailyExpenses = expenses.length > 0 ? expenses.reduce((sum, exp) => sum + exp.amount, 0) / expenses.length : 0;
    const highestSalary = employees.length > 0 ? Math.max(...employees.map(emp => emp.salary)) : 0;
    const largestExpense = expenses.length > 0 ? Math.max(...expenses.map(exp => exp.amount)) : 0;

    const avgMonthlySalaryEl = document.getElementById('avgMonthlySalary');
    const avgDailyExpensesEl = document.getElementById('avgDailyExpenses');
    const highestSalaryEl = document.getElementById('highestSalary');
    const largestExpenseEl = document.getElementById('largestExpense');

    if (avgMonthlySalaryEl) avgMonthlySalaryEl.textContent = formatCurrency(avgMonthlySalary);
    if (avgDailyExpensesEl) avgDailyExpensesEl.textContent = formatCurrency(avgDailyExpenses);
    if (highestSalaryEl) highestSalaryEl.textContent = formatCurrency(highestSalary);
    if (largestExpenseEl) largestExpenseEl.textContent = formatCurrency(largestExpense);
}

// Utility functions
function formatCurrency(amount) {
    return new Intl.NumberFormat('ar-EG', {
        style: 'currency',
        currency: 'EGP',
        minimumFractionDigits: 0,
        maximumFractionDigits: 2
    }).format(amount || 0);
}

function formatDate(dateString) {
    if (!dateString) return 'غير محدد';
    const date = new Date(dateString);
    return date.toLocaleDateString('ar-EG');
}

function getStatusColor(status) {
    switch(status) {
        case 'paid':
        case 'مدفوع':
            return 'bg-green-100 text-green-800';
        case 'pending':
        case 'معلق':
            return 'bg-yellow-100 text-yellow-800';
        case 'rejected':
        case 'مرفوض':
            return 'bg-red-100 text-red-800';
        default:
            return 'bg-gray-100 text-gray-800';
    }
}

function getStatusText(status) {
    switch(status) {
        case 'paid':
            return 'مدفوع';
        case 'pending':
            return 'معلق';
        case 'rejected':
            return 'مرفوض';
        default:
            return status;
    }
}

function showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg ${
        type === 'success' ? 'bg-green-500 text-white' :
        type === 'error' ? 'bg-red-500 text-white' :
        'bg-blue-500 text-white'
    }`;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    // Remove after 3 seconds
    setTimeout(() => {
        notification.remove();
    }, 3000);
}

// Clear form functions
function clearEmployeeForm() {
    document.getElementById('addEmployeeForm').reset();
    setDefaultDates();
}

function clearExpenseForm() {
    document.getElementById('addExpenseForm').reset();
    setDefaultDates();
}

// Edit and delete functions (placeholders)
function editEmployee(id) {
    showNotification('وظيفة التعديل قيد التطوير', 'info');
}

function deleteEmployee(id) {
    if (confirm('هل أنت متأكد من حذف هذا الموظف؟')) {
        // Delete employee logic here
        showNotification('تم حذف الموظف', 'success');
        loadEmployees();
    }
}

function editPayroll(id) {
    showNotification('وظيفة التعديل قيد التطوير', 'info');
}

function deletePayroll(id) {
    if (confirm('هل أنت متأكد من حذف هذا السجل؟')) {
        // Delete payroll logic here
        showNotification('تم حذف السجل', 'success');
        loadPayrollRecords();
    }
}

function editExpense(id) {
    showNotification('وظيفة التعديل قيد التطوير', 'info');
}

function deleteExpense(id) {
    if (confirm('هل أنت متأكد من حذف هذا المصروف؟')) {
        // Delete expense logic here
        showNotification('تم حذف المصروف', 'success');
        loadExpenses();
    }
}

// Check authentication (from main.js)
function checkAuth() {
    const currentUser = localStorage.getItem('currentUser');
    if (!currentUser) {
        window.location.href = '/login.html';
        return;
    }
    
    try {
        const user = JSON.parse(currentUser);
        const userNameElements = document.querySelectorAll('#currentUserName, #mobileCurrentUserName, #headerUserName');
        const userRoleElements = document.querySelectorAll('#currentUserRole, #mobileCurrentUserRole');
        
        userNameElements.forEach(el => {
            if (el) el.textContent = user.username || 'المستخدم';
        });
        
        userRoleElements.forEach(el => {
            if (el) el.textContent = user.role || 'الدور';
        });
        
        // Show admin sections if user is admin
        if (user.role === 'مدير مالي') {
            const adminSections = document.querySelectorAll('#adminSection, #mobileAdminSection');
            adminSections.forEach(section => {
                if (section) section.style.display = 'block';
            });
        }
    } catch (error) {
        console.error('Error parsing user data:', error);
        localStorage.removeItem('currentUser');
        window.location.href = '/login.html';
    }
}

// Logout function
function logout() {
    localStorage.removeItem('currentUser');
    window.location.href = '/login.html';
}

