from flask import g
import sqlite3

class Expense:
    def __init__(self, id=None, category=None, project_id=None, description=None, amount=None,
                 date=None, vendor=None, receipt=None, payment_method=None, status='pending', notes=None):
        self.id = id
        self.category = category
        self.project_id = project_id
        self.description = description
        self.amount = amount
        self.date = date
        self.vendor = vendor
        self.receipt = receipt
        self.payment_method = payment_method
        self.status = status
        self.notes = notes

    @staticmethod
    def create_table(db):
        """Create the expenses table"""
        db.execute('''
            CREATE TABLE IF NOT EXISTS expenses (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                category TEXT NOT NULL,
                project_id INTEGER,
                description TEXT NOT NULL,
                amount REAL NOT NULL,
                date DATE NOT NULL,
                vendor TEXT,
                receipt TEXT,
                payment_method TEXT NOT NULL,
                status TEXT DEFAULT 'pending',
                notes TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (project_id) REFERENCES projects (id)
            )
        ''')
        db.commit()

    def save(self, db):
        """Save expense to database"""
        if self.id:
            # Update existing expense
            db.execute('''
                UPDATE expenses 
                SET category=?, project_id=?, description=?, amount=?, date=?, 
                    vendor=?, receipt=?, payment_method=?, status=?, notes=?
                WHERE id=?
            ''', (self.category, self.project_id, self.description, self.amount, self.date,
                  self.vendor, self.receipt, self.payment_method, self.status, self.notes, self.id))
        else:
            # Insert new expense
            cursor = db.execute('''
                INSERT INTO expenses (category, project_id, description, amount, date, 
                                    vendor, receipt, payment_method, status, notes)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ''', (self.category, self.project_id, self.description, self.amount, self.date,
                  self.vendor, self.receipt, self.payment_method, self.status, self.notes))
            self.id = cursor.lastrowid
        db.commit()
        return self

    @staticmethod
    def get_all(db):
        """Get all expenses"""
        cursor = db.execute('SELECT * FROM expenses ORDER BY date DESC')
        return [dict(row) for row in cursor.fetchall()]

    @staticmethod
    def get_by_id(db, expense_id):
        """Get expense by ID"""
        cursor = db.execute('SELECT * FROM expenses WHERE id = ?', (expense_id,))
        row = cursor.fetchone()
        if row:
            return dict(row)
        return None

    @staticmethod
    def get_by_project(db, project_id):
        """Get expenses by project ID"""
        cursor = db.execute('SELECT * FROM expenses WHERE project_id = ? ORDER BY date DESC', (project_id,))
        return [dict(row) for row in cursor.fetchall()]

    @staticmethod
    def get_by_category(db, category):
        """Get expenses by category"""
        cursor = db.execute('SELECT * FROM expenses WHERE category = ? ORDER BY date DESC', (category,))
        return [dict(row) for row in cursor.fetchall()]

    @staticmethod
    def delete(db, expense_id):
        """Delete expense"""
        db.execute('DELETE FROM expenses WHERE id = ?', (expense_id,))
        db.commit()

    def to_dict(self):
        """Convert expense to dictionary"""
        return {
            'id': self.id,
            'category': self.category,
            'project_id': self.project_id,
            'description': self.description,
            'amount': self.amount,
            'date': self.date,
            'vendor': self.vendor,
            'receipt': self.receipt,
            'payment_method': self.payment_method,
            'status': self.status,
            'notes': self.notes
        }

