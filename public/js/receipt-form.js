class ReceiptForm {
  constructor() {
    this.adminSettings = null;
    this.initEventListeners();
    this.loadAdminSettings();
  }

  async loadAdminSettings() {
    try {
      const response = await fetch('/api/receipts/settings/config');
      this.adminSettings = await response.json();
      this.populateHouseNumbers();
      this.populateGuardFeeOptions();
      this.populateGarbageFeeOptions();
    } catch (error) {
      console.error('Error loading admin settings:', error);
    }
  }

  populateHouseNumbers() {
    const houseSelect = document.getElementById('houseNumber');
    houseSelect.innerHTML = '<option value="">-- Select House --</option>';
    if (this.adminSettings?.houses) {
      this.adminSettings.houses.forEach((house) => {
        const option = document.createElement('option');
        option.value = house.houseNumber;
        option.textContent = `House ${house.houseNumber} (Rent: ${house.rentAmount})`;
        houseSelect.appendChild(option);
      });
      houseSelect.addEventListener('change', () => this.onHouseChange());
    }
  }

  populateGuardFeeOptions() {
    const select = document.getElementById('guardFee');
    select.innerHTML = '<option value="">-- Select Guard Fee --</option>';
    if (this.adminSettings?.guardFeeOptions) {
      this.adminSettings.guardFeeOptions.forEach((option) => {
        const opt = document.createElement('option');
        opt.value = option.value;
        opt.textContent = `${option.label} (${option.value})`;
        select.appendChild(opt);
      });
      select.addEventListener('change', () => this.calculateTotal());
    }
  }

  populateGarbageFeeOptions() {
    const select = document.getElementById('garbageFee');
    select.innerHTML = '<option value="">-- Select Garbage Fee --</option>';
    if (this.adminSettings?.garbageFeeOptions) {
      this.adminSettings.garbageFeeOptions.forEach((option) => {
        const opt = document.createElement('option');
        opt.value = option.value;
        opt.textContent = `${option.label} (${option.value})`;
        select.appendChild(opt);
      });
      select.addEventListener('change', () => this.calculateTotal());
    }
  }

  onHouseChange() {
    const houseNumber = document.getElementById('houseNumber').value;
    const rent = this.getRentAmount(houseNumber);
    document.getElementById('rentDisplay').textContent = rent.toFixed(2);
    document.getElementById('rentTotal').textContent = rent.toFixed(2);
    this.calculateTotal();
  }

  initEventListeners() {
    document.getElementById('waterPrevious').addEventListener('change', () => this.calculateWater());
    document.getElementById('waterCurrent').addEventListener('change', () => this.calculateWater());
    document.getElementById('paymentMode').addEventListener('change', (e) => this.handlePaymentModeChange(e));
    document.getElementById('receiptForm').addEventListener('submit', (e) => this.handleSubmit(e));
  }

  calculateWater() {
    const previous = parseFloat(document.getElementById('waterPrevious').value) || 0;
    const current = parseFloat(document.getElementById('waterCurrent').value) || 0;
    const rate = this.adminSettings?.waterRate || 0;

    const units = current - previous;
    const amount = units * rate;

    document.getElementById('waterUnits').textContent = units.toFixed(2);
    document.getElementById('waterAmountDisplay').textContent = amount.toFixed(2);
    document.getElementById('waterTotal').textContent = amount.toFixed(2);

    this.calculateTotal();
  }

  calculateTotal() {
    const rent = parseFloat(document.getElementById('rentTotal').textContent) || 0;
    const guardFee = parseFloat(document.getElementById('guardFee').value) || 0;
    const garbageFee = parseFloat(document.getElementById('garbageFee').value) || 0;
    const waterAmount = parseFloat(document.getElementById('waterAmountDisplay').textContent) || 0;

    document.getElementById('guardTotal').textContent = guardFee.toFixed(2);
    document.getElementById('garbageTotal').textContent = garbageFee.toFixed(2);

    const total = rent + guardFee + garbageFee + waterAmount;
    document.getElementById('totalDisplay').textContent = total.toFixed(2);
  }

  getRentAmount(houseNumber) {
    if (this.adminSettings?.houses) {
      const house = this.adminSettings.houses.find((h) => h.houseNumber === houseNumber);
      return house ? house.rentAmount : 0;
    }
    return 0;
  }

  handlePaymentModeChange(e) {
    const mode = e.target.value;
    const transactionFields = document.getElementById('transactionFields');
    if (mode === 'mpesa' || mode === 'bank') {
      transactionFields.style.display = 'block';
    } else {
      transactionFields.style.display = 'none';
    }
  }

  async handleSubmit(e) {
    e.preventDefault();

    const houseNumber = document.getElementById('houseNumber').value;
    const previous = parseFloat(document.getElementById('waterPrevious').value);
    const current = parseFloat(document.getElementById('waterCurrent').value);
    const rate = this.adminSettings?.waterRate || 0;

    const receiptData = {
      houseNumber,
      occupantName: document.getElementById('occupantName').value,
      guardFee: parseFloat(document.getElementById('guardFee').value) || 0,
      garbageFee: parseFloat(document.getElementById('garbageFee').value) || 0,
      water: {
        previousReading: previous,
        currentReading: current,
        rate: rate,
      },
      payment: {
        totalReceived: parseFloat(document.getElementById('totalDisplay').textContent),
        mode: document.getElementById('paymentMode').value,
        transactionId: document.getElementById('transactionId').value,
        transactionDate: document.getElementById('transactionDate').value,
      },
    };

    try {
      const response = await fetch('/api/receipts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(receiptData),
      });

      if (!response.ok) {
        throw new Error('Failed to create receipt');
      }

      const receipt = await response.json();
      sessionStorage.setItem('receiptData', JSON.stringify(receipt));
      window.open('/receipt-template.html?id=' + receipt._id, 'receipt');
      this.resetForm();
    } catch (error) {
      alert('Error creating receipt: ' + error.message);
    }
  }

  resetForm() {
    document.getElementById('receiptForm').reset();
    document.getElementById('waterUnits').textContent = '0.00';
    document.getElementById('waterAmountDisplay').textContent = '0.00';
    document.getElementById('totalDisplay').textContent = '0.00';
  }
}

// Initialize form when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  new ReceiptForm();
});