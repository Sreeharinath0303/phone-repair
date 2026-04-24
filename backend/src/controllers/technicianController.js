const Technician = require('../models/Technician');

exports.getAllTechnicians = async (req, res) => {
  try {
    const technicians = await Technician.find({ isActive: true }).sort({ name: 1 });
    res.json({ success: true, data: technicians });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.createTechnician = async (req, res) => {
  try {
    const tech = await Technician.create(req.body);
    res.status(201).json({ success: true, data: tech, message: 'Technician added successfully' });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

exports.updateTechnician = async (req, res) => {
  try {
    const tech = await Technician.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!tech) return res.status(404).json({ success: false, message: 'Technician not found' });
    res.json({ success: true, data: tech });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

exports.deleteTechnician = async (req, res) => {
  try {
    await Technician.findByIdAndUpdate(req.params.id, { isActive: false });
    res.json({ success: true, message: 'Technician removed' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
