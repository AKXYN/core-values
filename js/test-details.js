document.addEventListener('DOMContentLoaded', function() {
    // Check auth state
    firebase.auth().onAuthStateChanged((user) => {
        if (user) {
            console.log("User authenticated:", user.uid);
            
            // Get test ID from URL parameters
            const urlParams = new URLSearchParams(window.location.search);
            const testId = urlParams.get('id');
            
            if (!testId) {
                console.error("No test ID provided");
                showError("No test ID provided");
                return;
            }
            
            console.log("Loading test details for ID:", testId);
            loadTestDetails(user, testId);
            
            // Setup back button
            document.getElementById('back-btn').addEventListener('click', () => {
                navigateToPage('dashboard.html');
            });
            
        } else {
            console.log("User not authenticated, redirecting to login");
            navigateToPage('index.html');
        }
    });
});

async function loadTestDetails(user, testId) {
    try {
        console.log("Loading test details for ID:", testId);
        
        // Show loading state
        document.getElementById('loading-indicator').style.display = 'block';
        document.getElementById('students-table').style.display = 'none';
        document.getElementById('error-message').style.display = 'none';

        // Get test document
        console.log("Fetching test document from Firestore");
        const testDoc = await firebase.firestore()
            .collection('tests')
            .doc(testId)
            .get();

        if (!testDoc.exists) {
            console.log("Test document not found");
            showError("Test not found");
            return;
        }

        const testData = testDoc.data();
        console.log("Test data:", testData);
        
        // Verify the test belongs to the current user
        if (testData.user_id !== user.uid && testData.userId !== user.uid) {
            console.log("Test does not belong to current user");
            console.log("Test user_id:", testData.user_id);
            console.log("Test userId:", testData.userId);
            console.log("User ID:", user.uid);
            showError("You don't have permission to view this test");
            return;
        }

        // Display test name
        document.getElementById('test-name').textContent = testData.name || 'Unnamed Test';

        // Check if this is a future test (status is 'draft')
        const isFutureTest = testData.status === 'draft';
        
        // Show/hide columns based on test status
        const scoreColumn = document.querySelector('.score-column');
        const actionsColumn = document.querySelector('.actions-column');
        
        if (scoreColumn && actionsColumn) {
            if (isFutureTest) {
                scoreColumn.style.display = 'none';
                actionsColumn.style.display = 'table-cell';
            } else {
                scoreColumn.style.display = 'table-cell';
                actionsColumn.style.display = 'none';
            }
        }
        
        // Show/hide deploy button based on test status
        const deployButton = document.getElementById('deploy-test-btn');
        if (deployButton) {
            deployButton.style.display = isFutureTest ? 'block' : 'none';
            if (isFutureTest) {
                deployButton.addEventListener('click', () => {
                    deployTest(testId);
                });
            }
        }
        
        // Remove Add Students card for ongoing tests
        const cards = document.querySelectorAll('.card');
        cards.forEach(card => {
            const title = card.querySelector('.card-title');
            if (title && title.textContent.trim() === 'Add Students') {
                if (!isFutureTest) {
                    card.remove();
                } else {
                    const addStudentsSection = document.getElementById('add-students-section');
                    if (addStudentsSection) {
                        addStudentsSection.style.display = 'block';
                        
                        document.getElementById('add-students-btn').addEventListener('click', () => {
                            const emailsText = document.getElementById('student-emails').value.trim();
                            if (!emailsText) {
                                showError("Please enter at least one email address");
                                return;
                            }
                            
                            const emails = emailsText.split('\n')
                                .map(email => email.trim())
                                .filter(email => email && isValidEmail(email));
                            
                            if (emails.length === 0) {
                                showError("No valid email addresses found");
                                return;
                            }
                            
                            addStudents(testId, emails);
                        });
                    }
                }
            }
        });

        // Display students
        const studentsList = document.getElementById('students-list');
        studentsList.innerHTML = '';

        if (!testData.students || testData.students.length === 0) {
            console.log("No students in test");
            studentsList.innerHTML = `
                <tr>
                    <td colspan="3" style="text-align: center; width: 100%;">No students added to this test</td>
                </tr>
            `;
        } else {
            console.log("Processing students:", testData.students.length);
            
            if (isFutureTest) {
                // For future tests, show simple list with delete buttons
                testData.students.forEach(studentEmail => {
                    const row = document.createElement('tr');
                    row.className = 'student-row';
                    row.dataset.email = studentEmail;
                    
                    row.innerHTML = `
                        <td>${studentEmail}</td>
                        <td class="score-column" style="display: none;"></td>
                        <td class="actions-column">
                            <button class="delete-student-btn" data-email="${studentEmail}" title="Delete student">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                            </button>
                        </td>
                    `;
                    
                    studentsList.appendChild(row);
                    
                    // Add click event listener to the delete button
                    const deleteBtn = row.querySelector('.delete-student-btn');
                    if (deleteBtn) {
                        deleteBtn.addEventListener('click', (e) => {
                            e.stopPropagation(); // Prevent row click event
                            deleteStudent(testId, studentEmail);
                        });
                    }
                });
            } else {
                // For past tests, show split table with completed and not attempted sections
                const studentsWithScores = [];
                const studentsWithoutScores = [];
                
                testData.students.forEach(student => {
                    // Check if student exists in completed array
                    const completedStudent = testData.completed ? 
                        testData.completed.find(c => c.email === student) : null;
                    
                    if (completedStudent) {
                        // Student has completed the test
                        studentsWithScores.push({
                            email: student,
                            score: completedStudent.percentage
                        });
                    } else {
                        // Student hasn't completed the test
                        studentsWithoutScores.push({
                            email: student
                        });
                    }
                });
                
                // Sort completed students by score in descending order
                studentsWithScores.sort((a, b) => b.score - a.score);
                
                // Clear the table
                studentsList.innerHTML = '';
                
                // FIRST SECTION: Completed
                const completedHeader = document.createElement('tr');
                completedHeader.className = 'section-header';
                completedHeader.innerHTML = `
                    <td colspan="2" style="background-color: #e8f5e9; width: 100%;">
                        Completed (${studentsWithScores.length})
                    </td>
                `;
                studentsList.appendChild(completedHeader);
                
                // Add completed students (now sorted by score)
                studentsWithScores.forEach(student => {
                    const row = document.createElement('tr');
                    row.className = 'student-row';
                    row.innerHTML = `
                        <td>${student.email}</td>
                        <td class="score-column">${student.score}%</td>
                        <td class="actions-column" style="display: none;"></td>
                    `;
                    studentsList.appendChild(row);
                });
                
                // SECOND SECTION: Not Completed
                const notCompletedHeader = document.createElement('tr');
                notCompletedHeader.className = 'section-header';
                notCompletedHeader.innerHTML = `
                    <td colspan="2" style="background-color: #fef7e0; width: 100%;">
                        Not Completed (${studentsWithoutScores.length})
                    </td>
                `;
                studentsList.appendChild(notCompletedHeader);
                
                // Add not completed students
                studentsWithoutScores.forEach(student => {
                    const row = document.createElement('tr');
                    row.className = 'student-row';
                    row.innerHTML = `
                        <td>${student.email}</td>
                        <td class="score-column">-</td>
                        <td class="actions-column" style="display: none;"></td>
                    `;
                    studentsList.appendChild(row);
                });
            }
        }

        // Hide loading and show table
        document.getElementById('loading-indicator').style.display = 'none';
        document.getElementById('students-table').style.display = 'table';
        console.log("Test details loaded successfully");

    } catch (error) {
        console.error("Error loading test details:", error);
        showError("Failed to load test details. Please try again.");
    }
}

