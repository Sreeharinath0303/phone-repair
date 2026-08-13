const Order = require('../models/Order');
const Booking = require('../models/Booking');

const mapOrderForAdmin = (order) => {
  const paymentAmount = Number(order.finalAmount || order.quotationAmount || order.approxAmount || 0);
  return {
    _id: order._id,
    bookingId: typeof order.bookingId === 'object' && order.bookingId?._id ? order.bookingId._id : order.bookingId,
    orderNumber: order.orderNumber,
    referenceNumber: order.referenceNumber,
    status: order.status,
    deviceInfo: {
      brand: order.deviceBrand,
      model: order.deviceModel,
      category: order.deviceCategory
    },
    repairDetails: (order.repairTypes || []).map((service) => ({ service })),
    payment: {
      amount: paymentAmount,
      status: order.paymentStatus || 'Pending'
    },
    customerName: order.customerName,
    customerPhone: order.customerPhone,
    customerEmail: order.customerEmail,
    city: order.city,
    createdAt: order.createdAt,
    issueDescription: order.issueDescription || '',
    assignedTechnician: order.assignedTechnician || null,
    quotationAmount: order.quotationAmount || 0,
    finalAmount: order.finalAmount || 0
  };
};

exports.getAllOrders = async (req, res) => {
  try {
    const orders = await Order.find()
      .populate('assignedTechnician', 'name specialization phone email businessName')
      .sort({ createdAt: -1 })
      .lean();

    res.json({ success: true, data: orders.map(mapOrderForAdmin), total: orders.length });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.deleteOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    await Booking.findByIdAndDelete(order.bookingId);
    await Order.findByIdAndDelete(order._id);

    res.json({ success: true, message: 'Order deleted successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
