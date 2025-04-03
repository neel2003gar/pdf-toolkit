// JavaScript for PDF Toolkit Application

document.addEventListener('DOMContentLoaded', function() {
    // Tab functionality
    const tabButtons = document.querySelectorAll('.tab-button');
    const tabPanes = document.querySelectorAll('.tab-pane');
    
    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            // Remove active class from all buttons and panes
            tabButtons.forEach(btn => btn.classList.remove('active'));
            tabPanes.forEach(pane => pane.classList.remove('active'));
            
            // Add active class to current button and corresponding pane
            button.classList.add('active');
            const tabId = button.getAttribute('data-tab');
            document.getElementById(tabId).classList.add('active');
        });
    });
    
    // Setup for each feature tab
    setupMergePDFs();
    setupSplitPDF();
    setupCompressPDF();
    setupPdfToDocx();
    setupPdfToJpg();
    
    // Setup refresh buttons
    setupRefreshButtons();
    
    // ---------- Merge PDFs Feature ----------
    function setupMergePDFs() {
        const uploadArea = document.getElementById('uploadAreaMerge');
        const fileInput = document.getElementById('file-input-merge');
        const browseBtn = document.getElementById('browseBtnMerge');
        const fileList = document.getElementById('fileListMerge');
        const mergeBtn = document.getElementById('mergeBtnSubmit');
        
        // Files array to keep track of selected files
        let selectedFiles = [];
        
        // Trigger file input when browse button is clicked
        browseBtn.addEventListener('click', function() {
            fileInput.click();
        });
        
        // Handle file selection
        fileInput.addEventListener('change', function() {
            handleFiles(this.files);
        });
        
        // Drag and drop events
        setupDragAndDrop(uploadArea, handleFiles);
        
        // Process selected files
        function handleFiles(files) {
            const fileArray = Array.from(files);
            
            // Filter for PDF files only
            const pdfFiles = fileArray.filter(file => file.type === 'application/pdf');
            
            if (pdfFiles.length === 0) {
                showError('Please select PDF files only.');
                return;
            }
            
            // Add files to our array and render the list
            pdfFiles.forEach(file => {
                // Check if file is already in the list
                if (!selectedFiles.some(existingFile => existingFile.name === file.name && existingFile.size === file.size)) {
                    selectedFiles.push(file);
                }
            });
            
            updateFileList();
        }
        
        // Update the file list UI
        function updateFileList() {
            // Clear the list
            fileList.innerHTML = '';
            
            // Add each file to the list
            selectedFiles.forEach((file, index) => {
                const fileItem = document.createElement('div');
                fileItem.className = 'file-item';
                
                const fileInfo = document.createElement('div');
                fileInfo.className = 'file-info';
                
                const fileIcon = document.createElement('i');
                fileIcon.className = 'fas fa-file-pdf file-icon';
                
                const fileName = document.createElement('span');
                fileName.className = 'file-name';
                fileName.textContent = file.name;
                
                const fileActions = document.createElement('div');
                fileActions.className = 'file-actions';
                
                const removeBtn = document.createElement('button');
                removeBtn.innerHTML = '<i class="fas fa-times"></i>';
                removeBtn.title = 'Remove file';
                removeBtn.addEventListener('click', function() {
                    removeFile(index);
                });
                
                fileInfo.appendChild(fileIcon);
                fileInfo.appendChild(fileName);
                fileActions.appendChild(removeBtn);
                fileItem.appendChild(fileInfo);
                fileItem.appendChild(fileActions);
                fileList.appendChild(fileItem);
            });
            
            // Enable or disable merge button
            mergeBtn.disabled = selectedFiles.length < 2;
            
            // Show/hide file list
            fileList.style.display = selectedFiles.length > 0 ? 'block' : 'none';
        }
        
        // Remove a file from the list
        function removeFile(index) {
            selectedFiles.splice(index, 1);
            updateFileList();
        }
    }
    
    // ---------- Split PDF Feature ----------
    function setupSplitPDF() {
        const uploadArea = document.getElementById('uploadAreaSplit');
        const fileInput = document.getElementById('file-input-split');
        const browseBtn = document.getElementById('browseBtnSplit');
        const filePreview = document.getElementById('filePreviewSplit');
        const splitBtn = document.getElementById('splitBtnSubmit');
        
        let selectedFile = null;
        
        // Radio buttons for split options
        const splitMethodRadios = document.querySelectorAll('input[name="split_method"]');
        const pageRangeInput = document.getElementById('page_range');
        
        // Show/hide page range input based on selected option
        splitMethodRadios.forEach(radio => {
            radio.addEventListener('change', function() {
                const subOption = document.querySelector('.sub-option');
                if (this.value === 'range') {
                    subOption.style.display = 'block';
                } else {
                    subOption.style.display = 'none';
                }
            });
        });
        
        // Initial state
        document.querySelector('.sub-option').style.display = 'none';
        
        // Trigger file input when browse button is clicked
        browseBtn.addEventListener('click', function() {
            fileInput.click();
        });
        
        // Handle file selection
        fileInput.addEventListener('change', function() {
            handleFile(this.files[0]);
        });
        
        // Drag and drop events
        setupDragAndDrop(uploadArea, files => handleFile(files[0]));
        
        function handleFile(file) {
            if (!file) return;
            
            if (file.type !== 'application/pdf') {
                showError('Please select a PDF file only.');
                return;
            }
            
            selectedFile = file;
            
            // Display file preview
            filePreview.innerHTML = '';
            filePreview.style.display = 'block';
            
            const fileItem = document.createElement('div');
            fileItem.className = 'file-item';
            
            const fileInfo = document.createElement('div');
            fileInfo.className = 'file-info';
            
            const fileIcon = document.createElement('i');
            fileIcon.className = 'fas fa-file-pdf file-icon';
            
            const fileName = document.createElement('span');
            fileName.className = 'file-name';
            fileName.textContent = file.name;
            
            const fileActions = document.createElement('div');
            fileActions.className = 'file-actions';
            
            const removeBtn = document.createElement('button');
            removeBtn.innerHTML = '<i class="fas fa-times"></i>';
            removeBtn.title = 'Remove file';
            removeBtn.addEventListener('click', function() {
                selectedFile = null;
                filePreview.style.display = 'none';
                splitBtn.disabled = true;
            });
            
            fileInfo.appendChild(fileIcon);
            fileInfo.appendChild(fileName);
            fileActions.appendChild(removeBtn);
            fileItem.appendChild(fileInfo);
            fileItem.appendChild(fileActions);
            filePreview.appendChild(fileItem);
            
            // Enable split button
            splitBtn.disabled = false;
        }
    }
    
    // ---------- Compress PDF Feature ----------
    function setupCompressPDF() {
        const uploadArea = document.getElementById('uploadAreaCompress');
        const fileInput = document.getElementById('file-input-compress');
        const browseBtn = document.getElementById('browseBtnCompress');
        const filePreview = document.getElementById('filePreviewCompress');
        const compressBtn = document.getElementById('compressBtnSubmit');
        
        let selectedFile = null;
        
        // Trigger file input when browse button is clicked
        browseBtn.addEventListener('click', function() {
            fileInput.click();
        });
        
        // Handle file selection
        fileInput.addEventListener('change', function() {
            handleFile(this.files[0]);
        });
        
        // Drag and drop events
        setupDragAndDrop(uploadArea, files => handleFile(files[0]));
        
        function handleFile(file) {
            if (!file) return;
            
            if (file.type !== 'application/pdf') {
                showError('Please select a PDF file only.');
                return;
            }
            
            selectedFile = file;
            
            // Display file preview
            filePreview.innerHTML = '';
            filePreview.style.display = 'block';
            
            const fileItem = document.createElement('div');
            fileItem.className = 'file-item';
            
            const fileInfo = document.createElement('div');
            fileInfo.className = 'file-info';
            
            const fileIcon = document.createElement('i');
            fileIcon.className = 'fas fa-file-pdf file-icon';
            
            const fileName = document.createElement('span');
            fileName.className = 'file-name';
            fileName.textContent = file.name;
            
            const fileActions = document.createElement('div');
            fileActions.className = 'file-actions';
            
            const removeBtn = document.createElement('button');
            removeBtn.innerHTML = '<i class="fas fa-times"></i>';
            removeBtn.title = 'Remove file';
            removeBtn.addEventListener('click', function() {
                selectedFile = null;
                filePreview.style.display = 'none';
                compressBtn.disabled = true;
            });
            
            fileInfo.appendChild(fileIcon);
            fileInfo.appendChild(fileName);
            fileActions.appendChild(removeBtn);
            fileItem.appendChild(fileInfo);
            fileItem.appendChild(fileActions);
            filePreview.appendChild(fileItem);
            
            // Enable compress button
            compressBtn.disabled = false;
        }
    }
    
    // ---------- PDF to DOCX Feature ----------
    function setupPdfToDocx() {
        const uploadArea = document.getElementById('uploadAreaDocx');
        const fileInput = document.getElementById('file-input-docx');
        const browseBtn = document.getElementById('browseBtnDocx');
        const filePreview = document.getElementById('filePreviewDocx');
        const convertBtn = document.getElementById('docxBtnSubmit');
        
        let selectedFile = null;
        
        // Trigger file input when browse button is clicked
        browseBtn.addEventListener('click', function() {
            fileInput.click();
        });
        
        // Handle file selection
        fileInput.addEventListener('change', function() {
            handleFile(this.files[0]);
        });
        
        // Drag and drop events
        setupDragAndDrop(uploadArea, files => handleFile(files[0]));
        
        function handleFile(file) {
            if (!file) return;
            
            if (file.type !== 'application/pdf') {
                showError('Please select a PDF file only.');
                return;
            }
            
            selectedFile = file;
            
            // Display file preview
            filePreview.innerHTML = '';
            filePreview.style.display = 'block';
            
            const fileItem = document.createElement('div');
            fileItem.className = 'file-item';
            
            const fileInfo = document.createElement('div');
            fileInfo.className = 'file-info';
            
            const fileIcon = document.createElement('i');
            fileIcon.className = 'fas fa-file-pdf file-icon';
            
            const fileName = document.createElement('span');
            fileName.className = 'file-name';
            fileName.textContent = file.name;
            
            const fileActions = document.createElement('div');
            fileActions.className = 'file-actions';
            
            const removeBtn = document.createElement('button');
            removeBtn.innerHTML = '<i class="fas fa-times"></i>';
            removeBtn.title = 'Remove file';
            removeBtn.addEventListener('click', function() {
                selectedFile = null;
                filePreview.style.display = 'none';
                convertBtn.disabled = true;
            });
            
            fileInfo.appendChild(fileIcon);
            fileInfo.appendChild(fileName);
            fileActions.appendChild(removeBtn);
            fileItem.appendChild(fileInfo);
            fileItem.appendChild(fileActions);
            filePreview.appendChild(fileItem);
            
            // Enable convert button
            convertBtn.disabled = false;
        }
    }
    
    // ---------- PDF to JPG Feature ----------
    function setupPdfToJpg() {
        const uploadArea = document.getElementById('uploadAreaJpg');
        const fileInput = document.getElementById('file-input-jpg');
        const browseBtn = document.getElementById('browseBtnJpg');
        const filePreview = document.getElementById('filePreviewJpg');
        const convertBtn = document.getElementById('jpgBtnSubmit');
        
        let selectedFile = null;
        
        // Trigger file input when browse button is clicked
        browseBtn.addEventListener('click', function() {
            fileInput.click();
        });
        
        // Handle file selection
        fileInput.addEventListener('change', function() {
            handleFile(this.files[0]);
        });
        
        // Drag and drop events
        setupDragAndDrop(uploadArea, files => handleFile(files[0]));
        
        function handleFile(file) {
            if (!file) return;
            
            if (file.type !== 'application/pdf') {
                showError('Please select a PDF file only.');
                return;
            }
            
            selectedFile = file;
            
            // Display file preview
            filePreview.innerHTML = '';
            filePreview.style.display = 'block';
            
            const fileItem = document.createElement('div');
            fileItem.className = 'file-item';
            
            const fileInfo = document.createElement('div');
            fileInfo.className = 'file-info';
            
            const fileIcon = document.createElement('i');
            fileIcon.className = 'fas fa-file-pdf file-icon';
            
            const fileName = document.createElement('span');
            fileName.className = 'file-name';
            fileName.textContent = file.name;
            
            const fileActions = document.createElement('div');
            fileActions.className = 'file-actions';
            
            const removeBtn = document.createElement('button');
            removeBtn.innerHTML = '<i class="fas fa-times"></i>';
            removeBtn.title = 'Remove file';
            removeBtn.addEventListener('click', function() {
                selectedFile = null;
                filePreview.style.display = 'none';
                convertBtn.disabled = true;
            });
            
            fileInfo.appendChild(fileIcon);
            fileInfo.appendChild(fileName);
            fileActions.appendChild(removeBtn);
            fileItem.appendChild(fileInfo);
            fileItem.appendChild(fileActions);
            filePreview.appendChild(fileItem);
            
            // Enable convert button
            convertBtn.disabled = false;
        }
    }
    
    // ---------- Utility Functions ----------
    
    // Setup drag and drop functionality for an element
    function setupDragAndDrop(element, handleFilesCallback) {
        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
            element.addEventListener(eventName, preventDefaults, false);
        });
        
        function preventDefaults(e) {
            e.preventDefault();
            e.stopPropagation();
        }
        
        ['dragenter', 'dragover'].forEach(eventName => {
            element.addEventListener(eventName, () => {
                element.classList.add('dragover');
            }, false);
        });
        
        ['dragleave', 'drop'].forEach(eventName => {
            element.addEventListener(eventName, () => {
                element.classList.remove('dragover');
            }, false);
        });
        
        // Handle dropped files
        element.addEventListener('drop', function(e) {
            const dt = e.dataTransfer;
            const files = dt.files;
            handleFilesCallback(files);
        });
    }
    
    // Setup refresh buttons for all forms
    function setupRefreshButtons() {
        // Get all refresh buttons
        const refreshButtons = {
            merge: document.getElementById('refreshMerge'),
            split: document.getElementById('refreshSplit'),
            compress: document.getElementById('refreshCompress'),
            docx: document.getElementById('refreshDocx'),
            jpg: document.getElementById('refreshJpg')
        };
        
        // Get all forms
        const forms = {
            merge: document.getElementById('mergeForm'),
            split: document.getElementById('splitForm'),
            compress: document.getElementById('compressForm'),
            docx: document.getElementById('docxForm'),
            jpg: document.getElementById('jpgForm')
        };
        
        // Add click event listeners to each refresh button
        refreshButtons.merge.addEventListener('click', function() {
            resetForm('merge');
        });
        
        refreshButtons.split.addEventListener('click', function() {
            resetForm('split');
        });
        
        refreshButtons.compress.addEventListener('click', function() {
            resetForm('compress');
        });
        
        refreshButtons.docx.addEventListener('click', function() {
            resetForm('docx');
        });
        
        refreshButtons.jpg.addEventListener('click', function() {
            resetForm('jpg');
        });
        
        // Function to reset a form
        function resetForm(formType) {
            // Reset the form
            forms[formType].reset();
            
            // Clear file previews based on form type
            switch(formType) {
                case 'merge':
                    document.getElementById('fileListMerge').innerHTML = '';
                    document.getElementById('fileListMerge').style.display = 'none';
                    document.getElementById('mergeBtnSubmit').disabled = true;
                    // Reset the global variable for merge
                    window.selectedFiles = [];
                    break;
                    
                case 'split':
                    document.getElementById('filePreviewSplit').innerHTML = '';
                    document.getElementById('filePreviewSplit').style.display = 'none';
                    document.getElementById('splitBtnSubmit').disabled = true;
                    // Hide page range input if it's visible
                    document.querySelector('.sub-option').style.display = 'none';
                    break;
                    
                case 'compress':
                    document.getElementById('filePreviewCompress').innerHTML = '';
                    document.getElementById('filePreviewCompress').style.display = 'none';
                    document.getElementById('compressBtnSubmit').disabled = true;
                    break;
                    
                case 'docx':
                    document.getElementById('filePreviewDocx').innerHTML = '';
                    document.getElementById('filePreviewDocx').style.display = 'none';
                    document.getElementById('docxBtnSubmit').disabled = true;
                    break;
                    
                case 'jpg':
                    document.getElementById('filePreviewJpg').innerHTML = '';
                    document.getElementById('filePreviewJpg').style.display = 'none';
                    document.getElementById('jpgBtnSubmit').disabled = true;
                    break;
            }
            
            // Remove any error messages
            const errorMessages = document.querySelectorAll('.error-message');
            errorMessages.forEach(error => error.remove());
            
            // Show a success message
            showSuccess(`Form reset successfully. You can start again.`);
        }
    }
    
    // Show success message
    function showSuccess(message) {
        const successDiv = document.createElement('div');
        successDiv.className = 'success-message';
        successDiv.style.backgroundColor = 'rgba(42, 157, 143, 0.1)';
        successDiv.style.borderLeft = '4px solid var(--success-color)';
        successDiv.style.padding = '1rem';
        successDiv.style.borderRadius = 'var(--border-radius)';
        successDiv.style.marginBottom = '1.5rem';
        
        const successText = document.createElement('p');
        successText.textContent = message;
        successText.style.color = 'var(--success-color)';
        
        successDiv.appendChild(successText);
        
        // Remove any existing success message
        const existingSuccess = document.querySelector('.success-message');
        if (existingSuccess) {
            existingSuccess.remove();
        }
        
        // Insert success message at the top of main content
        const mainContent = document.querySelector('main');
        mainContent.insertBefore(successDiv, mainContent.firstChild);
        
        // Auto remove after 3 seconds
        setTimeout(() => {
            successDiv.remove();
        }, 3000);
    }
    
    // Show error message
    function showError(message) {
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-message';
        
        const errorText = document.createElement('p');
        errorText.textContent = message;
        
        errorDiv.appendChild(errorText);
        
        // Remove any existing error
        const existingError = document.querySelector('.error-message');
        if (existingError) {
            existingError.remove();
        }
        
        // Insert error at the top of main content
        const mainContent = document.querySelector('main');
        mainContent.insertBefore(errorDiv, mainContent.firstChild);
        
        // Auto remove after 5 seconds
        setTimeout(() => {
            errorDiv.remove();
        }, 5000);
    }
});