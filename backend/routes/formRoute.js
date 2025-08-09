const express = require('express');
const router = express.Router();
const {
  createForm, getAllForms, getFormById,
  updateForm, deleteForm, getFormStats
} = require('../controllers/formController');

router.post('/', createForm);
router.get('/', getAllForms);
router.get('/:id', getFormById);
router.put('/:id', updateForm);
router.delete('/:id', deleteForm);
router.get('/:id/stats', getFormStats);

module.exports = router;
