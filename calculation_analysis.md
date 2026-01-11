# Analysis of DDP Calculation Discrepancies

## Comparison between PDF Reports and Current Code

### From the PDF Data (DDP-Report-2026-01-09):
- **Total EXW Cost**: $9,849.68
- **DDP Total Cost**: $17,595.16
- **Cost Increase**: $7,745.48 (78.6%)
- **Total CBM**: 39.57
- **Container**: 40GP (59.1% utilization)
- **Settings**: 15% profit margin, 0% commission

### Key Cost Components from PDF:
1. **China Costs**:
   - EXW Product Cost: $9,849.68
   - Domestic China Shipping: $0.00 (FOB pricing)

2. **International Shipping**:
   - Sea Freight: $3,200.00 (40GP container)
   - Insurance (0.5% of CIF): $65.25
   - Certification: $150.00
   - CIF Value: $13,114.93

3. **Qatar Clearance Costs (QAR)**:
   - Customs Duty (5%): QAR 2,393.47
   - Mwani Charges: QAR 160.00
   - Customs Service Fee: QAR 250.00
   - Delivery Order: QAR 1,000.00 (40GP)
   - Terminal Handling (THC): QAR 1,000.00 (40GP)
   - Container Return: QAR 300.00 (40GP)
   - Container Maintenance: QAR 40.04 (40GP)
   - Terminal Inspection: QAR 35.00
   - Inspection Charge: QAR 50.00
   - MOFA Attestation: (Tiered based on invoice value)

### Potential Issues Identified:

1. **CBM Utilization Calculation**: The PDF shows 59.1% utilization for a 40GP container. 
   - 40GP capacity: 67 CBM (from constants)
   - 39.57 CBM / 67 CBM = 59.0% ✓ (matches)

2. **CIF Value Calculation**: PDF shows $13,114.93
   - Expected: $9,849.68 + $3,200.00 + $150.00 + $65.25 = $13,264.93
   - Actual PDF: $13,114.93
   - **Difference**: -$150.00 (certification cost may be excluded from CIF?)

3. **Insurance Calculation**: PDF shows $65.25
   - 0.5% of CIF should be calculated on: Cost + Freight (excluding insurance)
   - ($9,849.68 + $3,200.00 + $150.00) × 0.005 = $65.00
   - PDF shows $65.25 - slight rounding difference

4. **MOFA Attestation**: The PDF mentions "Tiered based on invoice value" but specific amount not clearly visible

5. **Final DDP Calculation**: 
   - Expected landed cost before margin: ~$15,300
   - With 15% margin: ~$17,600
   - PDF shows: $17,595.16 ✓ (very close)

### Missing or Incorrect Elements:

1. **CIF Value Definition**: The current code might be including certification in CIF, but traditional CIF doesn't include destination costs
2. **Insurance Base Calculation**: Should be on (Cost + Freight) before insurance
3. **MOFA Fee Calculation**: Need to verify the exact tiered calculation is working correctly
4. **Rounding**: Minor rounding differences throughout the calculation chain

### Recommendations:

1. Verify CIF calculation excludes certification costs
2. Ensure insurance calculation base is correct
3. Check MOFA tiered fee calculation accuracy
4. Implement proper rounding at each calculation step
5. Review if any fees are double-counted or missing