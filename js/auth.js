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
            
            try {

                // 1. First create the auth user
                const userCredential = await firebase.auth().createUserWithEmailAndPassword(email, randomPassword);
                
                // 2. Get the created user's UID
                const user = userCredential.user;
                
                // 3. Now create the company document
                await firebase.firestore().collection('companies').doc(user.uid).set({
                    name: companyName,
                    adminEmail: email,
                    createdAt: firebase.firestore.FieldValue.serverTimestamp()
                });

                await emailjs.send('service_zkrdtgj', 'template_sshzxpg', {
                    email: email,
                    password: randomPassword,
                    login_url: loginUrl
                });
                
                showMessage("Password sent to your email!", "green");
                emailInput.value = "";
                companyInput.value = ""; // Reset company name field

            } catch (emailError) {
                console.error("Email sending failed");
            }
        }
    } catch (error) {
        showMessage("Login failed", "red");
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
