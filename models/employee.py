from flask import g
import sqlite3

class Employee:
    def __init__(self, id=None, name=None, type=None, project_id=None, salary=None, 
                 payment_type=None, phone=None, id_number=None, start_date=None, notes=None):
        self.id = id
        self.name = name
        self.type = type
        self.project_id = project_id
        self.salary = salary
        self.payment_type = payment_type
        self.phone = phone
        self.id_number = id_number
        self.start_date = start_date
        self.notes = notes

    @staticmethod
    def create_table(db):
        """Create the employees table"""
        db.execute('''
            CREATE TABLE IF NOT EXISTS employees (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                type TEXT NOT NULL,
                project_id INTEGER,
                salary REAL NOT NULL,
                payment_type TEXT NOT NULL,
                phone TEXT,
                id_number TEXT,
                start_date DATE,
                notes TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (project_id) REFERENCES projects (id)
            )
        ''')
        db.commit()

    def save(self, db):
        """Save employee to database"""
        if self.id:
            # Update existing employee
            db.execute('''
                UPDATE employees 
                SET name=?, type=?, project_id=?, salary=?, payment_type=?, 
                    phone=?, id_number=?, start_date=?, notes=?
                WHERE id=?
            ''', (self.name, self.type, self.project_id, self.salary, self.payment_type,
                  self.phone, self.id_number, self.start_date, self.notes, self.id))
        else:
            # Insert new employee
            cursor = db.execute('''
                INSERT INTO employees (name, type, project_id, salary, payment_type, 
                                     phone, id_number, start_date, notes)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            ''', (self.name, self.type, self.project_id, self.salary, self.payment_type,
                  self.phone, self.id_number, self.start_date, self.notes))
            self.id = cursor.lastrowid
        db.commit()
        return self

    @staticmethod
    def get_all(db):
        """Get all employees"""
        cursor = db.execute('SELECT * FROM employees ORDER BY name')
        return [dict(row) for row in cursor.fetchall()]

    @staticmethod
    def get_by_id(db, employee_id):
        """Get employee by ID"""
        cursor = db.execute('SELECT * FROM employees WHERE id = ?', (employee_id,))
        row = cursor.fetchone()
        if row:
            return dict(row)
        return None

    @staticmethod
    def delete(db, employee_id):
        """Delete employee"""
        db.execute('DELETE FROM employees WHERE id = ?', (employee_id,))
        db.commit()

    def to_dict(self):
        """Convert employee to dictionary"""
        return {
            'id': self.id,
            'name': self.name,
            'type': self.type,
            'project_id': self.project_id,
            'salary': self.salary,
            'payment_type': self.payment_type,
            'phone': self.phone,
            'id_number': self.id_number,
            'start_date': self.start_date,
            'notes': self.notes
        }

