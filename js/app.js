// Service Worker Registration
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
            .then(registration => {
                console.log('ServiceWorker registration successful with scope: ', registration.scope);
            })
            .catch(error => {
                console.log('ServiceWorker registration failed: ', error);
            });
    });
}

const PRIMARY_ACCOUNT_KEY = 'primaryAccount';

document.addEventListener('DOMContentLoaded', () => {
    const appContainer = document.getElementById('app');
    
    // Simple check for a "logged in" state. For now, always "logged in".
    // In a real scenario, this would involve checking a token or session.
    const isLoggedIn = true; // Placeholder - always true for now

    if (isLoggedIn) {
        const primaryAccountSetupDiv = document.createElement('div');
        primaryAccountSetupDiv.id = 'primary-account-setup';

        const accountManagementDiv = document.createElement('div');
        accountManagementDiv.id = 'account-management';

        appContainer.appendChild(primaryAccountSetupDiv);
        appContainer.appendChild(accountManagementDiv);
        renderCurrentState(); // Proceed to primary account check or management view
    } else {
        renderLoginPlaceholder(appContainer);
    }
});

function renderLoginPlaceholder(container) {
    container.innerHTML = `
        <div class="container" style="text-align: center; padding-top: 50px;">
            <h2>Referral Account Manager</h2>
            <p>This application is a companion tool for managing account hierarchies related to azinonet.com.</p>
            <p>Account creation and primary authentication are handled by azinonet.com.</p>
            <div style="margin-top: 30px; padding: 20px; background-color: #f0f0f0; border-radius: 8px;">
                <p><strong>Login Placeholder:</strong></p>
                <p>In a future version, you would log in via azinonet.com here.</p>
                <button onclick="assumeLoggedIn()">Proceed to App (Demo)</button>
            </div>
        </div>
    `;
}

// This function is purely for the placeholder demo to bypass the "login"
function assumeLoggedIn() {
    const appContainer = document.getElementById('app');
    appContainer.innerHTML = ''; // Clear login placeholder

    const primaryAccountSetupDiv = document.createElement('div');
    primaryAccountSetupDiv.id = 'primary-account-setup';
    const accountManagementDiv = document.createElement('div');
    accountManagementDiv.id = 'account-management';

    appContainer.appendChild(primaryAccountSetupDiv);
    appContainer.appendChild(accountManagementDiv);
    renderCurrentState();
}


function renderCurrentState() {
    const primaryAccount = getPrimaryAccount();
    if (!primaryAccount) {
        renderPrimaryAccountForm();
        clearAccountManagement(); // Ensure this clears only its specific content
        clearSlotSuggestions(); // Clear suggestions if no primary account
    } else {
        clearPrimaryAccountForm();
        renderAccountManagement(primaryAccount); // This also calls displayFullHierarchy & updateSlotSuggestions
    }
}

function clearSlotSuggestions() {
    const suggestionContainer = document.getElementById('slot-suggestion-container');
    if (suggestionContainer) {
        suggestionContainer.innerHTML = '';
    }
}


