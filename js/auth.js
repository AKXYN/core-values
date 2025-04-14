const isGitHubPages = window.location.host.includes('github.io');
const basePath = isGitHubPages ? '/core-values' : '';
const loginUrl = getPageUrl('auth.html');

let isLogin = true;

// DOM Elements
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');
const passwordField = document.getElementById('password-field');
const authButton = document.getElementById('auth-action');
const toggleLink = document.getElementById('toggle-link');
const messageDiv = document.getElementById('message');
const authTitle = document.getElementById('auth-title');
const companyInput = document.getElementById('company-name');
const companyField = document.getElementById('company-field');

updateUI();

// Toggle between Login/Register
toggleLink.addEventListener('click', (e) => {
    e.preventDefault();
    isLogin = !isLogin;
    updateUI();
});

function updateUI() {
    // Reset input fields when switching modes
    emailInput.value = "";
    passwordInput.value = "";
    if (companyInput) companyInput.value = "";
    
    if (isLogin) {
        authTitle.textContent = "Login";
        authButton.textContent = "Login";
        passwordField.style.display = "block";
        companyField.style.display = "none"; // Hide company field
        toggleLink.innerHTML = 'No account? <a href="#" id="toggle-link">Register instead</a>';
    } else {
        authTitle.textContent = "Register";
        authButton.textContent = "Send Password";
        passwordField.style.display = "none";
        companyField.style.display = "block"; // Show company field
        toggleLink.innerHTML = 'Have account? <a href="#" id="toggle-link">Login instead</a>';
    }
}

// Handle form submission
authButton.addEventListener('click', handleAuth);

async function handleAuth() {
    const email = emailInput.value.trim();
    
    if (!email) {
        showMessage("Please enter email", "red");
        return;
    }

    try {
        if (isLogin) {
            // LOGIN FLOW
            const password = passwordInput.value;
            console.log("User entered this password",password);
            await firebase.auth().signInWithEmailAndPassword(email, password);
            showMessage("Login successful! Redirecting...", "green");
            setTimeout(() => navigateToPage('dashboard.html'), 1000);
        } else {
            // REGISTER FLOW

            const companyName = companyInput.value.trim();
            if (!companyName) {
                showMessage("Please enter company name", "red");
                return;
            }

            const randomPassword = generateRandomPassword();
            console.log("Generated password:", randomPassword);
            
            try {
                // 1. First create the auth user
                console.log("Creating user with email:", email);
                const userCredential = await firebase.auth().createUserWithEmailAndPassword(email, randomPassword);
                
                // 2. Get the created user's UID
                const user = userCredential.user;
                console.log("User created successfully with UID:", user.uid);
                
                // 3. Now create the company document
                console.log("Creating company document for:", companyName);
                await firebase.firestore().collection('companies').doc(user.uid).set({
                    name: companyName,
                    adminEmail: email,
                    createdAt: firebase.firestore.FieldValue.serverTimestamp()
                });
                console.log("Company document created successfully");

                console.log("Sending email with password");
                await emailjs.send('service_zkrdtgj', 'template_sshzxpg', {
                    email: email,
                    password: randomPassword,
                    login_url: loginUrl
                });
                
                showMessage("Password sent to your email!", "green");
                emailInput.value = "";
                companyInput.value = ""; // Reset company name field

            } catch (error) {
                console.error("Registration error:", error);
                if (error.code === 'auth/email-already-in-use') {
                    showMessage("This email is already registered. Please login instead.", "red");
                } else if (error.code === 'auth/invalid-email') {
                    showMessage("Invalid email format. Please check your email address.", "red");
                } else if (error.code === 'auth/operation-not-allowed') {
                    showMessage("Email/password accounts are not enabled. Please contact support.", "red");
                } else if (error.code === 'auth/weak-password') {
                    showMessage("Password is too weak. Please try again.", "red");
                } else {
                    showMessage(`Registration failed: ${error.message}`, "red");
                }
            }
        }
    } catch (error) {
        console.error("Authentication error:", error);
        if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
            showMessage("Invalid email or password", "red");
        } else if (error.code === 'auth/too-many-requests') {
            showMessage("Too many failed login attempts. Please try again later.", "red");
        } else {
            showMessage(`Login failed: ${error.message}`, "red");
        }
    }
}

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