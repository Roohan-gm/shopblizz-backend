import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,      // smtp.hostinger.com
  port: parseInt(process.env.EMAIL_PORT, 10), // 465
  secure: true,                      // true for port 465, false for 587
  auth: {
    user: process.env.EMAIL_USER,    // e.g., hello@roohan.me
    pass: process.env.EMAIL_PASS,    // your email account password
  },
});

export const sendOrderConfirmationEmail = async (order) => {
  const mailOptions = {
    from: `"ShopBlizz" <${process.env.EMAIL_USER}>`,
    to: order.email, // customer's email
    subject: `Order Confirmation #${order.orderNo}`,
    html: `
      <h2>Thank you for your order!</h2>
      <p><strong>Order Number:</strong> ${order.orderNo}</p>
      <p><strong>Customer:</strong> ${order.fullName}</p>
      <p><strong>Total Items:</strong> ${order.orderItems.length}</p>
      <p><strong>Shipping Method:</strong> ${order.shippingMethod}</p>
      
      <h3>Items:</h3>
      <ul>
        ${order.orderItems
          .map(
            (item) => `
          <li>
            ${item.product?.productName || 'Unknown Product'} × ${item.quantity} 
            ${item.unitPrice ? `— PKR ${(item.unitPrice * item.quantity).toFixed(2)}` : ''}
          </li>`
          )
          .join('')}
      </ul>

      Total amount: <strong>PKR ${order.totalAmount.toFixed(2)}</strong>
      <p>We’ll notify you when your order ships.</p>
      <p>— The ShopBlizz Team</p>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Order confirmation email sent to ${order.email}`);
  } catch (error) {
    console.error('Email sending failed:', error.message);
    // Don’t throw — email failure shouldn’t break order creation
  }
};

export const sendNewOrderNotificationToManager = async (order) => {
  console.log('order in email.js:', order);
  const items = Array.isArray(order.orderItems) ? order.orderItems : [];
  const itemsTotal = items.reduce((sum, item) => {
    const price = Number(item?.unitPrice) || 0;
    const qty = Number(item?.quantity) || 0;
    return sum + price * qty;
  }, 0);

  const SHIPPING_FEES = { standard: 100, fast: 200 };

  const parseShippingCost = (method) => {
    if (method == null) return 0;
    if (typeof method === 'number') return Number(method);
    if (typeof method === 'string') {
      const parenMatch = method.match(/\((\d+(?:\.\d+)?)\)/); // "Standard (100)"
      if (parenMatch) return parseFloat(parenMatch[1]);
      const numMatch = method.match(/(\d+(?:\.\d+)?)/); // any number in the string
      if (numMatch) return parseFloat(numMatch[1]);
      const lower = method.toLowerCase();
      if (lower.includes('fast')) return SHIPPING_FEES.fast;
      if (lower.includes('standard')) return SHIPPING_FEES.standard;
      return 0;
    }
    if (typeof method === 'object') {
      return parseShippingCost(method.cost ?? method.amount ?? method.price ?? method.name);
    }
    return 0;
  };

  const shippingCost = parseShippingCost(order.shippingMethod);
  const totalAmount = itemsTotal + shippingCost;

  const formatPKR = (value) => `PKR ${Number(value || 0).toFixed(2)}`;

  const mailOptions = {
    from: `"ShopBlizz" <${process.env.EMAIL_USER}>`,
    to: process.env.EMAIL_MANAGER, // manager's email
    subject: `New Order Received #${order.orderNo}`,
    html: `
      <h2>New Order Received</h2>
      <p><strong>Order Number:</strong> ${order.orderNo}</p>
      <p><strong>Customer:</strong> ${order.fullName || '—'}</p>
      <p><strong>Email:</strong> ${order.email || '—'}</p>
      <p><strong>Phone:</strong> ${order.phone || '—'}</p>
      <p><strong>Address:</strong> ${order.address || '—'}</p>
      <p><strong>Shipping Method:</strong> ${order.shippingMethod || '—'}</p>
      
      <h3>Items (${items.length}):</h3>
      <ul>
        ${items
          .map(
            (item) => `
          <li>
            ${item.product?.productName || 'Unknown Product'} × ${Number(item.quantity) || 0}
            ${item.unitPrice ? `— ${formatPKR((Number(item.unitPrice) || 0) * (Number(item.quantity) || 0))} (${formatPKR(Number(item.unitPrice) || 0)} each)` : ''}
          </li>`
          )
          .join('')}
      </ul>

      <p><strong>Items Total:</strong> ${formatPKR(itemsTotal)}</p>
      <p><strong>Shipping Cost:</strong> ${formatPKR(shippingCost)}</p>

      <h3>Total Amount: ${formatPKR(totalAmount)}</h3>
      <p>Please process this order promptly.</p>
      <p>— The ShopBlizz System</p>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`New order notification email sent to manager for order #${order.orderNo}`);
  } catch (error) {
    console.error('Manager email sending failed:', error.message);
    // Don’t throw — email failure shouldn’t break order creation
  }
};