function renderPrimaryAccountForm() {
    const primaryAccountSetupDiv = document.getElementById('primary-account-setup');
    if (!primaryAccountSetupDiv) return;

    primaryAccountSetupDiv.innerHTML = `
        <form id="primaryAccountForm">
            <h3>Set Up Primary Account</h3>
            <p>This account will be the root of your referral network. All fields are required.</p>
            <div>
                <label for="primaryName">Full Name:</label>
                <input type="text" id="primaryName" name="primaryName" required>
            </div>
            <div>
                <label for="primaryUsername">Username:</label>
                <input type="text" id="primaryUsername" name="primaryUsername" required>
            </div>
            <div>
                <label for="primaryEmail">Email:</label>
                <input type="email" id="primaryEmail" name="primaryEmail" required>
            </div>
            <div>
                <label for="primaryPhone">Phone Number:</label>
                <input type="tel" id="primaryPhone" name="primaryPhone" required>
            </div>
            <div>
                <label for="primaryDob">Date of Birth:</label>
                <input type="date" id="primaryDob" name="primaryDob" required>
            </div>
            <div>
                <label for="primaryAddress">Address:</label>
                <input type="text" id="primaryAddress" name="primaryAddress" required>
            </div>
            <div>
                <label for="primaryState">State:</label>
                <input type="text" id="primaryState" name="primaryState" required>
            </div>
            <div>
                <label for="primaryCountry">Country:</label>
                <input type="text" id="primaryCountry" name="primaryCountry" required>
            </div>
            <div>
                <label for="primaryPassword">Password (for azinonet.com):</label>
                <input type="password" id="primaryPassword" name="primaryPassword">
                <p style="font-size:0.8em; color: #666;">For your reference only. This password will NOT be saved by this application.</p>
            </div>
            <button type="submit">Set Primary Account</button>
        </form>
    `;

    const form = document.getElementById('primaryAccountForm');
    form.addEventListener('submit', handleSetPrimaryAccount);
}

function clearPrimaryAccountForm() {
    const primaryAccountSetupDiv = document.getElementById('primary-account-setup');
    if (primaryAccountSetupDiv) {
        primaryAccountSetupDiv.innerHTML = '';
    }
}

function handleSetPrimaryAccount(event) {
    event.preventDefault();
    const form = event.target;
    const name = form.primaryName.value;
    const username = form.primaryUsername.value;
    const email = form.primaryEmail.value;
    const phone = form.primaryPhone.value;
    const dob = form.primaryDob.value;
    const address = form.primaryAddress.value;
    const state = form.primaryState.value;
    const country = form.primaryCountry.value;

    // Validation
    if (!name.trim() || !username.trim() || !email.trim() || !phone.trim() || 
        !dob.trim() || !address.trim() || !state.trim() || !country.trim()) {
        alert('All fields are required for the primary account.');
        return;
    }

    if (!isValidEmail(email)) {
        alert('Invalid email format. Please enter a valid email address.');
        return;
    }

    if (!isValidPhone(phone)) {
        alert('Invalid phone number format. Please enter a valid phone number.');
        return;
    }

    const primaryAccountData = {
        id: generateAccountId(),
        username: username,
        email: email,
        name: name,
        phone: phone,
        dob: dob,
        address: address,
        state: state,
        country: country,
        parentId: null,
        children: [],
        level: 0, 
        isPrimary: true
    };

    localStorage.setItem(PRIMARY_ACCOUNT_KEY, JSON.stringify(primaryAccountData));
    localStorage.setItem('accountTree', JSON.stringify([primaryAccountData]));
    alert('Primary Account set successfully with all details!');
    renderCurrentState();
}

function getPrimaryAccount() {
    const accountData = localStorage.getItem(PRIMARY_ACCOUNT_KEY);
    return accountData ? JSON.parse(accountData) : null;
}

function generateAccountId() {
    return 'acc_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
}

