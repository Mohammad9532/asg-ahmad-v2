const express = require('express');
const mongoose = require('mongoose');
const { BookingSchema, DeliverySchema, ExpenseSchema } = require('../models/Transaction');
const { AuditSchema } = require('../models/Audit');
const { authenticateToken } = require('../middleware/auth');
const creators = require('../utils/routeCreators');

const router = express.Router();

const { SHOP_NAMES, DATA_TYPES_CONFIG } = require('../utils/constants');

SHOP_NAMES.forEach(shopPrefix => {
    const collectionPrefix = shopPrefix.toLowerCase();

    // 1. Create Models and Standard Routes
    DATA_TYPES_CONFIG.forEach(config => {
        const collectionName = `${collectionPrefix}${config.collectionSuffix}`;
        const modelName = shopPrefix.charAt(0).toUpperCase() + shopPrefix.slice(1) + config.path.charAt(0).toUpperCase() + config.path.slice(1) + 'Model';

        let currentSchema;
        if (config.path === 'bookings') currentSchema = BookingSchema;
        else if (config.path === 'delivery') currentSchema = DeliverySchema;
        else if (config.path === 'expense') currentSchema = ExpenseSchema;

        const Model = mongoose.model(modelName, currentSchema, collectionName);

        router.get(`/${shopPrefix}/${config.path}/summary`, authenticateToken, creators.createSummaryRoute(Model));
        router.post(`/${shopPrefix}/${config.path}/create`, authenticateToken, creators.createEntryRoute(Model, config.path));
        router.put(`/${shopPrefix}/${config.path}/update/:id`, authenticateToken, creators.updateEntryRoute(Model, config.path));

        if (config.path === 'expense') {
            router.get(`/${shopPrefix}/expense/employees`, authenticateToken, creators.createEmployeeListRoute(Model));
            router.get(`/${shopPrefix}/employee/summary`, authenticateToken, creators.createEmployeeSummaryRoute(Model));
            router.get(`/${shopPrefix}/employee/history`, authenticateToken, creators.createEmployeeHistoryRoute(Model));
        }
    });

    // 2. Monthly Summary Route
    const monthlyModelName = shopPrefix.charAt(0).toUpperCase() + shopPrefix.slice(1) + 'MonthlySummaryModel';
    const MonthlyModel = mongoose.model(monthlyModelName, BookingSchema, `${collectionPrefix}bookings`);
    router.get(`/${shopPrefix}/monthly_summary/summary`, authenticateToken, creators.createSummaryRoute(MonthlyModel));

    // 3. Specialist Routes
    const BookingsModel = mongoose.model(shopPrefix.charAt(0).toUpperCase() + shopPrefix.slice(1) + 'BookingsModel');
    const DeliveryModel = mongoose.model(shopPrefix.charAt(0).toUpperCase() + shopPrefix.slice(1) + 'DeliveryModel');
    const ExpenseModel = mongoose.model(shopPrefix.charAt(0).toUpperCase() + shopPrefix.slice(1) + 'ExpenseModel');

    const auditModelName = shopPrefix.charAt(0).toUpperCase() + shopPrefix.slice(1) + 'AuditModel';
    const AuditModel = mongoose.models[auditModelName] || mongoose.model(auditModelName, AuditSchema, `${collectionPrefix}audit`);

    router.get(`/${shopPrefix}/accrual_delivery/summary`, authenticateToken, creators.createAccrualSummaryRoute(BookingsModel, DeliveryModel));
    router.get(`/${shopPrefix}/stock_audit`, authenticateToken, creators.createStockAuditRoute(BookingsModel, DeliveryModel, AuditModel));
    router.post(`/${shopPrefix}/stock_audit/verify`, authenticateToken, creators.createAuditVerifyRoute(AuditModel));
    router.post(`/${shopPrefix}/stock_audit/archive`, authenticateToken, creators.createAuditArchiveRoute(AuditModel));
    router.get(`/${shopPrefix}/bill_details`, authenticateToken, creators.createBillDetailsRoute(BookingsModel, DeliveryModel));
    router.get(`/${shopPrefix}/lifetime/summary`, authenticateToken, creators.createLifetimeSummaryRoute(BookingsModel, DeliveryModel));
    router.get(`/${shopPrefix}/compare_bookings`, authenticateToken, creators.createCompareBookingsRoute(BookingsModel));
    router.get(`/${shopPrefix}/daily_ledger`, authenticateToken, creators.createDailyLedgerRoute(BookingsModel, DeliveryModel, ExpenseModel));
    router.get(`/${shopPrefix}/ledger/history`, authenticateToken, creators.createLedgerHistoryRoute(BookingsModel, DeliveryModel, ExpenseModel));
    router.get(`/${shopPrefix}/excess_delivery`, authenticateToken, creators.createExcessDeliveryRoute(BookingsModel, DeliveryModel));
});

module.exports = router;
