from flask import Blueprint, request, jsonify, g
from models.employee import Employee
from models.payroll import Payroll
from models.expense import Expense

payroll_bp = Blueprint('payroll', __name__)

# Employee routes
@payroll_bp.route('/api/employees', methods=['GET'])
def get_employees():
    """Get all employees"""
    try:
        db = g.get('_database')
        if not db:
            from main import get_db
            db = get_db()
        
        employees = Employee.get_all(db)
        return jsonify(employees)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@payroll_bp.route('/api/employees', methods=['POST'])
def create_employee():
    """Create a new employee"""
    try:
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['name', 'type', 'salary', 'payment_type', 'start_date']
        for field in required_fields:
            if field not in data or not data[field]:
                return jsonify({'error': f'Missing required field: {field}'}), 400
        
        db = g.get('_database')
        if not db:
            from main import get_db
            db = get_db()
        
        # Create employee
        employee = Employee(
            name=data['name'],
            type=data['type'],
            project_id=data.get('project_id'),
            salary=float(data['salary']),
            payment_type=data['payment_type'],
            phone=data.get('phone'),
            id_number=data.get('id_number'),
            start_date=data['start_date'],
            notes=data.get('notes')
        )
        
        employee.save(db)
        return jsonify(employee.to_dict()), 201
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@payroll_bp.route('/api/employees/<int:employee_id>', methods=['GET'])
def get_employee(employee_id):
    """Get employee by ID"""
    try:
        db = g.get('_database')
        if not db:
            from main import get_db
            db = get_db()
        
        employee = Employee.get_by_id(db, employee_id)
        if not employee:
            return jsonify({'error': 'Employee not found'}), 404
        
        return jsonify(employee)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@payroll_bp.route('/api/employees/<int:employee_id>', methods=['PUT'])
def update_employee(employee_id):
    """Update employee"""
    try:
        data = request.get_json()
        
        db = g.get('_database')
        if not db:
            from main import get_db
            db = get_db()
        
        # Check if employee exists
        existing_employee = Employee.get_by_id(db, employee_id)
        if not existing_employee:
            return jsonify({'error': 'Employee not found'}), 404
        
        # Update employee
        employee = Employee(
            id=employee_id,
            name=data.get('name', existing_employee['name']),
            type=data.get('type', existing_employee['type']),
            project_id=data.get('project_id', existing_employee['project_id']),
            salary=float(data.get('salary', existing_employee['salary'])),
            payment_type=data.get('payment_type', existing_employee['payment_type']),
            phone=data.get('phone', existing_employee['phone']),
            id_number=data.get('id_number', existing_employee['id_number']),
            start_date=data.get('start_date', existing_employee['start_date']),
            notes=data.get('notes', existing_employee['notes'])
        )
        
        employee.save(db)
        return jsonify(employee.to_dict())
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@payroll_bp.route('/api/employees/<int:employee_id>', methods=['DELETE'])
def delete_employee(employee_id):
    """Delete employee"""
    try:
        db = g.get('_database')
        if not db:
            from main import get_db
            db = get_db()
        
        # Check if employee exists
        employee = Employee.get_by_id(db, employee_id)
        if not employee:
            return jsonify({'error': 'Employee not found'}), 404
        
        Employee.delete(db, employee_id)
        return jsonify({'message': 'Employee deleted successfully'})
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Payroll routes
@payroll_bp.route('/api/payroll', methods=['GET'])
def get_payroll_records():
    """Get all payroll records"""
    try:
        db = g.get('_database')
        if not db:
            from main import get_db
            db = get_db()
        
        payroll_records = Payroll.get_all(db)
        return jsonify(payroll_records)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@payroll_bp.route('/api/payroll', methods=['POST'])
def create_payroll_record():
    """Create a new payroll record"""
    try:
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['employee_id', 'period', 'base_amount', 'total', 'payment_date']
        for field in required_fields:
            if field not in data or data[field] is None:
                return jsonify({'error': f'Missing required field: {field}'}), 400
        
        db = g.get('_database')
        if not db:
            from main import get_db
            db = get_db()
        
        # Create payroll record
        payroll = Payroll(
            employee_id=int(data['employee_id']),
            period=data['period'],
            start_date=data.get('start_date'),
            end_date=data.get('end_date'),
            base_amount=float(data['base_amount']),
            bonus=float(data.get('bonus', 0)),
            deductions=float(data.get('deductions', 0)),
            overtime=float(data.get('overtime', 0)),
            total=float(data['total']),
            payment_date=data['payment_date'],
            status=data.get('status', 'pending'),
            notes=data.get('notes')
        )
        
        payroll.save(db)
        return jsonify(payroll.to_dict()), 201
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@payroll_bp.route('/api/payroll/<int:payroll_id>', methods=['GET'])
def get_payroll_record(payroll_id):
    """Get payroll record by ID"""
    try:
        db = g.get('_database')
        if not db:
            from main import get_db
            db = get_db()
        
        payroll = Payroll.get_by_id(db, payroll_id)
        if not payroll:
            return jsonify({'error': 'Payroll record not found'}), 404
        
        return jsonify(payroll)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@payroll_bp.route('/api/payroll/<int:payroll_id>', methods=['PUT'])
