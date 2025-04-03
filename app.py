# filepath: c:\python projects\pdf_merger\app.py
import os
import tempfile
import zipfile
from flask import Flask, render_template, request, redirect, url_for, send_file, jsonify, flash, session
from werkzeug.utils import secure_filename
import PyPDF2
from io import BytesIO
from pdf2docx import Converter
import fitz  # PyMuPDF
from PIL import Image
import shutil
from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas
from flask_sqlalchemy import SQLAlchemy
from flask_login import LoginManager, UserMixin, login_user, logout_user, current_user, login_required
from flask_bcrypt import Bcrypt
from datetime import datetime
import secrets

app = Flask(__name__)
# Secret key for session management and CSRF protection
app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', secrets.token_hex(16))
# Database configuration - use PostgreSQL in production if available
database_url = os.environ.get('DATABASE_URL', 'sqlite:///pdftoolkit.db')
# Fix for Heroku PostgreSQL URL format
if database_url.startswith("postgres://"):
    database_url = database_url.replace("postgres://", "postgresql://", 1)
app.config['SQLALCHEMY_DATABASE_URI'] = database_url
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
# Upload folder configuration
app.config['UPLOAD_FOLDER'] = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'uploads')
app.config['ALLOWED_EXTENSIONS'] = {'pdf'}
app.config['MAX_CONTENT_LENGTH'] = 32 * 1024 * 1024  # 32MB max file size

# Initialize extensions
db = SQLAlchemy(app)
bcrypt = Bcrypt(app)
login_manager = LoginManager(app)
login_manager.login_view = 'login'
login_manager.login_message = 'Please log in to access this page (or continue using the app without an account)'
login_manager.login_message_category = 'info'

# Ensure upload directory exists
os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)

# User model for database
class User(db.Model, UserMixin):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(50), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password = db.Column(db.String(60), nullable=False)
    date_registered = db.Column(db.DateTime, default=datetime.utcnow)
    
    def __repr__(self):
        return f"User('{self.username}', '{self.email}')"

@login_manager.user_loader
def load_user(user_id):
    return User.query.get(int(user_id))

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in app.config['ALLOWED_EXTENSIONS']

# Create the database tables
with app.app_context():
    db.create_all()

# Authentication routes
@app.route('/register', methods=['GET', 'POST'])
def register():
    if current_user.is_authenticated:
        return redirect(url_for('index'))
    
    if request.method == 'POST':
        username = request.form.get('username')
        email = request.form.get('email')
        password = request.form.get('password')
        confirm_password = request.form.get('confirm_password')
        
        # Check if username or email already exists
        user_exists = User.query.filter_by(username=username).first()
        email_exists = User.query.filter_by(email=email).first()
        
        if user_exists:
            flash('Username already exists. Please choose a different one.', 'danger')
            return render_template('register.html')
        
        if email_exists:
            flash('Email already registered. Please use a different one.', 'danger')
            return render_template('register.html')
        
        if password != confirm_password:
            flash('Passwords do not match.', 'danger')
            return render_template('register.html')
        
        # Create new user with hashed password
        hashed_password = bcrypt.generate_password_hash(password).decode('utf-8')
        new_user = User(username=username, email=email, password=hashed_password)
        db.session.add(new_user)
        db.session.commit()
        
        flash('Your account has been created! You can now log in.', 'success')
        return redirect(url_for('login'))
    
    return render_template('register.html')

@app.route('/login', methods=['GET', 'POST'])
def login():
    if current_user.is_authenticated:
        return redirect(url_for('index'))
    
    if request.method == 'POST':
        email = request.form.get('email')
        password = request.form.get('password')
        remember = 'remember' in request.form
        
        user = User.query.filter_by(email=email).first()
        
        if user and bcrypt.check_password_hash(user.password, password):
            login_user(user, remember=remember)
            next_page = request.args.get('next')
            flash('Login successful!', 'success')
            return redirect(next_page) if next_page else redirect(url_for('index'))
        else:
            flash('Login unsuccessful. Please check email and password.', 'danger')
    
    return render_template('login.html')

@app.route('/logout')
def logout():
    logout_user()
    flash('You have been logged out.', 'info')
    return redirect(url_for('index'))

