# Frontend Testing Guide

## 🎯 Quick Test Flow

### 1. Start All Services

```bash
cd /mnt/c/Users/sunil/Downloads/Reboot-Hackathon-26/Trust-Ledger
./scripts/startnew.sh
```

Wait 2-3 minutes for everything to start.

### 2. Access Frontend

Open browser: **http://localhost:5173**

### 3. Navigate to Test Page

In the browser console or by modifying the Sidebar, navigate to the test page:

```javascript
// In browser console
localStorage.setItem('tl_page', 'fabric_test');
location.reload();
```

**OR** manually go to: **http://localhost:5173/?page=fabric_test**

---

## 🧪 Interactive Test Page Features

The **FabricTest** page provides:

### ✅ Health Check
- Shows network status
- Displays channel & chaincode info
- Real-time connectivity

### ✅ Customer Management
- **Create Test Customer** - Adds random customer to blockchain
- **View All Customers** - Lists all customers from ledger
- **Select Customer** - Click to view details
- **Customer History** - See all transactions

### ✅ KYC Workflow
1. Click customer to select
2. Click **Issue KYC** → Marks as verified
3. Click **Grant Consent** → Allows sharing
4. Click **Verify KYC (Halifax)** → Cross-bank verification

---

## 🔗 Using API Functions in Your Components

### Example 1: Load Customers in Any Page

```javascript
import { getAllCustomersFromChain } from '../services/api';

function MyComponent() {
  const [customers, setCustomers] = useState([]);

  useEffect(() => {
    loadCustomers();
  }, []);

  const loadCustomers = async () => {
    const result = await getAllCustomersFromChain();
    if (result?.success) {
      setCustomers(result.data || []);
    }
  };

  return (
    <div>
      {customers.map(c => (
        <div key={c.customerID}>{c.fullName}</div>
      ))}
    </div>
  );
}
```

### Example 2: Create Customer

```javascript
import { createCustomerOnChain } from '../services/api';

async function handleCreateCustomer(formData) {
  const result = await createCustomerOnChain({
    customerID: `CUST${Date.now()}`,
    fullName: formData.name,
    dateOfBirth: formData.dob,
    email: formData.email,
    phone: formData.phone,
    address: formData.address,
    nationalID: formData.nationalID,
    issuingBank: 'LLOYDS',
    documentHash: formData.documentHash,
  });

  if (result?.success) {
    alert('Customer created on blockchain!');
  } else {
    alert('Failed: ' + result?.message);
  }
}
```

### Example 3: KYC Workflow

```javascript
import {
  issueKycOnChain,
  grantConsentOnChain,
  verifyKycOnChain,
} from '../services/api';

async function completeKycWorkflow(customerID) {
  // Step 1: Issue KYC
  const issue = await issueKycOnChain(customerID);
  console.log('KYC Issued:', issue);

  // Step 2: Grant consent
  const consent = await grantConsentOnChain(customerID);
  console.log('Consent Granted:', consent);

  // Step 3: Verify from another bank
  const verify = await verifyKycOnChain(customerID, 'HALIFAX');
  console.log('KYC Verified:', verify);
}
```

---

## 🔧 Browser Console Testing

You can test API functions directly in browser console:

```javascript
// Import API functions (they're globally available)
const api = await import('/src/services/api.js');

// Check health
const health = await api.getFabricHealth();
console.log(health);

// Get all customers
const customers = await api.getAllCustomersFromChain();
console.log(customers);

// Create customer
const result = await api.createCustomerOnChain({
  customerID: 'CUST999',
  fullName: 'Console Test',
  dateOfBirth: '1990-01-01',
  email: 'test@console.com',
  phone: '9999999999',
  address: 'Console Address',
  nationalID: 'CON999',
  issuingBank: 'LLOYDS',
  documentHash: 'hash999',
});
console.log(result);
```

---

## 📊 Testing Checklist

### Basic Tests
- [ ] Frontend loads at http://localhost:5173
- [ ] Navigate to fabric_test page
- [ ] Health check shows "Healthy"
- [ ] Customer list loads

