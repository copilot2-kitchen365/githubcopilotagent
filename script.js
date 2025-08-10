// Employee Management System JavaScript

// Global variables
let employees = [];
let editingEmployeeId = null;

// DOM elements
const employeeForm = document.getElementById('employeeForm');
const editEmployeeForm = document.getElementById('editEmployeeForm');
const employeeTableBody = document.getElementById('employeeTableBody');
const searchInput = document.getElementById('searchInput');
const departmentFilter = document.getElementById('departmentFilter');
const editModal = document.getElementById('editModal');
const totalCountSpan = document.getElementById('totalCount');
const noEmployeesDiv = document.getElementById('noEmployees');
const exportBtn = document.getElementById('exportBtn');

// Load employees from localStorage on page load
document.addEventListener('DOMContentLoaded', function() {
    loadEmployees();
    updateEmployeeCount();
    
    // Auto-generate employee ID
    generateEmployeeId();
});

// Event listeners
employeeForm.addEventListener('submit', handleAddEmployee);
editEmployeeForm.addEventListener('submit', handleEditEmployee);
searchInput.addEventListener('input', filterEmployees);
departmentFilter.addEventListener('change', filterEmployees);
exportBtn.addEventListener('click', exportToCSV);

// Modal event listeners
document.querySelector('.close').addEventListener('click', closeModal);
window.addEventListener('click', function(event) {
    if (event.target === editModal) {
        closeModal();
    }
});

// Employee class
class Employee {
    constructor(employeeId, employeeCode, firstName, lastName, email, phone, department, position, salary, dateOfJoining) {
        this.employeeId = employeeId;
        this.employeeCode = employeeCode;
        this.firstName = firstName;
        this.lastName = lastName;
        this.email = email;
        this.phone = phone;
        this.department = department;
        this.position = position;
        this.salary = parseFloat(salary);
        this.dateOfJoining = dateOfJoining;
        this.dateAdded = new Date().toISOString();
    }

    getFullName() {
        return `${this.firstName} ${this.lastName}`;
    }

    getFormattedSalary() {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD'
        }).format(this.salary);
    }

    getFormattedDate() {
        return new Date(this.dateOfJoining).toLocaleDateString();
    }
}

// Generate unique employee ID
function generateEmployeeId() {
    const prefix = 'EMP';
    const timestamp = Date.now().toString().slice(-6);
    const randomNum = Math.floor(Math.random() * 100).toString().padStart(2, '0');
    const employeeId = `${prefix}${timestamp}${randomNum}`;
    
    document.getElementById('employeeId').value = employeeId;
}

// Add new employee
function handleAddEmployee(event) {
    event.preventDefault();
    
    const formData = new FormData(employeeForm);
    const employeeData = Object.fromEntries(formData);
    
    // Validate unique employee ID and email
    if (isEmployeeIdExists(employeeData.employeeId)) {
        showAlert('Employee ID already exists!', 'error');
        return;
    }
    
    if (isEmailExists(employeeData.email)) {
        showAlert('Email already exists!', 'error');
        return;
    }
    
    // Validate US phone number format
    if (!validateUSPhoneNumber(employeeData.phone)) {
        showAlert('Please enter a valid US phone number (e.g., (555) 123-4567, 555-123-4567, or 5551234567)', 'error');
        return;
    }
    
    // Create new employee
    const employee = new Employee(
        employeeData.employeeId,
        employeeData.employeeCode,
        employeeData.firstName,
        employeeData.lastName,
        employeeData.email,
        employeeData.phone,
        employeeData.department,
        employeeData.position,
        employeeData.salary,
        employeeData.dateOfJoining
    );
    
    // Add to employees array
    employees.push(employee);
    
    // Save to localStorage
    saveEmployees();
    
    // Update display
    displayEmployees();
    updateEmployeeCount();
    
    // Reset form and generate new ID
    employeeForm.reset();
    generateEmployeeId();
    
    showAlert('Employee added successfully!', 'success');
}

// Edit employee
function editEmployee(employeeId) {
    const employee = employees.find(emp => emp.employeeId === employeeId);
    if (!employee) return;
    
    editingEmployeeId = employeeId;
    
    // Populate edit form
    document.getElementById('editEmployeeId').value = employee.employeeId;
    document.getElementById('editEmployeeCode').value = employee.employeeCode;
    document.getElementById('editFirstName').value = employee.firstName;
    document.getElementById('editLastName').value = employee.lastName;
    document.getElementById('editEmail').value = employee.email;
    document.getElementById('editPhone').value = employee.phone;
    document.getElementById('editDepartment').value = employee.department;
    document.getElementById('editPosition').value = employee.position;
    document.getElementById('editSalary').value = employee.salary;
    document.getElementById('editDateOfJoining').value = employee.dateOfJoining;
    
    // Show modal
    editModal.style.display = 'block';
}