def update_payroll_record(payroll_id):
    """Update payroll record"""
    try:
        data = request.get_json()
        
        db = g.get('_database')
        if not db:
            from main import get_db
            db = get_db()
        
        # Check if payroll record exists
        existing_payroll = Payroll.get_by_id(db, payroll_id)
        if not existing_payroll:
            return jsonify({'error': 'Payroll record not found'}), 404
        
        # Update payroll record
        payroll = Payroll(
            id=payroll_id,
            employee_id=int(data.get('employee_id', existing_payroll['employee_id'])),
            period=data.get('period', existing_payroll['period']),
            start_date=data.get('start_date', existing_payroll['start_date']),
            end_date=data.get('end_date', existing_payroll['end_date']),
            base_amount=float(data.get('base_amount', existing_payroll['base_amount'])),
            bonus=float(data.get('bonus', existing_payroll['bonus'])),
            deductions=float(data.get('deductions', existing_payroll['deductions'])),
            overtime=float(data.get('overtime', existing_payroll['overtime'])),
            total=float(data.get('total', existing_payroll['total'])),
            payment_date=data.get('payment_date', existing_payroll['payment_date']),
            status=data.get('status', existing_payroll['status']),
            notes=data.get('notes', existing_payroll['notes'])
        )
        
        payroll.save(db)
        return jsonify(payroll.to_dict())
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@payroll_bp.route('/api/payroll/<int:payroll_id>', methods=['DELETE'])
def delete_payroll_record(payroll_id):
    """Delete payroll record"""
    try:
        db = g.get('_database')
        if not db:
            from main import get_db
            db = get_db()
        
        # Check if payroll record exists
        payroll = Payroll.get_by_id(db, payroll_id)
        if not payroll:
            return jsonify({'error': 'Payroll record not found'}), 404
        
        Payroll.delete(db, payroll_id)
        return jsonify({'message': 'Payroll record deleted successfully'})
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Expense routes
@payroll_bp.route('/api/expenses', methods=['GET'])
def get_expenses():
    """Get all expenses"""
    try:
        db = g.get('_database')
        if not db:
            from main import get_db
            db = get_db()
        
        expenses = Expense.get_all(db)
        return jsonify(expenses)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@payroll_bp.route('/api/expenses', methods=['POST'])
def create_expense():
    """Create a new expense"""
    try:
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['category', 'description', 'amount', 'date', 'payment_method']
        for field in required_fields:
            if field not in data or not data[field]:
                return jsonify({'error': f'Missing required field: {field}'}), 400
        
        db = g.get('_database')
        if not db:
            from main import get_db
            db = get_db()
        
        # Create expense
        expense = Expense(
            category=data['category'],
            project_id=data.get('project_id'),
            description=data['description'],
            amount=float(data['amount']),
            date=data['date'],
            vendor=data.get('vendor'),
            receipt=data.get('receipt'),
            payment_method=data['payment_method'],
            status=data.get('status', 'pending'),
            notes=data.get('notes')
        )
        
        expense.save(db)
        return jsonify(expense.to_dict()), 201
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@payroll_bp.route('/api/expenses/<int:expense_id>', methods=['GET'])
def get_expense(expense_id):
    """Get expense by ID"""
    try:
        db = g.get('_database')
        if not db:
            from main import get_db
            db = get_db()
        
        expense = Expense.get_by_id(db, expense_id)
        if not expense:
            return jsonify({'error': 'Expense not found'}), 404
        
        return jsonify(expense)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@payroll_bp.route('/api/expenses/<int:expense_id>', methods=['PUT'])
def update_expense(expense_id):
    """Update expense"""
    try:
        data = request.get_json()
        
        db = g.get('_database')
        if not db:
            from main import get_db
            db = get_db()
        
        # Check if expense exists
        existing_expense = Expense.get_by_id(db, expense_id)
        if not existing_expense:
            return jsonify({'error': 'Expense not found'}), 404
        
        # Update expense
        expense = Expense(
            id=expense_id,
            category=data.get('category', existing_expense['category']),
            project_id=data.get('project_id', existing_expense['project_id']),
            description=data.get('description', existing_expense['description']),
            amount=float(data.get('amount', existing_expense['amount'])),
            date=data.get('date', existing_expense['date']),
            vendor=data.get('vendor', existing_expense['vendor']),
            receipt=data.get('receipt', existing_expense['receipt']),
            payment_method=data.get('payment_method', existing_expense['payment_method']),
            status=data.get('status', existing_expense['status']),
            notes=data.get('notes', existing_expense['notes'])
        )
        
        expense.save(db)
        return jsonify(expense.to_dict())
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@payroll_bp.route('/api/expenses/<int:expense_id>', methods=['DELETE'])
def delete_expense(expense_id):
    """Delete expense"""
    try:
        db = g.get('_database')
        if not db:
            from main import get_db
            db = get_db()
        
        # Check if expense exists
        expense = Expense.get_by_id(db, expense_id)
        if not expense:
            return jsonify({'error': 'Expense not found'}), 404
        
        Expense.delete(db, expense_id)
        return jsonify({'message': 'Expense deleted successfully'})
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