### Create Flow
- [ ] Click "Create Test Customer"
- [ ] New customer appears in list
- [ ] Customer has PENDING KYC status

### KYC Workflow
- [ ] Select a customer
- [ ] Issue KYC → Status becomes VERIFIED
- [ ] Grant Consent → consentGranted = true
- [ ] Verify KYC → Success message

### Data Integrity
- [ ] Customer history shows all transactions
- [ ] Each action has unique TX ID
- [ ] Timestamps are correct

---

## 🎨 Integrating into Existing Pages

### Option 1: Add to KycRegistry Page

```javascript
// In KycRegistry.jsx
import { getAllCustomersFromChain, issueKycOnChain } from '../services/api';

// Replace database calls with blockchain calls
const loadData = async () => {
  const result = await getAllCustomersFromChain();
  if (result?.success) {
    setCustomers(result.data);
  }
};

const handleIssueKyc = async (customerID) => {
  const result = await issueKycOnChain(customerID);
  if (result?.success) {
    showToast('KYC issued on blockchain!');
    await loadData();
  }
};
```

### Option 2: Add to Dashboard

```javascript
// In Dashboard.jsx
import { getFabricHealth, getAllCustomersFromChain } from '../services/api';

useEffect(() => {
  const loadBlockchainData = async () => {
    const health = await getFabricHealth();
    const customers = await getAllCustomersFromChain();
    
    setBlockchainStatus(health?.healthy ? 'Connected' : 'Disconnected');
    setTotalCustomers(customers?.data?.length || 0);
  };
  
  loadBlockchainData();
}, []);
```

### Option 3: Add to NewCustomerUpload

```javascript
// In NewCustomerUpload.jsx
import { createCustomerOnChain } from '../services/api';

const handleSubmit = async (formData) => {
  // ... process form data ...
  
  // Save to blockchain
  const result = await createCustomerOnChain({
    customerID: generateCustomerID(),
    ...formData,
  });
  
  if (result?.success) {
    showToast('Customer created on blockchain!');
    navigate('kyc_registry');
  }
};
```

---

## 🚀 Production Integration Steps

1. **Replace Mock Data**
   - Remove hardcoded customer lists
   - Use `getAllCustomersFromChain()` instead

2. **Update Forms**
   - Connect create/update forms to `createCustomerOnChain()`
   - Add validation before blockchain submission

3. **Add Loading States**
   - Show spinners during blockchain operations
   - Display transaction IDs after success

4. **Error Handling**
   - Check `result.success` flag
   - Display user-friendly error messages
   - Log blockchain errors for debugging

5. **Real-time Updates**
   - Poll for updates every 10-30 seconds
   - Or implement event listeners (future)

---

## 🐛 Troubleshooting

### Frontend can't connect to backend

**Check:**
```bash
# Backend running?
curl http://localhost:3000/fabric-sdk/health

# Correct port in api.js?
# Should be: const BASE = 'http://localhost:3000';
```

### API returns null

**Check browser console:**
- CORS errors? (Backend should allow localhost:5173)
- Network tab shows 404? (Wrong endpoint)
- 500 error? (Backend issue - check logs)

### Blockchain operations fail

**Check backend logs:**
```bash
tail -f logs/backend.log | grep -E "FabricSDK|Error"
```

**Check network:**
```bash
curl http://localhost:3000/fabric-sdk/health
# Should show: { "healthy": true, ... }
```

---

## 📱 Mobile Testing (Optional)

If testing on mobile device on same network:

1. Find your WSL IP:
   ```bash
   ip addr show eth0 | grep inet
   ```

2. Update `frontend/src/services/api.js`:
   ```javascript
   const BASE = 'http://YOUR_WSL_IP:3000';
   ```

3. Access from mobile: `http://YOUR_WSL_IP:5173`

---

## 🎉 Ready to Test!

1. **Start services:** `./scripts/startnew.sh`
2. **Open browser:** http://localhost:5173
3. **Navigate to test page:** Set `localStorage.setItem('tl_page', 'fabric_test')`
4. **Test blockchain operations!**

**Happy testing! 🚀**

---

**Last Updated:** 2026-07-24  
**Version:** 1.0.0