// Handle edit employee form submission
function handleEditEmployee(event) {
    event.preventDefault();
    
    const formData = new FormData(editEmployeeForm);
    const employeeData = Object.fromEntries(formData);
    
    // Find employee index
    const employeeIndex = employees.findIndex(emp => emp.employeeId === editingEmployeeId);
    if (employeeIndex === -1) return;
    
    // Validate unique email (excluding current employee)
    const emailExists = employees.some(emp => 
        emp.email === employeeData.email && emp.employeeId !== editingEmployeeId
    );
    
    if (emailExists) {
        showAlert('Email already exists!', 'error');
        return;
    }
    
    // Validate US phone number format
    if (!validateUSPhoneNumber(employeeData.phone)) {
        showAlert('Please enter a valid US phone number (e.g., (555) 123-4567, 555-123-4567, or 5551234567)', 'error');
        return;
    }
    
    // Update employee
    const updatedEmployee = new Employee(
        employeeData.employeeId,
        employeeData.employeeCode,
        employeeData.firstName,
        employeeData.lastName,
        employeeData.email,
        employeeData.phone,
        employeeData.department,
        employeeData.position,
        employeeData.salary,
        employeeData.dateOfJoining
    );
    
    // Preserve original date added
    updatedEmployee.dateAdded = employees[employeeIndex].dateAdded;
    
    employees[employeeIndex] = updatedEmployee;
    
    // Save and update display
    saveEmployees();
    displayEmployees();
    closeModal();
    
    showAlert('Employee updated successfully!', 'success');
}

// Delete employee
function deleteEmployee(employeeId) {
    if (confirm('Are you sure you want to delete this employee?')) {
        employees = employees.filter(emp => emp.employeeId !== employeeId);
        saveEmployees();
        displayEmployees();
        updateEmployeeCount();
        showAlert('Employee deleted successfully!', 'success');
    }
}

// Close modal
function closeModal() {
    editModal.style.display = 'none';
    editingEmployeeId = null;
}

// Display employees in table
function displayEmployees(employeesToShow = employees) {
    if (employeesToShow.length === 0) {
        employeeTableBody.innerHTML = '';
        noEmployeesDiv.style.display = 'block';
        return;
    }
    
    noEmployeesDiv.style.display = 'none';
    
    employeeTableBody.innerHTML = employeesToShow.map(employee => `
        <tr>
            <td>${employee.employeeId}</td>
            <td>${employee.employeeCode}</td>
            <td>${employee.getFullName()}</td>
            <td>${employee.email}</td>
            <td>${employee.phone}</td>
            <td>${employee.department}</td>
            <td>${employee.position}</td>
            <td>${employee.getFormattedSalary()}</td>
            <td>${employee.getFormattedDate()}</td>
            <td>
                <div class="action-buttons">
                    <button class="btn btn-edit" onclick="editEmployee('${employee.employeeId}')">
                        <i class="fas fa-edit"></i> Edit
                    </button>
                    <button class="btn btn-delete" onclick="deleteEmployee('${employee.employeeId}')">
                        <i class="fas fa-trash"></i> Delete
                    </button>
                </div>
            </td>
        </tr>
    `).join('');
}

// Filter employees based on search and department
function filterEmployees() {
    const searchTerm = searchInput.value.toLowerCase();
    const selectedDepartment = departmentFilter.value;
    
    let filteredEmployees = employees;
    
    // Filter by search term
    if (searchTerm) {
        filteredEmployees = filteredEmployees.filter(employee => 
            employee.employeeId.toLowerCase().includes(searchTerm) ||
            employee.employeeCode.toLowerCase().includes(searchTerm) ||
            employee.getFullName().toLowerCase().includes(searchTerm) ||
            employee.email.toLowerCase().includes(searchTerm) ||
            employee.phone.includes(searchTerm) ||
            employee.position.toLowerCase().includes(searchTerm)
        );
    }
    
    // Filter by department
    if (selectedDepartment) {
        filteredEmployees = filteredEmployees.filter(employee => 
            employee.department === selectedDepartment
        );
    }
    
    displayEmployees(filteredEmployees);
    updateEmployeeCount(filteredEmployees.length);
}

// Update employee count
function updateEmployeeCount(count = employees.length) {
    totalCountSpan.textContent = count;
}

// Check if employee ID exists
function isEmployeeIdExists(employeeId) {
    return employees.some(emp => emp.employeeId === employeeId);
}

// Check if email exists
function isEmailExists(email) {
    return employees.some(emp => emp.email === email);
}