@app.route('/account')
@login_required
def account():
    return render_template('account.html')

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/merge', methods=['POST'])
def merge_pdfs():
    if 'files[]' not in request.files:
        return redirect(request.url)
    
    files = request.files.getlist('files[]')
    
    # Check if files are provided and valid
    if not files or files[0].filename == '':
        return render_template('index.html', error='No files selected')
    
    # Check if all files are PDFs
    if not all(allowed_file(file.filename) for file in files):
        return render_template('index.html', error='Only PDF files are allowed')
    
    # Create merger object
    merger = PyPDF2.PdfMerger()
    
    try:
        # Add each PDF to the merger
        for file in files:
            file_stream = BytesIO(file.read())
            merger.append(file_stream)
        
        # Write merged PDF to BytesIO stream
        output_stream = BytesIO()
        merger.write(output_stream)
        output_stream.seek(0)
        
        # Close merger
        merger.close()
        
        # Return merged PDF as a download
        return send_file(
            output_stream,
            as_attachment=True,
            download_name='merged.pdf',
            mimetype='application/pdf'
        )
    
    except Exception as e:
        return render_template('index.html', error=f'Error merging PDFs: {str(e)}')

@app.route('/split', methods=['POST'])
def split_pdf():
    if 'file' not in request.files:
        return redirect(request.url)
    
    file = request.files['file']
    split_method = request.form.get('split_method', 'all')
    
    # Check if file is provided and valid
    if file.filename == '':
        return render_template('index.html', error='No file selected')
    
    if not allowed_file(file.filename):
        return render_template('index.html', error='Only PDF files are allowed')
    
    try:
        pdf_bytes = BytesIO(file.read())
        pdf_reader = PyPDF2.PdfReader(pdf_bytes)
        total_pages = len(pdf_reader.pages)
        
        if split_method == 'range':
            # Get page range from form
            page_range = request.form.get('page_range', '')
            
            # Parse page range (format: "1-3,5,7-9")
            pages_to_extract = []
            for part in page_range.split(','):
                if '-' in part:
                    start, end = map(int, part.split('-'))
                    pages_to_extract.extend(range(start - 1, end))
                else:
                    pages_to_extract.append(int(part) - 1)
            
            # Create a single PDF with selected pages
            output = PyPDF2.PdfWriter()
            for page_num in pages_to_extract:
                if 0 <= page_num < total_pages:
                    output.add_page(pdf_reader.pages[page_num])
            
            # Save to BytesIO and return
            output_stream = BytesIO()
            output.write(output_stream)
            output_stream.seek(0)
            
            return send_file(
                output_stream,
                as_attachment=True,
                download_name='split_pages.pdf',
                mimetype='application/pdf'
            )
            
        else:  # split_method == 'all'
            # Create a zip file containing individual pages
            with tempfile.TemporaryDirectory() as temp_dir:
                zip_path = os.path.join(temp_dir, 'pages.zip')
                
                with zipfile.ZipFile(zip_path, 'w') as zipf:
                    for page_num in range(total_pages):
                        output = PyPDF2.PdfWriter()
                        output.add_page(pdf_reader.pages[page_num])
                        
                        # Save page to temporary file
                        page_path = os.path.join(temp_dir, f'page_{page_num + 1}.pdf')
                        with open(page_path, 'wb') as f:
                            output.write(f)
                        
                        # Add to zip file
                        zipf.write(page_path, f'page_{page_num + 1}.pdf')
                
                # Return zip file
                return send_file(
                    zip_path,
                    as_attachment=True,
                    download_name='split_pages.zip',
                    mimetype='application/zip'
                )
    
    except Exception as e:
        return render_template('index.html', error=f'Error splitting PDF: {str(e)}')

@app.route('/compress', methods=['POST'])
def compress_pdf():
    if 'file' not in request.files:
        return redirect(request.url)
    
    file = request.files['file']
    compression_level = request.form.get('compression_level', 'medium')
    
    # Check if file is provided and valid
    if file.filename == '':
        return render_template('index.html', error='No file selected')
    
    if not allowed_file(file.filename):
        return render_template('index.html', error='Only PDF files are allowed')
    
    try:
        # Read the input PDF
        pdf_bytes = BytesIO(file.read())
        
        # Determine compression parameters based on level
        if compression_level == 'low':
            quality = 95
        elif compression_level == 'high':
            quality = 60
        else:  # medium (default)
            quality = 80
        
        # Create output stream directly in memory
        output_stream = BytesIO()
        
        # Open with PyMuPDF
        doc = fitz.open(stream=pdf_bytes, filetype="pdf")
        
        # Save with compression options directly to memory
        doc.save(
            output_stream,
            garbage=4,  # Maximum garbage collection
            deflate=True,  # Use deflate compression for streams
            clean=True,  # Clean content streams
            linear=True,  # Optimize for web
        )
        
        # Close the document
        doc.close()
        
        # Reset stream position
        output_stream.seek(0)
        
        # Return the compressed PDF directly from memory
        return send_file(
            output_stream,
            as_attachment=True,
            download_name='compressed.pdf',
            mimetype='application/pdf'
        )
    
    except Exception as e:
        return render_template('index.html', error=f'Error compressing PDF: {str(e)}')

