import React, { useState } from 'react';
import {
  Boxes,
  ShoppingCart,
  Plus,
  Minus,
  CheckCircle2,
  AlertTriangle,
  Printer,
  Trash2,
  FileSpreadsheet,
} from 'lucide-react';
import { InventoryItem, POSTransaction } from '../types/erp';

interface InventoryPOSViewProps {
  inventory: InventoryItem[];
  onAddStock: (item: Omit<InventoryItem, 'id'>) => void;
  onRecordPOSSale: (txn: Omit<POSTransaction, 'id'>) => void;
  onExportToSheet?: (title: string, headers: string[], rows: (string | number)[][]) => void;
}

export const InventoryPOSView: React.FC<InventoryPOSViewProps> = ({
  inventory,
  onAddStock,
  onRecordPOSSale,
  onExportToSheet,
}) => {
  const [tab, setTab] = useState<'inventory' | 'pos'>('inventory');

  const handleExportStock = () => {
    if (!onExportToSheet) return;
    const headers = ['SKU Code', 'Item Name', 'Category', 'Quantity In Stock', 'Unit Price ($)', 'Min Alert Threshold', 'Status'];
    const rows = inventory.map((i) => [
      i.sku,
      i.name,
      i.category,
      i.quantity,
      i.unitPrice,
      i.minStockAlert,
      i.quantity <= i.minStockAlert ? 'Low Stock Alert' : 'In Stock',
    ]);
    onExportToSheet('Inventory & Store Valuation', headers, rows);
  };

  // POS Cart State
  const [cart, setCart] = useState<Array<{ item: InventoryItem; qty: number }>>([]);
  const [customerName, setCustomerName] = useState('Alexander Liam Wright (Grade 10)');
  const [customerType, setCustomerType] = useState<'Student' | 'Staff' | 'Guest'>('Student');
  const [paymentMode, setPaymentMode] = useState<'Cash' | 'Card' | 'Account Balance'>('Card');
  const [saleCompleted, setSaleCompleted] = useState<POSTransaction | null>(null);

  const addToCart = (item: InventoryItem) => {
    setCart((prev) => {
      const existing = prev.find((c) => c.item.id === item.id);
      if (existing) {
        return prev.map((c) => (c.item.id === item.id ? { ...c, qty: c.qty + 1 } : c));
      }
      return [...prev, { item, qty: 1 }];
    });
  };

  const removeFromCart = (itemId: string) => {
    setCart((prev) => prev.filter((c) => c.item.id !== itemId));
  };

  const updateCartQty = (itemId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((c) => (c.item.id === itemId ? { ...c, qty: Math.max(1, c.qty + delta) } : c))
        .filter((c) => c.qty > 0)
    );
  };

  const cartTotal = cart.reduce((acc, c) => acc + c.item.unitPrice * c.qty, 0);

  const handleCheckout = () => {
    if (cart.length === 0) return;

    const orderNo = `POS-2026-${Math.floor(10000 + Math.random() * 90000)}`;
    const newTxn: Omit<POSTransaction, 'id'> = {
      orderNo,
      customerType,
      customerName,
      items: cart.map((c) => ({
        itemName: c.item.name,
        quantity: c.qty,
        unitPrice: c.item.unitPrice,
        total: c.item.unitPrice * c.qty,
      })),
      totalAmount: cartTotal,
      paymentMethod: paymentMode,
      date: new Date().toISOString().split('T')[0],
      cashier: 'Campus Store Operator',
    };

    onRecordPOSSale(newTxn);
    setSaleCompleted({ ...newTxn, id: `pos-${Date.now()}` });
    setCart([]);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Boxes className="w-5 h-5 text-indigo-500" />
            School Store Inventory &amp; POS Register
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Uniform stock valuation, textbook fulfillment, low-stock threshold triggers, and fast thermal POS checkout.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {tab === 'inventory' && onExportToSheet && (
            <button
              onClick={handleExportStock}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-emerald-300 dark:border-emerald-700/60 bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 text-xs font-bold transition-all shadow-xs"
              title="Export current inventory list directly into Google Sheets"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>Export Stock</span>
            </button>
          )}

          <div className="flex bg-slate-100 dark:bg-slate-800 p-0.5 rounded-xl border border-slate-200 dark:border-slate-700">
            <button
              onClick={() => setTab('inventory')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                tab === 'inventory'
                  ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-300 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              Inventory Stock ({inventory.length})
            </button>
            <button
              onClick={() => setTab('pos')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                tab === 'pos'
                  ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-300 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              POS Register &amp; Terminal
            </button>
          </div>
        </div>
      </div>

      {tab === 'inventory' ? (
        <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">SKU Code</th>
                  <th className="py-3 px-4">Item Name</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">In Stock</th>
                  <th className="py-3 px-4">Unit Price</th>
                  <th className="py-3 px-4">Min Alert</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                {inventory.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40">
                    <td className="py-3 px-4 font-mono font-bold text-indigo-600 dark:text-indigo-400">
                      {item.sku}
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-900 dark:text-white">
                      {item.name}
                    </td>
                    <td className="py-3 px-4 text-slate-600 dark:text-slate-400">{item.category}</td>
                    <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">
                      {item.quantity} {item.unit}
                    </td>
                    <td className="py-3 px-4 font-mono">${item.unitPrice}</td>
                    <td className="py-3 px-4 font-mono text-slate-400">{item.minStockAlert}</td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          item.quantity <= item.minStockAlert
                            ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300'
                            : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                        }`}
                      >
                        {item.quantity <= item.minStockAlert ? 'Low Stock' : 'In Stock'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => {
                          addToCart(item);
                          setTab('pos');
                        }}
                        className="px-2.5 py-1 text-xs font-semibold bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-300 hover:bg-indigo-100 rounded-lg transition-colors"
                      >
                        + Add to POS
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* POS Items Selection */}
          <div className="lg:col-span-2 space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {inventory.map((item) => (
                <div
                  key={item.id}
                  onClick={() => addToCart(item)}
                  className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-indigo-500 cursor-pointer shadow-xs transition-all space-y-2"
                >
                  <div className="text-[10px] uppercase font-bold text-slate-400">{item.category}</div>
                  <div className="font-semibold text-xs text-slate-900 dark:text-white line-clamp-2">
                    {item.name}
                  </div>
                  <div className="flex items-center justify-between pt-1">
                    <span className="font-bold text-sm text-indigo-600 dark:text-indigo-400 font-mono">
                      ${item.unitPrice}
                    </span>
                    <span className="text-[10px] text-slate-400">{item.quantity} in store</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* POS Register Cart */}
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <ShoppingCart className="w-4 h-4 text-indigo-500" />
                POS Checkout Cart
              </h2>
              <span className="text-xs font-mono font-bold text-slate-500">{cart.length} items</span>
            </div>

            <div className="space-y-2 text-xs">
              <label className="font-semibold text-slate-700 dark:text-slate-300">Customer Name</label>
              <input
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="w-full px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none text-slate-900 dark:text-white"
              />
            </div>

            {/* Cart Items List */}
            <div className="max-h-60 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800 text-xs">
              {cart.length === 0 ? (
                <div className="py-8 text-center text-slate-400">Cart is empty. Tap an item to add.</div>
              ) : (
                cart.map((c) => (
                  <div key={c.item.id} className="py-2.5 flex items-center justify-between gap-2">
                    <div className="flex-1 truncate">
                      <div className="font-medium text-slate-800 dark:text-slate-200 truncate">
                        {c.item.name}
                      </div>
                      <div className="text-[10px] text-slate-400">${c.item.unitPrice} each</div>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        onClick={() => updateCartQty(c.item.id, -1)}
                        className="w-6 h-6 rounded bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-bold"
                      >
                        -
                      </button>
                      <span className="font-mono font-bold px-1">{c.qty}</span>
                      <button
                        onClick={() => updateCartQty(c.item.id, 1)}
                        className="w-6 h-6 rounded bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-bold"
                      >
                        +
                      </button>
                      <button
                        onClick={() => removeFromCart(c.item.id)}
                        className="p-1 text-slate-400 hover:text-rose-500"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Total and Checkout */}
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500">Order Total</span>
                <span className="text-xl font-black text-slate-900 dark:text-white font-mono">
                  ${cartTotal.toLocaleString()}
                </span>
              </div>

              <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-xs">
                {(['Card', 'Cash', 'Account Balance'] as const).map((mode) => (
                  <button
                    key={mode}
                    onClick={() => setPaymentMode(mode)}
                    className={`flex-1 py-1 rounded-lg font-semibold transition-all ${
                      paymentMode === mode
                        ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-300 shadow-xs'
                        : 'text-slate-500'
                    }`}
                  >
                    {mode}
                  </button>
                ))}
              </div>

              <button
                onClick={handleCheckout}
                disabled={cart.length === 0}
                className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-600/20 disabled:opacity-50 transition-all flex items-center justify-center gap-1.5"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Complete Sale &amp; Print Thermal Slip</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
