document.addEventListener('DOMContentLoaded', function() {
    // Check auth state
    firebase.auth().onAuthStateChanged((user) => {
        if (user) {
            console.log("User authenticated:", user.uid);
            loadCompanyData();
            setupUI();
            loadTests(user);
        } else {
            console.log("User not authenticated, redirecting to login");
            navigateToPage('index.html');
        }
    });

    function loadCompanyData() {
        const user = firebase.auth().currentUser;
        firebase.firestore().collection('companies').doc(user.uid).get()
            .then(doc => {
                if (doc.exists) {
                    document.getElementById('company-name').textContent = 
                        `${doc.data().name} Dashboard`;
                }
            })
            .catch(error => {
                console.error("Error loading company data:", error);
            });
    }

    function setupUI() {
        // Tab switching functionality
        const tabButtons = document.querySelectorAll('.tab-btn[data-tab]');
        const tabContents = document.querySelectorAll('.tab-content');
        const tabSlider = document.querySelector('.tab-slider');

        function switchTab(tabName) {
            // Update active state of buttons
            tabButtons.forEach(button => {
                button.classList.remove('active');
                if (button.dataset.tab === tabName) {
                    button.classList.add('active');
                }
            });

            // Update active state of contents
            tabContents.forEach(content => {
                content.classList.remove('active');
                if (content.id === `${tabName}-tests`) {
                    content.classList.add('active');
                }
            });

            // Move the slider
            const activeButton = document.querySelector(`.tab-btn[data-tab="${tabName}"]`);
            const buttonText = activeButton.textContent.trim();
            
            // Create a temporary span to measure text width
            const tempSpan = document.createElement('span');
            tempSpan.style.visibility = 'hidden';
            tempSpan.style.position = 'absolute';
            tempSpan.style.fontSize = window.getComputedStyle(activeButton).fontSize;
            tempSpan.style.fontWeight = window.getComputedStyle(activeButton).fontWeight;
            tempSpan.style.fontFamily = window.getComputedStyle(activeButton).fontFamily;
            tempSpan.textContent = buttonText;
            document.body.appendChild(tempSpan);
            
            const textWidth = tempSpan.offsetWidth;
            document.body.removeChild(tempSpan);
            
            // Add padding to match button padding (12px on each side)
            const totalWidth = textWidth + 24;
            
            // Set the slider width and position
            tabSlider.style.width = `${totalWidth}px`;
            tabSlider.style.transform = `translateX(${activeButton.offsetLeft}px)`;
        }

        // Initialize slider position
        switchTab('past');

        // Add click event listeners
        tabButtons.forEach(button => {
            button.addEventListener('click', () => {
                const tabName = button.dataset.tab;
                switchTab(tabName);
            });
        });

        // Logout
        document.getElementById('logout').addEventListener('click', () => {
            firebase.auth().signOut();
        });

        // Create test button
        const createTestBtn = document.getElementById('create-test');
        if (createTestBtn) {
            createTestBtn.addEventListener('click', () => {
                // Open Streamlit app in a new tab
                window.open('https://test-generator-app.streamlit.app/', '_blank');
            });
        }
    }

    async function loadTests(user) {
        try {
            console.log("Loading tests for user:", user.uid);
            
            // Show loading state
            document.querySelectorAll('.tab-content').forEach(tab => {
                tab.innerHTML = '<div class="loading">Loading tests...</div>';
            });
            
            // Get tests for the current user
            let testsSnapshot;
            try {
                // Try with ordering - using correct field names (user_id and start_date)
                testsSnapshot = await firebase.firestore()
                    .collection('tests')
                    .where('user_id', '==', user.uid)
                    .orderBy('start_date', 'desc')
                    .get();
            } catch (indexError) {
                console.warn("Index error, falling back to unordered query:", indexError);
                
                // If index error, fall back to unordered query - using correct field name (user_id)
                testsSnapshot = await firebase.firestore()
                    .collection('tests')
                    .where('user_id', '==', user.uid)
                    .get();
                    
                // Show a message about creating the index
                const indexMessage = document.createElement('div');
                indexMessage.className = 'index-message';
                indexMessage.innerHTML = `
                    <p>For better performance, please create the required index by clicking 
                    <a href="${indexError.message.split('here: ')[1]}" target="_blank">here</a>.</p>
                `;
                document.querySelector('.dashboard-container').insertBefore(
                    indexMessage, 
                    document.querySelector('.tabs')
                );
            }
            
            console.log("Fetched tests:", testsSnapshot.size);
            
            if (testsSnapshot.empty) {
                console.log("No tests found for user");
                document.querySelectorAll('.tab-content').forEach(tab => {
                    tab.innerHTML = '<div class="empty-state">No tests found. Create a new test to get started.</div>';
                });
                return;
            }
            
            // Process all tests
            const allTests = [];
            testsSnapshot.forEach(doc => {
                console.log("Processing test:", doc.id, doc.data().name);
                const test = doc.data();
                allTests.push({
                    id: doc.id,
                    ...test
                });
            });
            
            // Sort tests by start_date if we couldn't use the index
            if (!testsSnapshot.query.orderBy) {
                allTests.sort((a, b) => {
                    if (!a.start_date) return 1;
                    if (!b.start_date) return -1;
                    return b.start_date.toDate() - a.start_date.toDate();
                });
            }
            
            // Classify tests by status
            const pastTests = allTests.filter(test => test.status === 'completed');
            const ongoingTests = allTests.filter(test => test.status === 'active');
            const futureTests = allTests.filter(test => test.status === 'draft');
            
            console.log("Past tests:", pastTests.length);
            console.log("Ongoing tests:", ongoingTests.length);
            console.log("Future tests:", futureTests.length);
            
            // Render each section
            renderTestSection('past-tests', pastTests);
            renderTestSection('ongoing-tests', ongoingTests);
            renderTestSection('future-tests', futureTests);
            
        } catch (error) {
            console.error('Error loading tests:', error);
            document.querySelectorAll('.tab-content').forEach(tab => {
                tab.innerHTML = `<div class="error-state">Error loading tests: ${error.message}</div>`;
            });
        }
    }
    
    function renderTestSection(containerId, tests) {
        const container = document.getElementById(containerId);
        if (!container) {
            console.error(`Container with ID ${containerId} not found`);
            return;
        }
        
        if (tests.length === 0) {
            container.innerHTML = '<div class="empty-state">No tests found</div>';
            return;
        }
        
        container.innerHTML = '';
        
        tests.forEach(test => {
            const testCard = createTestCard(test.id, test);
            container.appendChild(testCard);
        });
    }

    function createTestCard(testId, test) {
        console.log("Creating card for test:", testId, test.name);
        const card = document.createElement('div');
        card.className = 'test-card';
        card.style.cursor = 'pointer';
        
        // Determine test status
        let status = test.status || 'draft';
        let statusClass = `status-${status}`;
        
        // Format dates
        const startDate = test.start_date ? test.start_date.toDate().toLocaleDateString() : 'Not set';
        const endDate = test.end_date ? test.end_date.toDate().toLocaleDateString() : 'Not set';
        
        // Count students
        const studentCount = test.students ? test.students.length : 0;
        const completedStudents = test.completed || [];
        const completedCount = completedStudents.length;
        
        // Calculate completion percentage
        const completionPercentage = studentCount > 0 ? (completedCount / studentCount) * 100 : 0;
        
        // Create progress bar
        const progressBar = document.createElement('div');
        progressBar.className = 'progress-bar';
        const progressBarFill = document.createElement('div');
        progressBarFill.className = 'progress-bar-fill';
        progressBarFill.style.width = `${completionPercentage}%`;
        progressBar.appendChild(progressBarFill);
        
        card.innerHTML = `
            <h3>${test.name}</h3>
            <div class="test-info">
                <p><strong>Start Date:</strong> ${startDate}</p>
                <p><strong>End Date:</strong> ${endDate}</p>
                <p><strong>Status:</strong> <span class="${statusClass}">${status.charAt(0).toUpperCase() + status.slice(1)}</span></p>
                <p><strong>Students:</strong> ${completedCount} out of ${studentCount} completed</p>
            </div>
        `;
        
        card.appendChild(progressBar);
        
        // Add click event listener to the entire card
        card.addEventListener('click', () => {
            navigateToPageWithParams('test-details.html', { id: testId });
        });
        
        return card;
    }

    function showErrorToUser(message) {
        document.querySelectorAll('.tab-content').forEach(tab => {
            tab.innerHTML = `<div class="error-state">${message}</div>`;
        });
    }
});