@app.route('/pdf-to-docx', methods=['POST'])
def pdf_to_docx():
    if 'file' not in request.files:
        return redirect(request.url)
    
    file = request.files['file']
    
    # Check if file is provided and valid
    if file.filename == '':
        return render_template('index.html', error='No file selected')
    
    if not allowed_file(file.filename):
        return render_template('index.html', error='Only PDF files are allowed')
    
    try:
        # Create temporary directory
        with tempfile.TemporaryDirectory() as temp_dir:
            # Save uploaded PDF to temp directory
            pdf_path = os.path.join(temp_dir, 'input.pdf')
            with open(pdf_path, 'wb') as f:
                f.write(file.read())
            
            # Output DOCX path
            docx_path = os.path.join(temp_dir, 'output.docx')
            
            # Convert PDF to DOCX
            cv = Converter(pdf_path)
            cv.convert(docx_path)
            cv.close()
            
            # Read the DOCX file into memory
            with open(docx_path, 'rb') as docx_file:
                docx_data = BytesIO(docx_file.read())
            
            # Return the DOCX file from memory
            docx_data.seek(0)
            return send_file(
                docx_data,
                as_attachment=True,
                download_name=os.path.splitext(file.filename)[0] + '.docx',
                mimetype='application/vnd.openxmlformats-officedocument.wordprocessingml.document'
            )
    
    except Exception as e:
        return render_template('index.html', error=f'Error converting PDF to DOCX: {str(e)}')

@app.route('/pdf-to-jpg', methods=['POST'])
def pdf_to_jpg():
    if 'file' not in request.files:
        return redirect(request.url)
    
    file = request.files['file']
    dpi = int(request.form.get('dpi', 300))  # Default 300 DPI
    
    # Check if file is provided and valid
    if file.filename == '':
        return render_template('index.html', error='No file selected')
    
    if not allowed_file(file.filename):
        return render_template('index.html', error='Only PDF files are allowed')
    
    try:
        # Create temporary directory for all file operations
        with tempfile.TemporaryDirectory() as temp_dir:
            # Read PDF data into memory
            pdf_data = BytesIO(file.read())
            pdf_document = fitz.open(stream=pdf_data, filetype="pdf")
            
            # Single page PDF - return an image directly
            if pdf_document.page_count == 1:
                page = pdf_document[0]
                zoom = dpi / 72  # Default DPI in PyMuPDF is 72
                matrix = fitz.Matrix(zoom, zoom)
                pix = page.get_pixmap(matrix=matrix)
                
                # Save image to temporary file first
                img_path = os.path.join(temp_dir, 'page_1.jpg')
                pix.save(img_path, "jpeg")
                
                # Close document
                pdf_document.close()
                
                # Read the image into memory
                with open(img_path, 'rb') as img_file:
                    img_data = BytesIO(img_file.read())
                
                # Return the image from memory
                img_data.seek(0)
                return send_file(
                    img_data,
                    as_attachment=True,
                    download_name=os.path.splitext(file.filename)[0] + '.jpg',
                    mimetype='image/jpeg'
                )
            
            # Multiple pages - create ZIP with all images
            else:
                # Create ZIP file in memory
                zip_path = os.path.join(temp_dir, 'images.zip')
                
                with zipfile.ZipFile(zip_path, 'w') as zipf:
                    for page_index in range(pdf_document.page_count):
                        page = pdf_document[page_index]
                        zoom = dpi / 72
                        matrix = fitz.Matrix(zoom, zoom)
                        pix = page.get_pixmap(matrix=matrix)
                        
                        # Save image to temporary file
                        img_path = os.path.join(temp_dir, f'page_{page_index + 1}.jpg')
                        pix.save(img_path, "jpeg")
                        
                        # Add to zip
                        zipf.write(img_path, f'page_{page_index + 1}.jpg')
                
                # Close document
                pdf_document.close()
                
                # Read the zip file into memory
                with open(zip_path, 'rb') as zip_file:
                    zip_data = BytesIO(zip_file.read())
                
                # Return the zip from memory
                zip_data.seek(0)
                return send_file(
                    zip_data,
                    as_attachment=True,
                    download_name=os.path.splitext(file.filename)[0] + '_images.zip',
                    mimetype='application/zip'
                )
    
    except Exception as e:
        return render_template('index.html', error=f'Error converting PDF to JPG: {str(e)}')

if __name__ == '__main__':
    # Run the app
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port)