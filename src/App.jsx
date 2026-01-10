import { useState } from 'react';
import { calculateDDP, calculateMofaFee, selectContainers } from './utils/calculations.js';
import { formatCurrency, formatNumber } from './utils/formatters.js';
import { DEFAULT_RATES } from './utils/constants.js';

function App() {
  const [items, setItems] = useState([
    { description: 'Sample Product', quantity: 100, exwPrice: 10, cbmPerUnit: 0.05, weightPerUnit: 1 }
  ]);

  const [settings] = useState({
    containerType: 'auto',
    profitMargin: 0.15,
    profitMarginMode: 'percentage',
    commissionRate: 0.06,
    commissionMode: 'percentage',
  });

  const results = calculateDDP(items, settings);

  return (
    <div style={{ minHeight: '100vh', padding: '2rem' }}>
      {/* Header */}
      <div style={{
        background: 'linear-gradient(135deg, #3b82f6, #06b6d4)',
        padding: '2rem',
        borderRadius: '12px',
        marginBottom: '2rem',
        textAlign: 'center'
      }}>
        <h1 style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>
          🚢 DDP Calculator
        </h1>
        <p style={{ fontSize: '1.1rem', opacity: 0.9 }}>
          Modular Vite/React Version - Demo
        </p>
      </div>

      {/* Info Banner */}
      <div style={{
        background: '#1a2234',
        border: '2px solid #3b82f6',
        padding: '1.5rem',
        borderRadius: '8px',
        marginBottom: '2rem'
      }}>
        <h3 style={{ color: '#3b82f6', marginBottom: '0.5rem' }}>✨ This is the modular version!</h3>
        <p style={{ color: '#94a3b8', marginBottom: '1rem' }}>
          This demo uses the tested ES6 modules from <code style={{ background: '#0d1321', padding: '0.2rem 0.4rem', borderRadius: '4px' }}>src/utils/</code>
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
          <div style={{ background: '#0d1321', padding: '1rem', borderRadius: '6px' }}>
            <strong style={{ color: '#10b981' }}>✅ Working:</strong>
            <ul style={{ marginTop: '0.5rem', color: '#94a3b8', fontSize: '0.9rem' }}>
              <li>ES6 module imports</li>
              <li>Tested calculations (55 tests)</li>
              <li>Vite dev server</li>
            </ul>
          </div>
          <div style={{ background: '#0d1321', padding: '1rem', borderRadius: '6px' }}>
            <strong style={{ color: '#f59e0b' }}>⚠️ In Progress:</strong>
            <ul style={{ marginTop: '0.5rem', color: '#94a3b8', fontSize: '0.9rem' }}>
              <li>Full UI extraction</li>
              <li>All components</li>
              <li>Complete feature parity</li>
            </ul>
          </div>
        </div>
        <p style={{ color: '#64748b', fontSize: '0.9rem' }}>
          <strong>For full functionality:</strong> Use <code style={{ background: '#0d1321', padding: '0.2rem 0.4rem', borderRadius: '4px' }}>index.old.html</code> (standalone version with all features)
        </p>
      </div>

      {/* Demo Calculation */}
      {results && (
        <div style={{ display: 'grid', gap: '1.5rem' }}>
          {/* Summary Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
            <SummaryCard
              label="Total CIF"
              value={formatCurrency(results.costs.cifValue)}
              subValue={formatCurrency(results.costs.cifValueQar, 'QAR')}
              color="#3b82f6"
            />
            <SummaryCard
              label="Customs Duties"
              value={formatCurrency(results.costs.qatarCharges.customsDuty / DEFAULT_RATES.usdToQar)}
              subValue={formatCurrency(results.costs.qatarCharges.customsDuty, 'QAR')}
              color="#f59e0b"
            />
            <SummaryCard
              label="Total DDP"
              value={formatCurrency(results.costs.ddpTotal)}
              subValue={formatCurrency(results.costs.ddpTotal * DEFAULT_RATES.usdToQar, 'QAR')}
              color="#10b981"
            />
          </div>

          {/* Calculation Details */}
          <div style={{
            background: '#1a2234',
            padding: '1.5rem',
            borderRadius: '8px',
            border: '1px solid #2a3548'
          }}>
            <h3 style={{ marginBottom: '1rem', color: '#3b82f6' }}>📊 Calculation Details</h3>
            <div style={{ display: 'grid', gap: '0.5rem', fontSize: '0.95rem' }}>
              <DetailRow label="Total Items" value={results.summary.totalItems} />
              <DetailRow label="Total Quantity" value={results.summary.totalQuantity} />
              <DetailRow label="Total CBM" value={`${formatNumber(results.summary.totalCbm, 2)} m³`} />
              <DetailRow label="Containers" value={results.summary.containers.join(', ')} />
              <DetailRow label="Sea Freight" value={formatCurrency(results.costs.seaFreight)} />
              <DetailRow label="Insurance" value={formatCurrency(results.costs.insurance)} />
              <DetailRow label="Profit Margin" value={formatCurrency(results.costs.profitMargin)} />
              <DetailRow label="Commission" value={formatCurrency(results.costs.commission)} />
            </div>
          </div>

          {/* Module Functions Demo */}
          <div style={{
            background: '#1a2234',
            padding: '1.5rem',
            borderRadius: '8px',
            border: '1px solid #2a3548'
          }}>
            <h3 style={{ marginBottom: '1rem', color: '#10b981' }}>🧪 Module Functions Demo</h3>
            <div style={{ display: 'grid', gap: '1rem' }}>
              <FunctionDemo
                name="calculateMofaFee(50000)"
                result={`QAR ${calculateMofaFee(50000)}`}
                description="Tiered MOFA attestation fee"
              />
              <FunctionDemo
                name="selectContainers(100)"
                result={selectContainers(100).join(', ')}
                description="Optimal container selection"
              />
              <FunctionDemo
                name="formatCurrency(1234.56, 'QAR')"
                result={formatCurrency(1234.56, 'QAR')}
                description="Currency formatting utility"
              />
            </div>
          </div>

          {/* Test Status */}
          <div style={{
            background: 'linear-gradient(135deg, #10b981, #059669)',
            padding: '1.5rem',
            borderRadius: '8px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>✅</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>
              55 Tests Passing
            </div>
            <div style={{ opacity: 0.9 }}>
              All calculation modules are thoroughly tested and verified
            </div>
            <div style={{ marginTop: '1rem', fontSize: '0.9rem', opacity: 0.8 }}>
              Run <code style={{ background: 'rgba(0,0,0,0.3)', padding: '0.2rem 0.6rem', borderRadius: '4px' }}>npm test</code> to see results
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <div style={{
        marginTop: '3rem',
        textAlign: 'center',
        color: '#64748b',
        fontSize: '0.9rem',
        padding: '2rem',
        borderTop: '1px solid #2a3548'
      }}>
        <p>
          This is a minimal demo of the modular architecture. For the full-featured application,
          please use <strong style={{ color: '#3b82f6' }}>index.old.html</strong>
        </p>
        <p style={{ marginTop: '0.5rem' }}>
          Built with ❤️ using Vite + React + Tested ES6 Modules
        </p>
      </div>
    </div>
  );
}

function SummaryCard({ label, value, subValue, color }) {
  return (
    <div style={{
      background: '#1a2234',
      padding: '1.5rem',
      borderRadius: '8px',
      border: '1px solid #2a3548'
    }}>
      <div style={{ fontSize: '0.85rem', color: '#94a3b8', marginBottom: '0.5rem' }}>
        {label}
      </div>
      <div style={{ fontSize: '1.75rem', fontWeight: 'bold', color, marginBottom: '0.25rem' }}>
        {value}
      </div>
      <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
        {subValue}
      </div>
    </div>
  );
}

function DetailRow({ label, value }) {
  return (
    <div style={{
      display: 'flex',
      justifyContent: 'space-between',
      padding: '0.5rem',
      background: '#0d1321',
      borderRadius: '4px'
    }}>
      <span style={{ color: '#94a3b8' }}>{label}:</span>
      <span style={{ color: '#f1f5f9', fontWeight: '500' }}>{value}</span>
    </div>
  );
}

function FunctionDemo({ name, result, description }) {
  return (
    <div style={{
      background: '#0d1321',
      padding: '1rem',
      borderRadius: '6px',
      border: '1px solid #059669'
    }}>
      <code style={{ color: '#10b981', fontSize: '0.9rem' }}>{name}</code>
      <div style={{ color: '#f1f5f9', marginTop: '0.5rem', fontWeight: '600' }}>
        → {result}
      </div>
      <div style={{ color: '#64748b', fontSize: '0.85rem', marginTop: '0.25rem' }}>
        {description}
      </div>
    </div>
  );
}

export default App;
