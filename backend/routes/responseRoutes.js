const express = require('express');
const router = express.Router();
const {
  submitResponse, getFormResponses,getFormAnalytics,getResponseById
} = require('../controllers/responseController');

router.post('/:id/responses', submitResponse);
router.get('/:id/responses', getFormResponses);
router.get('/:id/analytics', getFormAnalytics);
router.get('/responses/:responseId', getResponseById);
module.exports = router;