// Validate US phone number format
function validateUSPhoneNumber(phone) {
    // Remove all non-digit characters to check basic format
    const digitsOnly = phone.replace(/\D/g, '');
    
    // Check if it's a valid length (10 digits or 11 digits starting with 1)
    if (digitsOnly.length === 10) {
        // 10 digit format - should not start with 0 or 1
        if (digitsOnly[0] === '0' || digitsOnly[0] === '1') {
            return false;
        }
    } else if (digitsOnly.length === 11) {
        // 11 digit format - should start with 1
        if (digitsOnly[0] !== '1') {
            return false;
        }
        // Area code (second digit) should not be 0 or 1
        if (digitsOnly[1] === '0' || digitsOnly[1] === '1') {
            return false;
        }
    } else {
        return false;
    }
    
    // Define valid US phone number patterns
    const phonePatterns = [
        /^\(\d{3}\) \d{3}-\d{4}$/,           // (555) 123-4567
        /^\d{3}-\d{3}-\d{4}$/,               // 555-123-4567
        /^\d{3}\.\d{3}\.\d{4}$/,             // 555.123.4567
        /^\d{3} \d{3} \d{4}$/,               // 555 123 4567
        /^\d{10}$/,                          // 5551234567
        /^1-\d{3}-\d{3}-\d{4}$/,             // 1-555-123-4567
        /^\+1-\d{3}-\d{3}-\d{4}$/,           // +1-555-123-4567
        /^\+1 \(\d{3}\) \d{3}-\d{4}$/,       // +1 (555) 123-4567
        /^\+1 \d{3} \d{3} \d{4}$/,           // +1 555 123 4567
        /^1\d{10}$/,                         // 15551234567
        /^\+1\d{10}$/                        // +15551234567
    ];
    
    return phonePatterns.some(pattern => pattern.test(phone));
}

// Save employees to localStorage
function saveEmployees() {
    localStorage.setItem('employees', JSON.stringify(employees));
}

// Load employees from localStorage
function loadEmployees() {
    const savedEmployees = localStorage.getItem('employees');
    if (savedEmployees) {
        const employeeData = JSON.parse(savedEmployees);
        employees = employeeData.map(emp => {
            const employee = new Employee(
                emp.employeeId,
                emp.employeeCode || '', // Handle existing data without employeeCode
                emp.firstName,
                emp.lastName,
                emp.email,
                emp.phone,
                emp.department,
                emp.position,
                emp.salary,
                emp.dateOfJoining
            );
            employee.dateAdded = emp.dateAdded;
            return employee;
        });
        displayEmployees();
    }
}

// Show alert messages
function showAlert(message, type) {
    const existingAlert = document.querySelector('.alert');
    if (existingAlert) {
        existingAlert.remove();
    }
    
    const alert = document.createElement('div');
    alert.className = `alert alert-${type}`;
    alert.innerHTML = `
        <i class="fas ${type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'}"></i>
        ${message}
    `;
    
    // Insert after header
    const header = document.querySelector('header');
    header.parentNode.insertBefore(alert, header.nextSibling);
    
    // Remove alert after 5 seconds
    setTimeout(() => {
        alert.remove();
    }, 5000);
}

// Export to CSV
function exportToCSV() {
    if (employees.length === 0) {
        showAlert('No employees to export!', 'error');
        return;
    }
    
    const headers = [
        'Employee ID',
        'Employee Code',
        'First Name',
        'Last Name',
        'Email',
        'Phone',
        'Department',
        'Position',
        'Salary',
        'Date of Joining'
    ];
    
    const csvContent = [
        headers.join(','),
        ...employees.map(emp => [
            emp.employeeId,
            emp.employeeCode,
            emp.firstName,
            emp.lastName,
            emp.email,
            emp.phone,
            emp.department,
            emp.position,
            emp.salary,
            emp.dateOfJoining
        ].join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `employees_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
    
    showAlert('Employees exported successfully!', 'success');
}

// Sample data for demonstration (uncomment to add sample employees)
function addSampleData() {
    const sampleEmployees = [
        new Employee('EMP001', 'EC001', 'John', 'Doe', 'john.doe@company.com', '+1-555-0123', 'IT', 'Software Developer', 75000, '2023-01-15'),
        new Employee('EMP002', 'EC002', 'Jane', 'Smith', 'jane.smith@company.com', '+1-555-0124', 'HR', 'HR Manager', 65000, '2023-02-20'),
        new Employee('EMP003', 'EC003', 'Mike', 'Johnson', 'mike.johnson@company.com', '+1-555-0125', 'Finance', 'Financial Analyst', 55000, '2023-03-10'),
        new Employee('EMP004', 'EC004', 'Sarah', 'Williams', 'sarah.williams@company.com', '+1-555-0126', 'Marketing', 'Marketing Specialist', 50000, '2023-04-05'),
        new Employee('EMP005', 'EC005', 'Robert', 'Brown', 'robert.brown@company.com', '+1-555-0127', 'Sales', 'Sales Representative', 45000, '2023-05-12')
    ];
    
    employees.push(...sampleEmployees);
    saveEmployees();
    displayEmployees();
    updateEmployeeCount();
    showAlert('Sample data added successfully!', 'success');
}

// Uncomment the next line to add sample data on page load
// document.addEventListener('DOMContentLoaded', addSampleData);

// Keyboard shortcuts
document.addEventListener('keydown', function(event) {
    // Escape key to close modal
    if (event.key === 'Escape' && editModal.style.display === 'block') {
        closeModal();
    }
    
    // Ctrl/Cmd + E to focus search
    if ((event.ctrlKey || event.metaKey) && event.key === 'e') {
        event.preventDefault();
        searchInput.focus();
    }
});

// Auto-save functionality
setInterval(saveEmployees, 30000); // Auto-save every 30 seconds
