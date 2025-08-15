from flask import g
import sqlite3

class Payroll:
    def __init__(self, id=None, employee_id=None, period=None, start_date=None, end_date=None,
                 base_amount=None, bonus=None, deductions=None, overtime=None, total=None,
                 payment_date=None, status='pending', notes=None):
        self.id = id
        self.employee_id = employee_id
        self.period = period
        self.start_date = start_date
        self.end_date = end_date
        self.base_amount = base_amount
        self.bonus = bonus
        self.deductions = deductions
        self.overtime = overtime
        self.total = total
        self.payment_date = payment_date
        self.status = status
        self.notes = notes

    @staticmethod
    def create_table(db):
        """Create the payroll table"""
        db.execute('''
            CREATE TABLE IF NOT EXISTS payroll (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                employee_id INTEGER NOT NULL,
                period TEXT NOT NULL,
                start_date DATE,
                end_date DATE,
                base_amount REAL NOT NULL,
                bonus REAL DEFAULT 0,
                deductions REAL DEFAULT 0,
                overtime REAL DEFAULT 0,
                total REAL NOT NULL,
                payment_date DATE,
                status TEXT DEFAULT 'pending',
                notes TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (employee_id) REFERENCES employees (id)
            )
        ''')
        db.commit()

    def save(self, db):
        """Save payroll record to database"""
        if self.id:
            # Update existing payroll record
            db.execute('''
                UPDATE payroll 
                SET employee_id=?, period=?, start_date=?, end_date=?, base_amount=?, 
                    bonus=?, deductions=?, overtime=?, total=?, payment_date=?, 
                    status=?, notes=?
                WHERE id=?
            ''', (self.employee_id, self.period, self.start_date, self.end_date, 
                  self.base_amount, self.bonus, self.deductions, self.overtime, 
                  self.total, self.payment_date, self.status, self.notes, self.id))
        else:
            # Insert new payroll record
            cursor = db.execute('''
                INSERT INTO payroll (employee_id, period, start_date, end_date, base_amount, 
                                   bonus, deductions, overtime, total, payment_date, status, notes)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ''', (self.employee_id, self.period, self.start_date, self.end_date, 
                  self.base_amount, self.bonus, self.deductions, self.overtime, 
                  self.total, self.payment_date, self.status, self.notes))
            self.id = cursor.lastrowid
        db.commit()
        return self

    @staticmethod
    def get_all(db):
        """Get all payroll records"""
        cursor = db.execute('SELECT * FROM payroll ORDER BY payment_date DESC')
        return [dict(row) for row in cursor.fetchall()]

    @staticmethod
    def get_by_id(db, payroll_id):
        """Get payroll record by ID"""
        cursor = db.execute('SELECT * FROM payroll WHERE id = ?', (payroll_id,))
        row = cursor.fetchone()
        if row:
            return dict(row)
        return None

    @staticmethod
    def get_by_employee(db, employee_id):
        """Get payroll records by employee ID"""
        cursor = db.execute('SELECT * FROM payroll WHERE employee_id = ? ORDER BY payment_date DESC', (employee_id,))
        return [dict(row) for row in cursor.fetchall()]

    @staticmethod
    def delete(db, payroll_id):
        """Delete payroll record"""
        db.execute('DELETE FROM payroll WHERE id = ?', (payroll_id,))
        db.commit()

    def to_dict(self):
        """Convert payroll record to dictionary"""
        return {
            'id': self.id,
            'employee_id': self.employee_id,
            'period': self.period,
            'start_date': self.start_date,
            'end_date': self.end_date,
            'base_amount': self.base_amount,
            'bonus': self.bonus,
            'deductions': self.deductions,
            'overtime': self.overtime,
            'total': self.total,
            'payment_date': self.payment_date,
            'status': self.status,
            'notes': self.notes
        }

