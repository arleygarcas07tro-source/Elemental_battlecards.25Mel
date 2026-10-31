'use strict';

const express = require('express');

function buildShopRouter(shopController, authMiddleware) {
  const router = express.Router();
  router.use(authMiddleware);
  router.get('/', shopController.getState.bind(shopController));
  router.post('/purchase', shopController.purchase.bind(shopController));
  router.post('/equip', shopController.equipBackground.bind(shopController));
  router.post('/consume-power', shopController.consumePower.bind(shopController));
  return router;
}

module.exports = buildShopRouter;
