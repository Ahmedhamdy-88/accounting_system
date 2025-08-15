from flask import Flask, render_template, request, jsonify, session, redirect, url_for, g
from flask_cors import CORS
import sqlite3
from werkzeug.security import generate_password_hash, check_password_hash
import os

app = Flask(__name__, static_folder='static')
app.config['SECRET_KEY'] = 'your_secret_key_here'
CORS(app, supports_credentials=True)

DATABASE = 'src/database/app.db'

def get_db():
    db = getattr(g, '_database', None)
    if db is None:
        db = g._database = sqlite3.connect(DATABASE)
        db.row_factory = sqlite3.Row
    return db

@app.teardown_appcontext
def close_connection(exception):
    db = getattr(g, '_database', None)
    if db is not None:
        db.close()

def init_db():
    with app.app_context():
        # Create database directory if it doesn't exist
        os.makedirs('src/database', exist_ok=True)
        
        db = get_db()
        # Create tables directly since we don't have schema.sql
        db.executescript('''
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                username TEXT UNIQUE NOT NULL,
                password TEXT NOT NULL,
                role TEXT NOT NULL DEFAULT 'user',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
            
            CREATE TABLE IF NOT EXISTS projects (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                type TEXT NOT NULL,
                description TEXT,
                total_budget REAL NOT NULL,
                spent_amount REAL DEFAULT 0,
                start_date DATE,
                end_date DATE,
                status TEXT DEFAULT 'planning',
                created_by INTEGER,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (created_by) REFERENCES users (id)
            );
            
            CREATE TABLE IF NOT EXISTS budget_breakdown (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                project_id INTEGER,
                artists_salaries REAL DEFAULT 0,
                technical_crew REAL DEFAULT 0,
                equipment REAL DEFAULT 0,
                locations REAL DEFAULT 0,
                marketing REAL DEFAULT 0,
                other REAL DEFAULT 0,
                FOREIGN KEY (project_id) REFERENCES projects (id)
            );
            
            CREATE TABLE IF NOT EXISTS salaries (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                project_id INTEGER,
                employee_name TEXT NOT NULL,
                employee_type TEXT NOT NULL,
                amount REAL NOT NULL,
                payment_type TEXT NOT NULL,
                status TEXT DEFAULT 'pending',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (project_id) REFERENCES projects (id)
            );
        ''')
        db.commit()

@app.route('/')
def index():
    return app.send_static_file('index.html')

@app.route('/login.html')
def login_page():
    return app.send_static_file('login.html')

@app.route('/dashboard.html')
def dashboard_page():
    return app.send_static_file('dashboard.html')

@app.route('/users.html')
def users_page():
    return app.send_static_file('users.html')

@app.route('/projects.html')
def projects_page():
    return app.send_static_file('projects.html')

@app.route('/payroll.html')
def payroll_page():
    return app.send_static_file('payroll.html')

@app.route('/transactions.html')
def transactions_page():
    return app.send_static_file('transactions.html')

@app.route('/reports.html')
def reports_page():
    return app.send_static_file('reports.html')

@app.route('/settings.html')
def settings_page():
    return app.send_static_file('settings.html')

# User routes
@app.route('/api/login', methods=['POST'])
def login():
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')

    db = get_db()
    user = db.execute('SELECT * FROM users WHERE username = ?', (username,)).fetchone()

    if user and check_password_hash(user['password'], password):
        session['user_id'] = user['id']
        session['username'] = user['username']
        session['role'] = user['role']
        return jsonify({'message': 'Login successful', 'user': {'username': user['username'], 'role': user['role']}}), 200
    else:
        return jsonify({'error': 'Invalid credentials'}), 401

@app.route('/api/logout', methods=['POST'])
def logout():
    session.pop('user_id', None)
    session.pop('username', None)
    session.pop('role', None)
    return jsonify({'message': 'Logout successful'}), 200

@app.route('/api/current-user')
def current_user():
    if 'user_id' in session:
        return jsonify({'username': session['username'], 'role': session['role']}), 200
    else:
        return jsonify({'error': 'Not logged in'}), 401

@app.route('/api/projects', methods=['GET'])
def get_projects():
    if 'user_id' not in session:
        return jsonify({'error': 'Not logged in'}), 401
    
    db = get_db()
    projects = db.execute('SELECT * FROM projects ORDER BY created_at DESC').fetchall()
    
    projects_list = []
    for project in projects:
        projects_list.append({
            'id': project['id'],
            'name': project['name'],
            'type': project['type'],
            'description': project['description'],
            'total_budget': project['total_budget'],
            'spent_amount': project['spent_amount'],
            'start_date': project['start_date'],
            'end_date': project['end_date'],
            'status': project['status']
        })
    
    return jsonify(projects_list), 200

@app.route('/api/projects', methods=['POST'])
def create_project():
    if 'user_id' not in session:
        return jsonify({'error': 'Not logged in'}), 401
    
    data = request.get_json()
    
    db = get_db()
    cursor = db.execute('''
        INSERT INTO projects (name, type, description, total_budget, start_date, end_date, created_by)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    ''', (
        data['name'],
        data['type'],
        data.get('description', ''),
        data['total_budget'],
        data.get('start_date'),
        data.get('end_date'),
        session['user_id']
    ))
    
    project_id = cursor.lastrowid
    
    # Insert budget breakdown
    budget_breakdown = data.get('budget_breakdown', {})
    db.execute('''
        INSERT INTO budget_breakdown (project_id, artists_salaries, technical_crew, equipment, locations, marketing, other)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    ''', (
        project_id,
        budget_breakdown.get('artists_salaries', 0),
        budget_breakdown.get('technical_crew', 0),
        budget_breakdown.get('equipment', 0),
        budget_breakdown.get('locations', 0),
        budget_breakdown.get('marketing', 0),
        budget_breakdown.get('other', 0)
    ))
    
    db.commit()
    
    return jsonify({'message': 'Project created successfully', 'project_id': project_id}), 201

# Admin route to create initial admin user (for development only)
@app.route('/api/create-admin', methods=['POST'])
def create_admin():
    db = get_db()
    # Check if admin user already exists
    admin_user = db.execute('SELECT * FROM users WHERE username = ?', ('admin',)).fetchone()
    if admin_user:
        return jsonify({'message': 'Admin user already exists'}), 200

    hashed_password = generate_password_hash('admin123')
    db.execute('INSERT INTO users (username, password, role) VALUES (?, ?, ?)',
               ('admin', hashed_password, 'admin'))
    db.commit()
    return jsonify({'message': 'Admin user created'}), 201

# Register payroll blueprint
import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
from routes.payroll import payroll_bp
app.register_blueprint(payroll_bp)

if __name__ == '__main__':
    with app.app_context():
        init_db()
        
        # Initialize payroll tables
        from models.employee import Employee
        from models.payroll import Payroll
        from models.expense import Expense
        
        db = get_db()
        Employee.create_table(db)
        Payroll.create_table(db)
        Expense.create_table(db)
        
        # Create admin user if it doesn't exist
        admin_user = db.execute('SELECT * FROM users WHERE username = ?', ('admin',)).fetchone()
        if not admin_user:
            hashed_password = generate_password_hash('admin123')
            db.execute('INSERT INTO users (username, password, role) VALUES (?, ?, ?)',
                       ('admin', hashed_password, 'admin'))
            db.commit()
            print("Admin user created: username=admin, password=admin123")
    
    app.run(debug=True, host='0.0.0.0', port=5000)

