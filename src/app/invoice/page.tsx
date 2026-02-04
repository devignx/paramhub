'use client';

import { useSearchParams } from 'next/navigation';
import { useEffect, useState, Suspense } from 'react';
import Link from 'next/link';
import { pack, unpack, copyToClipboard } from '@/lib/url-utils';

interface InvoiceItem {
  description: string;
  quantity: number;
  price: number;
}

interface InvoiceConfig {
  from: {
    name: string;
    address: string;
    email: string;
  };
  to: {
    name: string;
    address: string;
    email: string;
  };
  invoiceNumber: string;
  date: string;
  dueDate: string;
  items: InvoiceItem[];
  notes: string;
  currency: string;
}

function InvoiceContent() {
  const searchParams = useSearchParams();
  const [isCreating, setIsCreating] = useState(true);
  const [config, setConfig] = useState<InvoiceConfig>({
    from: { name: '', address: '', email: '' },
    to: { name: '', address: '', email: '' },
    invoiceNumber: `INV-${Date.now().toString(36).toUpperCase()}`,
    date: new Date().toISOString().split('T')[0],
    dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    items: [{ description: '', quantity: 1, price: 0 }],
    notes: '',
    currency: 'USD',
  });
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const hash = window.location.hash;
    if (hash) {
      const data = unpack<InvoiceConfig>(hash.slice(1));
      if (data) {
        setIsCreating(false);
        setConfig(data);
      }
    }
  }, [searchParams]);

  const subtotal = config.items.reduce((sum, item) => sum + item.quantity * item.price, 0);
  const total = subtotal;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: config.currency,
    }).format(amount);
  };

  const generateUrl = () => {
    const hash = pack(config);
    return `${window.location.origin}/invoice#${hash}`;
  };

  const handleCopy = async () => {
    const url = generateUrl();
    const success = await copyToClipboard(url);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const addItem = () => {
    setConfig({
      ...config,
      items: [...config.items, { description: '', quantity: 1, price: 0 }],
    });
  };

  const updateItem = (index: number, field: keyof InvoiceItem, value: string | number) => {
    const newItems = [...config.items];
    newItems[index] = { ...newItems[index], [field]: value };
    setConfig({ ...config, items: newItems });
  };

  const removeItem = (index: number) => {
    setConfig({
      ...config,
      items: config.items.filter((_, i) => i !== index),
    });
  };

  if (!isCreating) {
    return (
      <div className="min-h-screen bg-slate-100 py-8 px-4 print:bg-white print:py-0">
        <div className="max-w-3xl mx-auto">
          {/* Print button */}
          <div className="no-print mb-6 flex gap-3">
            <button
              onClick={handlePrint}
              className="px-6 py-3 bg-teal-600 text-white rounded-lg font-semibold hover:bg-teal-700 transition-colors"
            >
              Print / Save as PDF
            </button>
            <Link
              href="/invoice"
              className="px-6 py-3 bg-slate-200 text-slate-700 rounded-lg font-semibold hover:bg-slate-300 transition-colors"
            >
              Create Your Own
            </Link>
          </div>

          {/* Invoice */}
          <div className="bg-white rounded-xl shadow-lg p-8 md:p-12 print-container">
            {/* Header */}
            <div className="flex justify-between items-start mb-12">
              <div>
                <h1 className="text-4xl font-bold text-slate-800 mb-2">INVOICE</h1>
                <p className="text-slate-500">#{config.invoiceNumber}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-slate-500">Date</p>
                <p className="font-semibold text-slate-800">{new Date(config.date).toLocaleDateString()}</p>
                <p className="text-sm text-slate-500 mt-2">Due Date</p>
                <p className="font-semibold text-slate-800">{new Date(config.dueDate).toLocaleDateString()}</p>
              </div>
            </div>

            {/* From / To */}
            <div className="grid md:grid-cols-2 gap-8 mb-12">
              <div>
                <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-2">From</p>
                <p className="font-semibold text-slate-800 text-lg">{config.from.name}</p>
                <p className="text-slate-600 whitespace-pre-line">{config.from.address}</p>
                <p className="text-slate-600">{config.from.email}</p>
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-2">Bill To</p>
                <p className="font-semibold text-slate-800 text-lg">{config.to.name}</p>
                <p className="text-slate-600 whitespace-pre-line">{config.to.address}</p>
                <p className="text-slate-600">{config.to.email}</p>
              </div>
            </div>

            {/* Items Table */}
            <div className="mb-8">
              <table className="w-full">
                <thead>
                  <tr className="border-b-2 border-slate-200">
                    <th className="text-left py-3 text-sm font-semibold text-slate-500 uppercase tracking-wider">Description</th>
                    <th className="text-right py-3 text-sm font-semibold text-slate-500 uppercase tracking-wider w-24">Qty</th>
                    <th className="text-right py-3 text-sm font-semibold text-slate-500 uppercase tracking-wider w-32">Price</th>
                    <th className="text-right py-3 text-sm font-semibold text-slate-500 uppercase tracking-wider w-32">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {config.items.map((item, index) => (
                    <tr key={index} className="border-b border-slate-100">
                      <td className="py-4 text-slate-800">{item.description}</td>
                      <td className="py-4 text-right text-slate-800">{item.quantity}</td>
                      <td className="py-4 text-right text-slate-800">{formatCurrency(item.price)}</td>
                      <td className="py-4 text-right font-semibold text-slate-800">
                        {formatCurrency(item.quantity * item.price)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Totals */}
            <div className="flex justify-end mb-12">
              <div className="w-64">
                <div className="flex justify-between py-2">
                  <span className="text-slate-600">Subtotal</span>
                  <span className="text-slate-800">{formatCurrency(subtotal)}</span>
                </div>
                <div className="flex justify-between py-3 border-t-2 border-slate-800">
                  <span className="text-lg font-bold text-slate-800">Total</span>
                  <span className="text-lg font-bold text-slate-800">{formatCurrency(total)}</span>
                </div>
              </div>
            </div>

            {/* Notes */}
            {config.notes && (
              <div className="border-t border-slate-200 pt-8">
                <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-2">Notes</p>
                <p className="text-slate-600 whitespace-pre-line">{config.notes}</p>
              </div>
            )}

            {/* Footer */}
            <div className="text-center mt-12 pt-8 border-t border-slate-200">
              <p className="text-sm text-slate-400">
                Generated with ParamHub • All data stored in URL
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-slate-400 hover:text-white mb-8 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to Home
        </Link>

        <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-8">
          <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
            📄 Create an Invoice
          </h1>
          <p className="text-slate-400 mb-8">
            Generate a clean, printable invoice from a URL. Perfect for freelancers.
          </p>

          <div className="space-y-8">
            {/* From / To */}
            <div className="grid md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-white">From (Your Details)</h3>
                <input
                  type="text"
                  value={config.from.name}
                  onChange={(e) => setConfig({ ...config, from: { ...config.from, name: e.target.value } })}
                  placeholder="Your Name / Company"
                  className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
                <textarea
                  value={config.from.address}
                  onChange={(e) => setConfig({ ...config, from: { ...config.from, address: e.target.value } })}
                  placeholder="Address"
                  rows={2}
                  className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none"
                />
                <input
                  type="email"
                  value={config.from.email}
                  onChange={(e) => setConfig({ ...config, from: { ...config.from, email: e.target.value } })}
                  placeholder="Email"
                  className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-white">Bill To (Client Details)</h3>
                <input
                  type="text"
                  value={config.to.name}
                  onChange={(e) => setConfig({ ...config, to: { ...config.to, name: e.target.value } })}
                  placeholder="Client Name / Company"
                  className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
                <textarea
                  value={config.to.address}
                  onChange={(e) => setConfig({ ...config, to: { ...config.to, address: e.target.value } })}
                  placeholder="Address"
                  rows={2}
                  className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none"
                />
                <input
                  type="email"
                  value={config.to.email}
                  onChange={(e) => setConfig({ ...config, to: { ...config.to, email: e.target.value } })}
                  placeholder="Email"
                  className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
            </div>

            {/* Invoice Details */}
            <div className="grid md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Invoice #</label>
                <input
                  type="text"
                  value={config.invoiceNumber}
                  onChange={(e) => setConfig({ ...config, invoiceNumber: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Date</label>
                <input
                  type="date"
                  value={config.date}
                  onChange={(e) => setConfig({ ...config, date: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Due Date</label>
                <input
                  type="date"
                  value={config.dueDate}
                  onChange={(e) => setConfig({ ...config, dueDate: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Currency</label>
                <select
                  value={config.currency}
                  onChange={(e) => setConfig({ ...config, currency: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                >
                  <option value="USD">USD ($)</option>
                  <option value="EUR">EUR (€)</option>
                  <option value="GBP">GBP (£)</option>
                  <option value="INR">INR (₹)</option>
                  <option value="JPY">JPY (¥)</option>
                  <option value="CAD">CAD ($)</option>
                  <option value="AUD">AUD ($)</option>
                </select>
              </div>
            </div>

            {/* Line Items */}
            <div>
              <h3 className="text-lg font-semibold text-white mb-4">Line Items</h3>
              <div className="space-y-3">
                {config.items.map((item, index) => (
                  <div key={index} className="flex gap-3 items-start">
                    <input
                      type="text"
                      value={item.description}
                      onChange={(e) => updateItem(index, 'description', e.target.value)}
                      placeholder="Description"
                      className="flex-1 px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500"
                    />
                    <input
                      type="number"
                      value={item.quantity}
                      onChange={(e) => updateItem(index, 'quantity', parseInt(e.target.value) || 0)}
                      placeholder="Qty"
                      min="1"
                      className="w-20 px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white text-center focus:outline-none focus:ring-2 focus:ring-teal-500"
                    />
                    <input
                      type="number"
                      value={item.price}
                      onChange={(e) => updateItem(index, 'price', parseFloat(e.target.value) || 0)}
                      placeholder="Price"
                      step="0.01"
                      className="w-32 px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                    />
                    <button
                      onClick={() => removeItem(index)}
                      className="p-3 text-slate-400 hover:text-red-400 transition-colors"
                      disabled={config.items.length === 1}
                    >
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                ))}
                <button
                  onClick={addItem}
                  className="w-full py-3 border-2 border-dashed border-slate-600 rounded-lg text-slate-400 hover:border-slate-500 hover:text-slate-300 transition-colors"
                >
                  + Add Line Item
                </button>
              </div>

              {/* Total */}
              <div className="mt-6 flex justify-end">
                <div className="text-right">
                  <p className="text-slate-400">Total</p>
                  <p className="text-3xl font-bold text-white">{formatCurrency(total)}</p>
                </div>
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Notes (Optional)</label>
              <textarea
                value={config.notes}
                onChange={(e) => setConfig({ ...config, notes: e.target.value })}
                placeholder="Payment terms, thank you message, etc."
                rows={3}
                className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none"
              />
            </div>

            <div className="pt-4 space-y-3">
              <button
                onClick={handleCopy}
                disabled={!config.from.name || !config.to.name || config.items.every((i) => !i.description)}
                className={`w-full py-4 rounded-lg font-semibold transition-all ${
                  config.from.name && config.to.name && config.items.some((i) => i.description)
                    ? 'bg-gradient-to-r from-teal-500 to-cyan-500 text-white hover:from-teal-600 hover:to-cyan-600'
                    : 'bg-slate-700 text-slate-400 cursor-not-allowed'
                }`}
              >
                {copied ? '✓ Copied to Clipboard!' : 'Copy Shareable Link'}
              </button>

              {config.from.name && config.to.name && config.items.some((i) => i.description) && (
                <a
                  href={generateUrl()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block w-full py-4 rounded-lg font-semibold text-center border border-slate-600 text-slate-300 hover:bg-slate-700/50 transition-all"
                >
                  Preview Invoice →
                </a>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function InvoicePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-teal-500 border-t-transparent"></div>
      </div>
    }>
      <InvoiceContent />
    </Suspense>
  );
}
