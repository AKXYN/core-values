const isGitHubPages = window.location.host.includes('github.io');
const basePath = isGitHubPages ? '/core-values' : '';
const loginUrl = getPageUrl('auth.html');

// Initialize variables
let isLoginMode = true;

// DOM Elements
const authForm = document.getElementById('auth-form');
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');
const passwordField = document.getElementById('password-field');
const companyField = document.getElementById('company-field');
const companyInput = document.getElementById('company-name');
const authButton = document.getElementById('auth-action');
const messageDiv = document.getElementById('message');
const toggleOptions = document.querySelectorAll('.toggle-option');
const toggleSlider = document.querySelector('.toggle-slider');

// Toggle functionality
toggleOptions.forEach(option => {
    option.addEventListener('click', function() {
        const mode = this.dataset.mode;
        isLoginMode = mode === 'login';
        
        // Update active state
        toggleOptions.forEach(opt => opt.classList.remove('active'));
        this.classList.add('active');
        
        // Move slider
        toggleSlider.classList.toggle('right', !isLoginMode);
        
        // Update form
        updateForm();
    });
});

function updateForm() {
    // Reset input fields
    emailInput.value = "";
    passwordInput.value = "";
    if (companyInput) companyInput.value = "";
    
    if (isLoginMode) {
        authButton.textContent = "Login";
        passwordField.style.display = "block";
        companyField.style.display = "none";
    } else {
        authButton.textContent = "Send Password";
        passwordField.style.display = "none";
        companyField.style.display = "block";
    }
    
    // Clear any existing messages
    messageDiv.textContent = '';
    messageDiv.className = 'message';
}

// Handle form submission
authForm.addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const email = emailInput.value.trim();
    
    if (!email) {
        messageDiv.textContent = "Please enter email";
        messageDiv.className = "message error";
        return;
    }

    try {
        if (isLoginMode) {
            // LOGIN FLOW
            const password = passwordInput.value;
            await firebase.auth().signInWithEmailAndPassword(email, password);
            messageDiv.textContent = "Login successful! Redirecting...";
            messageDiv.className = "message success";
            setTimeout(() => window.location.href = 'dashboard.html', 1000);
        } else {
            // REGISTER FLOW
            const companyName = companyInput.value.trim();
            if (!companyName) {
                messageDiv.textContent = "Please enter company name";
                messageDiv.className = "message error";
                return;
            }
            
            const randomPassword = generateRandomPassword();
            
            try {
                // 1. Create the auth user
                const userCredential = await firebase.auth().createUserWithEmailAndPassword(email, randomPassword);
                
                // 2. Create the company document
                await firebase.firestore().collection('companies').doc(userCredential.user.uid).set({
                    name: companyName,
                    adminEmail: email,
                    createdAt: firebase.firestore.FieldValue.serverTimestamp()
                });

                // 3. Send email with password
                await emailjs.send('service_zkrdtgj', 'template_sshzxpg', {
                    email: email,
                    password: randomPassword,
                    login_url: loginUrl
                });
                
                messageDiv.textContent = "Password sent to your email!";
                messageDiv.className = "message success";
                emailInput.value = "";
                companyInput.value = "";

            } catch (error) {
                console.error("Registration error:", error);
                if (error.code === 'auth/email-already-in-use') {
                    messageDiv.textContent = "This email is already registered. Please login instead.";
                } else if (error.code === 'auth/invalid-email') {
                    messageDiv.textContent = "Invalid email format. Please check your email address.";
                } else if (error.code === 'auth/operation-not-allowed') {
                    messageDiv.textContent = "Email/password accounts are not enabled. Please contact support.";
                } else if (error.code === 'auth/weak-password') {
                    messageDiv.textContent = "Password is too weak. Please try again.";
                } else {
                    messageDiv.textContent = `Registration failed: ${error.message}`;
                }
                messageDiv.className = "message error";
            }
        }
    } catch (error) {
        console.error("Authentication error:", error);
        // For any authentication error, show a simple message
        messageDiv.textContent = "Incorrect credentials";
        messageDiv.className = "message error";
    }
});

function generateRandomPassword() {
    const chars = "ABCDEFGHJKLMNPQRTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$%";
    let password = "";
    for (let i = 0; i < 10; i++) {
        password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
}

function showMessage(text, color) {
    messageDiv.textContent = text;
    messageDiv.style.color = color;
}