// Function to validate email format
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

// Function to add multiple students to a test
async function addStudents(testId, emails) {
    try {
        // Show loading state
        document.getElementById('loading-indicator').style.display = 'block';
        document.getElementById('add-students-btn').textContent = 'Adding...';
        document.getElementById('add-students-btn').disabled = true;
        
        // Get current test data
        const testDoc = await firebase.firestore()
            .collection('tests')
            .doc(testId)
            .get();
        
        if (!testDoc.exists) {
            throw new Error('Test not found');
        }
        
        const testData = testDoc.data();
        
        // Verify the test belongs to the current user
        if (testData.user_id !== firebase.auth().currentUser.uid) {
            throw new Error('You do not have permission to modify this test');
        }
        
        // Verify this is a future test
        if (testData.status !== 'draft') {
            throw new Error('Can only add students to future tests');
        }
        
        // Get current students list
        const currentStudents = testData.students || [];
        
        // Add new students (avoid duplicates)
        const newStudents = [...currentStudents];
        let addedCount = 0;
        
        emails.forEach(email => {
            if (!newStudents.includes(email)) {
                newStudents.push(email);
                addedCount++;
            }
        });
        
        // Update Firestore
        await firebase.firestore()
            .collection('tests')
            .doc(testId)
            .update({
                students: newStudents
            });
        
        // Clear the textarea
        document.getElementById('student-emails').value = '';
        
        // Refresh the page to show updated student list
        location.reload();
        
    } catch (error) {
        console.error('Error adding students:', error);
        showError(`Error adding students: ${error.message}`);
    } finally {
        // Reset button state
        document.getElementById('add-students-btn').textContent = 'Add Students';
        document.getElementById('add-students-btn').disabled = false;
        document.getElementById('loading-indicator').style.display = 'none';
    }
}

