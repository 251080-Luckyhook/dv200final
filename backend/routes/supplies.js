const express = require('express');

const mongoStore = require('../mongoStore');
const wrap = require('../lib/wrap');
const { mapCareRequest } = require('../lib/mappers');
const { requireAuth, requireStaff } = require('../middleware/auth');

const router = express.Router();

router.use(requireAuth, requireStaff);

const CATEGORY_LABELS = {
  nappies: 'Nappies',
  wet_wipes: 'Wet wipes',
  toys: 'Toys',
  formula: 'Formula',
};

function buildTitle(category, details) {
  const label = CATEGORY_LABELS[category];

  if (category === 'nappies' && details.size) {
    return `${label} size ${details.size}`;
  }

  if (category === 'formula' && details.stage) {
    return `${label} stage ${details.stage}`;
  }

  if (category === 'toys') {
    return [label, details.age, details.type].filter(Boolean).join(' - ');
  }

  if (category === 'wet_wipes' && details.type) {
    return `${label} - ${details.type}`;
  }

  return label;
}

router.get(
  '/requests',
  wrap(async (req, res) => {
    const result = await mongoStore.getCollection('careRequests')
      .aggregate([
        { $addFields: { fulfilledOrder: { $eq: ['$status', 'fulfilled'] } } },
        { $sort: { fulfilledOrder: 1, createdAt: -1 } },
        { $limit: 100 },
        { $project: { fulfilledOrder: 0 } },
      ])
      .toArray();

    return res.json({ requests: result.map(mapCareRequest) });
  })
);

router.post(
  '/requests',
  wrap(async (req, res) => {
    const { category, quantity, unit, urgency } = req.body;
    const details = req.body.details && typeof req.body.details === 'object' ? req.body.details : {};

    if (!CATEGORY_LABELS[category]) {
      return res.status(400).json({ error: 'Choose a category first.' });
    }

    if (!Number.isInteger(quantity) || quantity < 1 || quantity > 999) {
      return res.status(400).json({ error: 'Quantity must be a whole number of 1 or more.' });
    }

    if (!['today', 'this_week', 'stock_up'].includes(urgency)) {
      return res.status(400).json({ error: 'Choose how urgent the request is.' });
    }

    const request = {
      category,
      title: buildTitle(category, details),
      details,
      quantity,
      unit: unit || null,
      urgency,
      status: 'open',
      createdBy: req.user.id,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    const result = await mongoStore.getCollection('careRequests').insertOne(request);

    return res.status(201).json({ request: mapCareRequest({ ...request, _id: result.insertedId }) });
  })
);

router.patch(
  '/requests/:id',
  wrap(async (req, res) => {
    const { status } = req.body;

    if (!['open', 'in_progress', 'fulfilled'].includes(status)) {
      return res.status(400).json({ error: 'That status is not recognised.' });
    }

    const _id = mongoStore.toObjectId(req.params.id);
    const result = _id
      ? await mongoStore.getCollection('careRequests').findOneAndUpdate(
          { _id },
          { $set: { status, updatedAt: new Date() } },
          { returnDocument: 'after' }
        )
      : null;

    if (!result) {
      return res.status(404).json({ error: 'We could not find that request.' });
    }

    return res.json({ request: mapCareRequest(result) });
  })
);

module.exports = router;
