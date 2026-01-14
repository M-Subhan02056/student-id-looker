class StudentLookupSystem {
    constructor() {
        this.apiBaseUrl = 'http://localhost:3000';
        this.init();
    }

    init() {
        this.bindEvents();
        this.checkApiStatus();
        this.loadRecentStudents();
    }

    bindEvents() {
        document.getElementById('searchBtn').addEventListener('click', () => this.searchStudent());
        document.getElementById('clearBtn').addEventListener('click', () => this.clearSearch());
        document.getElementById('refreshStudents').addEventListener('click', () => this.loadRecentStudents());
        document.getElementById('studentId').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.searchStudent();
        });
    }

    async checkApiStatus() {
        try {
            const response = await fetch(`${this.apiBaseUrl}/health`);
            if (response.ok) {
                this.updateApiStatus('connected', 'Connected to API');
            } else {
                this.updateApiStatus('disconnected', 'API Connection Failed');
            }
        } catch (error) {
            this.updateApiStatus('disconnected', 'API Connection Failed');
        }
    }

    updateApiStatus(status, message) {
        const statusElement = document.getElementById('apiStatus');
        const icon = document.querySelector('.status i');
        
        statusElement.textContent = message;
        if (status === 'connected') {
            icon.className = 'fas fa-circle status-connected';
        } else {
            icon.className = 'fas fa-circle status-disconnected';
        }
    }

    async searchStudent() {
        const studentId = document.getElementById('studentId').value.trim();
        
        if (!studentId) {
            this.showError('Please enter a Student ID');
            return;
        }

        this.showLoading(true);
        this.hideResults();
        this.hideError();

        try {
            const response = await fetch(`${this.apiBaseUrl}/api/student/search`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ studentId })
            });

            const data = await response.json();
            
            if (data.success) {
                this.displayStudentInfo(data.data);
                // Reload recent students to include this one
                this.loadRecentStudents();
            } else {
                this.showNoResults();
            }
        } catch (error) {
            this.showError('Network error. Please check your connection and try again.');
            console.error('Search error:', error);
        } finally {
            this.showLoading(false);
        }
    }

    displayStudentInfo(student) {
        // Update student information
        document.getElementById('studentName').textContent = student.name || 'N/A';
        document.getElementById('infoStudentId').textContent = student.studentId || 'N/A';
        document.getElementById('infoEmail').textContent = student.email || 'N/A';
        document.getElementById('infoPhone').textContent = student.phone || 'N/A';
        document.getElementById('infoCreatedOn').textContent = this.formatDate(student.createdOn);
        
        // Update address
        const addressParts = [];
        if (student.additionalInfo?.address) addressParts.push(student.additionalInfo.address);
        if (student.additionalInfo?.city) addressParts.push(student.additionalInfo.city);
        if (student.additionalInfo?.state) addressParts.push(student.additionalInfo.state);
        if (student.additionalInfo?.country) addressParts.push(student.additionalInfo.country);
        document.getElementById('infoAddress').textContent = addressParts.join(', ') || 'N/A';
        
        // Update status
        const statusElement = document.getElementById('studentStatus');
        if (student.status === 'active') {
            statusElement.textContent = 'Active';
            statusElement.className = 'status-badge status-active';
        } else {
            statusElement.textContent = 'Inactive';
            statusElement.className = 'status-badge status-inactive';
        }
        
        // Update tags
        const tagsContainer = document.getElementById('infoTags');
        tagsContainer.innerHTML = '';
        if (student.tags && student.tags.length > 0) {
            student.tags.forEach(tag => {
                const tagElement = document.createElement('span');
                tagElement.className = 'tag';
                tagElement.textContent = tag;
                tagsContainer.appendChild(tagElement);
            });
        } else {
            tagsContainer.innerHTML = '<span class="tag">No tags</span>';
        }
        
        // Show results
        document.getElementById('studentInfo').style.display = 'block';
        document.getElementById('noResults').style.display = 'none';
    }

    async loadRecentStudents() {
        const loadingElement = document.getElementById('recentLoading');
        const errorElement = document.getElementById('recentError');
        const listElement = document.getElementById('recentStudents');
        
        loadingElement.style.display = 'block';
        errorElement.style.display = 'none';
        listElement.style.display = 'none';
        listElement.innerHTML = '';

        try {
            const response = await fetch(`${this.apiBaseUrl}/api/students?limit=6`);
            const data = await response.json();
            
            if (data.success && data.data.length > 0) {
                this.displayRecentStudents(data.data);
                loadingElement.style.display = 'none';
                listElement.style.display = 'grid';
            } else {
                loadingElement.style.display = 'none';
                listElement.innerHTML = '<p class="no-data">No students found</p>';
                listElement.style.display = 'block';
            }
        } catch (error) {
            loadingElement.style.display = 'none';
            errorElement.textContent = 'Failed to load recent students';
            errorElement.style.display = 'block';
            console.error('Load students error:', error);
        }
    }

    displayRecentStudents(students) {
        const listElement = document.getElementById('recentStudents');
        listElement.innerHTML = '';

        students.forEach(student => {
            const card = document.createElement('div');
            card.className = 'student-card';
            card.innerHTML = `
                <div class="student-card-avatar">
                    <i class="fas fa-user-graduate"></i>
                </div>
                <div class="student-card-info">
                    <h4>${student.name || 'Unknown Student'}</h4>
                    <div class="student-card-meta">
                        <span><i class="fas fa-id-card"></i> ${student.studentId}</span>
                        <span><i class="fas fa-envelope"></i> ${student.email || 'No email'}</span>
                    </div>
                </div>
            `;
            
            card.addEventListener('click', () => {
                document.getElementById('studentId').value = student.studentId;
                this.searchStudent();
            });
            
            listElement.appendChild(card);
        });
    }

    clearSearch() {
        document.getElementById('studentId').value = '';
        this.hideResults();
        this.hideError();
    }

    showLoading(show) {
        document.getElementById('loading').style.display = show ? 'block' : 'none';
    }

    hideResults() {
        document.getElementById('studentInfo').style.display = 'none';
        document.getElementById('noResults').style.display = 'none';
    }

    showNoResults() {
        document.getElementById('studentInfo').style.display = 'none';
        document.getElementById('noResults').style.display = 'block';
    }

    showError(message) {
        const errorElement = document.getElementById('errorMessage');
        errorElement.textContent = message;
        errorElement.style.display = 'block';
    }

    hideError() {
        document.getElementById('errorMessage').style.display = 'none';
    }

    formatDate(dateString) {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new StudentLookupSystem();
});
