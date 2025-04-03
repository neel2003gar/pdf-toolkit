# PDF Toolkit

An all-in-one solution for PDF processing with a clean, modern interface. PDF Toolkit allows users to manipulate PDF files in various ways without needing to install specialized software.

## Features

- **Merge PDFs**: Combine multiple PDF files into a single document
- **Split PDF**: Extract specific pages or split a PDF into individual pages
- **Compress PDF**: Reduce PDF file size with adjustable compression levels
- **PDF to DOCX**: Convert PDF documents to editable Word documents
- **PDF to JPG**: Convert PDF pages to JPG images with customizable resolution
- **Optional User Accounts**: Register and login system (not required to use the app)

## Technologies Used

- **Backend**: Python, Flask
- **Frontend**: HTML, CSS, JavaScript
- **PDF Processing**: PyPDF2, pdf2docx, PyMuPDF (fitz)
- **Authentication**: Flask-Login, Flask-Bcrypt
- **Database**: SQLAlchemy with SQLite (configurable for PostgreSQL)

## Installation

1. Clone the repository:
   ```
   git clone https://github.com/yourusername/pdf-toolkit.git
   cd pdf-toolkit
   ```

2. Install dependencies:
   ```
   pip install -r requirements.txt
   ```

3. Run the application:
   ```
   python app.py
   ```

4. Access the application at http://localhost:5000

## Deployment

This application is ready to deploy on platforms like:
- Render
- Railway
- Fly.io

Configuration files for these platforms are included in the repository.

## License

[MIT License](LICENSE)