// Function to delete a student from a test
async function deleteStudent(testId, studentEmail) {
    try {
        // Confirm deletion
        if (!confirm(`Are you sure you want to remove ${studentEmail} from this test?`)) {
            return;
        }
        
        // Show loading state
        document.getElementById('loading-indicator').style.display = 'block';
        
        // Get current test data
        const testDoc = await firebase.firestore()
            .collection('tests')
            .doc(testId)
            .get();
        
        if (!testDoc.exists) {
            throw new Error('Test not found');
        }
        
        const testData = testDoc.data();
        
        // Verify the test belongs to the current user
        if (testData.user_id !== firebase.auth().currentUser.uid) {
            throw new Error('You do not have permission to modify this test');
        }
        
        // Verify this is a future test
        if (testData.status !== 'draft') {
            throw new Error('Can only remove students from future tests');
        }
        
        // Get current students list
        const currentStudents = testData.students || [];
        
        // Remove the student
        const updatedStudents = currentStudents.filter(email => email !== studentEmail);
        
        // Update Firestore
        await firebase.firestore()
            .collection('tests')
            .doc(testId)
            .update({
                students: updatedStudents
            });
        
        // Remove the student row from the UI
        const studentRow = document.querySelector(`.student-row[data-email="${studentEmail}"]`);
        if (studentRow) {
            studentRow.remove();
        }
        
        // Check if there are any students left
        if (updatedStudents.length === 0) {
            document.getElementById('students-list').innerHTML = `
                <tr>
                    <td colspan="3" style="text-align: center;">No students added to this test</td>
                </tr>
            `;
        }
        
        // Hide loading
        document.getElementById('loading-indicator').style.display = 'none';
        
    } catch (error) {
        console.error('Error deleting student:', error);
        showError(`Error deleting student: ${error.message}`);
        document.getElementById('loading-indicator').style.display = 'none';
    }
}

// Function to view a student's report
function viewStudentReport(testId, studentEmail) {
    navigateToPageWithParams('student-report.html', { 
        testId: testId, 
        studentEmail: studentEmail 
    });
}

// Function to show error message
function showError(message) {
    document.getElementById('error-message').textContent = message;
    document.getElementById('error-message').style.display = 'block';
}

// Function to deploy the test
async function deployTest(testId) {
    try {
        const confirmDeploy = confirm('Are you sure you want to deploy this test? Students will be able to take it immediately.');
        if (!confirmDeploy) return;

        const deployButton = document.getElementById('deploy-test-btn');
        deployButton.disabled = true;
        deployButton.textContent = 'Deploying...';

        // Update test status in Firestore
        await firebase.firestore()
            .collection('tests')
            .doc(testId)
            .update({
                status: 'active',
                updated_at: firebase.firestore.FieldValue.serverTimestamp()
            });

        // Get test details for email
        const testDoc = await firebase.firestore()
            .collection('tests')
            .doc(testId)
            .get();
        
        const testData = testDoc.data();
        const students = testData.students || [];

        console.log('Starting to send emails to students:', students);

        // Send emails to all students
        for (const studentEmail of students) {
            try {
                console.log('Preparing email for:', studentEmail);
                
                // Update email template parameters
                emailTemplate.template_params = {
                    test_name: testData.name,
                    test_id: testId,
                    test_link: `https://akxyn.github.io/quiz-app/quiz.html`,
                    email: studentEmail,
                    company_name: testData.company
                };

                console.log('Email template params:', emailTemplate.template_params);

                // Send email
                const response = await emailjs.send(
                    emailTemplate.service_id,
                    emailTemplate.template_id,
                    emailTemplate.template_params
                );
                
                console.log('Email sent successfully to:', studentEmail, 'Response:', response);
            } catch (emailError) {
                console.error(`Failed to send email to ${studentEmail}:`, emailError);
                // Continue with other students even if one fails
            }
        }

        alert('Test has been deployed successfully! Emails have been sent to all students.');
        location.reload();
    } catch (error) {
        console.error('Error deploying test:', error);
        alert('Failed to deploy test. Please try again.');
        const deployButton = document.getElementById('deploy-test-btn');
        deployButton.disabled = false;
        deployButton.textContent = 'Deploy Test for Students';
    }
}