function renderAccountManagement(primaryAccount) {
    const accountManagementDiv = document.getElementById('account-management');
    if (!accountManagementDiv) return;

    // Display more details for the primary account
    let primaryAccountDetailsHtml = `
        <p><strong>Name:</strong> ${primaryAccount.name || 'N/A'}</p>
        <p><strong>Username:</strong> ${primaryAccount.username}</p>
        <p><strong>Email:</strong> ${primaryAccount.email}</p>
        <p><strong>Phone:</strong> ${primaryAccount.phone || 'N/A'}</p>
        <p><strong>Date of Birth:</strong> ${primaryAccount.dob || 'N/A'}</p>
        <p><strong>Address:</strong> ${primaryAccount.address || 'N/A'}</p>
        <p><strong>State:</strong> ${primaryAccount.state || 'N/A'}</p>
        <p><strong>Country:</strong> ${primaryAccount.country || 'N/A'}</p>
        <p><strong>Account ID:</strong> ${primaryAccount.id}</p>
        <p><strong>Level:</strong> ${primaryAccount.level}</p>
    `;

    accountManagementDiv.innerHTML = `
        <h3>Primary Account Details</h3>
        <div id="account-display">
            ${primaryAccountDetailsHtml}
        </div>
        <button id="resetPrimaryAccount">Reset Primary Account</button>
        <hr>
        <h3>Account Hierarchy</h3>
        <div id="hierarchy-display">
            <ul id="account-tree"></ul>
        </div>
        <div id="slot-suggestion-container" style="margin-top: 15px; padding: 10px; background-color: #eef; border-radius: 5px;">


function clearAccountManagement() {
    const accountManagementDiv = document.getElementById('account-management');
    if (accountManagementDiv) {
        accountManagementDiv.innerHTML = '';
    }
}

function getAccountTree() {
    const treeData = localStorage.getItem('accountTree');
    return treeData ? JSON.parse(treeData) : [];
}

function saveAccountTree(tree) {
    localStorage.setItem('accountTree', JSON.stringify(tree));
    // Also update primary account if the root of the tree is modified (e.g. children added)
    if (tree.length > 0 && tree[0].isPrimary) {
        localStorage.setItem(PRIMARY_ACCOUNT_KEY, JSON.stringify(tree[0]));
    }
}

function findAccountById(accountId, accounts) {
    for (let account of accounts) {
        if (account.id === accountId) {
            return account;
        }
        // This simple find won't work for nested children directly from a flat list
        // if we change storage. For now, accountTree is flat.
    }
    return null; 
}


function displayFullHierarchy() {
    const treeContainer = document.getElementById('account-tree');
    if (!treeContainer) return;

    const accounts = getAccountTree();
    const primaryAccount = accounts.find(acc => acc.isPrimary);

    if (!primaryAccount) {
        treeContainer.innerHTML = "<p>No primary account set. Hierarchy cannot be displayed.</p>";
        return;
    }

    treeContainer.innerHTML = ''; // Clear previous tree
    const ul = buildHierarchyRecursive(primaryAccount, accounts);
    treeContainer.appendChild(ul);
}

function buildHierarchyRecursive(parentAccount, allAccounts, currentLevel = 0) {
    const li = document.createElement('li');
    li.innerHTML = `
        <span>${parentAccount.username} (ID: ${parentAccount.id}, Level: ${parentAccount.level})</span>
    `;

    // Add "Add Child" button if rules allow
    if (parentAccount.children.length < 2 && parentAccount.level < 20) {
        const addChildBtn = document.createElement('button');
        addChildBtn.textContent = 'Add Child';
        addChildBtn.classList.add('add-child-btn');
        addChildBtn.onclick = () => renderAddChildForm(parentAccount.id);
        li.appendChild(addChildBtn);
    } else if (parentAccount.children.length >= 2) {
        const maxChildrenMsg = document.createElement('span');
        maxChildrenMsg.textContent = ' (Max children reached)';
        maxChildrenMsg.style.fontSize = '0.8em';
        maxChildrenMsg.style.marginLeft = '10px';
        li.appendChild(maxChildrenMsg);
    } else if (parentAccount.level >= 20) {
         const maxLevelMsg = document.createElement('span');
        maxLevelMsg.textContent = ' (Max level reached)';
        maxLevelMsg.style.fontSize = '0.8em';
        maxLevelMsg.style.marginLeft = '10px';
        li.appendChild(maxLevelMsg);
    }

    // Display info about children count
    const childrenInfo = document.createElement('span');
    childrenInfo.textContent = ` Children: ${parentAccount.children.length}/2`;
    childrenInfo.style.fontSize = '0.8em';
    childrenInfo.style.marginLeft = '10px';
    li.appendChild(childrenInfo);


    const childrenAccounts = parentAccount.children.map(childId => {
        return allAccounts.find(acc => acc.id === childId);
    }).filter(acc => acc); 

    if (childrenAccounts.length > 0) {
        const subUl = document.createElement('ul');
        childrenAccounts.forEach(childAccount => {
            subUl.appendChild(buildHierarchyRecursive(childAccount, allAccounts, childAccount.level));
        });
        li.appendChild(subUl);
    }
    return li; // This should be the li element for the parentAccount
}


function renderAddChildForm(parentId) {
    const formContainer = document.getElementById('add-child-form-container');
    if (!formContainer) return;

    const accounts = getAccountTree();
    const parentAccount = accounts.find(acc => acc.id === parentId);

    if (!parentAccount) {
        alert('Parent account not found!');
        return;
    }
    if (parentAccount.children.length >= 2) {
        alert('This parent already has the maximum number of children (2).');
        return;
    }
    if (parentAccount.level >= 20) {
        alert('Cannot add children beyond level 20.');
        return;
    }

    formContainer.innerHTML = `
        <form id="addChildAccountForm">
            <h4>Add Child to ${parentAccount.username} (ID: ${parentAccount.id}) - New Child will be Level ${parentAccount.level + 1}</h4>
            <p>All fields are required.</p>
            <input type="hidden" id="childParentId" name="childParentId" value="${parentId}">
            <div>
                <label for="childName">Full Name:</label>
                <input type="text" id="childName" name="childName" required>
            </div>
            <div>
                <label for="childUsername">Username:</label>
                <input type="text" id="childUsername" name="childUsername" required>
            </div>
            <div>
                <label for="childEmail">Email:</label>
                <input type="email" id="childEmail" name="childEmail" required>
            </div>
            <div>
                <label for="childPhone">Phone Number:</label>
                <input type="tel" id="childPhone" name="childPhone" required>
            </div>
            <div>
                <label for="childDob">Date of Birth:</label>
                <input type="date" id="childDob" name="childDob" required>
            </div>
            <div>
                <label for="childAddress">Address:</label>
                <input type="text" id="childAddress" name="childAddress" required>
            </div>
            <div>
                <label for="childState">State:</label>
                <input type="text" id="childState" name="childState" required>
            </div>
            <div>
                <label for="childCountry">Country:</label>
                <input type="text" id="childCountry" name="childCountry" required>
            </div>
            <div>
                <label for="childPassword">Password (for azinonet.com):</label>
                <input type="password" id="childPassword" name="childPassword">
                <p style="font-size:0.8em; color: #666;">For your reference only. This password will NOT be saved by this application.</p>
            </div>
            <button type="submit">Create Child Account</button>
            <button type="button" onclick="cancelAddChild()">Cancel</button>
        </form>
    `;

    document.getElementById('addChildAccountForm').addEventListener('submit', handleCreateChildAccount);
}

function cancelAddChild() {
    const formContainer = document.getElementById('add-child-form-container');
    if (formContainer) {
        formContainer.innerHTML = '';
    }
}

function handleCreateChildAccount(event) {
    event.preventDefault();
    const form = event.target;
    const parentId = form.childParentId.value;
    const name = form.childName.value;
    const username = form.childUsername.value;
    const email = form.childEmail.value;
    const phone = form.childPhone.value;
    const dob = form.childDob.value;
    const address = form.childAddress.value;
    const state = form.childState.value;
    const country = form.childCountry.value;

    if (!name.trim() || !username.trim() || !email.trim() || !phone.trim() ||
        !dob.trim() || !address.trim() || !state.trim() || !country.trim()) {
        alert('All fields are required for the new account.');
        return;
    }

    if (!isValidEmail(email)) {
        alert('Invalid email format for child account. Please enter a valid email address.');
        return;
    }
    
    if (!isValidPhone(phone)) {
        alert('Invalid phone number format for child account. Please enter a valid phone number.');
        return;
    }

    let accounts = getAccountTree();
    const parentAccount = accounts.find(acc => acc.id === parentId); // Find in the mutable list

    if (!parentAccount) {
        alert('Error: Parent account not found during child creation.');
        return;
    }
    if (parentAccount.children.length >= 2) {
        alert('Error: Parent already has maximum children. Cannot add more.');
        cancelAddChild();
        displayFullHierarchy(); // Refresh hierarchy to show correct state
        return;
    }
    if (parentAccount.level >= 20) {
        alert('Error: Cannot add children beyond level 20.');
        cancelAddChild();
        displayFullHierarchy(); // Refresh hierarchy
        return;
    }
    
    const newAccountId = generateAccountId();
    const newAccount = {
        id: newAccountId,
        username: username,
        email: email,
        name: name,
        phone: phone,
        dob: dob,
        address: address,
        state: state,
        country: country,
        parentId: parentId,
        children: [],
        level: parentAccount.level + 1,
        isPrimary: false
    };

    // Add new account to the flat list
    accounts.push(newAccount);
    // Update parent's children list
    parentAccount.children.push(newAccountId);

    saveAccountTree(accounts);
    alert('Child account created successfully!');
    cancelAddChild(); // Clear the form
    displayFullHierarchy(); // Refresh the displayed hierarchy
    // If primary account was updated (e.g. its children array), renderCurrentState will handle it via saveAccountTree
    renderCurrentState(); // Re-render to update primary account view if necessary
    updateSlotSuggestions(); // Update suggestions after a new child is added
}

function updateSlotSuggestions() {
    const suggestionContainer = document.getElementById('slot-suggestion-container');
    if (!suggestionContainer) return;

    const accounts = getAccountTree();
    if (accounts.length === 0) {
        suggestionContainer.innerHTML = '<p>No accounts yet. Start by setting up the Primary Account.</p>';
        return;
    }

    // Find the lowest level that is not yet full
    let targetLevel = 0;
    let foundTargetLevel = false;
    const maxObservedLevel = Math.max(...accounts.map(acc => acc.level), 0);

    for (let l = 0; l <= maxObservedLevel + 1 && l < 20; l++) { // Iterate up to potential next level, capped by max depth
        const accountsAtLevel = accounts.filter(acc => acc.level === l);
        const potentialSlotsAtLevel = Math.pow(2, l); // For level 0, 2^0=1; level 1, 2^1=2; level 2, 2^2=4

        if (accountsAtLevel.length < potentialSlotsAtLevel) {
            // This level is not full in terms of number of accounts that *could* exist.
            // This check is more about structural completeness than child slots.
            // We need to find parents for these potential slots.
            if (l > 0) { // Children need parents from level l-1
                const parentLevelAccounts = accounts.filter(acc => acc.level === l - 1);
                const parentsWithOpenSlotsAtPrevLevel = parentLevelAccounts.filter(p => p.children.length < 2);
                if (parentsWithOpenSlotsAtPrevLevel.length > 0) {
                    targetLevel = l -1; // We need to add children to parents at l-1 to populate level l
                    foundTargetLevel = true;
                    break;
                }
            } else { // l === 0, primary account level. If no primary, handled by initial check.
                 const primary = accounts.find(a => a.isPrimary);
                 if (primary && primary.children.length < 2) {
                    targetLevel = 0;
                    foundTargetLevel = true;
                    break;
                 }
            }
        }
        
        // If level 'l' is structurally complete (has 2^l accounts), check if all accounts at this level have 2 children
        const parentsAtCurrentLevelWithOpenSlots = accountsAtLevel.filter(p => p.children.length < 2 && p.level < 19); // level 19 can still have children for level 20
        if (parentsAtCurrentLevelWithOpenSlots.length > 0) {
            targetLevel = l;
            foundTargetLevel = true;
            break;
        }
        
        if (l === maxObservedLevel && parentsAtCurrentLevelWithOpenSlots.length === 0 && l < 19) {
            // Current max level is full, next target is this level's children (i.e., parents at this level)
             targetLevel = l; // The parents are at this level, for children at l+1
             foundTargetLevel = true; // Will be caught by the above if any has open slots
        }
    }
    
    if (!foundTargetLevel && maxObservedLevel >= 19) { // Check if max depth reached for suggestions
         suggestionContainer.innerHTML = '<p>Maximum hierarchy depth (Level 20 children) is being approached or filled. No further suggestions for new parent slots.</p>';
        return;
    }


    const suggestedParents = accounts.filter(acc => acc.level === targetLevel && acc.children.length < 2 && acc.level < 20);

    if (suggestedParents.length > 0) {
        let suggestionsHtml = `<p><strong>Next available slots for children (at Level ${targetLevel + 1}):</strong></p><ul>`;
        suggestedParents.forEach(parent => {
            suggestionsHtml += `<li>Parent: ${parent.username} (ID: ${parent.id}, Level: ${parent.level}, Children: ${parent.children.length}/2) 
                                <button onclick="scrollToAndRenderAddChildForm('${parent.id}')">Add Child Here</button></li>`;
        });
        suggestionsHtml += `</ul>`;
        suggestionContainer.innerHTML = suggestionsHtml;
    } else {
        if (targetLevel < 19) { // Check if we can go deeper
             suggestionContainer.innerHTML = `<p>All accounts at Level ${targetLevel} are full. Focus on creating children for Level ${targetLevel +1}.</p><p>If Level ${targetLevel} is the current maximum level, accounts at this level will be parents for the next level.</p>`;
        } else {
             suggestionContainer.innerHTML = `<p>All available slots up to level 19 parents (for level 20 children) seem full or the max depth is reached.</p>`;
        }
    }
}

function scrollToAndRenderAddChildForm(parentId) {
    renderAddChildForm(parentId); // Render the form first
    const formContainer = document.getElementById('add-child-form-container');
    if (formContainer) {
        formContainer.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
}


// --- Validation Functions ---
function isValidEmail(email) {
    // Basic email validation regex
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

// Placeholder for phone validation
function isValidPhone(phone) {
    // Basic phone validation (e.g., allows digits, +, -, spaces, parentheses)
    // This is very permissive and should be tailored if specific formats are required.
    const phoneRegex = /^[+]?[\d\s\-()]+$/; 
    if (!phoneRegex.test(phone)) return false;
    // Optionally, check for a minimum number of digits (e.g., after stripping non-digits)
    // const digits = phone.replace(/\D/g, '');
    // return digits.length >= 7; // Example: at least 7 digits
    return true; // Keeping it simple for now
}

// --- CSV Export Function ---
function exportDataToCSV() {
    const accounts = getAccountTree();
    if (accounts.length === 0) {
        alert('No account data to export.');
        return;
    }

    // Define CSV Headers
    // "Referral" is parentId. Added Account ID.
    const headers = [
        'Account ID', 'Username', 'Name', 'Email', 'Phone', 'Date of Birth', 
        'Address', 'State', 'Country', 'Level', 'Parent ID', 'Children Count'
    ];

    let csvContent = headers.join(',') + '\r\n';

    // Iterate through accounts and build CSV rows
    // We can sort by level then by parentId for a more structured CSV if desired,
    // but for now, just iterating through the stored order.
    accounts.forEach(account => {
        const childrenCount = account.children ? account.children.length : 0;
        const row = [
            `"${account.id}"`,
            `"${account.username || ''}"`,
            `"${account.name || ''}"`,
            `"${account.email || ''}"`,
            `"${account.phone || ''}"`,
            `"${account.dob || ''}"`,
            `"${(account.address || '').replace(/"/g, '""')}"`, // Escape double quotes in address
            `"${account.state || ''}"`,
            `"${account.country || ''}"`,
            account.level,
            `"${account.parentId || 'N/A'}"`,
            childrenCount
        ];
        csvContent += row.join(',') + '\r\n';
    });

    // Create a blob and trigger download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    if (link.download !== undefined) { // Feature detection
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', 'referral_accounts_export.csv');
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    } else {
        alert('CSV export is not supported in your browser.');
    }
}


// Service Worker Registration
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
            .then(registration => {
                console.log('ServiceWorker registration successful with scope: ', registration.scope);
            })
            .catch(error => {
                console.log('ServiceWorker registration failed: ', error);
            });
    });
}
