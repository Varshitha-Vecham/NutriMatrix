# NutriMatrix Installation

These commands are for Windows PowerShell.

1. **Install the Node.js dependencies**
   ```powershell
   npm install
   ```

2. **Create and activate the Python virtual environment**
   ```powershell
   py -m venv .venv
   .\.venv\Scripts\Activate.ps1
   python -m pip install --upgrade pip
   python -m pip install Flask flask-cors Pillow opencv-python numpy pytesseract python-dotenv mysql-connector-python
   ```

3. **Install Tesseract OCR**

   Install Tesseract OCR for Windows and make sure it is available at:
   `C:\Program Files\Tesseract-OCR\tesseract.exe`

4. **Create the database**
   ```powershell
   mysql -u root -p < server/schema.sql
   ```

5. **Configure the API**

   Create a `.env` file in the project root with your MySQL settings and secrets:
   ```dotenv
   DB_HOST=localhost
   DB_PORT=3306
   DB_USER=root
   DB_PASSWORD=your_mysql_password
   DB_NAME=nutrimatrix
   JWT_SECRET=your_strong_secret
   OTP_SECRET=another_long_random_secret
   API_PORT=3001
   CLIENT_URL=http://localhost:5173
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=465
   SMTP_USER=your_email@gmail.com
   SMTP_PASSWORD=your_google_app_password
   SMTP_FROM=NutriMatrix <your_email@gmail.com>
   ```

   Email verification uses SMTP through Nodemailer. For a free college/demo setup, use a Gmail account with 2-Step Verification enabled and create an App Password; use that App Password as `SMTP_PASSWORD` (not your normal Gmail password). Keep all mail credentials and secrets in `.env`, which is ignored by Git. The API sends 6-digit codes that expire after five minutes and never returns them to the frontend.

6. **Start the frontend, Node.js API, and Flask OCR service**
   ```powershell
   npm run dev
   ```

7. Open `http://localhost:5173` in your browser.
