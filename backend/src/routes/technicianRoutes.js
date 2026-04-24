const router = require('express').Router();
const { getAllTechnicians, createTechnician, updateTechnician, deleteTechnician } = require('../controllers/technicianController');
const { protect } = require('../middleware/auth');

router.get('/',         protect, getAllTechnicians);
router.post('/',        protect, createTechnician);
router.put('/:id',      protect, updateTechnician);
router.delete('/:id',   protect, deleteTechnician);

module.exports = router;
